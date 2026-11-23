import { afterEach, describe, expect, it, vi } from 'vitest';
import { FakeNativeModelContext } from './fake-native';
import { installWebMcp, isPolyfillForced, NativeWrappedModelContext, PolyfillModelContext, validateInput } from './polyfill';
import type { ModelContextTool, ToolEvent } from './types';

function echoTool(name = 'echo', overrides: Partial<ModelContextTool> = {}): ModelContextTool {
  return {
    name,
    description: 'Echoes its input.',
    inputSchema: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'] },
    async execute(input) {
      return { echoed: input.value };
    },
    ...overrides,
  };
}

describe('PolyfillModelContext', () => {
  it('registers a tool and lists it with default annotations', async () => {
    const mc = new PolyfillModelContext();
    await mc.registerTool(echoTool('echo', { annotations: { readOnlyHint: true } }));
    const tools = await mc.getTools();
    expect(tools).toHaveLength(1);
    expect(tools[0]).toMatchObject({
      name: 'echo',
      annotations: { readOnlyHint: true, untrustedContentHint: false, consequentialHint: false, debugging: false },
      origin: location.origin,
    });
  });

  it('rejects a duplicate name', async () => {
    const mc = new PolyfillModelContext();
    await mc.registerTool(echoTool());
    await expect(mc.registerTool(echoTool())).rejects.toThrow(/already registered/);
  });

  it('rejects invalid tools', async () => {
    const mc = new PolyfillModelContext();
    await expect(mc.registerTool(echoTool('bad name!'))).rejects.toThrow(TypeError);
    await expect(mc.registerTool(echoTool('x', { description: '' }))).rejects.toThrow(/description/);
  });

  it('unregisters when the signal aborts and allows re-registering (StrictMode)', async () => {
    const mc = new PolyfillModelContext();
    const onChange = vi.fn();
    mc.addEventListener('toolchange', onChange);

    const first = new AbortController();
    await mc.registerTool(echoTool(), { signal: first.signal });
    first.abort();
    expect(await mc.getTools()).toHaveLength(0);

    const second = new AbortController();
    await mc.registerTool(echoTool(), { signal: second.signal });
    expect(await mc.getTools()).toHaveLength(1);
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('rejects registration with an already-aborted signal', async () => {
    const mc = new PolyfillModelContext();
    await expect(mc.registerTool(echoTool(), { signal: AbortSignal.abort() })).rejects.toThrow(/aborted/);
  });

  it('executeTool returns a string and fires toolactivated', async () => {
    const mc = new PolyfillModelContext();
    await mc.registerTool(echoTool());
    const activated: string[] = [];
    mc.addEventListener('toolactivated', (event) => activated.push((event as ToolEvent).toolName));

    const [tool] = await mc.getTools();
    const output = await mc.executeTool(tool, { value: 'hola' });

    expect(output).toBe('{"echoed":"hola"}');
    expect(activated).toEqual(['echo']);
  });

  it('executeTool accepts a tool name and passes strings through', async () => {
    const mc = new PolyfillModelContext();
    await mc.registerTool(echoTool('plain', { async execute() { return 'texto'; } }));
    expect(await mc.executeTool('plain', { value: 'x' })).toBe('texto');
  });

  it('executeTool validates input against inputSchema', async () => {
    const mc = new PolyfillModelContext();
    await mc.registerTool(echoTool());
    await expect(mc.executeTool('echo', {})).rejects.toThrow(/Missing required property "value"/);
    await expect(mc.executeTool('echo', { value: 3 })).rejects.toThrow(/type string/);
  });

  it('executeTool rejects unknown tools', async () => {
    const mc = new PolyfillModelContext();
    await expect(mc.executeTool('nope')).rejects.toThrow(/No tool named/);
  });

  it('aborting execution fires toolcancel and rejects', async () => {
    const mc = new PolyfillModelContext();
    await mc.registerTool(
      echoTool('slow', {
        inputSchema: undefined,
        execute: (_input, { signal }) =>
          new Promise((resolve) => {
            const timer = setTimeout(() => resolve('late'), 1000);
            signal.addEventListener('abort', () => clearTimeout(timer));
          }),
      }),
    );
    const cancelled: string[] = [];
    mc.addEventListener('toolcancel', (event) => cancelled.push((event as ToolEvent).toolName));

    const controller = new AbortController();
    const pending = mc.executeTool('slow', {}, { signal: controller.signal });
    controller.abort();

    await expect(pending).rejects.toThrow(/aborted/);
    expect(cancelled).toEqual(['slow']);
  });

  it('getTools filters by origin', async () => {
    const mc = new PolyfillModelContext();
    await mc.registerTool(echoTool());
    expect(await mc.getTools({ fromOrigins: ['https://otro.example'] })).toEqual([]);
    expect(await mc.getTools({ fromOrigins: [location.origin] })).toHaveLength(1);
  });
});

describe('validateInput', () => {
  it('checks enums', () => {
    const schema = { type: 'object', properties: { size: { type: 'string', enum: ['S', 'M'] } } };
    expect(validateInput(schema, { size: 'M' })).toBeNull();
    expect(validateInput(schema, { size: 'XXXL' })).toMatch(/one of/);
  });
});

describe('installWebMcp', () => {
  afterEach(() => {
    delete (document as { modelContext?: unknown }).modelContext;
    delete (navigator as { modelContext?: unknown }).modelContext;
  });

  it('installs the polyfill when there is no native support', () => {
    const { mode, modelContext } = installWebMcp();
    expect(mode).toBe('polyfill');
    expect(document.modelContext).toBe(modelContext);
  });

  it('uses a complete native implementation through a thin annotations adapter', async () => {
    const native = new PolyfillModelContext();
    Object.defineProperty(document, 'modelContext', { value: native, configurable: true });
    const { mode, modelContext } = installWebMcp({ forcePolyfill: false });
    expect(mode).toBe('native');
    expect(document.modelContext).toBe(modelContext);

    await modelContext.registerTool(echoTool());
    expect(await native.getTools()).toHaveLength(1);
    expect(await modelContext.executeTool('echo', { value: 'a' })).toBe('{"echoed":"a"}');
  });

  it('wraps an older native implementation without getTools/executeTool', async () => {
    const registerTool = vi.fn();
    const unregisterTool = vi.fn();
    const legacy = Object.assign(new EventTarget(), { registerTool, unregisterTool });
    Object.defineProperty(navigator, 'modelContext', { value: legacy, configurable: true });

    const { mode, modelContext } = installWebMcp();
    expect(mode).toBe('native-wrapped');
    expect(modelContext).toBeInstanceOf(NativeWrappedModelContext);

    const controller = new AbortController();
    await modelContext.registerTool(echoTool(), { signal: controller.signal });
    expect(registerTool).toHaveBeenCalledOnce();
    expect(await modelContext.executeTool('echo', { value: 'a' })).toBe('{"echoed":"a"}');

    controller.abort();
    expect(unregisterTool).toHaveBeenCalledWith('echo');
    expect(await modelContext.getTools()).toHaveLength(0);
  });
});

describe('native WebMCP whose getTools() drops annotations (Chrome)', () => {
  afterEach(() => {
    delete (document as { modelContext?: unknown }).modelContext;
  });

  function installFakeNative() {
    const native = new FakeNativeModelContext();
    Object.defineProperty(document, 'modelContext', { value: native, configurable: true });
    const installed = installWebMcp({ forcePolyfill: false });
    return { native, ...installed };
  }

  it('the fake mirrors Chrome: no annotations in getTools()', async () => {
    const native = new FakeNativeModelContext();
    await native.registerTool(echoTool('buy', { annotations: { consequentialHint: true } }));
    const [tool] = await native.getTools();
    expect(Object.keys(tool).sort()).toEqual(['description', 'inputSchema', 'name', 'origin', 'title', 'window']);
  });

  it('records annotations at registration and merges them back into getTools()', async () => {
    const { mode, modelContext } = installFakeNative();
    expect(mode).toBe('native');

    await document.modelContext!.registerTool(echoTool('buy', { annotations: { consequentialHint: true } }));
    await document.modelContext!.registerTool(echoTool('plain'));

    const tools = await modelContext.getTools();
    expect(tools.find((t) => t.name === 'buy')).toMatchObject({ origin: location.origin, annotations: { consequentialHint: true } });
    expect(tools.find((t) => t.name === 'plain')?.annotations ?? {}).not.toHaveProperty('consequentialHint', true);
  });

  it('executes merged tools on the native context', async () => {
    const { native, modelContext } = installFakeNative();
    await modelContext.registerTool(echoTool('echo', { annotations: { readOnlyHint: true } }));
    const [tool] = await modelContext.getTools();
    expect(await modelContext.executeTool(tool, { value: 'x' })).toBe('{"echoed":"x"}');
    expect(native.executed).toEqual(['echo']);
  });

  it('forgets the recorded annotations when the registration signal aborts', async () => {
    const { native, modelContext } = installFakeNative();
    const first = new AbortController();
    await modelContext.registerTool(echoTool('buy', { annotations: { consequentialHint: true } }), { signal: first.signal });
    first.abort();
    expect(await modelContext.getTools()).toEqual([]);

    // Same name, no annotations this time: nothing stale may leak back in.
    await native.registerTool(echoTool('buy'));
    const [tool] = await modelContext.getTools();
    expect(tool.annotations).toBeUndefined();
  });

  it('keeps the live registration annotations when a duplicate registration is rejected', async () => {
    const { modelContext } = installFakeNative();
    await modelContext.registerTool(echoTool('buy', { annotations: { consequentialHint: true } }));
    await expect(modelContext.registerTool(echoTool('buy', { annotations: { readOnlyHint: true } }))).rejects.toThrow(/Duplicate/);
    const [tool] = await modelContext.getTools();
    expect(tool.annotations).toMatchObject({ consequentialHint: true });
    expect(tool.annotations?.readOnlyHint).not.toBe(true);
  });

  it('forwards toolchange events from the native context', async () => {
    const { modelContext } = installFakeNative();
    const onChange = vi.fn();
    modelContext.addEventListener('toolchange', onChange);
    await modelContext.registerTool(echoTool());
    expect(onChange).toHaveBeenCalledOnce();
    modelContext.removeEventListener('toolchange', onChange);
  });
});

describe('forced polyfill switch (?webmcp=polyfill)', () => {
  afterEach(() => {
    delete (document as { modelContext?: unknown }).modelContext;
  });

  it('reads the query param', () => {
    expect(isPolyfillForced('?webmcp=polyfill')).toBe(true);
    expect(isPolyfillForced('?foo=1&webmcp=polyfill')).toBe(true);
    expect(isPolyfillForced('?webmcp=native')).toBe(false);
    expect(isPolyfillForced('')).toBe(false);
  });

  it('installs the polyfill over a native implementation when forced', async () => {
    const native = new FakeNativeModelContext();
    Object.defineProperty(document, 'modelContext', { value: native, configurable: true });

    const { mode, modelContext } = installWebMcp({ forcePolyfill: true });

    expect(mode).toBe('polyfill-forced');
    expect(modelContext).toBeInstanceOf(PolyfillModelContext);
    expect(document.modelContext).toBe(modelContext);
    await modelContext.registerTool(echoTool());
    expect(await native.getTools()).toEqual([]);
  });

  it('defaults to the current URL', () => {
    window.history.replaceState(null, '', '/?webmcp=polyfill');
    try {
      Object.defineProperty(document, 'modelContext', { value: new FakeNativeModelContext(), configurable: true });
      expect(installWebMcp().mode).toBe('polyfill-forced');
    } finally {
      window.history.replaceState(null, '', '/');
    }
  });
});

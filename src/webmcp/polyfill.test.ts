import { afterEach, describe, expect, it, vi } from 'vitest';
import { installWebMcp, NativeWrappedModelContext, PolyfillModelContext, validateInput } from './polyfill';
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

  it('uses a complete native implementation as-is', () => {
    const native = new PolyfillModelContext();
    Object.defineProperty(document, 'modelContext', { value: native, configurable: true });
    const { mode, modelContext } = installWebMcp();
    expect(mode).toBe('native');
    expect(modelContext).toBe(native);
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

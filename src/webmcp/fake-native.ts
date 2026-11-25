import type { JsonSchema, ModelContextTool, RegisteredTool, RegisterToolOptions } from './types';

const NOT_A_TOOL = "Failed to execute 'executeTool' on 'ModelContext': parameter 1 is not of type 'Tool'.";

interface PlatformToolData {
  name: string;
  title: string;
  description: string;
  inputSchema: JsonSchema;
  origin: string;
  window: Window;
}

/**
 * Stand-in for Chrome's WebIDL `Tool` interface. Its fields are getters on the prototype backed by
 * private state, so the instance has NO own enumerable properties: `{ ...tool }` yields `{}` and
 * `Object.keys(tool)` is empty, exactly like the real platform object.
 */
export class FakePlatformTool implements RegisteredTool {
  readonly #data: PlatformToolData;

  constructor(data: PlatformToolData) {
    this.#data = data;
  }

  get name(): string {
    return this.#data.name;
  }

  get title(): string {
    return this.#data.title;
  }

  get description(): string {
    return this.#data.description;
  }

  get inputSchema(): JsonSchema {
    return this.#data.inputSchema;
  }

  get origin(): string {
    return this.#data.origin;
  }

  get window(): Window {
    return this.#data.window;
  }
}

/**
 * Test double for Chrome's native document.modelContext (checked against Chrome with the WebMCP flag).
 * Mirrors the real quirks that the adapters must hide:
 *  - getTools() returns platform `Tool` objects (see FakePlatformTool): name, title, description,
 *    inputSchema, origin and window are prototype getters, not own properties, and the annotations
 *    passed to registerTool() are dropped.
 *  - executeTool() only accepts a `Tool` instance that getTools() handed out (checked by identity).
 *    A plain copy with the same shape, or a tool name string, is rejected with Chrome's TypeError.
 */
export class FakeNativeModelContext extends EventTarget {
  readonly #tools = new Map<string, ModelContextTool>();
  /** Every Tool handed out by getTools(), mapped to the registration it was created from. */
  readonly #handedOut = new WeakMap<FakePlatformTool, ModelContextTool>();
  readonly executed: string[] = [];

  registerTool(tool: ModelContextTool, { signal }: RegisterToolOptions = {}): Promise<void> {
    if (signal?.aborted) return Promise.reject(new DOMException('Registration aborted.', 'AbortError'));
    if (this.#tools.has(tool.name)) {
      return Promise.reject(new DOMException(`Duplicate tool name "${tool.name}".`, 'InvalidStateError'));
    }
    this.#tools.set(tool.name, tool);
    signal?.addEventListener(
      'abort',
      () => {
        if (this.#tools.get(tool.name) === tool) {
          this.#tools.delete(tool.name);
          this.dispatchEvent(new Event('toolchange'));
        }
      },
      { once: true },
    );
    this.dispatchEvent(new Event('toolchange'));
    return Promise.resolve();
  }

  async getTools(): Promise<RegisteredTool[]> {
    return [...this.#tools.values()].map((tool) => {
      const platformTool = new FakePlatformTool({
        name: tool.name,
        title: tool.title ?? '',
        description: tool.description,
        inputSchema: tool.inputSchema ?? {},
        origin: location.origin,
        window,
      });
      this.#handedOut.set(platformTool, tool);
      return platformTool;
    });
  }

  async executeTool(tool: RegisteredTool | string, input: object = {}): Promise<string> {
    const registration = tool instanceof FakePlatformTool ? this.#handedOut.get(tool) : undefined;
    if (!registration) throw new TypeError(NOT_A_TOOL);
    if (this.#tools.get(registration.name) !== registration) {
      throw new DOMException(`No tool named "${registration.name}".`, 'NotFoundError');
    }
    this.executed.push(registration.name);
    const result = await registration.execute(input, { signal: new AbortController().signal });
    return typeof result === 'string' ? result : JSON.stringify(result ?? null);
  }
}

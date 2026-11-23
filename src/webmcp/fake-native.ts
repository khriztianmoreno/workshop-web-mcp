import type { ModelContextTool, RegisteredTool, RegisterToolOptions } from './types';

/**
 * Test double for Chrome's native document.modelContext (checked against Chrome with the WebMCP flag).
 * Mirrors the real quirks that the polyfill hides:
 *  - getTools() returns plain objects with ONLY { name, title, description, inputSchema, origin, window }:
 *    the annotations passed to registerTool() are dropped.
 *  - executeTool() takes a RegisteredTool dictionary (any object with name + description), never a string.
 */
export class FakeNativeModelContext extends EventTarget {
  readonly #tools = new Map<string, ModelContextTool>();
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
    return [...this.#tools.values()].map((tool) => ({
      name: tool.name,
      title: tool.title ?? '',
      description: tool.description,
      inputSchema: tool.inputSchema ?? {},
      origin: location.origin,
      window,
    }));
  }

  async executeTool(tool: RegisteredTool | string, input: object = {}): Promise<string> {
    if (typeof tool !== 'object' || tool === null) {
      throw new TypeError("Failed to execute 'executeTool' on 'ModelContext': The provided value is not of type 'RegisteredTool'.");
    }
    if (typeof tool.description !== 'string') {
      throw new TypeError("Failed to read the 'description' property from 'RegisteredTool': Required member is undefined.");
    }
    const entry = this.#tools.get(tool.name);
    if (!entry) throw new DOMException(`No tool named "${tool.name}".`, 'NotFoundError');
    this.executed.push(tool.name);
    const result = await entry.execute(input, { signal: new AbortController().signal });
    return typeof result === 'string' ? result : JSON.stringify(result ?? null);
  }
}

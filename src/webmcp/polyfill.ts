import { normalizeAnnotations } from './annotations';
import type {
  ExecuteToolOptions,
  GetToolsOptions,
  JsonSchema,
  ModelContext,
  ModelContextTool,
  RegisteredTool,
  RegisterToolOptions,
  ToolAnnotations,
} from './types';

/**
 * Spec-shaped WebMCP polyfill + installer.
 *
 * installWebMcp() decides between these modes:
 *  - "native":         the browser implements document.modelContext with getTools/executeTool.
 *                      A thin adapter re-attaches the annotations that native getTools() drops.
 *  - "native-wrapped": the browser implements registerTool but not getTools/executeTool
 *                      (older Chrome builds). Tools are registered natively (so the browser's
 *                      own agent sees them) AND mirrored into a local registry so the in-page
 *                      chat panel can list and execute them.
 *  - "polyfill":       no native support. A local implementation is installed on
 *                      document.modelContext. Only the in-page chat panel can use the tools.
 *  - "polyfill-forced": like "polyfill", but chosen with ?webmcp=polyfill even though the
 *                      browser has native support (instructor switch to compare both paths).
 */

const TOOL_NAME_PATTERN = /^[A-Za-z0-9_.-]{1,128}$/;

export class ModelContextToolEvent extends Event {
  readonly toolName: string;
  constructor(type: 'toolactivated' | 'toolcancel', toolName: string) {
    super(type);
    this.toolName = toolName;
  }
}

interface Entry {
  tool: ModelContextTool;
  exposedTo: string[];
}

function currentOrigin(): string {
  return typeof location !== 'undefined' ? location.origin : 'null';
}

function abortError(message = 'The operation was aborted.'): DOMException {
  return new DOMException(message, 'AbortError');
}

/** Minimal JSON Schema check (top-level object, required, primitive types, enum). */
export function validateInput(schema: JsonSchema | undefined, input: unknown): string | null {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return 'Input must be a JSON object.';
  if (!schema) return null;
  const record = input as Record<string, unknown>;
  const required = Array.isArray(schema.required) ? (schema.required as string[]) : [];
  for (const key of required) {
    if (record[key] === undefined) return `Missing required property "${key}".`;
  }
  const properties = (schema.properties ?? {}) as Record<string, JsonSchema>;
  for (const [key, value] of Object.entries(record)) {
    const propertySchema = properties[key];
    if (!propertySchema || value === undefined) continue;
    const types = ([] as unknown[]).concat(propertySchema.type ?? []) as string[];
    if (types.length > 0 && !types.some((type) => matchesType(type, value))) {
      return `Property "${key}" must be of type ${types.join(' | ')}.`;
    }
    if (Array.isArray(propertySchema.enum) && !propertySchema.enum.includes(value)) {
      return `Property "${key}" must be one of: ${propertySchema.enum.join(', ')}.`;
    }
  }
  return null;
}

function matchesType(type: string, value: unknown): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'integer':
      return Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'null':
      return value === null;
    default:
      return true;
  }
}

function toRegisteredTool(entry: Entry): RegisteredTool {
  const { tool } = entry;
  return {
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema,
    annotations: normalizeAnnotations(tool.annotations),
    origin: currentOrigin(),
  };
}

export class PolyfillModelContext extends EventTarget implements ModelContext {
  readonly #tools = new Map<string, Entry>();

  registerTool(tool: ModelContextTool, options: RegisterToolOptions = {}): Promise<void> {
    try {
      this.registerToolSync(tool, options);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /** Synchronous core, so StrictMode's mount → abort → mount sequence never races. */
  registerToolSync(tool: ModelContextTool, { signal, exposedTo = [] }: RegisterToolOptions = {}): void {
    if (!tool || typeof tool.name !== 'string' || !TOOL_NAME_PATTERN.test(tool.name)) {
      throw new TypeError(`Invalid tool name "${tool?.name}". Use 1-128 chars: letters, digits, "_", "-", ".".`);
    }
    if (typeof tool.description !== 'string' || tool.description.length === 0) {
      throw new TypeError(`Tool "${tool.name}" needs a description.`);
    }
    if (typeof tool.execute !== 'function') {
      throw new TypeError(`Tool "${tool.name}" needs an execute() function.`);
    }
    if (signal?.aborted) throw abortError(`Registration of "${tool.name}" was aborted.`);
    if (this.#tools.has(tool.name)) {
      throw new DOMException(`A tool named "${tool.name}" is already registered.`, 'InvalidStateError');
    }

    const entry: Entry = { tool, exposedTo };
    this.#tools.set(tool.name, entry);
    signal?.addEventListener(
      'abort',
      () => {
        if (this.#tools.get(tool.name) === entry) {
          this.#tools.delete(tool.name);
          this.dispatchEvent(new Event('toolchange'));
        }
      },
      { once: true },
    );
    this.dispatchEvent(new Event('toolchange'));
  }

  async getTools({ fromOrigins }: GetToolsOptions = {}): Promise<RegisteredTool[]> {
    const origin = currentOrigin();
    if (fromOrigins && !fromOrigins.includes(origin)) return [];
    return [...this.#tools.values()].map(toRegisteredTool);
  }

  async executeTool(tool: RegisteredTool | string, input: object = {}, { signal }: ExecuteToolOptions = {}): Promise<string> {
    const name = typeof tool === 'string' ? tool : tool?.name;
    const entry = name ? this.#tools.get(name) : undefined;
    if (!entry) throw new DOMException(`No tool named "${name}" is registered.`, 'NotFoundError');

    const problem = validateInput(entry.tool.inputSchema, input);
    if (problem) throw new TypeError(`Invalid input for "${name}": ${problem}`);
    if (signal?.aborted) throw abortError();

    const controller = new AbortController();
    const onAbort = () => {
      controller.abort(signal?.reason);
      this.dispatchEvent(new ModelContextToolEvent('toolcancel', entry.tool.name));
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    this.dispatchEvent(new ModelContextToolEvent('toolactivated', entry.tool.name));
    try {
      const result = await new Promise<unknown>((resolve, reject) => {
        controller.signal.addEventListener('abort', () => reject(abortError()), { once: true });
        entry.tool.execute(input, { signal: controller.signal }).then(resolve, reject);
      });
      return typeof result === 'string' ? result : JSON.stringify(result ?? null);
    } finally {
      signal?.removeEventListener('abort', onAbort);
    }
  }
}

/**
 * Wraps an older native implementation that only has registerTool (and maybe unregisterTool).
 * Registration goes to BOTH the browser and a local mirror; listing/execution use the mirror.
 */
interface LegacyNativeContext extends EventTarget {
  registerTool(tool: ModelContextTool, options?: RegisterToolOptions): unknown;
  unregisterTool?(name: string): unknown;
}

export class NativeWrappedModelContext extends PolyfillModelContext {
  readonly #native: LegacyNativeContext;

  constructor(native: LegacyNativeContext) {
    super();
    this.#native = native;
    // Forward events that the browser's own agent produces.
    for (const type of ['toolactivated', 'toolcancel']) {
      native.addEventListener?.(type, (event) => {
        const toolName = (event as Partial<ModelContextToolEvent>).toolName ?? '';
        this.dispatchEvent(new ModelContextToolEvent(type as 'toolactivated', toolName));
      });
    }
  }

  override registerTool(tool: ModelContextTool, options: RegisterToolOptions = {}): Promise<void> {
    try {
      this.registerToolSync(tool, options);
    } catch (error) {
      return Promise.reject(error);
    }
    try {
      const nativeResult = this.#native.registerTool(tool, options);
      Promise.resolve(nativeResult).catch((error) => console.warn('[webmcp] native registerTool failed', error));
      if (options.signal && typeof this.#native.unregisterTool === 'function') {
        // Older builds ignored the signal and exposed unregisterTool() instead.
        options.signal.addEventListener('abort', () => {
          try {
            this.#native.unregisterTool?.(tool.name);
          } catch {
            /* already gone */
          }
        });
      }
    } catch (error) {
      console.warn('[webmcp] native registerTool failed; the tool is only available to the in-page panel', error);
    }
    return Promise.resolve();
  }
}

/**
 * Adapter for a complete native implementation. Chrome's getTools() returns only
 * { name, title, description, inputSchema, origin, window } — the annotations given to
 * registerTool() are dropped, so the in-page agent would lose its consequentialHint
 * confirmation and untrustedContentHint fencing. This adapter keeps a side registry of
 * annotations by tool name (forgotten when the registration signal aborts) and merges it
 * back into getTools().
 *
 * Chrome also returns platform `Tool` objects (WebIDL, fields are prototype getters) and its
 * executeTool() only accepts those exact objects. getTools() therefore hands out plain copies,
 * and executeTool() swaps a copy back for the browser's original. Everything else goes straight
 * to the browser.
 */
interface AnnotationRecord {
  annotations: ToolAnnotations;
  live: boolean;
}

export class NativeAnnotatedModelContext implements ModelContext {
  readonly #native: ModelContext;
  readonly #annotations = new Map<string, AnnotationRecord>();

  constructor(native: ModelContext) {
    this.#native = native;
  }

  registerTool(tool: ModelContextTool, options: RegisterToolOptions = {}): Promise<void> {
    const name = tool?.name;
    const record: AnnotationRecord | undefined =
      typeof name === 'string' && !options.signal?.aborted ? { annotations: { ...tool.annotations }, live: true } : undefined;
    const previous = record ? this.#annotations.get(name) : undefined;
    if (record) {
      this.#annotations.set(name, record);
      options.signal?.addEventListener('abort', () => this.#forget(name, record), { once: true });
    }

    let registration: Promise<void>;
    try {
      registration = Promise.resolve(this.#native.registerTool(tool, options));
    } catch (error) {
      registration = Promise.reject(error);
    }
    return registration.catch((error: unknown) => {
      // The browser refused it (duplicate name, aborted...): keep whatever registration is still live.
      if (record) {
        this.#forget(name, record);
        if (previous?.live && !this.#annotations.has(name)) this.#annotations.set(name, previous);
      }
      throw error;
    });
  }

  async getTools(options?: GetToolsOptions): Promise<RegisteredTool[]> {
    const tools = await this.#native.getTools(options);
    return tools.map((tool) => {
      // Chrome returns platform `Tool` objects whose fields are prototype getters, so `{ ...tool }`
      // would copy nothing. Read each field explicitly into a plain object: from here on, spreads,
      // JSON.stringify and structuredClone downstream (normalizeTool, toDeclaration, the panel) are safe.
      const plain: RegisteredTool = {
        name: tool.name,
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        annotations: tool.annotations,
        origin: tool.origin,
        window: tool.window,
      };
      const record = this.#annotations.get(tool.name);
      // Annotations reported by the browser itself (if a future build returns them) win.
      return record ? { ...plain, annotations: { ...record.annotations, ...tool.annotations } } : plain;
    });
  }

  async executeTool(tool: RegisteredTool | string, input?: object, options?: ExecuteToolOptions): Promise<string> {
    if (typeof tool === 'string') return this.#native.executeTool(tool, input, options);
    // getTools() hands out plain copies (see above), but Chrome's executeTool() only accepts its own
    // platform `Tool` object, not a dictionary with the same shape. Look the original up by name (and
    // origin, when known) right before executing. If it is gone (unregistered in the meantime), pass
    // the copy through and let the browser raise its own error.
    const originals = await this.#native.getTools();
    const original =
      originals.find((candidate) => candidate.name === tool.name && (!tool.origin || candidate.origin === tool.origin)) ??
      originals.find((candidate) => candidate.name === tool.name);
    return this.#native.executeTool(original ?? tool, input, options);
  }

  addEventListener(...args: Parameters<EventTarget['addEventListener']>): void {
    this.#native.addEventListener(...args);
  }

  removeEventListener(...args: Parameters<EventTarget['removeEventListener']>): void {
    this.#native.removeEventListener(...args);
  }

  dispatchEvent(event: Event): boolean {
    return this.#native.dispatchEvent(event);
  }

  #forget(name: string, record: AnnotationRecord): void {
    record.live = false;
    if (this.#annotations.get(name) === record) this.#annotations.delete(name);
  }
}

export type WebMcpMode = 'native' | 'native-wrapped' | 'polyfill' | 'polyfill-forced';

export interface InstallResult {
  mode: WebMcpMode;
  modelContext: ModelContext;
}

function defineOnDocument(modelContext: ModelContext): void {
  Object.defineProperty(document, 'modelContext', { value: modelContext, configurable: true, writable: false });
}

/** Instructor switch: ?webmcp=polyfill forces the polyfill even when the browser has native WebMCP. */
export function isPolyfillForced(search: string = typeof location !== 'undefined' ? location.search : ''): boolean {
  return new URLSearchParams(search).get('webmcp') === 'polyfill';
}

export interface InstallOptions {
  /** Defaults to the ?webmcp=polyfill query param. */
  forcePolyfill?: boolean;
}

export function installWebMcp({ forcePolyfill = isPolyfillForced() }: InstallOptions = {}): InstallResult {
  const native = (document.modelContext ?? navigator.modelContext) as Partial<ModelContext> | undefined;

  if (forcePolyfill) {
    const modelContext = new PolyfillModelContext();
    defineOnDocument(modelContext);
    return { mode: 'polyfill-forced', modelContext };
  }

  if (!native || typeof native.registerTool !== 'function') {
    const modelContext = new PolyfillModelContext();
    defineOnDocument(modelContext);
    return { mode: 'polyfill', modelContext };
  }

  if (typeof native.getTools === 'function' && typeof native.executeTool === 'function') {
    // Same spec surface for attendees (document.modelContext.registerTool), annotations kept for the agent.
    const modelContext = new NativeAnnotatedModelContext(native as ModelContext);
    defineOnDocument(modelContext);
    return { mode: 'native', modelContext };
  }

  const modelContext = new NativeWrappedModelContext(native as LegacyNativeContext);
  defineOnDocument(modelContext);
  return { mode: 'native-wrapped', modelContext };
}

/** Feature detection used everywhere else: the spec location first, the deprecated one second. */
export function getModelContext(): ModelContext | undefined {
  return document.modelContext ?? navigator.modelContext;
}

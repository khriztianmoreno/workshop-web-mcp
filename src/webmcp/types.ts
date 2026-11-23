/**
 * WebMCP types, modeled on the W3C WebML CG draft (13 Nov 2026).
 * https://webmachinelearning.github.io/webmcp/
 *
 * - Entry point: document.modelContext ([SecureContext]).
 *   navigator.modelContext is deprecated (Chrome 150) but still feature-detected.
 * - Tools only: provideContext / clearContext / resources were removed from the draft.
 * - There is no unregisterTool(): abort the AbortSignal passed to registerTool().
 */

export type JsonSchema = Record<string, unknown>;

export interface ToolAnnotations {
  /** The tool does not change state. */
  readOnlyHint?: boolean;
  /** The output contains content the page does not control (reviews, emails, user posts...). */
  untrustedContentHint?: boolean;
  /** The tool has real-world consequences (payments, sending, deleting...). */
  consequentialHint?: boolean;
  /** The tool exists for debugging only. */
  debugging?: boolean;
}

export interface ToolExecuteContext {
  signal: AbortSignal;
}

export interface ModelContextTool<Input = any> {
  name: string;
  title?: string;
  description: string;
  inputSchema?: JsonSchema;
  outputSchema?: JsonSchema;
  execute(input: Input, context: ToolExecuteContext): Promise<unknown>;
  annotations?: ToolAnnotations;
}

export interface RegisterToolOptions {
  signal?: AbortSignal;
  /** Origins allowed to see the tool (e.g. a cross-origin agent). Defaults to same origin. */
  exposedTo?: string[];
}

/**
 * What getTools() returns. Native Chrome returns ONLY { name, title, description, inputSchema, origin, window }:
 * annotations are optional here. Agent code reads them through normalizeTool() (./annotations.ts).
 */
export interface RegisteredTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: JsonSchema;
  outputSchema?: JsonSchema;
  annotations?: ToolAnnotations;
  origin: string;
  window?: Window;
}

/** A RegisteredTool after normalizeTool(): every hint present, missing ones are false. */
export interface AnnotatedTool extends RegisteredTool {
  annotations: Required<ToolAnnotations>;
}

export interface GetToolsOptions {
  fromOrigins?: string[];
}

export interface ExecuteToolOptions {
  signal?: AbortSignal;
}

export interface ToolEvent extends Event {
  readonly toolName: string;
}

export interface ModelContext extends EventTarget {
  registerTool(tool: ModelContextTool, options?: RegisterToolOptions): Promise<void>;
  getTools(options?: GetToolsOptions): Promise<RegisteredTool[]>;
  executeTool(tool: RegisteredTool | string, input?: object, options?: ExecuteToolOptions): Promise<string>;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
  interface Navigator {
    /** @deprecated since Chrome 150. Use document.modelContext. */
    modelContext?: ModelContext;
  }
}

/** Identity helper that gives full type inference when declaring a tool. */
export function defineTool<Input>(tool: ModelContextTool<Input>): ModelContextTool<Input> {
  return tool;
}

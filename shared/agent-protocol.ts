/**
 * Wire protocol between the in-browser agent loop (src/agent) and the proxy (server/).
 * The browser owns the conversation history and executes tools; the proxy only
 * forwards one model call per request and never sees the page.
 */

export type JsonSchema = Record<string, unknown>;

/** A tool as described to the model (derived from document.modelContext.getTools()). */
export interface AgentToolDeclaration {
  name: string;
  description: string;
  parameters?: JsonSchema;
}

export interface FunctionCallPart {
  id?: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResultPart {
  id?: string;
  name: string;
  /** Always an object. Untrusted outputs are wrapped by the browser (see src/agent/untrusted.ts). */
  response: Record<string, unknown>;
}

export type ChatMessage =
  | { role: 'user'; text: string }
  | {
      role: 'model';
      text?: string;
      functionCalls?: FunctionCallPart[];
      /**
       * Opaque provider parts (e.g. Gemini parts with thought signatures).
       * The browser must send them back untouched on the next request.
       */
      rawParts?: unknown[];
    }
  | { role: 'tool'; results: ToolResultPart[] };

export interface ChatRequest {
  messages: ChatMessage[];
  tools: AgentToolDeclaration[];
}

export type AgentMode = 'gemini' | 'mock';

export interface ChatResponse {
  mode: AgentMode;
  model?: string;
  text?: string;
  functionCalls: FunctionCallPart[];
  rawParts?: unknown[];
  /** Gemini finishReason of the last model call (informational; clients may ignore it). */
  finishReason?: string;
}

export interface HealthResponse {
  ok: true;
  mode: AgentMode;
  model?: string;
  reason?: string;
}

/** Marker used by the browser to wrap tool outputs flagged with untrustedContentHint. */
export const UNTRUSTED_OPEN = '<<<UNTRUSTED_TOOL_OUTPUT>>>';
export const UNTRUSTED_CLOSE = '<<<END_UNTRUSTED_TOOL_OUTPUT>>>';

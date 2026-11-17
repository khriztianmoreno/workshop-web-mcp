import type {
  AgentToolDeclaration,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  FunctionCallPart,
  ToolResultPart,
} from '../../shared/agent-protocol';
import type { ModelContext, RegisteredTool } from '../webmcp/types';
import { toModelResponse } from './untrusted';

/**
 * The agent loop runs IN THE BROWSER, like a browser-integrated agent would:
 *   getTools() → model call (via proxy) → executeTool() → feed results back → repeat.
 * The proxy never touches the page; the page never sees the API key.
 */

export const MAX_AGENT_STEPS = 8;

export type ToolCallStatus = 'awaiting-confirmation' | 'running' | 'done' | 'error' | 'declined';

export interface ToolCallEvent {
  callKey: string;
  name: string;
  title?: string;
  args: Record<string, unknown>;
  status: ToolCallStatus;
  result?: unknown;
  untrusted?: boolean;
}

export interface AgentLoopOptions {
  modelContext: ModelContext;
  history: ChatMessage[];
  sendChat: (request: ChatRequest, signal?: AbortSignal) => Promise<ChatResponse>;
  /** Agent-side guard for tools flagged consequentialHint. Return true to allow. */
  confirmTool: (call: FunctionCallPart, tool: RegisteredTool) => Promise<boolean>;
  onModelText?: (text: string, response: ChatResponse) => void;
  onToolCall?: (event: ToolCallEvent) => void;
  /** Called right before executeTool (used for visual feedback). */
  beforeExecute?: (call: FunctionCallPart) => void;
  signal?: AbortSignal;
  maxSteps?: number;
}

export function toDeclaration(tool: RegisteredTool): AgentToolDeclaration {
  return {
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema ?? { type: 'object', properties: {} },
  };
}

let callSequence = 0;

/** Runs one user turn. Mutates and returns `history`. */
export async function runAgentTurn(options: AgentLoopOptions): Promise<ChatMessage[]> {
  const { modelContext, history, sendChat, signal, maxSteps = MAX_AGENT_STEPS } = options;

  for (let step = 0; step < maxSteps; step += 1) {
    const tools = await modelContext.getTools();
    const response = await sendChat({ messages: history, tools: tools.map(toDeclaration) }, signal);

    history.push({ role: 'model', text: response.text, functionCalls: response.functionCalls, rawParts: response.rawParts });
    if (response.text) options.onModelText?.(response.text, response);
    if (response.functionCalls.length === 0) return history;

    const results: ToolResultPart[] = [];
    for (const call of response.functionCalls) {
      results.push(await runToolCall(call, tools, options));
    }
    history.push({ role: 'tool', results });
  }

  const text = `Me detuve después de ${maxSteps} pasos para no entrar en un ciclo. ¿Quieres que continúe?`;
  history.push({ role: 'model', text });
  options.onModelText?.(text, { mode: 'mock', functionCalls: [] });
  return history;
}

async function runToolCall(call: FunctionCallPart, tools: RegisteredTool[], options: AgentLoopOptions): Promise<ToolResultPart> {
  callSequence += 1;
  const callKey = `call-${callSequence}`;
  const args = call.args ?? {};
  const tool = tools.find((t) => t.name === call.name);
  const emit = (event: Omit<ToolCallEvent, 'callKey' | 'name' | 'args' | 'title'>) =>
    options.onToolCall?.({ callKey, name: call.name, title: tool?.title, args, ...event });
  const reply = (response: Record<string, unknown>): ToolResultPart => ({ id: call.id, name: call.name, response });

  if (!tool) {
    emit({ status: 'error', result: 'Herramienta no registrada' });
    return reply({ error: `Tool "${call.name}" is not registered on this page.` });
  }

  if (tool.annotations.consequentialHint) {
    emit({ status: 'awaiting-confirmation' });
    const allowed = await options.confirmTool(call, tool);
    if (!allowed) {
      emit({ status: 'declined', result: 'El usuario rechazó la acción en el panel del agente.' });
      return reply({ error: 'The user declined this action in the agent panel. Do not retry it.' });
    }
  }

  emit({ status: 'running' });
  try {
    options.beforeExecute?.(call);
    const output = await options.modelContext.executeTool(tool, args, { signal: options.signal });
    const response = toModelResponse(tool, output);
    const parsed = 'output' in response ? response.output : output;
    const failed = typeof parsed === 'object' && parsed !== null && (parsed as { ok?: unknown }).ok === false;
    emit({ status: failed ? 'error' : 'done', result: parsed, untrusted: tool.annotations.untrustedContentHint });
    return reply(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit({ status: 'error', result: message });
    return reply({ error: message });
  }
}

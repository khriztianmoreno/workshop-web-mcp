import { randomUUID } from 'node:crypto';
import {
  GoogleGenAI,
  type Content,
  type FunctionCallingConfigMode,
  type FunctionDeclaration,
  type GenerateContentResponse,
  type Part,
} from '@google/genai';
import type { ChatMessage, ChatRequest, ChatResponse, FunctionCallPart } from '../shared/agent-protocol';
import { SYSTEM_PROMPT } from './system-prompt';
import { sanitizeRawParts } from './validation';

export interface GeminiAgentOptions {
  /** Hard cap on generated tokens per call (includes thinking tokens). */
  maxOutputTokens: number;
}

/** Shown when Gemini keeps trying to call a tool the page does not have (e.g. Act 1, zero tools). */
export const NO_TOOL_FALLBACK_TEXT =
  'No tengo una herramienta para consultar eso todavía, así que no puedo darte un dato confiable. Cuando la página registre las herramientas necesarias podré revisarlo.';

/** Shown when Gemini returns neither text nor function calls twice in a row. */
export const EMPTY_REPLY_FALLBACK_TEXT = 'No pude generar una respuesta esta vez. Intenta de nuevo o formula la pregunta de otra manera.';

/**
 * Appended when the page registered zero tools (Act 1). toolConfig mode NONE alone is not
 * enough: gemini-3.8-flash still tries to call made-up tools (MALFORMED_FUNCTION_CALL).
 */
export const NO_TOOLS_NOTE = `

This request has NO tools: do not call any function. Answer in text and say plainly what you cannot check.`;

/** Extra system instruction for the single retry after a malformed or empty reply. */
export function retryInstruction(toolNames: string[]): string {
  const allowed =
    toolNames.length > 0
      ? `The ONLY tools you can call in this request are: ${toolNames.join(', ')}. Never call any other function name.`
      : 'There are NO tools in this request: do not call any function.';
  return `

Your previous attempt produced no usable answer (an invalid function call or an empty reply).
${allowed}
If none of them can answer the request, reply in text and say plainly what you cannot check.`;
}

interface ModelReply {
  text?: string;
  functionCalls: FunctionCallPart[];
  rawParts: Part[];
  finishReason?: string;
}

function readReply(response: GenerateContentResponse): ModelReply {
  const candidate = response.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const text = parts
    .filter((part) => typeof part.text === 'string' && !part.thought)
    .map((part) => part.text)
    .join('')
    .trim();

  return {
    text: text || undefined,
    functionCalls: (response.functionCalls ?? []).map((call) => ({
      // Only echo ids Gemini gave us; a made-up id would not match the function call part.
      ...(call.id ? { id: call.id } : {}),
      name: call.name ?? 'unknown',
      args: (call.args ?? {}) as Record<string, unknown>,
    })),
    rawParts: parts,
    finishReason: candidate?.finishReason,
  };
}

const isUsable = (reply: ModelReply) => Boolean(reply.text) || reply.functionCalls.length > 0;

// FinishReason values (string enum in @google/genai) for a call the model could not make.
const triedUndeclaredTool = (reply: ModelReply) =>
  reply.finishReason === 'MALFORMED_FUNCTION_CALL' || reply.finishReason === 'UNEXPECTED_TOOL_CALL';

/** Converts the browser-owned history into Gemini contents. */
export function toGeminiContents(messages: ChatMessage[]): Content[] {
  return messages.map((message): Content => {
    switch (message.role) {
      case 'user':
        return { role: 'user', parts: [{ text: message.text }] };
      case 'model': {
        // Send provider parts back (Gemini 3 needs its thought signatures), but only the
        // shapes Gemini itself returns: never client-supplied fileData, inlineData, etc.
        const rawParts = sanitizeRawParts(message.rawParts);
        if (rawParts.length > 0) {
          return { role: 'model', parts: rawParts as Part[] };
        }
        const parts: Part[] = [];
        if (message.text) parts.push({ text: message.text });
        for (const call of message.functionCalls ?? []) {
          parts.push({ functionCall: { id: call.id, name: call.name, args: call.args } });
        }
        return { role: 'model', parts };
      }
      case 'tool':
        return {
          role: 'user',
          parts: message.results.map((result) => ({
            functionResponse: { id: result.id, name: result.name, response: result.response },
          })),
        };
    }
  });
}

export function createGeminiAgent(apiKey: string, model: string, { maxOutputTokens }: GeminiAgentOptions) {
  const ai = new GoogleGenAI({ apiKey });

  return async function geminiAgent(request: ChatRequest): Promise<ChatResponse> {
    const functionDeclarations: FunctionDeclaration[] = request.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parametersJsonSchema: tool.parameters ?? { type: 'object', properties: {} },
    }));

    const contents = toGeminiContents(request.messages);
    const generate = async (systemInstruction: string) =>
      readReply(
        await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            maxOutputTokens,
            ...(functionDeclarations.length > 0
              ? { tools: [{ functionDeclarations }] }
              : // Zero tools (Act 1): forbid calls so the model answers in text instead of inventing one.
                // FunctionCallingConfigMode is a string enum; 'NONE' is its exact value.
                { toolConfig: { functionCallingConfig: { mode: 'NONE' as FunctionCallingConfigMode } } }),
          },
        }),
      );

    const id = randomUUID().slice(0, 8);
    const log = (outcome: string, ...replies: ModelReply[]) =>
      console.warn(
        `[gemini] ${id} finishReason=${replies.map((reply) => reply.finishReason ?? 'none').join('>')} outcome=${outcome} tools=${functionDeclarations.length}`,
      );
    const toResponse = (reply: ModelReply): ChatResponse => ({ mode: 'gemini', model, ...reply });

    const first = await generate(functionDeclarations.length > 0 ? SYSTEM_PROMPT : SYSTEM_PROMPT + NO_TOOLS_NOTE);
    if (isUsable(first)) {
      if (first.finishReason && first.finishReason !== 'STOP') log('direct', first);
      return toResponse(first);
    }

    // One retry (not counted by the per-request rate limit) with the declared tool names spelled out.
    const retry = await generate(SYSTEM_PROMPT + retryInstruction(functionDeclarations.map((tool) => tool.name ?? '')));
    if (isUsable(retry)) {
      log('retried', first, retry);
      return toResponse(retry);
    }

    // Never answer with an empty message: old clients would show nothing at all.
    log('fallback', first, retry);
    return {
      mode: 'gemini',
      model,
      text: triedUndeclaredTool(first) || triedUndeclaredTool(retry) ? NO_TOOL_FALLBACK_TEXT : EMPTY_REPLY_FALLBACK_TEXT,
      functionCalls: [],
      // No provider parts: the next turn rebuilds this message from its text.
      rawParts: [],
      finishReason: retry.finishReason ?? first.finishReason,
    };
  };
}

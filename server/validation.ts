import type {
  AgentToolDeclaration,
  ChatMessage,
  ChatRequest,
  FunctionCallPart,
  ToolResultPart,
} from '../shared/agent-protocol';

export interface RequestLimits {
  maxMessages: number;
  /** Max characters in one user message or tool description. */
  maxTextChars: number;
  /** Max characters in one model text or rawParts text part (model answers run longer than prompts). */
  maxModelTextChars: number;
  maxTools: number;
  /** Max size of one tool's JSON schema, serialized. */
  maxToolSchemaBytes: number;
}

export type ParseResult =
  | { ok: true; request: ChatRequest }
  | { ok: false; status: 400 | 413; error: string };

/** A model part as Gemini returns it to us: only text, thoughts and function calls. */
export interface SafeModelPart {
  text?: string;
  thought?: boolean;
  thoughtSignature?: string;
  functionCall?: { id?: string; name: string; args: Record<string, unknown> };
}

const INVALID_SHAPE =
  'Formato inválido: se esperaba { messages: ChatMessage[], tools: AgentToolDeclaration[] }.';
const START_OVER = 'Usa "Nueva conversación" en el panel y vuelve a intentarlo.';

class TooLarge extends Error {}
class Invalid extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function sanitizeFunctionCall(value: unknown): SafeModelPart['functionCall'] | undefined {
  if (!isRecord(value) || typeof value.name !== 'string') return undefined;
  if (value.args !== undefined && !isRecord(value.args)) return undefined;
  if (value.id !== undefined && typeof value.id !== 'string') return undefined;
  return {
    ...(typeof value.id === 'string' ? { id: value.id } : {}),
    name: value.name,
    args: (value.args as Record<string, unknown> | undefined) ?? {},
  };
}

/**
 * Keeps only the part shapes the server itself returned (text, thought flags, thought
 * signatures, function calls). Anything else a client adds, such as fileData or inlineData,
 * is dropped so the proxy cannot be used to feed arbitrary content to Gemini.
 */
export function sanitizeRawParts(parts: unknown): SafeModelPart[] {
  if (!Array.isArray(parts)) return [];
  const safe: SafeModelPart[] = [];
  for (const part of parts) {
    if (!isRecord(part)) continue;
    const clean: SafeModelPart = {};
    if (typeof part.text === 'string') clean.text = part.text;
    if (typeof part.thought === 'boolean') clean.thought = part.thought;
    if (typeof part.thoughtSignature === 'string') clean.thoughtSignature = part.thoughtSignature;
    const call = sanitizeFunctionCall(part.functionCall);
    if (call) clean.functionCall = call;
    const meaningful = clean.text !== undefined || clean.thoughtSignature !== undefined || clean.functionCall;
    if (meaningful) safe.push(clean);
  }
  return safe;
}

function parseMessages(value: unknown, limits: RequestLimits): ChatMessage[] {
  if (!Array.isArray(value) || value.length === 0) throw new Invalid(INVALID_SHAPE);
  if (value.length > limits.maxMessages) {
    throw new TooLarge(`La conversación es demasiado larga (máximo ${limits.maxMessages} mensajes). ${START_OVER}`);
  }

  const text = (candidate: unknown, maxChars: number, optional = false): string | undefined => {
    if (candidate === undefined && optional) return undefined;
    if (typeof candidate !== 'string') throw new Invalid(INVALID_SHAPE);
    if (candidate.length > maxChars) {
      throw new TooLarge(`Un mensaje es demasiado largo (máximo ${maxChars} caracteres). ${START_OVER}`);
    }
    return candidate;
  };

  return value.map((message): ChatMessage => {
    if (!isRecord(message)) throw new Invalid(INVALID_SHAPE);
    switch (message.role) {
      case 'user':
        return { role: 'user', text: text(message.text, limits.maxTextChars) as string };
      case 'model': {
        const functionCalls = message.functionCalls === undefined ? undefined : parseFunctionCalls(message.functionCalls);
        const rawParts = message.rawParts === undefined ? undefined : sanitizeRawParts(message.rawParts);
        for (const part of rawParts ?? []) if (part.text !== undefined) text(part.text, limits.maxModelTextChars);
        const modelText = text(message.text, limits.maxModelTextChars, true);
        return {
          role: 'model',
          ...(modelText !== undefined ? { text: modelText } : {}),
          ...(functionCalls ? { functionCalls } : {}),
          ...(rawParts ? { rawParts } : {}),
        };
      }
      case 'tool': {
        if (!Array.isArray(message.results)) throw new Invalid(INVALID_SHAPE);
        const results = message.results.map((result): ToolResultPart => {
          if (!isRecord(result) || typeof result.name !== 'string' || !isRecord(result.response)) {
            throw new Invalid(INVALID_SHAPE);
          }
          return {
            ...(typeof result.id === 'string' ? { id: result.id } : {}),
            name: result.name,
            response: result.response,
          };
        });
        return { role: 'tool', results };
      }
      default:
        throw new Invalid(INVALID_SHAPE);
    }
  });
}

function parseFunctionCalls(value: unknown): FunctionCallPart[] {
  if (!Array.isArray(value)) throw new Invalid(INVALID_SHAPE);
  return value.map((call) => {
    const clean = sanitizeFunctionCall(call);
    if (!clean) throw new Invalid(INVALID_SHAPE);
    return clean;
  });
}

function parseTools(value: unknown, limits: RequestLimits): AgentToolDeclaration[] {
  if (!Array.isArray(value)) throw new Invalid(INVALID_SHAPE);
  if (value.length > limits.maxTools) {
    throw new TooLarge(`Demasiadas herramientas registradas (máximo ${limits.maxTools}).`);
  }
  return value.map((tool): AgentToolDeclaration => {
    if (!isRecord(tool) || typeof tool.name !== 'string' || typeof tool.description !== 'string') {
      throw new Invalid(INVALID_SHAPE);
    }
    if (tool.name.length > 128 || tool.description.length > limits.maxTextChars) {
      throw new TooLarge(`La herramienta "${tool.name.slice(0, 64)}" tiene un nombre o descripción demasiado largos.`);
    }
    if (tool.parameters !== undefined) {
      if (!isRecord(tool.parameters)) throw new Invalid(INVALID_SHAPE);
      if (JSON.stringify(tool.parameters).length > limits.maxToolSchemaBytes) {
        throw new TooLarge(
          `El esquema de la herramienta "${tool.name}" es demasiado grande (máximo ${limits.maxToolSchemaBytes} bytes).`,
        );
      }
    }
    return {
      name: tool.name,
      description: tool.description,
      ...(tool.parameters !== undefined ? { parameters: tool.parameters } : {}),
    };
  });
}

/** Validates and normalizes an untrusted chat request. Unknown fields are dropped. */
export function parseChatRequest(body: unknown, limits: RequestLimits): ParseResult {
  try {
    if (!isRecord(body)) throw new Invalid(INVALID_SHAPE);
    const messages = parseMessages(body.messages, limits);
    const tools = parseTools(body.tools, limits);
    return { ok: true, request: { messages, tools } };
  } catch (error) {
    if (error instanceof TooLarge) return { ok: false, status: 413, error: error.message };
    if (error instanceof Invalid) return { ok: false, status: 400, error: error.message };
    throw error;
  }
}

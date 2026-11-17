import { GoogleGenAI, type Content, type FunctionDeclaration, type Part } from '@google/genai';
import type { ChatMessage, ChatRequest, ChatResponse } from '../shared/agent-protocol';
import { SYSTEM_PROMPT } from './system-prompt';

/** Converts the browser-owned history into Gemini contents. */
export function toGeminiContents(messages: ChatMessage[]): Content[] {
  return messages.map((message): Content => {
    switch (message.role) {
      case 'user':
        return { role: 'user', parts: [{ text: message.text }] };
      case 'model': {
        // Send provider parts back untouched: Gemini 3 needs its thought signatures.
        if (Array.isArray(message.rawParts) && message.rawParts.length > 0) {
          return { role: 'model', parts: message.rawParts as Part[] };
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

export function createGeminiAgent(apiKey: string, model: string) {
  const ai = new GoogleGenAI({ apiKey });

  return async function geminiAgent(request: ChatRequest): Promise<ChatResponse> {
    const functionDeclarations: FunctionDeclaration[] = request.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parametersJsonSchema: tool.parameters ?? { type: 'object', properties: {} },
    }));

    const response = await ai.models.generateContent({
      model,
      contents: toGeminiContents(request.messages),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        ...(functionDeclarations.length > 0 ? { tools: [{ functionDeclarations }] } : {}),
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .filter((part) => typeof part.text === 'string' && !part.thought)
      .map((part) => part.text)
      .join('')
      .trim();

    return {
      mode: 'gemini',
      model,
      text: text || undefined,
      functionCalls: (response.functionCalls ?? []).map((call) => ({
        // Only echo ids Gemini gave us; a made-up id would not match the function call part.
        ...(call.id ? { id: call.id } : {}),
        name: call.name ?? 'unknown',
        args: (call.args ?? {}) as Record<string, unknown>,
      })),
      rawParts: parts,
    };
  };
}

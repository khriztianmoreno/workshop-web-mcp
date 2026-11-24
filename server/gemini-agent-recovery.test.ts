// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatRequest } from '../shared/agent-protocol';

const generateContent = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

const { createGeminiAgent, NO_TOOL_FALLBACK_TEXT, NO_TOOLS_NOTE, EMPTY_REPLY_FALLBACK_TEXT } = await import('./gemini-agent');

const SECRET_PROMPT = '¿Qué cascos certificados ECE 22.06 hay en stock en talla M?';

function makeAgent() {
  return createGeminiAgent('key', 'gemini-test');
}

function request(toolNames: string[] = []): ChatRequest {
  return {
    messages: [{ role: 'user', text: SECRET_PROMPT }],
    tools: toolNames.map((name) => ({ name, description: `${name} tool`, parameters: { type: 'object', properties: {} } })),
  };
}

function textReply(text: string) {
  return {
    candidates: [{ finishReason: 'STOP', content: { role: 'model', parts: [{ text, thoughtSignature: 'sig' }] } }],
    functionCalls: undefined,
  };
}

const malformed = {
  candidates: [{ finishReason: 'MALFORMED_FUNCTION_CALL', content: { role: 'model', parts: [{ text: '', thoughtSignature: 'sig' }] } }],
  functionCalls: undefined,
};

const emptyParts = { candidates: [{ finishReason: 'STOP', content: { role: 'model', parts: [] } }], functionCalls: undefined };

const callReply = {
  candidates: [
    {
      finishReason: 'STOP',
      content: { role: 'model', parts: [{ functionCall: { id: 'c1', name: 'get_store_info', args: {} }, thoughtSignature: 'sig' }] },
    },
  ],
  functionCalls: [{ id: 'c1', name: 'get_store_info', args: {} }],
};

describe('gemini agent recovery', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    generateContent.mockReset();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('forbids function calls when the page registered zero tools', async () => {
    generateContent.mockResolvedValue(textReply('No tengo herramientas todavía.'));
    await makeAgent()(request());

    const { config } = generateContent.mock.calls[0][0];
    expect(config.tools).toBeUndefined();
    expect(config.toolConfig).toEqual({ functionCallingConfig: { mode: 'NONE' } });
    expect(config.systemInstruction).toContain(NO_TOOLS_NOTE.trim());
  });

  it('leaves function calling on automatic when tools are declared', async () => {
    generateContent.mockResolvedValue(textReply('Hola'));
    await makeAgent()(request(['get_store_info']));

    const { config } = generateContent.mock.calls[0][0];
    expect(config.tools).toHaveLength(1);
    expect(config.toolConfig).toBeUndefined();
    expect(config.systemInstruction).not.toContain(NO_TOOLS_NOTE.trim());
  });

  it('returns a normal STOP reply untouched, with one model call', async () => {
    generateContent.mockResolvedValue(textReply('Abrimos de 9 a 7.'));
    const response = await makeAgent()(request(['get_store_info']));

    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(response.text).toBe('Abrimos de 9 a 7.');
    expect(response.functionCalls).toEqual([]);
    expect(response.rawParts).toEqual([{ text: 'Abrimos de 9 a 7.', thoughtSignature: 'sig' }]);
    expect(response.finishReason).toBe('STOP');
    expect(warn).not.toHaveBeenCalled();
  });

  it('returns function calls untouched, with one model call', async () => {
    generateContent.mockResolvedValue(callReply);
    const response = await makeAgent()(request(['get_store_info']));

    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(response.text).toBeUndefined();
    expect(response.functionCalls).toEqual([{ id: 'c1', name: 'get_store_info', args: {} }]);
    expect(response.rawParts).toEqual(callReply.candidates[0].content.parts);
  });

  it('retries a malformed function call once, listing only the declared tools', async () => {
    generateContent.mockResolvedValueOnce(malformed).mockResolvedValueOnce(textReply('Solo puedo ver la info de la tienda.'));
    const response = await makeAgent()(request(['get_store_info']));

    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(response.text).toBe('Solo puedo ver la info de la tienda.');
    expect(response.rawParts).toEqual([{ text: 'Solo puedo ver la info de la tienda.', thoughtSignature: 'sig' }]);

    const first = generateContent.mock.calls[0][0];
    const retry = generateContent.mock.calls[1][0];
    expect(retry.contents).toEqual(first.contents);
    expect(retry.config.tools).toEqual(first.config.tools);
    expect(retry.config.systemInstruction).toContain(first.config.systemInstruction);
    expect(retry.config.systemInstruction).toContain('get_store_info');
    expect(retry.config.systemInstruction.length).toBeGreaterThan(first.config.systemInstruction.length);
  });

  it('retries with no tool names to call when the page registered zero tools', async () => {
    generateContent.mockResolvedValueOnce(malformed).mockResolvedValueOnce(textReply('No tengo herramientas.'));
    const response = await makeAgent()(request());

    expect(response.text).toBe('No tengo herramientas.');
    const retry = generateContent.mock.calls[1][0];
    expect(retry.config.toolConfig).toEqual({ functionCallingConfig: { mode: 'NONE' } });
  });

  it('falls back to a clear text reply when the retry is malformed too', async () => {
    generateContent.mockResolvedValue(malformed);
    const response = await makeAgent()(request());

    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(response.text).toBe(NO_TOOL_FALLBACK_TEXT);
    expect(response.functionCalls).toEqual([]);
    // No provider parts: the next turn rebuilds this message from its text.
    expect(response.rawParts).toEqual([]);
    expect(response.finishReason).toBe('MALFORMED_FUNCTION_CALL');
  });

  it('never returns an empty reply when Gemini sends no parts at all', async () => {
    generateContent.mockResolvedValue(emptyParts);
    const response = await makeAgent()(request(['get_store_info']));

    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(response.text).toBe(EMPTY_REPLY_FALLBACK_TEXT);
    expect(response.functionCalls).toEqual([]);
  });

  it('treats a missing candidate as an empty reply', async () => {
    generateContent.mockResolvedValue({ candidates: [], functionCalls: undefined });
    const response = await makeAgent()(request());

    expect(response.text).toBe(EMPTY_REPLY_FALLBACK_TEXT);
  });

  it('logs non-STOP outcomes with a short id and never the prompt', async () => {
    generateContent.mockResolvedValue(malformed);
    await makeAgent()(request(['get_store_info']));

    expect(warn).toHaveBeenCalled();
    const logged = warn.mock.calls.map((args: unknown[]) => args.join(' ')).join('\n');
    expect(logged).toContain('MALFORMED_FUNCTION_CALL');
    expect(logged).toContain('fallback');
    expect(logged).not.toContain(SECRET_PROMPT);
    expect(logged).not.toContain('cascos');
  });
});

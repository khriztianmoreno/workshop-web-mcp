// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

const generateContent = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

const { createGeminiAgent, toGeminiContents } = await import('./gemini-agent');

describe('gemini agent', () => {
  it('caps output tokens and keeps the server-owned model and system prompt', async () => {
    generateContent.mockResolvedValue({ candidates: [{ content: { parts: [{ text: 'Hola' }] } }], functionCalls: [] });
    const agent = createGeminiAgent('key', 'gemini-test', { maxOutputTokens: 321 });
    const response = await agent({ messages: [{ role: 'user', text: 'hola' }], tools: [] });

    expect(response.text).toBe('Hola');
    const request = generateContent.mock.calls[0][0];
    expect(request.model).toBe('gemini-test');
    expect(request.config.maxOutputTokens).toBe(321);
    expect(typeof request.config.systemInstruction).toBe('string');
  });

  it('sends a thinking level only when configured', async () => {
    generateContent.mockReset();
    generateContent.mockResolvedValue({ candidates: [{ content: { parts: [{ text: 'Hola' }] } }], functionCalls: [] });
    const request = { messages: [{ role: 'user' as const, text: 'hola' }], tools: [] };

    await createGeminiAgent('key', 'gemini-test', { maxOutputTokens: 8192, thinkingLevel: 'LOW' })(request);
    expect(generateContent.mock.calls[0][0].config.thinkingConfig).toEqual({ thinkingLevel: 'LOW' });

    await createGeminiAgent('key', 'gemini-test', { maxOutputTokens: 8192 })(request);
    expect(generateContent.mock.calls[1][0].config.thinkingConfig).toBeUndefined();
  });

  it('never forwards client parts outside the model-part allowlist', () => {
    const contents = toGeminiContents([
      {
        role: 'model',
        rawParts: [{ text: 'ok', thoughtSignature: 's' }, { inlineData: { mimeType: 'image/png', data: 'AAAA' } }],
      },
    ]);
    expect(contents).toEqual([{ role: 'model', parts: [{ text: 'ok', thoughtSignature: 's' }] }]);
  });
});

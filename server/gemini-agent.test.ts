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

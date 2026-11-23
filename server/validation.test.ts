// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { parseChatRequest, sanitizeRawParts, type RequestLimits } from './validation';

const limits: RequestLimits = { maxMessages: 4, maxTextChars: 20, maxTools: 2, maxToolSchemaBytes: 60 };
const tool = { name: 'search_products', description: 'search' };
const user = (text = 'hola') => ({ role: 'user', text });

describe('parseChatRequest', () => {
  it('accepts a well-formed request', () => {
    const result = parseChatRequest({ messages: [user()], tools: [tool] }, limits);
    expect(result).toEqual({ ok: true, request: { messages: [{ role: 'user', text: 'hola' }], tools: [tool] } });
  });

  it.each([
    ['not an object', 'nope'],
    ['empty messages', { messages: [], tools: [] }],
    ['missing tools', { messages: [user()] }],
    ['unknown role', { messages: [{ role: 'system', text: 'x' }], tools: [] }],
    ['user text not a string', { messages: [{ role: 'user', text: 42 }], tools: [] }],
    ['tool without name', { messages: [user()], tools: [{ description: 'x' }] }],
    ['tool result without object response', { messages: [{ role: 'tool', results: [{ name: 'x', response: 'x' }] }], tools: [] }],
  ])('rejects %s with 400', (_label, body) => {
    const result = parseChatRequest(body, limits);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it('rejects too many messages with 413 and a Spanish message', () => {
    const result = parseChatRequest({ messages: Array.from({ length: 5 }, () => user()), tools: [] }, limits);
    expect(result).toMatchObject({ ok: false, status: 413 });
    if (!result.ok) expect(result.error).toMatch(/Nueva conversación/);
  });

  it('rejects text parts longer than the cap with 413', () => {
    const result = parseChatRequest({ messages: [user('x'.repeat(21))], tools: [] }, limits);
    expect(result).toMatchObject({ ok: false, status: 413 });
  });

  it('caps model text too', () => {
    const body = { messages: [user(), { role: 'model', text: 'y'.repeat(21) }], tools: [] };
    expect(parseChatRequest(body, limits)).toMatchObject({ ok: false, status: 413 });
  });

  it('rejects too many tools with 413', () => {
    const result = parseChatRequest({ messages: [user()], tools: [tool, tool, tool] }, limits);
    expect(result).toMatchObject({ ok: false, status: 413 });
  });

  it('rejects oversized tool schemas with 413', () => {
    const parameters = { type: 'object', properties: { q: { type: 'string', description: 'z'.repeat(80) } } };
    const result = parseChatRequest({ messages: [user()], tools: [{ ...tool, parameters }] }, limits);
    expect(result).toMatchObject({ ok: false, status: 413 });
  });

  it('sanitizes model rawParts before they reach the agent', () => {
    const body = {
      messages: [
        user(),
        {
          role: 'model',
          rawParts: [
            { functionCall: { id: 'c1', name: 'search_products', args: { q: 'casco' } }, thoughtSignature: 'sig' },
            { inlineData: { mimeType: 'image/png', data: 'AAAA' } },
          ],
        },
      ],
      tools: [],
    };
    const result = parseChatRequest(body, limits);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const model = result.request.messages[1];
      expect(model.role === 'model' && model.rawParts).toEqual([
        { functionCall: { id: 'c1', name: 'search_products', args: { q: 'casco' } }, thoughtSignature: 'sig' },
      ]);
    }
  });
});

describe('sanitizeRawParts', () => {
  it('keeps the shapes Gemini returns to us', () => {
    const parts = [
      { text: 'Hola', thought: true, thoughtSignature: 'abc' },
      { text: 'Listo' },
      { functionCall: { name: 'add_to_cart', args: {} } },
    ];
    expect(sanitizeRawParts(parts)).toEqual(parts);
  });

  it('strips fileData, inlineData, executable code and unknown keys', () => {
    const parts = [
      { fileData: { fileUri: 'gs://bucket/secret.pdf', mimeType: 'application/pdf' } },
      { inlineData: { mimeType: 'image/png', data: 'AAAA' } },
      { executableCode: { code: 'print(1)', language: 'PYTHON' } },
      { text: 'ok', fileData: { fileUri: 'gs://x' }, videoMetadata: {} },
    ];
    expect(sanitizeRawParts(parts)).toEqual([{ text: 'ok' }]);
  });

  it('drops malformed function calls and wrong field types', () => {
    const parts = [
      { functionCall: { name: 42, args: {} } },
      { functionCall: { name: 'x', args: 'not-an-object' } },
      { text: 7 },
      { thoughtSignature: 99 },
      null,
      'text',
    ];
    expect(sanitizeRawParts(parts)).toEqual([]);
  });

  it('returns an empty list for non-arrays', () => {
    expect(sanitizeRawParts(undefined)).toEqual([]);
    expect(sanitizeRawParts({ text: 'x' })).toEqual([]);
  });
});

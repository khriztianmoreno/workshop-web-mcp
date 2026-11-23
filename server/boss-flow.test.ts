// @vitest-environment node
import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { ChatMessage, ChatRequest } from '../shared/agent-protocol';
import { DEMO_PROMPTS } from '../shared/demo-prompts';
import { toDeclaration } from '../src/agent/agent-loop';
import { searchProducts } from '../src/store/selectors';
import { storeTools } from '../src/webmcp/tools';
import { toProductSummary } from '../src/webmcp/tools/serializers';
import { createApp } from './app';
import { loadConfig } from './config';
import { parseChatRequest } from './validation';

/**
 * A realistic request from the end of the Act 3 "boss prompt": the history of earlier acts plus
 * the boss cascade (17 messages), Gemini 3 thought signatures of a few KB on every model turn,
 * and the 11 real tool declarations exactly as the browser sends them.
 */

/** Gemini thought signatures are opaque base64 blobs of a few KB. */
const signature = () => randomBytes(3000).toString('base64');

const tools = storeTools.map((tool) =>
  toDeclaration({
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema,
    annotations: { readOnlyHint: false, untrustedContentHint: false, consequentialHint: false, debugging: false },
    origin: 'http://localhost:5173',
  }),
);

function callTurn(calls: { name: string; args: Record<string, unknown> }[]): ChatMessage {
  const functionCalls = calls.map((call, index) => ({ id: `call-${call.name}-${index}`, ...call }));
  return {
    role: 'model',
    functionCalls,
    // Gemini 3 signs only the first function call of a parallel batch.
    rawParts: functionCalls.map((functionCall, index) =>
      index === 0 ? { functionCall, thoughtSignature: signature() } : { functionCall },
    ),
  };
}

function textTurn(text: string): ChatMessage {
  // Gemini 3 often closes a text answer with an empty text part that carries the signature.
  return { role: 'model', text, functionCalls: [], rawParts: [{ text }, { text: '', thoughtSignature: signature() }] };
}

const output = (value: unknown) => ({ output: value });
const catalog = searchProducts({}).map(toProductSummary);
const helmets = searchProducts({ category: 'cascos', maxPrice: 1_200_000 }).map(toProductSummary);

const messages: ChatMessage[] = [
  { role: 'user', text: DEMO_PROMPTS.storeInfo },
  callTurn([{ name: 'get_store_info', args: {} }]),
  {
    role: 'tool',
    results: [
      {
        id: 'call-get_store_info-0',
        name: 'get_store_info',
        response: output({ hours: 'Lunes a sábado 9:00–19:00', shipping: { bogota: 0, national: 18000 } }),
      },
    ],
  },
  textTurn('Abrimos de lunes a sábado de 9:00 a 19:00. El envío fuera de Bogotá cuesta 18.000 COP.'),
  { role: 'user', text: DEMO_PROMPTS.catalog },
  callTurn([{ name: 'search_products', args: { certification: 'ECE 22.06', size: 'M', maxPrice: 1_200_000 } }]),
  { role: 'tool', results: [{ id: 'call-search_products-0', name: 'search_products', response: output({ count: catalog.length, products: catalog }) }] },
  textTurn('Encontré estos cascos ECE 22.06 en talla M por menos de 1.200.000 COP: '.repeat(4)),
  { role: 'user', text: DEMO_PROMPTS.boss },
  callTurn([
    { name: 'search_products', args: { category: 'cascos', certification: 'ECE 22.06', maxPrice: 1_200_000, size: 'M' } },
    { name: 'search_products', args: { query: 'pista', category: 'guantes', size: 'M' } },
  ]),
  {
    role: 'tool',
    results: [
      { id: 'call-search_products-0', name: 'search_products', response: output({ count: helmets.length, products: helmets }) },
      { id: 'call-search_products-1', name: 'search_products', response: output({ count: catalog.length, products: catalog }) },
    ],
  },
  callTurn([
    { name: 'add_to_cart', args: { productId: 'casco-altamira-gtr', size: 'M', quantity: 1 } },
    { name: 'add_to_cart', args: { productId: 'guantes-altamira-track', size: 'M', quantity: 1 } },
  ]),
  {
    role: 'tool',
    results: [
      { id: 'call-add_to_cart-0', name: 'add_to_cart', response: output({ ok: true, cart: { items: 1, totalCop: 980000 } }) },
      { id: 'call-add_to_cart-1', name: 'add_to_cart', response: output({ ok: true, cart: { items: 2, totalCop: 1300000 } }) },
    ],
  },
  callTurn([{ name: 'apply_coupon', args: { code: 'BIENVENIDA10' } }]),
  { role: 'tool', results: [{ id: 'call-apply_coupon-0', name: 'apply_coupon', response: output({ ok: true, totalCop: 1170000 }) }] },
  callTurn([{ name: 'open_cart', args: {} }]),
  { role: 'tool', results: [{ id: 'call-open_cart-0', name: 'open_cart', response: output({ ok: true, items: 2, totalCop: 1170000 }) }] },
];

const bossRequest: ChatRequest = { messages, tools };
const TOKEN = '0f3c9a7d1e5b8c2a4f6d0e9b7a1c3e5d';

describe('boss-prompt fixture', () => {
  it('is realistic: 17 messages, the 11 real tools, tens of KB, with headroom under the default body limit', () => {
    expect(messages).toHaveLength(17);
    expect(tools).toHaveLength(11);
    const bytes = Buffer.byteLength(JSON.stringify(bossRequest));
    expect(bytes).toBeGreaterThan(32 * 1024);
    // Act 4 (reviews, more turns) keeps growing this history: leave at least 2x headroom.
    expect(bytes * 2).toBeLessThanOrEqual(loadConfig({}, []).maxBodyBytes);
  });

  it('passes the default validation limits with every rawPart intact', () => {
    const result = parseChatRequest(structuredClone(bossRequest), loadConfig({}, []));
    expect(result.ok).toBe(true);
    if (result.ok) {
      const sent = bossRequest.messages.filter((m) => m.role === 'model').map((m) => m.role === 'model' && m.rawParts);
      const parsed = result.request.messages.filter((m) => m.role === 'model').map((m) => m.role === 'model' && m.rawParts);
      expect(parsed).toEqual(sent);
    }
  });

  it('passes the default body limit of a hosted proxy', async () => {
    const app = createApp(loadConfig({ AGENT_MODE: 'mock', WORKSHOP_TOKEN: TOKEN }, []));
    const response = await app.request(
      `/t/${TOKEN}/api/chat`,
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(bossRequest) },
      { incoming: { socket: { remoteAddress: '10.0.0.1' } } },
    );
    expect(response.status).toBe(200);
  });
});

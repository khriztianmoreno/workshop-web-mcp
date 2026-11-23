// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app';
import { ConfigError, configWarnings, loadConfig } from './config';

const mockConfig = loadConfig({ AGENT_MODE: 'mock' }, []);
const TOKEN = '0f3c9a7d1e5b8c2a4f6d0e9b7a1c3e5d';
const hostedConfig = loadConfig({ AGENT_MODE: 'mock', WORKSHOP_TOKEN: TOKEN }, []);

const validBody = {
  messages: [{ role: 'user', text: '¿Qué cascos hay en talla M?' }],
  tools: [{ name: 'search_products', description: 'search' }],
};

/** Node bindings as @hono/node-server passes them, so the app can read the socket address. */
const socket = (remoteAddress: string) => ({ incoming: { socket: { remoteAddress } } });

function postChat(
  app: ReturnType<typeof createApp>,
  { path = '/api/chat', headers = {}, body = JSON.stringify(validBody), ip = '10.0.0.1' }: {
    path?: string;
    headers?: Record<string, string>;
    body?: string;
    ip?: string;
  } = {},
) {
  return app.request(path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body }, socket(ip));
}

describe('config', () => {
  it('falls back to mock mode when there is no API key', () => {
    expect(loadConfig({}, []).mode).toBe('mock');
    expect(loadConfig({ GEMINI_API_KEY: 'x' }, []).mode).toBe('gemini');
    expect(loadConfig({ GEMINI_API_KEY: 'x' }, ['--mock']).mode).toBe('mock');
  });

  it('uses modest defaults locally', () => {
    const config = loadConfig({}, []);
    expect(config.workshopToken).toBeUndefined();
    expect(config.allowedOrigins).toEqual(['http://localhost:5173', 'http://127.0.0.1:5173']);
    expect(config.trustProxyHops).toBe(0);
    expect(config.rateLimitPerClient).toBe(60);
    expect(config.rateLimitGlobal).toBe(600);
    expect(config.authFailuresPerMinute).toBe(30);
    expect(config.maxBodyBytes).toBe(256 * 1024);
    expect(config.maxTextChars).toBe(8000);
    expect(config.maxModelTextChars).toBe(32000);
    expect(config.maxOutputTokens).toBe(8192);
    expect(config.thinkingLevel).toBeUndefined();
  });

  it('raises rate limits in hosted mode so a room behind one NAT fits', () => {
    const config = loadConfig({ WORKSHOP_TOKEN: TOKEN }, []);
    expect(config.rateLimitPerClient).toBe(600);
    expect(config.rateLimitGlobal).toBe(1500);
  });

  it('keeps explicit rate limits in hosted mode', () => {
    const config = loadConfig(
      { WORKSHOP_TOKEN: TOKEN, RATE_LIMIT_PER_MINUTE: '120', RATE_LIMIT_GLOBAL_PER_MINUTE: '900' },
      [],
    );
    expect(config.rateLimitPerClient).toBe(120);
    expect(config.rateLimitGlobal).toBe(900);
  });

  it('refuses a workshop token shorter than 24 characters', () => {
    expect(() => loadConfig({ WORKSHOP_TOKEN: 'devfest-bogota-2026' }, [])).toThrow(ConfigError);
    expect(() => loadConfig({ WORKSHOP_TOKEN: 'devfest-bogota-2026' }, [])).toThrow(/24.*openssl rand -hex 16/s);
    expect(() => loadConfig({ WORKSHOP_TOKEN: 'a'.repeat(24) }, [])).not.toThrow();
  });

  it('reads an optional Gemini thinking level and rejects unknown ones', () => {
    expect(loadConfig({ GEMINI_THINKING_LEVEL: 'low' }, []).thinkingLevel).toBe('LOW');
    expect(() => loadConfig({ GEMINI_THINKING_LEVEL: 'turbo' }, [])).toThrow(ConfigError);
  });

  it('warns when a hosted proxy allows every origin', () => {
    expect(configWarnings(loadConfig({ WORKSHOP_TOKEN: TOKEN, ALLOWED_ORIGINS: '*' }, []))).toEqual([
      expect.stringMatching(/ALLOWED_ORIGINS/),
    ]);
    expect(configWarnings(loadConfig({ ALLOWED_ORIGINS: '*' }, []))).toEqual([]);
    expect(configWarnings(loadConfig({ WORKSHOP_TOKEN: TOKEN }, []))).toEqual([]);
  });

  it('reads overrides from the environment', () => {
    const config = loadConfig(
      {
        WORKSHOP_TOKEN: ` ${TOKEN} `,
        ALLOWED_ORIGINS: 'https://a.example, https://b.example',
        TRUST_PROXY: '1',
        RATE_LIMIT_PER_MINUTE: '20',
        RATE_LIMIT_GLOBAL_PER_MINUTE: '200',
        MAX_BODY_BYTES: '1000',
        MAX_OUTPUT_TOKENS: '512',
        MAX_MODEL_TEXT_CHARS: '1000',
        AUTH_FAILURES_PER_MINUTE: '5',
      },
      [],
    );
    expect(config).toMatchObject({
      workshopToken: TOKEN,
      maxModelTextChars: 1000,
      authFailuresPerMinute: 5,
      allowedOrigins: ['https://a.example', 'https://b.example'],
      trustProxyHops: 1,
      rateLimitPerClient: 20,
      rateLimitGlobal: 200,
      maxBodyBytes: 1000,
      maxOutputTokens: 512,
    });
    expect(loadConfig({ TRUST_PROXY: 'true' }, []).trustProxyHops).toBe(1);
    expect(loadConfig({ TRUST_PROXY: '2' }, []).trustProxyHops).toBe(2);
    expect(loadConfig({ TRUST_PROXY: 'nope' }, []).trustProxyHops).toBe(0);
  });
});

describe('proxy app (local, no token)', () => {
  it('GET /api/health reports the mode', async () => {
    const response = await createApp(mockConfig).request('/api/health');
    expect(await response.json()).toMatchObject({ ok: true, mode: 'mock' });
  });

  it('POST /api/chat answers in mock mode without a token', async () => {
    const response = await postChat(createApp(mockConfig));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.mode).toBe('mock');
    expect(body.functionCalls[0].name).toBe('search_products');
  });

  it('also serves the path-token URL when no token is configured', async () => {
    const response = await postChat(createApp(mockConfig), { path: '/t/anything/api/chat' });
    expect(response.status).toBe(200);
  });

  it('rejects malformed bodies', async () => {
    const response = await createApp(mockConfig).request('/api/chat', { method: 'POST', body: '{"messages":[]}' });
    expect(response.status).toBe(400);
  });

  it('rejects invalid JSON with 400', async () => {
    const response = await postChat(createApp(mockConfig), { body: '{nope' });
    expect(response.status).toBe(400);
  });

  it('never leaks the API key in health', async () => {
    const config = loadConfig({ GEMINI_API_KEY: 'secret-key' }, []);
    const response = await createApp(config, () => ({ mode: 'gemini', functionCalls: [] })).request('/api/health');
    expect(await response.text()).not.toContain('secret-key');
  });
});

describe('workshop token', () => {
  it('rejects chat without a token with 401 and a Spanish hint', async () => {
    const response = await postChat(createApp(hostedConfig));
    expect(response.status).toBe(401);
    expect((await response.json()).error).toMatch(/token del taller/);
  });

  it('accepts the token as a path prefix (old-tag clients)', async () => {
    const response = await postChat(createApp(hostedConfig), { path: `/t/${TOKEN}/api/chat` });
    expect(response.status).toBe(200);
  });

  it('rejects a wrong path token', async () => {
    const response = await postChat(createApp(hostedConfig), { path: '/t/wrong-token/api/chat' });
    expect(response.status).toBe(401);
  });

  it('accepts Authorization: Bearer', async () => {
    const response = await postChat(createApp(hostedConfig), { headers: { authorization: `Bearer ${TOKEN}` } });
    expect(response.status).toBe(200);
  });

  it('accepts x-workshop-token', async () => {
    const response = await postChat(createApp(hostedConfig), { headers: { 'x-workshop-token': TOKEN } });
    expect(response.status).toBe(200);
  });

  it('rejects a wrong header token', async () => {
    const response = await postChat(createApp(hostedConfig), { headers: { authorization: 'Bearer nope' } });
    expect(response.status).toBe(401);
  });

  it('keeps /api/health public but minimal', async () => {
    const config = loadConfig({ GEMINI_API_KEY: 'secret-key', WORKSHOP_TOKEN: TOKEN }, []);
    const response = await createApp(config, () => ({ mode: 'gemini', functionCalls: [] })).request('/api/health');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, mode: 'gemini', model: config.model });
    expect(JSON.stringify(body)).not.toContain('secret-key');
    expect(JSON.stringify(body)).not.toContain(TOKEN);
  });

  it('serves health under the path token and rejects a wrong one', async () => {
    const app = createApp(hostedConfig);
    expect((await app.request(`/t/${TOKEN}/api/health`)).status).toBe(200);
    expect((await app.request('/t/wrong/api/health')).status).toBe(401);
  });

  it('answers 429 after too many failed tokens from one client', async () => {
    const config = loadConfig({ AGENT_MODE: 'mock', WORKSHOP_TOKEN: TOKEN, AUTH_FAILURES_PER_MINUTE: '3' }, []);
    const app = createApp(config);
    for (let i = 0; i < 3; i += 1) {
      expect((await postChat(app, { path: `/t/guess-${i}/api/chat`, ip: '10.6.6.6' })).status).toBe(401);
    }
    const blocked = await postChat(app, { headers: { authorization: 'Bearer guess' }, ip: '10.6.6.6' });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBe('60');
    // Once blocked, even the right token is not evaluated: a guess cannot be confirmed.
    expect((await postChat(app, { path: `/t/${TOKEN}/api/chat`, ip: '10.6.6.6' })).status).toBe(429);
    // Other clients are unaffected.
    expect((await postChat(app, { path: `/t/${TOKEN}/api/chat`, ip: '10.0.0.9' })).status).toBe(200);
  });

  it('does not count successful requests as auth failures', async () => {
    const config = loadConfig({ AGENT_MODE: 'mock', WORKSHOP_TOKEN: TOKEN, AUTH_FAILURES_PER_MINUTE: '1' }, []);
    const app = createApp(config);
    for (let i = 0; i < 3; i += 1) {
      expect((await postChat(app, { path: `/t/${TOKEN}/api/chat` })).status).toBe(200);
    }
  });
});

describe('request limits', () => {
  it('accepts a 200 KB body by default and rejects 300 KB', async () => {
    const app = createApp(mockConfig);
    const sized = (bytes: number) =>
      JSON.stringify({
        ...validBody,
        messages: [
          ...validBody.messages,
          { role: 'tool', results: [{ name: 'search_products', response: { blob: 'x'.repeat(bytes) } }] },
          { role: 'user', text: 'y' },
        ],
      });
    expect((await postChat(app, { body: sized(200 * 1024) })).status).toBe(200);
    expect((await postChat(app, { body: sized(300 * 1024) })).status).toBe(413);
  });

  it('rejects bodies over the byte limit with 413', async () => {
    const config = loadConfig({ AGENT_MODE: 'mock', MAX_BODY_BYTES: '2048' }, []);
    const body = JSON.stringify({ ...validBody, messages: [{ role: 'user', text: 'x'.repeat(4000) }] });
    const response = await postChat(createApp(config), { body });
    expect(response.status).toBe(413);
    expect((await response.json()).error).toMatch(/demasiado grande/);
  });

  it('rejects too many messages with 413', async () => {
    const config = loadConfig({ AGENT_MODE: 'mock', MAX_MESSAGES: '2' }, []);
    const body = JSON.stringify({ ...validBody, messages: Array.from({ length: 3 }, () => validBody.messages[0]) });
    const response = await postChat(createApp(config), { body });
    expect(response.status).toBe(413);
  });

  it('forwards only sanitized rawParts to the agent', async () => {
    const agent = vi.fn(() => ({ mode: 'mock' as const, functionCalls: [] }));
    const body = JSON.stringify({
      ...validBody,
      messages: [
        ...validBody.messages,
        { role: 'model', rawParts: [{ text: 'hola' }, { fileData: { fileUri: 'gs://evil' } }] },
      ],
    });
    const response = await postChat(createApp(mockConfig, agent), { body });
    expect(response.status).toBe(200);
    expect(JSON.stringify(agent.mock.calls[0])).not.toContain('gs://evil');
  });
});

describe('rate limiting', () => {
  it('limits per client using the socket address, ignoring spoofed x-forwarded-for', async () => {
    const config = loadConfig({ AGENT_MODE: 'mock', RATE_LIMIT_PER_MINUTE: '2' }, []);
    const app = createApp(config);
    expect((await postChat(app, { ip: '10.0.0.1', headers: { 'x-forwarded-for': '1.1.1.1' } })).status).toBe(200);
    expect((await postChat(app, { ip: '10.0.0.1', headers: { 'x-forwarded-for': '2.2.2.2' } })).status).toBe(200);
    const limited = await postChat(app, { ip: '10.0.0.1', headers: { 'x-forwarded-for': '3.3.3.3' } });
    expect(limited.status).toBe(429);
    expect((await limited.json()).error).toMatch(/Espera un minuto/);
    expect((await postChat(app, { ip: '10.0.0.2' })).status).toBe(200);
  });

  it('honors x-forwarded-for only with TRUST_PROXY', async () => {
    const config = loadConfig({ AGENT_MODE: 'mock', RATE_LIMIT_PER_MINUTE: '1', TRUST_PROXY: '1' }, []);
    const app = createApp(config);
    // Same load balancer socket, different real clients.
    expect((await postChat(app, { ip: '10.9.9.9', headers: { 'x-forwarded-for': '203.0.113.1' } })).status).toBe(200);
    expect((await postChat(app, { ip: '10.9.9.9', headers: { 'x-forwarded-for': '203.0.113.2' } })).status).toBe(200);
    expect((await postChat(app, { ip: '10.9.9.9', headers: { 'x-forwarded-for': '203.0.113.2' } })).status).toBe(429);
  });

  it('applies a global limit across clients', async () => {
    const config = loadConfig({ AGENT_MODE: 'mock', RATE_LIMIT_GLOBAL_PER_MINUTE: '2' }, []);
    const app = createApp(config);
    expect((await postChat(app, { ip: '10.0.0.1' })).status).toBe(200);
    expect((await postChat(app, { ip: '10.0.0.2' })).status).toBe(200);
    const limited = await postChat(app, { ip: '10.0.0.3' });
    expect(limited.status).toBe(429);
    expect((await limited.json()).error).toMatch(/saturado/);
  });

  it('does not count unauthenticated requests against the room', async () => {
    const config = loadConfig({ AGENT_MODE: 'mock', WORKSHOP_TOKEN: TOKEN, RATE_LIMIT_GLOBAL_PER_MINUTE: '1' }, []);
    const app = createApp(config);
    expect((await postChat(app)).status).toBe(401);
    expect((await postChat(app, { path: `/t/${TOKEN}/api/chat` })).status).toBe(200);
  });
});

describe('errors', () => {
  it('returns a generic 502 with a request id and logs the detail server-side', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = createApp(mockConfig, () => {
      throw new Error('upstream exploded: API key AIza-secret invalid');
    });
    const response = await postChat(app);
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain('AIza-secret');
    expect(body.requestId).toMatch(/^[0-9a-f-]{8,}$/);
    expect(body.error).toContain(body.requestId);
    expect(response.headers.get('x-request-id')).toBe(body.requestId);
    expect(log.mock.calls.flat().join(' ')).toContain(body.requestId);
    expect(log.mock.calls.flat().map(String).join(' ')).toContain('AIza-secret');
  });
});

describe('CORS', () => {
  it('allows the local dev origin by default, not every origin', async () => {
    const app = createApp(mockConfig);
    const local = await app.request('/api/health', { headers: { origin: 'http://localhost:5173' } });
    expect(local.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
    const other = await app.request('/api/health', { headers: { origin: 'https://evil.example' } });
    expect(other.headers.get('access-control-allow-origin')).not.toBe('https://evil.example');
    expect(other.headers.get('access-control-allow-origin')).not.toBe('*');
  });

  it('allows the token headers in preflight', async () => {
    const response = await createApp(hostedConfig).request('/api/chat', {
      method: 'OPTIONS',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'authorization, content-type',
      },
    });
    expect(response.status).toBeLessThan(300);
    expect(response.headers.get('access-control-allow-headers')?.toLowerCase()).toContain('authorization');
  });
});

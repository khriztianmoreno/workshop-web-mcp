import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ChatRequest, ChatResponse, HealthResponse } from '../shared/agent-protocol';
import type { ServerConfig } from './config';
import { createGeminiAgent } from './gemini-agent';
import { mockAgent } from './mock-agent';

type Agent = (request: ChatRequest) => Promise<ChatResponse> | ChatResponse;

const MAX_MESSAGES = 80;
const MAX_TOOLS = 64;

function isChatRequest(body: unknown): body is ChatRequest {
  if (!body || typeof body !== 'object') return false;
  const { messages, tools } = body as Partial<ChatRequest>;
  return (
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.length <= MAX_MESSAGES &&
    Array.isArray(tools) &&
    tools.length <= MAX_TOOLS &&
    tools.every((tool) => tool && typeof tool.name === 'string' && typeof tool.description === 'string')
  );
}

/** Naive fixed-window limiter, enough to protect a shared workshop key. */
function createRateLimiter(limitPerMinute: number) {
  const hits = new Map<string, { windowStart: number; count: number }>();
  return (key: string): boolean => {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now - entry.windowStart > 60_000) {
      hits.set(key, { windowStart: now, count: 1 });
      return true;
    }
    entry.count += 1;
    return entry.count <= limitPerMinute;
  };
}

export function createApp(config: ServerConfig, agentOverride?: Agent) {
  const app = new Hono();
  const agent: Agent =
    agentOverride ?? (config.mode === 'gemini' && config.apiKey ? createGeminiAgent(config.apiKey, config.model) : mockAgent);
  const allow = createRateLimiter(config.rateLimitPerMinute);

  app.use(
    '/api/*',
    cors({
      origin: config.allowedOrigins.includes('*') ? '*' : config.allowedOrigins,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['content-type'],
    }),
  );

  app.get('/api/health', (c) => {
    const body: HealthResponse = {
      ok: true,
      mode: config.mode,
      model: config.mode === 'gemini' ? config.model : undefined,
      reason: config.reason,
    };
    return c.json(body);
  });

  app.post('/api/chat', async (c) => {
    const client = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (!allow(client)) {
      return c.json({ error: 'Demasiadas solicitudes. Espera un minuto e intenta de nuevo.' }, 429);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'El cuerpo debe ser JSON.' }, 400);
    }
    if (!isChatRequest(body)) {
      return c.json({ error: 'Formato inválido: se esperaba { messages: ChatMessage[], tools: AgentToolDeclaration[] }.' }, 400);
    }

    try {
      return c.json(await agent(body));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[proxy] model call failed:', message);
      return c.json(
        { error: `La llamada al modelo falló: ${message}. Prueba AGENT_MODE=mock o el proxy del instructor.` },
        502,
      );
    }
  });

  return app;
}

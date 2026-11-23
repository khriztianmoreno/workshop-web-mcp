import { randomUUID } from 'node:crypto';
import type { HttpBindings } from '@hono/node-server';
import { Hono, type MiddlewareHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import type { ChatRequest, ChatResponse, HealthResponse } from '../shared/agent-protocol';
import type { ServerConfig } from './config';
import { createGeminiAgent } from './gemini-agent';
import { mockAgent } from './mock-agent';
import { clientIpFrom, createRateLimiter, tokensMatch } from './security';
import { parseChatRequest } from './validation';

type Agent = (request: ChatRequest) => Promise<ChatResponse> | ChatResponse;

/** `env` is only present when served by @hono/node-server; tests may omit it. */
type AppEnv = { Bindings: Partial<HttpBindings> | undefined; Variables: { requestId: string } };

const UNAUTHORIZED =
  'Falta el token del taller o no es válido. Revisa AGENT_BASE_URL o VITE_AGENT_URL: deben terminar en /t/<token>.';
const TOO_MANY_FROM_CLIENT = 'Demasiadas solicitudes desde tu conexión. Espera un minuto e intenta de nuevo.';
const TOO_MANY_GLOBAL =
  'El proxy del taller está saturado. Espera un minuto e intenta de nuevo, o usa el modo simulado (AGENT_MODE=mock).';

function headerToken(authorization: string | undefined, workshopHeader: string | undefined): string | undefined {
  const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  return bearer || workshopHeader?.trim() || undefined;
}

export function createApp(config: ServerConfig, agentOverride?: Agent) {
  const agent: Agent =
    agentOverride ??
    (config.mode === 'gemini' && config.apiKey
      ? createGeminiAgent(config.apiKey, config.model, { maxOutputTokens: config.maxOutputTokens })
      : mockAgent);
  const limiter = createRateLimiter({ perClient: config.rateLimitPerClient, global: config.rateLimitGlobal });

  const requestId: MiddlewareHandler<AppEnv> = async (c, next) => {
    const id = randomUUID();
    c.set('requestId', id);
    c.header('x-request-id', id);
    await next();
  };

  /**
   * Shared room token, enforced only when WORKSHOP_TOKEN is set. Accepted as a path prefix
   * (/t/<token>/api/...) so clients from old tags work by changing only their base URL, or
   * as Authorization: Bearer / x-workshop-token. /api/health stays public (it reveals only the mode).
   */
  const auth: MiddlewareHandler<AppEnv> = async (c, next) => {
    const expected = config.workshopToken;
    if (!expected) return next();
    const pathToken = (c.req.param() as Record<string, string | undefined>).token;
    if (pathToken !== undefined) {
      return tokensMatch(pathToken, expected) ? next() : c.json({ error: UNAUTHORIZED }, 401);
    }
    if (c.req.method === 'GET' && c.req.path === '/api/health') return next();
    const provided = headerToken(c.req.header('authorization'), c.req.header('x-workshop-token'));
    return tokensMatch(provided, expected) ? next() : c.json({ error: UNAUTHORIZED }, 401);
  };

  const rateLimit: MiddlewareHandler<AppEnv> = async (c, next) => {
    const client = clientIpFrom({
      socketAddress: c.env?.incoming?.socket?.remoteAddress,
      forwardedFor: c.req.header('x-forwarded-for'),
      trustProxyHops: config.trustProxyHops,
    });
    const verdict = limiter.check(client);
    if (verdict === 'ok') return next();
    c.header('retry-after', '60');
    return c.json({ error: verdict === 'client' ? TOO_MANY_FROM_CLIENT : TOO_MANY_GLOBAL }, 429);
  };

  const limitBody = bodyLimit({
    maxSize: config.maxBodyBytes,
    onError: (c) =>
      c.json(
        {
          error: `La conversación es demasiado grande (máximo ${Math.floor(config.maxBodyBytes / 1024)} KB). Usa "Nueva conversación" en el panel y vuelve a intentarlo.`,
        },
        413,
      ),
  });

  const api = new Hono<AppEnv>();
  api.use('*', requestId, auth);

  api.get('/health', (c) => {
    const body: HealthResponse = {
      ok: true,
      mode: config.mode,
      model: config.mode === 'gemini' ? config.model : undefined,
      // The reason is a local-development hint; a hosted proxy reveals only its mode.
      reason: config.workshopToken ? undefined : config.reason,
    };
    return c.json(body);
  });

  api.post('/chat', rateLimit, limitBody, async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'El cuerpo debe ser JSON.' }, 400);
    }
    const parsed = parseChatRequest(body, config);
    if (!parsed.ok) return c.json({ error: parsed.error }, parsed.status);

    try {
      return c.json(await agent(parsed.request));
    } catch (error) {
      const id = c.get('requestId');
      console.error(`[proxy] ${id} model call failed:`, error);
      return c.json(
        {
          error: `La llamada al modelo falló. Intenta de nuevo en un momento o usa AGENT_MODE=mock. (id: ${id})`,
          requestId: id,
        },
        502,
      );
    }
  });

  const app = new Hono<AppEnv>();
  app.use(
    '*',
    cors({
      origin: config.allowedOrigins.includes('*') ? '*' : config.allowedOrigins,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['content-type', 'authorization', 'x-workshop-token'],
      exposeHeaders: ['x-request-id'],
    }),
  );
  app.route('/api', api);
  app.route('/t/:token/api', api);

  app.onError((error, c) => {
    const id = c.get('requestId') ?? randomUUID();
    console.error(`[proxy] ${id} unexpected error:`, error);
    return c.json({ error: `Error interno del proxy. (id: ${id})`, requestId: id }, 500);
  });

  return app;
}

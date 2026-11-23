import 'dotenv/config';
import type { AgentMode } from '../shared/agent-protocol';
import type { RequestLimits } from './validation';

/**
 * Default model. Verified against the @google/genai 3.4.0 README examples and the
 * Gemini models page (stable "gemini-3.8-flash", Nov 2026). Override with GEMINI_MODEL.
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

/** Origins of the workshop app during `npm run dev`. Attendees' browsers run here too. */
export const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

export interface ServerConfig extends RequestLimits {
  port: number;
  mode: AgentMode;
  /** Why we are in this mode (shown in the UI tooltip when running locally). */
  reason: string;
  apiKey?: string;
  model: string;
  /** Shared room token. When unset, the proxy is open (local development). */
  workshopToken?: string;
  allowedOrigins: string[];
  /** Number of trusted reverse proxies appending to x-forwarded-for (0 = ignore the header). */
  trustProxyHops: number;
  rateLimitPerClient: number;
  rateLimitGlobal: number;
  maxBodyBytes: number;
  maxOutputTokens: number;
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value?.trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseTrustProxy(value: string | undefined): number {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'true' || normalized === 'yes') return 1;
  return positiveInt(normalized, 0);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env, argv: string[] = process.argv): ServerConfig {
  const apiKey = env.GEMINI_API_KEY?.trim() || undefined;
  const requested = (env.AGENT_MODE ?? '').trim().toLowerCase();
  const forceMock = argv.includes('--mock') || requested === 'mock';

  let mode: AgentMode = 'gemini';
  let reason = 'GEMINI_API_KEY configurada.';
  if (forceMock) {
    mode = 'mock';
    reason = 'AGENT_MODE=mock: agente simulado y determinista.';
  } else if (!apiKey) {
    mode = 'mock';
    reason = 'No hay GEMINI_API_KEY en .env: se usa el agente simulado.';
  }

  const origins = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    port: Number(env.PORT ?? 8787),
    mode,
    reason,
    apiKey,
    model: env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    workshopToken: env.WORKSHOP_TOKEN?.trim() || undefined,
    allowedOrigins: origins.length > 0 ? origins : DEFAULT_ALLOWED_ORIGINS,
    trustProxyHops: parseTrustProxy(env.TRUST_PROXY),
    rateLimitPerClient: positiveInt(env.RATE_LIMIT_PER_MINUTE, 60),
    rateLimitGlobal: positiveInt(env.RATE_LIMIT_GLOBAL_PER_MINUTE, 600),
    maxBodyBytes: positiveInt(env.MAX_BODY_BYTES, 64 * 1024),
    maxMessages: positiveInt(env.MAX_MESSAGES, 60),
    maxTextChars: positiveInt(env.MAX_TEXT_CHARS, 8000),
    maxTools: positiveInt(env.MAX_TOOLS, 32),
    maxToolSchemaBytes: positiveInt(env.MAX_TOOL_SCHEMA_BYTES, 8192),
    maxOutputTokens: positiveInt(env.MAX_OUTPUT_TOKENS, 4096),
  };
}

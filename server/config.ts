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

/** Shortest accepted WORKSHOP_TOKEN. `openssl rand -hex 16` gives 32 characters. */
export const MIN_WORKSHOP_TOKEN_LENGTH = 24;

/**
 * Rate limits per minute. A boss prompt is up to 9 /api/chat calls and a whole room can share
 * one NAT address, so a hosted proxy (WORKSHOP_TOKEN set) needs far more headroom per client.
 */
const RATE_LIMITS = {
  local: { perClient: 60, global: 600 },
  hosted: { perClient: 600, global: 1500 },
} as const;

/** Values accepted by ThinkingConfig.thinkingLevel in @google/genai 3.4.0 (enum ThinkingLevel). */
export const THINKING_LEVELS = ['MINIMAL', 'LOW', 'MEDIUM', 'HIGH', 'XHIGH'] as const;
export type ThinkingLevelName = (typeof THINKING_LEVELS)[number];

/** A configuration the server must refuse to start with. */
export class ConfigError extends Error {}

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
  /** Failed token attempts per client per minute before it gets 429s. */
  authFailuresPerMinute: number;
  maxBodyBytes: number;
  maxOutputTokens: number;
  /** Optional Gemini thinking level; unset = the model's default. */
  thinkingLevel?: ThinkingLevelName;
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

function parseWorkshopToken(value: string | undefined): string | undefined {
  const token = value?.trim() || undefined;
  if (token && token.length < MIN_WORKSHOP_TOKEN_LENGTH) {
    throw new ConfigError(
      `WORKSHOP_TOKEN is too short (${token.length} characters; minimum ${MIN_WORKSHOP_TOKEN_LENGTH}). ` +
        'Generate one with: openssl rand -hex 16',
    );
  }
  return token;
}

function parseThinkingLevel(value: string | undefined): ThinkingLevelName | undefined {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) return undefined;
  if ((THINKING_LEVELS as readonly string[]).includes(normalized)) return normalized as ThinkingLevelName;
  throw new ConfigError(`GEMINI_THINKING_LEVEL must be one of ${THINKING_LEVELS.join(', ')} (got "${value}").`);
}

/** Loads the server configuration. Throws ConfigError for settings the server must not start with. */
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

  const workshopToken = parseWorkshopToken(env.WORKSHOP_TOKEN);
  const rateDefaults = workshopToken ? RATE_LIMITS.hosted : RATE_LIMITS.local;

  return {
    port: Number(env.PORT ?? 8787),
    mode,
    reason,
    apiKey,
    model: env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    workshopToken,
    allowedOrigins: origins.length > 0 ? origins : DEFAULT_ALLOWED_ORIGINS,
    trustProxyHops: parseTrustProxy(env.TRUST_PROXY),
    rateLimitPerClient: positiveInt(env.RATE_LIMIT_PER_MINUTE, rateDefaults.perClient),
    rateLimitGlobal: positiveInt(env.RATE_LIMIT_GLOBAL_PER_MINUTE, rateDefaults.global),
    authFailuresPerMinute: positiveInt(env.AUTH_FAILURES_PER_MINUTE, 30),
    // History, tool declarations and Gemini 3 thought signatures accumulate across acts.
    maxBodyBytes: positiveInt(env.MAX_BODY_BYTES, 256 * 1024),
    maxMessages: positiveInt(env.MAX_MESSAGES, 60),
    maxTextChars: positiveInt(env.MAX_TEXT_CHARS, 8000),
    maxModelTextChars: positiveInt(env.MAX_MODEL_TEXT_CHARS, 32000),
    maxTools: positiveInt(env.MAX_TOOLS, 32),
    maxToolSchemaBytes: positiveInt(env.MAX_TOOL_SCHEMA_BYTES, 8192),
    // Thinking tokens count against this cap; too low a value yields empty replies.
    maxOutputTokens: positiveInt(env.MAX_OUTPUT_TOKENS, 8192),
    thinkingLevel: parseThinkingLevel(env.GEMINI_THINKING_LEVEL),
  };
}

/** Settings that are allowed but probably a mistake. Logged at startup. */
export function configWarnings(config: ServerConfig): string[] {
  const warnings: string[] = [];
  if (config.workshopToken && config.allowedOrigins.includes('*')) {
    warnings.push(
      'ALLOWED_ORIGINS is "*" while WORKSHOP_TOKEN is set: pages on any website may call this hosted proxy ' +
        'from a browser. Prefer the default (http://localhost:5173,http://127.0.0.1:5173).',
    );
  }
  return warnings;
}

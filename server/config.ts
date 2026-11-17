import 'dotenv/config';
import type { AgentMode } from '../shared/agent-protocol';

/**
 * Default model. Verified against the @google/genai 3.4.0 README examples and the
 * Gemini models page (stable "gemini-3.8-flash", Nov 2026). Override with GEMINI_MODEL.
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export interface ServerConfig {
  port: number;
  mode: AgentMode;
  /** Why we are in this mode (shown in the UI tooltip). */
  reason: string;
  apiKey?: string;
  model: string;
  allowedOrigins: string[];
  rateLimitPerMinute: number;
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

  return {
    port: Number(env.PORT ?? 8787),
    mode,
    reason,
    apiKey,
    model: env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    allowedOrigins: (env.ALLOWED_ORIGINS ?? '*')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    rateLimitPerMinute: Number(env.RATE_LIMIT_PER_MINUTE ?? 40),
  };
}

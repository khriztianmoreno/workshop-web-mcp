import type { ChatRequest, ChatResponse, HealthResponse } from '../../shared/agent-protocol';

/**
 * Base URL of the agent proxy. Empty = same origin (Vite proxies /api to the local server
 * or to AGENT_BASE_URL). Set VITE_AGENT_URL to call a hosted proxy directly from the browser.
 */
const BASE_URL = (import.meta.env.VITE_AGENT_URL ?? '').replace(/\/$/, '');

export async function postChat(body: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`El proxy respondió ${response.status}. ${detail}`.trim());
  }
  return (await response.json()) as ChatResponse;
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${BASE_URL}/api/health`, { signal });
  if (!response.ok) throw new Error(`Proxy no disponible (${response.status})`);
  return (await response.json()) as HealthResponse;
}

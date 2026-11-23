import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Constant-time token comparison. Both sides are hashed first so the comparison never
 * short-circuits on length and timingSafeEqual always gets equal-sized buffers.
 */
export function tokensMatch(provided: string | undefined, expected: string): boolean {
  if (!provided || !expected) return false;
  const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest();
  return timingSafeEqual(digest(provided), digest(expected));
}

export interface ClientIpInput {
  /** Address of the TCP peer (what the server actually sees). */
  socketAddress?: string;
  /** Raw x-forwarded-for header. Client-controlled unless a trusted proxy rewrites it. */
  forwardedFor?: string;
  /** How many reverse proxies in front of the server append to x-forwarded-for (0 = trust none). */
  trustProxyHops: number;
}

const normalize = (address: string) => address.trim().replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/, '');

/**
 * Resolves the client IP. x-forwarded-for is only honored when the operator says how many
 * proxies sit in front of us: each trusted proxy appends the address it saw, so the client is
 * the Nth entry from the right. Entries further left are whatever the client chose to send.
 */
export function clientIpFrom({ socketAddress, forwardedFor, trustProxyHops }: ClientIpInput): string {
  if (trustProxyHops > 0 && forwardedFor) {
    const hops = forwardedFor
      .split(',')
      .map((hop) => hop.trim())
      .filter(Boolean);
    const candidate = hops[hops.length - trustProxyHops];
    if (candidate) return normalize(candidate);
  }
  return socketAddress ? normalize(socketAddress) : 'unknown';
}

export type RateLimitVerdict = 'ok' | 'client' | 'global';

export interface RateLimiterOptions {
  perClient: number;
  global: number;
  windowMs?: number;
  /** Upper bound on tracked clients; beyond it, new clients share one overflow bucket. */
  maxClients?: number;
  now?: () => number;
}

const OVERFLOW_KEY = '\u0000overflow';

/** Fixed-window limiter with a per-client and a global budget. Memory is bounded. */
export function createRateLimiter({
  perClient,
  global,
  windowMs = 60_000,
  maxClients = 10_000,
  now = Date.now,
}: RateLimiterOptions) {
  const clients = new Map<string, { windowStart: number; count: number }>();
  let globalWindow = { windowStart: now(), count: 0 };
  let lastSweep = now();

  const expired = (windowStart: number, time: number) => time - windowStart >= windowMs;

  function sweep(time: number) {
    for (const [key, entry] of clients) {
      if (expired(entry.windowStart, time)) clients.delete(key);
    }
    lastSweep = time;
  }

  function check(rawKey: string): RateLimitVerdict {
    const time = now();
    if (time - lastSweep >= windowMs || clients.size >= maxClients) sweep(time);

    const key = clients.has(rawKey) || clients.size < maxClients ? rawKey : OVERFLOW_KEY;
    let entry = clients.get(key);
    if (!entry || expired(entry.windowStart, time)) {
      entry = { windowStart: time, count: 0 };
      clients.set(key, entry);
    }
    if (entry.count >= perClient) return 'client';
    entry.count += 1;

    if (expired(globalWindow.windowStart, time)) globalWindow = { windowStart: time, count: 0 };
    if (globalWindow.count >= global) return 'global';
    globalWindow.count += 1;
    return 'ok';
  }

  return { check, trackedClients: () => clients.size };
}

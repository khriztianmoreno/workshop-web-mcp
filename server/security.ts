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

interface WindowOptions {
  windowMs: number;
  maxClients: number;
  now: () => number;
}

/**
 * Per-key fixed-window counters with bounded memory: expired keys are swept once per window,
 * and beyond maxClients new keys share one overflow bucket so they cannot mint fresh quotas.
 */
function createWindowCounters({ windowMs, maxClients, now }: WindowOptions) {
  const entries = new Map<string, { windowStart: number; count: number }>();
  let lastSweep = now();

  const expired = (windowStart: number, time: number) => time - windowStart >= windowMs;

  function sweep(time: number) {
    for (const [key, entry] of entries) {
      if (expired(entry.windowStart, time)) entries.delete(key);
    }
    lastSweep = time;
  }

  /** The live counter for a key, starting a fresh window when needed. */
  function entryFor(rawKey: string, time: number) {
    if (time - lastSweep >= windowMs || entries.size >= maxClients) sweep(time);
    const key = entries.has(rawKey) || entries.size < maxClients ? rawKey : OVERFLOW_KEY;
    let entry = entries.get(key);
    if (!entry || expired(entry.windowStart, time)) {
      entry = { windowStart: time, count: 0 };
      entries.set(key, entry);
    }
    return entry;
  }

  return { entryFor, expired, size: () => entries.size };
}

/** Fixed-window limiter with a per-client and a global budget. Memory is bounded. */
export function createRateLimiter({
  perClient,
  global,
  windowMs = 60_000,
  maxClients = 10_000,
  now = Date.now,
}: RateLimiterOptions) {
  const clients = createWindowCounters({ windowMs, maxClients, now });
  let globalWindow = { windowStart: now(), count: 0 };

  function check(key: string): RateLimitVerdict {
    const time = now();
    const entry = clients.entryFor(key, time);
    if (entry.count >= perClient) return 'client';

    if (clients.expired(globalWindow.windowStart, time)) globalWindow = { windowStart: time, count: 0 };
    // A request the room budget rejects must not also spend the client's own quota.
    if (globalWindow.count >= global) return 'global';

    entry.count += 1;
    globalWindow.count += 1;
    return 'ok';
  }

  return { check, trackedClients: clients.size };
}

export interface FailureLimiterOptions {
  /** Failures allowed per client per window; at this count the client is blocked. */
  maxFailures: number;
  windowMs?: number;
  maxClients?: number;
  now?: () => number;
}

/**
 * Counts failed authentication attempts per client so the room token cannot be brute-forced.
 * Checking is free; only record() spends budget, so legitimate traffic is never counted.
 */
export function createFailureLimiter({
  maxFailures,
  windowMs = 60_000,
  maxClients = 10_000,
  now = Date.now,
}: FailureLimiterOptions) {
  const clients = createWindowCounters({ windowMs, maxClients, now });

  return {
    blocked: (key: string) => clients.entryFor(key, now()).count >= maxFailures,
    record: (key: string) => {
      clients.entryFor(key, now()).count += 1;
    },
    trackedClients: clients.size,
  };
}

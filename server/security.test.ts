// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { clientIpFrom, createRateLimiter, tokensMatch } from './security';

describe('tokensMatch', () => {
  it('accepts the exact token', () => {
    expect(tokensMatch('devfest-2026', 'devfest-2026')).toBe(true);
  });

  it('rejects a different token of the same length', () => {
    expect(tokensMatch('devfest-2027', 'devfest-2026')).toBe(false);
  });

  it('rejects tokens of a different length without throwing', () => {
    expect(tokensMatch('dev', 'devfest-2026')).toBe(false);
    expect(tokensMatch('devfest-2026-and-more', 'devfest-2026')).toBe(false);
  });

  it('rejects missing or empty tokens', () => {
    expect(tokensMatch(undefined, 'devfest-2026')).toBe(false);
    expect(tokensMatch('', 'devfest-2026')).toBe(false);
    expect(tokensMatch('', '')).toBe(false);
  });
});

describe('clientIpFrom', () => {
  it('uses the socket address and ignores x-forwarded-for by default', () => {
    expect(clientIpFrom({ socketAddress: '10.0.0.7', forwardedFor: '1.2.3.4', trustProxyHops: 0 })).toBe('10.0.0.7');
  });

  it('takes the right-most hop when one proxy is trusted', () => {
    expect(
      clientIpFrom({ socketAddress: '10.0.0.7', forwardedFor: 'spoofed, 203.0.113.9', trustProxyHops: 1 }),
    ).toBe('203.0.113.9');
  });

  it('walks N hops from the right when N proxies are trusted', () => {
    expect(
      clientIpFrom({ socketAddress: '10.0.0.7', forwardedFor: 'spoofed, 203.0.113.9, 10.1.1.1', trustProxyHops: 2 }),
    ).toBe('203.0.113.9');
  });

  it('falls back to the socket address when the header is missing or too short', () => {
    expect(clientIpFrom({ socketAddress: '10.0.0.7', trustProxyHops: 1 })).toBe('10.0.0.7');
    expect(clientIpFrom({ socketAddress: '10.0.0.7', forwardedFor: '203.0.113.9', trustProxyHops: 3 })).toBe('10.0.0.7');
  });

  it('normalizes IPv4-mapped IPv6 addresses and handles a missing socket', () => {
    expect(clientIpFrom({ socketAddress: '::ffff:192.168.1.20', trustProxyHops: 0 })).toBe('192.168.1.20');
    expect(clientIpFrom({ trustProxyHops: 0 })).toBe('unknown');
  });
});

describe('createRateLimiter', () => {
  function clock(start = 0) {
    let time = start;
    return { now: () => time, advance: (ms: number) => (time += ms) };
  }

  it('limits each client independently', () => {
    const { now } = clock();
    const limiter = createRateLimiter({ perClient: 2, global: 100, now });
    expect(limiter.check('a')).toBe('ok');
    expect(limiter.check('a')).toBe('ok');
    expect(limiter.check('a')).toBe('client');
    expect(limiter.check('b')).toBe('ok');
  });

  it('enforces a global limit across clients', () => {
    const { now } = clock();
    const limiter = createRateLimiter({ perClient: 10, global: 3, now });
    expect(limiter.check('a')).toBe('ok');
    expect(limiter.check('b')).toBe('ok');
    expect(limiter.check('c')).toBe('ok');
    expect(limiter.check('d')).toBe('global');
  });

  it('resets both windows after a minute', () => {
    const time = clock();
    const limiter = createRateLimiter({ perClient: 1, global: 1, now: time.now });
    expect(limiter.check('a')).toBe('ok');
    expect(limiter.check('a')).toBe('client');
    time.advance(60_001);
    expect(limiter.check('a')).toBe('ok');
  });

  it('evicts expired clients so memory does not grow forever', () => {
    const time = clock();
    const limiter = createRateLimiter({ perClient: 5, global: 1_000, now: time.now });
    for (let i = 0; i < 50; i += 1) limiter.check(`client-${i}`);
    expect(limiter.trackedClients()).toBe(50);
    time.advance(60_001);
    limiter.check('fresh');
    expect(limiter.trackedClients()).toBe(1);
  });

  it('bounds the number of tracked clients and shares an overflow bucket', () => {
    const { now } = clock();
    const limiter = createRateLimiter({ perClient: 1, global: 1_000, maxClients: 3, now });
    limiter.check('a');
    limiter.check('b');
    limiter.check('c');
    expect(limiter.check('d')).toBe('ok');
    expect(limiter.trackedClients()).toBeLessThanOrEqual(4);
    // New clients beyond the cap share one bucket, so they cannot mint fresh quotas.
    expect(limiter.check('e')).toBe('client');
  });
});

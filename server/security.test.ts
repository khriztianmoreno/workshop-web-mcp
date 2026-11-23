// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { clientIpFrom, createFailureLimiter, createRateLimiter, tokensMatch } from './security';

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

  it('does not spend a client quota when the global limit rejects', () => {
    const time = clock();
    const limiter = createRateLimiter({ perClient: 1, global: 1, now: time.now });
    expect(limiter.check('b')).toBe('ok');
    time.advance(30_000);
    expect(limiter.check('a')).toBe('global');
    // The global window (started at t=0) resets; a's own window (started at t=30s) does not.
    time.advance(31_000);
    expect(limiter.check('a')).toBe('ok');
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

describe('createFailureLimiter', () => {
  function clock(start = 0) {
    let time = start;
    return { now: () => time, advance: (ms: number) => (time += ms) };
  }

  it('blocks a client once it reaches the budget of distinct failed tokens', () => {
    const { now } = clock();
    const failures = createFailureLimiter({ maxFailures: 2, now });
    expect(failures.blocked('a')).toBe(false);
    failures.record('a', 'guess-1');
    expect(failures.blocked('a')).toBe(false);
    failures.record('a', 'guess-2');
    expect(failures.blocked('a')).toBe(true);
    expect(failures.blocked('b')).toBe(false);
  });

  it('counts the same wrong token only once', () => {
    const { now } = clock();
    const failures = createFailureLimiter({ maxFailures: 2, now });
    for (let i = 0; i < 100; i += 1) failures.record('a', 'typo-in-env');
    expect(failures.blocked('a')).toBe(false);
    expect(failures.distinctFailures('a')).toBe(1);
  });

  it('counts a missing token as one distinct value', () => {
    const { now } = clock();
    const failures = createFailureLimiter({ maxFailures: 2, now });
    for (let i = 0; i < 50; i += 1) failures.record('a', undefined);
    for (let i = 0; i < 50; i += 1) failures.record('a', '');
    expect(failures.blocked('a')).toBe(false);
    expect(failures.distinctFailures('a')).toBe(1);
  });

  it('checking does not count as a failure', () => {
    const { now } = clock();
    const failures = createFailureLimiter({ maxFailures: 1, now });
    for (let i = 0; i < 10; i += 1) expect(failures.blocked('a')).toBe(false);
  });

  it('forgets failures after the window', () => {
    const time = clock();
    const failures = createFailureLimiter({ maxFailures: 2, now: time.now });
    failures.record('a', 'guess-1');
    failures.record('a', 'guess-2');
    expect(failures.blocked('a')).toBe(true);
    time.advance(59_999);
    expect(failures.blocked('a')).toBe(true);
    time.advance(2);
    expect(failures.blocked('a')).toBe(false);
    expect(failures.distinctFailures('a')).toBe(0);
    // A token seen in the previous window counts again in the new one.
    failures.record('a', 'guess-1');
    expect(failures.distinctFailures('a')).toBe(1);
  });

  it('bounds the set of failed tokens kept per client', () => {
    const { now } = clock();
    const failures = createFailureLimiter({ maxFailures: 5, now });
    for (let i = 0; i < 1000; i += 1) failures.record('a', `guess-${i}`);
    expect(failures.distinctFailures('a')).toBe(5);
    expect(failures.blocked('a')).toBe(true);
  });

  it('bounds memory with a shared overflow bucket', () => {
    const { now } = clock();
    const failures = createFailureLimiter({ maxFailures: 1, maxClients: 2, now });
    failures.record('a', 'x');
    failures.record('b', 'x');
    failures.record('c', 'x');
    expect(failures.trackedClients()).toBeLessThanOrEqual(3);
    // 'd' is new and lands in the overflow bucket that 'c' already filled.
    expect(failures.blocked('d')).toBe(true);
  });
});

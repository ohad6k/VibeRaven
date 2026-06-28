import { describe, expect, it } from 'vitest';
import { createConsoleSessionToken, isAllowedConsoleOrigin, requireConsoleToken } from '../../src/console/security';

describe('console security', () => {
  it('creates non-empty session tokens', () => {
    expect(createConsoleSessionToken()).toMatch(/^[a-f0-9]{64}$/);
  });

  it('allows only local origins for the configured port', () => {
    expect(isAllowedConsoleOrigin('http://127.0.0.1:54321', 54321)).toBe(true);
    expect(isAllowedConsoleOrigin('http://localhost:54321', 54321)).toBe(true);
    expect(isAllowedConsoleOrigin('https://example.com', 54321)).toBe(false);
    expect(isAllowedConsoleOrigin('http://127.0.0.1:12345', 54321)).toBe(false);
  });

  it('requires exact bearer token', () => {
    expect(requireConsoleToken('Bearer abc', 'abc')).toBe(true);
    expect(requireConsoleToken('Bearer wrong', 'abc')).toBe(false);
    expect(requireConsoleToken(undefined, 'abc')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
const { ATTRIBUTION_HEADERS } = require('../dist/lib/attribution.js');

describe('attribution headers', () => {
  it('targets the public VibeRaven repo as HTTP-Referer', () => {
    expect(ATTRIBUTION_HEADERS['HTTP-Referer']).toBe('https://github.com/ohad6k/VibeRaven');
  });
  it('sets the OpenRouter leaderboard title to VibeRaven', () => {
    expect(ATTRIBUTION_HEADERS['X-OpenRouter-Title']).toBe('VibeRaven');
  });
  it('includes a client identifier', () => {
    expect(ATTRIBUTION_HEADERS['X-Viberaven-Client']).toMatch(/^mcp\//);
  });
});

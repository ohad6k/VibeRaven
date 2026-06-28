import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('mcp build', () => {
  it('emits dist/server.js', () => {
    expect(existsSync(resolve(process.cwd(), 'dist', 'server.js'))).toBe(true);
  });
});

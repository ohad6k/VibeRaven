import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(__dirname, '../../..');

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(repoRoot, path), 'utf8'));
}

function readText(path: string): string {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('public npm package licensing', () => {
  it.each([
    ['packages/cli/package.json', 'packages/cli/LICENSE'],
    ['packages/mcp/package.json', 'packages/mcp/LICENSE'],
    ['packages/viberaven-shim/package.json', 'packages/viberaven-shim/LICENSE'],
  ])('%s is MIT licensed for npm', (packagePath, licensePath) => {
    expect(readJson(packagePath).license).toBe('MIT');
    const license = readText(licensePath);
    expect(license).toContain('MIT License');
    expect(license).toContain('Copyright (c) 2026 VibeRaven');
  });

  it('keeps the public source root MIT licensed', () => {
    expect(readJson('package.json').license).toBe('MIT');
    expect(readText('LICENSE')).toContain('MIT License');
  });
});

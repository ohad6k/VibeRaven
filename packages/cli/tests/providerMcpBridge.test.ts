import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  findProviderMcpConfig,
  setMcpConfigPathsForTest,
  verifyProviderGap,
} from '../src/providerMcpBridge';

afterEach(() => {
  setMcpConfigPathsForTest();
});

describe('verifyProviderGap', () => {
  it('returns pro-required on free plan', async () => {
    const result = await verifyProviderGap({
      provider: 'supabase',
      check: 'rls_profiles',
      cwd: process.cwd(),
      plan: 'free',
    });

    expect(result).toEqual({
      verified: false,
      reason: 'pro-required',
      upgradeUrl: 'https://viberaven.dev/pricing',
    });
  });

  it('returns mcpUnavailable when pro plan has no MCP config', async () => {
    setMcpConfigPathsForTest([]);

    const result = await verifyProviderGap({
      provider: 'supabase',
      check: 'rls_profiles',
      cwd: process.cwd(),
      plan: 'pro',
    });

    expect(result).toEqual({
      verified: false,
      mcpUnavailable: true,
      fallbackCommand: 'npx -y viberaven audit --vercel-supabase --json',
    });
  });

  it('returns unsupported-provider for unknown providers', async () => {
    const result = await verifyProviderGap({
      provider: 'stripe',
      check: 'live_keys',
      cwd: process.cwd(),
      plan: 'pro',
    });

    expect(result).toEqual({
      verified: false,
      reason: 'unsupported-provider',
    });
  });
});

describe('findProviderMcpConfig', () => {
  it('reads supabase MCP config from cursor-style mcp.json', () => {
    const dir = mkdtempSync(join(tmpdir(), 'viberaven-mcp-config-'));
    const configPath = join(dir, 'mcp.json');
    writeFileSync(
      configPath,
      JSON.stringify({
        mcpServers: {
          supabase: {
            url: 'https://mcp.supabase.com/mcp?read_only=true',
          },
        },
      })
    );

    const config = findProviderMcpConfig('supabase', [configPath]);

    expect(config).toEqual({
      url: 'https://mcp.supabase.com/mcp?read_only=true',
      source: configPath,
    });
  });
});

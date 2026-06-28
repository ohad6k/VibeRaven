import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

let tempDir: string | undefined;

afterEach(async () => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.unmock('../../src/auth');
  vi.unmock('../../src/config');
  vi.unmock('../../src/runScan');
  vi.unmock('../../src/account');
  vi.unmock('../../src/terminalSummary');
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe('agent-mode action surface rendering contract', () => {
  it('prints the compact chat-native action surface from the scan manifest', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'viberaven-agent-actions-'));
    const logs: string[] = [];
    const originalArgv = process.argv;

    vi.spyOn(console, 'log').mockImplementation((message = '') => logs.push(String(message)));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    vi.doMock('../../src/auth', () => ({
      requireCredentials: vi.fn().mockResolvedValue({ accessToken: 'token-123' }),
      runDeviceLogin: vi.fn(),
    }));
    vi.doMock('../../src/config', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../src/config')>();
      return {
        ...actual,
        resolveApiBaseUrl: vi.fn(() => 'https://api.example.test'),
        resolveWorkspaceRoot: vi.fn().mockResolvedValue(tempDir),
      };
    });
    vi.doMock('../../src/runScan', () => ({
      runProjectScan: vi.fn().mockResolvedValue({
        ok: true,
        artifact: {
          version: 1,
          scannedAt: '2026-06-15T16:00:00.000Z',
          workspacePath: tempDir,
          score: 52,
          scoreLabel: 'Blocked',
          summary: 'Critical production gap.',
          archetype: 'next',
          gaps: [
            {
              id: 'DB_RLS_001',
              title: 'Supabase RLS missing',
              detail: 'Table leads has no RLS policy',
              severity: 'critical',
              primaryMapCategory: 'database',
              prompt: 'Fix RLS',
            },
          ],
          missionGraph: { nodes: [], edges: [] },
          stackWiring: {},
          providerRegistry: {},
          verificationSummary: {},
          productionCorePercent: 52,
        },
      }),
    }));
    vi.doMock('../../src/account', () => ({
      enrichArtifactWithAccount: vi.fn(async (artifact) => artifact),
      fetchAccountMe: vi.fn(),
      formatScanLimitMessage: vi.fn(),
      formatUsageLine: vi.fn(() => 'Scans: 1/2'),
    }));
    vi.doMock('../../src/terminalSummary', () => ({ printScanSummary: vi.fn() }));

    process.argv = ['node', 'cli.js', '--agent-mode'];
    const { main } = await import('../../src/cli');
    const code = await main();
    process.argv = originalArgv;

    const output = logs.join('\n');
    expect(code).toBe(0);
    expect(output).toContain('VibeRaven Production Actions');
    expect(output).toContain('Showing:');
    expect(output).toContain('Full state: .viberaven/actions.json');
  });
});

import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { writeScanArtifacts } from '../src/artifacts';
import { renderGateResultJson } from '../src/output/json';
import { renderJsonlEvents } from '../src/output/jsonl';

let tempDir: string | undefined;

afterEach(async () => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.unmock('../src/auth');
  vi.unmock('../src/config');
  vi.unmock('../src/runScan');
  vi.unmock('../src/account');
  vi.unmock('../src/terminalSummary');
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
  tempDir = undefined;
});

describe('agent machine output from written artifacts', () => {
  it('renders JSON and JSONL from gate-result.json', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'viberaven-agent-output-'));
    await mkdir(tempDir, { recursive: true });

    const paths = await writeScanArtifacts({
      cwd: tempDir,
      artifact: {
        version: 1,
        scannedAt: '2026-06-08T09:30:00.000Z',
        workspacePath: tempDir,
        score: 75,
        scoreLabel: 'Needs work',
        summary: 'summary',
        archetype: 'next',
        gaps: [{
          id: 'SEC_ENV_001',
          title: 'Service role key exposed',
          detail: 'secret detail',
          severity: 'critical',
          primaryMapCategory: 'security',
          prompt: 'fix'
        }],
        missionGraph: { nodes: [], edges: [] } as never,
        stackWiring: {} as never,
        providerRegistry: {} as never,
        verificationSummary: {} as never,
        productionCorePercent: 75
      }
    });

    const gate = JSON.parse(await readFile(paths.gateResultPath, 'utf8'));
    expect(JSON.parse(renderGateResultJson(gate)).gate.status).toBe('not_clear');
    expect(renderJsonlEvents(gate)).toContain('"type":"viberaven.run.completed"');
  });

  it('prints only gate-result JSON to stdout in agent JSON mode and still applies strict exit code', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'viberaven-agent-json-main-'));
    const stdout: string[] = [];
    const logs: string[] = [];
    const errors: string[] = [];
    const originalArgv = process.argv;

    vi.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => {
      stdout.push(String(chunk));
      return true;
    });
    vi.spyOn(console, 'log').mockImplementation((message = '') => logs.push(String(message)));
    vi.spyOn(console, 'error').mockImplementation((message = '') => errors.push(String(message)));

    vi.doMock('../src/auth', () => ({
      requireCredentials: vi.fn().mockResolvedValue({ accessToken: 'token-123' }),
      runDeviceLogin: vi.fn(),
    }));
    vi.doMock('../src/config', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../src/config')>();
      return {
        ...actual,
        resolveApiBaseUrl: vi.fn(() => 'https://api.example.test'),
        resolveWorkspaceRoot: vi.fn().mockResolvedValue(tempDir),
      };
    });
    vi.doMock('../src/runScan', () => ({
      runProjectScan: vi.fn().mockResolvedValue({
        ok: true,
        artifact: {
          version: 1,
          scannedAt: '2026-06-08T09:30:00.000Z',
          workspacePath: tempDir,
          score: 52,
          scoreLabel: 'Blocked',
          summary: 'Critical production gap.',
          archetype: 'next',
          gaps: [{
            id: 'DB_RLS_001',
            title: 'Supabase RLS missing',
            detail: 'Table leads has no RLS policy',
            severity: 'critical',
            primaryMapCategory: 'database',
            prompt: 'Fix RLS',
          }],
          missionGraph: { nodes: [], edges: [] },
          stackWiring: {},
          providerRegistry: {},
          verificationSummary: {},
          productionCorePercent: 52,
        },
      }),
    }));
    vi.doMock('../src/account', () => ({
      enrichArtifactWithAccount: vi.fn(async (artifact) => ({
        ...artifact,
        usage: {
          plan: 'free',
          used: 1,
          limit: 2,
          period: 'month',
          remainingPrompts: null,
          unlockedMapCategoryKeys: [],
        },
      })),
      fetchAccountMe: vi.fn(),
      formatScanLimitMessage: vi.fn(),
      formatUsageLine: vi.fn(() => 'Scans: 1/2'),
    }));
    vi.doMock('../src/terminalSummary', () => ({ printScanSummary: vi.fn() }));

    process.argv = ['node', 'cli.js', '--agent-mode', '--strict', '--json'];
    const { main } = await import('../src/cli');
    const code = await main();
    process.argv = originalArgv;

    const output = stdout.join('');
    expect(code).toBe(1);
    expect(JSON.parse(output).gate.status).toBe('not_clear');
    expect(output.trim().startsWith('{')).toBe(true);
    expect(logs).toEqual([]);
    expect(errors).toEqual([]);
  });
});

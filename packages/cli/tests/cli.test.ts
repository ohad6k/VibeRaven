import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatScanJsonStdout, parseArgs } from '../src/cli';
import type { CliScanArtifact } from '../src/types';

afterEach(() => {
  vi.resetModules();
  vi.unmock('../../../src/station/orchestrator');
  vi.unmock('../../../src/station/fileScanner');
  vi.unmock('../../../src/station/backendClient');
  vi.unmock('../src/config');
});

describe('parseArgs', () => {
  it('treats --version and -v as version flags', () => {
    expect(parseArgs(['--version'])).toEqual({
      command: '',
      flags: { version: true },
      positional: []
    });
    expect(parseArgs(['-v'])).toEqual({
      command: '',
      flags: { version: true },
      positional: []
    });
  });

  it('treats version as a command', () => {
    expect(parseArgs(['version'])).toEqual({
      command: 'version',
      flags: {},
      positional: []
    });
  });

  it('parses watch command flags', () => {
    expect(parseArgs(['watch', '--api-url', 'https://api.example.test'])).toEqual({
      command: 'watch',
      flags: { 'api-url': 'https://api.example.test' },
      positional: []
    });
  });

  it('parses connect session and token flags', () => {
    expect(parseArgs(['connect', '--session', 'launch-123', '--token', 'token-123'])).toEqual({
      command: 'connect',
      flags: { session: 'launch-123', token: 'token-123' },
      positional: []
    });
  });

  it('parses leading-hyphen connect session and token flag values', () => {
    expect(parseArgs(['connect', '--session', '-launch-123', '--token', '-abc123'])).toEqual({
      command: 'connect',
      flags: { session: '-launch-123', token: '-abc123' },
      positional: []
    });
  });

  it('parses agent-mode, json, jsonl, strict, and condense as boolean flags', () => {
    expect(parseArgs(['--agent-mode', '--json'])).toEqual({
      command: '',
      flags: { 'agent-mode': true, json: true },
      positional: [],
    });
    expect(parseArgs(['--agent-mode', '--jsonl'])).toEqual({
      command: '',
      flags: { 'agent-mode': true, jsonl: true },
      positional: [],
    });
    expect(parseArgs(['--strict'])).toEqual({
      command: '',
      flags: { strict: true },
      positional: [],
    });
    expect(parseArgs(['--strict=warning'])).toEqual({
      command: '',
      flags: { strict: 'warning' },
      positional: [],
    });
    expect(parseArgs(['--condense'])).toEqual({
      command: '',
      flags: { condense: true },
      positional: [],
    });
    expect(parseArgs(['--verify', '--force-scan'])).toEqual({
      command: '',
      flags: { verify: true, 'force-scan': true },
      positional: [],
    });
  });
});

describe('help output', () => {
  it('documents agent-mode, strict, condense, and artifact paths', async () => {
    const { printHelp } = await import('../src/cli');
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((message = '') => logs.push(String(message)));
    printHelp();
    const output = logs.join('\n');
    expect(output).toContain('viberaven --agent-mode [--json|--jsonl]');
    expect(output).toContain('viberaven --strict[=warning]');
    expect(output).toContain('viberaven --condense');
    expect(output).toContain('viberaven preview [--agent-mode] [--json]');
    expect(output).toContain('.viberaven/gate-result.json');
    expect(output).toContain('.viberaven/context-map.json');
    expect(output).toContain('viberaven init [--agents all');
    expect(output).toContain('viberaven doctor --agents');
  });
});

describe('formatScanJsonStdout', () => {
  it('redacts secret-like evidence before JSON stdout', () => {
    const artifact = {
      version: 1,
      summary: 'Authorization: Bearer secret-token-value',
      gaps: [
        {
          id: 'g1',
          title: 'Secret evidence',
          copyPrompt: 'Set STRIPE_SECRET_KEY=rk_live_abcdefghijklmnopqrst'
        }
      ]
    } as unknown as CliScanArtifact;

    const json = formatScanJsonStdout(artifact);

    expect(json).not.toContain('secret-token-value');
    expect(json).not.toContain('rk_live_abcdefghijklmnopqrst');
    expect(json).toContain('[REDACTED');
  });
});

describe('runProjectScan', () => {
  it('preserves providerTruth and launchValidation in scan artifacts', async () => {
    vi.resetModules();

    vi.doMock('../../../src/station/orchestrator', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../../src/station/orchestrator')>();
      return {
        ...actual,
        createStationOrchestrator: vi.fn(() => ({
          run: vi.fn().mockResolvedValue({
            score: 82,
            scoreLabel: 'Launchable',
            summary: 'Ready with proof gaps.',
            archetype: 'SaaS',
            gaps: [],
            missionGraph: { areas: [] },
            stackWiring: { areas: [] },
            stackAutomation: { areas: [] },
            providerRegistry: { version: 1, providers: [] },
            verificationSummary: { checkedAt: '2026-06-05T00:00:00.000Z', checks: [] },
            providerTruth: { version: 1, generatedAt: '2026-06-05T00:00:00.000Z', areas: [] },
            launchValidation: {
              version: 1,
              generatedAt: '2026-06-05T00:00:00.000Z',
              status: 'blocked',
              issues: [],
              summary: 'Missing live proof.'
            }
          })
        }))
      };
    });
    vi.doMock('../../../src/station/fileScanner', () => ({ deepScanWorkspace: vi.fn() }));
    vi.doMock('../../../src/station/backendClient', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../../src/station/backendClient')>();
      return { ...actual, runManagedStation: vi.fn() };
    });
    vi.doMock('../src/config', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../src/config')>();
      return {
        ...actual,
        loadStackChoicesFile: vi.fn().mockResolvedValue({ version: 1, choices: {} })
      };
    });

    const { runProjectScan } = await import('../src/runScan');
    const result = await runProjectScan({
      workspacePath: 'D:\\workspace',
      accessToken: 'test-token',
      apiBaseUrl: 'https://api.example.test'
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(`Expected successful scan, got ${result.kind}`);
    }
    expect(result.artifact.providerTruth).toEqual(expect.objectContaining({ version: 1 }));
    expect(result.artifact.launchValidation).toEqual(
      expect.objectContaining({ status: expect.any(String) })
    );
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.resetModules();
  vi.unmock('../src/auth');
  vi.unmock('../src/config');
  vi.unmock('../src/runScan');
  vi.unmock('../src/artifacts');
  vi.unmock('../src/account');
  vi.unmock('../src/terminalSummary');
});

describe('runScanCommand', () => {
  it('runs browser login once and then continues the scan when credentials are missing', async () => {
    const requireCredentials = vi
      .fn()
      .mockRejectedValueOnce(new Error('LOGIN_REQUIRED: Not signed in.'))
      .mockResolvedValueOnce({ accessToken: 'access-token-123', apiBaseUrl: 'https://api.example.test' });
    const runDeviceLogin = vi.fn().mockResolvedValue(undefined);
    const logs: string[] = [];
    const errors: string[] = [];
    const runProjectScan = vi.fn().mockResolvedValue({
      ok: true,
      artifact: {
        version: 1,
        score: 80,
        scoreLabel: 'Launchable',
        productionCorePercent: 80,
        summary: 'Ready with follow-up checks.',
        gaps: []
      }
    });
    vi.spyOn(console, 'log').mockImplementation((message = '') => logs.push(String(message)));
    vi.spyOn(console, 'error').mockImplementation((message = '') => errors.push(String(message)));

    vi.doMock('../src/auth', () => ({ requireCredentials, runDeviceLogin }));
    vi.doMock('../src/config', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../src/config')>();
      return {
        ...actual,
        resolveApiBaseUrl: vi.fn(() => 'https://api.example.test'),
        resolveWorkspaceRoot: vi.fn().mockResolvedValue('D:\\workspace')
      };
    });
    vi.doMock('../src/runScan', () => ({ runProjectScan }));
    vi.doMock('../src/artifacts', () => ({
      writeScanArtifacts: vi.fn().mockResolvedValue({
        reportPath: 'D:\\workspace\\.viberaven\\report.html',
        summaryPath: 'D:\\workspace\\.viberaven\\agent-summary.md',
        playbookPath: 'D:\\workspace\\.viberaven\\launch-playbook.md',
        jsonPath: 'D:\\workspace\\.viberaven\\last-scan.json'
      })
    }));
    vi.doMock('../src/account', () => ({
      enrichArtifactWithAccount: vi.fn(async (artifact) => artifact),
      fetchAccountMe: vi.fn(),
      formatScanLimitMessage: vi.fn(),
      formatUsageLine: vi.fn()
    }));
    vi.doMock('../src/terminalSummary', () => ({ printScanSummary: vi.fn() }));

    const { runScanCommand } = await import('../src/cli');

    const result = await runScanCommand({}, []);

    expect(result.exitCode).toBe(0);
    expect(logs.join('\n')).toContain(
      'LOGIN_REQUIRED: Starting VibeRaven browser sign-in so this scan can continue.'
    );
    expect(logs.join('\n')).toContain(
      'AGENT_ACTION: Open the VibeRaven approval URL for the user if the browser does not open automatically.'
    );
    expect(logs.join('\n')).toContain('LOGIN_RESUME: Sign-in complete. Continuing the original scan.');
    expect(runDeviceLogin).toHaveBeenCalledWith('https://api.example.test');
    expect(requireCredentials).toHaveBeenCalledTimes(2);
    expect(runProjectScan).toHaveBeenCalledTimes(1);
    expect(runProjectScan).toHaveBeenCalledWith({
      workspacePath: 'D:\\workspace',
      accessToken: 'access-token-123',
      apiBaseUrl: 'https://api.example.test'
    });
    expect(errors).toHaveLength(0);
  });
});

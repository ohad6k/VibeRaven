import { access, mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getCredentialsPath } from '../src/config';
import type { RunProjectScanFn } from '../src/runnerConnect';
import {
  buildRunnerHandshakeRequest,
  collectLocalRepoMetadata,
  detectPackageManager,
  parseRunnerConnectFlags,
  pollRunnerJobsOnce,
  postRunnerHandshake,
  runRunnerConnect,
  runRunnerWatchLoop
} from '../src/runnerConnect';
import type { CliScanArtifact } from '../src/types';

async function makeWorkspace(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'vr-runner-'));
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function makeConfigDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'vr-config-'));
  vi.stubEnv('VIBERAVEN_CONFIG_DIR', dir);
  return dir;
}

function handshakeResponse() {
  return {
    runnerSession: {
      id: 'runner-1',
      deploySessionId: 'deploy-1',
      state: 'repo_matched',
      capabilities: ['read_files', 'run_build', 'run_tests'],
      repoMatch: 'matched',
      createdAt: '2026-06-05T00:00:00.000Z',
      updatedAt: '2026-06-05T00:00:00.000Z'
    },
    runnerAccessToken: 'runner-secret',
    repoMatch: 'matched',
    allowedJobKinds: ['run_build', 'run_tests'],
    pollAfterMs: 3000
  };
}

function emptyJobsFetchMock(onJobsPoll?: () => void) {
  return vi.fn(async (url: string, init: RequestInit) => {
    if (url.endsWith('/v1/runner/handshake')) {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(handshakeResponse())
      };
    }
    if (url.endsWith('/v1/runner/sessions/runner-1/jobs')) {
      onJobsPoll?.();
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ jobs: [] })
      };
    }
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify({ ok: true })
    };
  });
}

async function saveCliCredentials(overrides: Record<string, string> = {}) {
  await makeConfigDir();
  await writeFile(
    getCredentialsPath(),
    `${JSON.stringify({
      accessToken: 'account-access-token',
      apiBaseUrl: 'https://api.example.test',
      ...overrides
    })}\n`,
    'utf-8'
  );
}

function mockScanArtifact(workspace: string): CliScanArtifact {
  return {
    version: 1,
    scannedAt: '2026-06-07T00:00:00.000Z',
    workspacePath: workspace,
    score: 82,
    scoreLabel: 'Launchable',
    summary: 'Ready with gaps. DATABASE_URL=postgres://user:password@localhost:5432/app',
    archetype: 'SaaS',
    gaps: [
      {
        id: 'gap-env',
        title: 'Document DATABASE_URL',
        detail: 'Add DATABASE_URL to .env.example',
        severity: 'warning',
        primaryMapCategory: 'database',
        copyPrompt: 'Add DATABASE_URL to .env.example'
      }
    ],
    missionGraph: {
      areas: [
        {
          key: 'database',
          label: 'Database',
          readinessPercent: 70,
          providerMissions: [
            {
              provider: 'supabase',
              providerLabel: 'Supabase',
              readinessPercent: 70,
              checks: []
            }
          ]
        }
      ]
    },
    stackWiring: { areas: [] },
    providerRegistry: { version: 1, providers: [] },
    verificationSummary: { checkedAt: '2026-06-07T00:00:00.000Z', checks: [] },
    productionCorePercent: 70
  };
}

function mockRunProjectScan(workspace: string): RunProjectScanFn {
  return vi.fn(async () => ({ ok: true as const, artifact: mockScanArtifact(workspace) }));
}

async function runQueuedJob(
  workspace: string,
  job: Record<string, unknown>,
  options: { runProjectScan?: RunProjectScanFn } = {}
) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    if (url.endsWith('/v1/runner/sessions/runner-1/jobs')) {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ jobs: [job] })
      };
    }
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify({ ok: true })
    };
  });

  await pollRunnerJobsOnce({
    apiBaseUrl: 'https://api.example.test',
    workspaceRoot: workspace,
    runnerSessionId: 'runner-1',
    runnerAccessToken: 'runner-secret',
    commandRunner: async () => ({ ok: false, stdout: '', stderr: 'unexpected command' }),
    fetchImpl: fetchMock,
    runProjectScan: options.runProjectScan
  });

  const resultCall = calls.find((call) => call.url.endsWith('/v1/runner/jobs/job-1/result'));
  expect(resultCall).toBeTruthy();
  return {
    body: JSON.parse(String(resultCall?.init.body)),
    runProjectScan: options.runProjectScan
  };
}

describe('runner watch loop', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('polls repeatedly until the watch signal aborts', async () => {
    const workspace = await makeWorkspace();
    let pollCount = 0;
    const controller = new AbortController();
    const fetchMock = emptyJobsFetchMock(() => {
      pollCount += 1;
      if (pollCount >= 2) {
        controller.abort();
      }
    });

    await runRunnerWatchLoop({
      apiBaseUrl: 'https://api.example.test',
      workspaceRoot: workspace,
      runnerSessionId: 'runner-1',
      runnerAccessToken: 'runner-secret',
      fetchImpl: fetchMock,
      pollIntervalMs: 1,
      signal: controller.signal
    });

    expect(pollCount).toBeGreaterThanOrEqual(2);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/jobs'))).toHaveLength(pollCount);
  });

  it('persists runner session credentials after a successful connect handshake', async () => {
    await makeConfigDir();
    const workspace = await makeWorkspace();
    const fetchMock = emptyJobsFetchMock();

    await expect(
      runRunnerConnect({
        launchSessionId: 'deploy-1',
        oneTimeToken: 'token-123',
        once: true,
        apiBaseUrl: 'https://api.example.test',
        workspaceRoot: workspace,
        runnerVersion: '0.1.0-test',
        fetchImpl: fetchMock
      })
    ).resolves.toMatchObject({ runnerSession: { id: 'runner-1' } });

    const saved = JSON.parse(await readFile(getCredentialsPath(), 'utf-8'));
    expect(saved).toMatchObject({
      runnerSessionId: 'runner-1',
      runnerAccessToken: 'runner-secret',
      apiBaseUrl: 'https://api.example.test'
    });
    expect(JSON.stringify(saved)).not.toContain('token-123');
  });

  it('does not poll jobs during connect when once is false', async () => {
    await makeConfigDir();
    const workspace = await makeWorkspace();
    const fetchMock = emptyJobsFetchMock();

    await expect(
      runRunnerConnect({
        launchSessionId: 'deploy-1',
        oneTimeToken: 'token-123',
        once: false,
        apiBaseUrl: 'https://api.example.test',
        workspaceRoot: workspace,
        runnerVersion: '0.1.0-test',
        fetchImpl: fetchMock
      })
    ).resolves.toMatchObject({ runnerSession: { id: 'runner-1' } });

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      'https://api.example.test/v1/runner/handshake'
    ]);
  });
});

describe('detectPackageManager', () => {
  it('prefers lockfiles without reading package contents', async () => {
    const workspace = await makeWorkspace();
    await writeFile(join(workspace, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n', 'utf-8');
    await writeFile(join(workspace, 'package-lock.json'), '{}\n', 'utf-8');

    await expect(detectPackageManager(workspace)).resolves.toBe('pnpm');
  });

  it('returns unknown when no known lockfile is present', async () => {
    await expect(detectPackageManager(await makeWorkspace())).resolves.toBe('unknown');
  });
});

describe('collectLocalRepoMetadata', () => {
  it('redacts git remote credentials and includes branch/head/dirty/package manager', async () => {
    const workspace = await makeWorkspace();
    await writeFile(join(workspace, 'package-lock.json'), '{}\n', 'utf-8');

    const localRepo = await collectLocalRepoMetadata(workspace, async (_command, args) => {
      if (args.join(' ') === 'remote -v') {
        return {
          ok: true,
          stdout:
            'origin\thttps://user:secret@github.com/acme/app.git (fetch)\norigin\thttps://user:secret@github.com/acme/app.git (push)\n'
        };
      }
      if (args.join(' ') === 'branch --show-current') {
        return { ok: true, stdout: 'main\n' };
      }
      if (args.join(' ') === 'rev-parse HEAD') {
        return { ok: true, stdout: '0123456789abcdef0123456789abcdef01234567\n' };
      }
      if (args.join(' ') === 'status --porcelain') {
        return { ok: true, stdout: ' M src/app.ts\n' };
      }
      return { ok: false, stdout: '', stderr: 'unexpected command' };
    });

    expect(localRepo).toEqual({
      rootName: expect.any(String),
      remotes: [
        {
          name: 'origin',
          normalizedUrl: 'https://github.com/acme/app',
          provider: 'github'
        }
      ],
      branch: 'main',
      headSha: '0123456789abcdef0123456789abcdef01234567',
      dirty: true,
      packageManager: 'npm'
    });
    expect(localRepo.rootName).toMatch(/^vr-runner-/);
    expect(JSON.stringify(localRepo)).not.toContain('secret');
  });

  it('handles unavailable git metadata without throwing', async () => {
    const workspace = await makeWorkspace();

    const localRepo = await collectLocalRepoMetadata(workspace, async () => ({
      ok: false,
      stdout: '',
      stderr: 'not a git repo'
    }));

    expect(localRepo).toEqual({
      rootName: expect.any(String),
      remotes: [],
      branch: null,
      headSha: null,
      dirty: undefined,
      packageManager: 'unknown'
    });
  });

  it('omits Windows local path remotes from redacted metadata', async () => {
    const workspace = await makeWorkspace();

    const localRepo = await collectLocalRepoMetadata(workspace, async (_command, args) => {
      if (args.join(' ') === 'remote -v') {
        return {
          ok: true,
          stdout:
            'local\tC:/Users/ohad/private-repo.git (fetch)\nlocal\tC:/Users/ohad/private-repo.git (push)\n'
        };
      }
      return { ok: false, stdout: '', stderr: 'not available' };
    });

    expect(localRepo.remotes).toEqual([]);
    expect(JSON.stringify(localRepo)).not.toContain('Users');
    expect(JSON.stringify(localRepo)).not.toContain('ohad');
  });

  it('omits POSIX absolute path remotes from redacted metadata', async () => {
    const workspace = await makeWorkspace();

    const localRepo = await collectLocalRepoMetadata(workspace, async (_command, args) => {
      if (args.join(' ') === 'remote -v') {
        return {
          ok: true,
          stdout: 'local\t/Users/ohad/private-repo.git (fetch)\nlocal\t/Users/ohad/private-repo.git (push)\n'
        };
      }
      return { ok: false, stdout: '', stderr: 'not available' };
    });

    expect(localRepo.remotes).toEqual([]);
    expect(JSON.stringify(localRepo)).not.toContain('/Users');
    expect(JSON.stringify(localRepo)).not.toContain('ohad');
  });

  it('omits forward-slash UNC network-share remotes from redacted metadata', async () => {
    const workspace = await makeWorkspace();

    const localRepo = await collectLocalRepoMetadata(workspace, async (_command, args) => {
      if (args.join(' ') === 'remote -v') {
        return {
          ok: true,
          stdout:
            'local\t//server/Users/ohad/private-repo.git (fetch)\nlocal\t//server/Users/ohad/private-repo.git (push)\n'
        };
      }
      return { ok: false, stdout: '', stderr: 'not available' };
    });

    expect(localRepo.remotes).toEqual([]);
    expect(JSON.stringify(localRepo)).not.toContain('server');
    expect(JSON.stringify(localRepo)).not.toContain('Users');
    expect(JSON.stringify(localRepo)).not.toContain('ohad');
  });

  it('omits file URL remotes from redacted metadata', async () => {
    const workspace = await makeWorkspace();

    const localRepo = await collectLocalRepoMetadata(workspace, async (_command, args) => {
      if (args.join(' ') === 'remote -v') {
        return {
          ok: true,
          stdout:
            'local\tfile:///C:/Users/ohad/private-repo.git (fetch)\nlocal\tfile:///C:/Users/ohad/private-repo.git (push)\n'
        };
      }
      return { ok: false, stdout: '', stderr: 'not available' };
    });

    expect(localRepo.remotes).toEqual([]);
    expect(JSON.stringify(localRepo)).not.toContain('Users');
    expect(JSON.stringify(localRepo)).not.toContain('ohad');
  });
});

describe('runner handshake', () => {
  it('requires session and token flags', () => {
    expect(() => parseRunnerConnectFlags({ session: 'launch-123' })).toThrow(
      'Usage: viberaven connect --session <launchSessionId> --token <oneTimeToken>'
    );
    expect(parseRunnerConnectFlags({ session: ' launch-123 ', token: ' token-123 ' })).toEqual({
      launchSessionId: 'launch-123',
      oneTimeToken: 'token-123',
      once: false
    });
    expect(parseRunnerConnectFlags({ session: 'launch-123', token: 'token-123', once: true })).toEqual({
      launchSessionId: 'launch-123',
      oneTimeToken: 'token-123',
      once: true
    });
  });

  it('builds the shared handshake request with explicit safe-fix write capability', () => {
    const request = buildRunnerHandshakeRequest({
      launchSessionId: 'launch-123',
      oneTimeToken: 'token-123',
      runnerVersion: '0.1.0-test',
      localRepo: {
        rootName: 'app',
        remotes: [],
        packageManager: 'unknown'
      }
    });

    expect(request).toMatchObject({
      launchSessionId: 'launch-123',
      oneTimeToken: 'token-123',
      runnerKind: 'cli',
      runnerVersion: '0.1.0-test',
      capabilities: ['read_files', 'run_build', 'run_tests', 'apply_patch', 'open_url', 'deep_station_scan']
    });
  });

  it('posts the handshake payload to the configured API base URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () =>
        JSON.stringify({
          runnerSession: {
            id: 'runner-1',
            deploySessionId: 'deploy-1',
            state: 'repo_matched',
            capabilities: ['read_files'],
            repoMatch: 'matched',
            createdAt: '2026-06-05T00:00:00.000Z',
            updatedAt: '2026-06-05T00:00:00.000Z'
          },
          runnerAccessToken: 'runner-secret',
          repoMatch: 'matched',
          allowedJobKinds: [],
          pollAfterMs: 5000
        })
    });

    const payload = buildRunnerHandshakeRequest({
      launchSessionId: 'launch-123',
      oneTimeToken: 'token-123',
      runnerVersion: '0.1.0-test',
      localRepo: {
        rootName: 'app',
        remotes: [],
        packageManager: 'unknown'
      }
    });

    await expect(
      postRunnerHandshake('https://api.example.test///', payload, fetchMock)
    ).resolves.toMatchObject({
      runnerSession: { id: 'runner-1' },
      repoMatch: 'matched'
    });
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/v1/runner/handshake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  });

  it('reports API handshake failures as errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => JSON.stringify({ error: 'Unauthorized' })
    });

    await expect(
      postRunnerHandshake(
        'https://api.example.test',
        buildRunnerHandshakeRequest({
          launchSessionId: 'launch-123',
          oneTimeToken: 'token-123',
          runnerVersion: '0.1.0-test',
          localRepo: {
            rootName: 'app',
            remotes: [],
            packageManager: 'unknown'
          }
        }),
        fetchMock
      )
    ).rejects.toThrow('Runner handshake failed (401)');
  });

  it('can poll once, acknowledge an allowed build job, run the package build script, and upload redacted proof', async () => {
    const workspace = await makeWorkspace();
    await writeFile(
      join(workspace, 'package.json'),
      JSON.stringify({ scripts: { build: 'vite build', test: 'vitest run' } }),
      'utf-8'
    );
    await writeFile(join(workspace, 'package-lock.json'), '{}\n', 'utf-8');

    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (url.endsWith('/v1/runner/handshake')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          text: async () =>
            JSON.stringify({
              runnerSession: {
                id: 'runner-1',
                deploySessionId: 'deploy-1',
                state: 'repo_matched',
                capabilities: ['read_files', 'run_build', 'run_tests'],
                repoMatch: 'matched',
                createdAt: '2026-06-05T00:00:00.000Z',
                updatedAt: '2026-06-05T00:00:00.000Z'
              },
              runnerAccessToken: 'runner-secret',
              repoMatch: 'matched',
              allowedJobKinds: ['run_build', 'run_tests'],
              pollAfterMs: 3000
            })
        };
      }
      if (url.endsWith('/v1/runner/sessions/runner-1/jobs')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          text: async () =>
            JSON.stringify({
              jobs: [
                {
                  id: 'job-1',
                  deploySessionId: 'deploy-1',
                  runnerSessionId: 'runner-1',
                  kind: 'run_build',
                  status: 'queued',
                  createdAt: '2026-06-05T00:00:00.000Z',
                  updatedAt: '2026-06-05T00:00:00.000Z'
                }
              ]
            })
        };
      }
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({ ok: true })
      };
    });

    const commandRunner = vi.fn(async (_command: string, args: string[]) => {
      const joined = args.join(' ');
      if (joined === 'remote -v') {
        return { ok: true, stdout: 'origin\thttps://github.com/viberice/demo.git (fetch)\n' };
      }
      if (joined === 'branch --show-current') {
        return { ok: true, stdout: 'main\n' };
      }
      if (joined === 'rev-parse HEAD') {
        return { ok: true, stdout: '0123456789abcdef0123456789abcdef01234567\n' };
      }
      if (joined === 'status --porcelain') {
        return { ok: true, stdout: '' };
      }
      if (joined === 'run build') {
        return {
          ok: true,
          stdout:
            'built ok\nDATABASE_URL=postgres://user:password@localhost:5432/app\nrunner token runner-secret\npairing token token-123\n',
          stderr: ''
        };
      }
      return { ok: false, stdout: '', stderr: `unexpected ${joined}` };
    });

    await expect(
      runRunnerConnect({
        launchSessionId: 'deploy-1',
        oneTimeToken: 'token-123',
        once: true,
        apiBaseUrl: 'https://api.example.test',
        workspaceRoot: workspace,
        runnerVersion: '0.1.0-test',
        commandRunner,
        fetchImpl: fetchMock
      })
    ).resolves.toMatchObject({ runnerSession: { id: 'runner-1' } });

    expect(commandRunner).toHaveBeenCalledWith('npm', ['run', 'build'], workspace);
    expect(calls.map((call) => call.url)).toEqual([
      'https://api.example.test/v1/runner/handshake',
      'https://api.example.test/v1/runner/sessions/runner-1/jobs',
      'https://api.example.test/v1/runner/jobs/job-1/ack',
      'https://api.example.test/v1/runner/jobs/job-1/result'
    ]);

    const resultCall = calls.at(-1);
    expect(resultCall?.init.headers).toMatchObject({ Authorization: 'Bearer runner-secret' });
    const resultBody = JSON.parse(String(resultCall?.init.body));
    expect(JSON.stringify(resultBody)).not.toContain('password');
    expect(JSON.stringify(resultBody)).not.toContain('runner-secret');
    expect(JSON.stringify(resultBody)).not.toContain('token-123');
    expect(resultBody).toMatchObject({
      jobId: 'job-1',
      status: 'succeeded',
      redacted: true,
      proofItems: [expect.objectContaining({ kind: 'command_output', redacted: true })]
    });
  });

  it.each([
    ['deep_station_scan', 'Deep station scan proof'],
    ['rescan', 'Rescan proof']
  ])('runs %s via runProjectScan and uploads redacted repo evidence', async (kind, proofLabel) => {
    const workspace = await makeWorkspace();
    await saveCliCredentials();
    const runProjectScan = mockRunProjectScan(workspace);

    const { body: resultBody } = await runQueuedJob(
      workspace,
      {
        id: 'job-1',
        deploySessionId: 'deploy-1',
        runnerSessionId: 'runner-1',
        kind,
        status: 'queued',
        input: {},
        createdAt: '2026-06-05T00:00:00.000Z',
        updatedAt: '2026-06-05T00:00:00.000Z'
      },
      { runProjectScan }
    );

    expect(runProjectScan).toHaveBeenCalledWith({
      workspacePath: workspace,
      accessToken: 'account-access-token',
      apiBaseUrl: 'https://api.example.test'
    });
    expect(JSON.stringify(resultBody)).not.toContain('password');
    expect(JSON.stringify(resultBody)).not.toContain('runner-secret');
    expect(resultBody).toMatchObject({
      jobId: 'job-1',
      status: 'succeeded',
      redacted: true,
      outputSummary: expect.arrayContaining([expect.stringMatching(/production core 70%/)]),
      proofItems: [
        expect.objectContaining({
          kind: 'repo_evidence',
          label: proofLabel,
          redacted: true,
          evidence: expect.arrayContaining([
            expect.stringMatching(/^score: 82/),
            expect.stringMatching(/^gaps: 1/)
          ])
        })
      ]
    });
    expect(resultBody.outputSummary.join('\n')).not.toContain('Unsupported runner job kind');
  });

  it('returns needs_user when station scan jobs run without CLI credentials', async () => {
    const workspace = await makeWorkspace();
    await makeConfigDir();
    await writeFile(getCredentialsPath(), '{}\n', 'utf-8');
    const runProjectScan = mockRunProjectScan(workspace);

    const { body: resultBody } = await runQueuedJob(
      workspace,
      {
        id: 'job-1',
        deploySessionId: 'deploy-1',
        runnerSessionId: 'runner-1',
        kind: 'deep_station_scan',
        status: 'queued',
        input: {},
        createdAt: '2026-06-05T00:00:00.000Z',
        updatedAt: '2026-06-05T00:00:00.000Z'
      },
      { runProjectScan }
    );

    expect(runProjectScan).not.toHaveBeenCalled();
    expect(resultBody).toMatchObject({
      status: 'needs_user',
      error: { code: 'SCAN_AUTH_REQUIRED' }
    });
  });

  it('returns needs_user when runProjectScan hits the scan limit', async () => {
    const workspace = await makeWorkspace();
    await saveCliCredentials();
    const runProjectScan = vi.fn(async () => ({
      ok: false as const,
      kind: 'scan_limit' as const,
      upgradeUrl: 'https://viberaven.dev/account'
    }));

    const { body: resultBody } = await runQueuedJob(
      workspace,
      {
        id: 'job-1',
        deploySessionId: 'deploy-1',
        runnerSessionId: 'runner-1',
        kind: 'rescan',
        status: 'queued',
        input: {},
        createdAt: '2026-06-05T00:00:00.000Z',
        updatedAt: '2026-06-05T00:00:00.000Z'
      },
      { runProjectScan }
    );

    expect(resultBody).toMatchObject({
      status: 'needs_user',
      error: { code: 'SCAN_LIMIT_REACHED' }
    });
  });

  it('applies an approved create_file job inside the workspace and uploads redacted proof', async () => {
    const workspace = await makeWorkspace();
    const { body: resultBody } = await runQueuedJob(workspace, {
      id: 'job-1',
      deploySessionId: 'deploy-1',
      runnerSessionId: 'runner-1',
      kind: 'create_file',
      status: 'queued',
      input: {
        approved: true,
        path: '.viberaven/checklist.md',
        content: '# Checklist\n',
        description: 'Create a safe checklist.',
        riskLevel: 'low',
        verificationCommand: 'npm test'
      },
      createdAt: '2026-06-05T00:00:00.000Z',
      updatedAt: '2026-06-05T00:00:00.000Z'
    });

    await expect(readFile(join(workspace, '.viberaven', 'checklist.md'), 'utf-8')).resolves.toBe('# Checklist\n');
    expect(JSON.stringify(resultBody)).not.toContain('# Checklist');
    expect(resultBody).toMatchObject({
      jobId: 'job-1',
      status: 'succeeded',
      redacted: true,
      outputSummary: expect.arrayContaining([
        'created file .viberaven/checklist.md',
        'rollback: delete created file',
        'verification: npm test'
      ]),
      proofItems: [
        expect.objectContaining({
          kind: 'repo_evidence',
          summary: 'created file .viberaven/checklist.md',
          redacted: true
        })
      ]
    });
  });

  it.each([
    ['.env', '.env'],
    ['path traversal', '../safe-fix-escape.md'],
    ['normalized traversal', 'docs/../.env'],
    ['nested env file', 'docs/.env'],
    ['blocked git directory', '.git/config'],
    ['blocked node_modules directory', 'node_modules/pkg/file.md'],
    ['secret filename', 'docs/key.pem'],
    ['Windows traversal separator', 'docs\\..\\.env'],
    ['Windows secret filename separator', 'docs\\key.pem'],
    ['case variant directory', 'Docs/checklist.md']
  ])('rejects unsafe create_file path %s without writing', async (_label, unsafePath) => {
    const workspace = await makeWorkspace();
    const outsidePath = join(dirname(workspace), unsafePath.replace(/^\.\.\//, ''));

    const { body: resultBody } = await runQueuedJob(workspace, {
      id: 'job-1',
      deploySessionId: 'deploy-1',
      runnerSessionId: 'runner-1',
      kind: 'create_file',
      status: 'queued',
      input: {
        approved: true,
        path: unsafePath,
        content: 'SECRET=x\n',
        description: 'Unsafe write.',
        riskLevel: 'low'
      },
      createdAt: '2026-06-05T00:00:00.000Z',
      updatedAt: '2026-06-05T00:00:00.000Z'
    });

    expect(resultBody).toMatchObject({
      jobId: 'job-1',
      status: 'needs_user',
      redacted: true,
      error: { code: 'SAFE_FIX_VALIDATION_FAILED' }
    });
    await expect(fileExists(join(workspace, '.env'))).resolves.toBe(false);
    if (unsafePath.startsWith('../')) {
      await expect(fileExists(outsidePath)).resolves.toBe(false);
    }
  });

  it('refuses to overwrite an existing file for create_file jobs', async () => {
    const workspace = await makeWorkspace();
    await mkdir(join(workspace, '.viberaven'), { recursive: true });
    await writeFile(join(workspace, '.viberaven', 'checklist.md'), 'existing\n', 'utf-8');

    const { body: resultBody } = await runQueuedJob(workspace, {
      id: 'job-1',
      deploySessionId: 'deploy-1',
      runnerSessionId: 'runner-1',
      kind: 'create_file',
      status: 'queued',
      input: {
        approved: true,
        path: '.viberaven/checklist.md',
        content: 'new\n',
        description: 'Create a safe checklist.',
        riskLevel: 'low'
      },
      createdAt: '2026-06-05T00:00:00.000Z',
      updatedAt: '2026-06-05T00:00:00.000Z'
    });

    await expect(readFile(join(workspace, '.viberaven', 'checklist.md'), 'utf-8')).resolves.toBe('existing\n');
    expect(resultBody).toMatchObject({
      status: 'needs_user',
      error: { code: 'SAFE_FIX_TARGET_EXISTS' }
    });
  });

  it('rejects safe-fix content that contains a real-looking secret without writing', async () => {
    const workspace = await makeWorkspace();
    const { body: resultBody } = await runQueuedJob(workspace, {
      id: 'job-1',
      deploySessionId: 'deploy-1',
      runnerSessionId: 'runner-1',
      kind: 'create_file',
      status: 'queued',
      input: {
        approved: true,
        path: '.env.example',
        content: `STRIPE_SECRET_KEY=${'sk_' + 'live'}_${'1234567890abcdefghijklmnop'}\n`,
        description: 'Create an env example.',
        riskLevel: 'low'
      },
      createdAt: '2026-06-05T00:00:00.000Z',
      updatedAt: '2026-06-05T00:00:00.000Z'
    });

    await expect(fileExists(join(workspace, '.env.example'))).resolves.toBe(false);
    expect(resultBody).toMatchObject({
      status: 'needs_user',
      error: { code: 'SAFE_FIX_VALIDATION_FAILED' }
    });
  });

  it('rejects safe-fix expected existing content that contains a real-looking secret', async () => {
    const workspace = await makeWorkspace();
    await mkdir(join(workspace, 'docs'), { recursive: true });
    await writeFile(join(workspace, 'docs', 'checklist.md'), 'safe\n', 'utf-8');

    const { body: resultBody } = await runQueuedJob(workspace, {
      id: 'job-1',
      deploySessionId: 'deploy-1',
      runnerSessionId: 'runner-1',
      kind: 'apply_patch',
      status: 'queued',
      input: {
        approved: true,
        path: 'docs/checklist.md',
        expectedExistingContent: 'DATABASE_URL=postgres://user:password@localhost:5432/app\n',
        content: 'updated\n',
        description: 'Update checklist.',
        riskLevel: 'low'
      },
      createdAt: '2026-06-05T00:00:00.000Z',
      updatedAt: '2026-06-05T00:00:00.000Z'
    });

    await expect(readFile(join(workspace, 'docs', 'checklist.md'), 'utf-8')).resolves.toBe('safe\n');
    expect(resultBody).toMatchObject({
      status: 'needs_user',
      error: { code: 'SAFE_FIX_VALIDATION_FAILED' }
    });
  });

  it('applies an approved bounded update only when expected content matches', async () => {
    const workspace = await makeWorkspace();
    await mkdir(join(workspace, 'docs'), { recursive: true });
    await writeFile(join(workspace, 'docs', 'checklist.md'), 'before\n', 'utf-8');

    const { body: resultBody } = await runQueuedJob(workspace, {
      id: 'job-1',
      deploySessionId: 'deploy-1',
      runnerSessionId: 'runner-1',
      kind: 'apply_patch',
      status: 'queued',
      input: {
        approved: true,
        path: 'docs/checklist.md',
        expectedExistingContent: 'before\n',
        content: 'after\n',
        description: 'Update checklist.',
        riskLevel: 'low',
        verificationCommand: 'npm run build'
      },
      createdAt: '2026-06-05T00:00:00.000Z',
      updatedAt: '2026-06-05T00:00:00.000Z'
    });

    await expect(readFile(join(workspace, 'docs', 'checklist.md'), 'utf-8')).resolves.toBe('after\n');
    expect(resultBody).toMatchObject({
      jobId: 'job-1',
      status: 'succeeded',
      outputSummary: expect.arrayContaining([
        'updated file docs/checklist.md',
        'rollback: restore previous content captured locally',
        'verification: npm run build'
      ])
    });
  });

  it('rejects an approved bounded update when expected content mismatches', async () => {
    const workspace = await makeWorkspace();
    await mkdir(join(workspace, 'docs'), { recursive: true });
    await writeFile(join(workspace, 'docs', 'checklist.md'), 'current\n', 'utf-8');

    const { body: resultBody } = await runQueuedJob(workspace, {
      id: 'job-1',
      deploySessionId: 'deploy-1',
      runnerSessionId: 'runner-1',
      kind: 'apply_patch',
      status: 'queued',
      input: {
        approved: true,
        path: 'docs/checklist.md',
        expectedExistingContent: 'before\n',
        content: 'after\n',
        description: 'Update checklist.',
        riskLevel: 'low'
      },
      createdAt: '2026-06-05T00:00:00.000Z',
      updatedAt: '2026-06-05T00:00:00.000Z'
    });

    await expect(readFile(join(workspace, 'docs', 'checklist.md'), 'utf-8')).resolves.toBe('current\n');
    expect(resultBody).toMatchObject({
      jobId: 'job-1',
      status: 'needs_user',
      error: { code: 'SAFE_FIX_EXPECTED_CONTENT_MISMATCH' }
    });
  });

  it('rejects binary-looking files during bounded update without writing', async () => {
    const workspace = await makeWorkspace();
    await mkdir(join(workspace, 'docs'), { recursive: true });
    await writeFile(join(workspace, 'docs', 'checklist.md'), 'before\u0000after', 'utf-8');

    const { body: resultBody } = await runQueuedJob(workspace, {
      id: 'job-1',
      deploySessionId: 'deploy-1',
      runnerSessionId: 'runner-1',
      kind: 'apply_patch',
      status: 'queued',
      input: {
        approved: true,
        path: 'docs/checklist.md',
        expectedExistingContent: 'before after',
        content: 'updated\n',
        description: 'Update checklist.',
        riskLevel: 'low'
      },
      createdAt: '2026-06-05T00:00:00.000Z',
      updatedAt: '2026-06-05T00:00:00.000Z'
    });

    await expect(readFile(join(workspace, 'docs', 'checklist.md'), 'utf-8')).resolves.toBe('before\u0000after');
    expect(resultBody).toMatchObject({
      status: 'needs_user',
      error: { code: 'SAFE_FIX_BINARY_FILE' }
    });
  });

  it('rejects symlink parent escapes when the platform permits symlinks', async () => {
    const workspace = await makeWorkspace();
    const outside = await makeWorkspace();
    try {
      await symlink(outside, join(workspace, 'docs'), 'dir');
    } catch {
      return;
    }

    const { body: resultBody } = await runQueuedJob(workspace, {
      id: 'job-1',
      deploySessionId: 'deploy-1',
      runnerSessionId: 'runner-1',
      kind: 'create_file',
      status: 'queued',
      input: {
        approved: true,
        path: 'docs/checklist.md',
        content: 'escaped\n',
        description: 'Create docs checklist.',
        riskLevel: 'low'
      },
      createdAt: '2026-06-05T00:00:00.000Z',
      updatedAt: '2026-06-05T00:00:00.000Z'
    });

    await expect(fileExists(join(outside, 'checklist.md'))).resolves.toBe(false);
    expect(resultBody).toMatchObject({
      status: 'needs_user',
      error: { code: 'SAFE_FIX_VALIDATION_FAILED' }
    });
  });
});

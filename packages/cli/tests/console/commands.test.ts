import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveConsoleCommandArgs, runAllowedConsoleCommand } from '../../src/console/commands';

describe('console command allowlist', () => {
  it('allows action verification by structured action ID', () => {
    expect(resolveConsoleCommandArgs({ type: 'verify-action', actionId: 'VR-A12' })).toEqual([
      'verify',
      '--action',
      'VR-A12',
    ]);
  });

  it('allows known VibeRaven commands only', () => {
    expect(resolveConsoleCommandArgs({ type: 'actions-json' })).toEqual(['actions', '--json']);
    expect(resolveConsoleCommandArgs({ type: 'verify-gate' })).toEqual(['--verify']);
    expect(resolveConsoleCommandArgs({ type: 'agent-mode' })).toEqual(['--agent-mode']);
  });

  it('rejects command injection and unknown action IDs', () => {
    expect(() =>
      resolveConsoleCommandArgs({ type: 'verify-action', actionId: 'VR-A1 && rm -rf .' }),
    ).toThrow('Invalid VibeRaven action ID');
    expect(() =>
      resolveConsoleCommandArgs({ type: 'shell' as never, command: 'npm publish' } as never),
    ).toThrow('Unsupported console command');
  });

  it('rejects non-string action IDs from untrusted JSON', () => {
    expect(() =>
      resolveConsoleCommandArgs({ type: 'verify-action', actionId: ['VR-A12'] }),
    ).toThrow('Invalid VibeRaven action ID');
  });

  it('rejects extra command keys', () => {
    expect(() =>
      resolveConsoleCommandArgs({ type: 'actions-json', command: 'npm publish' }),
    ).toThrow('Unsupported console command');
  });

  it('captures stdout and stderr from an allowed command process', async () => {
    const fixtureDir = await mkdtemp(join(tmpdir(), 'viberaven-console-command-'));
    const fixturePath = join(fixtureDir, 'fixture.js');
    await writeFile(
      fixturePath,
      "process.stdout.write(`stdout:${process.argv.slice(2).join(' ')}`);\nprocess.stderr.write(`stderr:${process.argv.slice(2).join(' ')}`);\n",
    );

    try {
      const result = await runAllowedConsoleCommand({
        cliPath: fixturePath,
        cwd: fixtureDir,
        request: { type: 'actions-json' },
      });

      expect(result).toEqual({
        exitCode: 0,
        stdout: 'stdout:actions --json',
        stderr: 'stderr:actions --json',
      });
    } finally {
      await rm(fixtureDir, { recursive: true, force: true });
    }
  });
});

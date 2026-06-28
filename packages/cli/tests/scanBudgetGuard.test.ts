import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { main } from '../src/cli';
import { saveLoopState } from '../src/loopState';
import mockArtifactJson from './fixtures/mockArtifact3Gaps.json';

let tempDir: string;
let originalCwd: string;
let originalArgv: string[];

beforeEach(async () => {
  originalCwd = process.cwd();
  originalArgv = process.argv;
  tempDir = await mkdtemp(join(tmpdir(), 'vr-scan-budget-'));
  process.chdir(tempDir);

  await mkdir(join(tempDir, '.viberaven'), { recursive: true });
  await writeFile(
    join(tempDir, '.viberaven', 'last-scan.json'),
    `${JSON.stringify(mockArtifactJson, null, 2)}\n`,
    'utf8'
  );
});

afterEach(async () => {
  process.chdir(originalCwd);
  process.argv = originalArgv;
  vi.restoreAllMocks();
  await rm(tempDir, { recursive: true, force: true });
});

describe('scan budget guard', () => {
  it('blocks early verify when a local heal batch still has repo-code tasks', async () => {
    await saveLoopState(tempDir, {
      batchApplied: 1,
      lastGapCount: 3,
      stalledScans: 0,
      appliedGapIdsSinceScan: [],
    });

    const errors: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((message = '') => {
      errors.push(String(message));
    });
    process.argv = ['node', 'cli.js', '--verify'];

    const exitCode = await main();

    expect(exitCode).toBe(4);
    expect(errors.join('\n')).toContain('SCAN_DEFERRED');
    expect(errors.join('\n')).toContain('auth_secret_missing');
  });
});

import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { runCondenseCommand } from '../src/commands/condense';

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
  tempDir = undefined;
});

describe('condense command', () => {
  it('writes context-map.json from an existing last-scan artifact', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'viberaven-condense-'));
    const artifactDir = join(tempDir, '.viberaven');
    await mkdir(artifactDir, { recursive: true });
    await writeFile(join(artifactDir, 'last-scan.json'), JSON.stringify({
      version: 1,
      scannedAt: '2026-06-08T09:30:00.000Z',
      workspacePath: tempDir,
      score: 90,
      scoreLabel: 'Good',
      summary: 'summary',
      archetype: 'next',
      gaps: [],
      missionGraph: { nodes: [], edges: [] },
      stackWiring: {},
      providerRegistry: {},
      verificationSummary: {},
      productionCorePercent: 90
    }), 'utf8');

    const result = await runCondenseCommand({ cwd: tempDir });

    expect(result.contextMapPath).toBe(join(artifactDir, 'context-map.json'));
    expect(existsSync(result.contextMapPath)).toBe(true);
    const context = JSON.parse(await readFile(result.contextMapPath, 'utf8'));
    expect(context.agentContract.machineResult).toBe('.viberaven/gate-result.json');
  });
});

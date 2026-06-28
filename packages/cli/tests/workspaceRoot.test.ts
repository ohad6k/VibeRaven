import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { findArtifactsWorkspace, resolveWorkspaceRoot } from '../src/config';

describe('findArtifactsWorkspace', () => {
  it('finds .viberaven in a parent directory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'vr-root-'));
    const nested = join(root, 'packages', 'cli');
    await mkdir(join(root, '.viberaven'), { recursive: true });
    await writeFile(join(root, '.viberaven', 'last-scan.json'), '{"version":1}\n', 'utf-8');
    await mkdir(nested, { recursive: true });

    await expect(findArtifactsWorkspace(nested)).resolves.toBe(root);
  });

  it('returns undefined when no scan exists', async () => {
    const root = await mkdtemp(join(tmpdir(), 'vr-empty-'));
    await expect(findArtifactsWorkspace(root)).resolves.toBeUndefined();
  });
});

describe('resolveWorkspaceRoot', () => {
  it('prefers artifact root over git root', async () => {
    const root = await mkdtemp(join(tmpdir(), 'vr-git-'));
    await mkdir(join(root, '.git'), { recursive: true });
    await mkdir(join(root, '.viberaven'), { recursive: true });
    await writeFile(join(root, '.viberaven', 'last-scan.json'), '{"version":1}\n', 'utf-8');
    const nested = join(root, 'sub');
    await mkdir(nested, { recursive: true });

    await expect(resolveWorkspaceRoot(nested)).resolves.toBe(root);
  });
});

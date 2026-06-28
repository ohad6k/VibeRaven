import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import {
  seedPackageJsonScripts,
  VIBERAVEN_PACKAGE_JSON_SCRIPTS,
} from '../src/commands/seedPackageJsonScripts';
import { initAgentRules } from '../src/commands/initRules';

const tempDirs: string[] = [];

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

describe('seedPackageJsonScripts', () => {
  it('returns null when package.json is missing', async () => {
    const cwd = await makeTempDir('vr-seed-scripts-missing-');
    const result = await seedPackageJsonScripts({ cwd });
    expect(result).toBeNull();
  });

  it('adds missing viberaven scripts without overwriting existing keys', async () => {
    const cwd = await makeTempDir('vr-seed-scripts-add-');
    await writeFile(
      join(cwd, 'package.json'),
      JSON.stringify(
        {
          name: 'fixture-app',
          scripts: {
            dev: 'next dev',
            'viberaven:gate': 'custom gate command',
          },
        },
        null,
        2
      ),
      'utf-8'
    );

    const result = await seedPackageJsonScripts({ cwd });
    expect(result).toEqual({
      action: 'updated',
      added: ['viberaven:verify', 'viberaven:strict'],
      skipped: ['viberaven:gate'],
      changed: true,
    });

    const pkg = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf-8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts.dev).toBe('next dev');
    expect(pkg.scripts['viberaven:gate']).toBe('custom gate command');
    expect(pkg.scripts['viberaven:verify']).toBe(VIBERAVEN_PACKAGE_JSON_SCRIPTS['viberaven:verify']);
    expect(pkg.scripts['viberaven:strict']).toBe(VIBERAVEN_PACKAGE_JSON_SCRIPTS['viberaven:strict']);
  });

  it('is idempotent on second run', async () => {
    const cwd = await makeTempDir('vr-seed-scripts-idempotent-');
    await writeFile(
      join(cwd, 'package.json'),
      JSON.stringify({ name: 'fixture-app', scripts: { dev: 'next dev' } }, null, 2),
      'utf-8'
    );

    const first = await seedPackageJsonScripts({ cwd });
    const second = await seedPackageJsonScripts({ cwd });

    expect(first?.changed).toBe(true);
    expect(second).toEqual({
      action: 'unchanged',
      added: [],
      skipped: ['viberaven:gate', 'viberaven:verify', 'viberaven:strict'],
      changed: false,
    });
  });

  it('does not write files during dry run', async () => {
    const cwd = await makeTempDir('vr-seed-scripts-dry-run-');
    const original = JSON.stringify({ name: 'fixture-app', scripts: {} }, null, 2);
    await writeFile(join(cwd, 'package.json'), original, 'utf-8');

    const result = await seedPackageJsonScripts({ cwd, dryRun: true });
    expect(result?.changed).toBe(true);
    expect(await readFile(join(cwd, 'package.json'), 'utf-8')).toBe(original);
  });
});

describe('initAgentRules package.json seeding', () => {
  it('seeds package.json scripts after writing agent rules', async () => {
    const cwd = await makeTempDir('vr-init-seed-scripts-');
    await writeFile(
      join(cwd, 'package.json'),
      JSON.stringify({ name: 'fixture-app', scripts: { dev: 'next dev' } }, null, 2),
      'utf-8'
    );

    const output = await initAgentRules({ cwd, targets: ['claude'] });
    expect(output.packageJsonScripts?.changed).toBe(true);
    expect(output.packageJsonScripts?.added).toEqual([
      'viberaven:gate',
      'viberaven:verify',
      'viberaven:strict',
    ]);

    const pkg = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf-8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['viberaven:gate']).toBe(VIBERAVEN_PACKAGE_JSON_SCRIPTS['viberaven:gate']);
  });
});

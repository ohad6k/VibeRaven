import * as esbuild from 'esbuild';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = join(root, 'dist', 'cli.js');
const assetsSrc = join(root, 'assets', 'report');
const assetsDist = join(root, 'dist', 'report');
const consoleAssetsSrc = join(root, 'assets', 'console');
const consoleAssetsDist = join(root, 'dist', 'console');
const expectedConsoleAssetNames = ['index.html', 'styles.css', 'app.js'];

const sync = spawnSync(process.execPath, [join(root, 'scripts', 'sync-report-assets.mjs')], {
  stdio: 'inherit',
  cwd: root
});
if (sync.status !== 0) {
  process.exit(sync.status ?? 1);
}

if (!existsSync(join(assetsSrc, 'station.css'))) {
  console.error('Missing report assets after sync:', assetsSrc);
  process.exit(1);
}

rmSync(assetsDist, { recursive: true, force: true });
mkdirSync(join(assetsDist, 'assets'), { recursive: true });
cpSync(assetsSrc, assetsDist, { recursive: true });

const playbooksSrc = join(root, 'playbooks');
const playbooksDist = join(root, 'dist', 'playbooks');
if (existsSync(playbooksSrc)) {
  rmSync(playbooksDist, { recursive: true, force: true });
  cpSync(playbooksSrc, playbooksDist, { recursive: true });
}

for (const assetName of expectedConsoleAssetNames) {
  const assetPath = join(consoleAssetsSrc, assetName);
  if (!existsSync(assetPath)) {
    console.error('Missing console asset:', assetPath);
    process.exit(1);
  }
}

rmSync(consoleAssetsDist, { recursive: true, force: true });
mkdirSync(consoleAssetsDist, { recursive: true });
cpSync(consoleAssetsSrc, consoleAssetsDist, { recursive: true });

mkdirSync(dirname(outFile), { recursive: true });

await esbuild.build({
  entryPoints: [join(root, 'src', 'cli.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: outFile,
  banner: { js: '#!/usr/bin/env node' },
  sourcemap: true,
  logLevel: 'info',
});

console.log('Built', outFile);

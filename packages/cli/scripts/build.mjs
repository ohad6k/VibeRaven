import * as esbuild from 'esbuild';
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = join(root, 'dist', 'cli.js');
const iconSource = join(root, '..', '..', 'media', 'extension-icon.png');
const iconOutFile = join(root, 'dist', 'extension-icon.png');

rmSync(join(root, 'dist'), { recursive: true, force: true });
mkdirSync(dirname(outFile), { recursive: true });
if (!existsSync(iconSource)) {
  throw new Error(`Missing VibeRaven extension icon at ${iconSource}`);
}
copyFileSync(iconSource, iconOutFile);

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

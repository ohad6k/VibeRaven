import * as esbuild from 'esbuild';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = join(root, 'dist', 'cli.js');

rmSync(join(root, 'dist'), { recursive: true, force: true });
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

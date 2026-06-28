import { build } from 'esbuild';
import { rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });

await build({
  entryPoints: ['src/server.ts', 'src/lib/cli-runner.ts', 'src/tools/index.ts', 'src/lib/attribution.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  outbase: 'src',
  outdir: 'dist',
  banner: { js: '#!/usr/bin/env node' },
  external: ['@modelcontextprotocol/sdk']
});

console.log('built dist/server.js');

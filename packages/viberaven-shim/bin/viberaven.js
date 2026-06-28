#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const cliEntry = require.resolve('@viberaven/cli/dist/cli.js');
const result = spawnSync(process.execPath, [cliEntry, ...process.argv.slice(2)], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);

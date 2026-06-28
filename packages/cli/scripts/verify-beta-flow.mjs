#!/usr/bin/env node
// Historical script name; this smoke verifies stable CLI behavior.
/**
 * Smoke / live verification for @viberaven/cli production-ready behavior.
 *
 * Automated (no login):
 *   node scripts/verify-beta-flow.mjs --smoke
 *
 * Full flow (requires browser login once):
 *   set VIBERAVEN_WORKDIR=d:\path\to\repo
 *   node scripts/verify-beta-flow.mjs --live
 *
 * With existing token (skip login):
 *   set VIBERAVEN_ACCESS_TOKEN=...
 *   node scripts/verify-beta-flow.mjs --live
 */
import { spawnSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cliEntry = join(root, 'dist', 'cli.js');
const packageJsonPath = join(root, 'package.json');
const npmCommand = process.platform === 'win32' ? 'cmd' : 'npm';
const npmPrefixArgs = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm'] : [];

function runCli(args, options = {}) {
  const result = spawnSync(process.execPath, [cliEntry, ...args], {
    encoding: 'utf-8',
    cwd: options.cwd ?? process.cwd(),
    env: { ...process.env, ...options.env },
    timeout: options.timeout ?? 120_000
  });
  return {
    code: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    combined: `${result.stdout ?? ''}${result.stderr ?? ''}`
  };
}

function runNpm(args, options = {}) {
  return spawnSync(npmCommand, [...npmPrefixArgs, ...args], {
    cwd: options.cwd ?? root,
    encoding: 'utf-8',
    shell: false
  });
}

async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function pass(msg) {
  console.log(`  ✓ ${msg}`);
}

function fail(msg) {
  console.error(`  ✗ ${msg}`);
  process.exitCode = 1;
}

function assertSmokeOutput(label, output, required) {
  for (const text of required) {
    if (!output.includes(text)) {
      fail(`${label} missing ${text}`);
    }
  }
}

function assertIncludes(label, output, text) {
  if (!output.includes(text)) {
    fail(`${label} missing ${text}`);
  }
}

async function smoke() {
  console.log('\n=== Smoke (no network login) ===\n');

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
  const expectedVersion = packageJson.version;
  const smokeConfigDir = await mkdtemp(join(tmpdir(), 'viberaven-cli-config-'));
  const smokeEnv = { VIBERAVEN_CONFIG_DIR: smokeConfigDir };

  const help = runCli(['--help'], { env: smokeEnv });
  if (help.code !== 0 || !help.combined.includes('viberaven scan')) {
    fail('--help failed');
  } else {
    pass('--help');
  }
  assertSmokeOutput('--help agent commands', help.combined, [
    'npx -y viberaven --agent-mode',
    'npx -y viberaven',
    'agent-tasklist.md'
  ]);
  assertIncludes('--help stable CLI', help.combined, 'viberaven --agent-mode [--json|--jsonl]');
  assertIncludes('--help stable CLI', help.combined, 'viberaven --strict[=warning]');
  assertIncludes('--help stable CLI', help.combined, 'gate-result.json');
  assertIncludes('--help stable CLI', help.combined, 'context-map.json');

  const version = runCli(['version'], { env: smokeEnv });
  if (version.code !== 0 || !version.stdout.trim()) {
    fail('version failed');
  } else {
    const actualVersion = version.stdout.trim();
    if (actualVersion !== expectedVersion) {
      fail(`version mismatch: expected ${expectedVersion}, got ${actualVersion}`);
    } else {
      pass(`version ${actualVersion}`);
    }
  }

  const status = runCli(['status'], { env: smokeEnv });
  if (!status.combined.includes('Not signed in')) {
    fail('status should report not signed in when logged out');
  } else {
    pass('status when logged out');
  }

  const packDir = await mkdtemp(join(tmpdir(), 'viberaven-cli-smoke-'));
  const npxInstall = runNpm(['pack', '--pack-destination', packDir], { cwd: root });
  if (npxInstall.status !== 0) {
    fail(`npm pack failed: ${npxInstall.error?.message ?? npxInstall.stderr}`);
  } else {
    pass('npm pack');
  }

  const tgz = ((npxInstall.stdout ?? '').match(/viberaven-cli-[\w.-]+\.tgz/) ?? [])[0];
  if (!tgz) {
    fail('could not find packed tarball name');
    return;
  }

  const installDir = await mkdtemp(join(tmpdir(), 'viberaven-cli-install-'));
  const install = runNpm(['install', join(packDir, tgz)], { cwd: installDir });
  if (install.status !== 0) {
    fail(`clean install failed: ${install.error?.message ?? install.stderr}`);
  } else {
    pass('clean npm install from packed tarball');
  }

  const installedCli = join(installDir, 'node_modules', '.bin', 'viberaven');
  const installedRun =
    process.platform === 'win32'
      ? spawnSync('cmd', ['/c', installedCli, 'version'], { encoding: 'utf-8' })
      : spawnSync(installedCli, ['version'], { encoding: 'utf-8' });
  if (installedRun.status !== 0) {
    fail('installed bin viberaven version failed');
  } else {
    pass(`npx-style bin: viberaven ${installedRun.stdout.trim()}`);
  }

  const initDryRun = runCli(['init', '--dry-run'], { env: smokeEnv });
  if (initDryRun.code !== 0) {
    fail('init --dry-run failed');
  } else {
    pass('init --dry-run');
  }
  assertSmokeOutput('init --dry-run output', initDryRun.combined, [
    'npx -y viberaven',
    'init --agents all --dry-run'
  ]);
}

async function live() {
  console.log('\n=== Live (managed API + artifacts) ===\n');

  const workdir = process.env.VIBERAVEN_WORKDIR?.trim() || process.cwd();
  console.log(`Workdir: ${workdir}`);

  const token = process.env.VIBERAVEN_ACCESS_TOKEN?.trim();
  if (!token) {
    console.log('No VIBERAVEN_ACCESS_TOKEN — run `viberaven login` in this shell first.\n');
    const loginHint = runCli(['login'], { cwd: workdir, timeout: 600_000 });
    if (loginHint.code !== 0) {
      fail('login failed (complete browser approval and retry with --live)');
      return;
    }
    pass('login');
  } else {
    pass('using VIBERAVEN_ACCESS_TOKEN');
  }

  const status = runCli(['status'], { cwd: workdir });
  if (status.code !== 0) {
    fail(`status failed:\n${status.combined}`);
    return;
  }
  if (!/Scans:\s+\d+\/\d+/.test(status.combined)) {
    fail('status missing quota line (Scans: used/limit)');
    return;
  }
  pass('status with quota');
  console.log(status.stdout);

  let scanCode = 0;
  let lastCombined = '';
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const scan = runCli(['scan'], { cwd: workdir, timeout: 300_000 });
    lastCombined = scan.combined;
    scanCode = scan.code;
    console.log(scan.stdout);
    if (scan.stderr) {
      console.error(scan.stderr);
    }
    if (scan.code === 0) {
      pass(`scan succeeded (attempt ${attempt})`);
      break;
    }
    if (scan.code === 2 && lastCombined.includes('Free scan limit reached')) {
      pass('scan limit / upgrade message (exit 2)');
      break;
    }
    if (attempt < 4) {
      console.log(`Scan attempt ${attempt} returned ${scan.code}, retrying…`);
    }
  }

  const artifactDir = join(workdir, '.viberaven');
  const jsonPath = join(artifactDir, 'last-scan.json');
  const summaryPath = join(artifactDir, 'agent-summary.md');
  const reportPath = join(artifactDir, 'report.html');

  if (scanCode === 0) {
    for (const [label, path] of [
      ['last-scan.json', jsonPath],
      ['agent-summary.md', summaryPath],
      ['report.html', reportPath]
    ]) {
      if (!(await fileExists(path))) {
        fail(`missing ${label}`);
      } else {
        const size = (await readFile(path, 'utf-8')).length;
        pass(`${label} (${size} bytes)`);
      }
    }

    const summary = await readFile(summaryPath, 'utf-8');
    if (!summary.includes('viberaven prompt')) {
      fail('agent-summary.md missing prompt hint');
    } else {
      pass('agent-summary.md agent workflow');
    }

    const json = JSON.parse(await readFile(jsonPath, 'utf-8'));
    if (!json.missionGraph?.areas?.length) {
      fail('last-scan.json missing missionGraph.areas');
    } else {
      pass('last-scan.json mission map');
    }

    const prompt = runCli(['prompt'], { cwd: workdir });
    if (prompt.code !== 0 || prompt.stdout.trim().length < 40) {
      fail('viberaven prompt did not return copyPrompt');
    } else {
      pass('viberaven prompt stdout');
    }
  } else if (scanCode === 2) {
    if (!/Upgrade.*account:/i.test(lastCombined)) {
      fail('scan limit missing upgrade URL line');
    } else {
      pass('upgrade URL on quota block');
    }
  } else {
    fail(`scan failed with exit ${scanCode}`);
  }

  console.log('\nManual check (Claude Code / Codex):');
  console.log('  npx -y viberaven --agent-mode');
  console.log('  Ask the agent to read .viberaven/agent-summary.md, read .viberaven/launch-playbook.md, and use one focused prompt.\n');
}

const args = process.argv.slice(2);
if (args.includes('--live')) {
  await live();
} else {
  await smoke();
}

if (process.exitCode) {
  console.error('\nVerification failed.\n');
  process.exit(process.exitCode);
} else {
  console.log('\nVerification passed.\n');
}

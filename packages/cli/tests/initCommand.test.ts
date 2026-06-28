import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { main } from '../src/cli';
import { CORE_AGENT_INJECTION_TARGETS, AGENT_RULE_TARGETS } from '../src/commands/agentTargets';
import {
  VIBERAVEN_BLOCK_START,
  VIBERAVEN_BLOCK_END,
  VIBERAVEN_LEGACY_BLOCK_START,
} from '../src/commands/agentRulesBlock';

const tempDirs: string[] = [];
const originalArgv = process.argv;

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function runCliInCwd(cwd: string, args: string[]): Promise<{ code: number; output: string }> {
  const logs: string[] = [];
  const originalCwd = process.cwd();
  const logSpy = vi.spyOn(console, 'log').mockImplementation((message = '') => logs.push(String(message)));

  process.chdir(cwd);
  process.argv = ['node', 'cli.js', ...args];

  try {
    const code = await main();
    return { code, output: logs.join('\n') };
  } finally {
    logSpy.mockRestore();
    process.argv = originalArgv;
    process.chdir(originalCwd);
  }
}

afterEach(async () => {
  vi.restoreAllMocks();
  process.argv = originalArgv;
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

describe('init --agents CLI command', () => {
  it('creates core agent injection files with bounded blocks', async () => {
    const cwd = await makeTempDir('viberaven-init-cli-');
    const { code, output } = await runCliInCwd(cwd, ['init', '--agents', 'all']);

    expect(code).toBe(0);
    expect(output).toContain('agent injection summary');
    expect(output).toContain('Created:');

    for (const target of CORE_AGENT_INJECTION_TARGETS) {
      if (target === 'cursor') {
        const core = await readFile(join(cwd, '.cursor/rules/viberaven-core.mdc'), 'utf-8');
        expect(core).toContain('alwaysApply: true');
        expect(core).toContain('npx -y viberaven --agent-mode');
        continue;
      }
      const file = AGENT_RULE_TARGETS[target].file;
      const content = await readFile(join(cwd, file), 'utf-8');
      expect(content).toContain(VIBERAVEN_BLOCK_START);
      expect(content).toContain(VIBERAVEN_BLOCK_END);
      expect(content).toContain('production readiness for AI-built apps');
      expect(content).toContain('npx -y viberaven --agent-mode');
    }
  });

  it('updates only the bounded block when legacy markers exist', async () => {
    const cwd = await makeTempDir('viberaven-init-legacy-');
    const agentsPath = join(cwd, 'AGENTS.md');
    const legacyBlock = [
      '# Project rules',
      '',
      VIBERAVEN_LEGACY_BLOCK_START,
      'old viberaven content',
      '<!-- viberaven:agent-rules:end -->',
      '',
      'Keep this user note.',
    ].join('\n');

    await writeFile(agentsPath, legacyBlock, 'utf-8');

    const { code } = await runCliInCwd(cwd, ['init', '--agents', 'codex']);
    expect(code).toBe(0);

    const content = await readFile(agentsPath, 'utf-8');
    expect(content).toContain('Keep this user note.');
    expect(content).not.toContain('old viberaven content');
    expect(content).toContain(VIBERAVEN_BLOCK_START);
    expect(content).toContain('production readiness for AI-built apps');
  });
});

describe('doctor --agents CLI command', () => {
  it('passes after init --agents all and fails before install', async () => {
    const cwd = await makeTempDir('viberaven-doctor-cli-');

    const before = await runCliInCwd(cwd, ['doctor', '--agents']);
    expect(before.code).toBe(1);
    expect(before.output).toContain('Agent injection checks failed');

    const init = await runCliInCwd(cwd, ['init', '--agents', 'all']);
    expect(init.code).toBe(0);

    const after = await runCliInCwd(cwd, ['doctor', '--agents']);
    expect(after.code).toBe(0);
    expect(after.output).toContain('All agent injection checks passed');
  });
});

import { access, mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { checkAgentInjection } from '../src/commands/doctorAgents';
import { initAgentRules } from '../src/commands/initRules';
import { CORE_AGENT_INJECTION_TARGETS } from '../src/commands/agentTargets';
import { PUBLIC_AGENT_MODE_COMMAND } from '../src/contracts/commands';

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

describe('doctor --agents', () => {
  it('passes when core agent injection files are installed', async () => {
    const cwd = await makeTempDir('viberaven-doctor-pass-');
    await initAgentRules({ cwd, targets: [...CORE_AGENT_INJECTION_TARGETS] });

    const report = await checkAgentInjection(cwd);

    expect(report.ok).toBe(true);
    expect(report.checks.some((check) => check.id === 'agents-md' && check.status === 'pass')).toBe(true);
    expect(report.checks.some((check) => check.id === 'claude-md' && check.status === 'pass')).toBe(true);
    expect(report.checks.some((check) => check.id === 'cursor-core-rule' && check.status === 'pass')).toBe(true);
    expect(report.checks.some((check) => check.id === 'cursor-supabase-rule' && check.status === 'pass')).toBe(true);
    expect(report.checks.some((check) => check.id === 'copilot-instructions' && check.status === 'pass')).toBe(true);
    expect(
      report.checks.filter((check) => check.id.startsWith('canonical-') && check.status === 'pass').length
    ).toBe(CORE_AGENT_INJECTION_TARGETS.length);
  });

  it('fails when required files are missing', async () => {
    const cwd = await makeTempDir('viberaven-doctor-missing-');
    const report = await checkAgentInjection(cwd);

    expect(report.ok).toBe(false);
    expect(report.checks.some((check) => check.id === 'agents-md' && check.status === 'fail')).toBe(true);
  });

  it('fails when canonical command is missing from an installed file', async () => {
    const cwd = await makeTempDir('viberaven-doctor-canonical-');
    await initAgentRules({ cwd, targets: [...CORE_AGENT_INJECTION_TARGETS] });

    const agentsPath = join(cwd, 'AGENTS.md');
    const content = await readFile(agentsPath, 'utf-8');
    await writeFile(
      agentsPath,
      content.replaceAll(PUBLIC_AGENT_MODE_COMMAND, 'npx -y @example/cli --agent-mode'),
      'utf-8'
    );

    const report = await checkAgentInjection(cwd);

    expect(report.ok).toBe(false);
    expect(report.checks.some((check) => check.id === 'canonical-codex' && check.status === 'fail')).toBe(true);
  });

  it('fails on stale beta, station, and viberice references', async () => {
    const cwd = await makeTempDir('viberaven-doctor-stale-');
    await initAgentRules({ cwd, targets: [...CORE_AGENT_INJECTION_TARGETS] });

    const agentsPath = join(cwd, 'AGENTS.md');
    const content = await readFile(agentsPath, 'utf-8');
    await writeFile(
      agentsPath,
      `${content}\nLegacy: @beta scan viberaven-station viberice-wordmark\n`,
      'utf-8'
    );

    const report = await checkAgentInjection(cwd);

    expect(report.ok).toBe(false);
    expect(report.checks.some((check) => check.id === 'stale-beta-scan-codex')).toBe(true);
    expect(report.checks.some((check) => check.id === 'stale-viberaven-station-codex')).toBe(true);
    expect(report.checks.some((check) => check.id === 'stale-viberice-codex')).toBe(true);
  });
});

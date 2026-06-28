import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { buildAgentRulesBlock, injectAgentRulesBlock } from '../src/commands/agentRulesBlock';
import { initAgentRules, renderAgentRulesDryRun } from '../src/commands/initRules';
import {
  AGENT_RULE_TARGETS,
  ALL_AGENT_RULE_TARGETS,
  CORE_AGENT_INJECTION_TARGETS,
  renderAgentRulesForTarget,
} from '../src/commands/agentTargets';
import { VIBERAVEN_BLOCK_START, VIBERAVEN_BLOCK_END, VIBERAVEN_LEGACY_BLOCK_START } from '../src/commands/agentRulesBlock';

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

describe('VibeRaven agent rule injection', () => {
  it('builds a bounded block with canonical agent commands', () => {
    const block = buildAgentRulesBlock();

    expect(block).toContain(VIBERAVEN_BLOCK_START);
    expect(block).toContain(VIBERAVEN_BLOCK_END);
    expect(block).toContain('production readiness for AI-built apps');
    expect(block).toContain('before launch, deployment, real users, auth, billing, database, RLS, env vars, webhooks, monitoring, or tests');
    expect(block).toContain('run VibeRaven, read Mission Map');
    expect(block).toContain('fix one launch gap, re-run VibeRaven');
    expect(block).toContain('## Event-Triggered Production Verification');
    expect(block).toContain('Trigger: modifications to');
    expect(block).toContain('Do NOT claim "production ready"');
    expect(block).toContain('Do NOT run verify after every file patch');
    expect(block).toContain('read `.viberaven/agent-tasklist.md` fully');
    expect(block).toContain('Prefer `viberaven_check_readiness`');
    expect(block).toContain('npx -y viberaven --agent-mode');
    expect(block).toContain('npx -y viberaven audit --vercel-supabase');
    expect(block).toContain('Before running build, compile, cleanup, deployment, vercel, or supabase commands');
    expect(block).toContain('run `npx -y viberaven --agent-mode` first');
    expect(block).toContain('.viberaven/agent-tasklist.md');
    expect(block).toContain('.viberaven/gate-result.json');
    expect(block).toContain('.viberaven/context-map.json');
    expect(block).toContain('Run `npx -y viberaven --verify` after one fix');
    expect(block).toContain('Run `npx -y viberaven --strict` before deploy or CI pass');
    expect(block).toContain('npx -y viberaven --heal --plan --gap <id>');
    expect(block).toContain('npx -y viberaven --heal --apply --gap <id> --yes');
    expect(block).toContain('Agent Context + Production Gate');
    expect(block).toContain('Provider dashboard checks are not cleared by repo-code edits');
    expect(block).toContain('.viberaven/agent-summary.md');
    expect(block).toContain('.viberaven/launch-playbook.md');
    expect(block).toContain('Do not claim provider dashboard work is fixed by repo-code edits');
    expect(block).toContain('LOGIN_URL_READY');
    expect(block).toContain('passwords');
    expect(block).toContain('tokens');
    expect(block).toContain('cookies');
    expect(block).toContain('secrets');
    expect(block).toContain('Keep the terminal process alive');
    expect(block).toContain(
      'I opened VibeRaven sign-in so you can approve access; I will continue after approval.'
    );
    expect(block).toContain('Stack context for this repo: Next.js, Supabase, Vercel, VibeRaven');
    expect(block).toContain('Do NOT deploy to Vercel or ship to production users');
    expect(block).toContain('OWASP LLM Top 10');
    expect(block).toContain('SAFECode-style');
    expect(block).toContain('Do NOT mark production-ready because the local dev server starts');
    expect(block).toContain('Do NOT treat the Supabase dashboard UI as proof of RLS');
    expect(block).toContain('viberaven_validate_npm_package');
    expect(block).toContain('Do NOT refactor or edit files unrelated to the current TASK-001 gap');
    expect(block).toContain('Do NOT install new dependencies unless TASK-001');
    expect(block).toContain('## Anchor (mandatory)');
    expect(block.indexOf('## Anchor (mandatory)')).toBeGreaterThan(block.indexOf('Production Copilot Loop'));
  });

  it('prepends the block to a file without an existing block', () => {
    const existing = '# Project Rules\n\nUse TypeScript.\n';
    const result = injectAgentRulesBlock(existing);

    expect(result.changed).toBe(true);
    expect(result.content.startsWith(VIBERAVEN_BLOCK_START)).toBe(true);
    expect(result.content).toContain('# Project Rules');
  });

  it('replaces an existing block without duplicating it', () => {
    const existing = [
      VIBERAVEN_BLOCK_START,
      'old rules',
      VIBERAVEN_BLOCK_END,
      '',
      '# Project Rules',
      ''
    ].join('\n');

    const result = injectAgentRulesBlock(existing);
    const matches = result.content.match(/VIBERAVEN:START/g) ?? [];

    expect(result.changed).toBe(true);
    expect(matches).toHaveLength(1);
    expect(result.content).not.toContain('old rules');
    expect(result.content).toContain('# Project Rules');
  });

  it('is idempotent after first injection', () => {
    const first = injectAgentRulesBlock('# Rules\n');
    const second = injectAgentRulesBlock(first.content);

    expect(second.changed).toBe(false);
    expect(second.content).toBe(first.content);
  });

  it('replaces Claude generated prefix with CRLF without duplicating it', () => {
    const oldBoundedBlock = [
      '<!-- viberaven:agent-rules:start -->',
      'old rules',
      '<!-- viberaven:agent-rules:end -->'
    ].join('\r\n');
    const rendered = renderAgentRulesForTarget('claude');
    const first = injectAgentRulesBlock(`@AGENTS.md\r\n\r\n${oldBoundedBlock}`, rendered);
    const second = injectAgentRulesBlock(first.content, rendered);

    expect(first.content).toBe(rendered);
    expect(second.changed).toBe(false);
    expect(second.content).toBe(rendered);
  });

  it('preserves user content before a Claude generated prefix', () => {
    const oldBoundedBlock = [
      '<!-- viberaven:agent-rules:start -->',
      'old rules',
      '<!-- viberaven:agent-rules:end -->'
    ].join('\n');
    const rendered = renderAgentRulesForTarget('claude');
    const result = injectAgentRulesBlock(`# Notes\n\n@AGENTS.md\n\n${oldBoundedBlock}`, rendered);
    const agentImports = result.content.match(/@AGENTS\.md/g) ?? [];

    expect(result.content).toBe(`# Notes\n\n${rendered}`);
    expect(agentImports).toHaveLength(1);
  });

  it('renders split Cursor core rule preview without full AGENTS block', () => {
    const rendered = renderAgentRulesForTarget('cursor');

    expect(rendered).toContain('VibeRaven production gate');
    expect(rendered).toContain('alwaysApply: true');
    expect(rendered).not.toContain('<!-- VIBERAVEN:START -->');
    expect(rendered).toContain('gate.status === "clear"');
  });

  it('previews target-specific dry-run content for selected agent targets', () => {
    const content = renderAgentRulesDryRun(['cursor', 'claude']);

    expect(content).toContain('.cursor/rules/viberaven-core.mdc');
    expect(content).toContain('.cursor/rules/viberaven-supabase-rls.mdc');
    expect(content).toContain('alwaysApply: true');
    expect(content).toContain('CLAUDE.md');
    expect(content).toContain('@AGENTS.md');
  });

  it('replaces legacy bounded blocks with the canonical markers', () => {
    const existing = [
      '# Project Rules',
      '',
      VIBERAVEN_LEGACY_BLOCK_START,
      'old rules',
      '<!-- viberaven:agent-rules:end -->',
      '',
      'User notes stay.',
    ].join('\n');

    const result = injectAgentRulesBlock(existing);

    expect(result.changed).toBe(true);
    expect(result.content).toContain(VIBERAVEN_BLOCK_START);
    expect(result.content).not.toContain('old rules');
    expect(result.content).toContain('User notes stay.');
  });

  it('creates core agent injection files by default and is idempotent', async () => {
    const cwd = await makeTempDir('viberaven-init-rules-all-');
    const { results: created } = await initAgentRules({ cwd });

    expect(created.filter((result) => result.target !== 'cursor')).toHaveLength(
      CORE_AGENT_INJECTION_TARGETS.length - 1
    );
    expect(created.filter((result) => result.target === 'cursor')).toHaveLength(4);
    expect(created.every((result) => result.action === 'created')).toBe(true);

    for (const target of CORE_AGENT_INJECTION_TARGETS) {
      if (target === 'cursor') {
        continue;
      }
      const file = AGENT_RULE_TARGETS[target].file;
      const content = await readFile(join(cwd, file), 'utf-8');

      expect(content).toContain(VIBERAVEN_BLOCK_START);
      expect(content).toContain('production readiness for AI-built apps');
      expect(content).toContain('npx -y viberaven --agent-mode');
    }

    const cursorCore = await readFile(join(cwd, '.cursor/rules/viberaven-core.mdc'), 'utf-8');
    expect(cursorCore).toContain('alwaysApply: true');
    expect(cursorCore).not.toContain('globs:');
    expect(cursorCore).toContain('gate.status === "clear"');

    const cursorSupabase = await readFile(join(cwd, '.cursor/rules/viberaven-supabase-rls.mdc'), 'utf-8');
    expect(cursorSupabase).toContain('supabase/**');
    expect(cursorSupabase).toContain('alwaysApply: false');

    await expect(access(join(cwd, '.cursor/rules/viberaven.mdc'))).rejects.toMatchObject({ code: 'ENOENT' });

    const missionMapContent = await readFile(join(cwd, '.viberaven/mission-map.md'), 'utf-8');
    expect(missionMapContent).toContain('# VibeRaven Mission Map');

    const agentContextContent = await readFile(join(cwd, '.viberaven/agent-context.md'), 'utf-8');
    expect(agentContextContent).toContain('# VibeRaven Agent Context');

    const { results: unchanged } = await initAgentRules({ cwd });
    expect(unchanged.filter((result) => result.target === 'cursor')).toHaveLength(4);
    expect(unchanged.every((result) => result.action === 'unchanged')).toBe(true);
  });

  it('creates selected agent rule files and leaves dry runs on disk untouched', async () => {
    const cwd = await makeTempDir('viberaven-init-rules-');
    const { results: created } = await initAgentRules({ cwd, targets: ['cursor', 'claude'] });

    expect(created.filter((result) => result.target === 'cursor')).toHaveLength(4);
    expect(created.find((result) => result.target === 'claude')).toEqual({
      target: 'claude',
      file: 'CLAUDE.md',
      path: join(cwd, 'CLAUDE.md'),
      action: 'created',
    });

    const cursorCore = await readFile(join(cwd, '.cursor/rules/viberaven-core.mdc'), 'utf-8');
    const claudeContent = await readFile(join(cwd, 'CLAUDE.md'), 'utf-8');
    expect(cursorCore).toContain('alwaysApply: true');
    expect(claudeContent).toContain('@AGENTS.md');

    const dryRunDir = await makeTempDir('viberaven-init-rules-dry-run-');
    const { results: dryRun } = await initAgentRules({
      cwd: dryRunDir,
      targets: ['cursor', 'claude'],
      dryRun: true,
    });
    expect(dryRun.filter((result) => result.target === 'cursor')).toHaveLength(4);
    await expect(access(join(dryRunDir, '.cursor/rules/viberaven-core.mdc'))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(access(join(dryRunDir, 'CLAUDE.md'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('can install extended agent targets when requested explicitly', async () => {
    const cwd = await makeTempDir('viberaven-init-rules-extended-');
    const { results: created } = await initAgentRules({ cwd, targets: [...ALL_AGENT_RULE_TARGETS] });

    expect(created).toHaveLength(ALL_AGENT_RULE_TARGETS.length + 3);
    expect(created.filter((result) => result.target === 'cursor')).toHaveLength(4);
  });
});

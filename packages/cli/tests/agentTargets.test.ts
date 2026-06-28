import { describe, expect, it } from 'vitest';
import {
  AGENT_RULE_TARGETS,
  CORE_AGENT_INJECTION_TARGETS,
  getAgentRulesTargets,
  renderAgentRulesForTarget,
  validAgentRulesTargetText,
} from '../src/commands/agentTargets';
import { VIBERAVEN_BLOCK_END, VIBERAVEN_BLOCK_START } from '../src/commands/agentRulesBlock';

describe('agent target registry', () => {
  it('supports the agent instruction files VibeRaven should install', () => {
    expect(AGENT_RULE_TARGETS.codex.file).toBe('AGENTS.md');
    expect(AGENT_RULE_TARGETS.claude.file).toBe('CLAUDE.md');
    expect(AGENT_RULE_TARGETS.cursor.file).toBe('.cursor/rules/viberaven-core.mdc');
    expect(AGENT_RULE_TARGETS.cursorLegacy.file).toBe('.cursorrules');
    expect(AGENT_RULE_TARGETS.copilot.file).toBe('.github/copilot-instructions.md');
    expect(AGENT_RULE_TARGETS.gemini.file).toBe('GEMINI.md');
    expect(AGENT_RULE_TARGETS.agentContext.file).toBe('.viberaven/agent-context.md');
    expect(AGENT_RULE_TARGETS.missionMap.file).toBe('.viberaven/mission-map.md');
    expect(AGENT_RULE_TARGETS.devin.file).toBe('.devin/rules/viberaven.md');
    expect(AGENT_RULE_TARGETS.windsurf.file).toBe('.windsurf/rules/viberaven.md');
    expect(AGENT_RULE_TARGETS.cline.file).toBe('.clinerules/viberaven.md');
    expect(AGENT_RULE_TARGETS.roo.file).toBe('.roo/rules/viberaven.md');
    expect(AGENT_RULE_TARGETS.junie.file).toBe('.junie/guidelines.md');
    expect(AGENT_RULE_TARGETS.zed.file).toBe('.rules');
  });

  it('returns core injection targets for all', () => {
    expect(getAgentRulesTargets('all')).toEqual(CORE_AGENT_INJECTION_TARGETS);
    expect(getAgentRulesTargets(undefined)).toEqual(CORE_AGENT_INJECTION_TARGETS);
  });

  it('parses comma-separated target aliases in registry order', () => {
    expect(getAgentRulesTargets('cursor,codex,github-copilot')).toEqual(['codex', 'cursor', 'copilot']);
  });

  it('throws a useful error for unknown targets', () => {
    expect(() => getAgentRulesTargets('ai-md')).toThrow(
      `Unknown agent rules target "ai-md". Valid targets: ${validAgentRulesTargetText()}.`
    );
  });

  it('renders split Cursor core MDC preview with alwaysApply true', () => {
    const content = renderAgentRulesForTarget('cursor');
    expect(content).toContain('---');
    expect(content).toContain('description: VibeRaven production gate');
    expect(content).toContain('alwaysApply: true');
    expect(content).not.toContain('globs:');
    expect(content).toContain('npx -y viberaven --agent-mode');
    expect(content).toContain('gate.status === "clear"');
    expect(content).not.toContain(VIBERAVEN_BLOCK_START);
  });

  it('renders Claude import guidance while keeping the full bounded block', () => {
    const content = renderAgentRulesForTarget('claude');
    expect(content).toContain('@AGENTS.md');
    expect(content).toContain('npx -y viberaven --agent-mode');
    expect(content).toContain(VIBERAVEN_BLOCK_START);
    expect(content).toContain(VIBERAVEN_BLOCK_END);
  });
});

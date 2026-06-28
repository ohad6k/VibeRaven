import {
  buildAgentContextBlock,
  buildAgentRulesBlock,
  buildMissionMapBlock,
} from './agentRulesBlock';
import { renderCursorCoreRulePreview } from './cursorRulesPack';

export type AgentRulesTarget =
  | 'codex'
  | 'claude'
  | 'cursor'
  | 'cursorLegacy'
  | 'copilot'
  | 'gemini'
  | 'agentContext'
  | 'missionMap'
  | 'devin'
  | 'windsurf'
  | 'cline'
  | 'roo'
  | 'junie'
  | 'zed';

export type AgentRulesTargetConfig = {
  file: string;
  aliases?: string[];
};

export const AGENT_RULE_TARGETS: Record<AgentRulesTarget, AgentRulesTargetConfig> = {
  codex: { file: 'AGENTS.md' },
  claude: { file: 'CLAUDE.md' },
  cursor: { file: '.cursor/rules/viberaven-core.mdc' },
  cursorLegacy: { file: '.cursorrules', aliases: ['cursor-legacy'] },
  copilot: { file: '.github/copilot-instructions.md', aliases: ['github-copilot'] },
  gemini: { file: 'GEMINI.md' },
  agentContext: { file: '.viberaven/agent-context.md', aliases: ['agent-context'] },
  missionMap: { file: '.viberaven/mission-map.md', aliases: ['mission-map'] },
  devin: { file: '.devin/rules/viberaven.md' },
  windsurf: { file: '.windsurf/rules/viberaven.md' },
  cline: { file: '.clinerules/viberaven.md' },
  roo: { file: '.roo/rules/viberaven.md' },
  junie: { file: '.junie/guidelines.md' },
  zed: { file: '.rules' },
};

/** Default files written by `init --agents all`. */
export const CORE_AGENT_INJECTION_TARGETS: AgentRulesTarget[] = [
  'codex',
  'claude',
  'gemini',
  'cursor',
  'copilot',
  'agentContext',
  'missionMap',
];

export const EXTENDED_AGENT_RULE_TARGETS: AgentRulesTarget[] = [
  'cursorLegacy',
  'devin',
  'windsurf',
  'cline',
  'roo',
  'junie',
  'zed',
];

export const ALL_AGENT_RULE_TARGETS: AgentRulesTarget[] = [
  ...CORE_AGENT_INJECTION_TARGETS,
  ...EXTENDED_AGENT_RULE_TARGETS,
];

const AGENT_RULE_TARGET_ALIAS_ENTRIES: [string, AgentRulesTarget][] = ALL_AGENT_RULE_TARGETS.flatMap((target) => [
  [target.toLowerCase(), target],
  ...(AGENT_RULE_TARGETS[target].aliases ?? []).map((alias): [string, AgentRulesTarget] => [alias, target]),
]);

const AGENT_RULE_TARGET_ALIASES = new Map<string, AgentRulesTarget>(AGENT_RULE_TARGET_ALIAS_ENTRIES);

const VALID_AGENT_RULES_TARGET_TEXT =
  'all, codex, claude, cursor, cursor-legacy, copilot, github-copilot, gemini, agent-context, mission-map, devin, windsurf, cline, roo, junie, zed';

export function renderAgentRulesForTarget(target: AgentRulesTarget): string {
  if (target === 'claude') {
    return ['@AGENTS.md', '', buildAgentRulesBlock()].join('\n');
  }

  if (target === 'cursor') {
    return renderCursorCoreRulePreview();
  }

  if (target === 'agentContext') {
    return ['# VibeRaven Agent Context', '', buildAgentContextBlock()].join('\n');
  }

  if (target === 'missionMap') {
    return ['# VibeRaven Mission Map', '', buildMissionMapBlock()].join('\n');
  }

  return buildAgentRulesBlock();
}

export function validAgentRulesTargetText(): string {
  return VALID_AGENT_RULES_TARGET_TEXT;
}

export function getAgentRulesTargets(value?: string): AgentRulesTarget[] {
  if (value === undefined || value.trim() === '' || value.trim().toLowerCase() === 'all') {
    return [...CORE_AGENT_INJECTION_TARGETS];
  }

  const requested = value
    .split(',')
    .map((target) => target.trim().toLowerCase())
    .filter(Boolean);

  if (requested.length === 0 || requested.includes('all')) {
    return [...CORE_AGENT_INJECTION_TARGETS];
  }

  const resolved = requested.map((target) => {
    const canonicalTarget = AGENT_RULE_TARGET_ALIASES.get(target);
    if (!canonicalTarget) {
      throw new Error(`Unknown agent rules target "${target}". Valid targets: ${validAgentRulesTargetText()}.`);
    }
    return canonicalTarget;
  });

  const requestedTargets = new Set(resolved);
  return ALL_AGENT_RULE_TARGETS.filter((target) => requestedTargets.has(target));
}

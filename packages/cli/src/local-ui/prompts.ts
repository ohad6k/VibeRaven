export interface BuildLocalUiPromptInput {
  projectName: string;
  providerName: string;
  itemTitle: string;
  issueSummary: string;
  gapId?: string;
}

export function buildLocalUiPrompt(input: BuildLocalUiPromptInput): string {
  const lines = [
    'You are fixing one VibeRaven production-readiness gap.',
    '',
    `Project: ${input.projectName}`,
    `Provider: ${input.providerName}`,
    `Launch path item: ${input.itemTitle}`,
    input.gapId ? `Gap: ${input.gapId}` : undefined,
    `Current issue: ${input.issueSummary}`,
    '',
    'Read:',
    '- .viberaven/agent-tasklist.md',
    '- .viberaven/context-map.json',
    '- .viberaven/gate-result.json',
    '',
    'Fix only this repo-code gap.',
    'Do not claim production-ready until VibeRaven verify is clear.',
    'Provider dashboard setup remains manual unless VibeRaven has live provider evidence.',
    'After the fix, run:',
    'npx -y viberaven --verify'
  ].filter((line): line is string => line !== undefined);

  return lines.join('\n');
}

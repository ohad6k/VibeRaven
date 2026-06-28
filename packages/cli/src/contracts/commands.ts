export const PUBLIC_PACKAGE = 'viberaven';
export const PUBLIC_COMMAND = `npx -y ${PUBLIC_PACKAGE}`;
export const PUBLIC_AGENT_MODE_COMMAND = `${PUBLIC_COMMAND} --agent-mode`;
export const PUBLIC_VERIFY_COMMAND = `${PUBLIC_COMMAND} --verify`;
export const PUBLIC_STRICT_COMMAND = `${PUBLIC_COMMAND} --strict`;
export const PUBLIC_CONDENSE_COMMAND = `${PUBLIC_COMMAND} --condense`;
export const PUBLIC_INIT_ALL_COMMAND = `${PUBLIC_COMMAND} init --agents all`;
export const PUBLIC_AUDIT_COMMAND = `${PUBLIC_COMMAND} audit --vercel-supabase`;
export const PUBLIC_NEXT_JSON_COMMAND = `${PUBLIC_COMMAND} next --json`;
export const PUBLIC_CLEAN_PLAN_COMMAND = `${PUBLIC_COMMAND} clean --plan`;
export const PUBLIC_ACTIONS_COMMAND = `${PUBLIC_COMMAND} actions`;

export function promptGapCommand(gapId: string): string {
  return `${PUBLIC_COMMAND} prompt --gap ${gapId}`;
}

export function healPlanGapCommand(gapId: string): string {
  return `${PUBLIC_COMMAND} --heal --plan --gap ${gapId}`;
}

export function healPromptGapCommand(gapId: string): string {
  return `${PUBLIC_COMMAND} --heal --prompt --gap ${gapId}`;
}

export function healApplyGapCommand(gapId: string): string {
  return `${PUBLIC_COMMAND} --heal --apply --gap ${gapId}`;
}

export function verifyActionCommand(actionId: string): string {
  return `${PUBLIC_COMMAND} verify --action ${actionId}`;
}

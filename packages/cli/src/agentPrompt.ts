import type { Gap } from '../../../src/station/types';
import {
  PUBLIC_AUDIT_COMMAND,
  PUBLIC_CLEAN_PLAN_COMMAND,
  PUBLIC_COMMAND,
} from './contracts/commands';
import type { CliScanArtifact } from './types';

function compact(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function originalHint(gap: Gap): string {
  const hint = compact(gap.copyPrompt);
  return hint ? hint : 'No scanner hint was returned for this gap.';
}

export function buildAgentFixPrompt(artifact: CliScanArtifact, gap: Gap): string {
  const affected = [gap.primaryMapCategory, ...(gap.affectedMapCategories ?? [])]
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index)
    .join(', ');

  return [
    'You are an AI coding agent using VibeRaven as the production-readiness map.',
    '',
    'Goal: turn this demo/MVP into a more production-ready app by fixing one repo-code gap at a time.',
    '',
    `Project: ${artifact.workspacePath}`,
    `Current VibeRaven state: production core ${artifact.productionCorePercent}% | score ${artifact.score} (${artifact.scoreLabel})`,
    `Gap: ${gap.title}`,
    `Gap id: ${gap.id}`,
    `Severity: ${gap.severity}`,
    `Production area: ${gap.primaryMapCategory}${affected ? ` | affected: ${affected}` : ''}`,
    `Scanner detail: ${compact(gap.detail)}`,
    '',
    'Required workflow:',
    '1. Read `.viberaven/agent-summary.md` and `.viberaven/launch-playbook.md` before changing code.',
    '2. If VibeRaven prints LOGIN_URL_READY, open that URL for the user using the available browser tool or system browser. Tell the user: "I opened VibeRaven sign-in so you can approve access; I will continue after approval." Do not ask for passwords, tokens, cookies, or secrets.',
    '3. If the browser cannot open automatically, use the printed LOGIN_URL_READY URL. Keep the terminal process alive while the user approves.',
    '4. Inspect the real implementation files. Do not assume framework/provider wiring from package names alone.',
    '5. Make the smallest durable repo-code change that addresses this specific gap.',
    '6. Keep provider dashboard work separate. Open provider dashboards only when VibeRaven asks for a provider/manual action, and explain why you opened them.',
    `7. For Vercel + Supabase apps, run \`${PUBLIC_AUDIT_COMMAND}\` before claiming production readiness.`,
    '8. Treat that audit as local repo evidence only; do not claim provider dashboard settings are fixed unless the user verifies them or read-only provider MCP confirms them.',
    '9. Do not claim provider dashboard or read-only MCP checks as repo-code fixes.',
    `10. VibeRaven cleanup is non-destructive. You may run \`${PUBLIC_CLEAN_PLAN_COMMAND}\` only to create a reviewable context cleanup plan, not to delete code.`,
    '',
    'Implementation constraints:',
    '- Prefer the existing stack and local patterns already in the repo.',
    '- Do not add a new auth, database, payment, monitoring, or deployment provider unless the scan/playbook explicitly asks for that migration.',
    '- Do not expose secrets, create fake env values, or mark live-provider proof complete without user/provider confirmation.',
    '- Keep the change scoped to this gap; leave unrelated refactors alone.',
    '',
    'Verification:',
    '- Run the relevant local tests, typecheck, lint, or build command for the touched area.',
    `- Run \`${PUBLIC_COMMAND}\` again. In an agent/non-interactive shell this should rescan and refresh \`.viberaven/\` artifacts.`,
    '- Report what changed, what verification passed, and which VibeRaven gap remains next.',
    '',
    'Original scanner hint:',
    originalHint(gap)
  ].join('\n');
}

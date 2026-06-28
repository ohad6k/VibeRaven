import { buildActionKey, displayRepoPath, normalizeActionPath } from './canonical';
import type { VibeRavenAction } from './types';
import { PUBLIC_COMMAND } from '../contracts/commands';
import type { TaskItem } from '../contracts/taskItem';
import type { CliScanArtifact } from '../types';

export interface DeriveActionsInput {
  artifact: CliScanArtifact;
  tasks: TaskItem[];
  paths: {
    reportPath: string;
    playbookPath: string;
  };
}

function verifyActionCommand(id: string): string {
  return `${PUBLIC_COMMAND} verify --action ${id}`;
}

function providerTitle(task: TaskItem): string {
  const provider = task.providerAction?.provider.toLowerCase();
  if (provider === 'stripe') {
    return 'Connect Stripe Webhook';
  }
  if (provider === 'supabase') {
    return 'Confirm Supabase Production Proof';
  }
  if (provider === 'vercel') {
    return 'Confirm Vercel Production Setup';
  }
  return task.title;
}

function deriveProviderAction(task: TaskItem): VibeRavenAction {
  const provider = task.providerAction?.provider.toLowerCase() ?? 'provider';
  const exactStep = task.providerAction?.exactStep ?? task.title;
  const title = providerTitle(task);
  const actionKey = buildActionKey({
    kind: 'provider-action',
    provider,
    category: task.gapId,
    target: exactStep,
    values: [task.providerAction?.doneSignal ?? ''],
  });

  return {
    id: 'pending',
    actionKey,
    revision: 1,
    kind: 'provider-action',
    provider,
    title,
    status: provider === 'supabase' ? 'waiting-on-database-proof' : 'waiting-on-provider',
    severity: task.severity,
    gapId: task.gapId,
    readiness: [task.providerAction?.doneSignal ?? 'Provider step identified'],
    target: {
      type: 'provider',
      label: exactStep,
      provider,
    },
    verifyCommand: verifyActionCommand('pending'),
    resumeInstruction: `${title} is complete. Continue VibeRaven from pending.`,
  };
}

function deriveRepoCodeAction(task: TaskItem): VibeRavenAction {
  const targetSource = task.file ?? task.gapId;
  const canonicalFile = normalizeActionPath(targetSource);
  const displayFile = displayRepoPath(targetSource);
  const actionKey = buildActionKey({
    kind: 'repo-code',
    provider: 'repo',
    category: task.gapId,
    target: canonicalFile,
    values: [task.mcpTool ?? '', task.exactFix ?? ''],
  });

  return {
    id: 'pending',
    actionKey,
    revision: 1,
    kind: 'repo-code',
    title: task.title,
    status: 'active',
    severity: task.severity,
    gapId: task.gapId,
    readiness: [task.exactFix ?? 'Repo-code fix is available'],
    target: task.file
      ? { type: 'file', label: 'Repo target', path: displayFile }
      : { type: 'command', label: 'Apply repo fix', command: task.mcpTool ?? `${PUBLIC_COMMAND} prompt --gap ${task.gapId}` },
    fileTargets: task.file ? [{ path: displayFile, reason: task.exactFix }] : undefined,
    verifyCommand: verifyActionCommand('pending'),
    resumeInstruction: `${task.title} is complete. Continue VibeRaven from pending.`,
    mcpTool: task.mcpTool,
    mcpArgs: task.mcpArgs,
    fallbackCommand: `${PUBLIC_COMMAND} --heal --apply --gap ${task.gapId} --yes`,
  };
}

function deriveVerifyAction(): VibeRavenAction {
  return {
    id: 'pending',
    actionKey: buildActionKey({
      kind: 'verify',
      provider: 'gate',
      category: 'final',
      target: `${PUBLIC_COMMAND} --strict`,
    }),
    revision: 1,
    kind: 'verify',
    title: 'Run Final Verification',
    status: 'blocked',
    readiness: ['Run after provider and repo-code actions are complete'],
    target: { type: 'command', label: 'Final strict gate', command: `${PUBLIC_COMMAND} --strict` },
    verifyCommand: `${PUBLIC_COMMAND} --strict`,
    resumeInstruction: 'Final verification finished. Continue VibeRaven from pending.',
  };
}

export function deriveCurrentActions(input: DeriveActionsInput): VibeRavenAction[] {
  const primaryActions = input.tasks
    .filter((task) => task.fixType === 'provider-action' || task.fixType === 'repo-code')
    .map((task) => (task.fixType === 'provider-action' ? deriveProviderAction(task) : deriveRepoCodeAction(task)));

  return [...primaryActions, deriveVerifyAction()];
}

import type { GuidedAction, RunnerJobKind } from './deploy';
import { isSafeFixJobKind, validateSafeFixJobInput } from './runnerSafeFix';

export type GuidedActionClass = 'repo_fix' | 'provider_setup' | 'deep_scan';

const SCAN_JOB_KINDS = new Set<RunnerJobKind>(['deep_station_scan', 'scan_repo', 'rescan']);

function actionText(action: GuidedAction): string {
  return `${action.title} ${action.description} ${action.userFacingReason}`.toLowerCase();
}

function isScanRelated(action: GuidedAction): boolean {
  if (action.destination?.kind === 'runner_job') {
    const jobKind = action.destination.jobKind as RunnerJobKind;
    if (SCAN_JOB_KINDS.has(jobKind)) {
      return true;
    }
  }
  const text = actionText(action);
  return /\b(deep scan|deep_station_scan|rescan|scan repo)\b/.test(text);
}

export function guidedActionClass(action: GuidedAction): GuidedActionClass {
  if (isScanRelated(action)) {
    return 'deep_scan';
  }
  if (action.destination?.kind === 'api' && action.destination.operation === 'create_runner_pairing') {
    return 'repo_fix';
  }
  if (action.destination?.kind === 'runner_job' || action.executionMode === 'runner_job') {
    return 'repo_fix';
  }
  if (action.destination?.kind === 'url') {
    return 'provider_setup';
  }
  if (action.section === 'provider_setup' && action.executionMode === 'manual') {
    return 'provider_setup';
  }
  if (action.executionMode === 'open_url' || action.executionMode === 'manual') {
    return 'provider_setup';
  }
  return 'repo_fix';
}

export function providerDisplayName(action: GuidedAction): string {
  if (action.provider) {
    const normalized = action.provider.replace(/_/g, ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
  if (action.destination?.kind === 'url') {
    return action.destination.label;
  }
  return 'provider';
}

export function primaryLabelForAction(action: GuidedAction): string {
  const actionClass = guidedActionClass(action);
  if (actionClass === 'provider_setup') {
    return `Open ${providerDisplayName(action)}`;
  }
  if (actionClass === 'repo_fix') {
    if (action.destination?.kind === 'api' || action.destination?.kind === 'runner_job') {
      return action.primaryButtonLabel;
    }
    return 'Run fix in repo';
  }
  return action.primaryButtonLabel;
}

export function buildCopyPromptMarkdown(action: GuidedAction): string {
  const lines = [`# ${action.title}`, ''];
  const reason = action.userFacingReason || action.description;
  if (reason) {
    lines.push(reason, '');
  }
  if (action.exactValues.length > 0) {
    lines.push('## Values', '');
    for (const value of action.exactValues) {
      lines.push(`- **${value.label}**: \`${value.value}\``);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

export type RepoFixEnqueueTarget =
  | { mode: 'pairing' }
  | { mode: 'verify' }
  | { mode: 'enqueue'; kind: RunnerJobKind; input: Record<string, unknown> };

export function resolveRepoFixEnqueue(action: GuidedAction): RepoFixEnqueueTarget | null {
  if (action.destination?.kind === 'api' && action.destination.operation === 'create_runner_pairing') {
    return { mode: 'pairing' };
  }
  if (action.destination?.kind === 'runner_job') {
    return { mode: 'verify' };
  }
  const safeFix = parseSafeFixEnqueueFromExactValues(action);
  if (safeFix) {
    return safeFix;
  }
  return null;
}

function parseSafeFixEnqueueFromExactValues(action: GuidedAction): RepoFixEnqueueTarget | null {
  const raw = action.exactValues.find((value) => value.label === 'Safe fix input')?.value;
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as { kind?: RunnerJobKind; input?: Record<string, unknown> };
    if (!parsed.kind || !isSafeFixJobKind(parsed.kind)) {
      return null;
    }
    const validation = validateSafeFixJobInput(parsed.kind, parsed.input ?? {});
    if (!validation.ok) {
      return null;
    }
    return { mode: 'enqueue', kind: parsed.kind, input: validation.input };
  } catch {
    return null;
  }
}

export function canQueueRunnerVerification(action: GuidedAction): boolean {
  return action.verificationState === 'not_started' || action.verificationState === 'needs_user_action';
}

export function isProviderSetupManuallyConfirmable(action: GuidedAction): boolean {
  return guidedActionClass(action) === 'provider_setup';
}

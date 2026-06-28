import type { TaskItem } from '../contracts/taskItem';
import type { LoopState } from '../loopState';

export interface NextActionBlock {
  gapId?: string;
  type: 'repo-code' | 'verify' | 'provider-action' | 'upgrade-required' | 'stalled' | 'done';
  title: string;
  mcpTool?: string;
  mcpArgs?: Record<string, unknown>;
  fallbackCommand?: string;
  requiresUserAction: boolean;
  batchSize: number;         // free=3, pro=10
  batchApplied: number;      // from loopState
  remainingInBatch: number;  // batchSize - batchApplied
  scanNow: boolean;          // true = batch full, agent must call verify before next heal
  stalled: boolean;          // true = stalledScans >= 2
  stalledScans: number;
  stallReason?: 'no-recipes' | 'provider-action-required' | 'unknown';
  upgradeUrl?: string;
}

/**
 * Build the VIBERAVEN_NEXT_ACTION block from the current task list and loop state.
 *
 * Priority order:
 *   stalled > verify (scanNow) > repo-code > provider-action > upgrade-required > done
 */
export function buildNextActionBlock(
  tasks: TaskItem[],
  loopState: LoopState,
  plan: string
): NextActionBlock {
  const batchSize = plan === 'pro' ? 10 : 3;
  const batchApplied = loopState.batchApplied;
  const remainingInBatch = batchSize - batchApplied;
  const scanNow = batchApplied >= batchSize;
  const stalled = loopState.stalledScans >= 2;
  const stalledScans = loopState.stalledScans;

  const base = { batchSize, batchApplied, remainingInBatch, scanNow, stalled, stalledScans };

  // 1. Stalled — highest priority
  if (stalled) {
    const stallReason = resolveStallReason(tasks);
    return {
      ...base,
      type: 'stalled',
      title: 'Loop stalled — no gap reduction after 2+ consecutive scans',
      requiresUserAction: true,
      stallReason,
    };
  }

  // 2. Batch full — must verify before next heal
  if (scanNow) {
    return {
      ...base,
      type: 'verify',
      title: 'Batch complete — run verify to rescan before next batch',
      mcpTool: 'viberaven_verify',
      mcpArgs: {},
      requiresUserAction: false,
    };
  }

  // 3. First repo-code task that doesn't require user action
  const repoCodeTask = tasks.find((t) => t.fixType === 'repo-code' && !t.requiresUserAction);
  if (repoCodeTask) {
    return {
      ...base,
      type: 'repo-code',
      gapId: repoCodeTask.gapId,
      title: repoCodeTask.title,
      mcpTool: repoCodeTask.mcpTool,
      mcpArgs: repoCodeTask.mcpArgs,
      fallbackCommand: repoCodeTask.mcpArgs
        ? `npx -y viberaven --heal --apply --gap ${repoCodeTask.gapId} --yes`
        : undefined,
      requiresUserAction: false,
    };
  }

  // 4. First provider-action task
  const providerTask = tasks.find((t) => t.fixType === 'provider-action');
  if (providerTask) {
    return {
      ...base,
      type: 'provider-action',
      gapId: providerTask.gapId,
      title: providerTask.title,
      requiresUserAction: true,
    };
  }

  // 5. First upgrade-required task
  const upgradeTask = tasks.find((t) => t.fixType === 'upgrade-required');
  if (upgradeTask) {
    return {
      ...base,
      type: 'upgrade-required',
      gapId: upgradeTask.gapId,
      title: upgradeTask.title,
      requiresUserAction: true,
      upgradeUrl: 'https://viberaven.dev/pricing',
    };
  }

  // 6. No tasks — done
  return {
    ...base,
    type: 'done',
    title: 'All gaps resolved — production gate is clear',
    requiresUserAction: false,
  };
}

function resolveStallReason(
  tasks: TaskItem[]
): 'no-recipes' | 'provider-action-required' | 'unknown' {
  if (tasks.length === 0) return 'no-recipes';

  const allUpgradeOrEmpty = tasks.every((t) => t.fixType === 'upgrade-required');
  if (allUpgradeOrEmpty) return 'no-recipes';

  const allProviderAction = tasks.every((t) => t.fixType === 'provider-action');
  if (allProviderAction) return 'provider-action-required';

  return 'unknown';
}

const NEXT_ACTION_START = 'VIBERAVEN_NEXT_ACTION_START';
const NEXT_ACTION_END = 'VIBERAVEN_NEXT_ACTION_END';

const PROVIDER_ACTION_START = 'VIBERAVEN_PROVIDER_ACTION_START';
const PROVIDER_ACTION_END = 'VIBERAVEN_PROVIDER_ACTION_END';

/**
 * Build the VIBERAVEN_PROVIDER_ACTION JSON object for a provider-action task.
 */
export function buildProviderActionBlock(task: TaskItem): object | undefined {
  if (task.fixType !== 'provider-action' || !task.providerAction) {
    return undefined;
  }

  const pa = task.providerAction;
  return {
    VIBERAVEN_PROVIDER_ACTION: {
      gap: task.gapId,
      provider: pa.provider,
      dashboardUrl: pa.dashboardUrl,
      exactStep: pa.exactStep,
      envKeyName: pa.envKeyName ?? null,
      envKeyExample: pa.envKeyExample ?? null,
      doneSignal: pa.doneSignal,
      verifyCommand: task.verifyCommand,
      mcpAlternative: task.mcpTool ?? pa.mcpAlternative ?? null,
    },
  };
}

/**
 * Print the VIBERAVEN_PROVIDER_ACTION block to stdout for the first
 * provider-action task that requires user action.
 */
export function printProviderActionBlock(tasks: TaskItem[]): void {
  const task = tasks.find(
    (t) => t.fixType === 'provider-action' && t.requiresUserAction === true
  );
  if (!task) return;

  const block = buildProviderActionBlock(task);
  if (!block) return;

  console.log(PROVIDER_ACTION_START);
  console.log(JSON.stringify(block, null, 2));
  console.log(PROVIDER_ACTION_END);
}

/**
 * Print the VIBERAVEN_NEXT_ACTION block to stdout.
 */
export function printNextActionBlock(block: NextActionBlock): void {
  console.log(NEXT_ACTION_START);
  console.log(JSON.stringify(block, null, 2));
  console.log(NEXT_ACTION_END);
}

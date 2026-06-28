import { describe, it, expect } from 'vitest';
import { buildNextActionBlock } from '../src/output/nextActionBlock';
import type { TaskItem } from '../src/contracts/taskItem';
import type { LoopState } from '../src/loopState';

function makeState(partial: Partial<LoopState> = {}): LoopState {
  return { batchApplied: 0, lastGapCount: -1, stalledScans: 0, ...partial };
}

function makeRepoCodeTask(gapId = 'gap_repo'): TaskItem {
  return {
    id: 'TASK-001',
    gapId,
    severity: 'critical',
    fixType: 'repo-code',
    title: 'Fix repo-code gap',
    verifyCommand: 'npx -y viberaven --verify',
    mcpTool: 'viberaven_heal_apply',
    mcpArgs: { gap: gapId, yes: true },
    requiresUserAction: false,
  };
}

function makeProviderTask(gapId = 'gap_provider'): TaskItem {
  return {
    id: 'TASK-002',
    gapId,
    severity: 'critical',
    fixType: 'provider-action',
    title: 'Configure provider',
    verifyCommand: 'npx -y viberaven --verify',
    requiresUserAction: true,
  };
}

function makeUpgradeTask(gapId = 'gap_upgrade'): TaskItem {
  return {
    id: 'TASK-003',
    gapId,
    severity: 'warning',
    fixType: 'upgrade-required',
    title: 'Upgrade required',
    verifyCommand: 'npx -y viberaven --verify',
    requiresUserAction: true,
  };
}

describe('buildNextActionBlock — batch metadata', () => {
  it('free plan, batchApplied=0: batchSize=3, scanNow=false, stalled=false, remainingInBatch=3', () => {
    const state = makeState({ batchApplied: 0, stalledScans: 0 });
    const block = buildNextActionBlock([makeRepoCodeTask()], state, 'free');
    expect(block.batchSize).toBe(3);
    expect(block.scanNow).toBe(false);
    expect(block.stalled).toBe(false);
    expect(block.remainingInBatch).toBe(3);
    expect(block.stalledScans).toBe(0);
  });

  it('pro plan, batchApplied=0: batchSize=10, remainingInBatch=10', () => {
    const state = makeState({ batchApplied: 0, stalledScans: 0 });
    const block = buildNextActionBlock([makeRepoCodeTask()], state, 'pro');
    expect(block.batchSize).toBe(10);
    expect(block.remainingInBatch).toBe(10);
  });

  it('unknown plan defaults to free (batchSize=3)', () => {
    const state = makeState();
    const block = buildNextActionBlock([makeRepoCodeTask()], state, 'unknown');
    expect(block.batchSize).toBe(3);
  });

  it('free plan, batchApplied=2: remainingInBatch=1, scanNow=false', () => {
    const state = makeState({ batchApplied: 2 });
    const block = buildNextActionBlock([makeRepoCodeTask()], state, 'free');
    expect(block.remainingInBatch).toBe(1);
    expect(block.scanNow).toBe(false);
  });
});

describe('buildNextActionBlock — type priority', () => {
  it('free plan, batchApplied=3: scanNow=true, type=verify', () => {
    const state = makeState({ batchApplied: 3, stalledScans: 0 });
    const block = buildNextActionBlock([makeRepoCodeTask()], state, 'free');
    expect(block.scanNow).toBe(true);
    expect(block.type).toBe('verify');
    expect(block.mcpTool).toBe('viberaven_verify');
    expect(block.stalled).toBe(false);
  });

  it('repo-code task available, not stalled, not scanNow: type=repo-code with mcpTool', () => {
    const state = makeState({ batchApplied: 0, stalledScans: 0 });
    const task = makeRepoCodeTask('auth_secret');
    const block = buildNextActionBlock([task], state, 'free');
    expect(block.type).toBe('repo-code');
    expect(block.mcpTool).toBe('viberaven_heal_apply');
    expect(block.gapId).toBe('auth_secret');
    expect(block.requiresUserAction).toBe(false);
  });

  it('no repo-code tasks, only provider-action: type=provider-action', () => {
    const state = makeState({ batchApplied: 0, stalledScans: 0 });
    const block = buildNextActionBlock([makeProviderTask()], state, 'free');
    expect(block.type).toBe('provider-action');
    expect(block.requiresUserAction).toBe(true);
  });

  it('only upgrade-required tasks: type=upgrade-required with upgradeUrl', () => {
    const state = makeState({ batchApplied: 0, stalledScans: 0 });
    const block = buildNextActionBlock([makeUpgradeTask()], state, 'free');
    expect(block.type).toBe('upgrade-required');
    expect(block.upgradeUrl).toBe('https://viberaven.dev/pricing');
  });

  it('no tasks at all: type=done', () => {
    const state = makeState({ batchApplied: 0, stalledScans: 0 });
    const block = buildNextActionBlock([], state, 'free');
    expect(block.type).toBe('done');
    expect(block.requiresUserAction).toBe(false);
  });

  it('repo-code task with requiresUserAction=true is skipped, falls through to provider-action', () => {
    const lockedRepoTask: TaskItem = { ...makeRepoCodeTask(), requiresUserAction: true };
    const state = makeState({ batchApplied: 0, stalledScans: 0 });
    const block = buildNextActionBlock([lockedRepoTask, makeProviderTask()], state, 'free');
    expect(block.type).toBe('provider-action');
  });
});

describe('buildNextActionBlock — stall detection', () => {
  it('stalledScans=2: stalled=true, type=stalled, overrides all other types', () => {
    const state = makeState({ stalledScans: 2 });
    const block = buildNextActionBlock([makeRepoCodeTask()], state, 'free');
    expect(block.stalled).toBe(true);
    expect(block.type).toBe('stalled');
    expect(block.mcpTool).toBeUndefined();
  });

  it('stalledScans=2, only provider-action tasks: stallReason=provider-action-required', () => {
    const state = makeState({ stalledScans: 2 });
    const block = buildNextActionBlock([makeProviderTask()], state, 'free');
    expect(block.type).toBe('stalled');
    expect(block.stallReason).toBe('provider-action-required');
  });

  it('stalledScans=2, no tasks: stallReason=no-recipes', () => {
    const state = makeState({ stalledScans: 2 });
    const block = buildNextActionBlock([], state, 'free');
    expect(block.type).toBe('stalled');
    expect(block.stallReason).toBe('no-recipes');
  });

  it('stalledScans=2, only upgrade-required tasks: stallReason=no-recipes', () => {
    const state = makeState({ stalledScans: 2 });
    const block = buildNextActionBlock([makeUpgradeTask()], state, 'free');
    expect(block.type).toBe('stalled');
    expect(block.stallReason).toBe('no-recipes');
  });

  it('stalledScans=2, mixed repo-code and provider-action: stallReason=unknown', () => {
    const state = makeState({ stalledScans: 2 });
    const block = buildNextActionBlock([makeRepoCodeTask(), makeProviderTask()], state, 'free');
    expect(block.stallReason).toBe('unknown');
  });

  it('stalledScans=1: stalled=false (threshold is 2)', () => {
    const state = makeState({ stalledScans: 1 });
    const block = buildNextActionBlock([makeRepoCodeTask()], state, 'free');
    expect(block.stalled).toBe(false);
    expect(block.type).toBe('repo-code');
  });

  it('stalled overrides scanNow: even if batchApplied >= batchSize, type is still stalled', () => {
    const state = makeState({ batchApplied: 3, stalledScans: 2 });
    const block = buildNextActionBlock([makeRepoCodeTask()], state, 'free');
    expect(block.type).toBe('stalled');
  });
});

describe('buildNextActionBlock — fallbackCommand', () => {
  it('repo-code task includes fallbackCommand', () => {
    const state = makeState();
    const block = buildNextActionBlock([makeRepoCodeTask('test_gap')], state, 'free');
    expect(block.fallbackCommand).toContain('test_gap');
  });
});

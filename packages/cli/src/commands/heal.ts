import { applyHeal } from '../heal/apply';
import { assertSafeHealTarget } from '../heal/pathSafety';
import { writeHealPlan } from '../heal/plan';
import { writeHealPrompt } from '../heal/prompt';
import type { HealCommandOptions, HealResult } from '../heal/types';
import { incrementBatch, loadLoopState, saveLoopState } from '../loopState';

export async function runHealCommand(options: HealCommandOptions): Promise<HealResult> {
  if (!options.target && !options.gapId) {
    throw new Error('Heal requires --target <file> or --gap <id>.');
  }

  if (options.target) {
    assertSafeHealTarget(options.cwd, options.target);
  }

  if (options.mode === 'plan') return writeHealPlan(options);
  if (options.mode === 'prompt') return writeHealPrompt(options);
  const result = await applyHeal(options);
  if (result.status.startsWith('applied_') && result.changedFiles.length > 0) {
    const loopState = await loadLoopState(options.cwd);
    await saveLoopState(options.cwd, incrementBatch(loopState, result.gapId));
  }
  return result;
}

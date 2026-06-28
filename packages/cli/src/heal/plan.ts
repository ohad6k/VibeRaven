import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PUBLIC_VERIFY_COMMAND } from '../contracts/commands';
import type { HealCommandOptions, HealResult } from './types';

function healId(): string {
  return `heal_${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`;
}

export async function writeHealPlan(options: HealCommandOptions): Promise<HealResult> {
  const dir = join(options.cwd, '.viberaven');
  await mkdir(dir, { recursive: true });
  const id = healId();
  const target = options.target ?? `gap:${options.gapId}`;
  const markdown = [
    '# VibeRaven Heal Plan',
    '',
    `Target: \`${target}\``,
    `Mode: \`${options.mode}\``,
    '',
    'This plan is non-destructive. It does not edit source files.',
    '',
    `Verify after manual fix: \`${PUBLIC_VERIFY_COMMAND}\``,
    '',
  ].join('\n');

  const result: HealResult = {
    $schema: 'https://viberaven.dev/schemas/heal-result.schema.json',
    schemaVersion: 'v1',
    runId: 'vr_heal_plan',
    healId: id,
    mode: 'plan',
    status: 'planned',
    gapId: options.gapId,
    target: options.target,
    changedFiles: [],
    artifacts: { plan: '.viberaven/heal-plan.md' },
    rollback: { available: false, instructions: 'No source files were changed.' },
  };

  await writeFile(join(dir, 'heal-plan.md'), markdown, 'utf8');
  await writeFile(join(dir, 'heal-plan.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return result;
}

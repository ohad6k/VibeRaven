import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PUBLIC_VERIFY_COMMAND } from '../contracts/commands';
import type { HealCommandOptions, HealResult } from './types';

function healId(): string {
  return `heal_${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`;
}

export async function writeHealPrompt(options: HealCommandOptions): Promise<HealResult> {
  const dir = join(options.cwd, '.viberaven');
  await mkdir(dir, { recursive: true });
  const id = healId();
  const target = options.target ?? `gap:${options.gapId}`;
  const prompt = [
    '# VibeRaven Heal Prompt',
    '',
    `Fix only this target: \`${target}\`.`,
    '',
    '- Do not request secrets.',
    '- Do not edit provider dashboards.',
    '- Do not change migrations, auth authorization logic, payment correctness, or webhook signature logic unless a VibeRaven recipe explicitly supports it.',
    `- After the fix, run \`${PUBLIC_VERIFY_COMMAND}\`.`,
    '',
  ].join('\n');

  const result: HealResult = {
    $schema: 'https://viberaven.dev/schemas/heal-result.schema.json',
    schemaVersion: 'v1',
    runId: 'vr_heal_prompt',
    healId: id,
    mode: 'prompt',
    status: 'prompt_written',
    gapId: options.gapId,
    target: options.target,
    changedFiles: [],
    artifacts: { prompt: '.viberaven/heal-prompt.md' },
    rollback: { available: false, instructions: 'No source files were changed.' },
  };

  await writeFile(join(dir, 'heal-prompt.md'), prompt, 'utf8');
  return result;
}

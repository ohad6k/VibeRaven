import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { assertSafeHealTarget } from './pathSafety';
import { applyEmptyCatchRecipe } from './recipes/emptyCatch';
import { dispatchRecipeByGapId } from './recipes/index';
import type { HealCommandOptions, HealResult } from './types';

function healId(): string {
  return `heal_${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`;
}

export async function applyHeal(options: HealCommandOptions): Promise<HealResult> {
  const id = healId();
  if (!options.yes) {
    return {
      $schema: 'https://viberaven.dev/schemas/heal-result.schema.json',
      schemaVersion: 'v1',
      runId: 'vr_heal_apply',
      healId: id,
      mode: 'apply',
      status: 'refused_dangerous',
      gapId: options.gapId,
      target: options.target,
      changedFiles: [],
      artifacts: {},
      rollback: { available: false, instructions: 'Re-run with --yes to allow guarded repo-code edits.' },
    };
  }

  // ---------------------------------------------------------------------------
  // Gap-based dispatch (W3): route by gapId when no explicit target is given,
  // or when gapId maps to a known recipe.
  // This block runs BEFORE the legacy emptyCatch path.
  // ---------------------------------------------------------------------------
  if (options.gapId) {
    const dispatched = await dispatchRecipeByGapId(
      options.gapId,
      options.cwd,
      options.target
    );

    if (dispatched !== null) {
      // Provider-action only — cannot auto-apply
      if (!dispatched.canAutoApply) {
        return {
          $schema: 'https://viberaven.dev/schemas/heal-result.schema.json',
          schemaVersion: 'v1',
          runId: 'vr_heal_apply',
          healId: id,
          mode: 'apply',
          status: 'refused_unsupported',
          gapId: options.gapId,
          changedFiles: [],
          artifacts: {},
          rollback: {
            available: false,
            instructions: dispatched.reason ?? 'This gap requires a manual provider-dashboard action.',
          },
        };
      }

      if (!dispatched.changed) {
        return {
          $schema: 'https://viberaven.dev/schemas/heal-result.schema.json',
          schemaVersion: 'v1',
          runId: 'vr_heal_apply',
          healId: id,
          mode: 'apply',
          status: 'refused_unsupported',
          gapId: options.gapId,
          target: dispatched.targetFile || options.target,
          changedFiles: [],
          artifacts: {},
          rollback: { available: false, instructions: 'Recipe matched but no change was needed (already applied or file already exists).' },
        };
      }

      // Write the output file
      const absoluteTarget = join(options.cwd, dispatched.targetFile);
      // Safety check on the resolved path
      assertSafeHealTarget(options.cwd, dispatched.targetFile);
      // Ensure parent directory exists (for file-create recipes)
      await mkdir(dirname(absoluteTarget), { recursive: true });

      // Save before snapshot only if the file existed
      const healDir = join(options.cwd, '.viberaven', 'heal', id);
      await mkdir(join(healDir, 'before'), { recursive: true });
      const beforeContent = existsSync(absoluteTarget)
        ? await readFile(absoluteTarget, 'utf8')
        : '';
      await writeFile(join(healDir, 'before', 'target.txt'), beforeContent, 'utf8');
      await writeFile(absoluteTarget, dispatched.output, 'utf8');

      const patch = [
        `--- ${dispatched.targetFile}`,
        `+++ ${dispatched.targetFile}`,
        '@@ VibeRaven guarded heal @@',
        beforeContent || '(new file)',
        '--- after ---',
        dispatched.output,
        '',
      ].join('\n');
      await writeFile(join(healDir, 'patch.diff'), patch, 'utf8');

      const result: HealResult = {
        $schema: 'https://viberaven.dev/schemas/heal-result.schema.json',
        schemaVersion: 'v1',
        runId: 'vr_heal_apply',
        healId: id,
        mode: 'apply',
        status: 'applied_verify_not_run',
        gapId: options.gapId,
        recipe: dispatched.recipeName,
        target: dispatched.targetFile,
        changedFiles: [relative(options.cwd, absoluteTarget).replace(/\\/g, '/')],
        artifacts: {
          patch: `.viberaven/heal/${id}/patch.diff`,
          result: `.viberaven/heal/${id}/result.json`,
        },
        rollback: {
          available: true,
          instructions: 'Restore .viberaven/heal/<healId>/before/target.txt to the target file or apply the reverse patch.',
        },
      };
      await writeFile(join(healDir, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
      return result;
    }
    // No recipe found for this gapId — fall through to legacy emptyCatch path
  }

  // ---------------------------------------------------------------------------
  // Legacy emptyCatch path (original behavior, unchanged)
  // ---------------------------------------------------------------------------

  if (!options.target) {
    return {
      $schema: 'https://viberaven.dev/schemas/heal-result.schema.json',
      schemaVersion: 'v1',
      runId: 'vr_heal_apply',
      healId: id,
      mode: 'apply',
      status: 'refused_unsupported',
      gapId: options.gapId,
      changedFiles: [],
      artifacts: {},
      rollback: { available: false, instructions: 'Apply requires a supported --target file in 1.0.' },
    };
  }

  const absolute = assertSafeHealTarget(options.cwd, options.target);
  const before = await readFile(absolute, 'utf8');
  const recipe = applyEmptyCatchRecipe(before);
  if (!recipe.changed) {
    return {
      $schema: 'https://viberaven.dev/schemas/heal-result.schema.json',
      schemaVersion: 'v1',
      runId: 'vr_heal_apply',
      healId: id,
      mode: 'apply',
      status: 'refused_unsupported',
      target: options.target,
      gapId: options.gapId,
      changedFiles: [],
      artifacts: {},
      rollback: { available: false, instructions: 'No supported heal recipe matched this file.' },
    };
  }

  const healDir = join(options.cwd, '.viberaven', 'heal', id);
  await mkdir(join(healDir, 'before'), { recursive: true });
  await writeFile(join(healDir, 'before', 'target.txt'), before, 'utf8');
  await writeFile(absolute, recipe.output, 'utf8');
  const patch = [
    `--- ${options.target}`,
    `+++ ${options.target}`,
    '@@ VibeRaven guarded heal @@',
    before,
    '--- after ---',
    recipe.output,
    '',
  ].join('\n');
  await writeFile(join(healDir, 'patch.diff'), patch, 'utf8');

  const result: HealResult = {
    $schema: 'https://viberaven.dev/schemas/heal-result.schema.json',
    schemaVersion: 'v1',
    runId: 'vr_heal_apply',
    healId: id,
    mode: 'apply',
    status: 'applied_verify_not_run',
    gapId: options.gapId,
    recipe: 'empty-catch-safe-response',
    target: options.target,
    changedFiles: [relative(options.cwd, absolute).replace(/\\/g, '/')],
    artifacts: {
      patch: `.viberaven/heal/${id}/patch.diff`,
      result: `.viberaven/heal/${id}/result.json`,
    },
    rollback: {
      available: true,
      instructions: 'Restore .viberaven/heal/<healId>/before/target.txt to the target file or apply the reverse patch.',
    },
  };
  await writeFile(join(healDir, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return result;
}

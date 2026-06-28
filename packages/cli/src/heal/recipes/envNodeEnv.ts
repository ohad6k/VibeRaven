// Heal recipe: node_env_not_set
// Adds NODE_ENV=production to .env.local if not present.
// Safe: only adds, never overwrites existing value.

export const RECIPE_GAP_ID = 'node_env_not_set';

export interface EnvRecipeResult {
  changed: boolean;
  output: string;
  canAutoApply: true;
}

export function applyNodeEnvRecipe(source: string): EnvRecipeResult {
  // If NODE_ENV is already defined, leave it alone
  if (/^\s*NODE_ENV\s*=/m.test(source)) {
    return { changed: false, output: source, canAutoApply: true };
  }

  const line = 'NODE_ENV=production';
  const output = source.trimEnd()
    ? `${source.trimEnd()}\n${line}\n`
    : `${line}\n`;

  return { changed: true, output, canAutoApply: true };
}

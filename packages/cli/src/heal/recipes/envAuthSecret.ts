// Heal recipe: auth_secret_missing
// Adds NEXTAUTH_SECRET to .env.local if not present.
// Safe: only adds the key, never overwrites an existing value.

export const RECIPE_GAP_ID = 'auth_secret_missing';

export interface EnvRecipeResult {
  changed: boolean;
  output: string;
  canAutoApply: true;
}

export function applyAuthSecretRecipe(source: string): EnvRecipeResult {
  // If the key is already defined (even if empty), leave it alone
  if (/^\s*NEXTAUTH_SECRET\s*=/m.test(source)) {
    return { changed: false, output: source, canAutoApply: true };
  }

  const line = 'NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>';
  const output = source.trimEnd()
    ? `${source.trimEnd()}\n${line}\n`
    : `${line}\n`;

  return { changed: true, output, canAutoApply: true };
}

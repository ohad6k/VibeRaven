// Heal recipe: database_url_missing
// Adds DATABASE_URL placeholder to .env.local if not present.
// Safe: only adds, never overwrites existing value.

export const RECIPE_GAP_ID = 'database_url_missing';

export interface EnvRecipeResult {
  changed: boolean;
  output: string;
  canAutoApply: true;
}

export function applyDatabaseUrlRecipe(source: string): EnvRecipeResult {
  // If DATABASE_URL is already defined, leave it alone
  if (/^\s*DATABASE_URL\s*=/m.test(source)) {
    return { changed: false, output: source, canAutoApply: true };
  }

  const lines = [
    '# Get this from: https://supabase.com/dashboard/project/<ref>/settings/database',
    'DATABASE_URL=<your-supabase-postgres-url>',
  ].join('\n');

  const output = source.trimEnd()
    ? `${source.trimEnd()}\n${lines}\n`
    : `${lines}\n`;

  return { changed: true, output, canAutoApply: true };
}

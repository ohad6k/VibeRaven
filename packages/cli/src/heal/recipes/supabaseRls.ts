// Heal recipe: rls_disabled
// RLS must be enabled from the Supabase dashboard — cannot be auto-applied.
// This recipe exists so buildTaskList can classify it as 'provider-action'
// and return canAutoApply=false so the agent knows to present a guided step.

export const RECIPE_GAP_ID = 'rls_disabled';

export interface RlsRecipeResult {
  changed: false;
  output: string;
  canAutoApply: false;
  reason: 'dashboard-only';
  providerAction: {
    provider: 'supabase';
    dashboardUrl: string;
    exactStep: string;
    doneSignal: string;
    verifyCommand: string;
  };
}

/**
 * Returns a provider-action descriptor. Never writes any files.
 * Callers must check `canAutoApply` and handle this as a guided step.
 */
export function applyRlsRecipe(_source: string): RlsRecipeResult {
  return {
    changed: false,
    output: _source,
    canAutoApply: false,
    reason: 'dashboard-only',
    providerAction: {
      provider: 'supabase',
      dashboardUrl:
        'https://supabase.com/dashboard/project/{{PROJECT_REF}}/auth/policies',
      exactStep:
        'Enable Row Level Security (RLS) on each table under the "Table Editor" or "Auth > Policies" section.',
      doneSignal: 'RLS toggle is green for all public tables',
      verifyCommand: 'npx -y viberaven audit --vercel-supabase --json',
    },
  };
}

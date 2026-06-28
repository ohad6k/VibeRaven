import type { MissionCheck } from '../../../../src/station/types';

export const CHECK_TO_PLAYBOOK: Record<string, string> = {
  'vercel-deployment': 'vercel',
  'vercel-project': 'vercel',
  'supabase-project': 'supabase',
  'supabase-env': 'supabase',
  'stripe-webhook': 'stripe',
  'stripe-product': 'stripe',
  'stripe-keys': 'stripe'
};

export function mapCheckToPlaybook(check: MissionCheck): string {
  if (CHECK_TO_PLAYBOOK[check.id]) {
    return CHECK_TO_PLAYBOOK[check.id];
  }
  const providerKey = check.providerKey.toLowerCase();
  if (providerKey.includes('vercel') || check.area === 'deployment') {
    return 'vercel';
  }
  if (providerKey.includes('stripe') || check.area === 'payments') {
    return 'stripe';
  }
  if (providerKey.includes('supabase') && check.area === 'auth') {
    return 'auth-supabase';
  }
  if (providerKey.includes('supabase') || check.area === 'database') {
    return 'supabase';
  }
  if (check.area === 'auth') {
    return 'auth-supabase';
  }
  return 'vercel';
}

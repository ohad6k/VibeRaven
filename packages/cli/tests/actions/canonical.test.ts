import { describe, expect, it } from 'vitest';
import {
  buildActionKey,
  displayRepoPath,
  normalizeActionPath,
  normalizeActionValues,
} from '../../src/actions/canonical';

describe('action canonicalization', () => {
  it('normalizes paths without leaking absolute local roots', () => {
    expect(normalizeActionPath('D:\\VibeRice\\app\\api\\stripe\\webhook\\')).toBe('app/api/stripe/webhook');
    expect(normalizeActionPath('/Users/ohad/app/api/auth/callback/')).toBe('app/api/auth/callback');
    expect(normalizeActionPath('supabase\\migrations\\001_rls.sql')).toBe('supabase/migrations/001_rls.sql');
  });

  it('preserves repo-relative display path casing separately from canonical keys', () => {
    expect(displayRepoPath('D:\\VibeRice\\App\\API\\Stripe\\Webhook\\route.ts')).toBe(
      'App/API/Stripe/Webhook/route.ts',
    );
    expect(displayRepoPath('supabase\\Migrations\\001_RLS.sql')).toBe('supabase/Migrations/001_RLS.sql');
  });

  it('sorts and deduplicates enum-like values', () => {
    expect(
      normalizeActionValues([
        'customer.subscription.updated',
        'checkout.session.completed',
        'CUSTOMER.SUBSCRIPTION.UPDATED',
      ]),
    ).toEqual(['checkout.session.completed', 'customer.subscription.updated']);
  });

  it('builds deterministic semantic action keys', () => {
    const key = buildActionKey({
      kind: 'provider-action',
      provider: 'Stripe',
      category: 'webhook',
      target: 'D:\\VibeRice\\app\\api\\stripe\\webhook\\',
      values: ['customer.subscription.updated', 'checkout.session.completed'],
    });

    expect(key).toBe('provider-action:stripe:webhook:app/api/stripe/webhook:checkout.session.completed,customer.subscription.updated');
  });
});

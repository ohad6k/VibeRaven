import { describe, expect, it } from 'vitest';
import { getLaunchPathTemplate, listLocalUiProviderCatalog } from '../../src/local-ui/providerLaunchPaths';

describe('local UI provider launch path catalog', () => {
  it('covers the provider set needed for the first local launch console', () => {
    const ids = listLocalUiProviderCatalog().map((provider) => provider.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        'supabase',
        'vercel',
        'stripe',
        'github',
        'sentry',
        'posthog',
        'clerk',
        'authjs',
        'resend',
        'upstash'
      ])
    );
  });

  it('defines provider-specific launch path copy', () => {
    const supabase = getLaunchPathTemplate('supabase');

    expect(supabase?.title).toBe('Supabase launch path');
    expect(supabase?.items.map((item) => item.title)).toEqual(
      expect.arrayContaining(['RLS policies', 'Auth callbacks', 'Production env'])
    );
  });
});

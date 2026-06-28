import type { ProductionConnectionArea, StackWiringArea } from './types';

/** Cross-cutting capability tags (not 1:1 with Mission Map balls). */
export type ProviderCapabilityTag =
  | 'hosting'
  | 'edge'
  | 'cdn'
  | 'dns'
  | 'database'
  | 'auth'
  | 'payments'
  | 'analytics'
  | 'monitoring'
  | 'errors'
  | 'design'
  | 'ci'
  | 'security'
  | 'bot-protection'
  | 'rate-limit'
  | 'secrets';

export type ProviderVerificationTier =
  | 'mcp-readonly'
  | 'mcp-write'
  | 'manual-only'
  | 'repo-only'
  | 'uncertain';

export interface ProviderTaxonomyRecord {
  provider: string;
  label: string;
  aliases: string[];
  /** Mission Map category keys (may be multiple). */
  missionAreas: StackWiringArea[];
  /** Production connection picker areas (subset; testing/design use mission only). */
  productionAreas: ProductionConnectionArea[];
  capabilityTags: ProviderCapabilityTag[];
  verificationTier: ProviderVerificationTier;
  /** True when placement may need repo-signal disambiguation (e.g. Cloudflare). */
  uncertain?: boolean;
  auditNotes?: string;
}

/**
 * Canonical provider/tool taxonomy for VibeRaven.
 * Registry entries must align with these records (enforced by tests).
 */
export const PROVIDER_TAXONOMY: ProviderTaxonomyRecord[] = [
  // Design / product assets
  taxonomy('figma', 'Figma', ['figma'], ['appFlow'], [], ['design'], 'repo-only'),
  taxonomy('storybook', 'Storybook', ['storybook'], ['appFlow'], [], ['design'], 'repo-only'),
  taxonomy('product-spec', 'Product Spec', ['productspec', 'prd'], ['appFlow'], [], ['design'], 'repo-only'),
  taxonomy('route-map', 'Route Map', ['routemap', 'routes'], ['appFlow'], [], ['design'], 'repo-only'),

  // Frontend frameworks
  taxonomy('react', 'React', ['react', 'reactjs'], ['frontend'], [], ['design'], 'repo-only'),
  taxonomy('vue', 'Vue', ['vue', 'vuejs'], ['frontend'], [], ['design'], 'repo-only'),
  taxonomy('svelte', 'Svelte', ['svelte', 'sveltekit'], ['frontend'], [], ['design'], 'repo-only'),
  taxonomy('angular', 'Angular', ['angular'], ['frontend'], [], ['design'], 'repo-only'),

  // Backend runtimes
  taxonomy('node', 'Node.js', ['node', 'nodejs', 'node.js'], ['backend'], [], ['hosting'], 'repo-only'),
  taxonomy('python', 'Python / FastAPI', ['python', 'pythonfastapi', 'fastapi'], ['backend'], [], ['hosting'], 'repo-only'),
  taxonomy('rails', 'Rails', ['rails', 'rubyonrails'], ['backend'], [], ['hosting'], 'repo-only'),
  taxonomy('go', 'Go', ['go', 'golang'], ['backend'], [], ['hosting'], 'repo-only'),

  // Database / backend services
  taxonomy('supabase', 'Supabase', ['supabase'], ['database'], ['database', 'auth'], ['database'], 'mcp-readonly'),
  taxonomy('neon', 'Neon', ['neon'], ['database'], ['database'], ['database'], 'mcp-readonly'),
  taxonomy('planetscale', 'PlanetScale', ['planetscale'], ['database'], ['database'], ['database'], 'mcp-readonly'),
  taxonomy('mongodb', 'MongoDB Atlas', ['mongodb', 'mongodbatlas'], ['database'], ['database'], ['database'], 'mcp-write'),
  taxonomy('turso', 'Turso', ['turso'], ['database'], ['database'], ['database'], 'manual-only'),
  taxonomy('firebase', 'Firebase', ['firebase', 'firestore'], ['database', 'auth'], [], ['database', 'auth'], 'manual-only', {
    auditNotes: 'Firebase spans Auth + Firestore; classify by repo signals.'
  }),

  // Auth
  taxonomy('clerk', 'Clerk', ['clerk'], ['auth'], ['auth'], ['auth'], 'mcp-readonly'),
  taxonomy('authjs', 'Auth.js', ['authjs', 'auth', 'nextauth'], ['auth'], ['auth'], ['auth'], 'repo-only'),
  taxonomy('supabase-auth', 'Supabase Auth', ['supabaseauth'], ['auth'], [], ['auth'], 'mcp-readonly', {
    auditNotes: 'Uses Supabase MCP; not a separate production connection row.'
  }),
  taxonomy('auth0', 'Auth0', ['auth0', 'oktaauth0'], ['auth'], [], ['auth'], 'manual-only'),
  taxonomy('better-auth', 'Better Auth', ['betterauth', 'better-auth'], ['auth'], [], ['auth'], 'repo-only'),

  // Payments
  taxonomy('stripe', 'Stripe', ['stripe'], ['payments'], ['payments'], ['payments'], 'mcp-readonly'),
  taxonomy('paddle', 'Paddle', ['paddle'], ['payments'], ['payments'], ['payments'], 'mcp-write'),
  taxonomy('polar', 'Polar', ['polar', 'polarsh'], ['payments'], ['payments'], ['payments'], 'manual-only'),
  taxonomy('lemon-squeezy', 'Lemon Squeezy', ['lemonsqueezy', 'lemon-squeezy'], ['payments'], [], ['payments'], 'manual-only'),

  // Deployment / hosting
  taxonomy('vercel', 'Vercel', ['vercel'], ['deployment'], ['deployment'], ['hosting'], 'mcp-readonly'),
  taxonomy('netlify', 'Netlify', ['netlify'], ['deployment'], [], ['hosting'], 'mcp-write'),
  taxonomy('render', 'Render', ['render', 'rendercom'], ['deployment'], [], ['hosting'], 'manual-only'),
  taxonomy('railway', 'Railway', ['railway', 'railwayapp'], ['deployment'], [], ['hosting'], 'manual-only'),
  taxonomy('aws', 'AWS', ['aws', 'amazonaws'], ['deployment'], [], ['hosting', 'edge'], 'manual-only'),
  taxonomy('cloudflare', 'Cloudflare', ['cloudflare', 'cloudflarepages', 'workers'], ['deployment', 'security'], [], ['hosting', 'edge', 'cdn', 'dns'], 'mcp-readonly', {
    uncertain: true,
    auditNotes: 'Cloudflare can mean Pages, Workers, CDN, DNS, or Turnstile — disambiguate via repo signals.'
  }),

  // Edge / bot protection (narrow Cloudflare product)
  taxonomy('bot-protection', 'Cloudflare Turnstile', ['botprotection', 'cloudflareturnstile', 'turnstile'], ['security'], ['security'], ['bot-protection', 'edge'], 'mcp-readonly', {
    auditNotes: 'Turnstile only; not general Cloudflare hosting.'
  }),
  taxonomy('rate-limit', 'Rate limiting', ['upstash', 'upstashratelimit', 'ratelimit', 'ratelimiting', 'expressratelimit'], ['security'], ['security'], ['rate-limit'], 'mcp-write'),
  taxonomy('secrets-hygiene', 'Secrets hygiene', ['secretshygiene', 'envhygiene'], ['security'], ['security'], ['secrets'], 'repo-only'),

  // Analytics / monitoring / errors
  taxonomy('posthog', 'PostHog', ['posthog'], ['monitoring'], ['monitoring'], ['analytics', 'monitoring'], 'mcp-readonly', {
    auditNotes: 'Product analytics — not deployment or hosting.'
  }),
  taxonomy('sentry', 'Sentry', ['sentry'], ['monitoring', 'errorHandling'], ['monitoring'], ['errors', 'monitoring'], 'mcp-readonly'),
  taxonomy('logrocket', 'LogRocket', ['logrocket'], ['monitoring'], ['monitoring'], ['monitoring'], 'manual-only'),

  // Source / CI
  taxonomy('github', 'GitHub', ['github', 'githubactions'], ['testing'], [], ['ci'], 'manual-only', {
    auditNotes: 'CI/workflows; verification via GitHub API/MCP when connected.'
  }),
  taxonomy('gitlab', 'GitLab', ['gitlab', 'gitlabci'], ['testing'], [], ['ci'], 'manual-only'),
  taxonomy('vitest', 'Vitest', ['vitest'], ['testing'], [], ['ci'], 'repo-only'),
  taxonomy('playwright', 'Playwright', ['playwright', 'playwrighttest'], ['testing'], [], ['ci'], 'mcp-write')
];

const TAXONOMY_BY_PROVIDER = new Map(PROVIDER_TAXONOMY.map((record) => [record.provider, record]));

export function getProviderTaxonomyRecord(provider: string): ProviderTaxonomyRecord | undefined {
  const normalized = provider.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return PROVIDER_TAXONOMY.find(
    (record) =>
      record.provider === normalized ||
      record.aliases.some((alias) => alias.replace(/[^a-z0-9]+/g, '') === normalized)
  );
}

export function listAllProviderTools(): ProviderTaxonomyRecord[] {
  return PROVIDER_TAXONOMY.map((record) => ({
    ...record,
    aliases: [...record.aliases],
    missionAreas: [...record.missionAreas],
    productionAreas: [...record.productionAreas],
    capabilityTags: [...record.capabilityTags]
  }));
}

export function uncertainProviders(): ProviderTaxonomyRecord[] {
  return PROVIDER_TAXONOMY.filter((record) => record.uncertain);
}

function taxonomy(
  provider: string,
  label: string,
  aliases: string[],
  missionAreas: StackWiringArea[],
  productionAreas: ProductionConnectionArea[],
  capabilityTags: ProviderCapabilityTag[],
  verificationTier: ProviderVerificationTier,
  extras: Partial<Pick<ProviderTaxonomyRecord, 'uncertain' | 'auditNotes'>> = {}
): ProviderTaxonomyRecord {
  return {
    provider,
    label,
    aliases,
    missionAreas,
    productionAreas,
    capabilityTags,
    verificationTier,
    ...extras
  };
}

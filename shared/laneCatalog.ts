import type { ProviderSupportTier, StackLaneKey } from './deploy.js';

export type CatalogLaneKey = 'frontend' | 'appflow' | 'backend' | 'security' | 'testing' | 'onboarding';

export const CATALOG_LANE_KEYS: CatalogLaneKey[] = [
  'frontend',
  'appflow',
  'backend',
  'security',
  'testing',
  'onboarding'
];

export type LaneCatalogOption = {
  lane: CatalogLaneKey;
  provider: string;
  label: string;
  supportTier: ProviderSupportTier;
  reason: string;
};

const LANE_REASONS: Record<CatalogLaneKey, string> = {
  frontend: 'Frontend framework choice for the deploy launch map.',
  appflow: 'App flow and UX tooling choice for the deploy launch map.',
  backend: 'Backend runtime choice for the deploy launch map.',
  security: 'Security tooling choice for the deploy launch map.',
  testing: 'Testing tooling choice for the deploy launch map.',
  onboarding: 'Onboarding tooling choice for the deploy launch map.'
};

const LANE_OPTIONS: LaneCatalogOption[] = [
  option('frontend', 'react', 'React'),
  option('frontend', 'nextjs', 'Next.js'),
  option('frontend', 'vite', 'Vite'),
  option('appflow', 'figma', 'Figma'),
  option('appflow', 'storybook', 'Storybook'),
  option('appflow', 'playwright', 'Playwright'),
  option('backend', 'nodejs', 'Node.js'),
  option('backend', 'cloudflare', 'Cloudflare'),
  option('security', 'cloudflare', 'Cloudflare'),
  option('security', 'sentry', 'Sentry'),
  option('testing', 'playwright', 'Playwright'),
  option('testing', 'vite', 'Vite'),
  option('testing', 'github', 'GitHub'),
  option('onboarding', 'supabase', 'Supabase'),
  option('onboarding', 'clerk', 'Clerk'),
  option('onboarding', 'posthog', 'PostHog')
];

export function isCatalogLaneKey(lane: StackLaneKey): lane is CatalogLaneKey {
  return (CATALOG_LANE_KEYS as readonly string[]).includes(lane);
}

export function listLaneCatalogOptions(): Partial<Record<CatalogLaneKey, LaneCatalogOption[]>> {
  return LANE_OPTIONS.reduce<Partial<Record<CatalogLaneKey, LaneCatalogOption[]>>>((options, candidate) => {
    options[candidate.lane] = [...(options[candidate.lane] ?? []), { ...candidate }];
    return options;
  }, {});
}

function option(
  lane: CatalogLaneKey,
  provider: string,
  label: string,
  supportTier: ProviderSupportTier = 'manual_guided'
): LaneCatalogOption {
  return {
    lane,
    provider,
    label,
    supportTier,
    reason: LANE_REASONS[lane]
  };
}

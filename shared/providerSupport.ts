type DeployProviderArea = 'deployment' | 'database' | 'auth' | 'payments' | 'monitoring' | 'analytics';
type ProviderSupportTier = 'fully_guided' | 'repo_guided' | 'manual_guided' | 'coming_soon' | 'unsupported';

type ProviderSelection = {
  provider: string;
  label: string;
  selectedBy: 'recommended' | 'user' | 'repo_detected';
  reason: string;
  supportTier: ProviderSupportTier;
  selectedAt: string;
};

type SelectedProviderStack = Partial<Record<DeployProviderArea, ProviderSelection>>;

type DeployProviderOption = {
  area: DeployProviderArea;
  provider: string;
  label: string;
  supportTier: ProviderSupportTier;
  reason: string;
  recommended: boolean;
  dashboardUrl?: string;
  importUrl?: string;
};

type DeployProviderOptions = Partial<Record<DeployProviderArea, DeployProviderOption[]>>;

export class ProviderStackValidationError extends Error {}

const AREA_REASONS: Record<DeployProviderArea, string> = {
  deployment: 'Recommended deployment provider for SaaS and unknown V1 deploy sessions.',
  database: 'Recommended database provider for SaaS and unknown V1 deploy sessions.',
  auth: 'Recommended auth provider for SaaS and unknown V1 deploy sessions.',
  payments: 'Recommended payments provider for SaaS and unknown V1 deploy sessions.',
  monitoring: 'Provider is supported for manual production verification.',
  analytics: 'Provider is supported for manual production verification.'
};

const PROVIDER_OPTIONS: DeployProviderOption[] = [
  option('deployment', 'vercel', 'Vercel', 'fully_guided', true, {
    dashboardUrl: 'https://vercel.com/dashboard',
    importUrl: 'https://vercel.com/new'
  }),
  option('deployment', 'netlify', 'Netlify', 'manual_guided', false, {
    dashboardUrl: 'https://app.netlify.com',
    importUrl: 'https://app.netlify.com/start'
  }),
  option('deployment', 'railway', 'Railway', 'manual_guided', false, {
    dashboardUrl: 'https://railway.app/dashboard',
    importUrl: 'https://railway.app/new'
  }),
  option('deployment', 'render', 'Render', 'manual_guided', false, {
    dashboardUrl: 'https://dashboard.render.com',
    importUrl: 'https://dashboard.render.com/select-repo'
  }),
  option('database', 'supabase', 'Supabase', 'fully_guided', true, {
    dashboardUrl: 'https://supabase.com/dashboard'
  }),
  option('database', 'neon', 'Neon', 'manual_guided', false, {
    dashboardUrl: 'https://console.neon.tech'
  }),
  option('database', 'turso', 'Turso', 'manual_guided', false, {
    dashboardUrl: 'https://app.turso.tech'
  }),
  option('database', 'mongodb', 'MongoDB Atlas', 'manual_guided', false, {
    dashboardUrl: 'https://cloud.mongodb.com'
  }),
  option('database', 'planetscale', 'PlanetScale', 'manual_guided', false, {
    dashboardUrl: 'https://app.planetscale.com'
  }),
  option('database', 'firebase', 'Firebase', 'manual_guided', false, {
    dashboardUrl: 'https://console.firebase.google.com'
  }),
  option('auth', 'supabase', 'Supabase', 'fully_guided', true, {
    dashboardUrl: 'https://supabase.com/dashboard'
  }),
  option('auth', 'clerk', 'Clerk', 'manual_guided', false, {
    dashboardUrl: 'https://dashboard.clerk.com'
  }),
  option('auth', 'auth0', 'Auth0', 'manual_guided', false, {
    dashboardUrl: 'https://manage.auth0.com'
  }),
  option('auth', 'authjs', 'Auth.js', 'manual_guided', false),
  option('payments', 'stripe', 'Stripe', 'fully_guided', true, {
    dashboardUrl: 'https://dashboard.stripe.com'
  }),
  option('payments', 'polar', 'Polar', 'manual_guided', false, {
    dashboardUrl: 'https://polar.sh/dashboard'
  }),
  option('payments', 'lemon-squeezy', 'Lemon Squeezy', 'manual_guided', false, {
    dashboardUrl: 'https://app.lemonsqueezy.com'
  }),
  option('payments', 'paddle', 'Paddle', 'manual_guided', false, {
    dashboardUrl: 'https://vendors.paddle.com'
  }),
  option('monitoring', 'sentry', 'Sentry', 'manual_guided', false, {
    dashboardUrl: 'https://sentry.io'
  }),
  option('monitoring', 'posthog', 'PostHog', 'manual_guided', false, {
    dashboardUrl: 'https://app.posthog.com'
  }),
  option('monitoring', 'logrocket', 'LogRocket', 'manual_guided', false, {
    dashboardUrl: 'https://app.logrocket.com'
  }),
  option('analytics', 'posthog', 'PostHog', 'manual_guided', false, {
    dashboardUrl: 'https://app.posthog.com'
  })
];

const DEFAULT_STACK: Partial<Record<DeployProviderArea, string>> = {
  deployment: 'vercel',
  database: 'supabase',
  auth: 'supabase',
  payments: 'stripe'
};

export function listProviderSupportOptions(): DeployProviderOptions {
  return PROVIDER_OPTIONS.reduce<DeployProviderOptions>((options, candidate) => {
    options[candidate.area] = [...(options[candidate.area] ?? []), { ...candidate }];
    return options;
  }, {});
}

export function recommendedProviderStack(now = new Date()): SelectedProviderStack {
  const selectedAt = now.toISOString();
  return Object.fromEntries(
    Object.entries(DEFAULT_STACK).map(([area, provider]) => {
      const support = providerSupportFor(area as DeployProviderArea, provider);
      if (!support) {
        throw new ProviderStackValidationError(`Unsupported provider ${provider} for ${area}`);
      }
      return [
        area,
        selectionFromOption(support, 'recommended', selectedAt)
      ];
    })
  );
}

export function normalizeSelectedProviderStackForCreate(
  stack: SelectedProviderStack | undefined,
  now = new Date()
): SelectedProviderStack {
  if (!stack || Object.keys(stack).length === 0) {
    return recommendedProviderStack(now);
  }
  return normalizeSelectedProviderStackForUpdate(stack, now);
}

export function normalizeSelectedProviderStackForUpdate(
  stack: SelectedProviderStack | undefined,
  now = new Date()
): SelectedProviderStack {
  if (!stack || Object.keys(stack).length === 0) {
    return {};
  }

  const normalized: SelectedProviderStack = {};
  for (const [rawArea, selection] of Object.entries(stack)) {
    if (!selection) {
      continue;
    }
    const area = rawArea as DeployProviderArea;
    const support = providerSupportFor(area, selection.provider);
    if (!support) {
      throw new ProviderStackValidationError(`Unsupported provider ${selection.provider} for ${area}`);
    }
    if (selection.supportTier !== support.supportTier) {
      throw new ProviderStackValidationError(
        `Provider ${support.provider} for ${area} requires support tier ${support.supportTier}`
      );
    }
    normalized[area] = {
      provider: support.provider,
      label: support.label,
      selectedBy: selection.selectedBy,
      reason: selection.reason || support.reason,
      supportTier: support.supportTier,
      selectedAt: selection.selectedAt || now.toISOString()
    };
  }
  return normalized;
}

export function providerSupportFor(area: DeployProviderArea, provider: string): DeployProviderOption | null {
  const normalizedProvider = normalizeProviderToken(provider);
  const support = PROVIDER_OPTIONS.find(
    (candidate) => candidate.area === area && normalizeProviderToken(candidate.provider) === normalizedProvider
  );
  return support ? { ...support } : null;
}

function selectionFromOption(
  support: DeployProviderOption,
  selectedBy: ProviderSelection['selectedBy'],
  selectedAt: string
): ProviderSelection {
  return {
    provider: support.provider,
    label: support.label,
    selectedBy,
    reason: support.reason,
    supportTier: support.supportTier,
    selectedAt
  };
}

function option(
  area: DeployProviderArea,
  provider: string,
  label: string,
  supportTier: DeployProviderOption['supportTier'],
  recommended: boolean,
  destinations: Pick<DeployProviderOption, 'dashboardUrl' | 'importUrl'> = {}
): DeployProviderOption {
  return {
    area,
    provider,
    label,
    supportTier,
    reason: AREA_REASONS[area],
    recommended,
    ...destinations
  };
}

function normalizeProviderToken(provider: string): string {
  return provider.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

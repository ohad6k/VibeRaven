import type {
  ProductionConnectionProvider,
  StackWiringArea,
  StackWiringKey,
  StackWiringProvider
} from './types';

type SifgTemplateRegistryProvider =
  | StackWiringProvider
  | ProductionConnectionProvider
  | 'netlify'
  | 'aws'
  | 'playwright';

export interface SifgTemplate {
  id: string;
  label: string;
  registryProvider: SifgTemplateRegistryProvider;
  providerKey: StackWiringKey;
  area: StackWiringArea;
  sourceMatchers: Array<Record<string, string>>;
  requiredGuards: Array<{
    kind: string;
    symbols: string[];
    requiresEnvNames?: string[];
    mustPrecede: string[];
  }>;
  forbiddenFlows: Array<Record<string, string>>;
  repoFixPolicy: {
    allowedFileGlobs: string[];
    blockedFileGlobs: string[];
    requiresApproval: true;
  };
}

const BLOCKED_PRODUCT_GLOBS = ['landing/**', 'services/api/**', 'marketing/**'];

const TEMPLATES: SifgTemplate[] = [
  {
    id: 'template:payments:stripe:webhook-ingress',
    label: 'Stripe webhook ingress',
    registryProvider: 'stripe',
    providerKey: 'stripe-payments',
    area: 'payments',
    sourceMatchers: [
      { kind: 'route-handler', framework: 'nextjs-app-router', routePattern: '/api/**/stripe/**', method: 'POST' },
      { kind: 'sdk-symbol', importName: 'stripe', member: 'webhooks.constructEvent' }
    ],
    requiredGuards: [
      {
        kind: 'signature-verifier',
        symbols: ['stripe.webhooks.constructEvent'],
        requiresEnvNames: ['STRIPE_WEBHOOK_SECRET'],
        mustPrecede: ['database-write', 'entitlement-update', 'provider-mutation']
      },
      {
        kind: 'idempotency-guard',
        symbols: ['event.id', 'idempotencyKey', 'processed_events'],
        mustPrecede: ['entitlement-update']
      }
    ],
    forbiddenFlows: [
      { from: 'request-body', to: 'database-write', unlessGuardedBy: 'signature-verifier' },
      { from: 'env:STRIPE_SECRET_KEY', to: 'client-bundle', severity: 'critical' }
    ],
    repoFixPolicy: {
      allowedFileGlobs: ['app/**/route.ts', 'src/server/**', 'lib/server/**'],
      blockedFileGlobs: BLOCKED_PRODUCT_GLOBS,
      requiresApproval: true
    }
  },
  {
    id: 'template:auth:protected-data-access',
    label: 'Protected data access',
    registryProvider: 'clerk',
    providerKey: 'clerk-auth',
    area: 'auth',
    sourceMatchers: [{ kind: 'route-handler', routePattern: '/api/**', method: 'ANY' }],
    requiredGuards: [{ kind: 'auth-guard', symbols: ['auth', 'getServerSession', 'currentUser'], mustPrecede: ['database-read', 'database-write'] }],
    forbiddenFlows: [{ from: 'private-data', to: 'response', unlessGuardedBy: 'auth-guard' }],
    repoFixPolicy: {
      allowedFileGlobs: ['app/**/route.ts', 'src/server/**', 'lib/server/**', 'middleware.ts', 'src/middleware.ts'],
      blockedFileGlobs: BLOCKED_PRODUCT_GLOBS,
      requiresApproval: true
    }
  },
  {
    id: 'template:database:supabase:service-role-boundary',
    label: 'Supabase service role boundary',
    registryProvider: 'supabase',
    providerKey: 'supabase-database',
    area: 'database',
    sourceMatchers: [{ kind: 'env-read', envName: 'SUPABASE_SERVICE_ROLE_KEY' }],
    requiredGuards: [{ kind: 'server-only-boundary', symbols: ['server-only'], mustPrecede: ['database-read', 'database-write'] }],
    forbiddenFlows: [{ from: 'env:SUPABASE_SERVICE_ROLE_KEY', to: 'client-bundle', severity: 'critical' }],
    repoFixPolicy: {
      allowedFileGlobs: ['src/server/**', 'lib/server/**', 'app/**/route.ts', 'supabase/**'],
      blockedFileGlobs: BLOCKED_PRODUCT_GLOBS,
      requiresApproval: true
    }
  },
  {
    id: 'template:security:public-route-abuse-guard',
    label: 'Public route abuse guard',
    registryProvider: 'rate-limit',
    providerKey: 'rate-limit-security',
    area: 'security',
    sourceMatchers: [{ kind: 'route-handler', routePattern: '/api/**', method: 'ANY' }],
    requiredGuards: [{ kind: 'rate-limit-guard', symbols: ['ratelimit', 'rateLimit', 'upstash'], mustPrecede: ['provider-mutation', 'database-write'] }],
    forbiddenFlows: [{ from: 'public-request', to: 'expensive-sink', unlessGuardedBy: 'rate-limit-guard' }],
    repoFixPolicy: {
      allowedFileGlobs: ['app/**/route.ts', 'src/server/**', 'lib/server/**'],
      blockedFileGlobs: BLOCKED_PRODUCT_GLOBS,
      requiresApproval: true
    }
  },
  {
    id: 'template:security:secret-boundary',
    label: 'Secret boundary',
    registryProvider: 'secrets-hygiene',
    providerKey: 'secrets-hygiene-security',
    area: 'security',
    sourceMatchers: [{ kind: 'env-read', envName: '*' }],
    requiredGuards: [{ kind: 'server-only-boundary', symbols: ['server-only'], mustPrecede: ['client-bundle'] }],
    forbiddenFlows: [{ from: 'env:*', to: 'client-bundle', severity: 'critical' }],
    repoFixPolicy: {
      allowedFileGlobs: ['src/**', 'lib/**', 'app/**'],
      blockedFileGlobs: BLOCKED_PRODUCT_GLOBS,
      requiresApproval: true
    }
  },
  {
    id: 'template:errorHandling:safe-error-response',
    label: 'Safe error response',
    registryProvider: 'sentry',
    providerKey: 'sentry-error-handling',
    area: 'errorHandling',
    sourceMatchers: [{ kind: 'throw-or-catch', routePattern: '/api/**' }],
    requiredGuards: [{ kind: 'error-capture', symbols: ['Sentry.captureException', 'captureException'], mustPrecede: ['safe-response'] }],
    forbiddenFlows: [{ from: 'provider-error', to: 'client-response', unlessGuardedBy: 'safe-response' }],
    repoFixPolicy: {
      allowedFileGlobs: ['app/**/route.ts', 'src/server/**', 'lib/server/**'],
      blockedFileGlobs: BLOCKED_PRODUCT_GLOBS,
      requiresApproval: true
    }
  }
];

export const SIFG_TEMPLATE_IDS = TEMPLATES.map((template) => template.id);

export function allSifgTemplates(): SifgTemplate[] {
  return TEMPLATES.map((template) => ({
    ...template,
    sourceMatchers: template.sourceMatchers.map((matcher) => ({ ...matcher })),
    requiredGuards: template.requiredGuards.map((guard) => ({
      ...guard,
      symbols: [...guard.symbols],
      requiresEnvNames: guard.requiresEnvNames ? [...guard.requiresEnvNames] : undefined,
      mustPrecede: [...guard.mustPrecede]
    })),
    forbiddenFlows: template.forbiddenFlows.map((flow) => ({ ...flow })),
    repoFixPolicy: {
      allowedFileGlobs: [...template.repoFixPolicy.allowedFileGlobs],
      blockedFileGlobs: [...template.repoFixPolicy.blockedFileGlobs],
      requiresApproval: true
    }
  }));
}

export function sifgTemplatesForProviderKey(providerKey: StackWiringKey): SifgTemplate[] {
  return allSifgTemplates().filter((template) => template.providerKey === providerKey);
}

export function sifgTemplatesForRegistryProviderArea(
  registryProvider: SifgTemplateRegistryProvider,
  area: StackWiringArea
): SifgTemplate[] {
  return allSifgTemplates().filter((template) =>
    template.registryProvider === registryProvider && template.area === area
  );
}

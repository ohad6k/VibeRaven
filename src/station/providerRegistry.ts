import type {
  ProductionConnectionArea,
  ProductionConnectionProvider,
  ProviderMcpTemplate,
  ProviderRegistryEntry,
  ProviderRegistrySnapshot,
  ProviderRegistryStatus,
  StackWiringArea,
  StackWiringKey
} from './types';
import { sifgTemplatesForRegistryProviderArea } from './sifgTemplates';

export const PROVIDER_REGISTRY_STALE_AFTER_DAYS = 45;

type RegistryProvider = ProviderRegistryEntry['provider'];
type NonProductionRegistryProvider = Exclude<RegistryProvider, ProductionConnectionProvider>;
type ProviderSeedBase = Omit<ProviderRegistryEntry, 'provider' | 'productionAreas' | 'status'>;
type ProductionProviderSeed = ProviderSeedBase & {
  provider: ProductionConnectionProvider;
  productionAreas: ProductionConnectionArea[];
};
type NonProductionProviderSeed = ProviderSeedBase & {
  provider: NonProductionRegistryProvider;
  productionAreas: [];
};
type ProviderSeed = ProductionProviderSeed | NonProductionProviderSeed;

const PROVIDERS: ProviderSeed[] = [
  provider('supabase', 'Supabase', ['supabase'], ['database', 'landing'], ['database', 'auth'], 'supabase', {
    docsUrl: 'https://supabase.com/docs',
    dashboardUrl: 'https://supabase.com/dashboard',
    mcp: {
      label: 'Supabase',
      serverName: 'supabase',
      vscodeServer: { type: 'http', url: 'https://mcp.supabase.com/mcp?read_only=true' },
      cursorServer: { url: 'https://mcp.supabase.com/mcp?read_only=true' },
      keyInstructions: 'For hosted Supabase MCP, no API key goes in this file. Your IDE opens browser OAuth after you add the server. A Supabase access token is only needed for CI/manual-header setups, where it is passed as Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}.'
    },
    verification: { supportsReadOnly: true }
  }),
  provider('supabase-auth', 'Supabase Auth', ['supabaseauth'], ['auth'], [], 'supabase', {
    docsUrl: 'https://supabase.com/docs/guides/auth',
    dashboardUrl: 'https://supabase.com/dashboard'
  }),
  provider('clerk', 'Clerk', ['clerk'], ['auth'], ['auth'], 'clerk', {
    docsUrl: 'https://clerk.com/docs',
    dashboardUrl: 'https://dashboard.clerk.com',
    mcp: {
      label: 'Clerk',
      serverName: 'clerk',
      vscodeServer: { type: 'http', url: 'https://mcp.clerk.com/mcp' },
      cursorServer: { url: 'https://mcp.clerk.com/mcp' },
      keyInstructions: 'Clerk MCP uses your Clerk credentials. If your IDE asks for a token, create one from the Clerk Dashboard developer settings.'
    },
    verification: { supportsReadOnly: true }
  }),
  provider('authjs', 'Auth.js', ['authjs', 'auth', 'nextauth'], ['auth'], ['auth'], 'authjs', {
    docsUrl: 'https://authjs.dev'
  }),
  provider('auth0', 'Auth0', ['auth0'], ['auth'], ['auth'], 'auth0', {
    docsUrl: 'https://auth0.com/docs',
    dashboardUrl: 'https://manage.auth0.com'
  }),
  provider('better-auth', 'Better Auth', ['betterauth', 'better-auth'], ['auth'], ['auth'], 'better-auth', {
    docsUrl: 'https://www.better-auth.com/docs'
  }),
  provider('firebase', 'Firebase', ['firebase', 'firestore'], ['database'], ['database'], 'firebase', {
    docsUrl: 'https://firebase.google.com/docs',
    dashboardUrl: 'https://console.firebase.google.com'
  }),
  provider('neon', 'Neon', ['neon'], ['database'], ['database'], 'neon', {
    docsUrl: 'https://neon.tech/docs',
    dashboardUrl: 'https://console.neon.tech',
    mcp: {
      label: 'Neon',
      serverName: 'neon',
      vscodeServer: { type: 'http', url: 'https://mcp.neon.tech/mcp' },
      cursorServer: { url: 'https://mcp.neon.tech/mcp' },
      keyInstructions: 'Neon MCP normally opens browser OAuth. Use Neon project/database credentials only when your IDE asks for them.'
    },
    verification: { supportsReadOnly: true }
  }),
  provider('planetscale', 'PlanetScale', ['planetscale'], ['database'], ['database'], 'planetscale', {
    docsUrl: 'https://planetscale.com/docs',
    dashboardUrl: 'https://app.planetscale.com',
    mcp: {
      label: 'PlanetScale',
      serverName: 'planetscale',
      vscodeServer: { type: 'http', url: 'https://mcp.pscale.dev/mcp/planetscale' },
      cursorServer: { url: 'https://mcp.pscale.dev/mcp/planetscale' },
      keyInstructions: 'PlanetScale MCP normally opens browser OAuth. Use a PlanetScale service token only for local/manual fallback setups.'
    },
    verification: { supportsReadOnly: true }
  }),
  provider('mongodb', 'MongoDB Atlas', ['mongodb', 'mongodbatlas'], ['database'], ['database'], 'mongodb', {
    docsUrl: 'https://www.mongodb.com/docs',
    dashboardUrl: 'https://cloud.mongodb.com',
    mcp: {
      label: 'MongoDB',
      serverName: 'mongodb',
      vscodeServer: { type: 'stdio', command: 'npx', args: ['-y', 'mongodb-mcp-server', '--connectionString', 'mongodb://localhost:27017/myDatabase', '--readOnly'] },
      cursorServer: { command: 'npx', args: ['-y', 'mongodb-mcp-server', '--connectionString', 'mongodb://localhost:27017/myDatabase', '--readOnly'] },
      keyInstructions: 'MongoDB MCP runs locally. Replace the connection string placeholder with a local or Atlas connection string and keep readOnly until you trust the workflow.'
    },
    verification: { supportsReadOnly: false }
  }),
  provider('turso', 'Turso', ['turso'], ['database'], ['database'], 'turso', {
    docsUrl: 'https://docs.turso.tech',
    dashboardUrl: 'https://app.turso.tech'
  }),
  provider('stripe', 'Stripe', ['stripe'], ['payments'], ['payments'], 'stripe', {
    docsUrl: 'https://docs.stripe.com',
    dashboardUrl: 'https://dashboard.stripe.com',
    mcp: {
      label: 'Stripe',
      serverName: 'stripe',
      vscodeServer: { type: 'http', url: 'https://mcp.stripe.com' },
      cursorServer: { url: 'https://mcp.stripe.com' },
      keyInstructions: 'Stripe remote MCP normally authenticates with OAuth in the IDE. For local or custom bearer-token setups, use a restricted Stripe secret key from Developers > API keys.'
    },
    verification: { supportsReadOnly: true }
  }),
  provider('paddle', 'Paddle', ['paddle'], ['payments'], ['payments'], 'paddle', {
    docsUrl: 'https://developer.paddle.com',
    dashboardUrl: 'https://vendors.paddle.com',
    mcp: {
      label: 'Paddle',
      serverName: 'paddle',
      vscodeServer: { type: 'stdio', command: 'npx', args: ['-y', '@paddle/paddle-mcp', '--api-key=YOUR_API_KEY', '--environment=sandbox', '--tools=non-destructive'] },
      cursorServer: { command: 'npx', args: ['-y', '@paddle/paddle-mcp', '--api-key=YOUR_API_KEY', '--environment=sandbox', '--tools=non-destructive'] },
      keyInstructions: 'Paddle MCP needs your Paddle authentication. Replace YOUR_API_KEY with a sandbox or production API key before enabling write-capable tools.'
    },
    verification: { supportsReadOnly: false }
  }),
  provider('polar', 'Polar', ['polar', 'polarsh'], ['payments'], ['payments'], 'polar', {
    docsUrl: 'https://polar.sh/docs',
    dashboardUrl: 'https://polar.sh/dashboard',
    verification: { supportsReadOnly: false }
  }),
  provider('lemon-squeezy', 'Lemon Squeezy', ['lemonsqueezy', 'lemon-squeezy', 'lemon squeezy'], ['payments'], ['payments'], 'lemon-squeezy', {
    docsUrl: 'https://docs.lemonsqueezy.com',
    dashboardUrl: 'https://app.lemonsqueezy.com'
  }),
  provider('vercel', 'Vercel', ['vercel'], ['deployment'], ['deployment'], 'vercel', {
    docsUrl: 'https://vercel.com/docs',
    dashboardUrl: 'https://vercel.com/dashboard',
    mcp: {
      label: 'Vercel',
      serverName: 'vercel',
      vscodeServer: { type: 'http', url: 'https://mcp.vercel.com' },
      cursorServer: { url: 'https://mcp.vercel.com' },
      keyInstructions: 'Vercel MCP is a remote OAuth server. Finish the browser sign-in your IDE opens; only use a Vercel token for a separate CLI/local fallback.'
    },
    verification: { supportsReadOnly: true }
  }),
  provider('netlify', 'Netlify', ['netlify'], ['deployment'], ['deployment'], 'netlify', {
    docsUrl: 'https://docs.netlify.com',
    dashboardUrl: 'https://app.netlify.com',
    mcp: {
      label: 'Netlify',
      serverName: 'netlify',
      vscodeServer: { type: 'stdio', command: 'npx', args: ['-y', '@netlify/mcp'] },
      cursorServer: { command: 'npx', args: ['-y', '@netlify/mcp'] },
      keyInstructions: 'Netlify MCP uses Netlify authentication from the IDE or CLI. Finish the browser sign-in or token prompt it opens.'
    },
    verification: { supportsReadOnly: false }
  }),
  provider('render', 'Render', ['render', 'rendercom'], ['deployment'], ['deployment'], 'render', {
    docsUrl: 'https://render.com/docs',
    dashboardUrl: 'https://dashboard.render.com'
  }),
  provider('railway', 'Railway', ['railway', 'railwayapp'], ['deployment'], ['deployment'], 'railway', {
    docsUrl: 'https://docs.railway.com',
    dashboardUrl: 'https://railway.com'
  }),
  provider('cloudflare', 'Cloudflare', ['cloudflare', 'cloudflarepages', 'workers'], ['deployment'], ['deployment'], 'cloudflare', {
    docsUrl: 'https://developers.cloudflare.com',
    dashboardUrl: 'https://dash.cloudflare.com',
    mcp: {
      label: 'Cloudflare',
      serverName: 'cloudflare-api',
      vscodeServer: { type: 'http', url: 'https://mcp.cloudflare.com/mcp' },
      cursorServer: { url: 'https://mcp.cloudflare.com/mcp' },
      keyInstructions: 'Cloudflare MCP uses Cloudflare account authentication. Finish browser sign-in or provide an API token only when prompted.'
    },
    verification: { supportsReadOnly: true }
  }),
  provider('aws', 'AWS', ['aws'], ['deployment'], ['deployment'], 'aws', {
    docsUrl: 'https://docs.aws.amazon.com',
    dashboardUrl: 'https://console.aws.amazon.com'
  }),
  provider('sentry', 'Sentry', ['sentry'], ['monitoring', 'errorHandling'], ['monitoring'], 'sentry', {
    docsUrl: 'https://docs.sentry.io',
    dashboardUrl: 'https://sentry.io',
    mcp: {
      label: 'Sentry',
      serverName: 'sentry',
      vscodeServer: { type: 'http', url: 'https://mcp.sentry.dev/mcp' },
      cursorServer: { url: 'https://mcp.sentry.dev/mcp' },
      keyInstructions: 'Sentry MCP is a remote MCP server. Finish the IDE/browser authentication flow; only use a Sentry auth token for separate local or CLI fallback setups.'
    },
    verification: { supportsReadOnly: true }
  }),
  provider('posthog', 'PostHog', ['posthog'], ['monitoring', 'errorHandling', 'landing'], ['monitoring'], 'posthog', {
    docsUrl: 'https://posthog.com/docs',
    dashboardUrl: 'https://app.posthog.com',
    mcp: {
      label: 'PostHog',
      serverName: 'posthog',
      vscodeServer: { type: 'http', url: 'https://mcp.posthog.com/mcp' },
      cursorServer: { url: 'https://mcp.posthog.com/mcp' },
      keyInstructions: 'PostHog MCP opens an authentication flow. Use a PostHog personal API key only if the IDE or local fallback asks for one.'
    },
    verification: { supportsReadOnly: true }
  }),
  provider('logrocket', 'LogRocket', ['logrocket'], ['monitoring'], ['monitoring'], 'logrocket', {
    docsUrl: 'https://docs.logrocket.com',
    dashboardUrl: 'https://app.logrocket.com'
  }),
  provider('github', 'GitHub Actions', ['github', 'githubactions'], ['testing'], [], 'github', {
    docsUrl: 'https://docs.github.com/actions',
    dashboardUrl: 'https://github.com',
    mcp: {
      label: 'GitHub',
      serverName: 'github',
      vscodeServer: { type: 'http', url: 'https://api.githubcopilot.com/mcp/' },
      cursorServer: { url: 'https://api.githubcopilot.com/mcp/' },
      keyInstructions: 'GitHub MCP should use IDE/GitHub authentication. Use read-only repository, Actions, and branch-protection queries for verification.'
    },
    verification: { supportsReadOnly: true }
  }),
  provider('playwright', 'Playwright', ['playwright', 'playwrighttest'], ['testing'], [], 'playwright', {
    docsUrl: 'https://playwright.dev/docs/intro',
    mcp: {
      label: 'Playwright',
      serverName: 'playwright',
      vscodeServer: { type: 'stdio', command: 'npx', args: ['-y', '@playwright/mcp@latest'] },
      cursorServer: { command: 'npx', args: ['-y', '@playwright/mcp@latest'] },
      keyInstructions: 'Playwright MCP runs locally through npx and normally does not need an API key.'
    },
    verification: { supportsReadOnly: false }
  }),
  provider('rate-limit', 'Rate limiting', ['upstash', 'upstashratelimit', 'ratelimit', 'ratelimiting', 'expressratelimit'], ['security'], ['security'], 'rate-limit', {
    docsUrl: 'https://upstash.com/docs/redis/sdks/ratelimit/overview',
    dashboardUrl: 'https://console.upstash.com',
    mcp: {
      label: 'Upstash',
      serverName: 'upstash',
      vscodeServer: { type: 'stdio', command: 'npx', args: ['-y', '@upstash/mcp-server@latest', '--email', '<UPSTASH_EMAIL>', '--api-key', '<UPSTASH_API_KEY>'] },
      cursorServer: { command: 'npx', args: ['-y', '@upstash/mcp-server@latest', '--email', '<UPSTASH_EMAIL>', '--api-key', '<UPSTASH_API_KEY>'] },
      keyInstructions: 'Upstash MCP needs your Upstash account email and API key. Replace the placeholders before enabling the server.'
    },
    verification: { supportsReadOnly: false }
  }),
  provider('bot-protection', 'Bot protection', ['botprotection', 'cloudflareturnstile', 'turnstile'], ['security'], ['security'], 'bot-protection', {
    docsUrl: 'https://developers.cloudflare.com/turnstile',
    dashboardUrl: 'https://dash.cloudflare.com',
    mcp: {
      label: 'Cloudflare',
      serverName: 'cloudflare-api',
      vscodeServer: { type: 'http', url: 'https://mcp.cloudflare.com/mcp' },
      cursorServer: { url: 'https://mcp.cloudflare.com/mcp' },
      keyInstructions: 'Cloudflare MCP uses Cloudflare account authentication. Finish browser sign-in or provide an API token only when prompted.'
    },
    verification: { supportsReadOnly: true }
  }),
  provider('secrets-hygiene', 'Secrets hygiene', ['secretshygiene', 'envhygiene'], ['security'], ['security'], 'secrets-hygiene'),
  provider('figma', 'Figma', ['figma'], ['appFlow'], [], 'figma', { docsUrl: 'https://help.figma.com' }),
  provider('storybook', 'Storybook', ['storybook'], ['appFlow'], [], 'storybook', { docsUrl: 'https://storybook.js.org/docs' }),
  provider('product-spec', 'Product Spec', ['productspec', 'prd'], ['appFlow'], [], 'product-spec'),
  provider('route-map', 'Route Map', ['routemap', 'routes'], ['appFlow'], [], 'route-map'),
  provider('react', 'React', ['react', 'reactjs'], ['frontend'], [], 'react', { docsUrl: 'https://react.dev' }),
  provider('vue', 'Vue', ['vue', 'vuejs'], ['frontend'], [], 'vue', { docsUrl: 'https://vuejs.org/guide' }),
  provider('svelte', 'Svelte', ['svelte', 'sveltekit'], ['frontend'], [], 'svelte', { docsUrl: 'https://svelte.dev/docs' }),
  provider('angular', 'Angular', ['angular'], ['frontend'], [], 'angular', { docsUrl: 'https://angular.dev' }),
  provider('node', 'Node.js', ['node', 'nodejs', 'node.js'], ['backend'], [], 'nodejs', { docsUrl: 'https://nodejs.org/docs/latest/api' }),
  provider('python', 'Python / FastAPI', ['python', 'pythonfastapi', 'fastapi'], ['backend'], [], 'python', { docsUrl: 'https://fastapi.tiangolo.com' }),
  provider('rails', 'Rails', ['rails', 'rubyonrails'], ['backend'], [], 'rails', { docsUrl: 'https://guides.rubyonrails.org' }),
  provider('go', 'Go', ['go', 'golang'], ['backend'], [], 'go', { docsUrl: 'https://go.dev/doc' }),
  provider('vitest', 'Vitest', ['vitest'], ['testing'], [], 'vitest', { docsUrl: 'https://vitest.dev' })
];

const PROVIDERS_BY_KEY = new Map<string, ProviderSeed>(PROVIDERS.map((entry) => [entry.provider, entry]));
const PROVIDERS_BY_ALIAS = new Map<string, ProviderSeed>();
for (const entry of PROVIDERS) {
  PROVIDERS_BY_ALIAS.set(normalizeProviderToken(entry.provider), entry);
  for (const alias of entry.aliases) {
    PROVIDERS_BY_ALIAS.set(normalizeProviderToken(alias), entry);
  }
}

export function getProviderRegistryEntry(provider: string): ProviderRegistryEntry | null {
  const entry = PROVIDERS_BY_ALIAS.get(normalizeProviderToken(provider)) ?? null;
  return entry ? withStatus(entry, new Date()) : null;
}

export function normalizeProviderKey(provider: string): string {
  return PROVIDERS_BY_ALIAS.get(normalizeProviderToken(provider))?.provider ?? normalizeProviderToken(provider);
}

export function providerLabel(provider: string): string {
  return getProviderRegistryEntry(provider)?.label ?? titleizeProvider(provider);
}

export function productionProviders(): ProductionConnectionProvider[] {
  return PROVIDERS
    .filter(isProductionProviderSeed)
    .map((entry) => entry.provider);
}

export function productionProvidersByArea(): Record<ProductionConnectionArea, readonly ProductionConnectionProvider[]> {
  return {
    database: providersForProductionArea('database'),
    auth: providersForProductionArea('auth'),
    payments: providersForProductionArea('payments'),
    deployment: providersForProductionArea('deployment'),
    monitoring: providersForProductionArea('monitoring'),
    security: providersForProductionArea('security')
  };
}

export function mcpTemplateForProvider(provider: string): ProviderMcpTemplate | null {
  const normalized = normalizeProviderKey(provider);
  const entry = PROVIDERS_BY_KEY.get(normalized);
  if (entry?.mcp) {
    return cloneMcpTemplate(entry.mcp);
  }
  if (normalized === 'supabase-auth') {
    const supabaseMcp = PROVIDERS_BY_KEY.get('supabase')?.mcp;
    return supabaseMcp ? cloneMcpTemplate(supabaseMcp) : null;
  }
  return null;
}

export function stackWiringKeyHasMcp(key: StackWiringKey): boolean {
  return Boolean(mcpTemplateForProvider(providerFromStackWiringKey(key)));
}

export function mcpProviderIdForStackWiringKey(key: StackWiringKey): string | null {
  const provider = providerFromStackWiringKey(key);
  return mcpTemplateForProvider(provider) ? mcpServerProviderId(provider) : null;
}

export function buildProviderRegistrySnapshot(now = new Date()): ProviderRegistrySnapshot {
  const providers = PROVIDERS.map((entry) => withStatus(entry, now));
  return {
    version: 1,
    source: 'bundled',
    generatedAt: now.toISOString(),
    staleAfterDays: PROVIDER_REGISTRY_STALE_AFTER_DAYS,
    status: providers.some((entry) => entry.status === 'stale') ? 'stale' : 'fresh',
    providers
  };
}

function provider(
  providerKey: ProductionConnectionProvider,
  label: string,
  aliases: string[],
  areas: StackWiringArea[],
  productionAreas: ProductionConnectionArea[],
  iconKey: string,
  extras?: Partial<Omit<ProviderSeedBase, 'label' | 'aliases' | 'areas' | 'iconKey' | 'verifiedAt'>>
): ProductionProviderSeed;
function provider(
  providerKey: NonProductionRegistryProvider,
  label: string,
  aliases: string[],
  areas: StackWiringArea[],
  productionAreas: [],
  iconKey: string,
  extras?: Partial<Omit<ProviderSeedBase, 'label' | 'aliases' | 'areas' | 'iconKey' | 'verifiedAt'>>
): NonProductionProviderSeed;
function provider(
  providerKey: RegistryProvider,
  label: string,
  aliases: string[],
  areas: StackWiringArea[],
  productionAreas: ProductionConnectionArea[],
  iconKey: string,
  extras: Partial<Omit<ProviderSeedBase, 'label' | 'aliases' | 'areas' | 'iconKey' | 'verifiedAt'>> = {}
): ProviderSeed {
  const sifgTemplateIds = areas
    .flatMap((area) => sifgTemplatesForRegistryProviderArea(providerKey as never, area))
    .map((template) => template.id);

  return {
    provider: providerKey,
    label,
    aliases,
    areas,
    productionAreas,
    iconKey,
    verifiedAt: '2026-05-18',
    ...(sifgTemplateIds.length > 0 ? { sifgTemplateIds } : {}),
    ...extras
  } as ProviderSeed;
}

function providersForProductionArea(area: ProductionConnectionArea): ProductionConnectionProvider[] {
  return PROVIDERS
    .filter(isProductionProviderSeed)
    .filter((entry) => entry.productionAreas.includes(area))
    .map((entry) => entry.provider);
}

function isProductionProviderSeed(entry: ProviderSeed): entry is ProductionProviderSeed {
  return entry.productionAreas.length > 0;
}

function withStatus(entry: ProviderSeed, now: Date): ProviderRegistryEntry {
  const mcp = entry.mcp ? cloneMcpTemplate(entry.mcp) : undefined;
  const verification = entry.verification ? { ...entry.verification } : undefined;
  return {
    provider: entry.provider,
    label: entry.label,
    aliases: [...entry.aliases],
    areas: [...entry.areas],
    productionAreas: [...entry.productionAreas],
    iconKey: entry.iconKey,
    ...(entry.sifgTemplateIds ? { sifgTemplateIds: [...entry.sifgTemplateIds] } : {}),
    ...(entry.docsUrl ? { docsUrl: entry.docsUrl } : {}),
    ...(entry.dashboardUrl ? { dashboardUrl: entry.dashboardUrl } : {}),
    ...(mcp ? { mcp } : {}),
    ...(verification ? { verification } : {}),
    verifiedAt: entry.verifiedAt,
    status: registryStatus(entry.verifiedAt, now)
  };
}

function cloneMcpTemplate(template: ProviderMcpTemplate): ProviderMcpTemplate {
  return {
    label: template.label,
    serverName: template.serverName,
    vscodeServer: cloneRecord(template.vscodeServer),
    cursorServer: cloneRecord(template.cursorServer),
    keyInstructions: template.keyInstructions
  };
}

function cloneRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, cloneUnknown(value)])
  );
}

function cloneUnknown(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(cloneUnknown);
  }
  if (value && typeof value === 'object') {
    return cloneRecord(value as Record<string, unknown>);
  }
  return value;
}

function registryStatus(verifiedAt: string, now: Date): ProviderRegistryStatus {
  const verifiedTime = Date.parse(`${verifiedAt}T00:00:00.000Z`);
  if (Number.isNaN(verifiedTime)) {
    return 'stale';
  }
  const ageMs = now.getTime() - verifiedTime;
  return ageMs > PROVIDER_REGISTRY_STALE_AFTER_DAYS * 24 * 60 * 60 * 1000 ? 'stale' : 'fresh';
}

function normalizeProviderToken(provider: string): string {
  return provider
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');
}

function providerFromStackWiringKey(key: StackWiringKey): string {
  return key
    .replace(/-(app-flow|frontend|backend|security|auth|database|payments|deployment|landing|monitoring|testing|error-handling)$/, '')
    .replace(/^supabase-database$/, 'supabase')
    .replace(/^supabase-landing$/, 'supabase')
    .replace(/^supabase-auth$/, 'supabase-auth');
}

function mcpServerProviderId(provider: string): string {
  if (provider === 'supabase-auth') {
    return 'supabase';
  }
  if (provider === 'rate-limit') {
    return 'upstash';
  }
  if (provider === 'bot-protection') {
    return 'cloudflare';
  }
  return provider;
}

function titleizeProvider(provider: string): string {
  return provider.replace(/(^|-)([a-z])/g, (_match, prefix: string, letter: string) =>
    `${prefix ? ' ' : ''}${letter.toUpperCase()}`
  );
}

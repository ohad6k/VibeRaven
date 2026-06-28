import type {
  ProductionConnectionArea,
  ProductionConnectionChoice,
  ProductionConnectionChoices,
  ProductionConnectionEvidence,
  ProductionConnectionProvider,
  ProductionConnectionStatus,
  ProductionConnectionSummary,
  ScanResult
} from './types';
import {
  normalizeProviderKey,
  productionProviders,
  productionProvidersByArea,
  providerLabel
} from './providerRegistry';

export type {
  ProductionConnectionArea,
  ProductionConnectionChoice,
  ProductionConnectionChoices,
  ProductionConnectionEvidence,
  ProductionConnectionProvider,
  ProductionConnectionStatus,
  ProductionConnectionSummary
} from './types';

const AREAS: ProductionConnectionArea[] = [
  'database',
  'auth',
  'payments',
  'deployment',
  'monitoring',
  'security'
];

const PROVIDERS = productionProviders();
const PROVIDERS_BY_AREA = productionProvidersByArea();

type EvidenceMap = Partial<Record<ProductionConnectionArea, ProductionConnectionEvidence>>;

type ScannableFile = {
  path: string;
  displayPath: string;
  content: string;
  lowerContent: string;
};

export type ProviderDetectionRule = {
  area: ProductionConnectionArea;
  provider: ProductionConnectionProvider;
  label: string;
  packages?: readonly RegExp[];
  env?: readonly string[];
  paths?: readonly RegExp[];
  imports?: readonly string[];
  docs?: readonly string[];
  content?: readonly Readonly<{ pattern: RegExp; signal: string }>[];
};

type RawProductionConnectionChoice = {
  provider?: unknown;
  selectedAt?: unknown;
};

type ChoiceInput =
  | ProductionConnectionChoices
  | Partial<Record<string, RawProductionConnectionChoice | undefined>>
  | null
  | undefined;

export const PROVIDER_RULES: readonly ProviderDetectionRule[] = freezeProviderRules([
  {
    area: 'database',
    provider: 'supabase',
    label: 'Supabase',
    packages: [/@supabase\//],
    env: ['VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    paths: [/supabase\/config\.toml$/, /(^|\/)(lib|utils)\/supabase\.[jt]s$/],
    imports: ['@supabase/supabase-js', '@supabase/ssr'],
    docs: ['supabase']
  },
  {
    area: 'database',
    provider: 'firebase',
    label: 'Firebase',
    packages: [/^firebase$/, /^firebase-admin$/, /@firebase\//],
    env: ['FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID', 'GOOGLE_APPLICATION_CREDENTIALS'],
    paths: [/firebase/, /firestore/],
    imports: ['firebase/app', 'firebase/firestore', 'firebase-admin'],
    content: [{ pattern: /getFirestore\s*\(|collection\s*\(|firebase-admin/i, signal: 'code: Firebase/Firestore usage' }],
    docs: ['firebase', 'firestore']
  },
  {
    area: 'database',
    provider: 'neon',
    label: 'Neon',
    packages: [/@neondatabase\//],
    env: ['NEON_DATABASE_URL'],
    imports: ['@neondatabase/serverless'],
    docs: ['neon']
  },
  {
    area: 'database',
    provider: 'planetscale',
    label: 'PlanetScale',
    packages: [/@planetscale\/database/],
    env: ['PLANETSCALE_DATABASE_URL'],
    imports: ['@planetscale/database'],
    docs: ['planetscale']
  },
  {
    area: 'database',
    provider: 'mongodb',
    label: 'MongoDB',
    packages: [/^mongodb$/, /^mongoose$/],
    env: ['MONGODB_URI', 'MONGODB_URL', 'MONGODB_ATLAS_URI'],
    imports: ['mongodb', 'mongoose'],
    docs: ['mongodb', 'mongo atlas']
  },
  {
    area: 'database',
    provider: 'turso',
    label: 'Turso',
    packages: [/@libsql\/client/],
    env: ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN'],
    imports: ['@libsql/client'],
    docs: ['turso']
  },
  {
    area: 'auth',
    provider: 'clerk',
    label: 'Clerk',
    packages: [/@clerk\//],
    env: ['CLERK_SECRET_KEY', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'],
    paths: [/middleware\.[jt]sx?$/],
    imports: ['@clerk/nextjs', '@clerk/clerk-react', '@clerk/express'],
    docs: ['clerk']
  },
  {
    area: 'auth',
    provider: 'authjs',
    label: 'Auth.js',
    packages: [/^next-auth$/, /^@auth\//],
    env: ['AUTH_SECRET', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'],
    paths: [/api\/auth\//],
    imports: ['next-auth', '@auth/core', '@auth/nextjs'],
    content: [{ pattern: /NextAuth\s*\(|getServerSession|useSession\s*\(/i, signal: 'code: Auth.js session or route handler' }],
    docs: ['auth.js', 'nextauth', 'next-auth']
  },
  {
    area: 'auth',
    provider: 'auth0',
    label: 'Auth0',
    packages: [/@auth0\//],
    env: ['AUTH0_SECRET', 'AUTH0_ISSUER_BASE_URL', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'AUTH0_DOMAIN'],
    paths: [/api\/auth/, /auth0/],
    imports: ['@auth0/nextjs-auth0', '@auth0/auth0-react', 'express-openid-connect'],
    content: [{ pattern: /handleAuth|withPageAuthRequired|withApiAuthRequired|getSession/i, signal: 'code: Auth0 session or route protection' }],
    docs: ['auth0']
  },
  {
    area: 'auth',
    provider: 'better-auth',
    label: 'Better Auth',
    packages: [/^better-auth$/],
    env: ['BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'AUTH_SECRET', 'DATABASE_URL'],
    paths: [/better-auth/, /auth\.[jt]s$/],
    imports: ['better-auth'],
    content: [{ pattern: /betterAuth\s*\(|auth\.api|auth\.handler/i, signal: 'code: Better Auth config' }],
    docs: ['better auth', 'better-auth']
  },
  {
    area: 'payments',
    provider: 'stripe',
    label: 'Stripe',
    packages: [/^stripe$/, /@stripe\//],
    env: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
    paths: [/stripe.*webhook/, /webhook.*stripe/, /stripe.*checkout/, /checkout.*stripe/],
    imports: ['stripe', '@stripe/stripe-js'],
    docs: ['stripe']
  },
  {
    area: 'payments',
    provider: 'paddle',
    label: 'Paddle',
    packages: [/@paddle\//],
    env: ['PADDLE_API_KEY', 'PADDLE_WEBHOOK_SECRET', 'NEXT_PUBLIC_PADDLE_CLIENT_TOKEN'],
    paths: [/paddle.*webhook/, /webhook.*paddle/, /paddle.*checkout/, /checkout.*paddle/],
    imports: ['@paddle/paddle-js', '@paddle/paddle-node-sdk'],
    docs: ['paddle']
  },
  {
    area: 'payments',
    provider: 'polar',
    label: 'Polar',
    packages: [/@polar-sh\//],
    env: ['POLAR_ACCESS_TOKEN', 'POLAR_WEBHOOK_SECRET', 'POLAR_PRODUCT_ID', 'POLAR_PRO_PRODUCT_ID'],
    paths: [/polar.*webhook/, /webhook.*polar/, /polar.*checkout/, /checkout.*polar/],
    imports: ['@polar-sh/sdk'],
    content: [{ pattern: /api\.polar\.sh|polar.*checkout|createCheckoutSession/i, signal: 'code: Polar checkout or API usage' }],
    docs: ['polar']
  },
  {
    area: 'payments',
    provider: 'lemon-squeezy',
    label: 'Lemon Squeezy',
    packages: [/@lemonsqueezy\//, /^lemonsqueezy\.ts$/],
    env: ['LEMON_SQUEEZY_API_KEY', 'LEMONSQUEEZY_API_KEY', 'LEMON_SQUEEZY_WEBHOOK_SECRET', 'LEMON_SQUEEZY_STORE_ID', 'LEMON_SQUEEZY_VARIANT_ID'],
    paths: [/lemon.*webhook/, /webhook.*lemon/, /lemon.*checkout/, /checkout.*lemon/, /lemonsqueezy/],
    imports: ['@lemonsqueezy/lemonsqueezy.js', 'lemonsqueezy.ts'],
    content: [{ pattern: /api\.lemonsqueezy\.com|lemon.*checkout|checkout_url|variant_id/i, signal: 'code: Lemon Squeezy checkout or API usage' }],
    docs: ['lemon squeezy', 'lemonsqueezy']
  },
  {
    area: 'deployment',
    provider: 'vercel',
    label: 'Vercel',
    packages: [/@vercel\//],
    env: ['VERCEL_TOKEN', 'VERCEL_PROJECT_ID', 'VERCEL_ORG_ID'],
    paths: [/vercel\.json$/],
    docs: ['vercel']
  },
  {
    area: 'deployment',
    provider: 'netlify',
    label: 'Netlify',
    packages: [/@netlify\//],
    env: ['NETLIFY_AUTH_TOKEN', 'NETLIFY_SITE_ID'],
    paths: [/netlify\.toml$/, /\.netlify\//, /(^|\/)_redirects$/],
    imports: ['@netlify/functions'],
    docs: ['netlify']
  },
  {
    area: 'deployment',
    provider: 'render',
    label: 'Render',
    env: ['RENDER_API_KEY', 'RENDER_SERVICE_ID'],
    paths: [/render\.ya?ml$/, /(^|\/)\.render\//],
    content: [{ pattern: /render\.yaml|render\.yml|render deploy|render service/i, signal: 'code: Render deployment config' }],
    docs: ['render.com', 'render deployment']
  },
  {
    area: 'deployment',
    provider: 'railway',
    label: 'Railway',
    env: ['RAILWAY_TOKEN', 'RAILWAY_PROJECT_ID', 'RAILWAY_SERVICE_ID'],
    paths: [/railway\.json$/, /nixpacks\.toml$/, /(^|\/)Procfile$/],
    content: [{ pattern: /railway up|railway deploy|nixpacks|railway\.json/i, signal: 'code: Railway deployment config' }],
    docs: ['railway']
  },
  {
    area: 'deployment',
    provider: 'cloudflare',
    label: 'Cloudflare',
    packages: [/^wrangler$/, /@cloudflare\//],
    env: ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'CF_PAGES'],
    paths: [/wrangler\.toml$/, /wrangler\.json$/, /(^|\/)_headers$/, /(^|\/)_redirects$/],
    imports: ['@cloudflare/workers-types'],
    content: [{ pattern: /compatibility_date|pages_build_output_dir|cloudflare pages|cloudflare workers/i, signal: 'code: Cloudflare Pages/Workers config' }],
    docs: ['cloudflare', 'workers', 'pages']
  },
  {
    area: 'deployment',
    provider: 'aws',
    label: 'AWS',
    packages: [/@aws-sdk\//, /^aws-cdk-lib$/, /^serverless$/],
    env: ['AWS_REGION', 'AWS_ACCESS_KEY_ID'],
    paths: [/serverless\.ya?ml$/, /template\.ya?ml$/, /cdk\.json$/, /amplify\//],
    imports: ['aws-sdk', '@aws-sdk/client'],
    docs: ['aws', 'amplify', 'serverless']
  },
  {
    area: 'monitoring',
    provider: 'sentry',
    label: 'Sentry',
    packages: [/@sentry\//],
    env: ['SENTRY_DSN', 'NEXT_PUBLIC_SENTRY_DSN', 'SENTRY_AUTH_TOKEN'],
    paths: [/sentry\.(client|server)\.config\.[jt]s$/, /instrumentation\.[jt]s$/],
    imports: ['@sentry/nextjs', '@sentry/node', '@sentry/react'],
    content: [{ pattern: /sentry\.init\s*\(/i, signal: 'init: Sentry.init' }],
    docs: ['sentry']
  },
  {
    area: 'monitoring',
    provider: 'posthog',
    label: 'PostHog',
    packages: [/^posthog-js$/, /^posthog-node$/],
    env: ['POSTHOG_KEY', 'NEXT_PUBLIC_POSTHOG_KEY', 'NEXT_PUBLIC_POSTHOG_HOST'],
    imports: ['posthog-js', 'posthog-node'],
    content: [{ pattern: /posthog\.init\s*\(/i, signal: 'init: posthog.init' }],
    docs: ['posthog']
  },
  {
    area: 'monitoring',
    provider: 'logrocket',
    label: 'LogRocket',
    packages: [/^logrocket$/],
    env: ['LOGROCKET_APP_ID', 'NEXT_PUBLIC_LOGROCKET_APP_ID'],
    imports: ['logrocket'],
    content: [{ pattern: /logrocket\.init\s*\(/i, signal: 'init: LogRocket.init' }],
    docs: ['logrocket']
  },
  {
    area: 'security',
    provider: 'rate-limit',
    label: 'Upstash rate limit',
    packages: [/@upstash\/ratelimit/, /express-rate-limit/, /rate-limiter-flexible/, /@fastify\/rate-limit/],
    env: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    paths: [/rate-?limit/, /ratelimit/],
    imports: ['@upstash/ratelimit', 'express-rate-limit', 'rate-limiter-flexible', '@fastify/rate-limit'],
    content: [{ pattern: /\brateLimit\b|\bRatelimit\b|\bToo many requests\b/i, signal: 'code: rate limit guard' }],
    docs: ['upstash', 'rate limit']
  },
  {
    area: 'security',
    provider: 'bot-protection',
    label: 'Cloudflare Turnstile',
    packages: [/turnstile/],
    env: ['NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY', 'TURNSTILE_SITE_KEY'],
    paths: [/turnstile/, /bot.?protection/],
    imports: ['@marsidev/react-turnstile', 'react-turnstile'],
    content: [{ pattern: /\bturnstile\b|\bcf-turnstile\b|\brecaptcha\b|\bhcaptcha\b/i, signal: 'code: bot protection guard' }],
    docs: ['turnstile', 'cloudflare turnstile', 'bot protection']
  }
]);

export function normalizeProductionChoice(input: ChoiceInput): ProductionConnectionChoices {
  const source = isObject(input) && isObject(input.choices) ? input.choices : input;
  const choices: ProductionConnectionChoices['choices'] = {};

  if (!isObject(source)) {
    return { version: 1, choices };
  }

  for (const [areaKey, value] of Object.entries(source)) {
    const area = normalizeArea(areaKey);
    const provider = normalizeProviderForArea(area, isObject(value) ? value.provider : undefined);

    if (!area || !provider) {
      continue;
    }

    const selectedAt = isObject(value) ? normalizeSelectedAt(value.selectedAt) : null;
    if (!selectedAt) {
      continue;
    }

    choices[area] = { provider, selectedAt };
  }

  return { version: 1, choices };
}

export function detectProductionConnectionEvidence(scan: ScanResult): EvidenceMap {
  const evidence: EvidenceMap = {};
  const deps = scan.packageDeps.map((dep) => dep.toLowerCase());
  const files = scan.files.map((file) => ({
    path: normalizePath(file.path),
    displayPath: file.path.replace(/\\/g, '/'),
    content: file.isSecret || typeof file.content !== 'string' ? '' : file.content,
    lowerContent: file.isSecret || typeof file.content !== 'string' ? '' : file.content.toLowerCase()
  }));
  const secretPathBlob = scan.secretsFound.map((path) => normalizePath(path)).join('\n');
  const pathBlob = `${scan.fileTree}\n${files.map((file) => file.path).join('\n')}`.toLowerCase();
  const contentBlob = files.map((file) => file.lowerContent).join('\n').slice(0, 120000);
  const secretsHygieneBlob = `${pathBlob}\n${secretPathBlob}`;

  for (const rule of PROVIDER_RULES) {
    detectProvider(evidence, rule, deps, files, pathBlob);
  }

  detectSecretsHygiene(evidence, secretsHygieneBlob);

  for (const item of Object.values(evidence)) {
    if (!item) {
      continue;
    }
    applyVerificationStatus(item, pathBlob, contentBlob);
  }

  return evidence;
}

export function summarizeProductionConnections(
  choices: ProductionConnectionChoices | null | undefined,
  evidence: EvidenceMap
): {
  byArea: Partial<Record<ProductionConnectionArea, ProductionConnectionSummary>>;
  items: ProductionConnectionSummary[];
  stackRow: ProductionConnectionSummary[];
} {
  const normalized = normalizeProductionChoice(choices);
  const byArea: Partial<Record<ProductionConnectionArea, ProductionConnectionSummary>> = {};
  const items: ProductionConnectionSummary[] = [];

  for (const area of AREAS) {
    const detected = evidence[area];
    const selected = normalized.choices[area];
    let summary: ProductionConnectionSummary | null = null;

    if (detected) {
      summary = {
        area,
        provider: detected.provider,
        source: 'detected',
        status: detected.status,
        label: `${providerLabel(detected.provider)} detected`,
        signals: detected.signals
      };
    } else if (selected) {
      summary = {
        area,
        provider: selected.provider,
        source: 'selected',
        status: ['selected', 'setup-not-verified'],
        label: `${providerLabel(selected.provider)} selected - setup not verified`,
        signals: [`Selected locally at ${selected.selectedAt}`]
      };
    }

    if (summary) {
      byArea[area] = summary;
      items.push(summary);
    }
  }

  const stackRow = items.filter((item) => item.provider !== null);

  return { byArea, items, stackRow };
}

export function buildProductionConnectionContext(
  choices: ProductionConnectionChoices | null | undefined,
  evidence: EvidenceMap
): string {
  const summary = summarizeProductionConnections(choices, evidence);
  const lines = summary.items.map((item) => `${item.area}: ${item.label}`);

  if (lines.some((line) => line.includes('selected - setup not verified'))) {
    lines.push('Do not treat selected as connected; only detected repo evidence can verify setup.');
  }

  return lines.length > 0 ? lines.join('\n') : 'production connections: no selected or detected providers';
}

function detectProvider(
  evidence: EvidenceMap,
  rule: ProviderDetectionRule,
  deps: string[],
  files: ScannableFile[],
  pathBlob: string
): void {
  if (evidence[rule.area]) {
    return;
  }

  const signals = collectSignals(rule, deps, files, pathBlob);
  if (signals.length === 0) {
    return;
  }

  evidence[rule.area] = {
    area: rule.area,
    provider: rule.provider,
    status: ['detected'],
    signals
  };
}

function collectSignals(
  rule: ProviderDetectionRule,
  deps: string[],
  files: ScannableFile[],
  pathBlob: string
): string[] {
  const signals: string[] = [];

  for (const dep of deps) {
    if ((rule.packages ?? []).some((pattern) => testRegex(pattern, dep))) {
      addSignal(signals, `package: ${dep}`);
    }
  }

  const upperContents = files.map((file) => file.content).join('\n').toUpperCase();
  for (const envName of rule.env ?? []) {
    if (upperContents.includes(envName.toUpperCase())) {
      addSignal(signals, `env: ${envName}`);
    }
  }

  const pathLines = pathBlob.split(/\r?\n/).map((path) => path.trim()).filter(Boolean);
  for (const path of pathLines) {
    if ((rule.paths ?? []).some((pattern) => testRegex(pattern, path))) {
      addSignal(signals, `${pathSignalPrefix(path)}: ${path}`);
    }
  }

  for (const file of files) {
    for (const importName of rule.imports ?? []) {
      if (containsImport(file.lowerContent, importName)) {
        addSignal(signals, `import: ${importName}`);
      }
    }

    for (const item of rule.content ?? []) {
      if (testRegex(item.pattern, file.content)) {
        addSignal(signals, item.signal);
      }
    }

    if (isDocsPath(file.path)) {
      for (const docsTerm of rule.docs ?? []) {
        if (file.lowerContent.includes(docsTerm.toLowerCase())) {
          addSignal(signals, `docs: ${file.displayPath} mentions ${rule.label}`);
          break;
        }
      }
    }
  }

  return signals;
}

function containsImport(content: string, importName: string): boolean {
  const escaped = importName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase();
  return new RegExp(`(?:from\\s+['"]${escaped}['"]|import\\s*\\(\\s*['"]${escaped}['"]|require\\s*\\(\\s*['"]${escaped}['"])`).test(content);
}

function isDocsPath(path: string): boolean {
  return /(^|\/)(readme|product|spec)\.md$/.test(path) || /(^|\/)docs\/.*\.md$/.test(path);
}

function pathSignalPrefix(path: string): string {
  if (/webhook|checkout|billing|api\/|route\.[jt]s$/.test(path)) {
    return 'route';
  }
  if (/config|\.json$|\.toml$|\.ya?ml$/.test(path)) {
    return 'config';
  }
  return 'file';
}

function addSignal(signals: string[], signal: string): void {
  if (!signals.includes(signal)) {
    signals.push(signal);
  }
}

function freezeProviderRules(rules: ProviderDetectionRule[]): readonly ProviderDetectionRule[] {
  for (const rule of rules) {
    Object.freeze(rule.packages ?? []);
    Object.freeze(rule.env ?? []);
    Object.freeze(rule.paths ?? []);
    Object.freeze(rule.imports ?? []);
    Object.freeze(rule.docs ?? []);
    if (rule.content) {
      for (const item of rule.content) {
        Object.freeze(item);
      }
      Object.freeze(rule.content);
    }
    Object.freeze(rule);
  }

  return Object.freeze(rules);
}

function testRegex(pattern: RegExp, value: string): boolean {
  pattern.lastIndex = 0;
  return pattern.test(value);
}

function detectSecretsHygiene(evidence: EvidenceMap, secretsHygieneBlob: string): void {
  if (evidence.security) {
    return;
  }

  const signals: string[] = [];
  if (/(^|[/\\])\.env\.example\b/m.test(secretsHygieneBlob)) {
    signals.push('file: .env.example');
  }
  if (/(^|[/\\])\.env(\.|$)/m.test(secretsHygieneBlob)) {
    signals.push('secret file excluded from scan');
  }
  if (signals.length === 0) {
    return;
  }

  evidence.security = {
    area: 'security',
    provider: 'secrets-hygiene',
    status: ['detected'],
    signals
  };
}

function applyVerificationStatus(
  evidence: ProductionConnectionEvidence,
  pathBlob: string,
  contentBlob: string
): void {
  if (evidence.provider === 'secrets-hygiene') {
    addStatus(evidence.status, 'repo-verified');
    return;
  }

  const hasEnv = envPatternFor(evidence.provider).test(contentBlob);
  const hasWebhook = webhookPatternFor(evidence.provider).test(`${pathBlob}\n${contentBlob}`);

  if (hasEnv || hasWebhook || evidence.area === 'deployment') {
    addStatus(evidence.status, 'repo-verified');
  }

  if (evidence.area === 'payments' && !hasWebhook) {
    addStatus(evidence.status, 'needs-webhook');
  }

  if (!hasEnv && evidence.area !== 'deployment') {
    addStatus(evidence.status, 'needs-env');
  }
}

function envPatternFor(provider: ProductionConnectionProvider): RegExp {
  switch (provider) {
    case 'supabase':
      return /\b((vite|next_public)_)?supabase_(url|anon_key|service_role_key)\b/i;
    case 'clerk':
      return /\b(clerk_secret_key|next_public_clerk_)/i;
    case 'authjs':
      return /\b(auth_secret|nextauth_secret)\b/i;
    case 'neon':
      return /\b(neon_database_url|database_url)\b/i;
    case 'planetscale':
      return /\b(planetscale_database_url|database_url)\b/i;
    case 'mongodb':
      return /\b(mongodb_uri|mongodb_url|database_url)\b/i;
    case 'turso':
      return /\b(turso_database_url|turso_auth_token|database_url)\b/i;
    case 'stripe':
      return /\bstripe_(secret_key|webhook_secret)\b/i;
    case 'paddle':
      return /\bpaddle_(api_key|webhook_secret|client_token)\b/i;
    case 'polar':
      return /\bpolar_(access_token|webhook_secret|pro_product_id|sandbox)\b/i;
    case 'sentry':
      return /\bsentry_dsn\b/i;
    case 'posthog':
      return /\b(posthog_key|next_public_posthog_key)\b/i;
    case 'logrocket':
      return /\b(logrocket_app_id|next_public_logrocket_app_id)\b/i;
    case 'rate-limit':
      return /\b(upstash_redis_rest_url|upstash_redis_rest_token)\b/i;
    case 'bot-protection':
      return /\b(next_public_turnstile_site_key|turnstile_secret_key|turnstile_site_key)\b/i;
    default:
      return /\b[A-Z0-9_]+_(KEY|SECRET|TOKEN|URL)\b/i;
  }
}

function webhookPatternFor(provider: ProductionConnectionProvider): RegExp {
  switch (provider) {
    case 'stripe':
      return /\bstripe\b.*\bwebhook\b|\bwebhook\b.*\bstripe\b/i;
    case 'paddle':
      return /\bpaddle\b.*\bwebhook\b|\bwebhook\b.*\bpaddle\b/i;
    case 'polar':
      return /\bpolar\b.*\bwebhook\b|\bwebhook\b.*\bpolar\b/i;
    default:
      return /\bwebhook\b/i;
  }
}

function addStatus(status: ProductionConnectionStatus[], value: ProductionConnectionStatus): void {
  if (!status.includes(value)) {
    status.push(value);
  }
}

function normalizeArea(value: unknown): ProductionConnectionArea | null {
  const normalized = String(value).toLowerCase();
  return AREAS.includes(normalized as ProductionConnectionArea) ? (normalized as ProductionConnectionArea) : null;
}

function normalizeProvider(value: unknown): ProductionConnectionProvider | null {
  const normalized = normalizeProviderKey(String(value));
  const productionProvider = normalized === 'supabase-auth' ? 'supabase' : normalized;
  return PROVIDERS.includes(productionProvider as ProductionConnectionProvider)
    ? (productionProvider as ProductionConnectionProvider)
    : null;
}

function normalizeProviderForArea(
  area: ProductionConnectionArea | null,
  value: unknown
): ProductionConnectionProvider | null {
  if (!area) {
    return null;
  }

  const provider = normalizeProvider(value);
  if (!provider || !PROVIDERS_BY_AREA[area].includes(provider)) {
    return null;
  }

  return provider;
}

function normalizeSelectedAt(value: unknown): string | null {
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return null;
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').toLowerCase();
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

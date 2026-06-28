import type {
  ProductionConnectionSummary,
  ScanResult,
  VerificationArea,
  VerificationAreaSummary,
  VerificationItem,
  VerificationItemStatus,
  VerificationSummary
} from './types';

type ProductionConnectionSummaryPayload = {
  byArea: Partial<Record<string, ProductionConnectionSummary>>;
  items: ProductionConnectionSummary[];
  stackRow: ProductionConnectionSummary[];
};

type VerificationContext = {
  deps: Set<string>;
  paths: Set<string>;
  contents: string;
  secretPaths: Set<string>;
  scan: ScanResult;
};

const PROVIDER_LABELS: Record<string, string> = {
  supabase: 'Supabase',
  clerk: 'Clerk',
  authjs: 'Auth.js',
  neon: 'Neon',
  planetscale: 'PlanetScale',
  mongodb: 'MongoDB',
  turso: 'Turso',
  stripe: 'Stripe',
  paddle: 'Paddle',
  vercel: 'Vercel',
  sentry: 'Sentry',
  posthog: 'PostHog',
  logrocket: 'LogRocket',
  'rate-limit': 'Rate limit',
  'bot-protection': 'Bot protection',
  'secrets-hygiene': 'Secrets hygiene'
};

const AREAS: VerificationArea[] = [
  'auth',
  'database',
  'payments',
  'deployment',
  'monitoring',
  'security',
  'testing',
  'landing',
  'frontend',
  'backend',
  'appFlow',
  'errorHandling'
];

const CONTENT_CAP = 500_000;

export function buildVerificationSummary(
  scan: ScanResult,
  productionConnections: ProductionConnectionSummaryPayload
): VerificationSummary {
  const ctx = buildContext(scan);
  const byArea: VerificationSummary['byArea'] = {};

  for (const area of AREAS) {
    byArea[area] = emptyArea(area);
  }

  applyAuthRules(byArea.auth!, ctx);
  applyDatabaseRules(byArea.database!, ctx);
  applyPaymentRules(byArea.payments!, ctx);
  applyDeploymentRules(byArea.deployment!, ctx);
  applyMonitoringRules(byArea.monitoring!, ctx);
  applySecurityRules(byArea.security!, ctx);
  applyTestingRules(byArea.testing!, ctx);
  applyLandingRules(byArea.landing!, ctx);
  applyFrontendRules(byArea.frontend!, ctx);
  applyBackendRules(byArea.backend!, ctx);
  applyAppFlowRules(byArea.appFlow!, ctx);
  applyErrorHandlingRules(byArea.errorHandling!, ctx);
  applyProductionConnectionEvidence(byArea, productionConnections);

  return { byArea };
}

export function buildVerificationEvidenceContext(summary: VerificationSummary): string {
  const lines: string[] = [];
  for (const area of AREAS) {
    const areaSummary = summary.byArea[area];
    if (!areaSummary) {
      continue;
    }
    const found = areaSummary.found.slice(0, 6).map(formatVerificationContextItem);
    const missing = areaSummary.missing.slice(0, 6).map(formatVerificationContextItem);
    if (found.length > 0) {
      lines.push(`${area} found: ${found.join(' | ')}`);
    }
    if (missing.length > 0) {
      lines.push(`${area} missing: ${missing.join(' | ')}`);
    }
  }

  return lines.join('\n');
}

function formatVerificationContextItem(item: VerificationItem): string {
  return item.detail ? `${item.label} (${item.detail})` : item.label;
}

function buildContext(scan: ScanResult): VerificationContext {
  const deps = new Set(scan.packageDeps.map((dep) => dep.toLowerCase()));
  const paths = new Set<string>();
  const secretPaths = new Set<string>();
  const contentParts: string[] = [];
  let contentLength = 0;

  for (const line of scan.fileTree.split(/\r?\n/)) {
    const normalized = normalizePath(line);
    if (normalized) {
      paths.add(normalized);
    }
  }

  for (const file of scan.files) {
    if (!file.isSecret) {
      const normalized = normalizePath(file.path);
      if (normalized) {
        paths.add(normalized);
      }
    }

    if (!file.isSecret && file.content) {
      const next = file.content.toLowerCase();
      const remaining = CONTENT_CAP - contentLength;
      if (remaining > 0) {
        contentParts.push(next.slice(0, remaining));
        contentLength += Math.min(next.length, remaining);
      }
    }
  }

  for (const secretPath of scan.secretsFound) {
    const normalized = normalizePath(secretPath);
    if (normalized) {
      secretPaths.add(normalized);
    }
  }

  return {
    deps,
    paths,
    contents: contentParts.join('\n'),
    secretPaths,
    scan
  };
}

function emptyArea(area: VerificationArea): VerificationAreaSummary {
  return {
    area,
    found: [],
    missing: [],
    manual: []
  };
}

function normalizePath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .replace(/^[\s\u2500\u2502\u2514\u251c>*+-]+/u, '')
    .trim()
    .toLowerCase();
}

function addFound(area: VerificationAreaSummary, label: string, source: string, detail?: string): void {
  addItem(area, 'found', label, source, detail);
}

function addMissing(area: VerificationAreaSummary, label: string, source: string, detail?: string): void {
  addItem(area, 'missing', label, source, detail);
}

function addManual(area: VerificationAreaSummary, label: string, source: string, detail?: string): void {
  addItem(area, 'manual', label, source, detail);
}

function addItem(
  area: VerificationAreaSummary,
  status: VerificationItemStatus,
  label: string,
  source: string,
  detail?: string
): void {
  const item = compactItem(label, status, source, detail);
  const bucket = area[status];
  if (!bucket.some((existing) => existing.label === item.label)) {
    bucket.push(item);
  }
}

function compactItem(
  label: string,
  status: VerificationItemStatus,
  source: string,
  detail?: string
): VerificationItem {
  return detail ? { label, status, source, detail } : { label, status, source };
}

function hasDep(ctx: VerificationContext, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const normalized = pattern.toLowerCase();
    return [...ctx.deps].some((dep) => dep === normalized || dep.includes(normalized));
  });
}

function hasPath(ctx: VerificationContext, patterns: RegExp[]): boolean {
  return [...ctx.paths].some((path) => !ctx.secretPaths.has(path) && patterns.some((pattern) => pattern.test(path)));
}

function hasContent(ctx: VerificationContext, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(ctx.contents));
}

function hasEnvName(ctx: VerificationContext, names: string[]): boolean {
  return names.some((name) => ctx.contents.includes(name.toLowerCase()));
}

function applyAuthRules(area: VerificationAreaSummary, ctx: VerificationContext): void {
  if (hasDep(ctx, ['@clerk/nextjs', 'clerk'])) {
    addFound(area, 'Clerk dependency found', 'package.json dependencies');
  } else if (hasDep(ctx, ['next-auth', '@auth/core', '@auth/nextjs'])) {
    addFound(area, 'Auth.js dependency found', 'package.json dependencies');
  } else if (hasDep(ctx, ['@supabase/supabase-js', '@supabase/auth-helpers-nextjs', '@supabase/ssr'])) {
    addFound(area, 'Supabase auth dependency found', 'package.json dependencies');
  } else {
    addMissing(area, 'Auth dependency missing', 'package.json dependencies');
  }

  if (
    hasPath(ctx, [/^middleware\.[jt]sx?$/, /\/middleware\.[jt]sx?$/]) ||
    hasContent(ctx, [/clerkmiddleware\s*\(/, /withauth\s*\(/, /authmiddleware\s*\(/])
  ) {
    addFound(area, 'Auth middleware found', 'middleware file or auth middleware call');
  } else {
    addMissing(area, 'Auth middleware missing', 'middleware file or auth middleware call');
  }

  if (
    hasEnvName(ctx, [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'NEXTAUTH_SECRET',
      'AUTH_SECRET',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ])
  ) {
    addFound(area, 'Auth env names listed', 'non-secret scanned content');
  } else {
    addMissing(area, 'Auth env names missing', 'non-secret scanned content');
  }

  addManual(area, 'Provider dashboard settings', 'external provider dashboard');
  addManual(area, 'Real production auth keys', 'external provider dashboard');
}

function applyDatabaseRules(area: VerificationAreaSummary, ctx: VerificationContext): void {
  if (hasDep(ctx, ['prisma', 'drizzle-orm', '@supabase/supabase-js', 'mongoose', 'mongodb', '@neondatabase/serverless'])) {
    addFound(area, 'Database dependency found', 'package.json dependencies');
  } else {
    addMissing(area, 'Database dependency missing', 'package.json dependencies');
  }

  if (hasPath(ctx, [/prisma\/schema\.prisma$/, /migrations?\//, /drizzle\//, /schema\.(ts|js|sql)$/])) {
    addFound(area, 'Schema or migration file found', 'repo paths');
  } else {
    addMissing(area, 'Schema or migration file missing', 'repo paths');
  }

  if (
    hasContent(ctx, [
      /prisma\.[a-z0-9_]+\.(find|create|update|delete|upsert|aggregate)/i,
      /\bdb\.(select|insert|update|delete|query)\s*\(/i,
      /\bmongoose\.model\s*\(/i,
      /\bnew\s+mongoclient\s*\(/i,
      /\bcreateclient\s*\([^)]*supabase/i,
      /\.from\s*\(\s*['"][a-z0-9_]+['"]\s*\)/i
    ])
  ) {
    addFound(area, 'Database query usage found', 'repo evidence');
  }

  if (ctx.scan.stackSignals.hasSupabase || hasDep(ctx, ['@supabase/supabase-js', '@supabase/ssr'])) {
    if (
      hasPath(ctx, [/supabase\/migrations\/.*\.sql$/, /\/policies\//, /rls/i]) ||
      hasContent(ctx, [/enable\s+row\s+level\s+security/i, /create\s+policy/i, /alter\s+table[\s\S]{0,200}enable\s+row\s+level/i])
    ) {
      addFound(area, 'Supabase RLS policy evidence found', 'repo evidence');
    } else {
      addMissing(area, 'Supabase RLS policy evidence missing', 'repo evidence');
    }
  }

  if (
    hasEnvName(ctx, [
      'DATABASE_URL',
      'POSTGRES_URL',
      'SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEON_DATABASE_URL',
      'PLANETSCALE_DATABASE_URL',
      'MONGODB_URI',
      'MONGODB_URL',
      'TURSO_DATABASE_URL',
      'TURSO_AUTH_TOKEN'
    ])
  ) {
    addFound(area, 'Database env names listed', 'non-secret scanned content');
  } else {
    addMissing(area, 'Database env names missing', 'non-secret scanned content');
  }

  addManual(area, 'Hosted DB project settings', 'external database dashboard');
  addManual(area, 'Production access policy', 'external database dashboard');
}

function applyPaymentRules(area: VerificationAreaSummary, ctx: VerificationContext): void {
  if (hasDep(ctx, ['stripe'])) {
    addFound(area, 'Stripe dependency found', 'package.json dependencies');
  } else if (hasDep(ctx, ['@paddle/paddle-js', 'paddle'])) {
    addFound(area, 'Paddle dependency found', 'package.json dependencies');
  } else {
    addMissing(area, 'Payment dependency missing', 'package.json dependencies');
  }

  if (
    hasPath(ctx, [
      /stripe\/.*webhook/,
      /webhook.*stripe/,
      /paddle\/.*webhook/,
      /webhook.*paddle/,
      /stripe\/route\.[jt]s$/,
      /paddle\/route\.[jt]s$/
    ]) ||
    hasContent(ctx, [/stripe[^.\n]*webhook/, /webhook[^.\n]*stripe/, /paddle[^.\n]*webhook/, /webhook[^.\n]*paddle/, /constructevent\s*\(/])
  ) {
    addFound(area, 'Payment webhook route found', 'repo paths or webhook handler code');
  } else {
    addMissing(area, 'Payment webhook route missing', 'repo paths or webhook handler code');
  }

  if (
    hasPath(ctx, [
      /checkout/,
      /billing/,
      /stripe\/.*session/,
      /session.*stripe/,
      /paddle\/.*session/,
      /session.*paddle/
    ]) ||
    hasContent(ctx, [/checkout\.sessions\.create\s*\(/, /createcheckoutsession/, /billing_portal/])
  ) {
    addFound(area, 'Checkout/session route found', 'repo paths or checkout code');
  } else {
    addMissing(area, 'Checkout/session route missing', 'repo paths or checkout code');
  }

  if (
    hasEnvName(ctx, [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'PADDLE_API_KEY',
      'PADDLE_WEBHOOK_SECRET',
      'NEXT_PUBLIC_PADDLE_CLIENT_TOKEN'
    ])
  ) {
    addFound(area, 'Payment env names listed', 'non-secret scanned content');
  } else {
    addMissing(area, 'Payment env names missing', 'non-secret scanned content');
  }

  addManual(area, 'Provider dashboard configuration', 'external payment dashboard');
  addManual(area, 'Webhook endpoint registered with provider', 'external payment dashboard');
}

function applyDeploymentRules(area: VerificationAreaSummary, ctx: VerificationContext): void {
  if (hasPath(ctx, [/vercel\.json$/, /netlify\.toml$/, /render\.ya?ml$/, /dockerfile$/, /docker-compose\.ya?ml$/])) {
    addFound(area, 'Deployment config found', 'repo paths');
  } else {
    addMissing(area, 'Deployment config missing', 'repo paths');
  }

  if (hasContent(ctx, [/"build"\s*:/])) {
    addFound(area, 'Build script found', 'package scripts');
  } else {
    addMissing(area, 'Build script missing', 'package scripts');
  }

  if (ctx.scan.stackSignals.hasCI || hasPath(ctx, [/(^|\/)\.github\/workflows\/[^/]+\.ya?ml$/, /(^|\/)\.gitlab-ci\.yml$/, /(^|\/)circle\.yml$/])) {
    addFound(area, 'CI config found', 'repo paths');
  } else {
    addMissing(area, 'CI config missing', 'repo paths');
  }

  addManual(area, 'Hosting environment variables checked', 'hosting dashboard');
  addManual(area, 'DNS and production domain checked', 'hosting dashboard');
}

function applyMonitoringRules(area: VerificationAreaSummary, ctx: VerificationContext): void {
  if (hasDep(ctx, ['@sentry/nextjs', '@sentry/node', 'posthog-js', 'logrocket'])) {
    addFound(area, 'Monitoring dependency found', 'package.json dependencies');
  } else {
    addMissing(area, 'Monitoring dependency missing', 'package.json dependencies');
  }

  if (hasContent(ctx, [/sentry\.init\s*\(/, /posthog\.init\s*\(/, /logrocket\.init\s*\(/])) {
    addFound(area, 'Monitoring SDK init found', 'non-secret scanned content');
  } else {
    addMissing(area, 'Monitoring SDK init missing', 'non-secret scanned content');
  }

  if (hasEnvName(ctx, ['SENTRY_DSN', 'NEXT_PUBLIC_SENTRY_DSN', 'NEXT_PUBLIC_POSTHOG_KEY', 'LOGROCKET_APP_ID'])) {
    addFound(area, 'Monitoring env names listed', 'non-secret scanned content');
  } else {
    addMissing(area, 'Monitoring env names missing', 'non-secret scanned content');
  }

  addManual(area, 'Dashboard receiving events', 'external monitoring dashboard');
}

function applySecurityRules(area: VerificationAreaSummary, ctx: VerificationContext): void {
  if (ctx.scan.stackSignals.hasRateLimit || hasDep(ctx, ['@upstash/ratelimit']) || hasContent(ctx, [/ratelimit/, /rate limit/])) {
    addFound(area, 'Rate limit evidence found', 'repo evidence');
  } else {
    addMissing(area, 'Rate limit evidence missing', 'repo evidence');
  }

  if (hasContent(ctx, [/bot protection/, /turnstile/, /recaptcha/, /hcaptcha/]) || hasDep(ctx, ['@marsidev/react-turnstile'])) {
    addFound(area, 'Bot protection evidence found', 'repo evidence');
  } else {
    addMissing(area, 'Bot protection evidence missing', 'repo evidence');
  }

  if (ctx.scan.stackSignals.hasEnvExample || hasPath(ctx, [/\.env\.example$/, /\.env\.sample$/, /example\.env$/])) {
    addFound(area, '.env.example found', 'repo paths');
  } else {
    addMissing(area, '.env.example missing', 'repo paths');
  }

  if (ctx.secretPaths.size > 0) {
    addFound(area, 'Secret-like files excluded from scan content', 'secret filename list');
  }

  addManual(area, 'WAF and abuse controls', 'hosting or security dashboard');
  addManual(area, 'Real secret rotation', 'production secret manager');
}

function applyTestingRules(area: VerificationAreaSummary, ctx: VerificationContext): void {
  if (hasDep(ctx, ['vitest', 'jest', '@playwright/test', 'cypress', 'mocha']) || hasContent(ctx, [/"test"\s*:/])) {
    addFound(area, 'Test tooling found', 'package.json dependencies or scripts');
  } else {
    addMissing(area, 'Test tooling missing', 'package.json dependencies or scripts');
  }

  if (hasDep(ctx, ['@playwright/test']) || hasPath(ctx, [/playwright\.config\.[jt]s$/])) {
    addFound(area, 'Playwright dependency found', 'package.json dependencies or config');
  }

  if (ctx.scan.stackSignals.hasTests || hasPath(ctx, [/\.test\.[jt]sx?$/, /\.spec\.[jt]sx?$/, /__tests__\//])) {
    addFound(area, 'Test files found', 'repo paths');
  } else {
    addMissing(area, 'Test files missing', 'repo paths');
  }

  if (hasDep(ctx, ['@playwright/test']) && hasPath(ctx, [/\.spec\.[jt]sx?$/, /e2e\//, /tests?\//])) {
    addFound(area, 'End-to-end test files found', 'repo paths');
  }

  if (ctx.scan.stackSignals.hasCI || hasPath(ctx, [/(^|\/)\.github\/workflows\/[^/]+\.ya?ml$/, /(^|\/)\.gitlab-ci\.yml$/, /(^|\/)circle\.yml$/])) {
    addFound(area, 'CI workflow found', 'repo paths');
  }

  addManual(area, 'CI status', 'CI provider dashboard');
}

function applyLandingRules(area: VerificationAreaSummary, ctx: VerificationContext): void {
  if (
    ctx.scan.stackSignals.hasLanding ||
    hasPath(ctx, [/app\/page\.[jt]sx?$/, /pages\/index\.[jt]sx?$/, /landing\//, /home\.[jt]sx?$/])
  ) {
    addFound(area, 'Landing page found', 'repo paths');
  } else {
    addMissing(area, 'Landing page missing', 'repo paths');
  }

  if (hasPath(ctx, [/pricing/, /account/, /onboarding/])) {
    addFound(area, 'Pricing/account/onboarding path found', 'repo paths');
  } else {
    addMissing(area, 'Pricing/account/onboarding path missing', 'repo paths');
  }

  if (hasContent(ctx, [/analytics/, /posthog/, /gtag\(/, /plausible/])) {
    addFound(area, 'Funnel or analytics evidence found', 'non-secret scanned content');
  } else {
    addMissing(area, 'Funnel or analytics evidence missing', 'non-secret scanned content');
  }

  if (ctx.scan.stackSignals.hasRobots && ctx.scan.stackSignals.hasSitemap) {
    addFound(area, 'SEO crawl files found', 'repo paths');
  } else {
    addMissing(area, 'SEO crawl files missing', 'repo paths');
  }

  addManual(area, 'Conversion quality', 'manual product review');
}

function applyFrontendRules(area: VerificationAreaSummary, ctx: VerificationContext): void {
  if (hasDep(ctx, ['react', 'vue', 'svelte', '@angular/core']) || hasPath(ctx, [/src\/.*\.[jt]sx$/, /app\/.*\.[jt]sx$/])) {
    addFound(area, 'Frontend framework evidence found', 'repo evidence');
  } else {
    addMissing(area, 'Frontend framework evidence missing', 'repo evidence');
  }

  if (ctx.scan.stackSignals.hasLoadingStates || hasPath(ctx, [/loading\.[jt]sx?$/]) || hasContent(ctx, [/loading/i])) {
    addFound(area, 'Loading state evidence found', 'repo evidence');
  } else {
    addMissing(area, 'Loading state evidence missing', 'repo evidence');
  }

  addManual(area, 'Responsive UX review', 'manual product review');
}

function applyBackendRules(area: VerificationAreaSummary, ctx: VerificationContext): void {
  if (hasPath(ctx, [/api\//, /route\.[jt]s$/, /server\.[jt]s$/, /controllers?\//])) {
    addFound(area, 'Backend route evidence found', 'repo paths');
  } else {
    addMissing(area, 'Backend route evidence missing', 'repo paths');
  }

  if (
    hasDep(ctx, ['zod', 'joi', 'yup', 'valibot', '@sinclair/typebox', 'class-validator']) ||
    hasContent(ctx, [
      /\bzod\b/,
      /\bjoi\b/,
      /\byup\b/,
      /\bvalibot\b/,
      /from\s+['"]joi['"]/,
      /require\s*\(\s*['"]joi['"]\s*\)/,
      /\.safeparse\s*\(/,
      /\.parse\s*\(/,
      /request validation/
    ])
  ) {
    addFound(area, 'Input validation evidence found', 'non-secret scanned content');
  } else {
    addMissing(area, 'Input validation evidence missing', 'non-secret scanned content');
  }

  addManual(area, 'Production data behavior reviewed', 'manual product review');
}

function applyAppFlowRules(area: VerificationAreaSummary, ctx: VerificationContext): void {
  if (hasPath(ctx, [/onboarding/, /dashboard/, /account/, /settings/])) {
    addFound(area, 'Core app flow paths found', 'repo paths');
  } else {
    addMissing(area, 'Core app flow paths missing', 'repo paths');
  }

  if (hasContent(ctx, [/redirect\(/, /router\.push/, /navigate\(/])) {
    addFound(area, 'Navigation flow evidence found', 'non-secret scanned content');
  } else {
    addMissing(area, 'Navigation flow evidence missing', 'non-secret scanned content');
  }

  addManual(area, 'End-to-end user journey checked', 'manual product review');
}

function applyErrorHandlingRules(area: VerificationAreaSummary, ctx: VerificationContext): void {
  if (
    ctx.scan.stackSignals.hasErrorBoundary ||
    hasPath(ctx, [/error\.[jt]sx?$/, /error-boundary/i, /errorboundary/i]) ||
    hasContent(ctx, [/componentdidcatch/i, /\berrorboundary\b/i, /react\.component/i])
  ) {
    addFound(area, 'Error boundary evidence found', 'repo evidence');
  } else {
    addMissing(area, 'Error boundary evidence missing', 'repo evidence');
  }

  if (hasContent(ctx, [/try\s*{/, /\.catch\s*\(/, /throw new error/])) {
    addFound(area, 'Runtime error handling evidence found', 'non-secret scanned content');
  } else {
    addMissing(area, 'Runtime error handling evidence missing', 'non-secret scanned content');
  }

  addManual(area, 'Production failure paths reviewed', 'manual product review');
}

function applyProductionConnectionEvidence(
  byArea: VerificationSummary['byArea'],
  productionConnections: ProductionConnectionSummaryPayload
): void {
  const summaries = collectProductionConnectionSummaries(productionConnections);

  for (const summary of summaries) {
    if (!summary || summary.source !== 'detected' || !summary.provider) {
      continue;
    }

    const area = byArea[summary.area as VerificationArea];
    if (!area) {
      continue;
    }

    const provider = providerLabel(summary.provider);
    const detail = summary.signals.length > 0 ? summary.signals.slice(0, 4).join('; ') : undefined;
    addFound(area, `${provider} detected by scanner`, 'production connection scanner', detail);

    if (summary.status.includes('needs-env')) {
      addMissing(area, `${provider} env evidence missing`, 'production connection scanner');
    }
    if (summary.status.includes('needs-webhook')) {
      addMissing(area, `${provider} webhook evidence missing`, 'production connection scanner');
    }
  }
}

function collectProductionConnectionSummaries(
  productionConnections: ProductionConnectionSummaryPayload
): ProductionConnectionSummary[] {
  const seen = new Set<string>();
  const summaries: ProductionConnectionSummary[] = [];

  function add(summary: ProductionConnectionSummary | undefined): void {
    if (!summary || !summary.provider) {
      return;
    }
    const key = `${summary.area}:${summary.provider}:${summary.source}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    summaries.push(summary);
  }

  for (const summary of Object.values(productionConnections.byArea)) {
    add(summary);
  }
  for (const summary of productionConnections.items) {
    add(summary);
  }
  for (const summary of productionConnections.stackRow) {
    add(summary);
  }

  return summaries;
}

function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider.replace(/(^|-)([a-z])/g, (_: string, prefix: string, letter: string) =>
    `${prefix === '-' ? ' ' : ''}${letter.toUpperCase()}`
  );
}

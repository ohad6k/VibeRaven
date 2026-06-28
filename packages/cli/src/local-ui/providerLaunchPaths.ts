import type { LocalUiLaunchPathItem } from './types';

export interface LaunchPathTemplate {
  id: string;
  name: string;
  area: string;
  title: string;
  items: Array<Omit<LocalUiLaunchPathItem, 'state' | 'shortReason'>>;
}

function item(providerId: string, id: string, title: string, source: LocalUiLaunchPathItem['source']): Omit<LocalUiLaunchPathItem, 'state' | 'shortReason'> {
  return { id: `${providerId}-${id}`, providerId, title, source };
}

const catalog: LaunchPathTemplate[] = [
  {
    id: 'supabase',
    name: 'Supabase',
    area: 'Database',
    title: 'Supabase launch path',
    items: [
      item('supabase', 'migrations', 'Schema and migrations', 'repo'),
      item('supabase', 'rls', 'RLS policies', 'repo'),
      item('supabase', 'auth-callbacks', 'Auth callbacks', 'repo'),
      item('supabase', 'production-env', 'Production env', 'repo'),
      item('supabase', 'final-verification', 'Final verification', 'verify')
    ]
  },
  {
    id: 'vercel',
    name: 'Vercel',
    area: 'Deployment',
    title: 'Vercel launch path',
    items: [
      item('vercel', 'project-link', 'Project link', 'repo'),
      item('vercel', 'production-env', 'Production env', 'repo'),
      item('vercel', 'build-command', 'Build command', 'repo'),
      item('vercel', 'domain-redirects', 'Domain and redirects', 'manual'),
      item('vercel', 'deployment', 'Final deployment', 'verify')
    ]
  },
  {
    id: 'stripe',
    name: 'Stripe',
    area: 'Payments',
    title: 'Stripe launch path',
    items: [
      item('stripe', 'product-price', 'Product and price', 'manual'),
      item('stripe', 'checkout-route', 'Checkout route', 'repo'),
      item('stripe', 'webhook-route', 'Webhook route', 'repo'),
      item('stripe', 'signature', 'Signature verification', 'repo'),
      item('stripe', 'test-event', 'Test event', 'manual')
    ]
  },
  {
    id: 'github',
    name: 'GitHub',
    area: 'CI',
    title: 'GitHub launch path',
    items: [
      item('github', 'repo', 'Repo detected', 'repo'),
      item('github', 'workflow', 'CI workflow', 'repo'),
      item('github', 'checks', 'Required checks', 'manual'),
      item('github', 'secrets', 'Secret names', 'repo'),
      item('github', 'branch-protection', 'Branch protection', 'manual')
    ]
  },
  {
    id: 'sentry',
    name: 'Sentry',
    area: 'Monitoring',
    title: 'Sentry launch path',
    items: [
      item('sentry', 'sdk', 'SDK installed', 'repo'),
      item('sentry', 'dsn', 'DSN env', 'repo'),
      item('sentry', 'boundary', 'Error boundary', 'repo'),
      item('sentry', 'source-maps', 'Source maps', 'repo'),
      item('sentry', 'event', 'Production event', 'manual')
    ]
  },
  {
    id: 'posthog',
    name: 'PostHog',
    area: 'Analytics',
    title: 'PostHog launch path',
    items: [
      item('posthog', 'sdk', 'SDK installed', 'repo'),
      item('posthog', 'key', 'Project key env', 'repo'),
      item('posthog', 'capture', 'Event capture', 'repo'),
      item('posthog', 'privacy', 'Privacy defaults', 'repo'),
      item('posthog', 'dashboard', 'Dashboard check', 'manual')
    ]
  },
  {
    id: 'clerk',
    name: 'Clerk',
    area: 'Auth',
    title: 'Clerk launch path',
    items: [
      item('clerk', 'middleware', 'Protected routes', 'repo'),
      item('clerk', 'env', 'Production env', 'repo'),
      item('clerk', 'callbacks', 'Redirect URLs', 'manual'),
      item('clerk', 'session', 'Session handling', 'repo')
    ]
  },
  {
    id: 'authjs',
    name: 'Auth.js',
    area: 'Auth',
    title: 'Auth.js launch path',
    items: [
      item('authjs', 'secret', 'Auth secret', 'repo'),
      item('authjs', 'providers', 'OAuth providers', 'repo'),
      item('authjs', 'callbacks', 'Callback URLs', 'manual'),
      item('authjs', 'session', 'Session strategy', 'repo')
    ]
  },
  {
    id: 'resend',
    name: 'Resend',
    area: 'Email',
    title: 'Resend launch path',
    items: [
      item('resend', 'api-key', 'API key env', 'repo'),
      item('resend', 'domain', 'Sending domain', 'manual'),
      item('resend', 'templates', 'Email templates', 'repo'),
      item('resend', 'test-send', 'Test send', 'manual')
    ]
  },
  {
    id: 'upstash',
    name: 'Upstash',
    area: 'Cache and rate limits',
    title: 'Upstash launch path',
    items: [
      item('upstash', 'env', 'Redis env', 'repo'),
      item('upstash', 'rate-limit', 'Rate limit path', 'repo'),
      item('upstash', 'quota', 'Quota check', 'manual'),
      item('upstash', 'verify', 'Final verification', 'verify')
    ]
  }
];

export function listLocalUiProviderCatalog(): LaunchPathTemplate[] {
  return catalog.map((provider) => ({
    ...provider,
    items: provider.items.map((launchItem) => ({ ...launchItem }))
  }));
}

export function getLaunchPathTemplate(providerId: string): LaunchPathTemplate | undefined {
  const normalized = providerId.trim().toLowerCase();
  return listLocalUiProviderCatalog().find((provider) => provider.id === normalized);
}

/** Stack-map provider choices — keep in sync with `STACK_MAP_PROVIDER_OPTIONS` in `media/station.js`. */

export type StackMapProviderOption = {
  name: string;
  toolName: string;
  description: string;
};

export const STACK_MAP_PROVIDER_OPTIONS: Record<string, StackMapProviderOption[]> = {
  appFlow: [
    { name: 'Figma', toolName: 'Figma', description: 'Map flows, screens, and onboarding states' },
    { name: 'Storybook', toolName: 'Storybook', description: 'Component states and UI variants' },
    { name: 'Product Spec', toolName: 'product-spec', description: 'PRD, acceptance criteria, and success goals' },
    { name: 'Route Map', toolName: 'route-map', description: 'Routes, navigation, and protected paths' }
  ],
  frontend: [
    { name: 'React', toolName: 'React', description: 'Component UI and client state' },
    { name: 'Vue', toolName: 'Vue', description: 'Vue or Nuxt product UI' },
    { name: 'Svelte', toolName: 'Svelte', description: 'SvelteKit routes and components' },
    { name: 'Angular', toolName: 'Angular', description: 'Angular components and router' }
  ],
  backend: [
    { name: 'Node.js', toolName: 'Node.js', description: 'API routes and server behavior' },
    { name: 'Python / FastAPI', toolName: 'Python', description: 'Python API services and validation' },
    { name: 'Rails', toolName: 'Rails', description: 'Rails routes, controllers, and models' },
    { name: 'Go', toolName: 'Go', description: 'Go HTTP handlers and services' }
  ],
  security: [
    { name: 'Rate limiting', toolName: 'rate-limit', description: 'Protect API routes from abuse and retry loops' },
    { name: 'Bot protection', toolName: 'bot protection', description: 'Screen bots before expensive flows' },
    { name: 'Secrets hygiene', toolName: 'secrets hygiene', description: 'Keep env examples and secret files safe' }
  ],
  auth: [
    { name: 'Clerk', toolName: 'Clerk', description: 'Managed auth' },
    { name: 'Auth.js', toolName: 'Auth.js', description: 'Framework auth' },
    { name: 'Supabase Auth', toolName: 'Supabase Auth', description: 'Auth with Supabase' },
    { name: 'Auth0', toolName: 'Auth0', description: 'Enterprise identity and social login' },
    { name: 'Better Auth', toolName: 'better-auth', description: 'Type-safe auth in your codebase' }
  ],
  database: [
    { name: 'Supabase', toolName: 'Supabase', description: 'Postgres + auth + storage' },
    { name: 'Neon', toolName: 'Neon', description: 'Serverless Postgres' },
    { name: 'Turso', toolName: 'Turso', description: 'Edge SQLite' },
    { name: 'MongoDB', toolName: 'MongoDB', description: 'Document database' },
    { name: 'PlanetScale', toolName: 'PlanetScale', description: 'Serverless MySQL' }
  ],
  payments: [
    { name: 'Stripe', toolName: 'Stripe', description: 'Global standard' },
    { name: 'Paddle', toolName: 'Paddle', description: 'MoR subscriptions' },
    { name: 'Polar', toolName: 'Polar', description: 'Developer-native MoR billing' },
    { name: 'Lemon Squeezy', toolName: 'Lemon Squeezy', description: 'Digital products and SaaS billing' }
  ],
  deployment: [
    { name: 'Vercel', toolName: 'Vercel', description: 'Preview, env, domains' },
    { name: 'Netlify', toolName: 'Netlify', description: 'Static and serverless deploy' },
    { name: 'Render', toolName: 'Render', description: 'Simple web services and background jobs' },
    { name: 'Railway', toolName: 'Railway', description: 'Fast deploy loops and managed infra' },
    { name: 'Cloudflare', toolName: 'Cloudflare', description: 'Pages, Workers, DNS, and edge stack' },
    { name: 'AWS', toolName: 'AWS', description: 'Cloud infrastructure' }
  ],
  landing: [
    { name: 'Supabase', toolName: 'Supabase', description: 'Waitlist and onboarding data' },
    { name: 'PostHog', toolName: 'PostHog', description: 'Activation tracking' }
  ],
  monitoring: [
    { name: 'Sentry', toolName: 'Sentry', description: 'Errors and replay' },
    { name: 'PostHog', toolName: 'PostHog', description: 'Analytics and events' },
    { name: 'LogRocket', toolName: 'LogRocket', description: 'Session replay' }
  ],
  testing: [
    { name: 'Vitest', toolName: 'Vitest', description: 'Unit coverage' },
    { name: 'Playwright', toolName: 'Playwright', description: 'Browser flows' },
    { name: 'GitHub', toolName: 'GitHub', description: 'Actions CI and PR checks' },
    { name: 'GitLab', toolName: 'GitLab', description: 'Pipelines and merge checks' }
  ],
  errorHandling: [
    { name: 'Sentry', toolName: 'Sentry', description: 'Exception capture' },
    { name: 'PostHog', toolName: 'PostHog', description: 'Error events' }
  ]
};

export function stackMapProviderOptionsForArea(
  areaKey: string
): Array<{ provider: string; label: string; description: string }> {
  const rows = STACK_MAP_PROVIDER_OPTIONS[areaKey] ?? [];
  return rows.slice(0, 6).map((row) => ({
    provider: row.toolName,
    label: row.name,
    description: row.description
  }));
}

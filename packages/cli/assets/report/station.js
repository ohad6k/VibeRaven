const vscode = acquireVsCodeApi();

/** Last prompt text (form submit or quick action). */
let lastPrompt = '';
/** Last normalized station payload from the host. */
let lastPayload = null;
let selectedProductionCategoryKey = '';
let dismissedStudioMapActionCategoryKey = '';
let activeRavenGapCategoryKey = '';
let selectedToolPaths = {};
let studioSectionSteps = {};
let studioGeneratedTasks = {};
let productionConnectionChoices = { version: 1, choices: {} };
let productionConnectionSummary = { byArea: {}, items: [] };
let providerTruth = null;
let launchValidation = null;
let providerRegistry = { version: 1, source: 'bundled', status: 'fresh', providers: [] };
let providerRegistryByKey = {};
let providerRegistryByAlias = {};
let manualConfirmationState = { version: 1, records: [] };
let manualConfirmationsByCheck = {};
let mcpVerifierState = { version: 1, checkedAt: '', records: [] };
let mcpVerifierByProvider = {};
/** Latest selected gap id, used only to keep stack/provider pills visible after provider selection. */
let expandedGapId = '';
/** Latest metering from managed API (map gating + account bar). */
let lastSessionSignedIn = false;
let lastSessionUsage = null;
let lastAccountPlan = 'free';
const DEFAULT_FREE_UNLOCKED_MAP_KEYS = [
  'appFlow',
  'frontend',
  'backend',
  'auth',
  'database',
  'payments'
];
const SCAN_STAGES = [
  { label: 'Reading your files...', width: 12 },
  { label: "Mapping what's built...", width: 32 },
  { label: 'Checking auth & security...', width: 52 },
  { label: 'Finding missing connections...', width: 74 },
  { label: 'Calculating production readiness...', width: 92 }
];
let scanStageTimers = [];

function readStudioStep(categoryKey) {
  return studioSectionSteps[categoryKey] || 'choose';
}

function writeStudioStep(categoryKey, step) {
  if (step === 'choose') {
    studioSectionSteps[categoryKey] = step;
    return;
  }
  delete studioSectionSteps[categoryKey];
}

function stripHtml(str) {
  if (typeof str !== 'string') {
    return '';
  }
  return str
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** SVG icon paths per gap category */
const GAP_ICONS = {
  'SECURITY & AUTH':    '<path d="M12 2L4 6v6c0 5.25 3.75 10.15 8 11.5C16.25 22.15 20 17.25 20 12V6L12 2z"/>',
  'DATABASE & DATA':    '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v4c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 9v4c0 1.66 4.03 3 9 3s9-1.34 9-3V9"/><path d="M3 13v4c0 1.66 4.03 3 9 3s9-1.34 9-3v-4"/>',
  'ERROR HANDLING':     '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  'DEPLOYMENT':         '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  'PERFORMANCE':        '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'MISSING FEATURES':   '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
  'EDGE CASES & RISKS': '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  'LANDING & MARKETING':'<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
};

/**
 * Extension production map categories (12 lanes).
 * Keys and billing unlock semantics: `shared/planLimits.ts` (PRODUCTION_MAP_CATEGORY_KEYS_ALL,
 * FREE_TRIAL_UNLOCKED_MAP_CATEGORY_KEYS). Web ↔ extension lane alignment: `shared/productionMapLanes.ts`.
 * Do not rename keys here without updating planLimits and productionMapLanes — prefer the mapping layer.
 */
const PRODUCTION_MAP_CATEGORIES = [
  { key: 'appFlow', label: 'App Flow / UX', area: '', choiceKind: 'control', choiceLabel: 'Choose flow focus', providerLabel: 'Figma', scoreKey: 'landing', match: /\b(app flow|ux|user flow|onboarding|journey|empty state|activation)\b/i },
  { key: 'frontend', label: 'Frontend', area: '', choiceKind: 'control', choiceLabel: 'Choose frontend focus', providerLabel: 'React', scoreKey: 'landing', match: /\b(frontend|react|ui|component|layout|state|loading)\b/i },
  { key: 'backend', label: 'Backend / API', area: '', choiceKind: 'control', choiceLabel: 'Choose backend focus', providerLabel: 'Node.js', scoreKey: 'deployment', match: /\b(backend|api|server|route|handler|endpoint|webhook)\b/i },
  { key: 'auth', label: 'Auth', area: 'auth', choiceKind: 'stack', choiceLabel: 'Choose auth stack', scoreKey: 'auth', match: /\b(auth|login|logout|session|jwt|oauth|clerk|nextauth|auth\.js|supabase auth|protected route)\b/i },
  { key: 'database', label: 'Database', area: 'database', choiceKind: 'stack', choiceLabel: 'Choose database stack', scoreKey: 'database', match: /\b(database|data|postgres|mysql|mongo|schema|migration|storage|rls)\b/i },
  { key: 'payments', label: 'Payments', area: 'payments', choiceKind: 'stack', choiceLabel: 'Choose payment stack', scoreKey: 'deployment', match: /\b(payment|payments|billing|checkout|stripe|paddle|subscription|webhook|entitlement)\b/i },
  { key: 'deployment', label: 'Deployment', area: 'deployment', choiceKind: 'stack', choiceLabel: 'Choose deployment stack', scoreKey: 'deployment', match: /\b(deploy|deployment|hosting|vercel|netlify|docker|ci|pipeline|environment|env)\b/i },
  { key: 'monitoring', label: 'Monitoring / Analytics', area: 'monitoring', choiceKind: 'stack', choiceLabel: 'Choose monitoring stack', scoreKey: 'monitoring', match: /\b(monitor|monitoring|observability|sentry|posthog|logrocket|analytics|logging|logs|telemetry)\b/i },
  { key: 'security', label: 'Security', area: 'security', choiceKind: 'control', choiceLabel: 'Choose security control', scoreKey: 'security', match: /\b(security|secret|secrets|rate limit|ratelimit|csrf|xss|bot|turnstile|permission|permissions)\b/i },
  { key: 'testing', label: 'Testing', area: '', choiceKind: 'control', choiceLabel: 'Choose coverage target', providerLabel: 'Playwright', scoreKey: 'testing', match: /\b(test|testing|spec|coverage|vitest|jest|playwright|cypress|qa)\b/i },
  { key: 'landing', label: 'Landing / Onboarding', area: '', choiceKind: 'control', choiceLabel: 'Choose launch item', providerLabel: 'PostHog', scoreKey: 'landing', match: /\b(landing|marketing|homepage|hero|cta|pricing|seo|sitemap|robots|onboarding)\b/i },
  { key: 'errorHandling', label: 'Error Handling', area: '', choiceKind: 'control', choiceLabel: 'Choose reliability control', providerLabel: 'Sentry', scoreKey: 'errorHandling', match: /\b(error|exception|boundary|fallback|try\/catch|toast|empty state|recovery)\b/i }
];

const MULTI_SELECT_CATEGORY_KEYS = new Set([
  'appFlow',
  'security',
  'testing',
  'landing',
  'errorHandling',
  'monitoring'
]);

const STACK_MAP_PROVIDER_OPTIONS = {
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
    { name: 'PlanetScale', toolName: 'PlanetScale', description: 'Serverless MySQL' },
    { name: 'Firebase', toolName: 'Firebase', description: 'Firestore, auth, and hosting in one Google stack' }
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

const MCP_CURSOR_DOCS = 'https://docs.cursor.com/context/model-context-protocol';

const PRODUCTION_CHOICE_CATEGORY_AREAS = {
  database: 'database',
  auth: 'auth',
  payments: 'payments',
  deployment: 'deployment',
  monitoring: 'monitoring',
  security: 'security'
};

const PRODUCTION_CHOICE_PROVIDER_ALIASES = {
  supabase: 'supabase',
  supabaseauth: 'supabase',
  firebase: 'firebase',
  firestore: 'firebase',
  neon: 'neon',
  planetscale: 'planetscale',
  mongodb: 'mongodb',
  mongodbatlas: 'mongodb',
  turso: 'turso',
  clerk: 'clerk',
  authjs: 'authjs',
  auth: 'authjs',
  nextauth: 'authjs',
  auth0: 'auth0',
  betterauth: 'better-auth',
  'better-auth': 'better-auth',
  stripe: 'stripe',
  paddle: 'paddle',
  polar: 'polar',
  lemonsqueezy: 'lemon-squeezy',
  'lemon squeezy': 'lemon-squeezy',
  'lemon-squeezy': 'lemon-squeezy',
  github: 'github',
  githubactions: 'github',
  gitlab: 'gitlab',
  gitlabci: 'gitlab',
  vercel: 'vercel',
  netlify: 'netlify',
  render: 'render',
  rendercom: 'render',
  railway: 'railway',
  railwayapp: 'railway',
  cloudflare: 'cloudflare',
  cloudflarepages: 'cloudflare',
  workers: 'cloudflare',
  aws: 'aws',
  sentry: 'sentry',
  posthog: 'posthog',
  playwright: 'playwright',
  logrocket: 'logrocket',
  figma: 'figma',
  storybook: 'storybook',
  productspec: 'product-spec',
  prd: 'product-spec',
  routemap: 'route-map',
  routes: 'route-map',
  react: 'react',
  reactjs: 'react',
  vue: 'vue',
  vuejs: 'vue',
  svelte: 'svelte',
  sveltekit: 'svelte',
  angular: 'angular',
  node: 'nodejs',
  nodejs: 'nodejs',
  'node.js': 'nodejs',
  python: 'python',
  pythonfastapi: 'python',
  fastapi: 'python',
  rails: 'rails',
  rubyonrails: 'rails',
  go: 'go',
  golang: 'go',
  testinglibrary: 'testing-library',
  testing: 'testing-library',
  vitest: 'vitest',
  upstash: 'rate-limit',
  upstashratelimit: 'rate-limit',
  ratelimit: 'rate-limit',
  ratelimiting: 'rate-limit',
  expressratelimit: 'rate-limit',
  botprotection: 'bot-protection',
  cloudflareturnstile: 'bot-protection',
  turnstile: 'bot-protection',
  secretshygiene: 'secrets-hygiene',
  envhygiene: 'secrets-hygiene'
};

const PRODUCTION_CHOICE_PROVIDERS = [
  'supabase',
  'clerk',
  'authjs',
  'auth0',
  'better-auth',
  'firebase',
  'neon',
  'planetscale',
  'mongodb',
  'turso',
  'stripe',
  'paddle',
  'polar',
  'lemon-squeezy',
  'github',
  'gitlab',
  'vercel',
  'netlify',
  'render',
  'railway',
  'cloudflare',
  'aws',
  'sentry',
  'posthog',
  'playwright',
  'logrocket',
  'rate-limit',
  'bot-protection',
  'secrets-hygiene',
  'figma',
  'storybook',
  'product-spec',
  'route-map',
  'react',
  'vue',
  'svelte',
  'angular',
  'nodejs',
  'python',
  'rails',
  'go',
  'testing-library',
  'vitest'
];

const PRODUCTION_CHOICE_PROVIDER_LABELS = {
  supabase: 'Supabase',
  clerk: 'Clerk',
  authjs: 'Auth.js',
  auth0: 'Auth0',
  'better-auth': 'Better Auth',
  firebase: 'Firebase',
  neon: 'Neon',
  planetscale: 'PlanetScale',
  mongodb: 'MongoDB Atlas',
  turso: 'Turso',
  stripe: 'Stripe',
  paddle: 'Paddle',
  polar: 'Polar',
  'lemon-squeezy': 'Lemon Squeezy',
  github: 'GitHub',
  gitlab: 'GitLab',
  vercel: 'Vercel',
  netlify: 'Netlify',
  render: 'Render',
  railway: 'Railway',
  cloudflare: 'Cloudflare',
  aws: 'AWS',
  sentry: 'Sentry',
  posthog: 'PostHog',
  playwright: 'Playwright',
  logrocket: 'LogRocket',
  'rate-limit': 'Rate limit',
  'bot-protection': 'Bot protection',
  'secrets-hygiene': 'Secrets',
  figma: 'Figma',
  storybook: 'Storybook',
  'product-spec': 'Product Spec',
  'route-map': 'Route Map',
  react: 'React',
  vue: 'Vue',
  svelte: 'Svelte',
  angular: 'Angular',
  nodejs: 'Node.js',
  python: 'Python / FastAPI',
  rails: 'Rails',
  go: 'Go',
  'testing-library': 'Testing Library',
  vitest: 'Vitest'
};

const PRODUCTION_CHOICE_PROVIDER_ICONS = {
  supabase: 'S',
  clerk: 'C',
  authjs: 'A',
  auth0: '0',
  'better-auth': 'B',
  firebase: 'F',
  neon: 'N',
  planetscale: 'P',
  mongodb: 'M',
  turso: 'T',
  stripe: '$',
  paddle: 'P',
  polar: 'P',
  'lemon-squeezy': 'LS',
  github: 'GH',
  gitlab: 'GL',
  vercel: 'V',
  netlify: 'N',
  render: 'R',
  railway: 'Ry',
  cloudflare: 'CF',
  aws: 'AWS',
  sentry: 'S',
  posthog: 'P',
  playwright: 'PW',
  logrocket: 'L',
  'rate-limit': 'RL',
  'bot-protection': 'BP',
  'secrets-hygiene': 'ENV',
  figma: 'F',
  storybook: 'SB',
  'product-spec': 'PRD',
  'route-map': 'RM',
  react: 'R',
  vue: 'V',
  svelte: 'S',
  angular: 'A',
  nodejs: 'N',
  python: 'PY',
  rails: 'RB',
  go: 'GO',
  'testing-library': 'T',
  vitest: 'V'
};

/** CDN marks — clearer than tiny inline SVGs in map tiles (kept in sync with packages/cli providerLogos.ts). */
const PROVIDER_INLINE_ONLY_LOGO_KEYS = new Set([
  'authjs',
  'cloudflare',
  'firebase',
  'paddle',
  'playwright',
  'polar',
  'vitest'
]);

const PROVIDER_BRAND_LOGO_KEYS = new Set([
  'auth0',
  'authjs',
  'aws',
  'better-auth',
  'clerk',
  'cloudflare',
  'firebase',
  'gitlab',
  'logrocket',
  'paddle',
  'playwright',
  'polar',
  'posthog',
  'render',
  'stripe',
  'vitest'
]);

const PROVIDER_ICON_URLS = {
  supabase: 'https://cdn.simpleicons.org/supabase/3ECF8E',
  clerk: 'https://cdn.simpleicons.org/clerk/6C47FF',
  auth0: 'https://cdn.simpleicons.org/auth0/EB5424',
  firebase: 'https://cdn.simpleicons.org/firebase/FFCA28',
  neon: 'https://cdn.simpleicons.org/neon/00E599',
  planetscale: 'https://cdn.simpleicons.org/planetscale/000000',
  mongodb: 'https://cdn.simpleicons.org/mongodb/47A248',
  turso: 'https://cdn.simpleicons.org/turso/4FF8D2',
  'lemon-squeezy': 'https://cdn.simpleicons.org/lemonsqueezy/FFC233',
  stripe: 'https://cdn.simpleicons.org/stripe/635BFF',
  github: 'https://cdn.simpleicons.org/github/181717',
  gitlab: 'https://cdn.simpleicons.org/gitlab/FC6D26',
  vercel: 'https://cdn.simpleicons.org/vercel/000000',
  netlify: 'https://cdn.simpleicons.org/netlify/00C7B7',
  render: 'https://cdn.simpleicons.org/render/46E3B7',
  railway: 'https://cdn.simpleicons.org/railway/0B0D0E',
  cloudflare: 'https://cdn.simpleicons.org/cloudflare/F38020',
  'better-auth': 'https://cdn.simpleicons.org/betterauth/171717',
  sentry: 'https://cdn.simpleicons.org/sentry/362D59',
  posthog: 'https://cdn.simpleicons.org/posthog/F54E00',
  playwright:
    'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/playwright/playwright-original.svg',
  figma: 'https://cdn.simpleicons.org/figma/F24E1E',
  storybook: 'https://cdn.simpleicons.org/storybook/FF4785',
  react: 'https://cdn.simpleicons.org/react/61DAFB',
  vue: 'https://cdn.simpleicons.org/vuedotjs/4FC08D',
  svelte: 'https://cdn.simpleicons.org/svelte/FF3E00',
  angular: 'https://cdn.simpleicons.org/angular/DD0031',
  nodejs: 'https://cdn.simpleicons.org/nodedotjs/5FA04E',
  python: 'https://cdn.simpleicons.org/python/3776AB',
  rails: 'https://cdn.simpleicons.org/rubyonrails/D30001',
  go: 'https://cdn.simpleicons.org/go/00ADD8',
  'testing-library': 'https://cdn.simpleicons.org/testinglibrary/E33332',
  vitest: 'https://cdn.simpleicons.org/vitest/FCC72B'
};

function providerIconText(providerOrToolName) {
  const provider = normalizeProductionChoiceProvider(providerOrToolName);
  if (provider && PRODUCTION_CHOICE_PROVIDER_ICONS[provider]) {
    return PRODUCTION_CHOICE_PROVIDER_ICONS[provider];
  }
  const label = providerDisplayName(providerOrToolName) || String(providerOrToolName || '').trim();
  return label ? label.slice(0, 2).toUpperCase() : '?';
}

function providerLogoKey(providerOrToolName) {
  const token = normalizeProductionChoiceToken(providerOrToolName);
  if (token === 'fastapi' || token === 'pythonfastapi') {
    return 'fastapi';
  }
  return normalizeProductionChoiceProvider(providerOrToolName);
}

function providerLogoSvg(providerOrToolName) {
  const provider = providerLogoKey(providerOrToolName);
  const logos = {
    supabase: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#3fcf8e" d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.014.985 1.259 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.642z"/></svg>',
    clerk: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21.47 20.829-2.881-2.881a.572.572 0 0 0-.7-.084 6.854 6.854 0 0 1-7.081 0 .576.576 0 0 0-.7.084l-2.881 2.881a.576.576 0 0 0-.103.69.57.57 0 0 0 .166.186 12 12 0 0 0 14.113 0 .58.58 0 0 0 .239-.423.576.576 0 0 0-.172-.453Zm.002-17.668-2.88 2.88a.569.569 0 0 1-.701.084A6.857 6.857 0 0 0 8.724 8.08a6.862 6.862 0 0 0-1.222 3.692 6.86 6.86 0 0 0 .978 3.764.573.573 0 0 1-.083.699l-2.881 2.88a.567.567 0 0 1-.864-.063A11.993 11.993 0 0 1 6.771 2.7a11.99 11.99 0 0 1 14.637-.405.566.566 0 0 1 .232.418.57.57 0 0 1-.168.448Zm-7.118 12.261a3.427 3.427 0 1 0 0-6.854 3.427 3.427 0 0 0 0 6.854Z"/></svg>',
    authjs: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#18c6cf" d="M12 1.4 21 4.9v6.7c0 5.1-3.5 8.7-9 11-5.5-2.3-9-5.9-9-11V4.9l9-3.5Z"/><path fill="#8b2ff5" d="M12 1.4 21 4.9v6.7c0 5.1-3.5 8.7-9 11V1.4Z"/><path fill="#fff7df" d="M12 7a5.2 5.2 0 1 0 0 10.4A5.2 5.2 0 0 0 12 7Z"/><path fill="#ff8a00" d="M10.2 9.6a2.2 2.2 0 0 1 2.9 2.9l3.5 3.5h-2.2v1.5h-1.8V16h-1.4l-1.3-1.3a2.2 2.2 0 0 1 .3-5.1Zm.9 1.8a.7.7 0 1 0 0 1.4.7.7 0 0 0 0-1.4Z"/></svg>',
    neon: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#37c38f" d="M63 0.0177909V63.5526L38.4178 42.2501V63.5526H0V0L63 0.0177909ZM7.72251 55.8389H30.6953V25.3238L55.2779 47.0476V7.72922L7.72251 7.71559V55.8389Z"/></svg>',
    planetscale: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M0 12C0 5.373 5.373 0 12 0c4.873 0 9.067 2.904 10.947 7.077l-15.87 15.87a11.981 11.981 0 0 1-1.935-1.099L14.99 12H12l-8.485 8.485A11.962 11.962 0 0 1 0 12Zm12.004 12L24 12.004C23.998 18.628 18.628 23.998 12.004 24Z"/></svg>',
    mongodb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.193 9.555c-1.264-5.58-4.252-7.414-4.573-8.115-.28-.394-.53-.954-.735-1.44-.036.495-.055.685-.523 1.184-.723.566-4.438 3.682-4.74 10.02-.282 5.912 4.27 9.435 4.888 9.884l.07.05A73.49 73.49 0 0 1 11.91 24h.481c.114-1.032.284-2.056.51-3.07.417-.296.604-.463.85-.693a11.342 11.342 0 0 0 3.639-8.464c.01-.814-.103-1.662-.197-2.218Zm-5.336 8.195s0-8.291.275-8.29c.213 0 .49 10.695.49 10.695-.381-.045-.765-1.76-.765-2.405Z"/></svg>',
    turso: '<svg viewBox="0 0 241 240" aria-hidden="true"><path fill="#4ff8d2" d="M220.035 83.61C215.365 55.67 190.875 35 190.875 35V65.78L176.335 69.53L167.225 58.56L162.415 68.02C152.495 65.32 138.835 63.58 120.045 63.58C101.255 63.58 87.5949 65.33 77.6749 68.02L72.8649 58.56L63.7549 69.53L49.2149 65.78V35C49.2149 35 24.7249 55.67 20.0549 83.61L52.1949 94.73C53.2449 114.16 61.9849 166.61 64.4849 171.37C67.1449 176.44 81.2649 190.93 92.3149 196.5C92.3149 196.5 96.3149 192.27 98.7549 188.54C101.855 192.19 117.865 204.99 120.055 204.99C122.245 204.99 138.255 192.2 141.355 188.54C143.795 192.27 147.795 196.5 147.795 196.5C158.845 190.93 172.965 176.44 175.625 171.37C178.125 166.61 186.865 114.16 187.915 94.73L220.055 83.61H220.035ZM173.845 128.35L152.095 130.29L154.005 156.96C154.005 156.96 140.775 167.91 120.045 167.91C99.3149 167.91 86.0849 156.96 86.0849 156.96L87.9949 130.29L66.2449 128.35L62.5249 98.31L98.5749 110.79L95.7749 148.18C102.475 149.88 109.525 151.57 120.055 151.57C130.585 151.57 137.625 149.88 144.325 148.18L141.525 110.79L177.575 98.31L173.855 128.35H173.845Z"/></svg>',
    stripe: '<svg viewBox="0 0 64 64" aria-hidden="true"><text x="32" y="38" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="900" letter-spacing="-1.2">stripe</text></svg>',
    paddle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fddd35" d="M2.363 7.904v.849a3.95 3.95 0 0 1 3.65 2.425c.198.476.3.987.299 1.502h.791c0-1.04.416-2.037 1.157-2.772a3.962 3.962 0 0 1 2.792-1.149V7.91a3.959 3.959 0 0 1-3.65-2.425 3.893 3.893 0 0 1-.299-1.502h-.791c0 1.04-.416 2.037-1.157 2.772a3.96 3.96 0 0 1-2.792 1.149M13.105 2.51H6.312V0h6.793c4.772 0 8.532 3.735 8.532 8.314 0 4.58-3.76 8.314-8.532 8.314H9.156V24H6.312v-9.882h6.793c3.319 0 5.688-2.352 5.688-5.804 0-3.451-2.37-5.804-5.688-5.804"/></svg>',
    vercel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 22 20H2L12 4Z"/></svg>',
    netlify: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.49 19.04h-.23L5.13 17.9v-.23l1.73-1.71h1.2l.15.15v1.2L6.5 19.04ZM5.13 6.31V6.1l1.13-1.13h.23L8.2 6.68v1.2l-.15.15h-1.2L5.13 6.31Zm9.96 9.09h-1.65l-.14-.13v-3.83c0-.68-.27-1.2-1.1-1.23-.42 0-.9 0-1.43.02l-.07.08v4.96l-.14.14H8.9l-.13-.14V8.73l.13-.14h3.7a2.6 2.6 0 0 1 2.61 2.6v4.08l-.13.14Zm-8.37-2.44H.14L0 12.82v-1.64l.14-.14h6.58l.14.14v1.64l-.14.14Zm17.14 0h-6.58l-.14-.14v-1.64l.14-.14h6.58l.14.14v1.64l-.14.14ZM11.05 6.55V1.64l.14-.14h1.65l.14.14v4.9l-.14.14h-1.65l-.14-.13Zm0 15.81v-4.9l.14-.14h1.65l.14.13v4.91l-.14.14h-1.65l-.14-.14Z"/></svg>',
    aws: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576.04.063.056.127.056.183 0 .08-.048.16-.152.24l-.503.335a.383.383 0 0 1-.208.072c-.08 0-.16-.04-.239-.112a2.47 2.47 0 0 1-.287-.375 6.18 6.18 0 0 1-.248-.471c-.622.734-1.405 1.101-2.347 1.101-.67 0-1.205-.191-1.596-.574-.391-.384-.59-.894-.59-1.533 0-.678.239-1.23.726-1.644.487-.415 1.133-.623 1.955-.623.272 0 .551.024.846.064.296.04.6.104.918.176v-.583c0-.607-.127-1.03-.375-1.277-.255-.248-.686-.367-1.3-.367-.28 0-.568.031-.863.103-.295.072-.583.16-.862.272a2.287 2.287 0 0 1-.28.104.488.488 0 0 1-.127.023c-.112 0-.168-.08-.168-.247v-.391c0-.128.016-.224.056-.28a.597.597 0 0 1 .224-.167c.279-.144.614-.264 1.005-.36a4.84 4.84 0 0 1 1.246-.151c.95 0 1.644.216 2.091.647.439.43.662 1.085.662 1.963v2.586zm-3.24 1.214c.263 0 .534-.048.822-.144.287-.096.543-.271.758-.51.128-.152.224-.32.272-.512.047-.191.08-.423.08-.694v-.335a6.66 6.66 0 0 0-.735-.136 6.02 6.02 0 0 0-.75-.048c-.535 0-.926.104-1.19.32-.263.215-.39.518-.39.917 0 .375.095.655.295.846.191.2.47.296.838.296zm6.41.862c-.144 0-.24-.024-.304-.08-.064-.048-.12-.16-.168-.311L7.586 5.55a1.398 1.398 0 0 1-.072-.32c0-.128.064-.2.191-.2h.783c.151 0 .255.025.31.08.065.048.113.16.16.312l1.342 5.284 1.245-5.284c.04-.16.088-.264.151-.312a.549.549 0 0 1 .32-.08h.638c.152 0 .256.025.32.08.063.048.12.16.151.312l1.261 5.348 1.381-5.348c.048-.16.104-.264.16-.312a.52.52 0 0 1 .311-.08h.743c.127 0 .2.065.2.2 0 .04-.009.08-.017.128a1.137 1.137 0 0 1-.056.2l-1.923 6.17c-.048.16-.104.263-.168.311a.51.51 0 0 1-.303.08h-.687c-.151 0-.255-.024-.32-.08-.063-.056-.119-.16-.15-.32l-1.238-5.148-1.23 5.14c-.04.16-.087.264-.15.32-.065.056-.177.08-.32.08zm10.256.215c-.415 0-.83-.048-1.229-.143-.399-.096-.71-.2-.918-.32-.128-.071-.215-.151-.247-.223a.563.563 0 0 1-.048-.224v-.407c0-.167.064-.247.183-.247.048 0 .096.008.144.024.048.016.12.048.2.08.271.12.566.215.878.279.319.064.63.096.95.096.502 0 .894-.088 1.165-.264a.86.86 0 0 0 .415-.758.777.777 0 0 0-.215-.559c-.144-.151-.416-.287-.807-.415l-1.157-.36c-.583-.183-1.014-.454-1.277-.813a1.902 1.902 0 0 1-.4-1.158c0-.335.073-.63.216-.886.144-.255.335-.479.575-.654.24-.184.51-.32.83-.415.32-.096.655-.136 1.006-.136.175 0 .359.008.535.032.183.024.35.056.518.088.16.04.312.08.455.127.144.048.256.096.336.144a.69.69 0 0 1 .24.2.43.43 0 0 1 .071.263v.375c0 .168-.064.256-.184.256a.83.83 0 0 1-.303-.096 3.652 3.652 0 0 0-1.532-.311c-.455 0-.815.071-1.062.223-.248.152-.375.383-.375.71 0 .224.08.416.24.567.159.152.454.304.877.44l1.134.358c.574.184.99.44 1.237.767.247.327.367.702.367 1.117 0 .343-.072.655-.207.926-.144.272-.336.511-.583.703-.248.2-.543.343-.886.447-.36.111-.734.167-1.142.167zM21.698 16.207c-2.626 1.94-6.442 2.969-9.722 2.969-4.598 0-8.74-1.7-11.87-4.526-.247-.223-.024-.527.272-.351 3.384 1.963 7.559 3.153 11.877 3.153 2.914 0 6.114-.607 9.06-1.852.439-.2.814.287.383.607zM22.792 14.961c-.336-.43-2.22-.207-3.074-.103-.255.032-.295-.192-.063-.36 1.5-1.053 3.967-.75 4.254-.399.287.36-.08 2.826-1.485 4.007-.215.184-.423.088-.327-.151.32-.79 1.03-2.57.695-2.994z"/></svg>',
    sentry: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.91 2.505c-.873-1.448-2.972-1.448-3.844 0L6.904 7.92a15.478 15.478 0 0 1 8.53 12.811h-2.221A13.301 13.301 0 0 0 5.784 9.814l-2.926 5.06a7.65 7.65 0 0 1 4.435 5.848H2.194a.365.365 0 0 1-.298-.534l1.413-2.402a5.16 5.16 0 0 0-1.614-.913L.296 19.275a2.182 2.182 0 0 0 .812 2.999 2.24 2.24 0 0 0 1.086.288h6.983a9.322 9.322 0 0 0-3.845-8.318l1.11-1.922a11.47 11.47 0 0 1 4.95 10.24h5.915a17.242 17.242 0 0 0-7.885-15.28l2.244-3.845a.37.37 0 0 1 .504-.13c.255.14 9.75 16.708 9.928 16.9a.365.365 0 0 1-.327.543h-2.287c.029.612.029 1.223 0 1.831h2.297a2.206 2.206 0 0 0 1.922-3.31z"/></svg>',
    posthog: '<svg viewBox="0 0 156 90" aria-hidden="true"><path fill="#f9bd2b" d="M0 68.33c0-2.9 3.505-4.352 5.556-2.302l14.916 14.917c2.05 2.05.598 5.555-2.301 5.555H3.254A3.254 3.254 0 0 1 0 83.246zm0-15.712c0 .863.343 1.69.953 2.301l30.628 30.628c.61.61 1.438.953 2.301.953h16.823c2.9 0 4.351-3.505 2.301-5.555L5.556 33.494C3.506 31.444 0 32.896 0 35.795zm0-32.534c0 .863.343 1.69.953 2.3l63.162 63.163c.61.61 1.439.953 2.302.953h16.822c2.9 0 4.352-3.505 2.302-5.555L5.556.96C3.506-1.09 0 .362 0 3.26zm32.534 0c0 .863.343 1.69.954 2.3l58.56 58.56c2.05 2.05 5.555.599 5.555-2.3V61.82c0-.863-.343-1.691-.953-2.301L38.09.96c-2.05-2.05-5.556-.598-5.556 2.3zM70.624.96c-2.05-2.05-5.555-.598-5.555 2.3v16.824c0 .863.343 1.69.953 2.3L92.047 48.41c2.05 2.05 5.556.598 5.556-2.3V29.285c0-.863-.343-1.69-.953-2.3z"/><path fill="#000000" d="M138.393 68.729 107.76 38.095c-2.05-2.05-5.555-.598-5.555 2.302v42.849a3.254 3.254 0 0 0 3.254 3.254h47.451a3.254 3.254 0 0 0 3.255-3.254v-3.903c0-1.797-1.463-3.232-3.246-3.464a25.14 25.14 0 0 1-14.526-7.15m-20.572 7.36a5.207 5.207 0 0 1-5.205-5.205 5.207 5.207 0 0 1 5.205-5.206 5.21 5.21 0 0 1 5.206 5.206 5.207 5.207 0 0 1-5.206 5.205"/><path fill="#1d4aff" d="m5.28 65.78.276.248 14.916 14.916c1.96 1.961.718 5.254-1.932 5.536l-.37.02H3.255a3.255 3.255 0 0 1-3.232-2.875L0 83.245V68.33c0-2.773 3.207-4.222 5.28-2.549m0-32.533.276.247 26.978 26.98V86.5L.954 54.919a3.26 3.26 0 0 1-.926-1.873L0 52.618V35.796c0-2.774 3.207-4.223 5.28-2.55M0 3.26C0 .488 3.207-.961 5.28.712l.276.248 26.978 26.978v26.028L.954 22.385a3.25 3.25 0 0 1-.926-1.874L0 20.084z"/><path fill="#f54e00" d="m32.534 27.939 31.581 31.58c.51.51.832 1.17.925 1.874l.029.428v24.68L33.488 54.919a3.26 3.26 0 0 1-.925-1.873l-.029-.428zm0 32.533 20.472 20.472c1.961 1.961.718 5.254-1.931 5.536l-.37.02h-18.17zm5.28-59.76.276.248 26.025 26.025c.51.509.832 1.168.925 1.874l.029.427v24.68L33.488 22.385a3.26 3.26 0 0 1-.925-1.874l-.029-.427V3.26c0-2.773 3.208-4.222 5.28-2.549"/></svg>',
    playwright: '<svg viewBox="0 0 400 400" aria-hidden="true"><path fill="#2d4552" d="M136.444 221.556C123.558 225.213 115.104 231.625 109.535 238.032C114.869 233.364 122.014 229.08 131.652 226.348C141.51 223.554 149.92 223.574 156.869 224.915V219.481C150.941 218.939 144.145 219.371 136.444 221.556ZM108.946 175.876L61.0895 188.484C61.0895 188.484 61.9617 189.716 63.5767 191.36L104.153 180.668C104.153 180.668 103.578 188.077 98.5847 194.705C108.03 187.559 108.946 175.876 108.946 175.876ZM149.005 288.347C81.6582 306.486 46.0272 228.438 35.2396 187.928C30.2556 169.229 28.0799 155.067 27.5 145.928C27.4377 144.979 27.4665 144.179 27.5336 143.446C24.04 143.657 22.3674 145.473 22.7077 150.721C23.2876 159.855 25.4633 174.016 30.4473 192.721C41.2301 233.225 76.8659 311.273 144.213 293.134C158.872 289.185 169.885 281.992 178.152 272.81C170.532 279.692 160.995 285.112 149.005 288.347ZM161.661 128.11V132.903H188.077C187.535 131.206 186.989 129.677 186.447 128.11H161.661Z"/><path fill="#2d4552" d="M193.981 167.584C205.861 170.958 212.144 179.287 215.465 186.658L228.711 190.42C228.711 190.42 226.904 164.623 203.57 157.995C181.741 151.793 168.308 170.124 166.674 172.496C173.024 167.972 182.297 164.268 193.981 167.584ZM299.422 186.777C277.573 180.547 264.145 198.916 262.535 201.255C268.89 196.736 278.158 193.031 289.837 196.362C301.698 199.741 307.976 208.06 311.307 215.436L324.572 219.212C324.572 219.212 322.736 193.41 299.422 186.777ZM286.262 254.795L176.072 223.99C176.072 223.99 177.265 230.038 181.842 237.869L274.617 263.805C282.255 259.386 286.262 254.795 286.262 254.795ZM209.867 321.102C122.618 297.71 133.166 186.543 147.284 133.865C153.097 112.156 159.073 96.0203 164.029 85.204C161.072 84.5953 158.623 86.1529 156.203 91.0746C150.941 101.747 144.212 119.124 137.7 143.45C123.586 196.127 113.038 307.29 200.283 330.682C241.406 341.699 273.442 324.955 297.323 298.659C274.655 319.19 245.714 330.701 209.867 321.102Z"/><path fill="#e2574c" d="M161.661 262.296V239.863L99.3324 257.537C99.3324 257.537 103.938 230.777 136.444 221.556C146.302 218.762 154.713 218.781 161.661 220.123V128.11H192.869C189.471 117.61 186.184 109.526 183.423 103.909C178.856 94.612 174.174 100.775 163.545 109.665C156.059 115.919 137.139 129.261 108.668 136.933C80.1966 144.61 57.179 142.574 47.5752 140.911C33.9601 138.562 26.8387 135.572 27.5049 145.928C28.0847 155.062 30.2605 169.224 35.2445 187.928C46.0272 228.433 81.663 306.481 149.01 288.342C166.602 283.602 179.019 274.233 187.626 262.291H161.661V262.296ZM61.0848 188.484L108.946 175.876C108.946 175.876 107.551 194.288 89.6087 199.018C71.6614 203.743 61.0848 188.484 61.0848 188.484Z"/><path fill="#2ead33" d="M341.786 129.174C329.345 131.355 299.498 134.072 262.612 124.185C225.716 114.304 201.236 97.0224 191.537 88.8994C177.788 77.3834 171.74 69.3802 165.788 81.4857C160.526 92.163 153.797 109.54 147.284 133.866C133.171 186.543 122.623 297.706 209.867 321.098C297.093 344.47 343.53 242.92 357.644 190.238C364.157 165.917 367.013 147.5 367.799 135.625C368.695 122.173 359.455 126.078 341.786 129.174ZM166.497 172.756C166.497 172.756 180.246 151.372 203.565 158C226.899 164.628 228.706 190.425 228.706 190.425L166.497 172.756ZM223.42 268.713C182.403 256.698 176.077 223.99 176.077 223.99L286.262 254.796C286.262 254.791 264.021 280.578 223.42 268.713ZM262.377 201.495C262.377 201.495 276.107 180.126 299.422 186.773C322.736 193.411 324.572 219.208 324.572 219.208L262.377 201.495Z"/><path fill="#d65348" d="M139.88 246.04L99.3324 257.532C99.3324 257.532 103.737 232.44 133.607 222.496L110.647 136.33L108.663 136.933C80.1918 144.611 57.1742 142.574 47.5704 140.911C33.9554 138.563 26.834 135.572 27.5001 145.929C28.08 155.063 30.2557 169.224 35.2397 187.929C46.0225 228.433 81.6583 306.481 149.005 288.342L150.989 287.719L139.88 246.04ZM61.0848 188.485L108.946 175.876C108.946 175.876 107.551 194.288 89.6087 199.018C71.6615 203.743 61.0848 188.485 61.0848 188.485Z"/><path fill="#1d8d22" d="M225.27 269.163L223.415 268.712C182.398 256.698 176.072 223.99 176.072 223.99L232.89 239.872L262.971 124.281L262.607 124.185C225.711 114.304 201.232 97.0224 191.532 88.8994C177.783 77.3834 171.735 69.3802 165.783 81.4857C160.526 92.163 153.797 109.54 147.284 133.866C133.171 186.543 122.623 297.706 209.867 321.097L211.655 321.5L225.27 269.163ZM166.497 172.756C166.497 172.756 180.246 151.372 203.565 158C226.899 164.628 228.706 190.425 228.706 190.425L166.497 172.756Z"/></svg>',
    logrocket: '<svg viewBox="0 0 19 28" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M6.066 3.156A10.53 10.53 0 0 1 9.122 0a10.294 10.294 0 0 1 3.016 3.094 15.59 15.59 0 0 1 2.93 9.777c.637.513 1.293 1.006 1.918 1.53a3.46 3.46 0 0 1 1.104 3.189c-.302 1.457-.592 2.918-.911 4.372a1.214 1.214 0 0 1-1.848.61c-1.027-.825-2.027-1.678-3.05-2.504a4.684 4.684 0 0 1-2.891 1.255 4.678 4.678 0 0 1-3.385-1.22c-.735.541-1.419 1.191-2.138 1.772-.315.31-.666.58-1.046.806a1.215 1.215 0 0 1-1.603-.785c-.329-1.422-.672-2.839-.99-4.263a3.453 3.453 0 0 1 1.163-3.321c.559-.45 1.125-.893 1.694-1.331.159-.08.08-.261.087-.401a15.615 15.615 0 0 1 2.9-9.42m1.007 4.402a2.395 2.395 0 0 0 .21 3.173 2.636 2.636 0 0 0 3.603.075 2.398 2.398 0 0 0 .636-2.634 2.55 2.55 0 0 0-2.14-1.59 2.6 2.6 0 0 0-2.31.974" clip-rule="evenodd"/><path fill="currentColor" d="M5.712 23.082a.605.605 0 0 1 .896-.485 5.778 5.778 0 0 0 5.03 0 .61.61 0 0 1 .896.45c.005.89.005 1.78 0 2.67a.602.602 0 0 1-.94.436c-.267-.226-.508-.48-.764-.719-.407.762-.789 1.534-1.199 2.294a.61.61 0 0 1-1.012.006c-.41-.761-.79-1.538-1.206-2.299-.253.24-.494.494-.761.72a.603.603 0 0 1-.94-.442c-.007-.878 0-1.756 0-2.634M9.102 10.259a1.22 1.22 0 0 0 1.248-1.192v-.008a1.221 1.221 0 0 0-1.24-1.2h-.008A1.22 1.22 0 0 0 7.855 9.05v.008a1.22 1.22 0 0 0 1.24 1.2h.007Z"/></svg>',
    figma: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 3h3.5v6H8.5a3 3 0 1 1 0-6Zm3.5 6h3.5a3 3 0 1 0 0-6H12v6Zm0 0h3.5a3 3 0 1 1 0 6H12V9Zm-3.5 0H12v6H8.5a3 3 0 1 1 0-6ZM8.5 15H12v2.5A3.5 3.5 0 1 1 8.5 15Z"/></svg>',
    storybook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.2 3.4 17.9 2l.7 18.1-12.4.7V3.4Zm8.7 3.2.3 2.4 1.7-1.3 1.7 1.1.3-3.4-4 .5v.7Zm-5.2 5.1c0 2 1.6 3.5 4.2 3.5 2.4 0 3.8-1.2 3.8-3 0-1.7-1.1-2.6-3.4-3l-1.2-.2c-.7-.1-1-.4-1-.8 0-.5.5-.8 1.3-.8.9 0 1.5.4 1.8 1.1l2.1-.8c-.5-1.4-1.8-2.2-3.8-2.2-2.3 0-3.8 1.2-3.8 2.9 0 1.6 1.1 2.5 3.3 2.9l1.2.2c.8.1 1.1.4 1.1.9 0 .6-.5.9-1.4.9-1.1 0-1.8-.5-2.1-1.3l-2.1.7Z"/></svg>',
    'product-spec': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.2h9.2L19 7v13.8H6V3.2Zm8.2 1.9v3h3l-3-3ZM8.4 10h7.2v1.7H8.4V10Zm0 3.2h7.2v1.7H8.4v-1.7Zm0 3.2h4.9v1.7H8.4v-1.7Z"/></svg>',
    'route-map': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 4.2a3 3 0 0 1 3 3c0 2-3 5.1-3 5.1s-3-3.1-3-5.1a3 3 0 0 1 3-3Zm0 1.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Zm11 5.8a3 3 0 0 1 3 3c0 2-3 5.1-3 5.1s-3-3.1-3-5.1a3 3 0 0 1 3-3Zm0 1.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4ZM9.5 7h2.1c2.8 0 4.9 2 4.9 4.8h-2c0-1.7-1.2-2.8-2.9-2.8H9.5V7Zm4.9 10h-2.1c-2.8 0-4.9-2-4.9-4.8h2c0 1.7 1.2 2.8 2.9 2.8h2.1v2Z"/></svg>',
    react: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.2"/><ellipse cx="12" cy="12" rx="9" ry="3.6" fill="none" stroke="currentColor" stroke-width="1.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" fill="none" stroke="currentColor" stroke-width="1.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" fill="none" stroke="currentColor" stroke-width="1.6" transform="rotate(120 12 12)"/></svg>',
    vue: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#42b883" d="M24 1.61H14.06L12 5.16 9.94 1.61H0l12 20.78L24 1.61Z"/><path fill="#35495e" d="M12 14.08 5.16 2.23h4.43L12 6.41l2.41-4.18h4.43L12 14.08Z"/></svg>',
    svelte: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#ff3e00" d="M10.354 21.125a4.44 4.44 0 0 1-4.765-1.767 4.109 4.109 0 0 1-.703-3.107 3.898 3.898 0 0 1 .134-.522l.105-.321.287.21a7.21 7.21 0 0 0 2.187 1.099l.208.063-.02.208a1.173 1.173 0 0 0 .21.766 1.297 1.297 0 0 0 1.39.514 1.22 1.22 0 0 0 .54-.31l3.927-3.986a.927.927 0 0 0 .203-.42.908.908 0 0 0-.154-.7 1.01 1.01 0 0 0-1.08-.4.946.946 0 0 0-.42.242l-1.5 1.522a4.15 4.15 0 0 1-1.831 1.045 4.453 4.453 0 0 1-4.767-1.767 4.108 4.108 0 0 1-.702-3.107 3.855 3.855 0 0 1 1.066-2.018l3.927-3.986A4.205 4.205 0 0 1 10.65 3.34a4.442 4.442 0 0 1 4.766 1.767 4.109 4.109 0 0 1 .702 3.108 3.943 3.943 0 0 1-.133.521l-.106.321-.286-.21a7.206 7.206 0 0 0-2.188-1.098l-.208-.063.02-.208a1.18 1.18 0 0 0-.21-.767 1.297 1.297 0 0 0-1.39-.514 1.229 1.229 0 0 0-.54.31L7.15 10.493a.929.929 0 0 0-.203.42.909.909 0 0 0 .154.7 1.01 1.01 0 0 0 1.08.4.943.943 0 0 0 .42-.242l1.5-1.522a4.144 4.144 0 0 1 1.831-1.045 4.443 4.443 0 0 1 4.766 1.767 4.109 4.109 0 0 1 .702 3.107 3.857 3.857 0 0 1-1.066 2.018l-3.927 3.986a4.193 4.193 0 0 1-2.053 1.043Z"/></svg>',
    angular: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#dd0031" d="M12 2 3.5 5.1l1.3 11.2L12 22l7.2-5.7 1.3-11.2L12 2Z"/><path fill="#c3002f" d="M12 2v20l7.2-5.7 1.3-11.2L12 2Z"/><path fill="#fff" d="M12 5.6 6.7 17.6h2l1.1-2.7h4.4l1.1 2.7h2L12 5.6Zm0 3.8 1.5 3.7h-3L12 9.4Z"/></svg>',
    nodejs: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#5fa04e" d="M12 2.15 20.7 7.1v9.8L12 21.85 3.3 16.9V7.1L12 2.15Z"/><path fill="#ffffff" d="M8.1 9.15h2.15v4.55c0 1.35-.75 2.15-2.2 2.15-.78 0-1.37-.18-1.85-.48l.57-1.67c.28.17.6.28.95.28.27 0 .38-.15.38-.48V9.15Zm4.05 4.05c.42.5 1.02.82 1.72.82.5 0 .82-.18.82-.52 0-.38-.32-.48-1.08-.7l-.57-.17c-1.15-.35-1.88-.92-1.88-1.95 0-1.13.92-1.72 2.28-1.72 1.02 0 1.82.32 2.4.98l-1.1 1.28c-.35-.35-.78-.55-1.25-.55-.4 0-.65.15-.65.45 0 .32.28.43.93.63l.57.17c1.32.4 2.05.93 2.05 2.05 0 1.25-1.05 1.88-2.52 1.88-1.32 0-2.35-.5-2.95-1.28l1.23-1.37Z"/></svg>',
    fastapi: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fffdf7" d="M12 .0387C5.3729.0384.0003 5.3931 0 11.9988c-.001 6.6066 5.372 11.9628 12 11.9625 6.628.0003 12.001-5.3559 12-11.9625-.0003-6.6057-5.3729-11.9604-12-11.96m-.829 5.4153h7.55l-7.5805 5.3284h5.1828L5.279 18.5436q2.9466-6.5444 5.892-13.0896"/></svg>',
    python: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11.8 3c2.7 0 4.2.8 4.2 2.5V9H9.6A2.6 2.6 0 0 0 7 11.6V13H4.5C3.5 13 3 12.2 3 11c0-3.2 1.9-4.9 5.6-4.9h3.8V5H8.8V3.6A10 10 0 0 1 11.8 3Zm-1.4 1.5a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6ZM12.2 21c-2.7 0-4.2-.8-4.2-2.5V15h6.4a2.6 2.6 0 0 0 2.6-2.6V11h2.5c1 0 1.5.8 1.5 2 0 3.2-1.9 4.9-5.6 4.9h-3.8V19h3.6v1.4a10 10 0 0 1-3 .6Zm1.4-3.1a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6Z"/></svg>',
    rails: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.7C5.8 9.5 11.7 5.2 21 4.8v3.1C13.5 8.3 8.7 11.6 6 18.5L3 17.7Zm4.6.7c2.1-5 5.9-7.5 11.4-7.9v2.4c-4.4.4-7.4 2.5-9 6.2l-2.4-.7Zm4.7.7c1.3-2.4 3.4-3.7 6.7-4.1v2.2c-2.2.4-3.6 1.3-4.5 2.6l-2.2-.7Z"/></svg>',
    go: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8.2h7.4v1.5H3V8.2Zm-1 3h7.4v1.5H2v-1.5Zm2 3h5.4v1.5H4v-1.5Zm10.5-6.1c3.1 0 5.5 2 5.5 4.6s-2.4 4.6-5.5 4.6-5.5-2-5.5-4.6 2.4-4.6 5.5-4.6Zm0 2.1c-1.7 0-3 1.1-3 2.5s1.3 2.5 3 2.5 3-1.1 3-2.5-1.3-2.5-3-2.5Zm5.1-2h2.4l-1.2 9h-2.4l1.2-9Z"/></svg>',
    'testing-library': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v4.2l-3.4 4.5 5.4 7.9c.5.8 0 1.9-1 1.9H6c-1 0-1.6-1.1-1-1.9l5.4-7.9L7 7.2V3Zm3 3.5 2 2.7 2-2.7H10Zm1.9 8.4-2.6 3.8h5.4l-2.8-3.8Z"/></svg>',
    vitest: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.74024 1.05293a.49504.49504 0 0 0-.1569.02512.49338.49338 0 0 0-.25056.1876L7.59513 9.56159a.4895.4895 0 0 0-.08373.22327.48846.48846 0 0 0 .03163.23629.4893.4893 0 0 0 .13985.19319.4927.4927 0 0 0 .2149.10481l3.70685.78609-.22947 4.58007a.48834.48834 0 0 0 .08466.30017.49205.49205 0 0 0 .24931.18854c.10157.03398.21174.03444.3135.00064a.49387.49387 0 0 0 .25056-.18761l5.73735-8.29594a.4884.4884 0 0 0 .08404-.22327c.009-.08015-.0016-.16137-.03163-.23629a.48835.48835 0 0 0-.13985-.19319.49318.49318 0 0 0-.2149-.1048l-3.70686-.7861.22947-4.58008a.48802.48802 0 0 0-.08466-.30017.4913.4913 0 0 0-.24931-.18853.49439.49439 0 0 0-.1566-.02574zM1.15697 9.78795c-.30647.0012-.60009.12378-.81679.34048a1.16107 1.16107 0 0 0-.34017.81648 1.162 1.162 0 0 0 .33366.81957l10.84241 10.8421a1.15762 1.15762 0 0 0 .37677.25211 1.1583 1.1583 0 0 0 .44467.08838c.00084 0 .0016-.00031.0025-.00031.00073 0 .0014.00031.0022.00031a1.15827 1.15827 0 0 0 .44467-.08838 1.15731 1.15731 0 0 0 .37677-.2521l10.84236-10.8421a1.16272 1.16272 0 0 0 .33397-.81958c-.0013-.30647-.12376-.59976-.34048-.81648a1.1616 1.1616 0 0 0-.81679-.34048 1.16114 1.16114 0 0 0-.81926.33366l-5.4012 5.4009c-.0078.0074-.01718.01255-.02482.02015L12 20.14011l-4.59776-4.59745c-.0074-.0074-.01659-.01238-.02419-.01954l-5.4015-5.40151a1.162 1.162 0 0 0-.81958-.33366Z"/></svg>',
    'rate-limit': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9h-3a6 6 0 1 1-1.8-4.3L13 11h8V3l-2.7 2.7A9 9 0 0 0 12 3Z"/></svg>',
    'bot-protection': '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#f38020" d="M12 2.4 20 5.5v6.2c0 4.75-3.12 8.1-8 10.1-4.88-2-8-5.35-8-10.1V5.5l8-3.1Z"/><path fill="#fff7df" d="M12 5.9 16.9 8v3.72c0 2.64-1.8 4.64-4.9 6.05-3.1-1.41-4.9-3.41-4.9-6.05V8L12 5.9Z"/><path fill="#f38020" d="M12 8.2a3.15 3.15 0 0 1 3.15 3.15A3.15 3.15 0 0 1 12 14.5a3.15 3.15 0 0 1-3.15-3.15A3.15 3.15 0 0 1 12 8.2Zm0 1.65a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/></svg>',
    'secrets-hygiene': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3h1.5v11h-13V10H7Zm3 0h4V7a2 2 0 0 0-4 0v3Z"/></svg>',
    render: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.263.007c-3.121-.147-5.744 2.109-6.192 5.082-.018.138-.045.272-.067.405-.696 3.703-3.936 6.507-7.827 6.507-1.388 0-2.691-.356-3.825-.979a.2024.2024 0 0 0-.302.178V24H12v-8.999c0-1.656 1.338-3 2.987-3h2.988c3.382 0 6.103-2.817 5.97-6.244-.12-3.084-2.61-5.603-5.682-5.75"/></svg>',
    railway: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M.113 10.27A13.026 13.026 0 000 11.48h18.23c-.064-.125-.15-.237-.235-.347-3.117-4.027-4.793-3.677-7.19-3.78-.8-.034-1.34-.048-4.524-.048-1.704 0-3.555.005-5.358.01-.234.63-.459 1.24-.567 1.737h9.342v1.216H.113v.002zm18.26 2.426H.009c.02.326.05.645.094.961h16.955c.754 0 1.179-.429 1.315-.96zm-17.318 4.28s2.81 6.902 10.93 7.024c4.855 0 9.027-2.883 10.92-7.024H1.056zM11.988 0C7.5 0 3.593 2.466 1.531 6.108l4.75-.005v-.002c3.71 0 3.849.016 4.573.047l.448.016c1.563.052 3.485.22 4.996 1.364.82.621 2.007 1.99 2.712 2.965.654.902.842 1.94.396 2.934-.408.914-1.289 1.458-2.353 1.458H.391s.099.42.249.886h22.748A12.026 12.026 0 0024 12.005C24 5.377 18.621 0 11.988 0z"/></svg>',
    cloudflare: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="7" width="21" height="21" rx="1.4" fill="#111827"/><rect x="4" y="4" width="21" height="21" rx="1.4" fill="#f38020"/><path fill="#fff7df" d="M11.1 17.6h9.2c1.4 0 2.5-1 2.5-2.2 0-1.1-.9-2-2.2-2.2-.6-2-2.4-3.4-4.6-3.4-1.9 0-3.6 1.1-4.3 2.7-.2 0-.4-.1-.7-.1-1.7 0-3.1 1.2-3.4 2.7-1.1.2-1.9 1-1.9 1.9 0 .9.8 1.6 1.8 1.6h3.6Z"/><path fill="#f38020" d="M18.1 13.3c1.2.4 2.1 1.4 2.4 2.6h.2c.6 0 1.1-.4 1.1-.9 0-.5-.5-.9-1.1-1h-.7l-.2-.7c-.4-1.5-1.8-2.5-3.5-2.5-.7 0-1.3.2-1.9.5 1.7.2 3 .9 3.7 2Z"/></svg>',
    firebase: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#ffa000" d="m3.9 18.7 2.4-15.2c.1-.6.9-.8 1.2-.3l2.6 4.9 1.1-2.1c.2-.4.8-.4 1 0l7.9 12.7-8.1 4.5-8.1-4.5Z"/><path fill="#f57c00" d="m12 23.2 8.1-4.5-2.4-14.8c-.1-.6-.9-.8-1.2-.3L12 12.1v11.1Z"/><path fill="#ffca28" d="m3.9 18.7 6.2-10.6 1.9 3.7-8.1 6.9Z"/><path fill="#fff3c4" d="m12 12.1 4.5-8.5c.3-.5 1.1-.3 1.2.3l2.4 14.8-8.1-6.6Z"/></svg>',
    auth0: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.98 7.448L19.62 0H4.347L2.02 7.448c-1.352 4.312.03 9.206 3.815 12.015L12.007 24l6.157-4.552c3.755-2.81 5.182-7.688 3.815-12.015l-6.16 4.58 2.343 7.45-6.157-4.597-6.158 4.58 2.358-7.433-6.188-4.55 7.63-.045L12.008 0l2.356 7.404 7.615.044z"/></svg>',
    'better-auth': '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1.5" y="1.5" width="21" height="21" rx="3" fill="#111827"/><path fill="#fffdf7" d="M5.2 6.2h5.15v4.25H5.2V6.2Zm8.45 0h5.15v4.25h-5.15V6.2Zm-8.45 7.35h5.15v4.25H5.2v-4.25Zm8.45 0h5.15v4.25h-5.15v-4.25Z"/><path fill="#3b82f6" d="M10.35 10.45h3.3v3.1h-3.3v-3.1Z"/></svg>',
    polar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 22C9.79086 22 8 17.5228 8 12C8 6.47715 9.79086 2 12 2C14.2091 2 16 6.47715 16 12C16 17.5228 14.2091 22 12 22Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 21C6 20 5 15.611 5 12.5C5 9.38904 6.5 5.5 10 3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 3C18 4 19 8.38904 19 11.5C19 14.611 17.5 18.5 14 21" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'lemon-squeezy': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7.4916 10.835 2.3748-6.5114a3.1497 3.1497 0 0 0-.065-2.3418C9.0315.183 6.9427-.398 5.2928.265 3.643.929 2.71 2.4348 3.512 4.3046l2.8197 6.5615c.219.509.97.489 1.16-.03m1.6798 1.0969 6.5334-2.7758c2.1699-.9219 2.7218-3.6907 1.022-5.2905l-.068-.063c-1.6669-1.5469-4.4217-1.002-5.3706 1.0359L8.3566 11.135c-.234.503.295 1.0199.8159.7979m.373.87 6.6454-2.5119c2.2078-.8349 4.6206.745 4.5886 3.0398l-.002.09c-.048 2.2358-2.3938 3.7376-4.5536 2.9467l-6.6724-2.4418a.595.595 0 0 1-.006-1.1229m-.386 1.9269 6.4375 2.9767a3.2997 3.2997 0 0 1 1.6658 1.6989c.769 1.7998-.283 3.6396-1.9328 4.3016-1.6499.662-3.4097.235-4.2097-1.6359l-2.8027-6.5694c-.217-.509.328-1.009.8419-.772"/></svg>',
    github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
    gitlab: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#FC6D26" d="m23.6004 9.5927-.0337-.0862L20.3.9814a.851.851 0 0 0-.3362-.405.8748.8748 0 0 0-.9997.0539.8748.8748 0 0 0-.29.4399l-2.2055 6.748H7.5375l-2.2057-6.748a.8573.8573 0 0 0-.29-.4412.8748.8748 0 0 0-.9997-.0537.8585.8585 0 0 0-.3362.4049L.4332 9.5015l-.0325.0862a6.0657 6.0657 0 0 0 2.0119 7.0105l.0113.0087.03.0213 4.976 3.7264 2.462 1.8633 1.4995 1.1321a1.0085 1.0085 0 0 0 1.2197 0l1.4995-1.1321 2.4619-1.8633 5.006-3.7489.0125-.01a6.0682 6.0682 0 0 0 2.0094-7.003z"/></svg>'
  };
  return provider && logos[provider]
    ? logos[provider]
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 7.5v9L12 21 4 16.5v-9L12 3Zm0 3.3-5 2.8v5.8l5 2.8 5-2.8V9.1l-5-2.8Zm0 3.2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"/></svg>';
}

function providerLogoClass(providerOrToolName) {
  const provider = providerLogoKey(providerOrToolName);
  if (!provider) {
    return '';
  }
  return (
    ' provider-logo--' +
    provider +
    (PROVIDER_BRAND_LOGO_KEYS.has(provider) && !PROVIDER_INLINE_ONLY_LOGO_KEYS.has(provider) ? ' provider-logo--brand' : '')
  );
}

function providerLogoMarkup(providerOrToolName) {
  return providerLogoSvg(providerOrToolName) || '';
}

function providerNodeTone(providerOrToolName) {
  const provider = providerLogoKey(providerOrToolName);
  const tones = {
    supabase: ['#3ecf8e', 'rgba(62, 207, 142, 0.34)'],
    clerk: ['#6c47ff', 'rgba(108, 71, 255, 0.34)'],
    authjs: ['#6c47ff', 'rgba(108, 71, 255, 0.3)'],
    auth0: ['#eb5424', 'rgba(235, 84, 36, 0.34)'],
    'better-auth': ['#111827', 'rgba(17, 24, 39, 0.22)'],
    firebase: ['#ffa000', 'rgba(255, 160, 0, 0.34)'],
    neon: ['#00e599', 'rgba(0, 229, 153, 0.34)'],
    planetscale: ['#111827', 'rgba(17, 24, 39, 0.22)'],
    mongodb: ['#47a248', 'rgba(71, 162, 72, 0.34)'],
    turso: ['#4ff8d2', 'rgba(79, 248, 210, 0.3)'],
    stripe: ['#635bff', 'rgba(99, 91, 255, 0.34)'],
    paddle: ['#fddd35', 'rgba(253, 221, 53, 0.34)'],
    polar: ['#1d4aff', 'rgba(29, 74, 255, 0.3)'],
    'lemon-squeezy': ['#ffc233', 'rgba(255, 194, 51, 0.34)'],
    vercel: ['#111827', 'rgba(17, 24, 39, 0.22)'],
    netlify: ['#00c7b7', 'rgba(0, 199, 183, 0.32)'],
    render: ['#46e3b7', 'rgba(70, 227, 183, 0.32)'],
    railway: ['#6f57ff', 'rgba(111, 87, 255, 0.28)'],
    cloudflare: ['#f38020', 'rgba(243, 128, 32, 0.34)'],
    aws: ['#ff9900', 'rgba(255, 153, 0, 0.34)'],
    sentry: ['#a855f7', 'rgba(168, 85, 247, 0.34)'],
    posthog: ['#f54e00', 'rgba(245, 78, 0, 0.34)'],
    logrocket: ['#ff2d55', 'rgba(255, 45, 85, 0.34)'],
    playwright: ['#45ba4b', 'rgba(69, 186, 75, 0.32)'],
    vitest: ['#fcc72b', 'rgba(252, 199, 43, 0.34)'],
    'rate-limit': ['#00e9a3', 'rgba(0, 233, 163, 0.32)'],
    'bot-protection': ['#f38020', 'rgba(243, 128, 32, 0.34)'],
    'secrets-hygiene': ['#ffca5b', 'rgba(255, 202, 91, 0.32)'],
    figma: ['#ff7262', 'rgba(255, 114, 98, 0.38)'],
    storybook: ['#ff4785', 'rgba(255, 71, 133, 0.36)'],
    react: ['#61dafb', 'rgba(97, 218, 251, 0.38)'],
    vue: ['#42b883', 'rgba(66, 184, 131, 0.34)'],
    svelte: ['#ff3e00', 'rgba(255, 62, 0, 0.34)'],
    angular: ['#dd0031', 'rgba(221, 0, 49, 0.34)'],
    nodejs: ['#83cd29', 'rgba(131, 205, 41, 0.34)'],
    python: ['#ffd43b', 'rgba(255, 212, 59, 0.32)'],
    rails: ['#cc0000', 'rgba(204, 0, 0, 0.34)'],
    go: ['#00add8', 'rgba(0, 173, 216, 0.34)'],
    github: ['#111827', 'rgba(17, 24, 39, 0.22)'],
    gitlab: ['#fc6d26', 'rgba(252, 109, 38, 0.34)']
  };
  return tones[provider] || null;
}

function appendProviderLogo(host, providerOrToolName, className) {
  const logo = document.createElement('span');
  logo.className = (className || 'provider-logo') + providerLogoClass(providerOrToolName);
  logo.setAttribute('aria-hidden', 'true');
  const markup = providerLogoMarkup(providerOrToolName);
  if (markup) {
    logo.innerHTML = markup;
  } else {
    logo.textContent = providerIconText(providerOrToolName);
  }
  host.appendChild(logo);
  return logo;
}

function providerBenefitText(option) {
  const provider = normalizeProductionChoiceProvider(option && (option.toolName || option.name));
  const benefits = {
    supabase: 'Best when you want auth, data, and storage in one stack.',
    clerk: 'Fastest managed auth path with clean session primitives.',
    authjs: 'Best when you want framework-owned auth and full control.',
    auth0: 'Enterprise identity with rules, MFA, and social login.',
    'better-auth': 'Type-safe auth you own in your codebase.',
    firebase: 'Good fit when auth, Firestore, and hosting stay in one Google stack.',
    neon: 'Good serverless Postgres fit for Vercel-style apps.',
    planetscale: 'Good fit for branching MySQL workflows.',
    mongodb: 'Good when the app already models document data.',
    turso: 'Good edge SQLite option for lightweight apps.',
    stripe: 'Best supported global payment ecosystem.',
    paddle: 'Handles merchant-of-record subscription operations.',
    polar: 'MoR billing built for developers shipping SaaS.',
    'lemon-squeezy': 'Sell digital products and subscriptions with less setup.',
    github: 'Best for GitHub Actions CI and required PR checks.',
    gitlab: 'Best for GitLab CI pipelines and merge gates.',
    vercel: 'Best fit for preview deploys, envs, and domains.',
    netlify: 'Good fit for static and serverless deploy workflows.',
    render: 'Good fit for simple web services and background jobs.',
    railway: 'Good fit for fast deploy loops and managed infra.',
    cloudflare: 'Good fit for Pages, Workers, DNS, and edge stack.',
    aws: 'Best when the app needs direct cloud infrastructure control.',
    sentry: 'Best first choice for production errors and traces.',
    posthog: 'Best for product analytics and funnel verification.',
    playwright: 'Best for browser-flow verification and UI regression checks.',
    logrocket: 'Best when session replay is the missing evidence.',
    'rate-limit': 'Protects API routes from abuse and retry loops.',
    'bot-protection': 'Adds bot screening before expensive flows.',
    'secrets-hygiene': 'Hardens env handling and secret exposure risk.',
    figma: 'Best for screen flows, handoff, and UX alignment.',
    storybook: 'Best for proving component states before production.',
    'product-spec': 'Best for locking the user promise and acceptance criteria.',
    'route-map': 'Best for checking navigation, redirects, and protected paths.',
    react: 'Best fit for common component UI and app-router projects.',
    vue: 'Good fit for Vue or Nuxt product interfaces.',
    svelte: 'Good fit for SvelteKit route-first apps.',
    angular: 'Good fit for structured enterprise frontend workflows.',
    nodejs: 'Best fit for JavaScript API routes and server behavior.',
    python: 'Good fit for FastAPI-style APIs and typed validation.',
    rails: 'Good fit for full-stack CRUD and convention-heavy APIs.',
    go: 'Good fit for lean, fast HTTP services.'
  };
  return benefits[provider] || (option && option.description ? option.description : 'Useful path for this section.');
}

function scoreStatus(score) {
  if (score >= 70) {
    return { label: 'Good', className: 'good' };
  }
  if (score >= 40) {
    return { label: 'Needs work', className: 'work' };
  }
  return { label: 'Weak', className: 'weak' };
}

function readChecklistScore(checklist, key) {
  const v = isRecord(checklist) ? checklist[key] : undefined;
  return typeof v === 'number' && !Number.isNaN(v) ? Math.max(0, Math.min(100, Math.round(v))) : 50;
}

function stableVisibleScore(value) {
  const n = typeof value === 'number' && !Number.isNaN(value) ? value : 50;
  const clamped = Math.max(0, Math.min(100, Math.round(n)));
  return Math.max(0, Math.min(100, Math.round(clamped / 5) * 5));
}

function scoreKeyForCategory(category) {
  return category && category.scoreKey ? category.scoreKey : category ? category.key : '';
}

/** Always return 8 dimension scores so Level 1 renders even if the host omitted productionChecklist. */
function ensureProductionChecklist(payload) {
  const raw = isRecord(payload) && isRecord(payload.productionChecklist) ? payload.productionChecklist : {};
  return {
    security: readChecklistScore(raw, 'security'),
    database: readChecklistScore(raw, 'database'),
    auth: readChecklistScore(raw, 'auth'),
    errorHandling: readChecklistScore(raw, 'errorHandling'),
    deployment: readChecklistScore(raw, 'deployment'),
    testing: readChecklistScore(raw, 'testing'),
    landing: readChecklistScore(raw, 'landing'),
    monitoring: readChecklistScore(raw, 'monitoring')
  };
}

function findGapExplanation(category, gaps) {
  if (!Array.isArray(gaps)) {
    return '';
  }
  for (let gi = 0; gi < gaps.length; gi++) {
    const gap = gaps[gi];
    if (!isRecord(gap)) {
      continue;
    }
    const haystack = [gap.category, gap.title, gap.detail].filter(Boolean).join(' ');
    if (category.match.test(haystack)) {
      const text = stripHtml(gap.detail || gap.title || '');
      return text.length > 128 ? text.slice(0, 125) + '...' : text;
    }
  }
  return '';
}

function getProductionCategory(key) {
  for (let ci = 0; ci < PRODUCTION_MAP_CATEGORIES.length; ci++) {
    if (PRODUCTION_MAP_CATEGORIES[ci].key === key) {
      return PRODUCTION_MAP_CATEGORIES[ci];
    }
  }
  return null;
}

function normalizeProductionChoiceToken(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');
}

function normalizeProviderToken(value) {
  return normalizeProductionChoiceToken(value);
}

function applyProviderRegistrySnapshot(snapshot) {
  if (!isRecord(snapshot) || !Array.isArray(snapshot.providers)) {
    return;
  }
  providerRegistry = snapshot;
  providerRegistryByKey = {};
  providerRegistryByAlias = {};
  snapshot.providers.forEach(function (entry) {
    if (!isRecord(entry) || !entry.provider) {
      return;
    }
    const provider = readString(entry.provider).trim();
    if (!provider) {
      return;
    }
    providerRegistryByKey[provider] = entry;
    providerRegistryByAlias[normalizeProviderToken(provider)] = entry;
    if (Array.isArray(entry.aliases)) {
      entry.aliases.forEach(function (alias) {
        const aliasToken = normalizeProviderToken(alias);
        if (aliasToken) {
          providerRegistryByAlias[aliasToken] = entry;
        }
      });
    }
  });
}

function registryEntryForProvider(value) {
  const token = normalizeProviderToken(value);
  if (!token) {
    return null;
  }
  return providerRegistryByAlias[token] || null;
}

function normalizeProductionChoiceProvider(toolName) {
  const token = normalizeProductionChoiceToken(toolName);
  const registryEntry = registryEntryForProvider(toolName);
  const rawProvider = registryEntry && registryEntry.provider
    ? registryEntry.provider
    : PRODUCTION_CHOICE_PROVIDER_ALIASES[token] || token;
  const providerToken = normalizeProductionChoiceToken(rawProvider);
  const provider = PRODUCTION_CHOICE_PROVIDER_ALIASES[providerToken] || rawProvider;
  return PRODUCTION_CHOICE_PROVIDERS.indexOf(provider) >= 0 ? provider : '';
}

function providerDisplayName(providerOrToolName) {
  const registryEntry = registryEntryForProvider(providerOrToolName);
  if (registryEntry && registryEntry.label) {
    return stripHtml(registryEntry.label).trim();
  }
  const provider = normalizeProductionChoiceProvider(providerOrToolName);
  if (provider && PRODUCTION_CHOICE_PROVIDER_LABELS[provider]) {
    return PRODUCTION_CHOICE_PROVIDER_LABELS[provider];
  }
  return stripHtml(providerOrToolName || '').trim();
}

function buildProviderChip(summary) {
  const item = isRecord(summary) ? summary : {};
  const label = readString(item.label).trim();
  const provider = readString(item.provider).trim();
  const displayName = provider ? providerDisplayName(provider) : '';
  const chip = document.createElement('span');
  chip.className = 'mc3-provider-chip';
  chip.textContent = displayName || 'Not chosen';
  chip.setAttribute('title', label || chip.textContent);
  return chip;
}

function providerOptionNameForCategory(categoryKey, providerOrToolName) {
  const provider = normalizeProductionChoiceProvider(providerOrToolName);
  if (!provider) {
    return providerDisplayName(providerOrToolName) || stripHtml(providerOrToolName || '').trim();
  }
  const options = providerOptionsForCategory(categoryKey, []);
  for (let i = 0; i < options.length; i++) {
    if (normalizeProductionChoiceProvider(options[i].toolName || options[i].name) === provider) {
      return options[i].name;
    }
  }
  return providerDisplayName(provider) || provider;
}

function readProviderTruthArea(category) {
  const snapshot = providerTruth || null;
  if (!snapshot || !Array.isArray(snapshot.areas) || !isRecord(category)) {
    return null;
  }
  const areaKey = readString(category.area).trim();
  const categoryKey = readString(category.key).trim();
  const mappedArea = PRODUCTION_CHOICE_CATEGORY_AREAS[categoryKey] || categoryKey;
  const candidates = [];
  if (areaKey) {
    candidates.push(areaKey);
  }
  if (categoryKey) {
    candidates.push(categoryKey);
  }
  if (mappedArea) {
    candidates.push(mappedArea);
  }
  for (let i = 0; i < snapshot.areas.length; i++) {
    const area = snapshot.areas[i];
    if (!isRecord(area)) {
      continue;
    }
    const truthArea = readString(area.area).trim();
    if (truthArea && candidates.indexOf(truthArea) >= 0) {
      return area;
    }
  }
  return null;
}

function providerTruthBadgeClass(label) {
  const token = normalizeProductionChoiceToken(label);
  if (token.indexOf('live') >= 0 || token.indexOf('verified') >= 0 || token === 'liveverified') {
    return ' provider-truth-badge--live';
  }
  if (token.indexOf('mcp') >= 0 || token === 'needsmcp') {
    return ' provider-truth-badge--mcp';
  }
  if (token.indexOf('manual') >= 0 || token.indexOf('confirmed') >= 0) {
    return ' provider-truth-badge--manual';
  }
  if (token.indexOf('mismatch') >= 0 || token.indexOf('legacy') >= 0 || token.indexOf('unused') >= 0 || token.indexOf('warn') >= 0 || token.indexOf('conflict') >= 0) {
    return ' provider-truth-badge--warn';
  }
  if (token.indexOf('repo') >= 0 || token.indexOf('detected') >= 0) {
    return ' provider-truth-badge--repo';
  }
  if (token.indexOf('using') >= 0 || token.indexOf('selected') >= 0) {
    return ' provider-truth-badge--using';
  }
  return '';
}

function providerTruthRowHasRole(row, role) {
  return isRecord(row) && readStringArray(row.roles).indexOf(role) >= 0;
}

function providerTruthRowIsLiveVerified(row) {
  if (!isRecord(row)) {
    return false;
  }
  return providerTruthRowHasRole(row, 'live-verified') ||
    isRecord(row.mcpProof) && readString(row.mcpProof.status).trim() === 'live-verified';
}

function safeProviderTruthBadges(row) {
  if (!isRecord(row)) {
    return [];
  }
  const liveVerified = providerTruthRowIsLiveVerified(row);
  const labels = readStringArray(row.statusBadges).filter(function (badge) {
    const token = normalizeProductionChoiceToken(badge);
    return liveVerified || (token !== 'usingnow' && token !== 'mcplive' && token !== 'liveverified');
  });
  if (liveVerified && labels.indexOf('USING NOW') === -1) {
    labels.unshift('USING NOW');
  } else if (!liveVerified && (providerTruthRowHasRole(row, 'runtime-code') || providerTruthRowHasRole(row, 'using-now')) && !labels.some(function (badge) {
    return /runtime/i.test(badge);
  })) {
    labels.unshift('RUNTIME CODE');
  }
  return labels.slice(0, 5);
}

function providerTruthAreaUsingNow(area) {
  if (!isRecord(area)) {
    return null;
  }
  if (isRecord(area.liveVerified) && providerTruthRowIsLiveVerified(area.liveVerified)) {
    return area.liveVerified;
  }
  const rows = Array.isArray(area.rows) ? area.rows.filter(isRecord) : [];
  for (let i = 0; i < rows.length; i++) {
    if (providerTruthRowIsLiveVerified(rows[i])) {
      return rows[i];
    }
  }
  return null;
}

function providerTruthRowMatchesProvider(row, providerOrToolName) {
  if (!isRecord(row)) {
    return false;
  }
  const target = normalizeProductionChoiceProvider(providerOrToolName) ||
    normalizeProductionChoiceToken(providerOrToolName);
  if (!target) {
    return false;
  }
  const provider = normalizeProductionChoiceProvider(row.provider) ||
    normalizeProductionChoiceToken(row.provider);
  const providerLabel = normalizeProductionChoiceProvider(row.providerLabel) ||
    normalizeProductionChoiceToken(row.providerLabel);
  return provider === target || providerLabel === target;
}

function providerTruthProviderIsUsingNow(categoryKey, providerOrToolName) {
  const category = getProductionCategory(categoryKey);
  const area = readProviderTruthArea(category || { key: categoryKey });
  const usingNow = providerTruthAreaUsingNow(area);
  return providerTruthRowMatchesProvider(usingNow, providerOrToolName);
}

function renderProviderTruthRow(row) {
  if (!isRecord(row)) {
    return null;
  }
  const providerLabel = readString(row.providerLabel).trim() || readString(row.provider).trim() || 'Provider';
  const item = document.createElement('div');
  item.className = 'provider-truth-row';

  const top = document.createElement('div');
  top.className = 'provider-truth-row__top';
  const title = document.createElement('strong');
  title.textContent = providerLabel;
  top.appendChild(title);

  const score = typeof row.score === 'number' ? Math.round(row.score) : null;
  const confidence = readString(row.confidence).trim();
  const metaParts = [];
  if (confidence) {
    metaParts.push(confidence + ' confidence');
  }
  if (score !== null && Number.isFinite(score)) {
    metaParts.push(score + ' score');
  }
  const meta = document.createElement('span');
  meta.className = 'provider-truth-row__meta';
  meta.textContent = metaParts.length > 0 ? metaParts.join(' / ') : 'Truth pending';
  top.appendChild(meta);
  item.appendChild(top);

  const badgeRow = document.createElement('div');
  badgeRow.className = 'provider-truth-badges';
  const badges = safeProviderTruthBadges(row);
  const labels = badges.length > 0 ? badges : ['NEEDS MCP'];
  labels.slice(0, 5).forEach(function (rawLabel) {
    const label = readString(rawLabel).trim();
    if (!label) {
      return;
    }
    const badge = document.createElement('span');
    badge.className = 'provider-truth-badge' + providerTruthBadgeClass(label);
    badge.textContent = label;
    badgeRow.appendChild(badge);
  });
  if (!badgeRow.childElementCount) {
    const fallback = document.createElement('span');
    fallback.className = 'provider-truth-badge provider-truth-badge--mcp';
    fallback.textContent = 'NEEDS MCP';
    badgeRow.appendChild(fallback);
  }
  item.appendChild(badgeRow);
  return item;
}

const PROVIDER_TRUTH_ACTION_KINDS = new Set([
  'run-mcp-verification',
  'manual-check',
  'provider-mismatch-decision'
]);

function providerTruthActionPayload(area, action) {
  const safeArea = isRecord(area) ? area : {};
  const safeAction = isRecord(action) ? action : {};
  const actionKind = readString(safeAction.kind).trim();
  return {
    type: 'station:providerTruthAction',
    area: readString(safeArea.area).trim(),
    actionKind: PROVIDER_TRUTH_ACTION_KINDS.has(actionKind) ? actionKind : '',
    promptTemplate: readString(safeAction.promptTemplate).trim(),
    label: readString(safeAction.label).trim(),
    reason: readString(safeAction.reason).trim()
  };
}

function renderProviderTruthBlock(category) {
  const area = readProviderTruthArea(category);
  if (!area) {
    return null;
  }
  const rows = Array.isArray(area.rows) ? area.rows.filter(isRecord).slice(0, 4) : [];
  const conflicts = Array.isArray(area.conflicts) ? area.conflicts.filter(isRecord) : [];
  const recommendedAction = isRecord(area.recommendedAction) ? area.recommendedAction : null;
  if (rows.length === 0 && conflicts.length === 0 && !recommendedAction) {
    return null;
  }

  const block = document.createElement('section');
  block.className = 'provider-truth';
  const usingNowRow = providerTruthAreaUsingNow(area);
  const hasLiveVerified = rows.some(providerTruthRowIsLiveVerified);

  const head = document.createElement('div');
  head.className = 'provider-truth__head';
  const title = document.createElement('strong');
  title.textContent = 'Provider truth';
  const status = document.createElement('span');
  status.textContent = conflicts.length > 0 ? 'MISMATCH' : hasLiveVerified ? 'LIVE VERIFIED' : 'NEEDS MCP';
  status.className = 'provider-truth-badge' + providerTruthBadgeClass(status.textContent);
  head.append(title, status);
  block.appendChild(head);

  if (usingNowRow) {
    const providerLabel = readString(usingNowRow.providerLabel).trim() || readString(usingNowRow.provider).trim();
    if (providerLabel) {
      const usingNow = document.createElement('div');
      usingNow.className = 'provider-truth__using-now';
      usingNow.textContent = 'Using now: ' + providerLabel;
      block.appendChild(usingNow);
    }
  }

  rows.forEach(function (row) {
    const rendered = renderProviderTruthRow(row);
    if (rendered) {
      block.appendChild(rendered);
    }
  });

  if (conflicts.length > 0) {
    const conflict = conflicts[0];
    const alert = document.createElement('div');
    alert.className = 'provider-truth-alert';
    const conflictTitle = document.createElement('strong');
    conflictTitle.textContent = readString(conflict.title).trim() || 'MISMATCH';
    const detail = document.createElement('span');
    detail.textContent = readString(conflict.detail).trim() || 'Selected provider conflicts with repo evidence.';
    alert.append(conflictTitle, detail);
    block.appendChild(alert);
  }

  if (recommendedAction) {
    const next = document.createElement('div');
    next.className = 'provider-truth-next-action';
    const nextLabel = document.createElement('strong');
    nextLabel.textContent = readString(recommendedAction.label).trim() || 'Next action';
    const reason = document.createElement('span');
    reason.textContent = readString(recommendedAction.reason).trim() || readString(recommendedAction.label).trim();
    const actionButton = document.createElement('button');
    actionButton.type = 'button';
    actionButton.className = 'studio-action-button studio-action-button--primary';
    actionButton.textContent =
      readString(recommendedAction.ctaLabel).trim() ||
      readString(recommendedAction.label).trim() ||
      'Copy action prompt';
    actionButton.addEventListener('click', function () {
      vscode.postMessage(providerTruthActionPayload(area, recommendedAction));
    });
    next.append(nextLabel, reason, actionButton);
    block.appendChild(next);
  }

  return block;
}

function repoProviderForCategory(categoryKey) {
  const category = getProductionCategory(categoryKey);
  const area = category && category.area ? category.area : PRODUCTION_CHOICE_CATEGORY_AREAS[categoryKey] || categoryKey;
  const summaryByArea = isRecord(productionConnectionSummary) && isRecord(productionConnectionSummary.byArea)
    ? productionConnectionSummary.byArea
    : {};
  const summary = summaryByArea[area] || summaryByArea[categoryKey];
  if (isRecord(summary) && readString(summary.provider).trim() && productionConnectionHasRepoEvidence(summary)) {
    return providerOptionNameForCategory(categoryKey, readString(summary.provider).trim());
  }
  const stackRow = isRecord(productionConnectionSummary) && Array.isArray(productionConnectionSummary.stackRow)
    ? productionConnectionSummary.stackRow
    : [];
  for (let i = 0; i < stackRow.length; i++) {
    const entry = stackRow[i];
    if (
      isRecord(entry) &&
      (readString(entry.area) === area || readString(entry.area) === categoryKey) &&
      readString(entry.provider).trim() &&
      productionConnectionHasRepoEvidence(entry)
    ) {
      return providerOptionNameForCategory(categoryKey, readString(entry.provider).trim());
    }
  }
  return '';
}

function setupProviderForCategory(categoryKey) {
  const selected = selectedToolPaths[categoryKey];
  if (Array.isArray(selected)) {
    const first = selected.find(function (item) {
      return typeof item === 'string' && item.trim();
    });
    if (first) {
      return first.trim();
    }
  }
  if (typeof selected === 'string' && selected.trim()) {
    return selected.trim();
  }
  const category = getProductionCategory(categoryKey);
  const area = category && category.area ? category.area : PRODUCTION_CHOICE_CATEGORY_AREAS[categoryKey] || '';
  const choices = isRecord(productionConnectionChoices) && isRecord(productionConnectionChoices.choices)
    ? productionConnectionChoices.choices
    : {};
  const summaryByArea = isRecord(productionConnectionSummary) && isRecord(productionConnectionSummary.byArea)
    ? productionConnectionSummary.byArea
    : {};
  const choice = choices[area] || choices[categoryKey];
  const summary = summaryByArea[area] || summaryByArea[categoryKey];
  if (isRecord(choice) && readString(choice.provider).trim()) {
    return providerOptionNameForCategory(categoryKey, readString(choice.provider).trim());
  }
  if (isRecord(summary) && readString(summary.provider).trim() && !productionConnectionHasRepoEvidence(summary)) {
    return providerOptionNameForCategory(categoryKey, readString(summary.provider).trim());
  }
  return '';
}

function selectedProviderForCategory(categoryKey) {
  return repoProviderForCategory(categoryKey) || setupProviderForCategory(categoryKey);
}

function isMultiSelectCategory(categoryKey) {
  return MULTI_SELECT_CATEGORY_KEYS.has(categoryKey);
}

function selectedToolListForCategory(categoryKey) {
  const selected = selectedToolPaths[categoryKey];
  if (Array.isArray(selected)) {
    const seen = new Set();
    const list = [];
    selected.forEach(function (item) {
      const clean = typeof item === 'string' ? item.trim() : '';
      const key = normalizeToolKey(clean);
      if (clean && key && !seen.has(key)) {
        seen.add(key);
        list.push(clean);
      }
    });
    return list;
  }
  if (typeof selected === 'string' && selected.trim()) {
    return [selected.trim()];
  }
  return [];
}

function isToolSelectedForCategory(categoryKey, option) {
  const toolName = isRecord(option) ? readString(option.toolName || option.name) : readString(option);
  const key = normalizeToolKey(toolName);
  if (!key) {
    return false;
  }
  if (isMultiSelectCategory(categoryKey)) {
    return selectedToolListForCategory(categoryKey).some(function (item) {
      return normalizeToolKey(item) === key;
    });
  }
  const selectedProvider = setupProviderForCategory(categoryKey) || selectedProviderForCategory(categoryKey);
  return normalizeToolKey(selectedProvider) === key;
}

function selectedProviderLabelForCategory(categoryKey, fallbackProvider) {
  const repoProvider = repoProviderForCategory(categoryKey);
  if (repoProvider) {
    return providerOptionNameForCategory(categoryKey, repoProvider) || providerDisplayName(repoProvider) || repoProvider;
  }
  const selected = selectedToolListForCategory(categoryKey);
  if (selected.length > 1) {
    const first = providerDisplayName(selected[0]) || selected[0];
    return first + ' +' + (selected.length - 1);
  }
  if (selected.length === 1) {
    return providerDisplayName(selected[0]) || selected[0];
  }
  return providerDisplayName(fallbackProvider) || fallbackProvider;
}

function providerOptionsForCategory(categoryKey, _categoryGaps) {
  const seen = new Set();
  const options = [];
  const defaults = Array.isArray(STACK_MAP_PROVIDER_OPTIONS[categoryKey])
    ? STACK_MAP_PROVIDER_OPTIONS[categoryKey]
    : [];

  function addOption(name, toolName, description) {
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanToolName = typeof toolName === 'string' && toolName.trim() ? toolName.trim() : cleanName;
    if (!cleanName || !cleanToolName) return;
    const key = normalizeToolKey(cleanToolName);
    if (!key || seen.has(key)) return;
    seen.add(key);
    options.push({
      name: cleanName,
      toolName: cleanToolName,
      description: description || 'Production path'
    });
  }

  for (let i = 0; i < defaults.length; i++) {
    addOption(defaults[i].name, defaults[i].toolName || defaults[i].name, defaults[i].description);
  }

  return options.slice(0, 6);
}

function providerDocsUrl(providerName) {
  const key = normalizeToolKey(providerName);
  const urls = {
    clerk: 'https://clerk.com/docs',
    'auth.js': 'https://authjs.dev/',
    nextauth: 'https://authjs.dev/',
    supabase: 'https://supabase.com/docs',
    'supabase auth': 'https://supabase.com/docs/guides/auth',
    supabaseauth: 'https://supabase.com/docs/guides/auth',
    neon: 'https://neon.tech/docs',
    turso: 'https://docs.turso.tech/',
    mongodb: 'https://www.mongodb.com/docs/',
    planetscale: 'https://planetscale.com/docs',
    vercel: 'https://vercel.com/docs',
    netlify: 'https://docs.netlify.com/',
    aws: 'https://docs.aws.amazon.com/',
    stripe: 'https://docs.stripe.com/',
    paddle: 'https://developer.paddle.com/',
    sentry: 'https://docs.sentry.io/',
    posthog: 'https://posthog.com/docs',
    logrocket: 'https://docs.logrocket.com/',
    figma: 'https://help.figma.com/',
    storybook: 'https://storybook.js.org/docs',
    productspec: 'https://www.atlassian.com/agile/product-management/requirements',
    routemap: 'https://nextjs.org/docs/app/getting-started/project-structure',
    react: 'https://react.dev/',
    vue: 'https://vuejs.org/guide/introduction.html',
    svelte: 'https://svelte.dev/docs',
    angular: 'https://angular.dev/',
    nodejs: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs',
    python: 'https://fastapi.tiangolo.com/',
    rails: 'https://guides.rubyonrails.org/',
    go: 'https://go.dev/doc/',
    vitest: 'https://vitest.dev/',
    playwright: 'https://playwright.dev/'
  };
  return urls[key] || MCP_CURSOR_DOCS;
}

function buildProviderSelectionPrompt(categoryKey, providerName, gapForPrompt) {
  const category = getProductionCategory(categoryKey);
  const categoryLabel = category ? category.label : categoryKey;
  const gapTitle = isRecord(gapForPrompt) && typeof gapForPrompt.title === 'string'
    ? gapForPrompt.title
    : categoryLabel + ' production setup';
  return [
    'Set up ' + providerName + ' for the ' + categoryLabel + ' production section safely.',
    'Project issue: ' + gapTitle + '.',
    '',
    'Inspect first:',
    '- Review package.json files, env examples, framework routes, provider helpers, server/client boundaries, and existing ' + categoryLabel.toLowerCase() + ' patterns before editing.',
    '- Identify the current framework, folder structure, naming style, validation style, and test/build commands.',
    '- If VibeRaven SIFG leak context is present, treat its leak IDs and allowed files as the source of truth.',
    '',
    'Implement:',
    '- Make the smallest repo-only changes needed to wire the ' + providerName + ' path.',
    '- Add the right package or SDK only if it is missing.',
    '- Document required environment variable names in safe examples or setup docs without reading or exposing real secrets.',
    '- Add server-side integration points, route handlers, webhooks, guards, or helpers only where this repo structure expects them.',
    '',
    'Provider constraints:',
    '- Do not call provider APIs, mutate external projects, or edit VibeRaven dashboard state.',
    '- Keep dashboard/provider setup as explicit manual steps.',
    '- Do not claim live provider configuration is complete from repo changes alone.',
    '- Keep secrets in server-only code and env examples. Use placeholder env names only.',
    '',
    'Verification:',
    '- Run the closest relevant build, test, lint, or typecheck command.',
    '- Confirm repo evidence exists for each implemented item.',
    '- List provider dashboard checks separately as manual or read-only MCP verification.',
    '- Rescan VibeRaven after editing so repo evidence can move to verified.'
  ].join('\n');
}

function buildProviderIcon(providerName, className) {
  const icon = document.createElement('span');
  icon.className = className || 'mc3-provider-icon';
  icon.setAttribute('aria-hidden', 'true');
  const displayName = providerDisplayName(providerName) || stripHtml(providerName || '').trim();
  icon.textContent = displayName ? displayName.slice(0, 1).toUpperCase() : '?';
  return icon;
}

function normalizeProductionChoiceArea(categoryKey, provider) {
  const key = String(categoryKey || '').trim();
  if ((provider === 'stripe' || provider === 'paddle') && key !== 'payments') {
    return 'payments';
  }
  return PRODUCTION_CHOICE_CATEGORY_AREAS[key] || '';
}

function buildProductionConnectionChoiceMessage(categoryKey, toolName) {
  const provider = normalizeProductionChoiceProvider(toolName);
  const area = normalizeProductionChoiceArea(categoryKey, provider);
  if (!area || !provider) {
    return null;
  }
  return { type: 'station:productionConnectionChoose', area, provider };
}

function readProductionConnectionArea(categoryKey, toolName) {
  const provider = normalizeProductionChoiceProvider(toolName || '');
  return normalizeProductionChoiceArea(categoryKey, provider) || PRODUCTION_CHOICE_CATEGORY_AREAS[categoryKey] || '';
}

function readProductionConnectionLabel(categoryKey, toolName) {
  const area = readProductionConnectionArea(categoryKey, toolName);
  if (!area) {
    return '';
  }
  const summary = isRecord(productionConnectionSummary) && isRecord(productionConnectionSummary.byArea)
    ? productionConnectionSummary.byArea[area]
    : null;
  if (isRecord(summary) && typeof summary.label === 'string' && summary.label.trim()) {
    return stripHtml(summary.label);
  }
  const choices = isRecord(productionConnectionChoices) && isRecord(productionConnectionChoices.choices)
    ? productionConnectionChoices.choices
    : {};
  const choice = choices[area];
  if (isRecord(choice) && typeof choice.provider === 'string' && choice.provider.trim()) {
    const providerLabel = providerDisplayName(choice.provider);
    return providerLabel ? providerLabel + ' selected - setup not verified' : '';
  }
  return '';
}

function productionConnectionSummaryForCategory(categoryKey) {
  const category = getProductionCategory(categoryKey);
  const area = category && category.area ? category.area : PRODUCTION_CHOICE_CATEGORY_AREAS[categoryKey] || categoryKey;
  const summaryByArea = isRecord(productionConnectionSummary) && isRecord(productionConnectionSummary.byArea)
    ? productionConnectionSummary.byArea
    : {};
  return summaryByArea[area] || summaryByArea[categoryKey] || null;
}

function productionConnectionSummaryForSelectedProvider(categoryKey, providerOrToolName) {
  const provider = normalizeProductionChoiceProvider(providerOrToolName);
  if (!provider) {
    return null;
  }
  const category = getProductionCategory(categoryKey);
  const area = category && category.area ? category.area : PRODUCTION_CHOICE_CATEGORY_AREAS[categoryKey] || categoryKey;
  const summary = productionConnectionSummaryForCategory(categoryKey);
  if (
    isRecord(summary) &&
    normalizeProductionChoiceProvider(readString(summary.provider)) === provider &&
    productionConnectionHasRepoEvidence(summary)
  ) {
    return summary;
  }
  const stackRow = isRecord(productionConnectionSummary) && Array.isArray(productionConnectionSummary.stackRow)
    ? productionConnectionSummary.stackRow
    : [];
  for (let i = 0; i < stackRow.length; i++) {
    const entry = stackRow[i];
    if (
      isRecord(entry) &&
      (readString(entry.area) === area || readString(entry.area) === categoryKey) &&
      normalizeProductionChoiceProvider(readString(entry.provider)) === provider &&
      productionConnectionHasRepoEvidence(entry)
    ) {
      return entry;
    }
  }
  return null;
}

function productionConnectionHasRepoEvidence(summary) {
  if (!isRecord(summary)) {
    return false;
  }
  const statusWords = Array.isArray(summary.status) ? summary.status.join(' ') : '';
  const signals = Array.isArray(summary.signals) ? summary.signals.join(' ') : '';
  const evidenceText = [
    summary.source,
    summary.label,
    statusWords,
    signals
  ].filter(Boolean).join(' ').toLowerCase();
  const hasRepoEvidence = /\b(repo|detected|found|connected|dependency|package|config|env|file|route|schema|installed)\b/.test(evidenceText) ||
    /\brepo[-\s]?verified\b/.test(evidenceText);
  const onlySelected = /\bselected\b/.test(evidenceText) && !hasRepoEvidence;
  return hasRepoEvidence && !onlySelected;
}

function providerHasAnyRepoEvidence(providerOrToolName) {
  const provider = normalizeProductionChoiceProvider(providerOrToolName);
  if (!provider) {
    return false;
  }
  if (providerHasMissionRepoEvidence(provider)) {
    return true;
  }
  const stackRow = isRecord(productionConnectionSummary) && Array.isArray(productionConnectionSummary.stackRow)
    ? productionConnectionSummary.stackRow
    : [];
  for (let i = 0; i < stackRow.length; i++) {
    const item = stackRow[i];
    if (
      isRecord(item) &&
      normalizeProductionChoiceProvider(readString(item.provider)) === provider &&
      productionConnectionHasRepoEvidence(item)
    ) {
      return true;
    }
  }
  const summaryByArea = isRecord(productionConnectionSummary) && isRecord(productionConnectionSummary.byArea)
    ? productionConnectionSummary.byArea
    : {};
  const areas = Object.keys(summaryByArea);
  for (let i = 0; i < areas.length; i++) {
    const summary = summaryByArea[areas[i]];
    if (
      isRecord(summary) &&
      normalizeProductionChoiceProvider(readString(summary.provider)) === provider &&
      productionConnectionHasRepoEvidence(summary)
    ) {
      return true;
    }
  }
  const verification = normalizeVerificationSummaryPayload(lastPayload && lastPayload.verificationSummary);
  const providerLabel = providerDisplayName(provider).toLowerCase();
  const verificationAreas = Object.keys(verification.byArea);
  for (let ai = 0; ai < verificationAreas.length; ai++) {
    const summary = verification.byArea[verificationAreas[ai]];
    const found = isRecord(summary) && Array.isArray(summary.found) ? summary.found : [];
    for (let fi = 0; fi < found.length; fi++) {
      const label = isRecord(found[fi]) ? readString(found[fi].label).toLowerCase() : '';
      const detail = isRecord(found[fi]) ? readString(found[fi].detail).toLowerCase() : '';
      if (label.indexOf(providerLabel) >= 0 || detail.indexOf(providerLabel) >= 0 || label.indexOf(provider) >= 0 || detail.indexOf(provider) >= 0) {
        return true;
      }
    }
  }
  return false;
}

function providerMissionHasActivationEvidence(categoryKey, providerOrToolName) {
  const category = getProductionCategory(categoryKey) || { key: categoryKey };
  const mission = readSelectedProviderMission(category, providerOrToolName);
  if (!mission || !Array.isArray(mission.checks)) {
    return false;
  }
  return mission.checks.some(function (check) {
    if (!isRecord(check) || readString(check.evidenceClass) !== 'repo-verified' || readString(check.status) !== 'passed') {
      return false;
    }
    const id = readString(check.id);
    return /package|runtime|config|widget|sdk|framework|database|deployment/i.test(id);
  });
}

function providerIsDetectedInProject(categoryKey, providerOrToolName) {
  const summary = productionConnectionSummaryForCategory(categoryKey);
  const provider = normalizeProductionChoiceProvider(providerOrToolName);
  if (!provider) {
    return false;
  }
  if (
    isRecord(summary) &&
    normalizeProductionChoiceProvider(readString(summary.provider)) === provider &&
    productionConnectionHasRepoEvidence(summary)
  ) {
    return true;
  }
  const category = getProductionCategory(categoryKey);
  const area = category && category.area ? category.area : PRODUCTION_CHOICE_CATEGORY_AREAS[categoryKey] || categoryKey;
  const stackRow = isRecord(productionConnectionSummary) && Array.isArray(productionConnectionSummary.stackRow)
    ? productionConnectionSummary.stackRow
    : [];
  for (let i = 0; i < stackRow.length; i++) {
    const entry = stackRow[i];
    if (
      isRecord(entry) &&
      (readString(entry.area) === area || readString(entry.area) === categoryKey) &&
      normalizeProductionChoiceProvider(readString(entry.provider)) === provider &&
      productionConnectionHasRepoEvidence(entry)
    ) {
      return true;
    }
  }
  const verification = normalizeVerificationSummaryPayload(lastPayload && lastPayload.verificationSummary);
  const verificationSummary = verification.byArea[area] || verification.byArea[categoryKey];
  const found = isRecord(verificationSummary) && Array.isArray(verificationSummary.found) ? verificationSummary.found : [];
  const providerLabel = providerDisplayName(provider).toLowerCase();
  for (let i = 0; i < found.length; i++) {
    const label = isRecord(found[i]) ? readString(found[i].label).toLowerCase() : '';
    const detail = isRecord(found[i]) ? readString(found[i].detail).toLowerCase() : '';
    if (label.indexOf(providerLabel) >= 0 || detail.indexOf(providerLabel) >= 0 || label.indexOf(provider) >= 0 || detail.indexOf(provider) >= 0) {
      return true;
    }
  }
  return providerMissionHasActivationEvidence(categoryKey, provider);
}

function evidenceStatusForCategory(category, categoryGaps, selectedProvider) {
  if (!category) {
    return { label: 'Manual', tone: 'manual' };
  }

  const mission = readSelectedProviderMission(category, selectedProvider);
  if (mission) {
    const checks = Array.isArray(mission.checks) ? mission.checks : [];
    const missing = checks.some(function (check) {
      return isRecord(check) && readString(check.evidenceClass) === 'missing-repo-fix';
    });
    const mcp = checks.some(function (check) {
      return isRecord(check) && readString(check.evidenceClass) === 'mcp-verifier';
    });
    const repo = checks.some(function (check) {
      return isRecord(check) && readString(check.evidenceClass) === 'repo-verified';
    });
    if (missing) {
      return { label: 'Fix repo', tone: 'missing' };
    }
    if (mcp) {
      return { label: 'MCP', tone: 'external' };
    }
    if (repo) {
      return { label: 'Repo', tone: 'repo' };
    }
  }

  const gaps = Array.isArray(categoryGaps) ? categoryGaps : [];
  const area = category.area || PRODUCTION_CHOICE_CATEGORY_AREAS[category.key] || category.key;
  const summaryByArea = isRecord(productionConnectionSummary) && isRecord(productionConnectionSummary.byArea)
    ? productionConnectionSummary.byArea
    : {};
  const summary = summaryByArea[area] || summaryByArea[category.key] || {};
  const statusWords = isRecord(summary) && Array.isArray(summary.status) ? summary.status.join(' ') : '';
  const signals = isRecord(summary) && Array.isArray(summary.signals) ? summary.signals.join(' ') : '';
  const text = [
    isRecord(summary) ? summary.source : '',
    isRecord(summary) ? summary.label : '',
    statusWords,
    signals,
    gaps.map(function (gap) {
      if (!isRecord(gap)) {
        return '';
      }
      const tools = Array.isArray(gap.toolSuggestions)
        ? gap.toolSuggestions.map(function (tool) {
          return isRecord(tool) ? readString(tool.name) : '';
        }).join(' ')
        : '';
      return [gap.category, gap.title, gap.detail, tools].filter(Boolean).join(' ');
    }).join(' ')
  ].filter(Boolean).join(' ').toLowerCase();
  const dashboardCategories = ['payments', 'auth', 'deployment', 'monitoring', 'database'];
  const needsDashboard = dashboardCategories.indexOf(category.key) >= 0 || dashboardCategories.indexOf(area) >= 0;

  if (needsDashboard) {
    return { label: 'Live', tone: 'external' };
  }
  if (/\brepo[-\s]?verified\b/.test(text)) {
    return { label: 'Repo', tone: 'repo' };
  }
  if (/\bmcp\b/.test(text)) {
    return { label: 'MCP', tone: 'external' };
  }
  if (/\b(repo|detected|found|package|config|route|file|test|spec)\b/.test(text)) {
    return { label: 'Repo', tone: 'repo' };
  }
  return { label: 'Manual', tone: 'manual' };
}

function renderStudioEvidenceBadge(status) {
  const evidence = isRecord(status) ? status : { label: 'Manual check required', tone: 'manual' };
  const label = readString(evidence.label).trim() || 'Manual check required';
  const tone = readString(evidence.tone).trim() || 'manual';
  const badge = document.createElement('span');
  badge.className = 'studio-evidence-badge studio-evidence-badge--' + tone;
  badge.textContent = label;
  badge.setAttribute('title', 'Local scan evidence only unless an MCP, API, dashboard, or manual check confirms it.');
  return badge;
}

function getDefaultProductionCategoryKey(checklist) {
  let bestKey = PRODUCTION_MAP_CATEGORIES[0].key;
  let bestScore = 101;
  for (let ci = 0; ci < PRODUCTION_MAP_CATEGORIES.length; ci++) {
    const category = PRODUCTION_MAP_CATEGORIES[ci];
    const score = readChecklistScore(checklist, scoreKeyForCategory(category));
    if (score < bestScore) {
      bestScore = score;
      bestKey = category.key;
    }
  }
  return bestKey;
}

function isMapCategoryUnlocked(categoryKey, usage, plan) {
  if (plan === 'pro') {
    return true;
  }
  if (!lastSessionSignedIn && !usage) {
    return true;
  }
  const usagePlan = readString(usage && usage.plan).toLowerCase();
  const keys =
    usagePlan !== 'pro' &&
    usage &&
    Array.isArray(usage.unlockedMapCategoryKeys) &&
    usage.unlockedMapCategoryKeys.length > 0
      ? usage.unlockedMapCategoryKeys
      : DEFAULT_FREE_UNLOCKED_MAP_KEYS;
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] === categoryKey && DEFAULT_FREE_UNLOCKED_MAP_KEYS.indexOf(categoryKey) !== -1) {
      return true;
    }
  }
  return false;
}

function ensureValidSelectedCategoryKey(checklist) {
  if (selectedProductionCategoryKey && !getProductionCategory(selectedProductionCategoryKey)) {
    selectedProductionCategoryKey = '';
    dismissedStudioMapActionCategoryKey = '';
  }
  if (
    selectedProductionCategoryKey &&
    !isMapCategoryUnlocked(selectedProductionCategoryKey, lastSessionUsage, lastAccountPlan)
  ) {
    selectedProductionCategoryKey = '';
    dismissedStudioMapActionCategoryKey = '';
  }
  return selectedProductionCategoryKey;
}

function gapMatchesProductionCategory(gap, category) {
  if (!isRecord(gap) || !category) {
    return false;
  }
  const primary = readString(gap.primaryMapCategory).trim();
  if (primary) {
    return primary === category.key;
  }
  const haystack = [gap.category, gap.title, gap.detail, gap.copyPrompt].filter(Boolean).join(' ');
  return category.match.test(haystack);
}

function filterGapsForCategory(gaps, categoryKey) {
  const category = getProductionCategory(categoryKey);
  if (!Array.isArray(gaps) || !category) {
    return [];
  }
  return gaps.filter(function (gap) {
    return gapMatchesProductionCategory(gap, category);
  });
}

/** Readiness hue: green 80+, amber 40–79, red under 40 (Mission Map + headline bar). */
function scoreBandClass(score) {
  const s = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  if (s >= 80) {
    return 'mc3-band--90';
  }
  if (s >= 40) {
    return 'mc3-band--40';
  }
  return 'mc3-band--0';
}

function stripScoreBandClasses(el) {
  if (!el || !el.classList) {
    return;
  }
  el.classList.remove('mc3-band--0', 'mc3-band--40', 'mc3-band--70', 'mc3-band--90');
}

function applyMainScoreBand(score) {
  const pct = document.getElementById('mc-score-pct');
  const lbl = document.getElementById('mc-score-label');
  const bar = document.getElementById('mc-results-bar');
  const band = scoreBandClass(score);
  if (pct instanceof HTMLElement) {
    stripScoreBandClasses(pct);
  }
  if (lbl instanceof HTMLElement) {
    stripScoreBandClasses(lbl);
    lbl.classList.add(band);
  }
  if (bar instanceof HTMLElement) {
    stripScoreBandClasses(bar);
    bar.classList.add(band);
  }
}

function countCriticalGapsAll(gaps) {
  if (!Array.isArray(gaps)) {
    return 0;
  }
  let n = 0;
  for (let i = 0; i < gaps.length; i++) {
    if (isRecord(gaps[i]) && gaps[i].severity === 'critical') {
      n++;
    }
  }
  return n;
}

function dimensionGapRollup(gaps, categoryKey) {
  const list = filterGapsForCategory(gaps, categoryKey);
  let critical = 0;
  let warning = 0;
  let info = 0;
  for (let i = 0; i < list.length; i++) {
    const g = list[i];
    if (!isRecord(g)) {
      continue;
    }
    if (g.severity === 'critical') {
      critical++;
    } else if (g.severity === 'warning') {
      warning++;
    } else {
      info++;
    }
  }
  return { list, critical, warning, info, total: list.length };
}

function renderPlanPills() {
  const host = document.getElementById('mc-plan-pills');
  if (!(host instanceof HTMLElement)) {
    return;
  }
  host.replaceChildren();
  /* Show the selected stack context after the user opens a map section. */
  const hasMapContext = Boolean(selectedProductionCategoryKey || expandedGapId);
  if (!hasMapContext) {
    host.hidden = true;
    return;
  }
  const stackRow = isRecord(productionConnectionSummary) && Array.isArray(productionConnectionSummary.stackRow)
    ? productionConnectionSummary.stackRow
    : [];
  if (stackRow.length > 0) {
    host.hidden = false;
    const limit = Math.min(stackRow.length, 5);
    for (let i = 0; i < limit; i++) {
      const chip = buildProviderChip(stackRow[i]);
      chip.className = 'mc3-provider-chip mc3-plan-pill';
      host.appendChild(chip);
    }
    return;
  }
  const entries = PRODUCTION_MAP_CATEGORIES.filter(function (c) {
    return Boolean(selectedToolPaths[c.key]);
  });
  if (entries.length === 0) {
    host.hidden = true;
    return;
  }
  host.hidden = false;
  for (let i = 0; i < entries.length; i++) {
    const span = document.createElement('span');
    span.className = 'mc3-plan-pill';
    span.textContent = entries[i].label + ' · ' + selectedToolPaths[entries[i].key];
    host.appendChild(span);
  }
}

function renderRescanRow() {
  const wrap = document.createElement('div');
  wrap.className = 'mc3-rescan-wrap';
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'mc3-rescan mc3-rescan--outline';
  b.setAttribute('data-station-action', 'rescan');
  b.textContent = 'Rescan';
  wrap.appendChild(b);
  return wrap;
}

function buildStackMapCore(score) {
  const core = document.createElement('div');
  core.className = 'mc3-stack-map__core';
  core.setAttribute('aria-hidden', 'true');

  const bird = document.createElement('div');
  bird.className = 'mc3-stack-map__mark';
  bird.textContent = 'VibeRaven';

  const block = document.createElement('div');
  block.className = 'mc3-stack-map__core-block';
  const pct = document.createElement('span');
  pct.className = 'mc3-stack-map__core-score';
  pct.textContent = String(Math.max(0, Math.min(100, Math.round(Number(score) || 0)))) + '%';
  const label = document.createElement('span');
  label.className = 'mc3-stack-map__core-label';
  label.textContent = 'Production core';
  block.append(pct, label);

  core.append(bird, block);
  return core;
}

function buildStackNode(category, checklist, gaps, reduce) {
  const categoryGaps = filterGapsForCategory(gaps, category.key);
  const roll = dimensionGapRollup(gaps, category.key);
  const score = readChecklistScore(checklist, scoreKeyForCategory(category));
  const selectedProvider = selectedProviderForCategory(category.key);
  const mapUnlocked = isMapCategoryUnlocked(category.key, lastSessionUsage, lastAccountPlan);

  const node = document.createElement('button');
  node.type = 'button';
  node.className =
    'mc3-stack-node mc3-stack-node--' + category.key +
    (selectedProductionCategoryKey === category.key ? ' mc3-stack-node--expanded' : '') +
    (roll.critical > 0 ? ' mc3-stack-node--critical' : roll.total > 0 ? ' mc3-stack-node--warning' : '') +
    (!mapUnlocked ? ' mc3-stack-node--locked' : '');
  node.setAttribute('data-station-action', 'mc-select-category');
  node.setAttribute('data-category-key', category.key);
  node.setAttribute('aria-expanded', selectedProductionCategoryKey === category.key ? 'true' : 'false');
  node.setAttribute('aria-label', category.label + ' ' + score + ' percent, ' + roll.total + ' gaps');

  const ring = document.createElement('span');
  ring.className = 'mc3-stack-node__ring ' + scoreBandClass(score) + (reduce ? '' : ' mc3-stack-node__ring--in');
  if (ring.style && typeof ring.style.setProperty === 'function') {
    ring.style.setProperty('--mc3-ring-pct', String(score));
  }
  ring.textContent = score + '%';

  const content = document.createElement('span');
  content.className = 'mc3-stack-node__content';
  const title = document.createElement('span');
  title.className = 'mc3-stack-node__title';
  title.textContent = category.label;
  const meta = document.createElement('span');
  meta.className = 'mc3-stack-node__meta';
  meta.textContent =
    roll.critical > 0
      ? roll.critical + ' critical'
      : roll.total > 0
        ? roll.total + ' gap' + (roll.total === 1 ? '' : 's')
        : 'Ready check';
  content.append(title, meta);

  node.append(ring, content);

  if (selectedProvider) {
    const provider = buildProviderChip({ provider: selectedProvider, label: selectedProvider });
    provider.classList.add('mc3-stack-node__provider');
    node.appendChild(provider);
  }

  if (!mapUnlocked) {
    node.setAttribute('data-locked-map', '1');
    node.setAttribute(
      'title',
      'Pro only - this section is locked on the Free plan. Click to open your account and upgrade.'
    );
    node.setAttribute(
      'aria-label',
      category.label + ' - Pro only. Opens account to upgrade.'
    );
    const lock = document.createElement('span');
    lock.className = 'mc3-stack-node__lock';
    lock.textContent = 'Pro';
    node.appendChild(lock);
  }

  return { node, categoryGaps, selectedProvider };
}

function buildStudioNode(category, checklist, gaps) {
  const roll = dimensionGapRollup(gaps, category.key);
  const selectedProvider = selectedProviderForCategory(category.key) || category.providerLabel || 'Not selected';
  const missionStats = readSelectedMissionStats(category, selectedProvider);
  const missionArea = missionStats ? null : readMissionAreaForCategory(category.key);
  const hasMissionArea = !missionStats && isRecord(missionArea);
  const score = missionStats
    ? missionStats.readinessPercent
    : hasMissionArea && typeof missionArea.readinessPercent === 'number'
      ? Math.max(0, Math.min(100, Math.round(missionArea.readinessPercent)))
      : readChecklistScore(checklist, scoreKeyForCategory(category));
  const missionGapCount = missionStats ? missionStats.missingRepoFixCount : null;
  const missionProviderOpenCount = missionStats ? missionStats.providerOpenCount : 0;
  const hasMissionGapStats = missionGapCount !== null;
  const inProject = providerIsDetectedInProject(category.key, selectedProvider);
  const sifgLeaks = sifgLeaksForCategory(category.key);
  const selectedProviderLabel = selectedProviderLabelForCategory(category.key, selectedProvider);
  const mapUnlocked = isMapCategoryUnlocked(category.key, lastSessionUsage, lastAccountPlan);
  const node = document.createElement('button');
  node.type = 'button';
  node.className =
    'studio-node studio-node--' + category.key +
    (selectedProductionCategoryKey === category.key ? ' studio-node--selected' : '') +
    (hasMissionGapStats ? (missionGapCount > 0 ? ' studio-node--critical' : missionProviderOpenCount > 0 ? ' studio-node--warning' : '') : roll.critical > 0 ? ' studio-node--critical' : roll.total > 0 ? ' studio-node--warning' : '') +
    (inProject ? ' studio-node--in-project' : '') +
    (sifgLeaks.length > 0 ? ' studio-node--sifg-leak' : '') +
    (!mapUnlocked ? ' studio-node--locked' : '');
  const nodeTone = providerNodeTone(selectedProvider);
  if (nodeTone) {
    node.setAttribute('style', '--provider-color: ' + nodeTone[0] + '; --provider-glow: ' + nodeTone[1] + ';');
  }
  node.setAttribute('data-station-action', 'mc-select-category');
  node.setAttribute('data-category-key', category.key);
  const metaText = hasMissionGapStats
    ? missionGapCount > 0
      ? missionGapCount + ' stack fix' + (missionGapCount === 1 ? '' : 'es')
      : missionProviderOpenCount > 0
        ? 'Live check'
        : score + '% health'
    : roll.total > 0 ? roll.total + ' gap' + (roll.total === 1 ? '' : 's') : score + '% health';
  node.setAttribute(
    'aria-label',
    category.label +
      ', ' +
      selectedProviderLabel +
      ', ' +
      metaText +
      (!mapUnlocked ? ', Pro only. Opens account to upgrade' : '')
  );

  const logo = document.createElement('span');
  logo.className = 'studio-node__logo provider-logo' + providerLogoClass(selectedProvider);
  logo.setAttribute('title', providerDisplayName(selectedProvider) || selectedProvider);
  logo.setAttribute('aria-hidden', 'true');
  const markup = providerLogoMarkup(selectedProvider);
  if (markup) {
    logo.innerHTML = markup;
  } else {
    logo.textContent = providerIconText(selectedProvider);
  }
  const title = document.createElement('span');
  title.className = 'studio-node__title';
  title.textContent = category.label;
  const provider = document.createElement('span');
  provider.className = 'studio-node__provider';
  provider.textContent = selectedProviderLabel;
  const meta = document.createElement('span');
  meta.className = 'studio-node__meta';
  meta.textContent = metaText;

  node.append(logo, title, provider, meta);

  if (roll.total > 0 && mapUnlocked) {
    const ravenBadge = document.createElement('span');
    ravenBadge.className = 'studio-node__raven-badge';
    ravenBadge.setAttribute('data-station-action', 'mc-open-raven-gap');
    ravenBadge.setAttribute('data-category-key', category.key);
    ravenBadge.setAttribute('role', 'button');
    ravenBadge.setAttribute(
      'aria-label',
      'Open ' + roll.total + ' Raven product gap' + (roll.total === 1 ? '' : 's') + ' for ' + category.label
    );
    ravenBadge.setAttribute(
      'title',
      'Open ' + roll.total + ' Raven product gap' + (roll.total === 1 ? '' : 's')
    );
    ravenBadge.textContent = 'Gap ' + roll.total;
    node.appendChild(ravenBadge);
  }

  if (!mapUnlocked) {
    node.setAttribute('data-locked-map', '1');
    node.setAttribute(
      'title',
      'Pro only - this section is locked on the Free plan. Click to open your account and upgrade.'
    );
    const lock = document.createElement('span');
    lock.className = 'studio-node__lock';
    lock.textContent = 'Pro';
    node.appendChild(lock);
  }

  return node;
}

function buildStudioChoiceTile(categoryKey, option, selectedProvider, gapForPrompt, evidenceStatus) {
  const selected = isToolSelectedForCategory(categoryKey, option) ||
    normalizeToolKey(selectedProvider) === normalizeToolKey(option.name) ||
    normalizeToolKey(selectedProvider) === normalizeToolKey(option.toolName);
  const inProject = providerIsDetectedInProject(categoryKey, option.toolName || option.name);
  const usingNow = providerTruthProviderIsUsingNow(categoryKey, option.toolName || option.name);
  const multi = isMultiSelectCategory(categoryKey);
  const activeInProject = usingNow || (inProject && selected);
  const repoEvidenceOnly = inProject && !selected && !usingNow;
  const statusText = usingNow
    ? 'Using now'
    : inProject
      ? 'Repo evidence'
    : selected
      ? (multi ? 'Added to setup' : 'Setup selected')
      : 'Use this path';
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className =
    'studio-choice-tile' +
    (selected ? ' studio-choice-tile--selected' : '') +
    (multi ? ' studio-choice-tile--multi' : '') +
    (activeInProject ? ' studio-choice-tile--in-project' : '') +
    (repoEvidenceOnly ? ' studio-choice-tile--repo-evidence' : '');
  tile.setAttribute('data-station-action', 'mc3-select-path');
  tile.setAttribute('data-category-key', categoryKey);
  tile.setAttribute('data-tool-name', option.toolName || option.name);
  tile.setAttribute('data-gap-id', isRecord(gapForPrompt) && typeof gapForPrompt.id === 'string' ? gapForPrompt.id : '');
  tile.setAttribute('data-url', providerDocsUrl(option.toolName || option.name));
  tile.setAttribute('data-prompt', buildProviderSelectionPrompt(categoryKey, option.toolName || option.name, gapForPrompt));
  tile.setAttribute('aria-pressed', selected ? 'true' : 'false');
  if (multi) {
    tile.setAttribute('data-multi-select', '1');
  }
  if (inProject) {
    tile.setAttribute('data-in-project', '1');
  }

  const icon = document.createElement('span');
  icon.className = 'studio-choice-tile__icon provider-logo' + providerLogoClass(option.toolName || option.name);
  icon.setAttribute('title', providerDisplayName(option.toolName || option.name) || option.name);
  icon.setAttribute('aria-hidden', 'true');
  const iconMarkup = providerLogoMarkup(option.toolName || option.name);
  if (iconMarkup) {
    icon.innerHTML = iconMarkup;
  } else {
    icon.textContent = providerIconText(option.toolName || option.name);
  }
  const name = document.createElement('span');
  name.className = 'studio-choice-tile__name';
  name.textContent = option.name;
  const desc = document.createElement('span');
  desc.className = 'studio-choice-tile__desc';
  desc.textContent = providerBenefitText(option);
  const status = document.createElement('span');
  status.className = 'studio-choice-tile__status';
  status.textContent = statusText;

  tile.append(icon, name, desc, status);
  return tile;
}

function defaultProviderForCategory(category) {
  if (!category) {
    return '';
  }
  const options = providerOptionsForCategory(category.key, []);
  if (options.length > 0) {
    return options[0].toolName || options[0].name || '';
  }
  return category.providerLabel || '';
}

function readGenericVerificationSummary(category) {
  const payload = normalizeVerificationSummaryPayload(lastPayload && lastPayload.verificationSummary);
  const area = category.area || PRODUCTION_CHOICE_CATEGORY_AREAS[category.key] || category.key;
  return payload.byArea[category.key] || payload.byArea[area];
}

function providerNeedlesForCategory(categoryKey) {
  return providerOptionsForCategory(categoryKey, []).reduce(function (needles, option) {
    if (!isRecord(option)) {
      return needles;
    }
    const provider = normalizeProductionChoiceProvider(option.toolName || option.name);
    [
      option.name,
      option.toolName,
      provider,
      providerDisplayName(provider),
      providerOptionNameForCategory(categoryKey, provider)
    ].forEach(function (value) {
      const text = readString(value).trim();
      if (text) {
        needles.push(text);
      }
    });
    return needles;
  }, []);
}

function evidenceItemContainsProviderNeedle(item, providerNeedles) {
  const searchable = [
    item && item.label,
    item && item.source,
    item && item.detail,
    item && item.promptHint
  ].concat(Array.isArray(item && item.evidence) ? item.evidence : []).map(readString).join(' ').toLowerCase();
  const normalizedSearchable = normalizeProductionChoiceToken(searchable);
  return providerNeedles.some(function (needle) {
    const lowerNeedle = readString(needle).toLowerCase();
    const normalizedNeedle = normalizeProductionChoiceToken(needle);
    return (lowerNeedle && searchable.indexOf(lowerNeedle) >= 0) ||
      (normalizedNeedle && normalizedSearchable.indexOf(normalizedNeedle) >= 0);
  });
}

function isGenericDatabaseEvidenceItem(categoryKey, item) {
  if (categoryKey !== 'database' || !isRecord(item)) {
    return false;
  }
  const id = readString(item.id);
  const label = readString(item.label);
  return id === 'query-usage-found' ||
    id === 'schema-or-model-found' ||
    id === 'index-or-performance-evidence' ||
    /database query usage|schema(?:,?\s*model,?\s*or|\s*or)?\s*migration|schema\/model\/migration|index\s*or\s*performance|index\/performance/i.test(label);
}

function genericAreaEvidenceItems(category) {
  if (!category || category.key !== 'database') {
    return [];
  }
  const summary = readGenericVerificationSummary(category);
  const providerNeedles = providerNeedlesForCategory(category.key);
  const seen = {};
  const items = [];

  function addGenericItem(item) {
    if (!isGenericDatabaseEvidenceItem(category.key, item)) {
      return;
    }
    if (evidenceItemContainsProviderNeedle(item, providerNeedles)) {
      return;
    }
    const status = readString(item.status);
    if (status && status !== 'found' && status !== 'passed' && status !== 'user-confirmed') {
      return;
    }
    const id = readString(item.id);
    const label = readString(item.label);
    const dedupeKey = id || label.toLowerCase();
    if (!label || !dedupeKey || seen[dedupeKey]) {
      return;
    }
    seen[dedupeKey] = true;
    items.push(item);
  }

  if (isRecord(summary) && Array.isArray(summary.found)) {
    summary.found.forEach(addGenericItem);
  }

  const payload = isRecord(lastPayload) ? lastPayload : {};
  const stackWiring = isRecord(payload.stackWiring) && isRecord(payload.stackWiring.byKey)
    ? payload.stackWiring.byKey
    : {};
  Object.keys(stackWiring).forEach(function (key) {
    const row = stackWiring[key];
    if (!isRecord(row) || readString(row.area) !== 'database' || !Array.isArray(row.items)) {
      return;
    }
    row.items.forEach(addGenericItem);
  });

  const graph = readMissionGraph();
  Object.keys(graph.byProvider || {}).forEach(function (key) {
    const mission = graph.byProvider[key];
    if (!isRecord(mission) || readString(mission.area) !== 'database' || !Array.isArray(mission.checks)) {
      return;
    }
    mission.checks.forEach(function (check) {
      if (readString(check.evidenceClass) === 'repo-verified') {
        addGenericItem(check);
      }
    });
  });

  return items;
}

function genericVerificationMatchesSelectedProvider(category, selectedProvider, summary) {
  const provider = normalizeProductionChoiceProvider(selectedProvider);
  if (!provider || !isRecord(summary)) {
    return true;
  }
  const repoProvider = normalizeProductionChoiceProvider(repoProviderForCategory(category.key));
  if (repoProvider && repoProvider === provider) {
    return true;
  }

  const text = []
    .concat(summary.found || [], summary.missing || [], summary.manual || [])
    .map(function (item) {
      return [
        isRecord(item) ? item.label : '',
        isRecord(item) ? item.source : '',
        isRecord(item) ? item.detail : ''
      ].filter(Boolean).join(' ');
    })
    .join(' ')
    .toLowerCase();
  if (!text) {
    return true;
  }

  const selectedNeedles = [
    provider,
    providerDisplayName(provider),
    providerOptionNameForCategory(category.key, provider)
  ]
    .map(function (value) { return readString(value).toLowerCase(); })
    .filter(Boolean);
  const mentionsSelectedProvider = selectedNeedles.some(function (needle) { return text.indexOf(needle) >= 0; });
  if (mentionsSelectedProvider) {
    return true;
  }
  const mentionedDifferentProvider = providerOptionsForCategory(category.key, []).some(function (option) {
    const optionProvider = normalizeProductionChoiceProvider(option.toolName || option.name);
    if (!optionProvider || optionProvider === provider) {
      return false;
    }
    const needles = [
      optionProvider,
      providerDisplayName(optionProvider),
      providerOptionNameForCategory(category.key, optionProvider)
    ]
      .map(function (value) { return readString(value).toLowerCase(); })
      .filter(Boolean);
    return needles.some(function (needle) { return text.indexOf(needle) >= 0; });
  });

  return !mentionedDifferentProvider;
}

function renderStudioVerificationBlock(category, selectedProvider) {
  const summary = readGenericVerificationSummary(category);
  if (!isRecord(summary)) {
    return null;
  }
  if (!genericVerificationMatchesSelectedProvider(category, selectedProvider, summary)) {
    return null;
  }

  const block = document.createElement('section');
  block.className = 'studio-verification';
  block.setAttribute('aria-label', category.label + ' verification');

  const title = document.createElement('h3');
  title.className = 'studio-verification__title';
  title.textContent = 'Verification';
  block.appendChild(title);

  appendVerificationGroup(block, 'Repo evidence found', summary.found, 'found');
  appendVerificationGroup(block, 'Still missing', summary.missing, 'missing');
  appendVerificationGroup(block, 'Manual check', summary.manual, 'manual');

  return block;
}

function appendVerificationGroup(block, label, items, tone) {
  const safeItems = Array.isArray(items) ? items : [];
  if (safeItems.length === 0) {
    return;
  }
  const group = document.createElement('div');
  group.className = 'studio-verification__group studio-verification__group--' + tone;
  const heading = document.createElement('div');
  heading.className = 'studio-verification__group-title';
  const headingText = document.createElement('strong');
  headingText.textContent = label;
  const count = document.createElement('span');
  count.className = 'studio-verification__count';
  count.textContent = String(safeItems.length);
  heading.append(headingText, count);
  const list = document.createElement('ul');
  list.className = 'studio-verification__list';

  safeItems.forEach(function (item) {
    const row = document.createElement('li');
    row.className = 'studio-verification__item';
    const itemLabel = document.createElement('span');
    itemLabel.className = 'studio-verification__item-label';
    itemLabel.textContent = item.label;
    row.appendChild(itemLabel);
    row.setAttribute('title', item.source + (item.detail ? ' - ' + item.detail : ''));
    list.appendChild(row);
  });

  group.append(heading, list);
  block.appendChild(group);
}

function appendManualDashboardGroup(block, label, checks, mission) {
  const safeChecks = Array.isArray(checks) ? checks : [];
  if (safeChecks.length === 0) {
    return;
  }
  const group = document.createElement('div');
  group.className = 'studio-verification__group studio-verification__group--manual';
  const heading = document.createElement('div');
  heading.className = 'studio-verification__group-title';
  const headingText = document.createElement('strong');
  headingText.textContent = label;
  const count = document.createElement('span');
  count.className = 'studio-verification__count';
  count.textContent = String(safeChecks.length);
  heading.append(headingText, count);

  const list = document.createElement('ul');
  list.className = 'studio-verification__list';
  safeChecks.forEach(function (check) {
    const providerKey =
      readString(check.providerKey) ||
      readString(mission && mission.key) ||
      normalizeManualProviderKey(readString(check.provider) || readString(mission && mission.provider));
    const checkId = readString(check.id) || readString(check.checkId);
    const providerLabel = readString(check.providerLabel) || readString(mission && mission.providerLabel);
    const areaLabel = readString(check.areaLabel) || readString(mission && mission.areaLabel) || readString(check.area);
    const confirmation = manualConfirmationForCheck({
      id: checkId,
      providerKey: providerKey,
      providerLabel: providerLabel
    });
    const confirmationStatus = readString(confirmation && confirmation.status).toLowerCase();
    const confirmed = confirmationStatus === 'confirmed';
    const stale = readString(check.status) === 'stale' || confirmationStatus === 'stale';

    const row = document.createElement('li');
    row.className = 'studio-verification__item studio-verification__item--manual';
    row.setAttribute('title', readString(check.promptHint) || 'Confirm this in the provider dashboard.');

    const itemLabel = document.createElement('span');
    itemLabel.className = 'studio-verification__item-label';
    itemLabel.textContent = readString(check.label);
    row.appendChild(itemLabel);

    const status = document.createElement('span');
    status.className = 'studio-verification__manual-status';
    if (confirmation && confirmed && !stale) {
      status.textContent = confirmation.confirmedAt
        ? 'User confirmed ' + confirmation.confirmedAt
        : 'User confirmed this check';
    } else if (confirmation && stale) {
      status.textContent = 'Confirmation stale. Reconfirm this check.';
    } else {
      status.textContent = 'Dashboard confirmation needed.';
    }
    row.appendChild(status);

    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'studio-action-button';
    if (confirmation && confirmed && !stale) {
      action.setAttribute('data-station-action', 'revoke-manual-check');
      action.textContent = 'Revoke';
    } else {
      action.setAttribute('data-station-action', 'confirm-manual-check');
      action.setAttribute('data-provider-label', providerLabel);
      action.setAttribute('data-area-label', areaLabel);
      action.setAttribute('data-label', readString(check.label));
      action.textContent = confirmation && stale ? 'Reconfirm check' : 'Confirm check';
    }
    action.setAttribute('data-provider-key', providerKey);
    action.setAttribute('data-check-id', checkId);
    row.appendChild(action);
    list.appendChild(row);
  });

  group.append(heading, list);
  block.appendChild(group);
}

function renderStudioConnectionEvidenceBlock(category) {
  const summary = productionConnectionSummaryForCategory(category && category.key);
  if (!isRecord(summary)) {
    return null;
  }
  const source = readString(summary.source);
  const signals = Array.isArray(summary.signals) ? summary.signals.filter(Boolean) : [];
  const status = Array.isArray(summary.status) ? summary.status.map(function (item) {
    return readString(item);
  }) : [];
  const isDetected = source === 'detected' || status.indexOf('detected') >= 0 || status.indexOf('repo-verified') >= 0;
  const missing = [];
  if (status.indexOf('needs-env') >= 0) {
    missing.push('Env names missing');
  }
  if (status.indexOf('needs-webhook') >= 0) {
    missing.push('Webhook route missing');
  }
  if (
    status.indexOf('setup-not-verified') >= 0 &&
    !providerIsDetectedInProject(category && category.key, readString(summary.provider))
  ) {
    missing.push('Setup not verified by repo evidence');
  }
  if (!isDetected && signals.length === 0 && missing.length === 0) {
    return null;
  }

  const block = document.createElement('section');
  block.className = 'studio-verification studio-connection-evidence studio-mission-graph';
  block.setAttribute('aria-label', 'Detected stack evidence');

  const repoChecks = [];
  if (isDetected && signals.length > 0) {
    signals.slice(0, 6).forEach(function (signal) {
      repoChecks.push({
        label: signal,
        status: 'passed',
        source: 'production connection scan',
        detail: 'Detected by production connection scan'
      });
    });
  }

  if (missing.length > 0) {
    missing.forEach(function (label) {
      repoChecks.push({
        label: label,
        status: 'missing',
        source: 'production connection scan',
        detail: 'Setup evidence needed'
      });
    });
  }

  appendMissionRepoCard(block, repoChecks, missing.length);
  return block.children.length > 0 ? block : null;
}

function firstSidebarSentence(value, fallback) {
  const clean = stripHtml(value || '').replace(/\s+/g, ' ').trim();
  if (!clean) {
    return fallback || '';
  }
  const sentenceMatch = clean.match(/^.{1,140}?(?:[.!?](?:\s|$)|$)/);
  const sentence = sentenceMatch ? sentenceMatch[0].trim() : clean;
  if (sentence.length <= 150) {
    return sentence;
  }
  return sentence.slice(0, 147).replace(/\s+\S*$/, '') + '...';
}

function pushUniqueSidebarItem(items, label, detail, tone, next, source) {
  const cleanLabel = stripHtml(label || '').trim();
  const cleanDetail = firstSidebarSentence(detail || '', '');
  const cleanNext = firstSidebarSentence(next || '', '');
  if (!cleanLabel) {
    return;
  }
  const key = (cleanLabel + '\n' + cleanDetail + '\n' + cleanNext).toLowerCase();
  if (items.some(function (item) { return item.key === key; })) {
    return;
  }
  items.push({
    key,
    label: cleanLabel,
    detail: cleanDetail,
    next: cleanNext,
    tone: tone || 'neutral',
    source: source || ''
  });
}

function appendSidebarContractSection(parent, title, items, emptyText, className, stepNumber) {
  const section = document.createElement('section');
  section.className = 'studio-sidebar-contract__section ' + (className || '');
  const heading = document.createElement('h4');
  heading.className = 'studio-sidebar-contract__heading';
  const step = document.createElement('span');
  step.className = 'studio-sidebar-contract__step';
  step.textContent = String(stepNumber || '');
  const headingText = document.createElement('span');
  headingText.textContent = title;
  const count = document.createElement('b');
  count.textContent = String(Array.isArray(items) && items.length > 0 ? items.length : 0);
  heading.append(step, headingText, count);
  const list = document.createElement('ul');
  list.className = 'studio-sidebar-contract__list';
  const safeItems = Array.isArray(items) ? items : [];
  if (safeItems.length > 0) {
    safeItems.forEach(function (item) {
      const row = document.createElement('li');
      row.className = 'studio-sidebar-contract__item studio-sidebar-contract__item--' + (item.tone || 'neutral');
      const top = document.createElement('div');
      top.className = 'studio-sidebar-contract__item-top';
      const label = document.createElement('strong');
      label.textContent = item.label;
      top.appendChild(label);
      if (item.source) {
        const source = document.createElement('em');
        source.className = 'studio-sidebar-contract__source';
        source.textContent = item.source;
        top.appendChild(source);
      }
      row.appendChild(top);
      if (item.detail) {
        const detail = document.createElement('span');
        detail.className = 'studio-sidebar-contract__why';
        detail.textContent = item.detail;
        row.appendChild(detail);
      }
      if (item.next) {
        const next = document.createElement('span');
        next.className = 'studio-sidebar-contract__next';
        next.textContent = 'Next: ' + item.next;
        row.appendChild(next);
      }
      list.appendChild(row);
    });
  } else {
    const row = document.createElement('li');
    row.className = 'studio-sidebar-contract__item studio-sidebar-contract__item--empty';
    row.textContent = emptyText;
    list.appendChild(row);
  }
  section.append(heading, list);
  parent.appendChild(section);
}

function sidebarMetricPercent(done, total) {
  if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}

function isLiveProofEvidence(item) {
  return Boolean(item && item.tone === 'live');
}

function isManualConfirmationEvidence(item) {
  return Boolean(item && item.tone === 'manual');
}

function appendSidebarContractMetrics(parent, contract) {
  const evidence = contract && Array.isArray(contract.evidence) ? contract.evidence : [];
  const codeGaps = contract && Array.isArray(contract.codeGaps) ? contract.codeGaps : [];
  const repoDone = evidence.filter(function (item) { return item && item.tone === 'repo'; }).length;
  const liveDone = evidence.filter(isLiveProofEvidence).length;
  const manualDone = evidence.filter(isManualConfirmationEvidence).length;
  const repoPercent = repoDone <= 0 ? 0 : codeGaps.length > 0 ? 50 : 100;
  const livePercent = liveDone > 0 ? 100 : 0;
  const metrics = [
    { label: 'Repo evidence', percent: repoPercent, badge: repoPercent === 100 ? 'Verified' : repoPercent > 0 ? 'Partial' : 'Not verified' },
    { label: 'Live provider proof', percent: livePercent, badge: livePercent === 100 ? 'Verified' : 'Not checked' },
    { label: 'Manual confirmation', percent: manualDone > 0 ? 100 : 0, badge: manualDone > 0 ? 'Confirmed' : 'Not confirmed' }
  ];
  const box = document.createElement('div');
  box.className = 'studio-sidebar-contract__metrics';
  const title = document.createElement('div');
  title.className = 'studio-sidebar-contract__metrics-title';
  const titleText = document.createElement('strong');
  titleText.textContent = 'Readiness';
  const titleHint = document.createElement('span');
  titleHint.textContent = livePercent === 100 ? 'Repo + live proof' : manualDone > 0 ? 'Repo scan + manual confirmation' : 'Repo scan + live proof';
  title.append(titleText, titleHint);
  box.appendChild(title);
  metrics.forEach(function (metric) {
    const row = document.createElement('div');
    row.className = 'studio-sidebar-contract__metric';
    const label = document.createElement('span');
    label.textContent = metric.label;
    const track = document.createElement('span');
    track.className = 'studio-sidebar-contract__meter';
    const fill = document.createElement('span');
    fill.className = 'studio-sidebar-contract__meter-fill';
    fill.style.width = metric.percent + '%';
    track.appendChild(fill);
    const value = document.createElement('strong');
    value.textContent = metric.percent + '% - ' + metric.badge;
    row.append(label, track, value);
    box.appendChild(row);
  });
  parent.appendChild(box);
}

function sidebarContractMetricRows(contract) {
  const evidence = contract && Array.isArray(contract.evidence) ? contract.evidence : [];
  const codeGaps = contract && Array.isArray(contract.codeGaps) ? contract.codeGaps : [];
  const repoDone = evidence.filter(function (item) { return item && item.tone === 'repo'; }).length;
  const liveDone = evidence.filter(isLiveProofEvidence).length;
  const manualDone = evidence.filter(isManualConfirmationEvidence).length;
  const repoTotal = repoDone + codeGaps.length;
  const repoPercent = repoDone <= 0 ? 0 : Math.max(1, Math.min(100, Math.round((repoDone / Math.max(repoTotal, 1)) * 100)));
  const livePercent = liveDone > 0 ? 100 : 0;
  const rows = [
    { label: 'Repo evidence', percent: repoPercent, badge: repoPercent === 100 ? 'Verified' : repoPercent > 0 ? 'Partial' : 'Not verified' }
  ];
  if (contract && contract.liveProofRequired) {
    rows.push({ label: 'Live proof', percent: livePercent, badge: livePercent === 100 ? 'Verified' : 'Not checked' });
  }
  if (manualDone > 0) {
    rows.push({ label: 'Manual confirmation', percent: 100, badge: 'Confirmed' });
  }
  return rows;
}

function selectedNodeReadinessSentence(contract) {
  const metrics = sidebarContractMetricRows(contract);
  const repoPercent = metrics[0] ? metrics[0].percent : 0;
  const liveRow = metrics.find(function (metric) { return metric && metric.label === 'Live proof'; });
  const livePercent = liveRow ? liveRow.percent : 0;
  if (contract && contract.multiSelected && Array.isArray(contract.selectedProviders)) {
    return contract.selectedProviders.length + ' controls selected. Verify repo evidence before marking ready.';
  }
  if (contract && contract.providerMismatch) {
    return 'Selected ' + contract.providerLabel + '. Repo points to ' + contract.detectedProviderLabel + '.';
  }
  if (contract && !contract.liveProofRequired) {
    if (repoPercent === 100) {
      return 'Repo checks verified. No live provider proof is required for this path.';
    }
    if (repoPercent > 0) {
      return 'Repo checks found. Finish the remaining repo/control review.';
    }
    return 'Selected control path. Verify repo evidence before marking ready.';
  }
  if (repoPercent === 100 && livePercent === 100) {
    return 'Repo and live setup verified.';
  }
  if (repoPercent > 0 && livePercent <= 0) {
    return 'Repo found. Live not checked.';
  }
  return 'Selected only. Verify setup.';
}

function sidebarMetricDisplayLabel(metric) {
  const label = metric && metric.label ? metric.label : '';
  if (label === 'Live proof') {
    return 'Provider live';
  }
  if (label === 'Repo evidence') {
    return 'Repo files';
  }
  return label;
}

function selectedNodeRequiresLiveProof(categoryKey, providerName, isMultiSelect) {
  if (isMultiSelect) {
    return false;
  }
  const key = normalizeProductionChoiceProvider(providerName) || normalizeToolKey(providerName);
  if (!key) {
    return false;
  }
  if (categoryKey === 'testing') {
    return key === 'github' || key === 'gitlab';
  }
  if (categoryKey === 'security') {
    return false;
  }
  if (categoryKey === 'frontend' || categoryKey === 'backend' || categoryKey === 'appFlow') {
    return false;
  }
  if (key === 'vitest' || key === 'playwright' || key === 'secrets-hygiene') {
    return false;
  }
  return true;
}

function appendMismatchReadinessStatus(parent, contract) {
  const evidence = contract && Array.isArray(contract.evidence) ? contract.evidence : [];
  const alternativeEvidence = contract && Array.isArray(contract.alternativeEvidence) ? contract.alternativeEvidence : [];
  const selectedRepoCount = evidence.filter(function (item) { return item && item.tone === 'repo'; }).length;
  const liveCount = evidence.filter(isLiveProofEvidence).length;
  const manualCount = evidence.filter(isManualConfirmationEvidence).length;
  const statusRows = [
    {
      label: 'Selected',
      value: contract.providerLabel,
      badge: selectedRepoCount > 0 ? 'Repo evidence' : 'Not verified',
      tone: selectedRepoCount > 0 ? 'repo' : 'muted'
    },
    {
      label: 'Detected',
      value: contract.detectedProviderLabel || 'Unknown',
      badge: alternativeEvidence.length > 0 ? 'Repo evidence' : 'Possible',
      tone: alternativeEvidence.length > 0 ? 'repo' : 'warning'
    },
    {
      label: 'Live check',
      value: 'Provider live proof',
      badge: liveCount > 0 ? 'Verified' : 'Not checked',
      tone: liveCount > 0 ? 'live' : 'muted'
    }
  ];
  if (manualCount > 0) {
    statusRows.push({
      label: 'Manual confirmation',
      value: 'Human confirmation',
      badge: 'Confirmed',
      tone: 'manual'
    });
  }
  const box = document.createElement('div');
  box.className = 'studio-sidebar-contract__mismatch-status';
  statusRows.forEach(function (status) {
    const row = document.createElement('div');
    row.className = 'studio-sidebar-contract__mismatch-row studio-sidebar-contract__mismatch-row--' + status.tone;
    const label = document.createElement('span');
    label.textContent = status.label;
    const value = document.createElement('strong');
    value.textContent = status.value;
    const badge = document.createElement('b');
    badge.textContent = status.badge;
    row.append(label, value, badge);
    box.appendChild(row);
  });
  parent.appendChild(box);
}

function appendSelectedNodeReadiness(parent, contract) {
  const card = document.createElement('section');
  card.className = 'studio-sidebar-contract__readiness';
  card.setAttribute('aria-label', contract.providerLabel + ' readiness');

  const head = document.createElement('div');
  head.className = 'studio-sidebar-contract__head';
  const logo = document.createElement('span');
  logo.className = 'studio-sidebar-contract__logo provider-logo' + providerLogoClass(contract.providerName);
  logo.setAttribute('title', contract.providerLabel);
  logo.setAttribute('aria-hidden', 'true');
  const logoMarkup = providerLogoMarkup(contract.providerName);
  if (logoMarkup) {
    logo.innerHTML = logoMarkup;
  } else {
    logo.textContent = providerIconText(contract.providerName);
  }
  const headText = document.createElement('div');
  headText.className = 'studio-sidebar-contract__head-text';
  const title = document.createElement('strong');
  title.textContent = contract.providerMismatch ? contract.areaLabel + ' readiness' : contract.providerLabel;
  const area = document.createElement('span');
  area.textContent = contract.areaLabel;
  headText.append(title, area);
  const status = document.createElement('span');
  status.className = 'studio-sidebar-contract__status';
  status.textContent = selectedNodeStatusBadge(contract);
  head.append(logo, headText, status);

  const metrics = document.createElement('div');
  metrics.className = 'studio-sidebar-contract__compact-metrics';
  if (contract.providerMismatch) {
    appendMismatchReadinessStatus(metrics, contract);
  } else {
    sidebarContractMetricRows(contract).forEach(function (metric) {
      const row = document.createElement('div');
      row.className = 'studio-sidebar-contract__compact-metric' + (metric.label === 'Live proof' ? ' studio-sidebar-contract__compact-metric--live' : '');
      const label = document.createElement('span');
      label.textContent = sidebarMetricDisplayLabel(metric);
      const value = document.createElement('strong');
      value.textContent = metric.percent + '%';
      value.title = metric.badge;
      const meter = document.createElement('i');
      meter.className = 'studio-sidebar-contract__compact-meter';
      const fill = document.createElement('b');
      fill.style.width = metric.percent + '%';
      meter.appendChild(fill);
      row.append(label, value, meter);
      metrics.appendChild(row);
    });
  }

  const sentence = document.createElement('p');
  sentence.className = 'studio-sidebar-contract__summary';
  sentence.textContent = selectedNodeReadinessSentence(contract);

  card.append(head, metrics, sentence);
  if (contract.multiSelected && Array.isArray(contract.selectedProviders) && contract.selectedProviders.length > 1) {
    const selectedList = document.createElement('ul');
    selectedList.className = 'studio-sidebar-contract__selected-list';
    contract.selectedProviders.slice(0, 5).forEach(function (provider) {
      const item = document.createElement('li');
      const mark = document.createElement('span');
      mark.className = 'provider-logo' + providerLogoClass(provider);
      mark.setAttribute('aria-hidden', 'true');
      const markMarkup = providerLogoMarkup(provider);
      if (markMarkup) {
        mark.innerHTML = markMarkup;
      } else {
        mark.textContent = providerIconText(provider);
      }
      const label = document.createElement('strong');
      label.textContent = providerDisplayName(provider) || provider;
      item.append(mark, label);
      selectedList.appendChild(item);
    });
    card.appendChild(selectedList);
  }
  parent.appendChild(card);
}

function appendSidebarRepoSignalsCard(parent, contract) {
  if (!contract || contract.providerMismatch) {
    return;
  }
  const evidence = Array.isArray(contract.evidence) ? contract.evidence.filter(function (item) {
    return item && item.tone === 'repo';
  }) : [];
  if (evidence.length === 0) {
    return;
  }
  const card = document.createElement('section');
  card.className = 'studio-sidebar-contract__repo-signals';
  const title = document.createElement('h4');
  title.textContent = evidence.length + ' repo signal' + (evidence.length === 1 ? '' : 's') + ' in the codebase.';
  const list = document.createElement('ul');
  list.className = 'studio-sidebar-contract__signal-list';
  evidence.slice(0, 6).forEach(function (item) {
    const row = document.createElement('li');
    const label = document.createElement('strong');
    label.textContent = item.label || 'Repo evidence';
    const status = document.createElement('span');
    status.textContent = 'Verified';
    row.append(label, status);
    list.appendChild(row);
  });
  card.append(title, list);
  parent.appendChild(card);
}

function appendGenericAreaEvidenceCard(parent, category) {
  const items = genericAreaEvidenceItems(category);
  if (items.length === 0) {
    return;
  }
  const card = document.createElement('section');
  card.className = 'studio-sidebar-contract__generic-evidence';
  const title = document.createElement('h4');
  title.textContent = 'Generic database evidence';
  const note = document.createElement('p');
  note.textContent = 'These checks prove database structure or usage, not a specific provider.';
  const list = document.createElement('ul');
  items.slice(0, 4).forEach(function (item) {
    const row = document.createElement('li');
    row.textContent = readString(item.label);
    list.appendChild(row);
  });
  card.append(title, note, list);
  parent.appendChild(card);
}

function sidebarAttentionItems(contract) {
  const items = [];
  const codeGaps = contract && Array.isArray(contract.codeGaps) ? contract.codeGaps : [];
  const needsVerification = contract && Array.isArray(contract.needsVerification) ? contract.needsVerification : [];
  const human = contract && Array.isArray(contract.human) ? contract.human : [];
  const evidence = contract && Array.isArray(contract.evidence) ? contract.evidence : [];
  const liveProofRequired = Boolean(contract && contract.liveProofRequired);
  const hasLiveProof = evidence.some(isLiveProofEvidence);
  const liveItems = needsVerification.concat(human).filter(function (item) {
    return item && /live|mcp|dashboard|manual|provider setup|setup not verified/i.test((item.label || '') + ' ' + (item.detail || ''));
  });
  const nonLiveVerification = needsVerification.filter(function (item) {
    return liveItems.indexOf(item) < 0;
  });
  const nonLiveHuman = human.filter(function (item) {
    return liveItems.indexOf(item) < 0;
  });

  if (contract && contract.providerMismatch) {
    items.push({
      label: 'Choose provider first',
      detail: contract.providerLabel + ' selected. Repo points to ' + contract.detectedProviderLabel + '.',
      next: 'Decide before code changes.',
      source: ''
    });
  }

  codeGaps.slice(0, 3).forEach(function (item) {
    items.push({
      label: item.label,
      detail: item.detail || 'Agent can inspect and patch repo code/config.',
      next: item.next || 'Run a focused agent prompt.',
      source: 'Agent-code'
    });
  });

  if (liveProofRequired && !hasLiveProof && liveItems.length > 0) {
    items.push({
      label: 'Live check missing',
      detail: 'MCP/API/dashboard required.',
      next: '',
      source: 'Manual/MCP'
    });
  }

  nonLiveVerification.concat(nonLiveHuman).slice(0, 2).forEach(function (item) {
    items.push({
      label: item.label,
      detail: item.detail,
      next: item.next,
      source: item.source || 'Verify'
    });
  });

  return items;
}

function appendSidebarAttention(parent, contract) {
  const items = sidebarAttentionItems(contract);
  if (items.length === 0) {
    return;
  }
  const section = document.createElement('section');
  section.className = 'studio-sidebar-contract__attention';
  const title = document.createElement('h4');
  title.textContent = 'Attention';
  const list = document.createElement('ul');
  list.className = 'studio-sidebar-contract__attention-list';
  items.slice(0, 1).forEach(function (item) {
    const row = document.createElement('li');
    row.className = 'studio-sidebar-contract__attention-item';
    const top = document.createElement('div');
    top.className = 'studio-sidebar-contract__attention-top';
    const label = document.createElement('strong');
    label.textContent = item.label;
    top.appendChild(label);
    if (item.source) {
      const source = document.createElement('em');
      source.textContent = item.source;
      top.appendChild(source);
    }
    row.appendChild(top);
    if (item.detail) {
      const detail = document.createElement('span');
      detail.textContent = item.detail;
      row.appendChild(detail);
    }
    if (item.next) {
      const next = document.createElement('b');
      next.textContent = item.next;
      row.appendChild(next);
    }
    list.appendChild(row);
  });
  if (items.length > 1) {
    const detailRow = document.createElement('li');
    detailRow.className = 'studio-sidebar-contract__attention-more';
    const details = document.createElement('details');
    details.className = 'studio-sidebar-contract__attention-details';
    const summary = document.createElement('summary');
    summary.textContent = '+' + (items.length - 1) + ' more details';
    const detailList = document.createElement('ul');
    detailList.className = 'studio-sidebar-contract__attention-detail-list';
    items.slice(1).forEach(function (item) {
      const detailItem = document.createElement('li');
      const label = document.createElement('strong');
      label.textContent = item.label;
      detailItem.appendChild(label);
      if (item.detail) {
        const detail = document.createElement('span');
        detail.textContent = item.detail;
        detailItem.appendChild(detail);
      }
      if (item.next) {
        const next = document.createElement('b');
        next.textContent = item.next;
        detailItem.appendChild(next);
      }
      detailList.appendChild(detailItem);
    });
    details.append(summary, detailList);
    detailRow.appendChild(details);
    list.appendChild(detailRow);
  }
  section.append(title, list);
  parent.appendChild(section);
}

function detectedProviderKeyFromSummary(summary) {
  if (!isRecord(summary) || !readString(summary.provider)) {
    return '';
  }
  return normalizeProductionChoiceProvider(readString(summary.provider));
}

function summaryEvidenceMatchesSelectedProvider(summary, selectedProviderKey) {
  const detectedProviderKey = detectedProviderKeyFromSummary(summary);
  if (!productionConnectionHasRepoEvidence(summary)) {
    return false;
  }
  return Boolean(detectedProviderKey && selectedProviderKey && detectedProviderKey === selectedProviderKey);
}

function verificationItemMatchesProvider(item, providerKey, providerLabel, providerName) {
  if (!isRecord(item) || !providerKey) {
    return false;
  }
  const needles = [
    providerKey,
    providerDisplayName(providerKey),
    providerLabel,
    providerName
  ]
    .map(function (value) { return readString(value).toLowerCase(); })
    .filter(Boolean);
  const text = [
    item.label,
    item.source,
    item.detail
  ].map(readString).join(' ').toLowerCase();
  return needles.some(function (needle) { return needle && text.indexOf(needle) >= 0; });
}

function pushSummaryEvidenceItems(items, summary, providerLabel, sourceLabel) {
  const signals = isRecord(summary) && Array.isArray(summary.signals) ? summary.signals.filter(Boolean).slice(0, 4) : [];
  if (signals.length > 0) {
    signals.forEach(function (signal) {
      pushUniqueSidebarItem(items, signal, 'Verified repo evidence.', 'repo', '', sourceLabel || 'Repo files');
    });
  } else {
    pushUniqueSidebarItem(items, providerLabel + ' repo evidence', 'Verified by production connection scan.', 'repo', '', sourceLabel || 'Repo files');
  }
}

function stackWiringItemMatchesProvider(item, stackWiring, selectedName) {
  if (!isRecord(item) || !isRecord(stackWiring)) {
    return false;
  }
  const providerKey = normalizeProductionChoiceProvider(readString(stackWiring.provider) || selectedName);
  const providerLabel = readString(stackWiring.providerLabel) || providerDisplayName(providerKey) || selectedName;
  const needles = [
    providerKey,
    providerLabel,
    selectedName,
    providerDisplayName(providerKey),
    providerOptionNameForCategory(readString(stackWiring.area), providerKey)
  ]
    .map(function (value) { return readString(value).toLowerCase(); })
    .filter(Boolean);
  const evidence = Array.isArray(item.evidence) ? item.evidence : [];
  const text = evidence.map(readString).join(' ').toLowerCase();
  return needles.some(function (needle) { return needle && text.indexOf(needle) >= 0; });
}

function stackWiringHasProviderAnchor(stackWiring, selectedName) {
  if (!isRecord(stackWiring) || !Array.isArray(stackWiring.items)) {
    return false;
  }
  return stackWiring.items.some(function (item) {
    return isRecord(item) &&
      readString(item.status) === 'passed' &&
      stackWiringItemMatchesProvider(item, stackWiring, selectedName);
  });
}

function buildSelectedNodeSidebarContract(category, categoryGaps, selectedProvider) {
  const evidenceItems = [];
  const alternativeEvidenceItems = [];
  const codeGapItems = [];
  const needsVerificationItems = [];
  const humanItems = [];
  const categoryKey = category && category.key ? category.key : '';
  const selectedTools = isMultiSelectCategory(categoryKey) ? selectedToolListForCategory(categoryKey) : [];
  const hasMultipleSelectedTools = selectedTools.length > 1;
  const providerName = hasMultipleSelectedTools
    ? selectedTools[0]
    : selectedProvider || defaultProviderForCategory(category);
  const selectedProviderKey = normalizeProductionChoiceProvider(providerName);
  const providerLabel = hasMultipleSelectedTools
    ? selectedTools.length + ' selected controls'
    : providerDisplayName(providerName) || providerName || 'Selected provider';
  const areaLabel = category && category.label ? category.label : 'Production';
  const areaSummary = productionConnectionSummaryForCategory(categoryKey);
  const selectedProviderSummary = hasMultipleSelectedTools
    ? null
    : productionConnectionSummaryForSelectedProvider(categoryKey, providerName);
  const summary = selectedProviderSummary || areaSummary;
  const detectedProviderKey = productionConnectionHasRepoEvidence(summary) ? detectedProviderKeyFromSummary(summary) : '';
  const detectedProviderLabel = detectedProviderKey ? providerDisplayName(detectedProviderKey) : '';
  const providerMismatch = !hasMultipleSelectedTools && Boolean(selectedProviderKey && detectedProviderKey && selectedProviderKey !== detectedProviderKey);
  const selectedProviderNames = hasMultipleSelectedTools ? selectedTools : [providerName].filter(Boolean);
  const mcpSnippet = buildMcpSetupSnippet(providerName);
  const liveProofRequired = selectedNodeRequiresLiveProof(categoryKey, providerName, hasMultipleSelectedTools);

  if (!hasMultipleSelectedTools && isRecord(summary) && summaryEvidenceMatchesSelectedProvider(summary, selectedProviderKey)) {
    pushSummaryEvidenceItems(evidenceItems, summary, providerLabel, 'Repo files');
  } else if (providerMismatch) {
    pushSummaryEvidenceItems(alternativeEvidenceItems, summary, detectedProviderLabel, detectedProviderLabel || 'Repo files');
  } else if (!hasMultipleSelectedTools && isRecord(summary) && readString(summary.provider)) {
    const summaryText = [
      summary.source,
      summary.label,
      Array.isArray(summary.status) ? summary.status.join(' ') : ''
    ].map(readString).join(' ').toLowerCase();
    const shouldShowPossibleProvider = /\b(possible|detected|scanner|weak)\b/.test(summaryText) && !/\bselected\b/.test(summaryText);
    if (shouldShowPossibleProvider) {
    const possibleProviderLabel = 'possible provider';
    pushUniqueSidebarItem(
      needsVerificationItems,
      providerLabel + ' ' + possibleProviderLabel,
      'Evidence is weak; not connected.',
      'warning',
      'Verify repo wiring or choose provider.',
      'Possible'
    );
    }
  }

  selectedProviderNames.forEach(function (selectedName) {
    const stackWiring = readSelectedStackWiring(category, selectedName);
    const stackAutomation = readSelectedStackAutomation(category, selectedName);
    const mission = readSelectedProviderMission(category, selectedName);
    const stackWiringProviderAnchored = stackWiringHasProviderAnchor(stackWiring, selectedName);
    if (stackWiring && Array.isArray(stackWiring.items)) {
      stackWiring.items.forEach(function (item) {
        if (!isRecord(item)) {
          return;
        }
        const status = readString(item.status);
        const label = readString(item.label);
        if (status === 'passed') {
          if (!isGenericDatabaseEvidenceItem(category.key, item) && (stackWiringProviderAnchored || stackWiringItemMatchesProvider(item, stackWiring, selectedName))) {
            pushUniqueSidebarItem(evidenceItems, label, 'Verified repo evidence.', 'repo', '', 'Repo files');
          }
        } else if (status === 'manual') {
          if (liveProofRequired) {
            pushUniqueSidebarItem(humanItems, label, readString(item.promptHint) || 'Confirm this in the provider dashboard.', 'manual', 'Confirm this in the provider dashboard or through MCP/API.', 'Human');
          } else {
            pushUniqueSidebarItem(needsVerificationItems, label, readString(item.promptHint) || 'Review this outside the repo scan.', 'unknown', 'Review the check, then rescan.', 'Review');
          }
        } else if (status === 'missing') {
          pushUniqueSidebarItem(codeGapItems, label, readString(item.promptHint) || 'Agent can potentially fix this in repo code or config.', 'missing', 'Ask the agent to inspect and patch repo code/config only.', 'Agent');
        }
      });
    }

    if (stackAutomation) {
      if (Array.isArray(stackAutomation.confirmedChecks)) {
        stackAutomation.confirmedChecks.forEach(function (check) {
          if (!isRecord(check)) {
            return;
          }
          const label = readString(check.label);
          if (label && !isGenericDatabaseEvidenceItem(category.key, check) && (stackWiringProviderAnchored || stackWiringItemMatchesProvider(check, stackAutomation, selectedName))) {
            pushUniqueSidebarItem(evidenceItems, label, 'Verified repo evidence.', 'repo', '', 'Repo files');
          }
        });
      }
      if (Array.isArray(stackAutomation.repoFixes)) {
        stackAutomation.repoFixes.forEach(function (fix) {
          if (!isRecord(fix)) {
            return;
          }
          const label = readString(fix.label);
          const status = readString(fix.status);
          if (!label) {
            return;
          }
          if (status === 'passed' && !isGenericDatabaseEvidenceItem(category.key, fix)) {
            pushUniqueSidebarItem(evidenceItems, label, 'Verified repo evidence.', 'repo', '', 'Repo files');
          } else if (status !== 'passed') {
            pushUniqueSidebarItem(codeGapItems, label, readString(fix.promptHint) || 'Repo/config check needs attention.', 'missing', 'Ask the agent to inspect and patch repo code/config only.', 'Agent');
          }
        });
      }
      if (Array.isArray(stackAutomation.manualChecks)) {
        stackAutomation.manualChecks.forEach(function (check) {
          if (!isRecord(check)) {
            return;
          }
          const label = readString(check.label);
          if (!label) {
            return;
          }
          if (liveProofRequired) {
            pushUniqueSidebarItem(humanItems, label, readString(check.promptHint) || 'Confirm this in the provider dashboard.', 'manual', 'Confirm this in the provider dashboard or through MCP/API.', 'Human');
          } else {
            pushUniqueSidebarItem(needsVerificationItems, label, readString(check.promptHint) || 'Review this check.', 'unknown', 'Review the check, then rescan.', 'Review');
          }
        });
      }
    }

    if (mission && Array.isArray(mission.checks)) {
      mission.checks.forEach(function (check) {
        if (!isRecord(check)) {
          return;
        }
        const status = readString(check.status);
        const evidenceClass = readString(check.evidenceClass);
        const label = readString(check.label);
        if (status === 'passed' && evidenceClass === 'repo-verified' && !isGenericDatabaseEvidenceItem(category.key, check)) {
          pushUniqueSidebarItem(evidenceItems, label, 'Verified repo evidence.', 'repo', '', 'Repo files');
        } else if (status === 'passed' && evidenceClass === 'mcp-verifier') {
          pushUniqueSidebarItem(evidenceItems, label, 'Verified live provider evidence.', 'live', '', 'MCP');
        } else if (status === 'user-confirmed' && evidenceClass === 'manual-dashboard') {
          pushUniqueSidebarItem(evidenceItems, label, 'Confirmed manually by the user.', 'manual', '', 'Manual');
        } else if (status === 'missing' && evidenceClass === 'repo-fix') {
          pushUniqueSidebarItem(codeGapItems, label, readString(check.promptHint) || 'Agent can potentially fix this in repo code or config.', 'missing', 'Ask the agent to inspect and patch repo code/config only.', 'Agent');
        } else if (status === 'needs-connection' || evidenceClass === 'manual-dashboard') {
          if (liveProofRequired) {
            pushUniqueSidebarItem(humanItems, label, readString(check.promptHint) || 'Confirm this in the provider dashboard.', 'manual', 'Confirm this in the provider dashboard or through MCP/API.', 'Human');
          } else {
            pushUniqueSidebarItem(needsVerificationItems, label, readString(check.promptHint) || 'Review this outside the repo scan.', 'unknown', 'Review the check, then rescan.', 'Review');
          }
        }
      });
    }
  });

  const genericSummary = readGenericVerificationSummary(category);
  if (
    !providerMismatch &&
    evidenceItems.filter(function (item) { return item && item.tone === 'repo'; }).length === 0 &&
    isRecord(genericSummary) &&
    Array.isArray(genericSummary.found)
  ) {
    selectedProviderNames.forEach(function (selectedName) {
      const providerKey = normalizeProductionChoiceProvider(selectedName);
      const selectedLabel = providerDisplayName(selectedName) || selectedName;
      genericSummary.found.forEach(function (item) {
      if (!isRecord(item)) {
        return;
      }
      const label = readString(item.label);
      if (!label || !verificationItemMatchesProvider(item, providerKey, selectedLabel, selectedName)) {
        return;
      }
      pushUniqueSidebarItem(evidenceItems, label, 'Verified repo evidence.', 'repo', '', 'Repo files');
    });
    });
  }

  if (
    !providerMismatch &&
    genericVerificationMatchesSelectedProvider(category, providerName, genericSummary) &&
    isRecord(genericSummary) &&
    Array.isArray(genericSummary.missing)
  ) {
    genericSummary.missing.forEach(function (item) {
      if (!isRecord(item)) {
        return;
      }
      const label = readString(item.label);
      const source = readString(item.source).toLowerCase();
      if (!label || source.indexOf('dashboard') >= 0 || source.indexOf('manual') >= 0 || source.indexOf('provider') >= 0) {
        return;
      }
      pushUniqueSidebarItem(
        codeGapItems,
        label,
        'Repo/config check needs attention.',
        'missing',
        'Ask the agent to inspect the related files and patch only repo code/config.',
        'Agent'
      );
    });
  }

  if (liveProofRequired && mcpSnippet) {
    const liveCheckNeedsMcp = 'Needs MCP';
    pushUniqueSidebarItem(
      humanItems,
      'Live check needs MCP',
      'Provider setup must be verified outside code.',
      'manual',
      'Connect MCP or confirm manually.',
      'Human'
    );
  } else if (liveProofRequired) {
    pushUniqueSidebarItem(
      needsVerificationItems,
      'Live check not run',
      'Provider setup has not been checked live.',
      'unknown',
      'Verify with MCP/API/dashboard.',
      'Not checked'
    );
  }

  (Array.isArray(categoryGaps) ? categoryGaps : []).slice(0, 4).forEach(function (gap) {
    pushUniqueSidebarItem(
      codeGapItems,
      stripHtml(gap.title || gap.detail || 'Product gap needs repo review'),
      stripHtml(gap.detail || 'Agent can inspect and adjust repo implementation.'),
      'missing',
      'Ask the agent to inspect the repo and propose a scoped code/config fix.',
      'Agent'
    );
  });

  if (evidenceItems.length === 0) {
    pushUniqueSidebarItem(
      needsVerificationItems,
      'Setup not verified',
      'Selected provider is context only.',
      'unknown',
      'Inspect repo wiring, then verify live setup.',
      'Not verified'
    );
  }

  return {
    providerName,
    selectedProviderKey,
    providerLabel,
    areaLabel,
    selectedProviders: selectedProviderNames,
    multiSelected: hasMultipleSelectedTools,
    detectedProviderKey,
    detectedProviderLabel,
    providerMismatch,
    evidence: evidenceItems,
    alternativeEvidence: alternativeEvidenceItems,
    codeGaps: codeGapItems,
    needsVerification: needsVerificationItems,
    human: humanItems,
    liveProofRequired
  };
}

function buildSelectedNodeFocusedPrompt(category, contract) {
  const label = category && category.label ? category.label : 'selected stack node';
  const providerLabel = contract && contract.providerLabel ? contract.providerLabel : 'selected provider';
  if (contract && contract.providerMismatch) {
    const detectedLabel = contract.detectedProviderLabel || 'another provider';
    return [
      'VibeRaven provider decision needed',
      '',
      'Node: ' + label,
      'Selected provider context: ' + providerLabel,
      'Detected repo evidence: ' + detectedLabel,
      '',
      'The repo appears wired for ' + detectedLabel + ', but ' + providerLabel + ' is selected in VibeRaven. Choose the intended provider before code changes.',
      '',
      'Agent-code actions:',
      '- Do not rewrite provider wiring until provider intent is clear.',
      '- If ' + providerLabel + ' is intended, inspect repo wiring and propose minimal code/config changes only.',
      '- If ' + detectedLabel + ' is intended, switch VibeRaven to that provider and rescan before patching code.',
      '- Avoid unrelated rewrites.',
      '- Run relevant build/tests and rescan with VibeRaven.',
      '',
      'Provider verification actions:',
      '- Choose whether this app should use ' + providerLabel + ' or ' + detectedLabel + '.',
      '- Use MCP/API if connected. If MCP/API is not available, keep provider dashboard confirmation as manual confirmation, not live proof.',
      '- Do not treat manual dashboard confirmation as an agent-code fix.',
      '',
      'Rules:',
      '- Selected provider is context only and does not mean connected.',
      '- Repo evidence for ' + detectedLabel + ' must not count as ' + providerLabel + ' readiness.',
      '- Provider-live verification requires MCP/API proof; manual confirmation is tracked separately.'
    ].join('\n');
  }
  const agentLines = (contract && Array.isArray(contract.codeGaps) ? contract.codeGaps : []).map(function (item) {
    return '- ' + item.label + (item.detail ? ': ' + item.detail : '');
  });
  const verificationLines = (contract && Array.isArray(contract.needsVerification) ? contract.needsVerification : []).map(function (item) {
    return '- ' + item.label + (item.detail ? ': ' + item.detail : '');
  });
  const humanLines = (contract && Array.isArray(contract.human) ? contract.human : []).map(function (item) {
    return '- ' + item.label + (item.detail ? ': ' + item.detail : '');
  });
  const evidenceLines = (contract && Array.isArray(contract.evidence) ? contract.evidence : []).map(function (item) {
    return '- ' + item.label + (item.detail ? ': ' + item.detail : '');
  });

  return [
    'VibeRaven selected-node production checklist',
    '',
    'Node: ' + label,
    'Selected provider context: ' + providerLabel,
    '',
    'Verified evidence:',
    evidenceLines.length > 0 ? evidenceLines.join('\n') : '- No verified repo or live provider evidence yet.',
    '',
    'Agent-code actions:',
    agentLines.length > 0 ? agentLines.join('\n') : '- Inspect files, routes, config, tests, and deployment wiring before changing code.',
    '- Avoid unrelated rewrites.',
    '- Run relevant build/tests and rescan with VibeRaven.',
    '',
    'Needs verification:',
    verificationLines.length > 0 ? verificationLines.join('\n') : '- No unknown provider state is currently listed.',
    '',
    'Provider verification actions:',
    humanLines.length > 0 ? humanLines.join('\n') : '- No live provider check has been completed yet.',
    '- If MCP/API access is connected or configured, use it to verify the provider live state.',
    '- If MCP/API access is not connected, record provider dashboard review as manual confirmation, not live proof.',
    '- Do not treat manual confirmation as a code fix.',
    '',
    'Rules:',
    '- Selected provider is context only and does not mean connected.',
    '- Repo-detected provider does not mean provider-live verified.',
    '- Provider-live verification requires MCP/API proof. User/dashboard confirmation stays manual.',
    '- Do not represent human-provider actions as completed code fixes.'
  ].join('\n');
}

function selectedNodeStatusBadge(contract) {
  const evidence = contract && Array.isArray(contract.evidence) ? contract.evidence : [];
  const needsVerification = contract && Array.isArray(contract.needsVerification) ? contract.needsVerification : [];
  const codeGaps = contract && Array.isArray(contract.codeGaps) ? contract.codeGaps : [];
  if (contract && contract.providerMismatch) {
    return 'Provider mismatch';
  }
  if (evidence.some(function (item) { return item.tone === 'live'; })) {
    return 'Verified';
  }
  if (evidence.some(function (item) { return item.tone === 'repo'; })) {
    return 'Repo evidence found';
  }
  if (evidence.some(function (item) { return item.tone === 'manual'; })) {
    return 'Manual confirmed';
  }
  if (needsVerification.some(function (item) { return /possible provider/i.test(item.label); })) {
    return 'Possible provider';
  }
  if (codeGaps.length > 0) {
    return 'Missing setup';
  }
  return 'Selected · Not verified';
}

function appendSelectedPathCard(parent, contract) {
  const card = document.createElement('div');
  card.className = 'studio-sidebar-contract__selected-path';
  const title = document.createElement('strong');
  title.textContent = 'Setup';
  const state = document.createElement('em');
  state.className = 'studio-sidebar-contract__setup-state';
  const body = document.createElement('span');
  const area = contract && contract.areaLabel ? contract.areaLabel.toLowerCase() : 'production';
  const hasEvidence = contract && Array.isArray(contract.evidence) && contract.evidence.length > 0;
  state.textContent = hasEvidence ? 'Evidence found' : 'Selected only';
  body.textContent = hasEvidence
    ? contract.providerLabel + ' is selected for ' + area + '. Repo evidence exists; live proof still needs MCP/API verification. Manual confirmation stays separate.'
    : contract.providerLabel + ' is selected for ' + area + '. Repo wiring and live setup are not verified yet.';
  const top = document.createElement('div');
  top.className = 'studio-sidebar-contract__selected-path-top';
  top.append(title, state);
  card.append(top, body);
  parent.appendChild(card);
}

function appendSidebarNextAction(parent, contract, prompt) {
  const codeGaps = contract && Array.isArray(contract.codeGaps) ? contract.codeGaps : [];
  const human = contract && Array.isArray(contract.human) ? contract.human : [];
  const evidence = contract && Array.isArray(contract.evidence) ? contract.evidence : [];
  const needsVerification = contract && Array.isArray(contract.needsVerification) ? contract.needsVerification : [];
  const liveProofRequired = Boolean(contract && contract.liveProofRequired);
  const providerName = contract && contract.providerName ? contract.providerName : '';
  const mcpSnippet = buildMcpSetupSnippet(providerName);
  const mcpState = providerName ? mcpVerifierForProvider(providerName) : { status: 'missing' };
  const verifierStatus = readString(mcpState.status);
  const accessConfirmed = verifierStatus === 'configured' || verifierStatus === 'verified' || verifierStatus === 'connected';
  const hasMcpHelper = Boolean(mcpSnippet);
  const box = document.createElement('div');
  box.className = 'studio-sidebar-contract__next-action';
  const title = document.createElement('strong');
  title.textContent = 'Next best action';
  const note = document.createElement('p');
  const buttonText = contract && contract.providerMismatch
    ? 'Copy provider decision prompt'
    : codeGaps.length > 0
    ? 'Copy focused agent prompt'
    : liveProofRequired && human.length > 0
      ? 'Copy live check prompt'
    : needsVerification.length > 0
        ? 'Copy live check prompt'
      : evidence.length === 0
        ? 'Copy setup prompt'
        : 'Copy live check prompt';
  note.textContent = contract && contract.providerMismatch
    ? 'Choose the intended provider before changing code.'
    : codeGaps.length > 0
    ? 'Inspect repo wiring, patch scoped gaps, then rescan.'
    : liveProofRequired && human.length > 0
      ? 'Use MCP/API if connected. If not, connect MCP/API or confirm the dashboard.'
      : needsVerification.length > 0
        ? 'Review the remaining checks, then rescan.'
      : 'Inspect repo wiring, then verify live setup.';
  const access = document.createElement('div');
  const accessTone = accessConfirmed
    ? ' studio-sidebar-contract__access-state--confirmed'
    : hasMcpHelper
      ? ' studio-sidebar-contract__access-state--needs-connection'
      : '';
  access.className = 'studio-sidebar-contract__access-state' + accessTone;
  const accessLabel = document.createElement('span');
  accessLabel.textContent = 'MCP/API access';
  const accessValue = document.createElement('b');
  accessValue.textContent = accessConfirmed
    ? 'Confirmed'
    : hasMcpHelper
      ? 'Needs connection'
      : 'No MCP/API';
  access.append(accessLabel, accessValue);
  const actions = document.createElement('div');
  actions.className = 'studio-sidebar-contract__actions';
  const copyPrompt = document.createElement('button');
  copyPrompt.type = 'button';
  copyPrompt.className = 'studio-action-button studio-action-button--primary';
  copyPrompt.setAttribute('data-station-action', 'mc-copy-prompt');
  copyPrompt.setAttribute('data-prompt', prompt);
  copyPrompt.textContent = buttonText;
  actions.appendChild(copyPrompt);
  const chatPrompt = document.createElement('button');
  chatPrompt.type = 'button';
  chatPrompt.className = 'studio-action-button';
  chatPrompt.setAttribute('data-station-action', 'mc-use-in-chat');
  chatPrompt.setAttribute('data-prompt', prompt);
  chatPrompt.textContent = 'Put in Chat';
  actions.appendChild(chatPrompt);
  if (liveProofRequired) {
    box.append(title, note, access, actions);
  } else {
    box.append(title, note, actions);
  }
  parent.appendChild(box);
}

function buildSidebarProviderSetupPrompt(category, categoryGaps, providerName) {
  const firstGap = Array.isArray(categoryGaps) && categoryGaps.length > 0 ? categoryGaps[0] : null;
  const stackAutomation = readSelectedStackAutomation(category, providerName);
  const stackWiring = readSelectedStackWiring(category, providerName);
  if (stackAutomation && stackAutomation.repoPrompt) {
    return stackAutomation.repoPrompt;
  }
  if (stackAutomation && stackAutomation.automationLevel === 'manual-only' && stackAutomation.verificationPrompt) {
    return stackAutomation.verificationPrompt;
  }
  if (stackWiring) {
    return buildStackWiringPromptFromPayload(stackWiring);
  }
  if (firstGap) {
    return buildGapCopyPrompt(firstGap);
  }
  return buildProviderSelectionPrompt(category.key, providerName, null);
}

function appendSidebarProviderSetupOptions(parent, category, categoryGaps, contract, focusedPrompt) {
  if (!category || !contract || contract.providerMismatch) {
    return;
  }
  if (!contract.liveProofRequired) {
    return;
  }
  const providerName = contract.providerName || defaultProviderForCategory(category);
  const providerLabel = contract.providerLabel || providerDisplayName(providerName) || providerName || category.label;
  const mcpSnippet = buildMcpSetupSnippet(providerName);
  const supportsMcp = Boolean(mcpSnippet);
  const hasHuman = Array.isArray(contract.human) && contract.human.length > 0;
  const hasSetupPrompt = Boolean(providerName);
  if (!hasSetupPrompt && !supportsMcp && !hasHuman) {
    return;
  }

  const details = document.createElement('details');
  details.className = 'studio-sidebar-contract__provider-options';
  const summary = document.createElement('summary');
  const title = document.createElement('strong');
  title.textContent = 'Provider setup options';
  const badge = document.createElement('span');
  badge.textContent = supportsMcp ? 'Prompt + MCP' : hasHuman ? 'Live check' : 'Prompt';
  summary.append(title, badge);

  const body = document.createElement('div');
  body.className = 'studio-sidebar-contract__provider-options-body';
  const note = document.createElement('p');
  note.textContent = supportsMcp
    ? providerLabel + ' can be checked with MCP/API or confirmed manually. Keep provider-live proof separate from repo evidence.'
    : 'MCP/API is not connected for this provider. To verify live setup, connect MCP/API or confirm the provider dashboard before marking it verified.';
  body.appendChild(note);

  const actions = document.createElement('div');
  actions.className = 'studio-sidebar-contract__provider-options-actions';
  if (hasSetupPrompt) {
    const setupPrompt = buildSidebarProviderSetupPrompt(category, categoryGaps, providerName);
    const copySetup = document.createElement('button');
    copySetup.type = 'button';
    copySetup.className = 'studio-action-button';
    copySetup.setAttribute('data-station-action', 'mc-copy-prompt');
    copySetup.setAttribute('data-prompt', setupPrompt);
    copySetup.textContent = 'Copy setup prompt';
    actions.appendChild(copySetup);
  }
  if (hasHuman) {
    const copyManual = document.createElement('button');
    copyManual.type = 'button';
    copyManual.className = 'studio-action-button';
    copyManual.setAttribute('data-station-action', 'mc-copy-prompt');
    copyManual.setAttribute('data-prompt', focusedPrompt);
    copyManual.textContent = 'Copy live check prompt';
    actions.appendChild(copyManual);
  }
  if (supportsMcp) {
    const mcp = document.createElement('button');
    mcp.type = 'button';
    mcp.className = 'studio-action-button';
    mcp.setAttribute('data-station-action', 'studio-connect-mcp');
    mcp.setAttribute('data-provider', providerName);
    mcp.textContent = 'MCP verify';
    actions.appendChild(mcp);
  }
  body.appendChild(actions);
  details.append(summary, body);
  parent.appendChild(details);
}

function appendSidebarEvidenceDetails(parent, contract) {
  const evidence = contract && Array.isArray(contract.evidence) ? contract.evidence : [];
  const alternativeEvidence = contract && Array.isArray(contract.alternativeEvidence) ? contract.alternativeEvidence : [];
  if (!contract || (evidence.length === 0 && alternativeEvidence.length === 0)) {
    return;
  }
  const isMismatchEvidence = Boolean(contract.providerMismatch && alternativeEvidence.length > 0);
  const detailItems = isMismatchEvidence ? alternativeEvidence : evidence;
  const detailProviderLabel = isMismatchEvidence ? contract.detectedProviderLabel : contract.providerLabel;
  const details = document.createElement('details');
  details.className = 'studio-sidebar-contract__evidence-details';
  const summary = document.createElement('summary');
  const title = document.createElement('strong');
  title.textContent = 'Evidence details';
  const badge = document.createElement('span');
  badge.textContent = (isMismatchEvidence ? 'Detected ' : '') + (detailProviderLabel || 'Provider') + ' · ' + detailItems.length + ' verified signals';
  summary.append(title, badge);
  const note = document.createElement('p');
  note.textContent = isMismatchEvidence
    ? 'These signals belong to ' + detailProviderLabel + ', not ' + contract.providerLabel + '.'
    : 'Verified signals found for ' + contract.providerLabel + '.';
  const list = document.createElement('ul');
  list.className = 'studio-sidebar-contract__evidence-list';
  detailItems.forEach(function (item) {
    const row = document.createElement('li');
    const label = document.createElement('strong');
    label.textContent = item.label;
    const source = document.createElement('em');
    source.textContent = item.source || detailProviderLabel || 'Repo files';
    row.append(label, source);
    list.appendChild(row);
  });
  details.append(summary, note, list);
  parent.appendChild(details);
}

function appendSidebarDetailDisclosure(parent, titleText, badgeText, items, className, noteText) {
  const detailItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (detailItems.length === 0) {
    return;
  }
  const details = document.createElement('details');
  details.className = 'studio-sidebar-contract__detail-row ' + (className || '');
  const summary = document.createElement('summary');
  const title = document.createElement('strong');
  title.textContent = titleText;
  const badge = document.createElement('span');
  badge.textContent = badgeText;
  summary.append(title, badge);
  details.appendChild(summary);
  if (noteText) {
    const note = document.createElement('p');
    note.textContent = noteText;
    details.appendChild(note);
  }
  const list = document.createElement('ul');
  list.className = 'studio-sidebar-contract__detail-list';
  detailItems.forEach(function (item) {
    const row = document.createElement('li');
    const label = document.createElement('strong');
    label.textContent = item.label || 'Check';
    row.appendChild(label);
    if (item.detail) {
      const detail = document.createElement('span');
      detail.textContent = item.detail;
      row.appendChild(detail);
    }
    if (item.next) {
      const next = document.createElement('em');
      next.textContent = item.next;
      row.appendChild(next);
    }
    list.appendChild(row);
  });
  details.appendChild(list);
  parent.appendChild(details);
}

function appendSidebarCollapsedDetails(parent, contract) {
  const codeGaps = contract && Array.isArray(contract.codeGaps) ? contract.codeGaps : [];
  const human = contract && Array.isArray(contract.human) ? contract.human : [];
  const needsVerification = contract && Array.isArray(contract.needsVerification) ? contract.needsVerification : [];
  appendSidebarDetailDisclosure(
    parent,
    'Code gaps',
    codeGaps.length + ' agent-fixable',
    codeGaps,
    'studio-sidebar-contract__detail-row--code',
    'Agent-code work only. Provider dashboard actions stay separate.'
  );
  appendSidebarDetailDisclosure(
    parent,
    'Manual checks',
    human.length + ' need confirmation',
    human,
    'studio-sidebar-contract__detail-row--manual',
    'These require MCP/API/dashboard or human confirmation.'
  );
  appendSidebarDetailDisclosure(
    parent,
    'Verification details',
    needsVerification.length + ' not checked',
    needsVerification,
    'studio-sidebar-contract__detail-row--verify',
    'Unknown provider state is not treated as connected.'
  );
}

function shortSidebarText(value) {
  const text = readString(value).trim();
  if (!text) {
    return '';
  }
  const firstSentence = text.match(/^(.{1,92}?[.!?])(?:\s|$)/);
  return firstSentence ? firstSentence[1] : text.length > 92 ? text.slice(0, 89).trim() + '...' : text;
}

function appendSidebarMoreDetailsGroup(parent, titleText, badgeText, items, noteText) {
  const detailItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (detailItems.length === 0) {
    return;
  }
  const group = document.createElement('div');
  group.className = 'studio-sidebar-contract__more-group';
  const head = document.createElement('div');
  head.className = 'studio-sidebar-contract__more-head';
  const title = document.createElement('strong');
  title.textContent = titleText;
  const badge = document.createElement('span');
  badge.textContent = badgeText;
  head.append(title, badge);
  group.appendChild(head);
  if (noteText) {
    const note = document.createElement('p');
    note.textContent = noteText;
    group.appendChild(note);
  }
  const list = document.createElement('ul');
  list.className = 'studio-sidebar-contract__more-list';
  detailItems.forEach(function (item) {
    const row = document.createElement('li');
    const label = document.createElement('strong');
    label.textContent = item.label || 'Check';
    row.appendChild(label);
    if (item.source) {
      const source = document.createElement('em');
      source.textContent = item.source;
      row.appendChild(source);
    }
    const detail = shortSidebarText(item.next || item.detail);
    if (detail) {
      const detailText = document.createElement('span');
      detailText.textContent = detail;
      row.appendChild(detailText);
    }
    list.appendChild(row);
  });
  group.appendChild(list);
  parent.appendChild(group);
}

function appendSidebarMoreDetails(parent, contract) {
  const evidence = contract && Array.isArray(contract.evidence) ? contract.evidence : [];
  const alternativeEvidence = contract && Array.isArray(contract.alternativeEvidence) ? contract.alternativeEvidence : [];
  const codeGaps = contract && Array.isArray(contract.codeGaps) ? contract.codeGaps : [];
  const human = contract && Array.isArray(contract.human) ? contract.human : [];
  const needsVerification = contract && Array.isArray(contract.needsVerification) ? contract.needsVerification : [];
  const isMismatchEvidence = Boolean(contract && contract.providerMismatch && alternativeEvidence.length > 0);
  const evidenceItems = isMismatchEvidence ? alternativeEvidence : [];
  const total = evidenceItems.length + codeGaps.length + human.length + needsVerification.length;
  if (!contract || total === 0) {
    return;
  }
  const details = document.createElement('details');
  details.className = 'studio-sidebar-contract__more-details';
  const summary = document.createElement('summary');
  const title = document.createElement('strong');
  title.textContent = 'More details';
  const badge = document.createElement('span');
  badge.textContent = total + ' item' + (total === 1 ? '' : 's');
  summary.append(title, badge);
  const body = document.createElement('div');
  body.className = 'studio-sidebar-contract__more-body';
  appendSidebarMoreDetailsGroup(
    body,
    isMismatchEvidence ? 'Detected evidence' : 'Evidence',
    evidenceItems.length + ' signal' + (evidenceItems.length === 1 ? '' : 's'),
    evidenceItems,
    isMismatchEvidence ? 'Belongs to ' + contract.detectedProviderLabel + ', not ' + contract.providerLabel + '.' : ''
  );
  appendSidebarMoreDetailsGroup(body, 'Code gaps', codeGaps.length + '', codeGaps, '');
  appendSidebarMoreDetailsGroup(body, 'Needs verification', needsVerification.length + '', needsVerification, '');
  appendSidebarMoreDetailsGroup(body, 'Manual checks', human.length + '', human, '');
  details.append(summary, body);
  parent.appendChild(details);
}

function appendDeferredSetup(parent, titleText, badgeText, contentBlocks) {
  const blocks = Array.isArray(contentBlocks) ? contentBlocks.filter(Boolean) : [];
  if (blocks.length === 0) {
    return;
  }
  const details = document.createElement('details');
  details.className = 'studio-sidebar-contract__deferred-setup';
  const summary = document.createElement('summary');
  const title = document.createElement('strong');
  title.textContent = titleText;
  const note = document.createElement('span');
  note.textContent = badgeText;
  summary.append(title, note);
  const body = document.createElement('div');
  body.className = 'studio-sidebar-contract__deferred-body';
  blocks.forEach(function (block) {
    body.appendChild(block);
  });
  details.append(summary, body);
  parent.appendChild(details);
}

function shouldRenderSelectedNodeSidebarContract(category, selectedProvider) {
  if (!category || !category.key || !selectedProvider) {
    return false;
  }
  if (isToolSelectedForCategory(category.key, selectedProvider)) {
    return true;
  }
  const area = category.area || PRODUCTION_CHOICE_CATEGORY_AREAS[category.key] || '';
  const choices = isRecord(productionConnectionChoices) && isRecord(productionConnectionChoices.choices)
    ? productionConnectionChoices.choices
    : {};
  const choice = area ? choices[area] : null;
  if (
    isRecord(choice) &&
    normalizeProductionChoiceProvider(readString(choice.provider)) === normalizeProductionChoiceProvider(selectedProvider)
  ) {
    return true;
  }
  const summary = productionConnectionSummaryForCategory(category.key);
  return isRecord(summary) &&
    normalizeProductionChoiceProvider(readString(summary.provider)) === normalizeProductionChoiceProvider(selectedProvider);
}

function renderSelectedNodeSidebarContract(category, categoryGaps, selectedProvider, existingContract) {
  const contract = existingContract || buildSelectedNodeSidebarContract(category, categoryGaps, selectedProvider);
  const block = document.createElement('section');
  block.className = 'studio-sidebar-contract';
  block.setAttribute('aria-label', 'Selected node production checklist');

  appendSelectedNodeReadiness(block, contract);
  appendSidebarRepoSignalsCard(block, contract);
  appendGenericAreaEvidenceCard(block, category);
  appendSidebarAttention(block, contract);
  const prompt = buildSelectedNodeFocusedPrompt(category, contract);
  appendSidebarNextAction(block, contract, prompt);
  appendSidebarProviderSetupOptions(block, category, categoryGaps, contract, prompt);
  if (contract.providerMismatch) {
    appendSidebarMoreDetails(block, contract);
  }
  return block;
}

function readSupabaseDatabaseWiring() {
  const payload = isRecord(lastPayload) ? lastPayload : {};
  const stackWiring = isRecord(payload.stackWiring) ? payload.stackWiring : {};
  const wiring = isRecord(stackWiring.supabaseDatabase) ? stackWiring.supabaseDatabase : null;
  if (!wiring || !Array.isArray(wiring.items)) {
    return null;
  }
  return {
    provider: readString(wiring.provider) || 'supabase',
    area: readString(wiring.area) || 'database',
    passedCount: typeof wiring.passedCount === 'number' ? wiring.passedCount : 0,
    totalCount: typeof wiring.totalCount === 'number' ? wiring.totalCount : wiring.items.length,
    readinessPercent: typeof wiring.readinessPercent === 'number' ? wiring.readinessPercent : 0,
    items: wiring.items
      .filter(function (item) {
        return isRecord(item) && readString(item.id) && readString(item.label);
      })
      .map(function (item) {
        return {
          id: readString(item.id),
          label: readString(item.label),
          status: readString(item.status),
          evidence: Array.isArray(item.evidence) ? item.evidence.map(readString).filter(Boolean) : [],
          promptHint: readString(item.promptHint)
        };
      })
  };
}

function normalizeStackWiringProviderSummary(wiring) {
  if (!isRecord(wiring) || !Array.isArray(wiring.items)) {
    return null;
  }
  return {
    key: readString(wiring.key),
    provider: readString(wiring.provider),
    providerLabel: readString(wiring.providerLabel) || providerDisplayName(readString(wiring.provider)) || readString(wiring.provider),
    area: readString(wiring.area),
    areaLabel: readString(wiring.areaLabel),
    promptSubject: readString(wiring.promptSubject) || readString(wiring.providerLabel) || readString(wiring.provider),
    passedCount: typeof wiring.passedCount === 'number' ? wiring.passedCount : 0,
    totalCount: typeof wiring.totalCount === 'number' ? wiring.totalCount : wiring.items.length,
    readinessPercent: typeof wiring.readinessPercent === 'number' ? wiring.readinessPercent : 0,
    items: wiring.items
      .filter(function (item) {
        return isRecord(item) && readString(item.id) && readString(item.label);
      })
      .map(function (item) {
        return {
          id: readString(item.id),
          label: readString(item.label),
          status: readString(item.status),
          evidence: Array.isArray(item.evidence) ? item.evidence.map(readString).filter(Boolean) : [],
          promptHint: readString(item.promptHint)
        };
      })
  };
}

function readStackWiringSummary() {
  const payload = isRecord(lastPayload) ? lastPayload : {};
  const stackWiring = isRecord(payload.stackWiring) ? payload.stackWiring : {};
  const byKey = {};
  if (isRecord(stackWiring.byKey)) {
    Object.keys(stackWiring.byKey).forEach(function (key) {
      const summary = normalizeStackWiringProviderSummary(stackWiring.byKey[key]);
      if (summary && summary.key) {
        byKey[summary.key] = summary;
      }
    });
  }
  if (Array.isArray(stackWiring.items)) {
    stackWiring.items.forEach(function (entry) {
      const summary = normalizeStackWiringProviderSummary(entry);
      if (summary && summary.key && !byKey[summary.key]) {
        byKey[summary.key] = summary;
      }
    });
  }
  const legacySupabase = normalizeStackWiringProviderSummary(stackWiring.supabaseDatabase);
  if (legacySupabase && !legacySupabase.key) {
    legacySupabase.key = 'supabase-database';
  }
  if (legacySupabase && !byKey[legacySupabase.key]) {
    byKey[legacySupabase.key] = legacySupabase;
  }
  return byKey;
}

function stackWiringKeyForPanel(category, selectedProvider) {
  if (!category) {
    return '';
  }
  const provider = normalizeProductionChoiceProvider(selectedProvider || selectedProviderForCategory(category.key) || defaultProviderForCategory(category));
  const categoryKey = category.key;
  if (categoryKey === 'appFlow' && provider === 'figma') {
    return 'figma-app-flow';
  }
  if (categoryKey === 'appFlow' && provider === 'storybook') {
    return 'storybook-app-flow';
  }
  if (categoryKey === 'appFlow' && provider === 'product-spec') {
    return 'product-spec-app-flow';
  }
  if (categoryKey === 'appFlow' && provider === 'route-map') {
    return 'route-map-app-flow';
  }
  if (categoryKey === 'frontend' && provider === 'react') {
    return 'react-frontend';
  }
  if (categoryKey === 'frontend' && provider === 'vue') {
    return 'vue-frontend';
  }
  if (categoryKey === 'frontend' && provider === 'svelte') {
    return 'svelte-frontend';
  }
  if (categoryKey === 'frontend' && provider === 'angular') {
    return 'angular-frontend';
  }
  if (categoryKey === 'backend' && provider === 'nodejs') {
    return 'node-backend';
  }
  if (categoryKey === 'backend' && provider === 'python') {
    return 'python-backend';
  }
  if (categoryKey === 'backend' && provider === 'rails') {
    return 'rails-backend';
  }
  if (categoryKey === 'backend' && provider === 'go') {
    return 'go-backend';
  }
  if (categoryKey === 'security' && provider === 'rate-limit') {
    return 'rate-limit-security';
  }
  if (categoryKey === 'security' && provider === 'bot-protection') {
    return 'bot-protection-security';
  }
  if (categoryKey === 'security' && provider === 'secrets-hygiene') {
    return 'secrets-hygiene-security';
  }
  if (categoryKey === 'database' && provider === 'supabase') {
    return 'supabase-database';
  }
  if (categoryKey === 'database' && provider === 'firebase') {
    return 'firebase-database';
  }
  if (categoryKey === 'database' && provider === 'neon') {
    return 'neon-database';
  }
  if (categoryKey === 'database' && provider === 'turso') {
    return 'turso-database';
  }
  if (categoryKey === 'database' && provider === 'mongodb') {
    return 'mongodb-database';
  }
  if (categoryKey === 'database' && provider === 'planetscale') {
    return 'planetscale-database';
  }
  if (categoryKey === 'auth' && provider === 'clerk') {
    return 'clerk-auth';
  }
  if (categoryKey === 'auth' && provider === 'authjs') {
    return 'authjs-auth';
  }
  if (categoryKey === 'auth' && provider === 'auth0') {
    return 'auth0-auth';
  }
  if (categoryKey === 'auth' && provider === 'better-auth') {
    return 'better-auth-auth';
  }
  if (categoryKey === 'auth' && provider === 'supabase') {
    return 'supabase-auth';
  }
  if (categoryKey === 'payments' && provider === 'stripe') {
    return 'stripe-payments';
  }
  if (categoryKey === 'payments' && provider === 'paddle') {
    return 'paddle-payments';
  }
  if (categoryKey === 'payments' && provider === 'polar') {
    return 'polar-payments';
  }
  if (categoryKey === 'payments' && provider === 'lemon-squeezy') {
    return 'lemon-squeezy-payments';
  }
  if (categoryKey === 'deployment' && provider === 'vercel') {
    return 'vercel-deployment';
  }
  if (categoryKey === 'deployment' && provider === 'netlify') {
    return 'netlify-deployment';
  }
  if (categoryKey === 'deployment' && provider === 'render') {
    return 'render-deployment';
  }
  if (categoryKey === 'deployment' && provider === 'railway') {
    return 'railway-deployment';
  }
  if (categoryKey === 'deployment' && provider === 'cloudflare') {
    return 'cloudflare-deployment';
  }
  if (categoryKey === 'deployment' && provider === 'aws') {
    return 'aws-deployment';
  }
  if (categoryKey === 'landing' && provider === 'supabase') {
    return 'supabase-landing';
  }
  if ((categoryKey === 'monitoring' || categoryKey === 'errorHandling') && provider === 'sentry') {
    return categoryKey === 'errorHandling' ? 'sentry-error-handling' : 'sentry-monitoring';
  }
  if ((categoryKey === 'monitoring' || categoryKey === 'landing') && provider === 'posthog') {
    return 'posthog-monitoring';
  }
  if (categoryKey === 'errorHandling' && provider === 'posthog') {
    return 'posthog-error-handling';
  }
  if (categoryKey === 'monitoring' && provider === 'logrocket') {
    return 'logrocket-monitoring';
  }
  if (categoryKey === 'testing' && provider === 'vitest') {
    return 'vitest-testing';
  }
  if (categoryKey === 'testing' && provider === 'playwright') {
    return 'playwright-testing';
  }
  return '';
}

function readSelectedStackWiring(category, selectedProvider) {
  const key = stackWiringKeyForPanel(category, selectedProvider);
  if (!key) {
    return null;
  }
  const byKey = readStackWiringSummary();
  if (byKey[key]) {
    return byKey[key];
  }
  const provider = normalizeProductionChoiceProvider(selectedProvider || defaultProviderForCategory(category));
  const area = category.area || PRODUCTION_CHOICE_CATEGORY_AREAS[category.key] || category.key;
  const keys = Object.keys(byKey);
  for (let i = 0; i < keys.length; i++) {
    const summary = byKey[keys[i]];
    if (
      isRecord(summary) &&
      normalizeProductionChoiceProvider(readString(summary.provider)) === provider &&
      (readString(summary.area) === area || readString(summary.area) === category.key)
    ) {
      return summary;
    }
  }
  return null;
}

function normalizeMissionCheck(check) {
  if (!isRecord(check)) {
    return null;
  }
  const id = readString(check.id);
  const label = readString(check.label);
  if (!id || !label) {
    return null;
  }
  return {
    id: id,
    label: label,
    providerKey: readString(check.providerKey),
    providerLabel: readString(check.providerLabel),
    area: readString(check.area),
    areaLabel: readString(check.areaLabel),
    evidenceClass: readString(check.evidenceClass),
    status: readString(check.status),
    evidence: Array.isArray(check.evidence) ? check.evidence.map(readString).filter(Boolean) : [],
    promptHint: readString(check.promptHint)
  };
}

function normalizeProviderMission(mission, fallbackKey) {
  if (!isRecord(mission) || !Array.isArray(mission.checks)) {
    return null;
  }
  const key = readString(mission.key) || readString(fallbackKey);
  if (!key) {
    return null;
  }
  return {
    key: key,
    provider: readString(mission.provider),
    providerLabel: readString(mission.providerLabel) || providerDisplayName(readString(mission.provider)) || readString(mission.provider),
    area: readString(mission.area),
    areaLabel: readString(mission.areaLabel),
    promptSubject: readString(mission.promptSubject),
    readinessPercent: typeof mission.readinessPercent === 'number' ? mission.readinessPercent : 0,
    checks: mission.checks
      .map(normalizeMissionCheck)
      .filter(function (check) {
        return Boolean(check);
      })
  };
}

function readMissionGraph() {
  const payload = isRecord(lastPayload) ? lastPayload : {};
  const graph = isRecord(payload.missionGraph) ? payload.missionGraph : {};
  const byProvider = {};
  if (isRecord(graph.byProvider)) {
    Object.keys(graph.byProvider).forEach(function (key) {
      const mission = normalizeProviderMission(graph.byProvider[key], key);
      if (mission && mission.key) {
        byProvider[mission.key] = mission;
      }
    });
  }
  if (Array.isArray(graph.areas)) {
    graph.areas.forEach(function (area) {
      if (!isRecord(area) || !Array.isArray(area.providerMissions)) {
        return;
      }
      area.providerMissions.forEach(function (entry) {
        const mission = normalizeProviderMission(entry);
        if (mission && mission.key && !byProvider[mission.key]) {
          byProvider[mission.key] = mission;
        }
      });
    });
  }
  const byArea = {};
  if (isRecord(graph.byArea)) {
    Object.keys(graph.byArea).forEach(function (key) {
      const area = graph.byArea[key];
      if (!isRecord(area)) {
        return;
      }
      byArea[key] = {
        key: readString(area.key) || key,
        label: readString(area.label),
        readinessPercent: typeof area.readinessPercent === 'number' ? area.readinessPercent : 0,
        criticalCount: typeof area.criticalCount === 'number' ? area.criticalCount : 0
      };
    });
  }
  return { byProvider: byProvider, byArea: byArea };
}

function readStaticInfrastructureFlowGraph() {
  const payload = isRecord(lastPayload) ? lastPayload : {};
  if (isRecord(payload.staticInfrastructureFlowGraph)) {
    return payload.staticInfrastructureFlowGraph;
  }
  const missionGraph = isRecord(payload.missionGraph) ? payload.missionGraph : {};
  return isRecord(missionGraph.staticInfrastructureFlowGraph)
    ? missionGraph.staticInfrastructureFlowGraph
    : {};
}

const SIFG_MAX_LEAKS_TO_NORMALIZE = 25;
const SIFG_MAX_PATHS_TO_NORMALIZE = 20;
const SIFG_SUMMARY_MAX_LENGTH = 240;
const SIFG_PATH_MAX_LENGTH = 180;
const SIFG_PRE_REDACTION_MAX_LENGTH = 2048;

function normalizeSifgAreaToken(value) {
  return stripHtml(readString(value))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function redactSifgText(value) {
  return stripHtml(readString(value))
    .replace(/\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9_=-]{8,}\b/g, '[redacted]')
    .replace(/\bgithub_pat_[A-Za-z0-9_]{8,}\b/g, '[redacted]')
    .replace(/\bgh[pousr]_[A-Za-z0-9_]{8,}\b/g, '[redacted]')
    .replace(/\bxox[baprs]-[A-Za-z0-9-]{8,}\b/g, '[redacted]')
    .replace(/\b[A-Z0-9_]*(?:SECRET|TOKEN|KEY|PASSWORD)[A-Z0-9_]*\s*[:=]\s*[^/\\\s]+/gi, '[redacted]');
}

function clampSifgDisplayText(value, maxLength) {
  const text = readString(value);
  const max = typeof maxLength === 'number' && maxLength > 12 ? maxLength : 120;
  if (text.length <= max) {
    return text;
  }
  return text.slice(0, max - 3).trimEnd() + '...';
}

function sanitizeSifgDisplayText(value, maxLength) {
  const preClamped = clampSifgDisplayText(value, SIFG_PRE_REDACTION_MAX_LENGTH);
  return clampSifgDisplayText(redactSifgText(preClamped), maxLength).trim();
}

function normalizeSifgPathEntry(entry) {
  if (typeof entry === 'string') {
    const value = sanitizeSifgDisplayText(entry, SIFG_PATH_MAX_LENGTH);
    if (!value || value.indexOf('=') >= 0 || !/[/.\\]/.test(value)) {
      return '';
    }
    return value;
  }
  if (!isRecord(entry)) {
    return '';
  }
  const filePath = sanitizeSifgDisplayText(
    readString(entry.path) ||
    readString(entry.file) ||
    readString(entry.filePath) ||
    readString(entry.filename),
    SIFG_PATH_MAX_LENGTH
  );
  if (!filePath) {
    return '';
  }
  const range = isRecord(entry.range) ? entry.range : {};
  const startLine = typeof entry.startLine === 'number'
    ? entry.startLine
    : typeof range.startLine === 'number'
      ? range.startLine
    : typeof entry.line === 'number'
      ? entry.line
      : typeof entry.start === 'number'
        ? entry.start
        : 0;
  const endLine = typeof entry.endLine === 'number'
    ? entry.endLine
    : typeof range.endLine === 'number'
      ? range.endLine
    : typeof entry.end === 'number'
      ? entry.end
      : 0;
  if (startLine > 0 && endLine > 0) {
    return filePath + ':' + startLine + '-' + endLine;
  }
  if (startLine > 0) {
    return filePath + ':' + startLine;
  }
  return filePath;
}

function normalizeSifgPathEntries(leak) {
  if (!isRecord(leak)) {
    return [];
  }
  const sources = [
    leak.evidencePath,
    leak.evidencePaths,
    leak.paths,
    leak.files,
    leak.evidence
  ];
  const paths = [];
  sources.forEach(function (source) {
    if (!Array.isArray(source) || paths.length >= SIFG_MAX_PATHS_TO_NORMALIZE) {
      return;
    }
    source.slice(0, Math.max(0, SIFG_MAX_PATHS_TO_NORMALIZE - paths.length)).forEach(function (entry) {
      const path = normalizeSifgPathEntry(entry);
      if (path && paths.indexOf(path) < 0) {
        paths.push(path);
      }
    });
  });
  return paths;
}

function normalizeSifgLeak(leak) {
  if (!isRecord(leak)) {
    return null;
  }
  const summary = sanitizeSifgDisplayText(
    leak.summary ||
    leak.title ||
    leak.message ||
    leak.description ||
    'Structural repo path needs review.',
    SIFG_SUMMARY_MAX_LENGTH
  );
  const areaTokens = [
    leak.categoryKey,
    leak.category,
    leak.areaKey,
    leak.area,
    leak.dimensionKey,
    leak.dimension
  ]
    .map(normalizeSifgAreaToken)
    .filter(Boolean);
  return {
    summary: summary || 'Structural repo path needs review.',
    areaTokens: areaTokens,
    paths: normalizeSifgPathEntries(leak)
  };
}

function sifgLeaksForCategory(categoryKey) {
  const category = getProductionCategory(categoryKey);
  const matchTokens = [
    categoryKey,
    category && category.key,
    category && category.area,
    category && category.label
  ]
    .map(normalizeSifgAreaToken)
    .filter(Boolean);
  if (matchTokens.length === 0) {
    return [];
  }
  const graph = readStaticInfrastructureFlowGraph();
  const leaks = Array.isArray(graph.leaks) ? graph.leaks : [];
  return leaks
    .slice(0, SIFG_MAX_LEAKS_TO_NORMALIZE)
    .map(normalizeSifgLeak)
    .filter(function (leak) {
      if (!leak || !Array.isArray(leak.areaTokens)) {
        return false;
      }
      return leak.areaTokens.some(function (token) {
        return matchTokens.indexOf(token) >= 0;
      });
    });
}

function readMissionAreaForCategory(categoryKey) {
  const graph = readMissionGraph();
  return graph.byArea[categoryKey] || null;
}

function readSelectedProviderMission(category, selectedProvider) {
  const key = stackWiringKeyForPanel(category, selectedProvider);
  if (!key) {
    return null;
  }
  const graph = readMissionGraph();
  if (graph.byProvider[key]) {
    return graph.byProvider[key];
  }
  const provider = normalizeProductionChoiceProvider(selectedProvider || defaultProviderForCategory(category));
  const area = category.area || PRODUCTION_CHOICE_CATEGORY_AREAS[category.key] || category.key;
  const keys = Object.keys(graph.byProvider);
  for (let i = 0; i < keys.length; i++) {
    const mission = graph.byProvider[keys[i]];
    if (
      isRecord(mission) &&
      normalizeProductionChoiceProvider(readString(mission.provider)) === provider &&
      (readString(mission.area) === area || readString(mission.area) === category.key)
    ) {
      return mission;
    }
  }
  return null;
}

function readSelectedMissionStats(category, selectedProvider) {
  const mission = readSelectedProviderMission(category, selectedProvider);
  if (!mission) {
    return null;
  }
  const checks = Array.isArray(mission.checks) ? mission.checks : [];
  const missingRepoFixCount = checks.filter(function (check) {
    return isRecord(check) && missionCheckGroupKey(check) === 'missing-repo-fix';
  }).length;
  const providerOpenCount = checks.filter(function (check) {
    return isRecord(check) && missionCheckGroupKey(check) === 'mcp-verifier';
  }).length;
  return {
    readinessPercent: typeof mission.readinessPercent === 'number'
      ? Math.max(0, Math.min(100, Math.round(mission.readinessPercent)))
      : 0,
    missingRepoFixCount: missingRepoFixCount,
    providerOpenCount: providerOpenCount
  };
}

function providerHasMissionRepoEvidence(providerOrToolName) {
  const provider = normalizeProductionChoiceProvider(providerOrToolName);
  if (!provider) {
    return false;
  }
  const graph = readMissionGraph();
  return Object.keys(graph.byProvider).some(function (key) {
    const mission = graph.byProvider[key];
    if (!isRecord(mission) || normalizeProductionChoiceProvider(mission.provider) !== provider) {
      return false;
    }
    return Array.isArray(mission.checks) && mission.checks.some(function (check) {
      return isRecord(check) &&
        readString(check.evidenceClass) === 'repo-verified' &&
        readString(check.status) === 'passed';
    });
  });
}

function normalizeStackAutomationAction(action) {
  if (!isRecord(action)) {
    return null;
  }
  const id = readString(action.id);
  const label = readString(action.label);
  if (!id || !label) {
    return null;
  }
  return {
    id: id,
    label: label,
    status: readString(action.status),
    promptHint: readString(action.promptHint),
    evidence: Array.isArray(action.evidence) ? action.evidence.map(readString).filter(Boolean) : []
  };
}

function normalizeStackAutomationActions(actions) {
  if (!Array.isArray(actions)) {
    return [];
  }
  return actions
    .map(normalizeStackAutomationAction)
    .filter(function (action) {
      return Boolean(action);
    });
}

function normalizeStackAutomationRecipe(recipe) {
  if (!isRecord(recipe)) {
    return null;
  }
  const key = readString(recipe.key);
  if (!key) {
    return null;
  }
  return {
    key: key,
    provider: readString(recipe.provider),
    providerLabel: readString(recipe.providerLabel) || providerDisplayName(readString(recipe.provider)) || readString(recipe.provider),
    area: readString(recipe.area),
    promptSubject: readString(recipe.promptSubject),
    readinessPercent: typeof recipe.readinessPercent === 'number' ? recipe.readinessPercent : 0,
    automationLevel: readString(recipe.automationLevel),
    repoFixes: normalizeStackAutomationActions(recipe.repoFixes),
    manualChecks: normalizeStackAutomationActions(recipe.manualChecks),
    confirmedChecks: normalizeStackAutomationActions(recipe.confirmedChecks),
    mcpProvider: readString(recipe.mcpProvider),
    repoPrompt: readString(recipe.repoPrompt),
    verificationPrompt: readString(recipe.verificationPrompt)
  };
}

function readStackAutomationSummary() {
  const payload = isRecord(lastPayload) ? lastPayload : {};
  const stackAutomation = isRecord(payload.stackAutomation) ? payload.stackAutomation : {};
  const byKey = {};
  if (isRecord(stackAutomation.byKey)) {
    Object.keys(stackAutomation.byKey).forEach(function (key) {
      const value = isRecord(stackAutomation.byKey[key]) ? Object.assign({}, stackAutomation.byKey[key]) : stackAutomation.byKey[key];
      if (isRecord(value) && !readString(value.key)) {
        value.key = key;
      }
      const recipe = normalizeStackAutomationRecipe(value);
      if (recipe && recipe.key) {
        byKey[recipe.key] = recipe;
      }
    });
  }
  if (Array.isArray(stackAutomation.items)) {
    stackAutomation.items.forEach(function (entry) {
      const recipe = normalizeStackAutomationRecipe(entry);
      if (recipe && recipe.key && !byKey[recipe.key]) {
        byKey[recipe.key] = recipe;
      }
    });
  }
  return byKey;
}

function readSelectedStackAutomation(category, selectedProvider) {
  const key = stackWiringKeyForPanel(category, selectedProvider);
  if (!key) {
    return null;
  }
  const byKey = readStackAutomationSummary();
  return byKey[key] || null;
}

function manualConfirmationLookupKey(providerKey, checkId) {
  const provider = readString(providerKey);
  const check = readString(checkId);
  return provider + '::' + check;
}

function normalizeManualProviderKey(value) {
  return normalizeProductionChoiceProvider(value) || normalizeToolKey(value) || readString(value);
}

function manualConfirmationProviderKey(record) {
  if (!isRecord(record)) {
    return '';
  }
  return readString(record.providerKey) ||
    normalizeManualProviderKey(readString(record.provider) || readString(record.providerLabel));
}

function normalizeManualConfirmationRecord(record) {
  if (!isRecord(record)) {
    return null;
  }
  const checkId = readString(record.checkId) || readString(record.id);
  const providerKey = manualConfirmationProviderKey(record);
  if (!checkId || !providerKey) {
    return null;
  }
  return {
    providerKey: providerKey,
    checkId: checkId,
    providerLabel: readString(record.providerLabel),
    areaLabel: readString(record.areaLabel),
    label: readString(record.label),
    confirmedAt: readString(record.confirmedAt) || readString(record.updatedAt),
    status: readString(record.status).toLowerCase()
  };
}

function setManualConfirmationState(state) {
  const source = isRecord(state) ? state : {};
  const records = Array.isArray(source.records)
    ? source.records.map(normalizeManualConfirmationRecord).filter(function (record) {
      return Boolean(record);
    })
    : [];
  manualConfirmationState = {
    version: 1,
    records: records
  };
  manualConfirmationsByCheck = {};
  records.forEach(function (record) {
    manualConfirmationsByCheck[manualConfirmationLookupKey(record.providerKey, record.checkId)] = record;
    const labelKey = normalizeManualProviderKey(record.providerLabel);
    if (labelKey) {
      manualConfirmationsByCheck[manualConfirmationLookupKey(labelKey, record.checkId)] = record;
    }
  });
}

function manualConfirmationForCheck(check) {
  if (!isRecord(check)) {
    return null;
  }
  const checkId = readString(check.checkId) || readString(check.id);
  if (!checkId) {
    return null;
  }
  const providerKeys = [];
  const providerKey = readString(check.providerKey);
  if (providerKey) {
    providerKeys.push(providerKey);
  }
  [readString(check.provider), readString(check.providerLabel)].forEach(function (value) {
    const alias = normalizeManualProviderKey(value);
    if (alias && providerKeys.indexOf(alias) < 0) {
      providerKeys.push(alias);
    }
  });
  for (let i = 0; i < providerKeys.length; i++) {
    const record = manualConfirmationsByCheck[manualConfirmationLookupKey(providerKeys[i], checkId)];
    if (record) {
      return record;
    }
  }
  return null;
}

function normalizeMcpVerifierRecord(record) {
  if (!isRecord(record)) {
    return null;
  }
  const providerKey = normalizeManualProviderKey(
    readString(record.providerKey) || readString(record.provider) || readString(record.providerLabel)
  );
  if (!providerKey) {
    return null;
  }
  const rawStatus = readString(record.status).toLowerCase();
  const status = ['configured', 'missing', 'unsupported', 'stale'].indexOf(rawStatus) >= 0
    ? rawStatus
    : 'missing';
  return {
    providerKey: providerKey,
    providerLabel: readString(record.providerLabel),
    status: status,
    checkedAt: readString(record.checkedAt)
  };
}

function setMcpVerifierState(snapshot) {
  const source = isRecord(snapshot) ? snapshot : {};
  const records = Array.isArray(source.records)
    ? source.records.map(normalizeMcpVerifierRecord).filter(function (record) {
      return Boolean(record);
    })
    : [];
  mcpVerifierState = {
    version: 1,
    checkedAt: readString(source.checkedAt),
    records: records
  };
  mcpVerifierByProvider = {};
  records.forEach(function (record) {
    mcpVerifierByProvider[record.providerKey] = record;
    const labelKey = normalizeManualProviderKey(record.providerLabel);
    if (labelKey && !mcpVerifierByProvider[labelKey]) {
      mcpVerifierByProvider[labelKey] = record;
    }
  });
}

function mcpVerifierForProvider(provider) {
  const key = normalizeManualProviderKey(provider);
  if (!key) {
    return { status: 'missing', checkedAt: '' };
  }
  return mcpVerifierByProvider[key] || { providerKey: key, status: 'missing', checkedAt: '' };
}

function isSupabaseDatabasePanel(category, selectedProvider) {
  return Boolean(
    category &&
    category.key === 'database' &&
    normalizeProductionChoiceProvider(selectedProvider || selectedProviderForCategory(category.key)) === 'supabase'
  );
}

function shouldRenderGenericVerification(category, selectedProvider) {
  if (selectedProvider) {
    return false;
  }
  if (readSelectedProviderMission(category, selectedProvider)) {
    return false;
  }
  if (readSelectedStackWiring(category, selectedProvider)) {
    return false;
  }
  const summary = readGenericVerificationSummary(category);
  if (!genericVerificationMatchesSelectedProvider(category, selectedProvider, summary)) {
    return false;
  }
  return true;
}

function renderSupabaseWiringBlock(category, selectedProvider) {
  if (!isSupabaseDatabasePanel(category, selectedProvider)) {
    return null;
  }
  const wiring = readSupabaseDatabaseWiring();
  if (!wiring) {
    return null;
  }

  const block = document.createElement('section');
  block.className = 'studio-verification studio-wiring studio-mission-graph';
  block.setAttribute('aria-label', 'Supabase database wiring');
  const missingCount = wiring.items.filter(function (item) {
    return item.status === 'missing';
  }).length;
  const manualCount = wiring.items.filter(function (item) {
    return item.status === 'manual';
  }).length;

  const groups = {
    passed: [],
    missing: [],
    manual: []
  };
  wiring.items.forEach(function (item) {
    const status = ['passed', 'missing', 'manual'].indexOf(item.status) >= 0 ? item.status : 'manual';
    groups[status].push({
      label: item.label,
      status: status === 'passed' ? 'passed' : status,
      source: item.evidence.length > 0 ? item.evidence.join('; ') : item.promptHint,
      detail: item.evidence.join('; ')
    });
  });

  appendStackReadinessCards(block, 'Supabase', wiring, groups);
  appendVerificationGroup(block, 'Dashboard check', groups.manual, 'manual');
  appendConfirmedStackEvidence(block, 'Supabase', groups.passed, manualCount);

  return block;
}

function appendConfirmedStackEvidence(block, providerLabel, passedItems, manualCount) {
  void block;
  void providerLabel;
  void passedItems;
  void manualCount;
  return;
}

function missionCheckToVerificationItem(check) {
  const evidence = Array.isArray(check.evidence) ? check.evidence : [];
  return {
    label: check.label,
    status: check.status === 'passed' ? 'found' : check.status,
    source: evidence.length > 0 ? evidence.join('; ') : check.promptHint,
    detail: evidence.join('; ')
  };
}

function missionCheckGroupKey(check) {
  const source = readString(check && check.evidenceSource);
  const status = readString(check && check.status);
  const evidenceClass = readString(check && check.evidenceClass);
  if (evidenceClass === 'manual-dashboard') {
    return 'manual-dashboard';
  }
  if (source === 'provider' || source === 'mcp' || evidenceClass === 'mcp-verifier' || status === 'needs-connection' || status === 'unknown') {
    return 'mcp-verifier';
  }
  if (evidenceClass === 'repo-verified' || status === 'passed') {
    return 'repo-verified';
  }
  return 'missing-repo-fix';
}

function providerChecksForMission(mission) {
  const checks = mission && Array.isArray(mission.checks) ? mission.checks : [];
  return checks.filter(function (check) {
    const source = readString(check && check.evidenceSource);
    const evidenceClass = readString(check && check.evidenceClass);
    return source === 'provider' || source === 'mcp' || evidenceClass === 'mcp-verifier';
  });
}

function missionProviderStatusLabel(mission, providerPercent) {
  const checks = providerChecksForMission(mission);
  if (checks.length === 0) {
    return 'No live checks';
  }
  const hasConnectionNeeded = checks.some(function (check) {
    const status = readString(check && check.status);
    const verification = readString(check && check.verificationStatus);
    return status === 'needs-connection' || verification === 'needs_mcp';
  });
  if (hasConnectionNeeded) {
    return 'Needs MCP';
  }
  if (providerPercent > 0) {
    return providerPercent + '%';
  }
  return 'Not checked';
}

function appendReadinessMeters(block, mission) {
  const repoPercent = typeof mission.repoReadinessPercent === 'number'
    ? Math.max(0, Math.min(100, Math.round(mission.repoReadinessPercent)))
    : Math.max(0, Math.min(100, Math.round(mission.readinessPercent || 0)));
  const providerPercent = typeof mission.providerReadinessPercent === 'number'
    ? Math.max(0, Math.min(100, Math.round(mission.providerReadinessPercent)))
    : 0;
  const providerValue = missionProviderStatusLabel(mission, providerPercent);
  const meters = document.createElement('div');
  meters.className = 'studio-provider-readiness__meters';
  meters.setAttribute('aria-label', 'Repo and live provider readiness');

  function row(label, percent, value) {
    const item = document.createElement('div');
    item.className = 'studio-provider-readiness__meter-row';
    const name = document.createElement('span');
    name.textContent = label;
    const bar = document.createElement('span');
    bar.className = 'studio-provider-readiness__bar';
    bar.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('span');
    fill.className = 'studio-provider-readiness__bar-fill';
    fill.style.width = percent + '%';
    bar.appendChild(fill);
    const valueNode = document.createElement('strong');
    valueNode.textContent = value;
    item.append(name, bar, valueNode);
    return item;
  }

  meters.append(
    row('Repo - files', repoPercent, repoPercent + '%'),
    row('Provider - live', providerPercent, providerValue)
  );
  block.appendChild(meters);
}

function createMissionReadinessRows(mission) {
  const repoPercent = typeof mission.repoReadinessPercent === 'number'
    ? Math.max(0, Math.min(100, Math.round(mission.repoReadinessPercent)))
    : Math.max(0, Math.min(100, Math.round(mission.readinessPercent || 0)));
  const providerPercent = typeof mission.providerReadinessPercent === 'number'
    ? Math.max(0, Math.min(100, Math.round(mission.providerReadinessPercent)))
    : 0;
  const providerValue = missionProviderStatusLabel(mission, providerPercent);

  function row(label, percent, value, tone) {
    const item = document.createElement('b');
    item.className = 'studio-mission-card__meter-row studio-mission-card__meter-row--' + tone;
    const name = document.createElement('span');
    name.className = 'studio-mission-card__meter-label';
    name.textContent = label;
    const bar = document.createElement('span');
    bar.className = 'verification-meter__bar studio-mission-card__meter';
    bar.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('span');
    fill.className = 'verification-meter__fill studio-mission-card__meter-fill';
    fill.style.width = percent + '%';
    bar.appendChild(fill);
    const valueNode = document.createElement('span');
    valueNode.className = 'studio-mission-card__meter-value';
    valueNode.textContent = value;
    item.append(name, bar, valueNode);
    return item;
  }

  const rows = document.createElement('div');
  rows.className = 'verification-meter studio-mission-card__meters';
  rows.append(
    row('Repo files', repoPercent, repoPercent + '%', 'repo'),
    row('Provider live', providerPercent, providerValue, 'provider')
  );
  return {
    rows: rows,
    repoPercent: repoPercent,
    providerPercent: providerPercent,
    providerValue: providerValue
  };
}

function appendMissionProviderCard(block, mission) {
  const readiness = createMissionReadinessRows(mission);
  const card = document.createElement('div');
  card.className = 'verification-card studio-mission-card studio-mission-card--provider';

  const title = document.createElement('span');
  title.className = 'studio-mission-card__title';
  title.textContent = readString(mission.providerLabel) || providerDisplayName(readString(mission.provider)) || 'Provider';

  card.append(title, readiness.rows);
  block.appendChild(card);
}

function missionRepoCheckStatus(check) {
  const status = readString(check && check.status);
  const evidenceClass = readString(check && check.evidenceClass);
  if (evidenceClass === 'repo-verified' || status === 'passed') {
    return { label: 'Verified', tone: 'verified', percent: 100 };
  }
  if (status === 'needs-connection' || readString(check && check.verificationStatus) === 'needs_mcp') {
    return { label: 'Live check', tone: 'live', percent: 45 };
  }
  return { label: 'Fix needed', tone: 'missing', percent: 28 };
}

function appendMissionRepoCard(block, repoChecks, missingCount) {
  const safeChecks = Array.isArray(repoChecks) ? repoChecks : [];
  if (safeChecks.length === 0) {
    return;
  }
  const card = document.createElement('div');
  card.className = 'repo-evidence-card studio-mission-card studio-mission-card--repo';

  const title = document.createElement('span');
  title.className = 'studio-mission-card__title';
  title.textContent = missingCount > 0
    ? missingCount + ' repo fix' + (missingCount === 1 ? '' : 'es') + ' in the codebase.'
    : safeChecks.length + ' repo check' + (safeChecks.length === 1 ? '' : 's') + ' verified in the codebase.';

  const list = document.createElement('ul');
  list.className = 'studio-mission-card__check-list';
  safeChecks.slice(0, 7).forEach(function (check) {
    const status = missionRepoCheckStatus(check);
    const row = document.createElement('li');
    row.className = 'studio-mission-card__check studio-mission-card__check--' + status.tone;
    row.setAttribute('title', readString(check.source) + (readString(check.detail) ? ' - ' + readString(check.detail) : ''));

    const label = document.createElement('b');
    label.className = 'studio-mission-card__check-label';
    label.textContent = readString(check.label) || 'Repo check';

    const value = document.createElement('em');
    value.className = 'studio-mission-card__check-status';
    value.textContent = status.label;

    row.append(label, value);
    list.appendChild(row);
  });

  card.append(title, list);
  block.appendChild(card);
}

function appendStackReadinessCards(block, providerLabel, wiring, groups) {
  const repoPercent = Math.max(0, Math.min(100, Math.round(wiring.readinessPercent || 0)));
  const providerCard = document.createElement('div');
  providerCard.className = 'verification-card studio-mission-card studio-mission-card--provider';

  const title = document.createElement('span');
  title.className = 'studio-mission-card__title';
  title.textContent = providerLabel || 'Provider';

  const rows = createMissionReadinessRows({
    repoReadinessPercent: repoPercent,
    providerReadinessPercent: 0,
    checks: []
  }).rows;

  providerCard.append(title, rows);
  block.appendChild(providerCard);

  appendMissionRepoCard(
    block,
    groups.missing.concat(groups.passed),
    groups.missing.length
  );
}

function appendMismatchGroup(block, mission) {
  const layer = isRecord(lastPayload && lastPayload.missionGraph)
    ? lastPayload.missionGraph.verificationLayer
    : null;
  const diffs = isRecord(layer) && Array.isArray(layer.diffs) ? layer.diffs : [];
  const missionProvider = normalizeProductionChoiceProvider(readString(mission && mission.provider));
  const missionArea = readString(mission && mission.area);
  const matches = diffs.filter(function (diff) {
    if (!isRecord(diff)) return false;
    const diffProvider = normalizeProductionChoiceProvider(readString(diff.provider));
    const diffArea = readString(diff.area);
    return diffProvider === missionProvider && (!missionArea || diffArea === missionArea);
  });
  if (matches.length === 0) {
    return;
  }

  const group = document.createElement('div');
  group.className = 'studio-mismatch-card';
  const heading = document.createElement('div');
  heading.className = 'studio-mismatch-card__head';
  const headingText = document.createElement('strong');
  headingText.textContent = 'Mismatch';
  const count = document.createElement('span');
  count.className = 'studio-mismatch-card__count';
  count.textContent = String(matches.length);
  heading.append(headingText, count);

  const note = document.createElement('p');
  note.className = 'studio-mismatch-card__note';
  note.textContent = 'Repo evidence is present, but the live provider still needs MCP or dashboard confirmation.';

  const list = document.createElement('div');
  list.className = 'studio-mismatch-card__list';
  matches.slice(0, 4).forEach(function (diff) {
    const row = document.createElement('div');
    row.className = 'studio-mismatch-card__row';
    const label = document.createElement('span');
    label.className = 'studio-mismatch-card__title';
    label.textContent = readString(diff.title) || 'Provider mismatch';

    const comparison = document.createElement('div');
    comparison.className = 'studio-mismatch-card__comparison';
    const repo = document.createElement('span');
    repo.className = 'studio-mismatch-card__side studio-mismatch-card__side--repo';
    repo.innerHTML = '<b>Repo</b><em></em>';
    repo.querySelector('em').textContent = readString(diff.repoExpectation) || 'Expected setup evidence in repository';
    const live = document.createElement('span');
    live.className = 'studio-mismatch-card__side studio-mismatch-card__side--live';
    live.innerHTML = '<b>Live</b><em></em>';
    live.querySelector('em').textContent = readString(diff.providerActual) || 'Not verified';
    comparison.append(repo, live);
    row.append(label, comparison);
    list.appendChild(row);
  });

  group.append(heading, note, list);
  block.appendChild(group);
}

function renderMissionGraphBlock(category, selectedProvider) {
  const mission = readSelectedProviderMission(category, selectedProvider);
  if (!mission) {
    return null;
  }

  const block = document.createElement('section');
  block.className = 'studio-verification studio-wiring studio-mission-graph';
  block.setAttribute('aria-label', mission.providerLabel + ' mission evidence');

  const groups = {
    'repo-verified': [],
    'missing-repo-fix': [],
    'mcp-verifier': [],
    'manual-dashboard': []
  };
  mission.checks.forEach(function (check) {
    const evidenceClass = missionCheckGroupKey(check);
    groups[evidenceClass].push(check);
  });

  appendMissionProviderCard(block, mission);
  appendMissionRepoCard(
    block,
    groups['missing-repo-fix'].concat(groups['repo-verified']),
    groups['missing-repo-fix'].length
  );
  appendVerificationGroup(block, 'Provider Live Check', groups['mcp-verifier'].map(missionCheckToVerificationItem), 'external');
  appendManualDashboardGroup(block, 'Manual Dashboard Check', groups['manual-dashboard'], mission);
  if (groups['manual-dashboard'].length === 0) {
    const wiring = readSelectedStackWiring(category, selectedProvider);
    const manualItems = wiring && Array.isArray(wiring.items)
      ? wiring.items.filter(function (item) { return isRecord(item) && item.status === 'manual'; }).map(function (item) {
        return {
          label: item.label,
          status: 'manual',
          source: item.evidence.length > 0 ? item.evidence.join('; ') : item.promptHint,
          detail: item.evidence.join('; ')
        };
      })
      : [];
    appendVerificationGroup(block, 'Dashboard check', manualItems, 'manual');
  }
  appendMismatchGroup(block, mission);

  return block;
}

function renderStackWiringBlock(category, selectedProvider) {
  const wiring = readSelectedStackWiring(category, selectedProvider);
  if (!wiring) {
    return null;
  }

  const block = document.createElement('section');
  block.className = 'studio-verification studio-wiring studio-mission-graph';
  block.setAttribute('aria-label', wiring.providerLabel + ' stack readiness');
  const missingCount = wiring.items.filter(function (item) {
    return item.status === 'missing';
  }).length;
  const manualCount = wiring.items.filter(function (item) {
    return item.status === 'manual';
  }).length;

  const groups = {
    passed: [],
    missing: [],
    manual: []
  };
  wiring.items.forEach(function (item) {
    const status = ['passed', 'missing', 'manual'].indexOf(item.status) >= 0 ? item.status : 'manual';
    groups[status].push({
      label: item.label,
      status: status === 'passed' ? 'passed' : status,
      source: item.evidence.length > 0 ? item.evidence.join('; ') : item.promptHint,
      detail: item.evidence.join('; ')
    });
  });

  appendStackReadinessCards(block, wiring.providerLabel, wiring, groups);
  appendVerificationGroup(block, 'Dashboard check', groups.manual, 'manual');
  appendConfirmedStackEvidence(block, wiring.providerLabel, groups.passed, manualCount);

  return block;
}

function renderSifgEvidenceBlock(category) {
  const leaks = category ? sifgLeaksForCategory(category.key) : [];
  if (leaks.length === 0) {
    return null;
  }

  const block = document.createElement('section');
  block.className = 'studio-sifg-evidence';
  block.setAttribute('aria-label', 'SIFG structural leak evidence');

  const title = document.createElement('h3');
  title.className = 'studio-sifg-evidence__title';
  title.textContent = 'SIFG structural leak';
  block.appendChild(title);

  leaks.slice(0, 3).forEach(function (leak) {
    const item = document.createElement('div');
    item.className = 'studio-sifg-evidence__item';

    const summary = document.createElement('p');
    summary.className = 'studio-sifg-evidence__summary';
    summary.textContent = leak.summary;
    item.appendChild(summary);

    if (leak.paths.length > 0) {
      const pathList = document.createElement('ul');
      pathList.className = 'studio-sifg-evidence__paths';
      leak.paths.slice(0, 5).forEach(function (path) {
        const row = document.createElement('li');
        row.className = 'studio-sifg-evidence__path';
        row.textContent = path;
        pathList.appendChild(row);
      });
      item.appendChild(pathList);
    }

    block.appendChild(item);
  });

  const action = document.createElement('p');
  action.className = 'studio-sifg-evidence__action';
  action.textContent = 'Fix Repo Gap in the files above, then rescan. Repo evidence only; external dashboard setup still needs separate verification.';
  block.appendChild(action);

  return block;
}

function buildStudioConfigSnippet(category, selectedProvider) {
  if (!category) {
    return null;
  }
  const providerName = selectedProvider || defaultProviderForCategory(category);
  const provider = normalizeProductionChoiceProvider(providerName) || normalizeToolKey(providerName) || 'manual';
  const sectionKey = category.area || category.key;

  return {
    filename: 'viberaven.config.ts',
    code: [
      'export default {',
      '  studio: {',
      '    ' + sectionKey + ': {',
      "      provider: '" + provider + "',",
      '      sync: true',
      '    }',
      '  }',
      '};'
    ].join('\n')
  };
}

function renderStudioCodePreview(category, selectedProvider) {
  const snippet = buildStudioConfigSnippet(category, selectedProvider);
  const preview = document.createElement('div');
  preview.className = 'studio-code-preview';
  preview.setAttribute('aria-label', 'Studio config preview');

  if (!snippet) {
    preview.className += ' studio-code-preview--empty';
    preview.textContent = 'Choose a section to preview config.';
    return preview;
  }

  const chrome = document.createElement('div');
  chrome.className = 'studio-code-preview__chrome';
  const dots = document.createElement('span');
  dots.className = 'studio-code-preview__dots';
  dots.setAttribute('aria-hidden', 'true');
  dots.append(document.createElement('i'), document.createElement('i'), document.createElement('i'));
  const filename = document.createElement('span');
  filename.className = 'studio-code-preview__filename';
  filename.textContent = snippet.filename;
  chrome.append(dots, filename);

  const code = document.createElement('pre');
  code.className = 'studio-code-preview__body';
  const codeText = document.createElement('code');
  codeText.textContent = snippet.code;
  code.appendChild(codeText);

  preview.append(chrome, code);
  return preview;
}

function providerSupportsMcpInstall(providerName) {
  const registryEntry = registryEntryForProvider(providerName);
  if (registryEntry && isRecord(registryEntry.mcp)) {
    return true;
  }
  const provider = normalizeProductionChoiceProvider(providerName) || normalizeToolKey(providerName);
  return [
    'supabase',
    'clerk',
    'neon',
    'planetscale',
    'mongodb',
    'stripe',
    'paddle',
    'vercel',
    'netlify',
    'sentry',
    'posthog',
    'playwright',
    'rate-limit',
    'bot-protection'
  ].indexOf(provider) >= 0;
}

function mcpSecretInstructions(providerName) {
  const provider = normalizeProductionChoiceProvider(providerName) || normalizeToolKey(providerName);
  const instructions = {
    supabase: 'For hosted Supabase MCP, no API key goes in this file. Your IDE opens browser OAuth after you add the server. A Supabase access token is only needed for CI/manual-header setups.',
    clerk: 'Clerk MCP uses your Clerk credentials. If your IDE asks for a token, create one from the Clerk Dashboard developer settings.',
    neon: 'Neon MCP normally opens browser OAuth. Use Neon project/database credentials only when your IDE asks for them.',
    planetscale: 'PlanetScale MCP normally opens browser OAuth. Use a PlanetScale service token only for local/manual fallback setups.',
    mongodb: 'MongoDB MCP runs locally. Replace the connection string placeholder with a local or Atlas connection string and keep readOnly until you trust the workflow.',
    stripe: 'Stripe remote MCP normally opens OAuth in your IDE. For local or bearer-token setups, use a restricted Stripe secret key from Developers > API keys.',
    paddle: 'Paddle MCP needs your Paddle authentication. Use a sandbox or production API key only when the IDE or local server asks for it.',
    vercel: 'Vercel MCP normally opens browser sign-in from your IDE. Only CLI/local fallback flows need a Vercel token.',
    netlify: 'Netlify MCP uses Netlify authentication from the IDE or CLI. Finish the browser sign-in or token prompt it opens.',
    sentry: 'Sentry MCP normally uses the IDE/browser authentication flow. Only local or CLI fallback setups need a Sentry auth token.',
    posthog: 'PostHog MCP needs a PostHog personal API key or project key only when your IDE or local server asks for it.',
    playwright: 'Playwright MCP runs locally through npx and normally does not need an API key.',
    'rate-limit': 'Upstash MCP needs Upstash account credentials or API keys when the IDE/local server asks for them.',
    'bot-protection': 'Cloudflare MCP uses Cloudflare account authentication. Finish browser sign-in or provide an API token only when prompted.'
  };
  return instructions[provider] || 'After adding the MCP server, open your IDE MCP manager and complete any API key or OAuth step it asks for.';
}

function buildMcpSetupSnippet(providerName) {
  const provider = normalizeProductionChoiceProvider(providerName) || normalizeToolKey(providerName);
  if (!providerSupportsMcpInstall(providerName)) {
    return null;
  }
  const registryEntry = registryEntryForProvider(providerName);
  if (registryEntry && isRecord(registryEntry.mcp)) {
    const mcp = registryEntry.mcp;
    const serverName = readString(mcp.serverName) || provider;
    const vscodeServer = isRecord(mcp.vscodeServer) ? mcp.vscodeServer : {};
    const cursorServer = isRecord(mcp.cursorServer) ? mcp.cursorServer : {};
    return [
      '.vscode/mcp.json',
      JSON.stringify({ servers: { [serverName]: vscodeServer } }, null, 2),
      '',
      '.cursor/mcp.json',
      JSON.stringify({ mcpServers: { [serverName]: cursorServer } }, null, 2)
    ].join('\n');
  }
  const templates = {
    supabase: {
      vscode: { servers: { supabase: { type: 'http', url: 'https://mcp.supabase.com/mcp?read_only=true' } } },
      cursor: { mcpServers: { supabase: { url: 'https://mcp.supabase.com/mcp?read_only=true' } } }
    },
    clerk: {
      vscode: { servers: { clerk: { type: 'http', url: 'https://mcp.clerk.com/mcp' } } },
      cursor: { mcpServers: { clerk: { url: 'https://mcp.clerk.com/mcp' } } }
    },
    neon: {
      vscode: { servers: { neon: { type: 'http', url: 'https://mcp.neon.tech/mcp' } } },
      cursor: { mcpServers: { neon: { url: 'https://mcp.neon.tech/mcp' } } }
    },
    planetscale: {
      vscode: { servers: { planetscale: { type: 'http', url: 'https://mcp.pscale.dev/mcp/planetscale' } } },
      cursor: { mcpServers: { planetscale: { url: 'https://mcp.pscale.dev/mcp/planetscale' } } }
    },
    mongodb: {
      vscode: { servers: { mongodb: { type: 'stdio', command: 'npx', args: ['-y', 'mongodb-mcp-server', '--connectionString', 'mongodb://localhost:27017/myDatabase', '--readOnly'] } } },
      cursor: { mcpServers: { mongodb: { command: 'npx', args: ['-y', 'mongodb-mcp-server', '--connectionString', 'mongodb://localhost:27017/myDatabase', '--readOnly'] } } }
    },
    stripe: {
      vscode: { servers: { stripe: { type: 'http', url: 'https://mcp.stripe.com' } } },
      cursor: { mcpServers: { stripe: { url: 'https://mcp.stripe.com' } } }
    },
    paddle: {
      vscode: { servers: { paddle: { type: 'stdio', command: 'npx', args: ['-y', '@paddle/paddle-mcp', '--api-key=YOUR_API_KEY', '--environment=sandbox', '--tools=non-destructive'] } } },
      cursor: { mcpServers: { paddle: { command: 'npx', args: ['-y', '@paddle/paddle-mcp', '--api-key=YOUR_API_KEY', '--environment=sandbox', '--tools=non-destructive'] } } }
    },
    vercel: {
      vscode: { servers: { vercel: { type: 'http', url: 'https://mcp.vercel.com' } } },
      cursor: { mcpServers: { vercel: { url: 'https://mcp.vercel.com' } } }
    },
    netlify: {
      vscode: { servers: { netlify: { type: 'stdio', command: 'npx', args: ['-y', '@netlify/mcp'] } } },
      cursor: { mcpServers: { netlify: { command: 'npx', args: ['-y', '@netlify/mcp'] } } }
    },
    sentry: {
      vscode: { servers: { sentry: { type: 'http', url: 'https://mcp.sentry.dev/mcp' } } },
      cursor: { mcpServers: { sentry: { url: 'https://mcp.sentry.dev/mcp' } } }
    },
    posthog: {
      vscode: { servers: { posthog: { type: 'http', url: 'https://mcp.posthog.com/mcp' } } },
      cursor: { mcpServers: { posthog: { url: 'https://mcp.posthog.com/mcp' } } }
    },
    playwright: {
      vscode: { servers: { playwright: { type: 'stdio', command: 'npx', args: ['-y', '@playwright/mcp@latest'] } } },
      cursor: { mcpServers: { playwright: { command: 'npx', args: ['-y', '@playwright/mcp@latest'] } } }
    },
    'rate-limit': {
      vscode: { servers: { upstash: { type: 'stdio', command: 'npx', args: ['-y', '@upstash/mcp-server@latest', '--email', '<UPSTASH_EMAIL>', '--api-key', '<UPSTASH_API_KEY>'] } } },
      cursor: { mcpServers: { upstash: { command: 'npx', args: ['-y', '@upstash/mcp-server@latest', '--email', '<UPSTASH_EMAIL>', '--api-key', '<UPSTASH_API_KEY>'] } } }
    },
    'bot-protection': {
      vscode: { servers: { 'cloudflare-api': { type: 'http', url: 'https://mcp.cloudflare.com/mcp' } } },
      cursor: { mcpServers: { 'cloudflare-api': { url: 'https://mcp.cloudflare.com/mcp' } } }
    }
  };
  const template = templates[provider];
  if (!template) {
    return '';
  }
  return [
    '.vscode/mcp.json',
    JSON.stringify(template.vscode, null, 2),
    '',
    '.cursor/mcp.json',
    JSON.stringify(template.cursor, null, 2)
  ].join('\n');
}

function appendProviderMetadataNotice(host, providerName) {
  if (!(host instanceof HTMLElement)) {
    return;
  }
  const entry = registryEntryForProvider(providerName);
  if (!(entry && entry.status === 'stale') && providerRegistry.status !== 'stale') {
    return;
  }
  const notice = document.createElement('p');
  notice.className = 'studio-provider-metadata-note';
  notice.textContent = 'Provider metadata may be stale. Use dashboard/MCP verification before trusting external setup.';
  host.appendChild(notice);
}

function buildSupabaseDatabaseWiringPromptFromPayload(wiring) {
  const safeWiring = isRecord(wiring) ? wiring : readSupabaseDatabaseWiring();
  if (!safeWiring || !Array.isArray(safeWiring.items)) {
    return '';
  }
  const passed = safeWiring.items.filter(function (item) {
    return item.status === 'passed';
  });
  const missing = safeWiring.items.filter(function (item) {
    return item.status === 'missing';
  });
  const passedLines = passed.length > 0
    ? passed.map(function (item) {
      return '- ' + item.label + (item.evidence && item.evidence.length > 0 ? ' (' + item.evidence.slice(0, 3).join('; ') + ')' : '');
    }).join('\n')
    : '- No Supabase wiring checks passed yet.';
  const missingLines = missing.length > 0
    ? missing.map(function (item) {
      return '- ' + item.label + ': ' + (item.promptHint || 'Close this missing Supabase database wiring check.');
    }).join('\n')
    : '- No missing Supabase database wiring checks were found by VibeRaven.';

  return [
    'Wire Supabase database for this app safely.',
    '',
    'Current Supabase database wiring readiness: ' +
      safeWiring.passedCount +
      '/' +
      safeWiring.totalCount +
      ' checks passed (' +
      safeWiring.readinessPercent +
      '%).',
    '',
    'Repo evidence already found:',
    passedLines,
    '',
    'Missing Supabase database wiring checks:',
    missingLines,
    '',
    'First inspect the existing package.json files, env examples, Supabase client helpers, database access files, and supabase/ or migrations/ directories. Identify the current framework and data access pattern before editing.',
    '',
    'Implement:',
    '1. Close only the missing Supabase database wiring checks listed above.',
    '2. Follow the existing file structure and naming patterns.',
    '3. Keep database setup reproducible through checked-in schema, migrations, or documented generation commands.',
    '4. Keep service-role keys out of frontend and client-executed files.',
    '',
    'Constraints:',
    '- Do not rewrite unrelated auth, payments, UI, billing, or deployment code.',
    '- Do not claim Supabase dashboard setup is complete from repo evidence alone.',
    '- Do not expose SUPABASE_SERVICE_ROLE_KEY to browser code, Vite public env, or NEXT_PUBLIC env variables.',
    '',
    'Verification:',
    '- Run the relevant TypeScript/build/test command for this repo.',
    '- Confirm VibeRaven can rescan and move the missing Supabase wiring checks to passed where repo evidence exists.',
    '- Summarize what changed and what still requires manual Supabase dashboard verification.'
  ].join('\n');
}

function buildStackWiringPromptFromPayload(wiring) {
  const safeWiring = isRecord(wiring) ? wiring : null;
  if (!safeWiring || !Array.isArray(safeWiring.items)) {
    return '';
  }
  const promptSubject = readString(safeWiring.promptSubject) ||
    (readString(safeWiring.providerLabel) ? readString(safeWiring.providerLabel) + ' stack' : 'this stack');
  const passed = safeWiring.items.filter(function (item) {
    return item.status === 'passed';
  });
  const missing = safeWiring.items.filter(function (item) {
    return item.status === 'missing';
  });
  const manual = safeWiring.items.filter(function (item) {
    return item.status === 'manual';
  });
  const passedLines = passed.length > 0
    ? passed.map(function (item) {
      return '- ' + item.label + (item.evidence && item.evidence.length > 0 ? ' (' + item.evidence.slice(0, 3).join('; ') + ')' : '');
    }).join('\n')
    : '- No ' + promptSubject + ' checks passed yet.';
  const missingLines = missing.length > 0
    ? missing.map(function (item) {
      return '- ' + item.label + ': ' + (item.promptHint || 'Close this missing stack readiness check.');
    }).join('\n')
    : '- No missing ' + promptSubject + ' checks were found by VibeRaven.';
  const manualLines = manual.length > 0
    ? manual.map(function (item) {
      return '- ' + item.label + ': ' + (item.promptHint || 'Confirm this in the provider dashboard.');
    }).join('\n')
    : '- No manual dashboard checks were listed.';

  return [
    'Wire ' + promptSubject + ' for this app safely.',
    '',
    'Current ' + promptSubject + ' readiness: ' +
      safeWiring.passedCount +
      '/' +
      safeWiring.totalCount +
      ' repo checks passed (' +
      safeWiring.readinessPercent +
      '%).',
    '',
    'Repo evidence already found:',
    passedLines,
    '',
    'Missing ' + promptSubject + ' checks:',
    missingLines,
    '',
    'Manual checks that repo evidence cannot prove:',
    manualLines,
    '',
    'First inspect the existing package.json files, env examples, framework routes, provider helpers, and server/client boundaries before editing.',
    '',
    'Implement:',
    '1. Close only the missing ' + promptSubject + ' checks listed above.',
    '2. Follow the existing file structure and naming patterns.',
    '3. Keep provider secrets in server-only code and documented env templates.',
    '4. Keep external dashboard work explicit instead of claiming it from repo evidence.',
    '',
    'Constraints:',
    '- Do not rewrite unrelated auth, payments, UI, billing, deployment, or analytics code.',
    '- Do not expose secret keys to browser code, public env variables, or client-executed files.',
    '- Do not claim external provider dashboard setup is complete from repo evidence alone.',
    '',
    'Verification:',
    '- Run the relevant TypeScript/build/test command for this repo.',
    '- Confirm VibeRaven can rescan and move the missing checks to passed where repo evidence exists.',
    '- Summarize what changed and what still requires manual provider dashboard verification.'
  ].join('\n');
}

function renderMcpVerifierStatus(providerName) {
  const state = mcpVerifierForProvider(providerName);
  const status = readString(state.status) || 'missing';
  const block = document.createElement('div');
  block.className = 'studio-setup-actions__mcp-state studio-setup-actions__mcp-state--' + status;
  const title = document.createElement('strong');
  const note = document.createElement('span');
  if (status === 'configured') {
    title.textContent = 'MCP verifier configured';
    note.textContent = 'Runtime connection is not claimed by VibeRaven';
  } else if (status === 'unsupported') {
    title.textContent = 'MCP verifier not marked read-only';
    note.textContent = 'Keep manual dashboard checks separate until the verifier is read-only.';
  } else if (status === 'stale') {
    title.textContent = 'MCP verifier metadata stale';
    note.textContent = 'Refresh MCP verifier metadata before relying on this helper.';
  } else {
    title.textContent = 'MCP verifier not configured';
    note.textContent = 'Manual dashboard checks still require user confirmation.';
  }
  block.append(title, note);
  return block;
}

function renderStudioSetupActions(category, categoryGaps, selectedProvider) {
  const providerName = selectedProvider || defaultProviderForCategory(category);
  const firstGap = Array.isArray(categoryGaps) && categoryGaps.length > 0 ? categoryGaps[0] : null;
  const stackAutomation = readSelectedStackAutomation(category, providerName);
  const stackWiring = readSelectedStackWiring(category, providerName);
  const isManualOnlyAutomation = stackAutomation && stackAutomation.automationLevel === 'manual-only';
  const hasStackFixPrompt = Boolean(stackAutomation && stackAutomation.repoPrompt);
  const hasScannedStackPrompt = hasStackFixPrompt || Boolean(stackWiring);
  const prompt = stackAutomation && stackAutomation.repoPrompt
    ? stackAutomation.repoPrompt
    : isManualOnlyAutomation && stackAutomation.verificationPrompt
      ? stackAutomation.verificationPrompt
    : stackWiring
      ? buildStackWiringPromptFromPayload(stackWiring)
      : firstGap
        ? buildGapCopyPrompt(firstGap)
        : buildProviderSelectionPrompt(category.key, providerName, null);
  const providerLabel = providerDisplayName(providerName) || providerName || category.label;
  const mcpSnippet = buildMcpSetupSnippet(providerName);
  const supportsMcp = Boolean(mcpSnippet);
  const verifierProvider = stackAutomation && stackAutomation.mcpProvider ? stackAutomation.mcpProvider : '';

  const block = document.createElement('section');
  block.className = 'studio-setup-actions';
  block.setAttribute('aria-label', category.label + ' setup actions');

  const head = document.createElement('div');
  head.className = 'studio-setup-actions__head';
  const logo = document.createElement('span');
  logo.className = 'studio-setup-actions__logo provider-logo' + providerLogoClass(providerName);
  logo.setAttribute('title', providerLabel);
  logo.setAttribute('aria-hidden', 'true');
  const logoMarkup = providerLogoMarkup(providerName);
  if (logoMarkup) {
    logo.innerHTML = logoMarkup;
  } else {
    logo.textContent = providerIconText(providerName);
  }
  const titleWrap = document.createElement('div');
  titleWrap.className = 'studio-setup-actions__title';
  const title = document.createElement('strong');
  title.textContent = isManualOnlyAutomation
    ? providerLabel + ' manual check'
    : hasScannedStackPrompt
      ? providerLabel + ' fix prompt'
      : providerLabel + ' setup';
  const meta = document.createElement('span');
  meta.textContent = supportsMcp ? 'MCP verification available' : 'Prompt only';
  titleWrap.append(title, meta);
  head.append(logo, titleWrap);
  block.appendChild(head);

  const description = document.createElement('p');
  description.className = 'studio-setup-actions__copy';
  description.textContent = isManualOnlyAutomation
    ? 'Repo fixes are already clear. Use the manual checklist for provider dashboard work, then rescan.'
    : stackAutomation
    ? 'One prompt for the missing repo fixes above. Manual dashboard checks stay separate.'
    : stackWiring
    ? 'One prompt for the missing ' + stackWiring.providerLabel + ' repo checks above. Rescan after the agent edits.'
    : supportsMcp
    ? 'Use this setup prompt when starting with this provider. The MCP helper is optional.'
    : 'Use this setup prompt when starting with this provider. No trusted MCP helper is available yet.';
  block.appendChild(description);

  const actions = document.createElement('div');
  actions.className = 'studio-setup-actions__buttons';

  const copyPrompt = document.createElement('button');
  copyPrompt.type = 'button';
  copyPrompt.className = 'studio-action-button studio-action-button--primary';
  copyPrompt.setAttribute('data-station-action', 'mc-copy-prompt');
  copyPrompt.setAttribute('data-prompt', prompt);
  copyPrompt.textContent = isManualOnlyAutomation
    ? 'Copy live check prompt'
    : hasScannedStackPrompt
      ? 'Copy focused agent prompt'
      : 'Copy setup prompt';
  actions.appendChild(copyPrompt);

  const chat = document.createElement('button');
  chat.type = 'button';
  chat.className = 'studio-action-button';
  chat.setAttribute('data-station-action', 'mc-use-in-chat');
  chat.setAttribute('data-prompt', prompt);
  chat.textContent = 'Put in Chat';
  actions.appendChild(chat);
  block.appendChild(actions);

  if (verifierProvider) {
    block.appendChild(renderMcpVerifierStatus(verifierProvider));
  }

  if (supportsMcp) {
    const mcpRow = document.createElement('div');
    mcpRow.className = 'studio-setup-actions__mcp-row';
    const authNote = document.createElement('p');
    authNote.className = 'studio-setup-actions__auth-note';
    authNote.textContent = 'Optional MCP verification: ' + mcpSecretInstructions(providerName) + ' VibeRaven does not read real .env files or store provider API keys.';
    const connect = document.createElement('button');
    connect.type = 'button';
    connect.className = 'studio-action-button';
    connect.setAttribute('data-station-action', 'studio-connect-mcp');
    connect.setAttribute('data-provider', providerName);
    connect.textContent = 'MCP Verify';
    mcpRow.append(authNote, connect);
    block.appendChild(mcpRow);
  }
  return block;
}

function renderMcpHelperModal(payload) {
  const host = document.getElementById('mcp-helper-modal');
  if (!(host instanceof HTMLElement)) {
    return;
  }
  const data = isRecord(payload) ? payload : {};
  const providerLabel = readString(data.providerLabel) || 'Selected stack';
  const targetLabel = readString(data.targetLabel) || 'Current IDE';
  const destination = readString(data.destination) || 'MCP settings';
  const snippet = readString(data.snippet);
  const keyInstructions = readString(data.keyInstructions) || 'Finish any OAuth or API key step your IDE asks for.';

  host.replaceChildren();
  host.hidden = false;
  host.setAttribute('role', 'dialog');
  host.setAttribute('aria-modal', 'true');
  host.setAttribute('aria-label', providerLabel + ' MCP helper');

  const backdrop = document.createElement('div');
  backdrop.className = 'mcp-helper-modal__backdrop';
  backdrop.setAttribute('data-station-action', 'mcp-close-helper');

  const panel = document.createElement('section');
  panel.className = 'mcp-helper-modal__panel';

  const head = document.createElement('div');
  head.className = 'mcp-helper-modal__head';
  const eyebrow = document.createElement('span');
  eyebrow.className = 'mcp-helper-modal__eyebrow';
  eyebrow.textContent = 'MCP verification';
  const title = document.createElement('h2');
  title.className = 'mcp-helper-modal__title';
  title.textContent = providerLabel + ' MCP Verifier';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'mcp-helper-modal__close';
  close.setAttribute('data-station-action', 'mcp-close-helper');
  close.textContent = 'Close';
  head.append(eyebrow, title, close);

  const steps = document.createElement('ol');
  steps.className = 'mcp-helper-modal__steps';
  [
    'Open ' + destination + '.',
    'Paste or merge the snippet below.',
    keyInstructions,
    'Save the MCP config, then let the IDE authenticate or restart the MCP server.'
  ].forEach(function (step) {
    const item = document.createElement('li');
    item.textContent = step;
    steps.appendChild(item);
  });

  const codePreview = document.createElement('div');
  codePreview.className = 'studio-code-preview mcp-helper-modal__code';
  const chrome = document.createElement('div');
  chrome.className = 'studio-code-preview__chrome';
  const dots = document.createElement('span');
  dots.className = 'studio-code-preview__dots';
  dots.setAttribute('aria-hidden', 'true');
  dots.append(document.createElement('i'), document.createElement('i'), document.createElement('i'));
  const filename = document.createElement('span');
  filename.className = 'studio-code-preview__filename';
  filename.textContent = destination;
  chrome.append(dots, filename);
  const code = document.createElement('pre');
  code.className = 'studio-code-preview__body';
  const codeText = document.createElement('code');
  codeText.textContent = snippet || 'No MCP snippet available for this stack yet.';
  code.appendChild(codeText);
  codePreview.append(chrome, code);

  const actions = document.createElement('div');
  actions.className = 'mcp-helper-modal__actions';
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'studio-action-button studio-action-button--primary';
  copy.setAttribute('data-station-action', 'mcp-copy-snippet');
  copy.setAttribute('data-snippet', snippet);
  copy.textContent = 'Copy MCP config';
  const done = document.createElement('button');
  done.type = 'button';
  done.className = 'studio-action-button';
  done.setAttribute('data-station-action', 'mcp-close-helper');
  done.textContent = 'Done';
  actions.append(copy, done);

  panel.append(head, steps, codePreview, actions);
  host.append(backdrop, panel);
}

function closeMcpHelperModal() {
  const host = document.getElementById('mcp-helper-modal');
  if (!(host instanceof HTMLElement)) {
    return;
  }
  host.replaceChildren();
  host.hidden = true;
}

function renderStudioMapActionCard(category, categoryGaps, selectedProvider) {
  const selectedName = selectedProvider || defaultProviderForCategory(category);
  const firstGap = Array.isArray(categoryGaps) && categoryGaps.length > 0 ? categoryGaps[0] : null;
  const prompt = firstGap
    ? buildGapCopyPrompt(firstGap)
    : buildProviderSelectionPrompt(category.key, selectedName, null);
  const panel = document.createElement('div');
  panel.className = 'studio-map-action studio-map-action--' + category.key + (firstGap ? '' : ' studio-map-action--clear');
  panel.setAttribute('aria-label', category.label + ' quick actions');

  const rail = document.createElement('span');
  rail.className = 'studio-map-action__rail';
  rail.textContent = 'Raven issue';

  const body = document.createElement('div');
  body.className = 'studio-map-action__body';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'studio-map-action__close';
  close.setAttribute('data-station-action', 'mc-close-map-action');
  close.setAttribute('aria-label', 'Close ' + category.label + ' quick setup');
  close.textContent = 'Close';
  const title = document.createElement('strong');
  title.className = 'studio-map-action__title';
  title.textContent = category.label;
  const stamp = document.createElement('span');
  stamp.className = 'studio-map-action__stamp';
  stamp.textContent = firstGap ? 'Product review docket' : 'No Raven product issue';
  const subtitle = document.createElement('span');
  subtitle.className = 'studio-map-action__subtitle';
  subtitle.textContent = firstGap
    ? ('Raven gaps: ' + categoryGaps.length + ' product issue' + (categoryGaps.length === 1 ? '' : 's'))
    : (selectedName ? selectedName + ' selected' : 'No blocking gaps found');
  body.append(close, stamp, title, subtitle);

  const gapList = document.createElement('ul');
  gapList.className = 'studio-map-action__gaps';
  const safeGaps = Array.isArray(categoryGaps) ? categoryGaps : [];
  if (safeGaps.length > 0) {
    safeGaps.forEach(function (gap, index) {
      const item = document.createElement('li');
      const text = isRecord(gap) ? stripHtml(gap.title || gap.detail || 'Gap needs review') : 'Gap needs review';
      item.setAttribute('data-ticket', String(index + 1).padStart(2, '0'));
      item.textContent = text;
      gapList.appendChild(item);
    });
  } else {
    const item = document.createElement('li');
    item.setAttribute('data-ticket', 'OK');
    item.textContent = 'No blocking gap found. Use the right panel to choose or verify the stack.';
    gapList.appendChild(item);
  }
  body.appendChild(gapList);

  const actions = document.createElement('div');
  actions.className = 'studio-map-action__quick-actions';
  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.className = 'studio-map-action__quick';
  copyButton.setAttribute('data-station-action', 'mc-copy-prompt');
  copyButton.setAttribute('data-prompt', prompt);
  copyButton.textContent = 'Copy Prompt';
  const chatButton = document.createElement('button');
  chatButton.type = 'button';
  chatButton.className = 'studio-map-action__quick studio-map-action__quick--chat';
  chatButton.setAttribute('data-station-action', 'mc-use-in-chat');
  chatButton.setAttribute('data-prompt', prompt);
  chatButton.textContent = 'Put in Chat';
  actions.append(copyButton, chatButton);
  body.appendChild(actions);

  panel.append(rail, body);
  return panel;
}

function clearSelectedProductionCategoryAndRender(payload) {
  const categoryKey = selectedProductionCategoryKey;
  if (categoryKey) {
    delete studioSectionSteps[categoryKey];
    delete studioGeneratedTasks[categoryKey];
  }
  selectedProductionCategoryKey = '';
  dismissedStudioMapActionCategoryKey = '';
  activeRavenGapCategoryKey = '';
  expandedGapId = '';
  persistStationUiState();
  if (payload) {
    renderPayload(payload, { preserveCategory: true });
  }
}

function closeStudioMapActionAndRender(payload) {
  if (!selectedProductionCategoryKey) {
    return;
  }
  dismissedStudioMapActionCategoryKey = selectedProductionCategoryKey;
  activeRavenGapCategoryKey = '';
  if (payload) {
    renderPayload(payload, { preserveCategory: true });
  }
}

function renderStudioSetupPanel(category, categoryGaps, selectedProvider) {
  const evidenceStatus = evidenceStatusForCategory(category, categoryGaps, selectedProvider);
  const panel = document.createElement('div');
  panel.className = 'studio-setup-panel__inner';
  panel.setAttribute('data-category-key', category.key);
  panel.setAttribute('data-studio-step', readStudioStep(category.key));

  const head = document.createElement('div');
  head.className = 'studio-setup-panel__head';
  const headText = document.createElement('div');
  const title = document.createElement('div');
  title.className = 'studio-setup-panel__title';
  title.textContent = category.label.toUpperCase() + (category.choiceKind === 'stack' ? ' STACK' : ' CONTROLS');
  headText.append(title);

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'studio-setup-panel__close';
  close.setAttribute('data-station-action', 'mc-clear-category');
  close.setAttribute('aria-label', 'Close setup panel');
  close.textContent = 'Close';
  head.append(headText, close);
  panel.appendChild(head);

  const hint = document.createElement('div');
  hint.className = 'studio-setup-panel__hint';
  const hintText = readStudioStep(category.key) === 'choose'
    ? category.choiceLabel
    : 'Build setup tasks';
  const hintLabel = document.createElement('span');
  hintLabel.textContent = hintText;
  hint.append(hintLabel, renderStudioEvidenceBadge(evidenceStatus));
  panel.appendChild(hint);
  if (readStudioStep(category.key) === 'choose') {
    const options = providerOptionsForCategory(category.key, categoryGaps);
    const firstGap = categoryGaps.length > 0 ? categoryGaps[0] : null;
    const list = document.createElement('div');
    list.className = 'studio-choice-list';
    list.setAttribute('role', 'group');
    list.setAttribute('aria-label', category.choiceLabel);
    for (let i = 0; i < options.length; i++) {
      list.appendChild(buildStudioChoiceTile(category.key, options[i], selectedProvider, firstGap, evidenceStatus));
    }
    panel.appendChild(list);
  } else {
    const tasks = document.createElement('div');
    tasks.className = 'studio-choice-list';
    const stub = document.createElement('div');
    stub.className = 'studio-choice-tile studio-choice-tile--static';
    stub.textContent = 'Setup tasks will appear here.';
    tasks.appendChild(stub);
    panel.appendChild(tasks);
  }

  const selectedProviderName = selectedProvider || defaultProviderForCategory(category);
  let selectedNodeContract = null;
  if (shouldRenderSelectedNodeSidebarContract(category, selectedProvider)) {
    selectedNodeContract = buildSelectedNodeSidebarContract(category, categoryGaps, selectedProvider);
    panel.appendChild(renderSelectedNodeSidebarContract(category, categoryGaps, selectedProvider, selectedNodeContract));
  }

  if (
    !selectedNodeContract &&
    (
      readSelectedStackWiring(category, selectedProviderName) ||
      (category && category.key === 'security' && readSelectedStackAutomation(category, selectedProviderName))
    )
  ) {
    selectedNodeContract = buildSelectedNodeSidebarContract(category, categoryGaps, selectedProviderName);
    panel.appendChild(renderSelectedNodeSidebarContract(category, categoryGaps, selectedProviderName, selectedNodeContract));
  }

  const providerTruthBlock = renderProviderTruthBlock(category);
  if (providerTruthBlock) {
    panel.appendChild(providerTruthBlock);
  }

  if (selectedNodeContract) {
    return panel;
  }

  const connectionEvidenceBlock = selectedProvider ? null : renderStudioConnectionEvidenceBlock(category);
  if (connectionEvidenceBlock) {
    panel.appendChild(connectionEvidenceBlock);
  }

  const missionGraphBlock = connectionEvidenceBlock || selectedProvider ? null : renderMissionGraphBlock(category, selectedProvider);
  const stackWiringBlock = missionGraphBlock || renderStackWiringBlock(category, selectedProvider);
  if (stackWiringBlock) {
    panel.appendChild(stackWiringBlock);
  }

  appendProviderMetadataNotice(panel, selectedProviderName);
  const sifgEvidenceBlock = renderSifgEvidenceBlock(category);
  if (sifgEvidenceBlock) {
    panel.appendChild(sifgEvidenceBlock);
  }
  panel.appendChild(renderStudioSetupActions(category, categoryGaps, selectedProvider));

  return panel;
}

function renderOverviewLevel1(checklist, gaps, score) {
  const map = document.getElementById('mc-production-map');
  const setupPanel = document.getElementById('studio-setup-panel');
  const groups = document.getElementById('mc-groups');
  if (groups instanceof HTMLElement) {
    groups.hidden = true;
    groups.replaceChildren();
  }
  if (!(map instanceof HTMLElement)) {
    return;
  }
  const effective = isRecord(checklist) ? checklist : ensureProductionChecklist({});
  map.hidden = false;
  map.replaceChildren();
  map.className = 'mc3-overview';

  const stackMap = document.createElement('div');
  stackMap.className = 'studio-system-map';
  stackMap.setAttribute('aria-label', 'Studio production system map');

  const nodeLayer = document.createElement('div');
  nodeLayer.className = 'studio-node-layer';
  stackMap.appendChild(nodeLayer);

  const connectors = document.createElement('div');
  connectors.className = 'studio-connector-layer';
  connectors.setAttribute('aria-hidden', 'true');
  nodeLayer.appendChild(connectors);

  const coreGroup = document.createElement('div');
  coreGroup.className = 'studio-core-group';

  const core = document.createElement('div');
  core.className = 'studio-core-node';
  core.setAttribute('aria-label', 'Production core score');
  const coreBrand = document.createElement('span');
  coreBrand.textContent = 'VIBERAVEN';
  const coreScore = document.createElement('strong');
  coreScore.textContent = String(Math.max(0, Math.min(100, Math.round(Number(score) || 0)))) + '%';
  const coreLabel = document.createElement('small');
  coreLabel.textContent = 'Production core';
  core.append(coreBrand, coreScore, coreLabel);

  const coreScan = document.createElement('button');
  coreScan.type = 'button';
  coreScan.className = 'studio-core-scan';
  coreScan.setAttribute('data-station-action', 'rescan');
  coreScan.textContent = 'Scan Project';
  coreGroup.append(core, coreScan);
  nodeLayer.appendChild(coreGroup);

  const selectedCategory = getProductionCategory(selectedProductionCategoryKey);
  for (let ci = 0; ci < PRODUCTION_MAP_CATEGORIES.length; ci++) {
    const category = PRODUCTION_MAP_CATEGORIES[ci];
    nodeLayer.appendChild(buildStudioNode(category, effective, gaps));
  }

  if (selectedCategory && isMapCategoryUnlocked(selectedCategory.key, lastSessionUsage, lastAccountPlan)) {
    const categoryGaps = filterGapsForCategory(gaps, selectedCategory.key);
    if (
      categoryGaps.length > 0 &&
      activeRavenGapCategoryKey === selectedCategory.key &&
      dismissedStudioMapActionCategoryKey !== selectedCategory.key
    ) {
      nodeLayer.appendChild(
        renderStudioMapActionCard(
          selectedCategory,
          categoryGaps,
          selectedProviderForCategory(selectedCategory.key)
        )
      );
    }
    if (setupPanel instanceof HTMLElement) {
      const selectedProvider = setupProviderForCategory(selectedCategory.key) || selectedProviderForCategory(selectedCategory.key);
      const panel = renderStudioSetupPanel(
        selectedCategory,
        categoryGaps,
        selectedProvider
      );
      const verificationBlock = shouldRenderGenericVerification(selectedCategory, selectedProvider)
        ? renderStudioVerificationBlock(selectedCategory, selectedProvider)
        : null;
      if (verificationBlock) {
        panel.appendChild(verificationBlock);
      }
      setupPanel.hidden = false;
      setupPanel.replaceChildren(panel);
    }
  } else if (setupPanel instanceof HTMLElement) {
    setupPanel.hidden = false;
    const empty = document.createElement('div');
    empty.className = 'studio-setup-panel__empty';
    const eyebrow = document.createElement('p');
    eyebrow.className = 'studio-setup-panel__eyebrow';
    eyebrow.textContent = 'No section selected';
    const title = document.createElement('p');
    title.className = 'studio-setup-panel__title';
    title.textContent = 'Choose a node on the map';
    empty.append(eyebrow, title);
    setupPanel.replaceChildren(empty);
  }

  map.appendChild(stackMap);
}

function renderScanInsights(_payload) {
  const host = document.getElementById('mc-scan-insights');
  if (host instanceof HTMLElement) {
    host.hidden = true;
    host.replaceChildren();
  }
}

function clearProductionChrome() {
  const map = document.getElementById('mc-production-map');
  if (map instanceof HTMLElement) {
    map.hidden = true;
    map.replaceChildren();
  }
  const setupPanel = document.getElementById('studio-setup-panel');
  if (setupPanel instanceof HTMLElement) {
    setupPanel.replaceChildren();
  }
  const ins = document.getElementById('mc-scan-insights');
  if (ins instanceof HTMLElement) {
    ins.hidden = true;
    ins.replaceChildren();
  }
  const groups = document.getElementById('mc-groups');
  if (groups instanceof HTMLElement) {
    groups.hidden = true;
    groups.replaceChildren();
  }
  const pills = document.getElementById('mc-plan-pills');
  if (pills instanceof HTMLElement) {
    pills.hidden = true;
    pills.replaceChildren();
  }
}

function normalizeToolKey(name) {
  return stripHtml(name)
    .toLowerCase()
    .replace(/auth\.js/g, 'nextauth')
    .replace(/nextauth/g, 'nextauth')
    .replace(/mongodb atlas/g, 'mongodb')
    .replace(/express-rate-limit/g, 'expressratelimit')
    .replace(/upstash rate limit/g, 'upstash')
    .replace(/cloudflare turnstile/g, 'cloudflareturnstile')
    .replace(/[^a-z0-9]/g, '');
}

function hasVibeRavenPromptShape(prompt) {
  const text = typeof prompt === 'string' ? prompt : '';
  return (
    /\bFirst inspect\b/i.test(text) &&
    /\bImplement\b/i.test(text) &&
    /\bConstraints\b/i.test(text) &&
    /\bVerification\b/i.test(text)
  );
}

function buildStructuredAgentPrompt(outcome, inspect, implement, constraints, verification) {
  const safeOutcome = stripHtml(outcome || 'Fix this production-readiness gap.').trim();
  const safeInspect = stripHtml(inspect || '').trim();
  const safeImplement = stripHtml(implement || '').trim();
  const safeConstraints = stripHtml(constraints || '').trim();
  const safeVerification = stripHtml(verification || '').trim();

  return (
    safeOutcome +
    '\n\nFirst inspect ' +
    (safeInspect || 'the files, routes, config, and helpers related to this gap. Identify the current behavior before editing.') +
    '\n\nImplement:\n' +
    (safeImplement || '1. Make the smallest safe change that closes the gap.\n2. Follow existing project patterns and keep related code paths explicit.') +
    '\n\nConstraints:\n' +
    (safeConstraints ||
      '- Preserve existing user-facing behavior unless it conflicts with production safety.\n- Do not claim external dashboard setup is complete from repo evidence alone.') +
    '\n\nVerification:\n' +
    (safeVerification ||
      '- Add or update focused tests or manual checks for the changed behavior.\n- Run the relevant test suite and TypeScript check.\n- Summarize what changed and what remains manual or external.')
  );
}

function buildGapCopyPrompt(gap) {
  const raw = typeof gap.copyPrompt === 'string' ? gap.copyPrompt.trim() : '';
  if (hasVibeRavenPromptShape(raw)) {
    return raw;
  }

  const title = stripHtml(gap.title || 'Production-readiness gap');
  const detail = stripHtml(gap.detail || '');
  const category = stripHtml(gap.category || 'the affected area');
  const outcome = raw || 'Fix this VibeRaven production-readiness gap: ' + title + '.';

  return buildStructuredAgentPrompt(
    outcome,
    'the files, routes, config, tests, and helpers related to "' +
      title +
      '" in ' +
      category +
      '. ' +
      (detail ? 'Use this issue context: ' + detail : 'Identify the current behavior before editing.'),
    '1. Close the gap with the smallest safe code or config change.\n2. Update docs or SPEC.md if the behavior, route matrix, roles, provider setup, or deployment assumptions change.\n3. Keep the implementation aligned with the project\'s existing stack and file structure.',
    '- Preserve existing behavior unless it is unsafe or contradicts the product spec.\n- Do not add broad rewrites, new services, or compatibility shims unless they are necessary for this gap.\n- Do not claim external dashboard setup is complete from repo evidence alone.',
    '- Add or update focused tests for the changed behavior, or document a manual check when automation is not practical.\n- Run the relevant test suite and TypeScript check.\n- Summarize what changed, what you verified locally, and what still depends on a provider dashboard or external config.'
  );
}

(function applyMoodBackground() {
  const enc = document.documentElement.getAttribute('data-bg-uri');
  if (!enc) {
    return;
  }
  let uri = '';
  try {
    uri = decodeURIComponent(enc);
  } catch {
    return;
  }
  if (!uri) {
    return;
  }
  const kind = document.documentElement.getAttribute('data-bg-kind') || '';
  document.body.classList.add('station-body--art');
  if (kind === 'landscape') {
    document.body.classList.add('station-body--art-land');
  } else if (kind === 'portrait') {
    document.body.classList.add('station-body--art-port');
  } else if (kind === 'legacy') {
    document.body.classList.add('station-body--art-legacy');
  } else {
    document.body.classList.add('station-body--art-port');
  }
  document.body.style.setProperty('--station-bg', "url('".concat(uri, "')"));
})();

function releaseCockpitPointerState() {
  document.querySelectorAll('button, [data-ide-cmd]').forEach((node) => {
    if (node instanceof HTMLElement) {
      node.blur();
    }
  });
  const ae = document.activeElement;
  if (ae && ae !== document.body && ae instanceof HTMLElement) {
    ae.blur();
  }
  if (document.body) {
    document.body.style.removeProperty('cursor');
  }
}

document.querySelectorAll('[data-ide-cmd]').forEach((el) => {
  el.addEventListener('click', (event) => {
    const cmd = el.getAttribute('data-ide-cmd');
    if (cmd) {
      vscode.postMessage({ type: 'ide:' + cmd });
    }
    /* Next frame: host may steal focus before mouseup, leaving :active stuck */
    requestAnimationFrame(() => {
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.blur();
      }
    });
  });
});

const promptForm = document.getElementById('prompt-form');
const promptInput = document.getElementById('prompt-input');

function requestStationSignIn() {
  setRunButtonState('idle');
  vscode.postMessage({ type: 'session:signIn' });
}

function canRunManagedScan() {
  if (lastSessionSignedIn) {
    return true;
  }
  syncScanAccessState();
  requestStationSignIn();
  return false;
}

function startManagedScan(prompt) {
  if (!canRunManagedScan()) {
    return;
  }
  lastPrompt = prompt;
  showMcState('scanning');
  animateScanStages();
  setRunButtonState('running');
  vscode.postMessage({ type: 'prompt:submit', prompt: lastPrompt });
}

if (promptForm && promptInput) {
  promptForm.addEventListener('submit', (event) => {
    event.preventDefault();
    startManagedScan(readInputValue(promptInput));
  });
}

window.addEventListener('message', (event) => {
  if (!event || !event.data) {
    return;
  }

  if (event.data.type === 'station:releasePointer') {
    releaseCockpitPointerState();
    return;
  }

  if (event.data.type === 'session:update') {
    renderSession(normalizeSession(event.data.payload));
    return;
  }

  if (event.data.type === 'station:providerRegistry:update') {
    applyProviderRegistrySnapshot(event.data.payload);
    if (lastPayload) {
      renderPayload(lastPayload, { preserveCategory: true });
    }
    return;
  }

  if (event.data.type === 'station:productionConnections:update') {
    productionConnectionChoices = normalizeProductionConnectionChoicesPayload(event.data.payload);
    if (isRecord(event.data.payload) && isRecord(event.data.payload.productionConnections)) {
      productionConnectionSummary = normalizeProductionConnectionSummaryPayload(event.data.payload.productionConnections);
    } else {
      productionConnectionSummary = mergeProductionConnectionSummaryWithChoices(
        productionConnectionSummary,
        productionConnectionChoices
      );
    }
    if (lastPayload) {
      renderPayload(lastPayload, { preserveCategory: true });
    }
    return;
  }

  if (event.data.type === 'station:manualConfirmations:update') {
    setManualConfirmationState(isRecord(event.data.state) ? event.data.state : event.data.payload);
    if (lastPayload) {
      renderPayload(lastPayload, { preserveCategory: true });
    }
    return;
  }

  if (event.data.type === 'station:mcpVerifierState:update') {
    setMcpVerifierState(isRecord(event.data.snapshot) ? event.data.snapshot : event.data.payload);
    if (lastPayload) {
      renderPayload(lastPayload, { preserveCategory: true });
    }
    return;
  }

  if (event.data.type === 'station:mcpHelper') {
    renderMcpHelperModal(event.data.payload);
    return;
  }

  if (event.data.type === 'station:scanLimit') {
    const p = isRecord(event.data.payload) ? event.data.payload : {};
    const upgradeUrl = typeof p.upgradeUrl === 'string' ? p.upgradeUrl : '';
    stopScanAnimation();
    const limitPayload = {
      stationRunFailed: true,
      scanLimitUpgrade: true,
      reason: 'You have used all scans included in your current plan.',
      impact: 'Your last Mission Map is still available. Upgrade to Pro when you want to run more managed scans.',
      upgradeUrl
    };
    if (lastPayload && !lastPayload.stationRunFailed) {
      renderPayload(lastPayload);
      renderScanLimitNotice(limitPayload);
    } else {
      renderMissionControl(limitPayload);
    }
    renderSession(
      normalizeSession({
        signedIn: true,
        account: p.account,
        usage: p.usage
      })
    );
    setRunButtonState('idle');
    return;
  }

  if (event.data.type === 'station:scanStarted') {
    const p = isRecord(event.data.payload) ? event.data.payload : {};
    const prompt = readString(p.prompt);
    if (prompt) {
      lastPrompt = prompt;
    }
    showMcState('scanning');
    animateScanStages();
    setRunButtonState('running');
    return;
  }

  if (event.data.type === 'station:restoreLastScan') {
    const p = isRecord(event.data.payload) ? event.data.payload : {};
    if (lastPayload && p.force !== true) {
      return;
    }
    const payload = normalizePayload(p.payload);
    if (!isRecord(payload) || typeof payload.score !== 'number') {
      showMcState('idle');
      return;
    }
    productionConnectionSummary = normalizeProductionConnectionSummaryPayload(payload.productionConnections);
    providerTruth = payload.providerTruth || null;
    launchValidation = payload.launchValidation || null;
    renderPayload(payload, { lastScannedAt: readString(p.lastScannedAt), cachedRestore: true });
    setRunButtonState('idle');
    return;
  }

  if (event.data.type === 'station:update') {
    const payload = normalizePayload(event.data.payload);
    productionConnectionSummary = normalizeProductionConnectionSummaryPayload(payload.productionConnections);
    providerTruth = payload.providerTruth || null;
    launchValidation = payload.launchValidation || null;
    const lastScannedAt = persistLastScan(payload);
    renderPayload(payload, { lastScannedAt });
    setRunButtonState('idle');
    flashReadoutUpdated();

    if (payload.account || payload.usage) {
      renderSession({
        signedIn: true,
        account: payload.account,
        usage: payload.usage
      });
    }
  }
});

restoreLastScan();
requestFreshSessionState();

function readInputValue(input) {
  return typeof input.value === 'string' ? input.value : '';
}

function requestFreshSessionState() {
  try {
    vscode.postMessage({ type: 'session:refresh' });
  } catch {
    /* The host will still push session state when available. */
  }
}

function readSavedStationState() {
  if (!vscode || typeof vscode.getState !== 'function') {
    return null;
  }
  try {
    const state = vscode.getState();
    return isRecord(state) ? state : null;
  } catch {
    return null;
  }
}

function persistLastScan(payload) {
  const lastScannedAt = new Date().toISOString();
  if (!vscode || typeof vscode.setState !== 'function') {
    return lastScannedAt;
  }
  try {
    const existing = readSavedStationState() || {};
    vscode.setState({
      ...existing,
      lastPayload: payload,
      lastScannedAt
    });
  } catch {
    /* Webview state persistence is best-effort. */
  }
  return lastScannedAt;
}

function resolveLastScannedAt(options) {
  if (options && options.lastScannedAt) {
    const fromOpts = readString(options.lastScannedAt);
    if (fromOpts) {
      return fromOpts;
    }
  }
  const saved = readSavedStationState();
  return readString(saved && saved.lastScannedAt);
}

function restoreStationUiState(state, options) {
  if (!isRecord(state)) {
    return;
  }
  if (options && options.restoreSelection === true && typeof state.selectedProductionCategoryKey === 'string') {
    selectedProductionCategoryKey = state.selectedProductionCategoryKey;
  }
  if (isRecord(state.selectedToolPaths)) {
    selectedToolPaths = { ...state.selectedToolPaths };
  }
  if (isRecord(state.studioSectionSteps)) {
    studioSectionSteps = {};
    Object.keys(state.studioSectionSteps).forEach(function (key) {
      if (state.studioSectionSteps[key] === 'choose') {
        studioSectionSteps[key] = 'choose';
      }
    });
  }
  if (isRecord(state.studioGeneratedTasks)) {
    studioGeneratedTasks = { ...state.studioGeneratedTasks };
  }
}

function persistStationUiState() {
  if (!vscode || typeof vscode.setState !== 'function') {
    return;
  }
  try {
    const existing = readSavedStationState() || {};
    vscode.setState({
      ...existing,
      selectedProductionCategoryKey,
      selectedToolPaths: { ...selectedToolPaths },
      studioSectionSteps: { ...studioSectionSteps },
      studioGeneratedTasks: { ...studioGeneratedTasks }
    });
  } catch {
    /* Webview state persistence is best-effort. */
  }
}

function restoreLastScan() {
  const savedState = readSavedStationState();
  restoreStationUiState(savedState);
  if (savedState && savedState.lastPayload && typeof savedState.lastPayload.score === 'number') {
    productionConnectionSummary = normalizeProductionConnectionSummaryPayload(savedState.lastPayload.productionConnections);
    providerTruth = savedState.lastPayload.providerTruth || null;
    launchValidation = savedState.lastPayload.launchValidation || null;
    renderPayload(savedState.lastPayload, { lastScannedAt: readString(savedState.lastScannedAt) });
    return;
  }
  showMcState('idle');
}

function setRunButtonState(state) {
  const btn = document.querySelector('.command-deck__run');
  if (!btn) {
    return;
  }
  if ('disabled' in btn) {
    btn.disabled = state === 'running';
  }
  btn.classList.remove('command-deck__run--running', 'command-deck__run--success');
  const label = btn.querySelector ? btn.querySelector('.command-deck__run-text') : null;
  const sub = btn.querySelector ? btn.querySelector('.command-deck__run-sub') : null;
  if (state === 'running') {
    btn.classList.add('command-deck__run--running');
    if (label) {
      label.textContent = 'Scanning...';
    } else {
      btn.textContent = 'Scanning...';
    }
    if (sub) {
      sub.textContent = 'Building Mission Map with gaps and Raven guides';
    }
    return;
  }
  syncScanAccessState();
}

function flashReadoutUpdated() {
  try {
    if (typeof window.matchMedia !== 'function') {
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
  } catch {
    /* matchMedia unavailable */
  }
  const stack = document.querySelector('.station-stage') || document.querySelector('.results-stack');
  if (!(stack instanceof HTMLElement)) {
    return;
  }
  stack.classList.remove('results-stack--updated');
  // Restart CSS animation if the host sends updates in quick succession
  void stack.offsetWidth;
  stack.classList.add('results-stack--updated');
  window.setTimeout(() => {
    stack.classList.remove('results-stack--updated');
  }, 420);
}

function renderPayload(payload, options) {
  renderMissionControl(payload, options);
}

/** When Mission Control is visible, collapse pre-scan chrome so the readout fills the panel. */
function setStationMissionTakeover(active) {
  function apply(root) {
    if (!root || !root.classList) {
      return;
    }
    const cl = root.classList;
    if (active) {
      if (typeof cl.add === 'function') {
        cl.add('station-mc-takeover');
      }
    } else if (typeof cl.remove === 'function') {
      cl.remove('station-mc-takeover');
    }
  }
  apply(document.body);
  apply(document.documentElement);
}

function showMcState(state) {
  const states = {
    idle: document.getElementById('mc-idle'),
    scanning: document.getElementById('mc-scanning'),
    results: document.getElementById('mc-results')
  };
  if (document.body && document.body.classList) {
    if (state === 'results') {
      document.body.classList.add('station-results-active');
    } else {
      document.body.classList.remove('station-results-active');
    }
  }
  Object.keys(states).forEach((key) => {
    const element = states[key];
    if (element) {
      element.hidden = key !== state;
    }
  });
  setStationMissionTakeover(state !== 'idle');
}

function animateScanStages() {
  stopScanAnimation();
  SCAN_STAGES.forEach((stage, index) => {
    if (index === 0) {
      applyScanStage(stage);
      return;
    }
    const timer = window.setTimeout(() => {
      applyScanStage(stage);
    }, index * 700);
    scanStageTimers.push(timer);
  });
}

function stopScanAnimation() {
  scanStageTimers.forEach((timer) => {
    window.clearTimeout(timer);
  });
  scanStageTimers = [];
}

function applyScanStage(stage) {
  setTextById('mc-scan-label', stage.label);
  const bar = document.getElementById('mc-bar-fill');
  if (!bar) {
    return;
  }
  bar.style.width = stage.width + '%';
  bar.setAttribute('aria-valuenow', String(stage.width));
  bar.classList.remove('mc-bar-fill--amber', 'mc-bar-fill--green');
  if (stage.width >= 70) {
    bar.classList.add('mc-bar-fill--green');
  } else if (stage.width >= 40) {
    bar.classList.add('mc-bar-fill--amber');
  }
}

function setTextById(id, text) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = String(text || '');
  }
}

function setResultsBar(score) {
  const bar = document.getElementById('mc-results-bar');
  if (!bar) {
    return;
  }
  bar.style.width = score + '%';
  bar.setAttribute('aria-valuenow', String(score));
  bar.classList.remove('mc-bar-fill--amber', 'mc-bar-fill--green');
  if (score >= 70) {
    bar.classList.add('mc-bar-fill--green');
  } else if (score >= 40) {
    bar.classList.add('mc-bar-fill--amber');
  }
}

function renderMissionControl(payload, options) {
  stopScanAnimation();
  lastPayload = payload;
  const failedEarly = isRecord(payload) && payload.stationRunFailed === true;
  if (isRecord(payload) && !failedEarly && !(options && options.preserveCategory)) {
    selectedProductionCategoryKey = '';
    dismissedStudioMapActionCategoryKey = '';
    expandedGapId = '';
  }
  const checklistForNav = ensureProductionChecklist(isRecord(payload) ? payload : {});
  ensureValidSelectedCategoryKey(checklistForNav);
  const failed = isRecord(payload) && payload.stationRunFailed === true;
  const errorHost = document.getElementById('mc-error');
  const mcResults = document.getElementById('mc-results');
  const specNotes = document.getElementById('mc-spec-notes');
  const groupsRoot = document.getElementById('mc-groups');

  if (failed) {
    if (mcResults instanceof HTMLElement) {
      mcResults.classList.add('mc-state--results-error');
    }
    if (errorHost) {
      errorHost.hidden = false;
      errorHost.replaceChildren(buildMcErrorBanner(payload));
    }
    setTextById('mc-score-pct', '\u2014');
    setTextById('mc-score-label', 'Scan incomplete');
    const failPct = document.getElementById('mc-score-pct');
    const failLbl = document.getElementById('mc-score-label');
    if (failPct instanceof HTMLElement) {
      stripScoreBandClasses(failPct);
    }
    if (failLbl instanceof HTMLElement) {
      stripScoreBandClasses(failLbl);
    }
    setTextById('mc-status-line', 'Fix the issue below, then retry the scan.');
    const failStatus = document.getElementById('mc-status-line');
    if (failStatus instanceof HTMLElement) {
      failStatus.title = '';
    }
    setTextById('mc-score-hint', '');
    setMcLastScannedFooter(resolveLastScannedAt(options), options);
    const failBar = document.getElementById('mc-results-bar');
    if (failBar) {
      failBar.style.width = '0%';
      failBar.setAttribute('aria-valuenow', '0');
      failBar.setAttribute('aria-valuetext', 'Not available after a failed scan');
      failBar.setAttribute('aria-label', 'Production readiness not available');
      failBar.classList.remove('mc-bar-fill--amber', 'mc-bar-fill--green');
    }
    if (groupsRoot) {
      groupsRoot.replaceChildren();
    }
    clearProductionChrome();
    setSection('spec-update', null);
    if (specNotes instanceof HTMLElement) {
      specNotes.hidden = true;
    }
    announceMissionControlReadout(payload, 0, true);
    showMcState('results');
    return;
  }

  // Success path — new schema
  if (mcResults instanceof HTMLElement) {
    mcResults.classList.remove('mc-state--results-error');
  }
  if (errorHost) {
    errorHost.hidden = true;
    errorHost.replaceChildren();
  }

  // Score from model (0–100)
  const score = stableVisibleScore(payload.score);
  const labelRaw = typeof payload.scoreLabel === 'string' && payload.scoreLabel ? payload.scoreLabel : 'At risk';
  setTextById('mc-score-pct', score + '%');
  setTextById('mc-score-label', labelRaw.toUpperCase());
  applyMainScoreBand(score);
  const mainBar = document.getElementById('mc-results-bar');
  if (mainBar instanceof HTMLElement) {
    mainBar.style.width = score + '%';
    mainBar.setAttribute('aria-valuenow', String(score));
    mainBar.classList.remove('mc-bar-fill--amber', 'mc-bar-fill--green');
  }

  const gaps = Array.isArray(payload.gaps) ? payload.gaps : [];
  const fullSummary = typeof payload.summary === 'string' ? payload.summary.replace(/\s+/g, ' ').trim() : '';
  /* Cap only for pathological payload size; normal summaries show in full in the panel. */
  const maxSummary = 4000;
  const summary = fullSummary.length > maxSummary ? fullSummary.slice(0, maxSummary - 1).replace(/\s+\S*$/, '') + '\u2026' : fullSummary;
  setTextById('mc-status-line', summary);
  const statusLineEl = document.getElementById('mc-status-line');
  if (statusLineEl instanceof HTMLElement) {
    statusLineEl.title = '';
  }
  setTextById('mc-score-hint', '');

  renderPlanPills();
  renderScanInsights(payload);
  const checklist = checklistForNav;
  renderOverviewLevel1(checklist, gaps, score);

  const gapCount = gaps.length;
  const statusText =
    gapCount === 0
      ? 'No blocking gaps found'
      : gapCount + ' gap' + (gapCount === 1 ? '' : 's') + ' to close';
  setTextById('mc-results-title', statusText);

  const qw = document.getElementById('mc-quick-wins');
  if (qw instanceof HTMLElement) {
    qw.hidden = true;
    qw.replaceChildren();
  }

  // Spec notes — hide (quick wins section replaces this)
  if (specNotes instanceof HTMLElement) {
    specNotes.hidden = true;
  }

  // Timestamp (persisted ISO from last successful scan, or explicit options.lastScannedAt)
  setMcLastScannedFooter(resolveLastScannedAt(options), options);

  // Screen reader announcement
  const announce = document.getElementById('mc-announce');
  if (announce) {
    announce.textContent = 'Scan complete. Score: ' + score + '%. ' + gapCount + ' gaps found.';
  }

  showMcState('results');
}

function buildMcErrorBanner(payload) {
  const wrap = document.createElement('div');
  wrap.className = 'mc-error__inner';
  const title = document.createElement('p');
  title.className = 'mc-error__title';
  const isLimit = isRecord(payload) && payload.scanLimitUpgrade === true;
  title.textContent = isLimit ? 'Free scan limit reached' : 'Scan could not finish';
  const reason = document.createElement('p');
  reason.className = 'mc-error__reason';
  reason.textContent = stripHtml(isRecord(payload) ? payload.reason : '') || 'An unknown error occurred.';
  wrap.appendChild(title);
  wrap.appendChild(reason);
  const impact = stripHtml(isRecord(payload) ? payload.impact : '');
  if (impact) {
    const impactEl = document.createElement('p');
    impactEl.className = 'mc-error__impact';
    impactEl.textContent = impact;
    wrap.appendChild(impactEl);
  }
  const actions = document.createElement('div');
  actions.className = 'mc-error__actions';
  if (isLimit) {
    const upgrade = document.createElement('button');
    upgrade.type = 'button';
    upgrade.className = 'mc-error__retry station-action-btn';
    upgrade.setAttribute('aria-label', 'Open VibeRaven account page to upgrade');
    upgrade.textContent = 'Upgrade to Pro';
    upgrade.addEventListener('click', () => {
      vscode.postMessage({ type: 'session:openAccount' });
    });
    actions.appendChild(upgrade);
  }
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'mc-error__retry station-action-btn';
  retry.setAttribute('data-station-action', 'mc-retry-scan');
  retry.setAttribute('aria-label', 'Retry the Station workspace scan');
  retry.textContent = 'Retry scan';
  actions.appendChild(retry);
  wrap.appendChild(actions);
  return wrap;
}

function renderScanLimitNotice(payload) {
  const errorHost = document.getElementById('mc-error');
  if (errorHost) {
    errorHost.hidden = false;
    errorHost.replaceChildren(buildMcErrorBanner(payload));
  }
  const mcResults = document.getElementById('mc-results');
  if (mcResults instanceof HTMLElement) {
    mcResults.classList.remove('mc-state--results-error');
  }
  setTextById('mc-results-title', 'Free scan limit reached');
  const announce = document.getElementById('mc-announce');
  if (announce) {
    announce.textContent = 'Free scan limit reached. Your last Mission Map remains visible.';
  }
  showMcState('results');
}

function announceMissionControlReadout(payload, score, failed) {
  const el = document.getElementById('mc-announce');
  if (!el) {
    return;
  }
  if (failed) {
    el.textContent = 'Station scan failed. Review the alert and use Retry scan if you want to try again.';
    return;
  }
  const status = stripHtml(isRecord(payload) ? payload.status : '') || 'drifting';
  const statusLabel = status === 'stable' ? 'Stable' : status === 'chaos' ? 'Needs work' : 'Drifting';
  el.textContent =
    'Mission Control updated. Production readiness ' + score + ' percent. Status ' + statusLabel + '.';
}

function formatLastScannedLabel(value, cached) {
  const raw = readString(value);
  const prefix = cached ? 'Cached scan' : 'Last scan';
  if (!raw) {
    return cached ? 'Cached scan: unavailable' : 'Not scanned yet';
  }
  const time = Date.parse(raw);
  if (!Number.isFinite(time)) {
    return prefix + ': unknown time';
  }
  const d = new Date(time);
  const when = d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  return prefix + ': ' + when;
}

function setMcLastScannedFooter(isoValue, options) {
  const el = document.getElementById('mc-last-scanned');
  if (!el) {
    return;
  }
  const cached = Boolean(options && options.cachedRestore);
  el.textContent = formatLastScannedLabel(isoValue, cached);
  if (el instanceof HTMLElement) {
    const raw = readString(isoValue);
    el.title = raw ? (cached ? 'Cached UTC: ' : 'UTC: ') + raw : '';
  }
}

function renderSession(session) {
  lastSessionSignedIn = Boolean(session && session.signedIn);
  if (session && session.signedIn && session.usage) {
    lastSessionUsage = session.usage;
  } else if (!session || !session.signedIn) {
    lastSessionUsage = null;
    lastAccountPlan = 'free';
  }
  if (session && session.signedIn) {
    lastAccountPlan = effectivePlanForSession(session);
  }
  syncScanAccessState();
  setSection('session', session.signedIn ? buildSignedInPilot(session) : buildSignedOutPilot());
  rerenderVisiblePayloadAfterSessionChange();
}

function syncScanAccessState() {
  if (document.body && document.body.classList) {
    document.body.classList[lastSessionSignedIn ? 'add' : 'remove']('station-signed-in');
    document.body.classList[lastSessionSignedIn ? 'remove' : 'add']('station-signed-out');
  }

  const btn = document.querySelector('.command-deck__run');
  if (!(btn instanceof HTMLElement)) {
    return;
  }

  const label = btn.querySelector ? btn.querySelector('.command-deck__run-text') : null;
  const sub = btn.querySelector ? btn.querySelector('.command-deck__run-sub') : null;
  btn.classList[lastSessionSignedIn ? 'remove' : 'add']('command-deck__run--locked');
  btn.setAttribute(
    'title',
    lastSessionSignedIn
      ? 'Scan this workspace and open Mission Map'
      : 'Sign in to VibeRaven before running a scan'
  );
  if (label) {
    label.textContent = lastSessionSignedIn ? 'Scan Project' : 'Sign in to scan';
  } else {
    btn.textContent = lastSessionSignedIn ? 'Scan Project' : 'Sign in to scan';
  }
  if (sub) {
    sub.textContent = lastSessionSignedIn
      ? 'Open Mission Map with stack controls'
      : 'Connect account first';
  }
}

function effectivePlanForSession(session) {
  const accountPlan = readString(session && session.account && session.account.plan).toLowerCase();
  if (accountPlan === 'pro' || accountPlan === 'free') {
    return accountPlan;
  }
  const usagePlan = readString(session && session.usage && session.usage.plan).toLowerCase();
  return usagePlan === 'pro' ? 'pro' : 'free';
}

function rerenderVisiblePayloadAfterSessionChange() {
  if (!lastPayload || lastPayload.stationRunFailed) {
    return;
  }
  const results = document.getElementById('mc-results');
  if (!results || results.hidden) {
    return;
  }
  const errorHost = document.getElementById('mc-error');
  if (errorHost && !errorHost.hidden) {
    return;
  }
  renderPayload(lastPayload, { preserveCategory: true });
}

function blurStationButton(e) {
  requestAnimationFrame(() => {
    if (e && e.currentTarget instanceof HTMLElement) {
      e.currentTarget.blur();
    }
  });
}

function buildSignedInPilot(session) {
  const account = session.account || {};
  const usage = session.usage || {};
  const emailStr = account.email || 'Connected';

  const wrap = document.createElement('div');
  wrap.className = 'account-bar pilot-card';

  const main = document.createElement('div');
  main.className = 'account-bar__main';

  const identity = document.createElement('div');
  identity.className = 'account-bar__identity';

  const idText = document.createElement('div');
  idText.className = 'account-bar__id-text';
  const email = document.createElement('span');
  email.className = 'account-bar__email';
  email.textContent = emailStr;
  email.setAttribute('title', emailStr);

  const planKey = effectivePlanForSession(session);
  const isPro = planKey === 'pro';
  const badge = document.createElement('span');
  badge.className = 'pilot-badge pilot-badge--' + (isPro ? 'pro' : 'free');
  badge.textContent = isPro ? 'Pro' : 'Free';
  idText.append(email, badge);
  identity.append(idText);

  const meta = document.createElement('p');
  meta.className = 'account-bar__meta';
  const parts = [];
  if (typeof usage.used === 'number' && typeof usage.limit === 'number') {
    const label =
      usage.period === 'monthly' || isPro ? usage.used + '/' + usage.limit + ' scans this month' : usage.used + '/' + usage.limit + ' free scans used';
    parts.push(label);
  } else if (typeof usage.remainingPrompts === 'number') {
    parts.push('Scans remaining: ' + usage.remainingPrompts);
  }
  if (parts.length > 0) {
    meta.textContent = parts.join(' · ');
  } else {
    meta.textContent = 'Managed session active';
  }

  main.append(identity, meta);

  const actions = document.createElement('div');
  actions.className = 'account-bar__actions';

  const bPlans = document.createElement('button');
  bPlans.type = 'button';
  bPlans.className = 'pilot-btn pilot-btn--primary account-bar__action';
  bPlans.textContent = isPro ? 'Plans' : 'Upgrade';
  bPlans.setAttribute('title', isPro ? 'View pricing in the browser' : 'View plans and upgrade in the browser');
  bPlans.addEventListener('click', (e) => {
    if (isPro) {
      vscode.postMessage({ type: 'session:openSitePath', path: '/#pricing' });
    } else {
      vscode.postMessage({ type: 'session:openAccount' });
    }
    blurStationButton(e);
  });

  const bAccount = document.createElement('button');
  bAccount.type = 'button';
  bAccount.className = 'pilot-btn pilot-btn--ghost account-bar__action';
  bAccount.textContent = 'Account';
  bAccount.setAttribute('title', 'Manage account in the browser');
  bAccount.addEventListener('click', (e) => {
    vscode.postMessage({ type: 'session:openAccount' });
    blurStationButton(e);
  });

  const bOut = document.createElement('button');
  bOut.type = 'button';
  bOut.className = 'pilot-btn pilot-btn--quiet account-bar__action';
  bOut.textContent = 'Sign out';
  bOut.addEventListener('click', (e) => {
    vscode.postMessage({ type: 'session:signOut' });
    blurStationButton(e);
  });

  actions.append(bPlans, bAccount, bOut);
  wrap.append(main, actions);
  return wrap;
}

function buildSignedOutPilot() {
  const wrap = document.createElement('div');
  wrap.className = 'account-bar account-bar--signed-out pilot-card pilot-unsigned';

  const main = document.createElement('div');
  main.className = 'account-bar__signed-out-main';
  const title = document.createElement('p');
  title.className = 'account-bar__signed-out-title';
  title.textContent = 'Sign in to start scanning';
  const hint = document.createElement('p');
  hint.className = 'account-bar__signed-out-hint';
  hint.textContent = 'Connect your VibeRaven account first. The project scan unlocks after sign-in.';
  main.append(title, hint);

  const actions = document.createElement('div');
  actions.className = 'account-bar__signed-out-actions';

  const bIn = document.createElement('button');
  bIn.type = 'button';
  bIn.className = 'pilot-btn pilot-btn--primary';
  bIn.textContent = 'Sign in';
  bIn.setAttribute('title', 'Open VibeRaven in your browser to connect this editor');
  bIn.addEventListener('click', (e) => {
    vscode.postMessage({ type: 'session:signIn' });
    blurStationButton(e);
  });

  actions.append(bIn);
  wrap.append(main, actions);
  return wrap;
}

function formatTrialDate(iso) {
  if (!iso || typeof iso !== 'string') {
    return '';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildStatusContent(payload) {
  const container = document.createElement('div');
  const s = (payload.status || 'stable').toLowerCase();
  const mood = s === 'drifting' || s === 'chaos' || s === 'stable' ? s : 'stable';
  const readAs = document.createElement('p');
  readAs.className = 'station-read-as';
  readAs.textContent =
    mood === 'chaos'
      ? 'Read this as: stabilize the repo before adding more product surface.'
      : mood === 'drifting'
        ? 'Read this as: the repo is moving, but the next step needs sharper evidence.'
        : 'Read this as: the repo is steady enough to take the next focused step.';
  const line = document.createElement('div');
  line.className = 'signal-line signal-line--' + mood;
  line.textContent = (payload.status || '—').toString();
  const reason = document.createElement('div');
  reason.className = 'signal-reason';
  reason.textContent = payload.reason;
  container.append(readAs, line, reason);
  if (payload.momentum) {
    const mom = document.createElement('div');
    mom.className = 'status-momentum';
    mom.textContent = 'Momentum: ' + payload.momentum;
    container.appendChild(mom);
  }
  return container;
}

function buildReadoutActionButton(label, action, disabled) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'station-action-btn';
  b.textContent = label;
  b.setAttribute('data-station-action', action);
  b.disabled = Boolean(disabled);
  return b;
}

function buildNextMoveText(payload) {
  return (payload.nextMove && payload.nextMove.trim()) || (payload.recommended && payload.recommended.trim()) || '';
}

/** First HOT path, else first non-empty path — for a single “open this” affordance. */
function getKeyFilePath(filePulse) {
  if (!filePulse || filePulse.length === 0) {
    return '';
  }
  const hot = filePulse.find((e) => (e.heat || '').toLowerCase() === 'hot' && e.path && e.path.trim());
  if (hot) {
    return hot.path;
  }
  const first = filePulse.find((e) => e.path && e.path.trim());
  return first ? first.path : '';
}

function buildChatHandoffText(payload) {
  const parts = [];
  const nm = buildNextMoveText(payload);
  if (nm) {
    parts.push('Next move: ' + nm);
  }
  if (lastPrompt && lastPrompt.trim()) {
    parts.push('Original question: ' + lastPrompt.trim());
  }
  if (payload.filePulse && payload.filePulse.length > 0) {
    const lines = payload.filePulse
      .map((e) => (e.path && e.path.trim() ? '- ' + e.path : ''))
      .filter(Boolean);
    if (lines.length > 0) {
      parts.push('Files to review:\n' + lines.join('\n'));
    }
  }
  return parts.join('\n\n');
}

function buildCoachModel(payload) {
  const nextMove = buildNextMoveText(payload);
  const status = (payload.status || 'stable').toLowerCase();
  const reason = payload.reason && payload.reason.trim() ? payload.reason.trim() : 'Station has enough signal for the next move.';
  const statusLine =
    status === 'chaos'
      ? 'This repo needs stabilization before more feature work.'
      : status === 'drifting'
        ? 'The project is moving, but the next step needs sharper product focus.'
        : 'The project is steady enough for the next implementation step.';
  const missing = [...payload.missing, ...payload.ghosts].filter(Boolean).slice(0, 5);
  if (missing.length === 0 && payload.specUpdate.length > 0) {
    missing.push('Spec needs the latest Station updates before coding continues.');
  }
  if (missing.length === 0) {
    missing.push('No explicit production blocker was called out in this run.');
  }
  const files = payload.filePulse
    .map((entry) => entry.path && entry.path.trim())
    .filter(Boolean)
    .slice(0, 4);
  const prompt = buildAgentPromptText(payload, nextMove, missing, files);
  const checklist = buildChecklistText(payload, nextMove, missing, files);
  return {
    statusLine,
    reason,
    nextMove,
    missing,
    files,
    prompt,
    checklist
  };
}

function buildAgentPromptText(payload, nextMove, missing, files) {
  const lines = [
    'Act as my senior product engineer inside this repo.',
    '',
    'Goal: move this project closer to a real shippable product.',
    'Next move: ' + (nextMove || 'Find the single best next implementation step.'),
    'Status: ' + (payload.status || 'unknown') + (payload.momentum ? ' / momentum: ' + payload.momentum : ''),
    'Why this matters: ' + (payload.reason || payload.impact || 'Reduce uncertainty before coding more.'),
    ''
  ];
  if (missing.length > 0) {
    lines.push('Missing before production:');
    missing.forEach((item) => lines.push('- ' + item));
    lines.push('');
  }
  if (files.length > 0) {
    lines.push('Start with these files:');
    files.forEach((file) => lines.push('- ' + file));
    lines.push('');
  }
  lines.push('Give me exact steps, files to open, and the safest first code change. Keep the answer concrete and low-level.');
  return lines.join('\n');
}

function buildChecklistText(payload, nextMove, missing, files) {
  const lines = [
    '# VibeRaven production checklist',
    '',
    'Generated from the latest VibeRaven run.',
    '',
    '## Next move',
    '',
    '- [ ] ' + (nextMove || 'Decide the next implementation step.'),
    '',
    '## Missing before production',
    ''
  ];
  missing.forEach((item) => lines.push('- [ ] ' + item));
  if (files.length > 0) {
    lines.push('', '## Files to inspect', '');
    files.forEach((file) => lines.push('- [ ] `' + file + '`'));
  }
  if (payload.specUpdate.length > 0) {
    lines.push('', '## Spec updates', '');
    payload.specUpdate.forEach((line) => lines.push('- [ ] ' + humanizeSpecUpdateLine(line)));
  }
  return lines.join('\n');
}

function buildChecklistPayload(model, payload) {
  return {
    nextMove: model.nextMove,
    missing: model.missing,
    files: model.files,
    specUpdate: payload.specUpdate
  };
}

function appendCoachRow(container, label, content) {
  const row = document.createElement('div');
  row.className = 'coach-row';
  const lab = document.createElement('div');
  lab.className = 'coach-row__label';
  lab.textContent = label;
  const body = document.createElement('div');
  body.className = 'coach-row__body';
  if (typeof content === 'string') {
    body.textContent = content;
  } else {
    body.appendChild(content);
  }
  row.append(lab, body);
  container.appendChild(row);
}

function buildCoachBlock(payload) {
  const model = buildCoachModel(payload);
  const container = document.createElement('div');
  container.className = 'coach-block';
  appendCoachRow(container, 'You are here', model.statusLine);
  appendCoachRow(container, 'Do this now', model.nextMove || '\u2014');
  appendCoachRow(container, 'Why', model.reason);

  const missingList = document.createElement('ul');
  missingList.className = 'coach-missing-list';
  model.missing.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    missingList.appendChild(li);
  });
  appendCoachRow(container, 'Missing before production', missingList);

  const prompt = document.createElement('p');
  prompt.className = 'coach-prompt-preview';
  prompt.textContent = model.prompt;
  appendCoachRow(container, 'Next prompt', prompt);

  const actions = document.createElement('div');
  actions.className = 'station-readout-actions coach-actions';
  actions.append(
    buildReadoutActionButton('Start next step', 'start-next-step', !model.prompt.trim()),
    buildReadoutActionButton('Run follow-up scan', 'run-follow-up', !model.prompt.trim()),
    buildReadoutActionButton('Copy agent prompt', 'copy-agent-prompt', !model.prompt.trim()),
    buildReadoutActionButton('Create checklist', 'create-checklist', !model.checklist.trim())
  );
  container.appendChild(actions);
  return container;
}

function buildNextMoveBlock(payload) {
  const container = document.createElement('div');
  container.className = 'next-move-block';
  const line = buildNextMoveText(payload);
  const p = document.createElement('p');
  p.className = 'next-move-text';
  p.textContent = line.length > 0 ? line : '\u2014';
  const hint = document.createElement('p');
  hint.className = 'next-move-hint';
  hint.textContent = 'Start here, then use Touch these for more files, or copy for your AI chat.';
  const actions = document.createElement('div');
  actions.className = 'station-readout-actions';
  const chatText = buildChatHandoffText(payload);
  const keyPath = getKeyFilePath(payload.filePulse);
  const openKey = buildReadoutActionButton('Open key file', 'open-file', !keyPath);
  openKey.classList.add('station-action-btn--compact');
  if (keyPath) {
    openKey.setAttribute('data-path', keyPath);
  }
  actions.append(
    buildReadoutActionButton('Copy next move', 'copy-next-move', !line),
    openKey,
    buildReadoutActionButton('Copy for chat', 'copy-chat-prompt', !chatText.trim())
  );
  container.append(p, hint, actions);
  return container;
}

function buildStreamBlock(payload) {
  const wrap = document.createElement('div');
  wrap.className = 'stream-block';
  const hint = document.createElement('p');
  hint.className = 'station-read-as';
  hint.textContent = 'Read this as: the repo facts Station used to decide the next move.';
  wrap.appendChild(hint);

  function appendPillRow(label, items) {
    if (!items || items.length === 0) {
      return;
    }
    const row = document.createElement('div');
    row.className = 'stream-block__row';
    const lab = document.createElement('div');
    lab.className = 'stream-block__label';
    lab.textContent = label;
    const dd = document.createElement('div');
    dd.className = 'stream-block__pills';
    items.forEach((item) => {
      const pill = document.createElement('span');
      pill.className = 'stream-pill';
      pill.textContent = item;
      dd.appendChild(pill);
    });
    row.append(lab, dd);
    wrap.appendChild(row);
  }

  appendPillRow('Entities', payload.entities);
  appendPillRow('Behaviors', payload.behaviors);
  if (payload.missing && payload.missing.length > 0) {
    const row = document.createElement('div');
    row.className = 'stream-block__row';
    const lab = document.createElement('div');
    lab.className = 'stream-block__label';
    lab.textContent = 'Missing';
    const list = document.createElement('ul');
    list.className = 'stream-block__list';
    payload.missing.forEach((m) => {
      const li = document.createElement('li');
      li.textContent = m;
      list.appendChild(li);
    });
    row.append(lab, list);
    wrap.appendChild(row);
  }
  if (payload.impact) {
    const p = document.createElement('p');
    p.className = 'stream-block__impact';
    const strong = document.createElement('strong');
    strong.textContent = 'Impact: ';
    p.appendChild(strong);
    p.append(payload.impact);
    wrap.appendChild(p);
  }
  if (payload.confidence) {
    const p = document.createElement('p');
    p.className = 'stream-block__confidence';
    p.textContent = 'Confidence: ' + payload.confidence;
    wrap.appendChild(p);
  }
  if (wrap.children && wrap.children.length === 1) {
    const empty = document.createElement('p');
    empty.className = 'stream-block__empty';
    empty.textContent = 'No repo facts came back. Run a focused quick action like Architecture map or Ship-today risks.';
    wrap.appendChild(empty);
  }
  return wrap;
}

function buildFilePulseBlock(filePulse) {
  const container = document.createElement('div');
  container.className = 'file-pulse-block';
  if (!filePulse || filePulse.length === 0) {
    const p = document.createElement('p');
    p.className = 'file-pulse-block__empty';
    p.textContent = '\u2014';
    container.appendChild(p);
    return container;
  }
  filePulse.forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'file-row file-row--pulse';
    const badge = document.createElement('span');
    const heat = (entry.heat || 'cool').toLowerCase();
    const heatClass = ['hot', 'warm', 'cool'].indexOf(heat) >= 0 ? heat : 'cool';
    badge.className = 'heat-badge heat-badge--' + heatClass;
    badge.textContent = entry.heat || 'cool';
    const path = document.createElement('code');
    path.className = 'file-path';
    path.textContent = entry.path;
    row.append(badge, path);
    const hasPath = Boolean(entry.path && entry.path.trim());
    if (hasPath) {
      const openB = buildReadoutActionButton('Open', 'open-file', false);
      openB.classList.add('station-action-btn--compact');
      openB.setAttribute('data-path', entry.path);
      const copyB = buildReadoutActionButton('Copy', 'copy-file', false);
      copyB.classList.add('station-action-btn--compact');
      copyB.setAttribute('data-path', entry.path);
      const addB = buildReadoutActionButton('Add to prompt', 'add-file-to-prompt', false);
      addB.classList.add('station-action-btn--compact');
      addB.setAttribute('data-path', entry.path);
      row.append(openB, copyB, addB);
    }
    container.appendChild(row);
  });
  return container;
}

function humanizeSpecUpdateLine(raw) {
  const original = typeof raw === 'string' ? raw.trim() : '';
  if (!original) {
    return '';
  }
  let text = original
    .replace(/^(added|updated|removed|fixed|aligned|documented)\s+/i, '')
    .replace(/:$/, '')
    .trim();
  text = text.replace(/^inspect\s+/i, 'Inspect ');
  text = text.replace(/^update\s+/i, 'Update ');
  text = text.replace(/^align\s+/i, 'Align ');
  text = text.replace(/^document\s+/i, 'Document ');
  if (text === original.trim()) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }
  text = text.replace(/\b((?:src|tests|media|docs|services|landing)\/[^\s,;:]+|SPEC\.md)\b/g, '`$1`');
  if (!/[.!?]$/.test(text)) {
    text += '.';
  }
  return text;
}

function formatSpecUpdateForPaste(lines) {
  return (lines || [])
    .map(humanizeSpecUpdateLine)
    .filter(Boolean)
    .map((line) => '- [ ] ' + line)
    .join('\n');
}

function buildSpecUpdateBlock(lines) {
  const wrap = document.createElement('div');
  wrap.className = 'spec-update-block';
  if (!lines || lines.length === 0) {
    const p = document.createElement('p');
    p.className = 'spec-update-block__empty';
    p.textContent = '\u2014';
    wrap.appendChild(p);
    return wrap;
  }
  const combined = formatSpecUpdateForPaste(lines);
  const toolbar = document.createElement('div');
  toolbar.className = 'spec-update-toolbar';
  const toolbarLabel = document.createElement('span');
  toolbarLabel.className = 'spec-update-toolbar__label';
  toolbarLabel.textContent = 'Copy as checklist bullets (for SPEC or your agent)';
  const copyAll = buildReadoutActionButton('Copy spec bullets', 'copy-spec', !combined.trim());
  copyAll.classList.add('station-action-btn--compact');
  toolbar.append(toolbarLabel, copyAll);
  wrap.appendChild(toolbar);
  lines.forEach((line) => {
    const row = document.createElement('div');
    row.className = 'file-row spec-line';
    row.textContent = humanizeSpecUpdateLine(line);
    row.setAttribute('title', line);
    wrap.appendChild(row);
  });
  return wrap;
}

function buildOptionsBlock(options) {
  const wrap = document.createElement('div');
  wrap.className = 'options-block';
  if (!options || options.length === 0) {
    const p = document.createElement('p');
    p.className = 'options-block__empty options-block__hint';
    p.textContent = 'No alternate lanes this run. Follow Next move and Touch these.';
    wrap.appendChild(p);
    return wrap;
  }
  const ol = document.createElement('ol');
  ol.className = 'options-list';
  options.forEach((opt) => {
    const li = document.createElement('li');
    li.className = 'opt-row';
    li.textContent = opt.title;
    ol.appendChild(li);
  });
  wrap.appendChild(ol);
  return wrap;
}

function buildSimpleList(items, emphasize) {
  const container = document.createElement('div');
  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = emphasize ? 'opt-row' : 'file-row';

    if (emphasize) {
      const strong = document.createElement('strong');
      strong.textContent = item;
      row.append(strong);
    } else {
      row.textContent = item;
    }

    container.append(row);
  });
  return container;
}

function normalizePayload(payload) {
  return isRecord(payload) ? payload : {};
}

function normalizeVerificationSummaryPayload(payload) {
  const record = isRecord(payload) ? payload : {};
  const source = isRecord(record.byArea) ? record.byArea : {};
  const byArea = {};
  Object.keys(source).forEach(function (area) {
    const summary = source[area];
    if (!isRecord(summary)) {
      return;
    }
    byArea[area] = {
      area: readString(summary.area) || area,
      found: normalizeVerificationItems(summary.found),
      missing: normalizeVerificationItems(summary.missing),
      manual: normalizeVerificationItems(summary.manual)
    };
  });
  return { byArea: byArea };
}

function normalizeVerificationItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map(function (item) {
      if (!isRecord(item)) {
        return null;
      }
      const label = readString(item.label).trim();
      const status = readString(item.status).trim();
      const source = readString(item.source).trim();
      if (!label || !source || !['found', 'missing', 'manual'].includes(status)) {
        return null;
      }
      return {
        label: label,
        status: status,
        source: source,
        detail: readString(item.detail).trim()
      };
    })
    .filter(Boolean);
}

function normalizeProductionConnectionChoicesPayload(payload) {
  const record = isRecord(payload) ? payload : {};
  const source = isRecord(record.choices) ? record.choices : {};
  const choices = {};
  Object.keys(source).forEach(function (areaKey) {
    const value = source[areaKey];
    if (!isRecord(value)) {
      return;
    }
    const area = PRODUCTION_CHOICE_CATEGORY_AREAS[areaKey] || '';
    const provider = normalizeProductionChoiceProvider(value.provider);
    const selectedAt = readString(value.selectedAt);
    if (!area || !provider || !selectedAt) {
      return;
    }
    choices[area] = { provider, selectedAt };
  });
  return { version: 1, choices };
}

function summarizeSelectedProductionConnectionChoices(payload) {
  const choices = isRecord(payload) && isRecord(payload.choices) ? payload.choices : {};
  const byArea = {};
  const stackRow = [];
  Object.keys(choices).forEach(function (area) {
    const choice = choices[area];
    if (!isRecord(choice)) {
      return;
    }
    const provider = normalizeProductionChoiceProvider(choice.provider);
    if (!PRODUCTION_CHOICE_CATEGORY_AREAS[area] && area !== 'payments') {
      return;
    }
    if (!provider) {
      return;
    }
    const providerLabel = providerDisplayName(provider);
    const selectedAt = readString(choice.selectedAt);
    const summary = {
      area,
      label: (providerLabel || provider) + ' selected - setup not verified',
      provider,
      source: 'selected',
      status: ['selected', 'setup-not-verified'],
      signals: selectedAt ? ['Selected locally at ' + selectedAt] : []
    };
    byArea[area] = summary;
    stackRow.push(summary);
  });
  return { byArea, items: [], stackRow };
}

function mergeProductionConnectionSummaryWithChoices(currentSummary, choicesPayload) {
  const base = normalizeProductionConnectionSummaryPayload(currentSummary);
  const selected = summarizeSelectedProductionConnectionChoices(choicesPayload);
  const byArea = { ...base.byArea };

  Object.keys(selected.byArea).forEach(function (area) {
    byArea[area] = selected.byArea[area];
  });

  const stackRow = Object.keys(PRODUCTION_CHOICE_CATEGORY_AREAS)
    .map(function (categoryKey) {
      const area = PRODUCTION_CHOICE_CATEGORY_AREAS[categoryKey];
      return byArea[area];
    })
    .filter(function (summary) {
      return isRecord(summary) && readString(summary.provider).trim();
    });

  return { byArea, items: [], stackRow };
}

function normalizeProductionConnectionSummaryPayload(payload) {
  const record = isRecord(payload) ? payload : {};
  const source = isRecord(record.byArea) ? record.byArea : {};
  const byArea = {};
  Object.keys(source).forEach(function (area) {
    const value = source[area];
    if (!isRecord(value)) {
      return;
    }
    const label = readString(value.label).trim();
    if (!PRODUCTION_CHOICE_CATEGORY_AREAS[area] && area !== 'payments') {
      return;
    }
    byArea[area] = {
      area,
      label,
      provider: readString(value.provider),
      source: readString(value.source),
      status: readStringArray(value.status),
      signals: readStringArray(value.signals)
    };
  });
  const stackRow = Array.isArray(record.stackRow)
    ? record.stackRow
        .filter(function (value) {
          return isRecord(value);
        })
        .map(function (value) {
          return {
            area: readString(value.area),
            label: readString(value.label).trim(),
            provider: readString(value.provider),
            source: readString(value.source),
            status: readStringArray(value.status),
            signals: readStringArray(value.signals)
          };
        })
    : [];
  const derivedStackRow = stackRow.length > 0
    ? stackRow
    : Object.keys(byArea)
        .map(function (area) {
          return byArea[area];
        })
        .filter(function (summary) {
          return isRecord(summary) && readString(summary.provider).trim();
        });
  return { byArea, items: [], stackRow: derivedStackRow };
}

function normalizeSession(payload) {
  const record = isRecord(payload) ? payload : {};

  return {
    signedIn: record.signedIn === true,
    account: readAccount(record.account),
    usage: readUsage(record.usage)
  };
}

function readString(value) {
  return typeof value === 'string' ? value : '';
}

function readBoolean(value) {
  return value === true;
}

function readStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function readFilePulse(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((entry) => ({
      path: readString(entry.path),
      heat: readString(entry.heat)
    }));
}

function readOptions(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((option) => ({ title: readString(option.title) }));
}

function readAccount(value) {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    email: readString(value.email),
    plan: readString(value.plan),
    trialEndsAt: readString(value.trialEndsAt)
  };
}

function readUsage(value) {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    remainingPrompts: typeof value.remainingPrompts === 'number' ? value.remainingPrompts : undefined,
    plan: readString(value.plan),
    used: typeof value.used === 'number' ? value.used : undefined,
    limit: typeof value.limit === 'number' ? value.limit : undefined,
    period: readString(value.period),
    unlockedMapCategoryKeys: readStringArray(value.unlockedMapCategoryKeys)
  };
}

function isRecord(value) {
  return typeof value === 'object' && value !== null;
}

function setSection(name, content) {
  const element = document.querySelector(`[data-section="${name}"]`);
  if (!element) {
    return;
  }
  if (content === null || content === undefined) {
    element.replaceChildren();
    return;
  }
  element.replaceChildren(content);
}

function appendPathToPrompt(filePath) {
  const input = document.getElementById('prompt-input');
  if (!input || !('value' in input)) {
    return;
  }
  const addition = 'Review this file in the next step: ' + filePath;
  const current = typeof input.value === 'string' ? input.value.trim() : '';
  input.value = current ? current + '\n' + addition : addition;
  lastPrompt = input.value;
  if (typeof input.focus === 'function') {
    input.focus();
  }
}

function openMc3PromptModal(text) {
  const modal = document.getElementById('mc3-prompt-modal');
  const pre = document.getElementById('mc3-prompt-modal-body');
  if (!(modal instanceof HTMLElement) || !pre) {
    return;
  }
  pre.textContent = text;
  const copyBtn = modal.querySelector('[data-station-action="mc3-modal-copy-prompt"]');
  if (copyBtn instanceof HTMLElement) {
    copyBtn.setAttribute('data-prompt', text);
  }
  modal.removeAttribute('hidden');
  const panel = modal.querySelector('.mc3-prompt-modal__panel');
  if (panel instanceof HTMLElement && typeof panel.focus === 'function') {
    setTimeout(function () {
      try {
        panel.focus();
      } catch {
        /* no-op */
      }
    }, 0);
  }
}

function closeMc3PromptModal() {
  const modal = document.getElementById('mc3-prompt-modal');
  if (modal instanceof HTMLElement) {
    modal.setAttribute('hidden', '');
  }
}

function handleMc3PromptModalAction(target) {
  if (!target || typeof target !== 'object' || typeof target.closest !== 'function') {
    return false;
  }
  const btn = target.closest('#mc3-prompt-modal [data-station-action]');
  if (!(btn instanceof HTMLElement) || ('disabled' in btn && btn.disabled)) {
    return false;
  }
  const action = btn.getAttribute('data-station-action');
  if (action === 'mc3-close-prompt-modal') {
    closeMc3PromptModal();
    return true;
  }
  if (action === 'mc3-modal-copy-prompt') {
    const prompt = (btn.getAttribute('data-prompt') || '').trim();
    if (prompt) {
      vscode.postMessage({ type: 'station:copy', text: prompt, label: 'gap prompt' });
    }
    return true;
  }
  return false;
}

(function wireMc3PromptModal() {
  const modal = document.getElementById('mc3-prompt-modal');
  if (!(modal instanceof HTMLElement)) {
    return;
  }
  modal.addEventListener('click', function (event) {
    if (handleMc3PromptModalAction(event.target)) {
      event.preventDefault();
      if (typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
    }
  });
})();

(function wireReadoutActions() {
  const stack = document.querySelector('.station-stage') || document.querySelector('.results-stack');
  if (!stack) {
    return;
  }
  stack.addEventListener('click', (e) => {
    const t = e.target;
    if (!t || typeof t !== 'object') {
      return;
    }
    const btn =
      typeof t.closest === 'function'
        ? t.closest('[data-station-action]') || t.closest('[data-action]')
        : null;
    if (!btn || typeof btn.getAttribute !== 'function' || ('disabled' in btn && btn.disabled)) {
      return;
    }
    const action = btn.getAttribute('data-station-action') || btn.getAttribute('data-action');
    if (!action) {
      return;
    }
    e.preventDefault();
    if (typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const p = lastPayload;
    if (action === 'mc-retry-scan') {
      const form = document.getElementById('prompt-form');
      if (form && 'requestSubmit' in form && typeof form.requestSubmit === 'function') {
        form.requestSubmit();
      }
      return;
    }
    if (action === 'copy-next-move') {
      const text = p ? buildNextMoveText(p) : '';
      if (!text) {
        return;
      }
      vscode.postMessage({ type: 'station:copy', text, label: 'next move' });
    } else if (action === 'copy-agent-prompt') {
      if (!p) {
        return;
      }
      const coach = buildCoachModel(p);
      vscode.postMessage({ type: 'station:copy', text: coach.prompt, label: 'agent prompt' });
    } else if (action === 'run-follow-up') {
      if (!p) {
        return;
      }
      if (!canRunManagedScan()) {
        return;
      }
      const coach = buildCoachModel(p);
      vscode.postMessage({ type: 'station:runFollowUp', prompt: coach.prompt });
    } else if (action === 'create-checklist') {
      if (!p) {
        return;
      }
      const coach = buildCoachModel(p);
      vscode.postMessage({ type: 'station:createChecklist', coach: buildChecklistPayload(coach, p) });
    } else if (action === 'start-next-step') {
      if (!p) {
        return;
      }
      const coach = buildCoachModel(p);
      const input = document.getElementById('prompt-input');
      if (input && 'value' in input) {
        input.value = coach.prompt;
        lastPrompt = coach.prompt;
      }
      vscode.postMessage({ type: 'station:copy', text: coach.prompt, label: 'agent prompt' });
    } else if (action === 'copy-chat-prompt') {
      if (!p) {
        return;
      }
      const text = buildChatHandoffText(p);
      if (!text.trim()) {
        return;
      }
      vscode.postMessage({ type: 'station:copy', text, toastStyle: 'for-chat' });
    } else if (action === 'copy-file') {
      const filePath = btn.getAttribute('data-path') || '';
      if (!filePath.trim()) {
        return;
      }
      vscode.postMessage({ type: 'station:copy', text: filePath, label: 'path' });
    } else if (action === 'add-file-to-prompt') {
      const filePath = btn.getAttribute('data-path') || '';
      if (!filePath.trim()) {
        return;
      }
      appendPathToPrompt(filePath);
    } else if (action === 'open-file') {
      const filePath = btn.getAttribute('data-path') || '';
      if (!filePath.trim()) {
        return;
      }
      vscode.postMessage({ type: 'station:openFile', path: filePath });
    } else if (action === 'copy-spec') {
      if (!p || !p.specUpdate || p.specUpdate.length === 0) {
        return;
      }
      vscode.postMessage({ type: 'station:copy', text: formatSpecUpdateForPaste(p.specUpdate), label: 'spec bullets' });
    } else if (action === 'mc-copy-prompt') {
      const prompt = btn.getAttribute('data-prompt') || '';
      if (!prompt.trim()) {
        return;
      }
      vscode.postMessage({ type: 'station:copy', text: prompt, label: 'agent prompt' });
    } else if (action === 'mc-use-in-chat') {
      const prompt = btn.getAttribute('data-prompt') || '';
      if (!prompt.trim()) {
        return;
      }
      vscode.postMessage({ type: 'station:pasteInChat', text: prompt });
    } else if (action === 'useInChat') {
      const prompt = btn.getAttribute('data-prompt') || '';
      if (!prompt.trim()) {
        return;
      }
      vscode.postMessage({ type: 'station:pasteInChat', text: prompt });
    } else if (action === 'mc3-open-prompt-modal') {
      const t = (btn.getAttribute('data-prompt') || '').trim();
      if (!t) {
        return;
      }
      openMc3PromptModal(t);
    } else if (action === 'mc3-close-prompt-modal') {
      closeMc3PromptModal();
    } else if (action === 'mc3-modal-copy-prompt') {
      const prompt = (btn.getAttribute('data-prompt') || '').trim();
      if (!prompt) {
        return;
      }
      vscode.postMessage({ type: 'station:copy', text: prompt, label: 'gap prompt' });
    } else if (action === 'copy') {
      const prompt = btn.getAttribute('data-prompt') || '';
      if (!prompt.trim()) {
        return;
      }
      vscode.postMessage({ type: 'station:copy', text: prompt, label: 'gap prompt' });
    } else if (action === 'mc3-select-path') {
      const gapId = btn.getAttribute('data-gap-id') || '';
      const categoryKey = btn.getAttribute('data-category-key') || '';
      const toolName = (btn.getAttribute('data-tool-name') || '').trim();
      const text = (btn.getAttribute('data-prompt') || '').trim();
      const url = (btn.getAttribute('data-url') || '').trim();
      const mcpP = (btn.getAttribute('data-mcp-prompt') || '').trim();
      const hasGapId = Boolean(gapId.trim());
      const hasProviderSelection = Boolean(getProductionCategory(categoryKey) && toolName);
      if ((hasGapId && !text) || (!hasGapId && !hasProviderSelection)) {
        return;
      }
      if (hasGapId) {
        expandedGapId = gapId;
      }
      let providerWasSelected = false;
      if (hasProviderSelection) {
        if (isMultiSelectCategory(categoryKey)) {
          const current = selectedToolListForCategory(categoryKey);
          const toolKey = normalizeToolKey(toolName);
          providerWasSelected = current.some(function (item) {
            return normalizeToolKey(item) === toolKey;
          });
          const next = providerWasSelected
            ? current.filter(function (item) { return normalizeToolKey(item) !== toolKey; })
            : current.concat(toolName);
          selectedToolPaths = { ...selectedToolPaths };
          if (next.length > 0) {
            selectedToolPaths[categoryKey] = next;
          } else {
            delete selectedToolPaths[categoryKey];
          }
        } else {
          selectedToolPaths = { ...selectedToolPaths, [categoryKey]: toolName };
        }
        delete studioGeneratedTasks[categoryKey];
      }
      const productionChoiceMessage = buildProductionConnectionChoiceMessage(categoryKey, toolName);
      if (productionChoiceMessage && !providerWasSelected) {
        vscode.postMessage(productionChoiceMessage);
      }
      persistStationUiState();
      if (p) {
        renderPayload(p, { preserveCategory: true });
      }
    } else if (action === 'mc-select-category') {
      const categoryKey = btn.getAttribute('data-category-key') || '';
      if (!getProductionCategory(categoryKey)) {
        return;
      }
      if (!isMapCategoryUnlocked(categoryKey, lastSessionUsage, lastAccountPlan)) {
        vscode.postMessage({ type: 'session:openAccount' });
        return;
      }
      if (btn.getAttribute('data-locked-map') === '1') {
        vscode.postMessage({ type: 'session:openAccount' });
        return;
      }
      expandedGapId = '';
      activeRavenGapCategoryKey = '';
      if (selectedProductionCategoryKey === categoryKey) {
        dismissedStudioMapActionCategoryKey = categoryKey;
      } else {
        selectedProductionCategoryKey = categoryKey;
        dismissedStudioMapActionCategoryKey = categoryKey;
      }
      persistStationUiState();
      if (p) {
        renderPayload(p, { preserveCategory: true });
      }
    } else if (action === 'mc-open-raven-gap') {
      const categoryKey = btn.getAttribute('data-category-key') || '';
      if (!getProductionCategory(categoryKey)) {
        return;
      }
      if (!isMapCategoryUnlocked(categoryKey, lastSessionUsage, lastAccountPlan)) {
        vscode.postMessage({ type: 'session:openAccount' });
        return;
      }
      selectedProductionCategoryKey = categoryKey;
      activeRavenGapCategoryKey = categoryKey;
      dismissedStudioMapActionCategoryKey = '';
      expandedGapId = '';
      persistStationUiState();
      if (p) {
        renderPayload(p, { preserveCategory: true });
      }
    } else if (action === 'mc-close-map-action') {
      closeStudioMapActionAndRender(p);
    } else if (action === 'mc-clear-category') {
      clearSelectedProductionCategoryAndRender(p);
    } else if (action === 'studio-continue-setup') {
      const categoryKey = btn.getAttribute('data-category-key') || selectedProductionCategoryKey;
      if (!getProductionCategory(categoryKey)) {
        return;
      }
      writeStudioStep(categoryKey, 'choose');
      studioGeneratedTasks[categoryKey] = { ready: true };
      persistStationUiState();
      if (p) {
        renderPayload(p, { preserveCategory: true });
      }
    } else if (action === 'confirm-manual-check') {
      const providerKey = (btn.getAttribute('data-provider-key') || '').trim();
      const checkId = (btn.getAttribute('data-check-id') || '').trim();
      if (!providerKey || !checkId) {
        return;
      }
      vscode.postMessage({
        type: 'station:manualConfirmationConfirm',
        providerKey: providerKey,
        checkId: checkId,
        providerLabel: (btn.getAttribute('data-provider-label') || '').trim(),
        areaLabel: (btn.getAttribute('data-area-label') || '').trim(),
        label: (btn.getAttribute('data-label') || '').trim()
      });
    } else if (action === 'revoke-manual-check') {
      const providerKey = (btn.getAttribute('data-provider-key') || '').trim();
      const checkId = (btn.getAttribute('data-check-id') || '').trim();
      if (!providerKey || !checkId) {
        return;
      }
      vscode.postMessage({
        type: 'station:manualConfirmationRevoke',
        providerKey: providerKey,
        checkId: checkId
      });
    } else if (action === 'studio-connect-mcp') {
      const provider = (btn.getAttribute('data-provider') || '').trim();
      if (provider) {
        vscode.postMessage({ type: 'station:connectMcp', provider: provider });
      }
    } else if (action === 'mcp-copy-snippet') {
      const snippet = btn.getAttribute('data-snippet') || '';
      if (snippet.trim()) {
        vscode.postMessage({ type: 'station:copy', text: snippet, label: 'MCP config' });
      }
    } else if (action === 'mcp-close-helper') {
      closeMcpHelperModal();
    } else if (action === 'openExternal') {
      const url = (btn.getAttribute('data-url') || '').trim();
      if (url) {
        vscode.postMessage({ type: 'station:openExternal', url: url });
      }
    } else if (action === 'rescan') {
      /* Do not use window.confirm here — VS Code webviews often block it, which made Rescan appear broken. */
      const prompt = lastPrompt || 'scan my project';
      startManagedScan(prompt);
    }
    requestAnimationFrame(() => {
      btn.blur();
    });
  });
})();

document.addEventListener('keydown', function (e) {
  if ((e.key === 'Enter' || e.key === ' ') && e.target instanceof HTMLElement) {
    const interactive = e.target.closest(
      '.mc3-provider-tile[data-station-action="mc3-select-path"]'
    );
    if (interactive instanceof HTMLElement) {
      e.preventDefault();
      interactive.click();
      return;
    }
  }
  if (e.key !== 'Escape') {
    return;
  }
  const modal = document.getElementById('mc3-prompt-modal');
  if (modal instanceof HTMLElement && !modal.hasAttribute('hidden')) {
    e.preventDefault();
    closeMc3PromptModal();
  }
});

document.addEventListener('click', function (event) {
  if (event.defaultPrevented) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const btn = target.closest('[data-station-action]');
  if (!(btn instanceof HTMLElement)) {
    return;
  }
  const action = btn.getAttribute('data-station-action');
  const prompt = btn.getAttribute('data-prompt') || '';

  /* Handled on .station-stage with stopPropagation + dedicated branches — avoid duplicate postMessage */
  if (
    action === 'useInChat' ||
    action === 'mc-use-in-chat' ||
    action === 'copy' ||
    action === 'rescan' ||
    action === 'openExternal' ||
    action?.startsWith('mc3-') ||
    action?.startsWith('mc-') ||
    action === 'open-file'
  ) {
    if (target.closest('.station-stage') || target.closest('.results-stack')) {
      return;
    }
  }

  if (action === 'openExternal') {
    const url = btn.getAttribute('data-url') || '';
    if (url.trim()) {
      vscode.postMessage({ type: 'station:openExternal', url: url.trim() });
    }
    return;
  }
  if (action === 'copy') {
    vscode.postMessage({ type: 'station:copy', text: prompt, label: 'gap prompt' });
    return;
  }
  if (action === 'useInChat') {
    vscode.postMessage({ type: 'station:pasteInChat', text: prompt });
    return;
  }
  if (action === 'mc-clear-category') {
    clearSelectedProductionCategoryAndRender(lastPayload);
    return;
  }
  if (action === 'mc-close-map-action') {
    closeStudioMapActionAndRender(lastPayload);
    return;
  }
  if (action === 'rescan') {
    const savedPrompt = lastPrompt || 'scan my project';
    startManagedScan(savedPrompt);
    return;
  }
});

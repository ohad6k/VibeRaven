import { analyzeSupabaseDatabaseWiring } from './supabaseWiring';
import type {
  ScanResult,
  ScannedFile,
  StackWiringItem,
  StackWiringKey,
  StackWiringProviderSummary,
  StackWiringSummary
} from './types';

type VisibleFile = {
  path: string;
  normalizedPath: string;
  content: string;
  lowerContent: string;
};

type StackContext = {
  scan: ScanResult;
  files: VisibleFile[];
  deps: string[];
  pathBlob: string;
  contentBlob: string;
};

export function analyzeStackWiring(scan: ScanResult): StackWiringSummary {
  const ctx = buildContext(scan);
  const supabaseDatabase = analyzeSupabaseDatabaseWiring(scan);
  const items: StackWiringProviderSummary[] = [
    analyzeFigmaAppFlow(ctx),
    analyzeStorybookAppFlow(ctx),
    analyzeProductSpecAppFlow(ctx),
    analyzeRouteMapAppFlow(ctx),
    analyzeReactFrontend(ctx),
    analyzeVueFrontend(ctx),
    analyzeSvelteFrontend(ctx),
    analyzeAngularFrontend(ctx),
    analyzeNodeBackend(ctx),
    analyzePythonBackend(ctx),
    analyzeRailsBackend(ctx),
    analyzeGoBackend(ctx),
    analyzeRateLimitSecurity(ctx),
    analyzeBotProtectionSecurity(ctx),
    analyzeSecretsHygiene(ctx),
    analyzeClerkAuth(ctx),
    analyzeAuthJsAuth(ctx),
    analyzeAuth0Auth(ctx),
    analyzeBetterAuth(ctx),
    analyzeSupabaseAuth(ctx),
    supabaseDatabase,
    analyzeFirebaseDatabase(ctx),
    analyzeNeonDatabase(ctx),
    analyzeTursoDatabase(ctx),
    analyzeMongoDatabase(ctx),
    analyzePlanetScaleDatabase(ctx),
    analyzeStripePayments(ctx),
    analyzePaddlePayments(ctx),
    analyzePolarPayments(ctx),
    analyzeLemonSqueezyPayments(ctx),
    analyzeVercelDeployment(ctx),
    analyzeNetlifyDeployment(ctx),
    analyzeRenderDeployment(ctx),
    analyzeRailwayDeployment(ctx),
    analyzeCloudflareDeployment(ctx),
    analyzeAwsDeployment(ctx),
    analyzeSupabaseLanding(ctx),
    analyzePostHogMonitoring(ctx),
    analyzeSentryMonitoring(ctx),
    analyzeLogRocketMonitoring(ctx),
    analyzeVitestTesting(ctx),
    analyzePlaywrightTesting(ctx),
    analyzeSentryErrorHandling(ctx),
    analyzePostHogErrorHandling(ctx)
  ];
  const byKey = items.reduce<Partial<Record<StackWiringKey, StackWiringProviderSummary>>>((acc, summary) => {
    acc[summary.key] = summary;
    return acc;
  }, {});

  return {
    items,
    byKey,
    supabaseDatabase
  };
}

export function buildStackWiringPrompt(summary: StackWiringProviderSummary): string {
  const passed = summary.items.filter((entry) => entry.status === 'passed');
  const missing = summary.items.filter((entry) => entry.status === 'missing');
  const manual = summary.items.filter((entry) => entry.status === 'manual');
  const passedLines = passed.length > 0
    ? passed.map((entry) => `- ${entry.label}${formatEvidence(entry.evidence)}`).join('\n')
    : `- No ${summary.promptSubject} checks passed yet.`;
  const missingLines = missing.length > 0
    ? missing.map((entry) => `- ${entry.label}: ${entry.promptHint}`).join('\n')
    : `- No missing ${summary.promptSubject} checks were found by VibeRaven.`;
  const manualLines = manual.length > 0
    ? manual.map((entry) => `- ${entry.label}: ${entry.promptHint}`).join('\n')
    : '- No manual dashboard checks were listed.';

  return [
    `Wire ${summary.promptSubject} for this app safely.`,
    '',
    `Current ${summary.promptSubject} readiness: ${summary.passedCount}/${summary.totalCount} repo checks passed (${summary.readinessPercent}%).`,
    '',
    'Repo evidence already found:',
    passedLines,
    '',
    `Missing ${summary.promptSubject} checks:`,
    missingLines,
    '',
    'Manual checks that repo evidence cannot prove:',
    manualLines,
    '',
    'First inspect the existing package.json files, env examples, framework routes, provider helpers, and server/client boundaries before editing.',
    '',
    'Implement:',
    `1. Close only the missing ${summary.promptSubject} checks listed above.`,
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

export function buildStackWiringContext(summary: StackWiringSummary): string {
  const lines = ['## STACK READINESS'];
  for (const stack of summary.items) {
    lines.push(`${stack.key}: ${stack.passedCount}/${stack.totalCount} repo checks passed (${stack.readinessPercent}%).`);
    for (const entry of stack.items) {
      const evidence = entry.evidence.length > 0 ? ` (${entry.evidence.slice(0, 3).join('; ')})` : '';
      lines.push(`${stack.key} ${entry.status}: ${entry.label}${evidence}`);
    }
  }
  return lines.join('\n');
}

function analyzeFigmaAppFlow(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'figma-app-flow',
    provider: 'figma',
    providerLabel: 'Figma',
    area: 'appFlow',
    areaLabel: 'App Flow / UX',
    promptSubject: 'Figma app flow',
    items: [
      item('flow-doc-found', 'Flow or design doc found', /figma|wireframe|user flow|journey|prototype|screen map/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /figma|wireframe|user flow|journey|prototype|screen map/i), 'Add or link a simple screen flow, user journey, or Figma handoff note.'),
      item('onboarding-states-found', 'Onboarding and empty states documented', /onboarding|empty state|first run|activation|welcome/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /onboarding|empty state|first run|activation|welcome/i), 'Document the first-run, empty, loading, and error states for the main user journey.'),
      item('primary-cta-found', 'Primary user action is visible', /primary cta|call to action|cta|start|continue|create|connect/i.test(ctx.contentBlob), fileEvidence(ctx, /primary cta|call to action|cta|start|continue|create|connect/i), 'Make the main action obvious on the key product screens.'),
      manualItem('figma-source-checked', 'Current Figma or flow source checked', 'Confirm the latest Figma/design source still matches the implemented product flow.')
    ]
  });
}

function analyzeStorybookAppFlow(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'storybook-app-flow',
    provider: 'storybook',
    providerLabel: 'Storybook',
    area: 'appFlow',
    areaLabel: 'App Flow / UX',
    promptSubject: 'Storybook app flow',
    items: [
      item('storybook-package-found', 'Storybook package installed', hasPackage(ctx, [/^storybook$/, /^@storybook\//]) || /\.storybook\/|\.stories\.[jt]sx?\b/i.test(ctx.pathBlob), packageEvidence(ctx, [/^storybook$/, /^@storybook\//]).concat(pathEvidence(ctx, /\.storybook\/|\.stories\.[jt]sx?\b/i)), 'Install or confirm Storybook for visible component state coverage.'),
      item('stories-found', 'Component stories found', /\.stories\.[jt]sx?\b|\.mdx\b/i.test(ctx.pathBlob), pathEvidence(ctx, /\.stories\.[jt]sx?\b|\.mdx\b/i), 'Add stories for the primary product components.'),
      item('state-variants-found', 'Loading, empty, or error variants found', /loading|empty|error|disabled|success|variant/i.test(ctx.contentBlob), fileEvidence(ctx, /loading|empty|error|disabled|success|variant/i), 'Cover loading, empty, error, disabled, and success variants in stories.'),
      manualItem('storybook-reviewed', 'Current Storybook states reviewed', 'Open Storybook and confirm the primary user journey states still match the product.')
    ]
  });
}

function analyzeProductSpecAppFlow(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'product-spec-app-flow',
    provider: 'product-spec',
    providerLabel: 'Product Spec',
    area: 'appFlow',
    areaLabel: 'App Flow / UX',
    promptSubject: 'product spec app flow',
    items: [
      item('spec-doc-found', 'Product spec or PRD found', /prd|product requirements|requirements|product spec|specification/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /prd|product requirements|requirements|product spec|specification/i).concat(pathEvidence(ctx, /prd|requirements|spec/i)), 'Add a short product spec or PRD for the main workflow.'),
      item('acceptance-criteria-found', 'Acceptance criteria or user stories found', /acceptance criteria|user stor(y|ies)|jobs to be done|given\s+.*when\s+.*then/i.test(ctx.contentBlob), fileEvidence(ctx, /acceptance criteria|user stor(y|ies)|jobs to be done|given\s+.*when\s+.*then/i), 'Document acceptance criteria or user stories for the main flow.'),
      item('success-metric-found', 'Success metric or activation goal found', /success metric|activation|north star|conversion|retention|time to value/i.test(ctx.contentBlob), fileEvidence(ctx, /success metric|activation|north star|conversion|retention|time to value/i), 'Define the activation or success metric for this workflow.'),
      manualItem('latest-product-intent-checked', 'Latest product intent checked', 'Confirm the spec still matches the current product direction and user promise.')
    ]
  });
}

function analyzeRouteMapAppFlow(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'route-map-app-flow',
    provider: 'route-map',
    providerLabel: 'Route Map',
    area: 'appFlow',
    areaLabel: 'App Flow / UX',
    promptSubject: 'route map app flow',
    items: [
      item('routes-found', 'App routes found', /(^|\n|\/)(app|pages|routes)\//i.test(ctx.pathBlob) || /router|route map|sitemap/i.test(ctx.contentBlob), pathEvidence(ctx, /(^|\/)(app|pages|routes)\//i).concat(fileEvidence(ctx, /router|route map|sitemap/i)), 'Map the key routes or screens in the repo.'),
      item('navigation-documented', 'Navigation path documented', /navigation|nav|breadcrumb|route map|screen map|journey/i.test(ctx.contentBlob), fileEvidence(ctx, /navigation|nav|breadcrumb|route map|screen map|journey/i), 'Document how users move through the primary screens.'),
      item('protected-or-edge-routes-found', 'Protected or edge routes noted', /protected|auth required|404|not-found|error route|redirect/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /protected|auth required|404|not-found|error route|redirect/i), 'Mark protected, redirect, 404, and error routes explicitly.'),
      manualItem('core-journey-clicked', 'Core journey clicked manually', 'Click through the core route path in the running app and verify the map is current.')
    ]
  });
}

function analyzeReactFrontend(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'react-frontend',
    provider: 'react',
    providerLabel: 'React',
    area: 'frontend',
    areaLabel: 'Frontend',
    promptSubject: 'React frontend',
    items: [
      item('package-installed', 'React package installed', hasPackage(ctx, [/^react$/, /^next$/, /^vite$/]) || Boolean(ctx.scan.stackSignals.hasNextJs || ctx.scan.stackSignals.hasVite), packageEvidence(ctx, [/^react$/, /^next$/, /^vite$/]), 'Install or confirm the React framework package used by this app.'),
      item('component-structure-found', 'Component structure found', /(^|\n|\/)(src\/)?(components|app|pages)\//i.test(ctx.pathBlob), pathEvidence(ctx, /(^|\/)(src\/)?(components|app|pages)\//i), 'Keep UI components in a predictable app/pages/components structure.'),
      item('loading-state-found', 'Loading state found', Boolean(ctx.scan.stackSignals.hasLoadingStates) || /loading\.tsx|skeleton|spinner|aria-busy|isloading/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /loading\.tsx|skeleton|spinner|aria-busy|isloading/i), 'Add loading states for async product views.'),
      item('error-state-found', 'Error boundary or empty state found', Boolean(ctx.scan.stackSignals.hasErrorBoundary) || /errorboundary|global-error|empty state|not-found\.tsx/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /errorboundary|global-error|empty state|not-found\.tsx/i), 'Add error and empty states for the primary product workflow.'),
      manualItem('responsive-ui-checked', 'Responsive UI checked manually', 'Open the main screens at mobile and desktop widths and confirm there is no overflow or overlapping text.')
    ]
  });
}

function analyzeVueFrontend(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'vue-frontend',
    provider: 'vue',
    providerLabel: 'Vue',
    area: 'frontend',
    areaLabel: 'Frontend',
    promptSubject: 'Vue frontend',
    items: [
      item('package-installed', 'Vue package installed', hasPackage(ctx, [/^vue$/, /^nuxt$/, /^@vitejs\/plugin-vue$/]), packageEvidence(ctx, [/^vue$/, /^nuxt$/, /^@vitejs\/plugin-vue$/]), 'Install or confirm Vue, Nuxt, or the Vue build plugin used by this app.'),
      item('component-structure-found', 'Vue component structure found', /\.vue\b|(^|\n|\/)(src\/)?(components|pages|layouts)\//i.test(ctx.pathBlob), pathEvidence(ctx, /\.vue\b|(^|\/)(src\/)?(components|pages|layouts)\//i), 'Keep Vue components, pages, and layouts in predictable folders.'),
      item('routing-or-layout-found', 'Vue routing or layout found', /vue-router|routerview|router-view|<router-view|(^|\n|\/)pages\//i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /vue-router|routerview|router-view|<router-view/i).concat(pathEvidence(ctx, /(^|\/)pages\//i)), 'Add or confirm Vue Router, Nuxt pages, or layout routing for the main product screens.'),
      item('loading-or-error-state-found', 'Loading or error state found', /loading|suspense|error|empty state|isloading/i.test(ctx.contentBlob), fileEvidence(ctx, /loading|suspense|error|empty state|isloading/i), 'Add loading, empty, and error states for async Vue screens.'),
      manualItem('responsive-ui-checked', 'Responsive UI checked manually', 'Open the main Vue screens at mobile and desktop widths and confirm there is no overflow or overlapping text.')
    ]
  });
}

function analyzeSvelteFrontend(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'svelte-frontend',
    provider: 'svelte',
    providerLabel: 'Svelte',
    area: 'frontend',
    areaLabel: 'Frontend',
    promptSubject: 'Svelte frontend',
    items: [
      item('package-installed', 'Svelte package installed', hasPackage(ctx, [/^svelte$/, /^@sveltejs\/kit$/]), packageEvidence(ctx, [/^svelte$/, /^@sveltejs\/kit$/]), 'Install or confirm Svelte or SvelteKit for this app.'),
      item('component-structure-found', 'Svelte component or route structure found', /\.svelte\b|(^|\n|\/)src\/routes\//i.test(ctx.pathBlob), pathEvidence(ctx, /\.svelte\b|(^|\/)src\/routes\//i), 'Keep Svelte components and routes in predictable folders.'),
      item('load-or-form-found', 'Svelte load or form handling found', /\bload\s*=|export\s+(async\s+)?function\s+load|actions\s*=|use:enhance/i.test(ctx.contentBlob), fileEvidence(ctx, /\bload\s*=|export\s+(async\s+)?function\s+load|actions\s*=|use:enhance/i), 'Use SvelteKit load functions or actions for route data and form flows.'),
      item('loading-or-error-state-found', 'Loading or error state found', /loading|error|empty state|\+error\.svelte/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /loading|error|empty state|\+error\.svelte/i), 'Add loading, empty, and error states for async Svelte screens.'),
      manualItem('responsive-ui-checked', 'Responsive UI checked manually', 'Open the main Svelte screens at mobile and desktop widths and confirm there is no overflow or overlapping text.')
    ]
  });
}

function analyzeAngularFrontend(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'angular-frontend',
    provider: 'angular',
    providerLabel: 'Angular',
    area: 'frontend',
    areaLabel: 'Frontend',
    promptSubject: 'Angular frontend',
    items: [
      item('package-installed', 'Angular package installed', hasPackage(ctx, [/^@angular\/core$/, /^@angular\/router$/, /^@angular\/cli$/]), packageEvidence(ctx, [/^@angular\/core$/, /^@angular\/router$/, /^@angular\/cli$/]), 'Install or confirm Angular framework packages for this app.'),
      item('component-structure-found', 'Angular component structure found', /\.component\.ts\b|angular\.json|(^|\n|\/)src\/app\//i.test(ctx.pathBlob), pathEvidence(ctx, /\.component\.ts\b|angular\.json|(^|\/)src\/app\//i), 'Keep Angular components and app modules or standalone routes in predictable folders.'),
      item('routing-found', 'Angular routing found', /routermodule|providerouter|router-outlet|routes\s*:/i.test(ctx.contentBlob), fileEvidence(ctx, /routermodule|providerouter|router-outlet|routes\s*:/i), 'Add or confirm Angular Router for the primary product screens.'),
      item('loading-or-error-state-found', 'Loading or error state found', /loading|isloading|error|empty state|catcherror/i.test(ctx.contentBlob), fileEvidence(ctx, /loading|isloading|error|empty state|catcherror/i), 'Add loading, empty, and error states for async Angular screens.'),
      manualItem('responsive-ui-checked', 'Responsive UI checked manually', 'Open the main Angular screens at mobile and desktop widths and confirm there is no overflow or overlapping text.')
    ]
  });
}

function analyzeNodeBackend(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'node-backend',
    provider: 'node',
    providerLabel: 'Node.js',
    area: 'backend',
    areaLabel: 'Backend / API',
    promptSubject: 'Node.js backend',
    items: [
      item('server-runtime-found', 'Server runtime or API framework found', hasPackage(ctx, [/^express$/, /^fastify$/, /^hono$/, /^next$/, /^@nestjs\//]) || /api\/|route\.[jt]s|server\.[jt]s/i.test(ctx.pathBlob), packageEvidence(ctx, [/^express$/, /^fastify$/, /^hono$/, /^next$/, /^@nestjs\//]).concat(pathEvidence(ctx, /api\/|route\.[jt]s|server\.[jt]s/i)), 'Add a clear server/API runtime or route structure.'),
      item('api-routes-found', 'API routes found', /api\/|route\.[jt]s|routes?\//i.test(ctx.pathBlob), pathEvidence(ctx, /api\/|route\.[jt]s|routes?\//i), 'Create server routes for backend operations instead of pushing secrets into frontend code.'),
      item('request-validation-found', 'Request validation found', hasPackage(ctx, [/^zod$/, /^joi$/, /^yup$/, /^valibot$/]) || /z\.object|safeparse|request validation|validate\s*\(/i.test(ctx.contentBlob), packageEvidence(ctx, [/^zod$/, /^joi$/, /^yup$/, /^valibot$/]).concat(fileEvidence(ctx, /z\.object|safeparse|request validation|validate\s*\(/i)), 'Validate request bodies and parameters before processing backend operations.'),
      item('backend-error-handling-found', 'Backend error handling found', /try\s*{|catch\s*\(|next\(error\)|return\s+new\s+response\([^)]*500|status\s*:\s*500/i.test(ctx.contentBlob), fileEvidence(ctx, /try\s*{|catch\s*\(|next\(error\)|status\s*:\s*500/i), 'Add consistent backend error handling for API routes.'),
      manualItem('production-runtime-checked', 'Production runtime limits checked', 'Confirm serverless/runtime limits, body size, timeout, and region choices for production.')
    ]
  });
}

function analyzePythonBackend(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'python-backend',
    provider: 'python',
    providerLabel: 'Python / FastAPI',
    area: 'backend',
    areaLabel: 'Backend / API',
    promptSubject: 'Python backend',
    items: [
      item('server-runtime-found', 'Python API framework found', hasPackage(ctx, [/^fastapi$/, /^flask$/, /^django$/, /^pydantic$/]) || /fastapi|flask|django|pydantic/i.test(ctx.contentBlob), packageEvidence(ctx, [/^fastapi$/, /^flask$/, /^django$/, /^pydantic$/]).concat(fileEvidence(ctx, /fastapi|flask|django|pydantic/i)), 'Add or confirm FastAPI, Flask, Django, or the Python API framework used by this app.'),
      item('api-entry-found', 'Python API entrypoint found', /(^|\n|\/)(api\/)?(main|app)\.py\b|(^|\n|\/)manage\.py\b/i.test(ctx.pathBlob), pathEvidence(ctx, /(^|\/)(api\/)?(main|app)\.py\b|(^|\/)manage\.py\b/i), 'Keep a clear Python API entrypoint for production routes.'),
      item('request-validation-found', 'Request validation found', /basemodel|pydantic|serializer|marshmallow|request validation/i.test(ctx.contentBlob), fileEvidence(ctx, /basemodel|pydantic|serializer|marshmallow|request validation/i), 'Validate request bodies and parameters before processing backend operations.'),
      item('backend-error-handling-found', 'Backend error handling found', /exception_handler|try\s*:|except\s+|raise\s+http|abort\(|handler404|handler500/i.test(ctx.contentBlob), fileEvidence(ctx, /exception_handler|try\s*:|except\s+|raise\s+http|abort\(|handler404|handler500/i), 'Add consistent backend error handling for Python routes.'),
      manualItem('production-runtime-checked', 'Production runtime limits checked', 'Confirm server/runtime limits, worker count, timeout, and region choices for production.')
    ]
  });
}

function analyzeRailsBackend(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'rails-backend',
    provider: 'rails',
    providerLabel: 'Rails',
    area: 'backend',
    areaLabel: 'Backend / API',
    promptSubject: 'Rails backend',
    items: [
      item('rails-runtime-found', 'Rails runtime found', hasPackage(ctx, [/^rails$/]) || /gem ['"]rails['"]|rails\.application|actioncontroller/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), packageEvidence(ctx, [/^rails$/]).concat(fileEvidence(ctx, /gem ['"]rails['"]|rails\.application|actioncontroller/i)), 'Add or confirm Rails is the backend runtime for this app.'),
      item('controllers-or-routes-found', 'Controllers or routes found', /app\/controllers\/|config\/routes\.rb/i.test(ctx.pathBlob) || /resources\s+:|namespace\s+:|ActionController/i.test(ctx.contentBlob), pathEvidence(ctx, /app\/controllers\/|config\/routes\.rb/i).concat(fileEvidence(ctx, /resources\s+:|namespace\s+:|ActionController/i)), 'Keep Rails controllers and routes visible in the repo.'),
      item('request-validation-found', 'Validation or strong params found', /validates\s+:|params\.require|permit\(|ActiveModel::Serializer|dry-validation/i.test(ctx.contentBlob), fileEvidence(ctx, /validates\s+:|params\.require|permit\(|ActiveModel::Serializer|dry-validation/i), 'Validate request bodies and model inputs before processing backend operations.'),
      item('backend-error-handling-found', 'Backend error handling found', /rescue_from|rescue\s+|render\s+json:.*status:|head\s+:/i.test(ctx.contentBlob), fileEvidence(ctx, /rescue_from|rescue\s+|render\s+json:.*status:|head\s+:/i), 'Add consistent Rails error handling for API routes.'),
      manualItem('production-runtime-checked', 'Production runtime limits checked', 'Confirm Puma/workers, job queues, database pool, timeout, and region choices for production.')
    ]
  });
}

function analyzeGoBackend(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'go-backend',
    provider: 'go',
    providerLabel: 'Go',
    area: 'backend',
    areaLabel: 'Backend / API',
    promptSubject: 'Go backend',
    items: [
      item('go-runtime-found', 'Go API runtime found', /(^|\n|\/)go\.mod\b|gin-gonic|go-chi|gofiber|net\/http/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /gin-gonic|go-chi|gofiber|net\/http/i).concat(pathEvidence(ctx, /(^|\/)go\.mod\b/i)), 'Add or confirm Go modules and the HTTP framework used by this app.'),
      item('handlers-or-routes-found', 'Handlers or routes found', /\.go\b/i.test(ctx.pathBlob) && /\b(GET|POST|PUT|DELETE)\s*\(|http\.Handle|HandleFunc|router\./i.test(ctx.contentBlob), fileEvidence(ctx, /\b(GET|POST|PUT|DELETE)\s*\(|http\.Handle|HandleFunc|router\./i), 'Keep Go handlers and route registration visible in the repo.'),
      item('request-validation-found', 'Request validation found', /validator|binding:|bindjson|shouldbind|json\.newdecoder|validate\./i.test(ctx.contentBlob), fileEvidence(ctx, /validator|binding:|bindjson|shouldbind|json\.newdecoder|validate\./i), 'Validate request bodies and parameters before processing backend operations.'),
      item('backend-error-handling-found', 'Backend error handling found', /if\s+err\s*!=\s*nil|http\.Error|statusinternalservererror|c\.json\([^)]*500/i.test(ctx.contentBlob), fileEvidence(ctx, /if\s+err\s*!=\s*nil|http\.Error|statusinternalservererror|c\.json\([^)]*500/i), 'Add consistent Go error handling for API routes.'),
      manualItem('production-runtime-checked', 'Production runtime limits checked', 'Confirm binary build, health checks, timeout, concurrency, and region choices for production.')
    ]
  });
}

function analyzeClerkAuth(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'clerk-auth',
    provider: 'clerk',
    providerLabel: 'Clerk',
    area: 'auth',
    areaLabel: 'Auth',
    promptSubject: 'Clerk auth',
    items: [
      item('package-installed', 'Clerk package installed', hasPackage(ctx, [/^@clerk\//]), packageEvidence(ctx, [/^@clerk\//]), 'Install the Clerk package that matches this app framework.'),
      item('env-names-documented', 'Clerk env names documented', hasAllContent(ctx, [/next_public_clerk_publishable_key/i, /clerk_secret_key/i]), envEvidence(ctx, [/next_public_clerk_publishable_key/i, /clerk_secret_key/i]), 'Document NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in an env example or setup docs.'),
      item('route-protection-found', 'Auth middleware or route protection found', /(^|\n|\/)middleware\.[jt]sx?\b/i.test(ctx.pathBlob) || /clerkmiddleware|authmiddleware|createRouteMatcher/i.test(ctx.contentBlob), fileEvidence(ctx, /middleware\.[jt]sx?$|clerkmiddleware|authmiddleware|createRouteMatcher/i), 'Add Clerk middleware or route guards around authenticated app routes.'),
      item('provider-mounted', 'Clerk provider mounted', /clerkprovider/i.test(ctx.contentBlob), fileEvidence(ctx, /clerkprovider/i), 'Mount ClerkProvider in the app root or framework-specific provider layer.'),
      item('sign-in-flow-found', 'Sign-in or sign-up flow found', /sign-?in|sign-?up/i.test(ctx.pathBlob) || /<\s*sign(in|up)\b|sign(in|up)button/i.test(ctx.contentBlob), fileEvidence(ctx, /sign-?in|sign-?up|<\s*sign(in|up)\b|sign(in|up)button/i), 'Add a visible sign-in/sign-up route or component for users.'),
      item('server-auth-usage-found', 'Server auth usage found', /\bauth\s*\(|currentuser\s*\(|getauth\s*\(/i.test(ctx.contentBlob), fileEvidence(ctx, /\bauth\s*\(|currentuser\s*\(|getauth\s*\(/i), 'Use Clerk server auth in protected data routes or server components.'),
      secretSafetyItem(ctx, 'secret-not-exposed', 'Clerk secret key not exposed to frontend', /clerk_secret_key|sk_live_/i, 'Move Clerk secret key usage to server-only files and keep frontend code on publishable keys.'),
      manualItem('production-dashboard-checked', 'Production Clerk app and domains checked', 'Confirm production domains, OAuth redirects, allowed origins, and social provider settings in Clerk Dashboard.')
    ]
  });
}

function analyzeAuthJsAuth(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'authjs-auth',
    provider: 'authjs',
    providerLabel: 'Auth.js',
    area: 'auth',
    areaLabel: 'Auth',
    promptSubject: 'Auth.js auth',
    items: [
      item('package-installed', 'Auth.js package installed', hasPackage(ctx, [/^next-auth$/, /^@auth\//]), packageEvidence(ctx, [/^next-auth$/, /^@auth\//]), 'Install next-auth or the correct @auth package for this framework.'),
      item('env-names-documented', 'Auth secret env documented', /auth_secret|nextauth_secret/i.test(ctx.contentBlob), envEvidence(ctx, [/auth_secret/i, /nextauth_secret/i, /nextauth_url/i]), 'Document AUTH_SECRET or NEXTAUTH_SECRET in env examples or setup docs.'),
      item('auth-config-found', 'Auth config found', /(^|\n|\/)auth\.[jt]s\b|nextauth|NextAuth\s*\(/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /auth\.[jt]s$|nextauth|NextAuth\s*\(/i), 'Add a central Auth.js config with providers and callbacks.'),
      item('route-handler-found', 'Auth route handler found', /api\/auth|handlers\s*:\s*{|GET|POST/i.test(ctx.pathBlob + '\n' + ctx.contentBlob), pathEvidence(ctx, /api\/auth/i).concat(fileEvidence(ctx, /handlers\s*:\s*{|NextAuth\s*\(/i)), 'Expose the Auth.js route handler expected by this framework.'),
      item('session-usage-found', 'Session usage found', /\bauth\s*\(|getserversession|usesession\s*\(/i.test(ctx.contentBlob), fileEvidence(ctx, /\bauth\s*\(|getserversession|usesession\s*\(/i), 'Use server or client session checks around authenticated product routes.'),
      secretSafetyItem(ctx, 'secret-not-exposed', 'Auth secret not exposed to frontend', /auth_secret|nextauth_secret/i, 'Move Auth.js secrets to server-only env and never expose them through public env variables.'),
      manualItem('production-provider-checked', 'Production OAuth providers checked', 'Confirm OAuth app callback URLs, secrets, and production domain settings in each provider dashboard.')
    ]
  });
}

function analyzeAuth0Auth(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'auth0-auth',
    provider: 'auth0',
    providerLabel: 'Auth0',
    area: 'auth',
    areaLabel: 'Auth',
    promptSubject: 'Auth0 auth',
    items: [
      item('package-installed', 'Auth0 package installed', hasPackage(ctx, [/@auth0\//]), packageEvidence(ctx, [/@auth0\//]), 'Install the Auth0 package that matches this framework.'),
      item('env-names-documented', 'Auth0 env names documented', /auth0_secret|auth0_issuer_base_url|auth0_client_id|auth0_client_secret|auth0_domain/i.test(ctx.contentBlob), envEvidence(ctx, [/auth0_secret/i, /auth0_issuer_base_url/i, /auth0_client_id/i, /auth0_client_secret/i, /auth0_domain/i]), 'Document Auth0 issuer/domain, client ID, client secret, and app secret env names in safe examples.'),
      item('auth-route-found', 'Auth0 callback or auth route found', /api\/auth|auth0|handleauth|callback/i.test(ctx.pathBlob + '\n' + ctx.contentBlob), pathEvidence(ctx, /api\/auth|callback/i).concat(fileEvidence(ctx, /auth0|handleauth|callback/i)), 'Expose the Auth0 callback/login/logout routes required by this framework.'),
      item('session-usage-found', 'Auth0 session usage found', /getsession|withapirequiredauth|withpagerequiredauth|useuser\s*\(/i.test(ctx.contentBlob), fileEvidence(ctx, /getsession|withapirequiredauth|withpagerequiredauth|useuser\s*\(/i), 'Use Auth0 session checks around authenticated app routes and API handlers.'),
      item('route-protection-found', 'Protected route evidence found', /withpagerequiredauth|withapirequiredauth|middleware|protected|requires?auth/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /withpagerequiredauth|withapirequiredauth|middleware|protected|requires?auth/i), 'Protect private routes with Auth0 middleware or server session guards.'),
      secretSafetyItem(ctx, 'secret-not-exposed', 'Auth0 secrets not exposed to frontend', /auth0_client_secret|auth0_secret/i, 'Keep Auth0 secrets in server-only env and never expose them through public env variables.'),
      manualItem('production-dashboard-checked', 'Production Auth0 app checked', 'Confirm callback URLs, logout URLs, allowed origins, social connections, MFA, and production domain in Auth0.')
    ]
  });
}

function analyzeBetterAuth(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'better-auth-auth',
    provider: 'better-auth',
    providerLabel: 'Better Auth',
    area: 'auth',
    areaLabel: 'Auth',
    promptSubject: 'Better Auth',
    items: [
      item('package-installed', 'Better Auth package installed', hasPackage(ctx, [/^better-auth$/]), packageEvidence(ctx, [/^better-auth$/]), 'Install Better Auth for this app framework.'),
      item('env-names-documented', 'Better Auth env names documented', /better_auth_secret|better_auth_url|auth_secret|database_url/i.test(ctx.contentBlob), envEvidence(ctx, [/better_auth_secret/i, /better_auth_url/i, /auth_secret/i, /database_url/i]), 'Document BETTER_AUTH_SECRET, BETTER_AUTH_URL, and database env names in safe examples.'),
      item('auth-config-found', 'Better Auth config found', /betterauth\s*\(|better-auth|auth\.api|auth\.handler/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /betterauth\s*\(|better-auth|auth\.api|auth\.handler/i), 'Add a central Better Auth config and route handler.'),
      item('database-adapter-found', 'Auth database adapter or schema found', /database|adapter|drizzle|prisma|schema|migration/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /adapter|drizzle|prisma|schema|migration/i), 'Persist Better Auth users/sessions through a real database adapter and migrations.'),
      item('session-usage-found', 'Session usage found', /getsession|usesession|auth\.api\.getsession|session/i.test(ctx.contentBlob), fileEvidence(ctx, /getsession|usesession|auth\.api\.getsession|session/i), 'Use Better Auth session reads around private product routes.'),
      secretSafetyItem(ctx, 'secret-not-exposed', 'Better Auth secret not exposed to frontend', /better_auth_secret|auth_secret/i, 'Keep Better Auth secrets in server-only env and never expose them through public env variables.'),
      manualItem('production-auth-checked', 'Production auth settings checked', 'Confirm production base URL, trusted origins, OAuth apps, email settings, and session policy.')
    ]
  });
}

function analyzeSupabaseAuth(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'supabase-auth',
    provider: 'supabase-auth',
    providerLabel: 'Supabase Auth',
    area: 'auth',
    areaLabel: 'Auth',
    promptSubject: 'Supabase Auth',
    items: [
      item('package-installed', 'Supabase auth package installed', hasPackage(ctx, [/@supabase\//]), packageEvidence(ctx, [/@supabase\//]), 'Install @supabase/supabase-js or @supabase/ssr for auth helpers.'),
      item('env-names-documented', 'Supabase auth env names documented', /supabase_url/i.test(ctx.contentBlob) && /supabase_anon_key/i.test(ctx.contentBlob), envEvidence(ctx, [/supabase_url/i, /supabase_anon_key/i]), 'Document SUPABASE_URL and SUPABASE_ANON_KEY style env names in examples or setup docs.'),
      item('auth-helper-found', 'Supabase auth helper found', /auth\.getuser|auth\.getsession|auth\.signin|auth\.signup|createServerClient|createBrowserClient/i.test(ctx.contentBlob), fileEvidence(ctx, /auth\.getuser|auth\.getsession|auth\.signin|auth\.signup|createServerClient|createBrowserClient/i), 'Use Supabase auth helpers for session reads and sign-in flows.'),
      item('protected-route-found', 'Protected route or server session check found', /auth\.getuser|auth\.getsession|middleware|protected/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /auth\.getuser|auth\.getsession|middleware|protected/i), 'Protect signed-in routes with a server session check or middleware.'),
      secretSafetyItem(ctx, 'service-role-not-exposed', 'Service role key not exposed to frontend', /supabase_service_role_key|next_public_supabase_service_role|vite_supabase_service_role/i, 'Keep service-role keys in server-only code and use anon keys in frontend clients.'),
      manualItem('production-auth-dashboard-checked', 'Production Supabase Auth settings checked', 'Confirm site URL, redirect URLs, email provider, OAuth providers, and auth policies in Supabase Dashboard.')
    ]
  });
}

function analyzeStripePayments(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'stripe-payments',
    provider: 'stripe',
    providerLabel: 'Stripe',
    area: 'payments',
    areaLabel: 'Payments',
    promptSubject: 'Stripe payments',
    items: [
      item('package-installed', 'Stripe package installed', hasPackage(ctx, [/^stripe$/, /^@stripe\//]), packageEvidence(ctx, [/^stripe$/, /^@stripe\//]), 'Install Stripe server/client packages that match this app framework.'),
      item('env-names-documented', 'Stripe env names documented', hasAllContent(ctx, [/stripe_secret_key/i, /stripe_webhook_secret/i]), envEvidence(ctx, [/stripe_secret_key/i, /stripe_webhook_secret/i, /next_public_stripe_publishable_key/i]), 'Document STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and publishable key names in env examples or setup docs.'),
      item('checkout-session-found', 'Checkout session creation found', /checkout\.sessions\.create|redirecttocheckout/i.test(ctx.contentBlob), fileEvidence(ctx, /checkout\.sessions\.create|redirecttocheckout/i), 'Create a server-side Stripe Checkout session path for paid plans.'),
      item('webhook-route-found', 'Stripe webhook route found', /stripe.*webhook|webhook.*stripe/i.test(ctx.pathBlob), pathEvidence(ctx, /stripe.*webhook|webhook.*stripe/i), 'Add a Stripe webhook route for subscription and payment lifecycle events.'),
      item('webhook-signature-found', 'Webhook signature verification found', /webhooks\.constructevent/i.test(ctx.contentBlob), fileEvidence(ctx, /webhooks\.constructevent/i), 'Verify Stripe webhook signatures with STRIPE_WEBHOOK_SECRET before processing events.'),
      item('billing-management-found', 'Subscription or customer portal found', /billingportal\.sessions\.create|subscriptions\.create|mode\s*:\s*['"]subscription['"]/i.test(ctx.contentBlob), fileEvidence(ctx, /billingportal\.sessions\.create|subscriptions\.create|mode\s*:\s*['"]subscription['"]/i), 'Add subscription creation or customer portal handling for paid users.'),
      secretSafetyItem(ctx, 'secret-not-exposed', 'Stripe secret key not exposed to frontend', /stripe_secret_key|sk_live_|sk_test_/i, 'Move Stripe secret-key usage to server-only routes and use publishable keys in frontend code.'),
      manualItem('production-dashboard-checked', 'Production Stripe products and webhooks checked', 'Confirm live-mode products, prices, webhook endpoint URL, and event list in Stripe Dashboard.')
    ]
  });
}

function analyzePaddlePayments(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'paddle-payments',
    provider: 'paddle',
    providerLabel: 'Paddle',
    area: 'payments',
    areaLabel: 'Payments',
    promptSubject: 'Paddle payments',
    items: [
      item('package-installed', 'Paddle package installed', hasPackage(ctx, [/@paddle\//]), packageEvidence(ctx, [/@paddle\//]), 'Install Paddle client/server SDK packages that match this app framework.'),
      item('env-names-documented', 'Paddle env names documented', /paddle_api_key|paddle_webhook_secret|next_public_paddle/i.test(ctx.contentBlob), envEvidence(ctx, [/paddle_api_key/i, /paddle_webhook_secret/i, /next_public_paddle_client_token/i]), 'Document Paddle API key, webhook secret, and public client token env names.'),
      item('checkout-found', 'Paddle checkout flow found', /paddle.*checkout|checkout.*paddle|paddle\.checkout|openCheckout/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /paddle.*checkout|checkout.*paddle|paddle\.checkout|openCheckout/i), 'Add a Paddle checkout flow for paid plans.'),
      item('webhook-route-found', 'Paddle webhook route found', /paddle.*webhook|webhook.*paddle/i.test(ctx.pathBlob), pathEvidence(ctx, /paddle.*webhook|webhook.*paddle/i), 'Add a Paddle webhook route for subscription lifecycle events.'),
      item('webhook-signature-found', 'Paddle webhook verification found', /verify.*paddle|paddle.*signature|webhook.*signature/i.test(ctx.contentBlob), fileEvidence(ctx, /verify.*paddle|paddle.*signature|webhook.*signature/i), 'Verify Paddle webhook signatures before processing events.'),
      secretSafetyItem(ctx, 'secret-not-exposed', 'Paddle secret not exposed to frontend', /paddle_api_key|paddle_webhook_secret/i, 'Move Paddle API keys and webhook secrets to server-only code.'),
      manualItem('production-dashboard-checked', 'Production Paddle products and webhooks checked', 'Confirm live products, prices, tax settings, webhook URL, and event list in Paddle Dashboard.')
    ]
  });
}

function analyzePolarPayments(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'polar-payments',
    provider: 'polar',
    providerLabel: 'Polar',
    area: 'payments',
    areaLabel: 'Payments',
    promptSubject: 'Polar payments',
    items: [
      item('api-client-found', 'Polar SDK or API client found', hasPackage(ctx, [/@polar-sh\//]) || Boolean(ctx.scan.stackSignals.hasPolar) || /api\.polar\.sh|sandbox-api\.polar\.sh|polarbillingservice/i.test(ctx.contentBlob), packageEvidence(ctx, [/@polar-sh\//]).concat(fileEvidence(ctx, /api\.polar\.sh|sandbox-api\.polar\.sh|polarbillingservice/i)), 'Add a Polar SDK or server-side API client for checkout and customer state.'),
      item('env-names-documented', 'Polar env names documented', /polar_access_token|polar_webhook_secret|polar_pro_product_id/i.test(ctx.contentBlob), envEvidence(ctx, [/polar_access_token/i, /polar_webhook_secret/i, /polar_pro_product_id/i, /polar_sandbox/i]), 'Document POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET, and product ID env names in safe examples.'),
      item('checkout-found', 'Polar checkout flow found', /polar.*checkout|checkout.*polar|\/checkouts\b|createcheckoutsession/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /polar.*checkout|checkout.*polar|\/checkouts\b|createcheckoutsession/i), 'Add a server-side Polar checkout flow for paid plans.'),
      item('webhook-route-found', 'Polar webhook route found', /polar.*webhook|webhook.*polar/i.test(ctx.pathBlob + '\n' + ctx.contentBlob), pathEvidence(ctx, /polar.*webhook|webhook.*polar/i).concat(fileEvidence(ctx, /polar.*webhook|webhook.*polar/i)), 'Add a Polar webhook route for subscription and customer lifecycle events.'),
      item('webhook-signature-found', 'Polar webhook verification found', /polar_webhook_secret|verify.*polar|polar.*signature|webhook.*signature/i.test(ctx.contentBlob), fileEvidence(ctx, /polar_webhook_secret|verify.*polar|polar.*signature|webhook.*signature/i), 'Verify Polar webhook signatures before processing billing events.'),
      item('customer-state-found', 'Polar customer or subscription state found', /external_customer_id|customer_portal|customer[_-]?state|polar_subscription_id|polar_customer_id/i.test(ctx.contentBlob), fileEvidence(ctx, /external_customer_id|customer_portal|customer[_-]?state|polar_subscription_id|polar_customer_id/i), 'Persist Polar customer/subscription state and expose a customer portal path for paid users.'),
      secretSafetyItem(ctx, 'secret-not-exposed', 'Polar secret not exposed to frontend', /polar_access_token|polar_webhook_secret/i, 'Move Polar access tokens and webhook secrets to server-only code.'),
      manualItem('production-dashboard-checked', 'Production Polar products and webhooks checked', 'Confirm products, prices, customer portal, webhook URL, and event list in Polar Dashboard.')
    ]
  });
}

function analyzeLemonSqueezyPayments(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'lemon-squeezy-payments',
    provider: 'lemon-squeezy',
    providerLabel: 'Lemon Squeezy',
    area: 'payments',
    areaLabel: 'Payments',
    promptSubject: 'Lemon Squeezy payments',
    items: [
      item('api-client-found', 'Lemon Squeezy SDK or API client found', hasPackage(ctx, [/@lemonsqueezy\//, /^lemonsqueezy\.ts$/]) || /api\.lemonsqueezy\.com|lemonsqueezy|lemon_squeezy/i.test(ctx.contentBlob), packageEvidence(ctx, [/@lemonsqueezy\//, /^lemonsqueezy\.ts$/]).concat(fileEvidence(ctx, /api\.lemonsqueezy\.com|lemonsqueezy|lemon_squeezy/i)), 'Add a server-side Lemon Squeezy API client for checkout and subscription state.'),
      item('env-names-documented', 'Lemon Squeezy env names documented', /lemon_squeezy_api_key|lemonsqueezy_api_key|lemon_squeezy_webhook_secret|lemon_squeezy_store_id|lemon_squeezy_variant_id/i.test(ctx.contentBlob), envEvidence(ctx, [/lemon_squeezy_api_key/i, /lemonsqueezy_api_key/i, /lemon_squeezy_webhook_secret/i, /lemon_squeezy_store_id/i, /lemon_squeezy_variant_id/i]), 'Document Lemon Squeezy API key, webhook secret, store ID, and variant/product ID env names.'),
      item('checkout-found', 'Lemon Squeezy checkout flow found', /lemon.*checkout|checkout.*lemon|checkout_url|variant_id|store_id/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /lemon.*checkout|checkout.*lemon|checkout_url|variant_id|store_id/i), 'Create a checkout URL/session flow for paid plans.'),
      item('webhook-route-found', 'Lemon Squeezy webhook route found', /lemon.*webhook|webhook.*lemon|lemonsqueezy.*webhook/i.test(ctx.pathBlob + '\n' + ctx.contentBlob), pathEvidence(ctx, /lemon.*webhook|webhook.*lemon|lemonsqueezy.*webhook/i).concat(fileEvidence(ctx, /lemonsqueezy.*webhook|lemon.*webhook/i)), 'Add a Lemon Squeezy webhook route for order/subscription lifecycle events.'),
      item('webhook-signature-found', 'Lemon Squeezy webhook verification found', /x-signature|lemon_squeezy_webhook_secret|verify.*lemon|webhook.*signature/i.test(ctx.contentBlob), fileEvidence(ctx, /x-signature|lemon_squeezy_webhook_secret|verify.*lemon|webhook.*signature/i), 'Verify Lemon Squeezy webhook signatures before processing billing events.'),
      secretSafetyItem(ctx, 'secret-not-exposed', 'Lemon Squeezy secret not exposed to frontend', /lemon_squeezy_api_key|lemonsqueezy_api_key|lemon_squeezy_webhook_secret/i, 'Move Lemon Squeezy API keys and webhook secrets to server-only code.'),
      manualItem('production-dashboard-checked', 'Production Lemon Squeezy store checked', 'Confirm products, variants, tax/merchant settings, license keys if used, and webhook URL in Lemon Squeezy.')
    ]
  });
}

function analyzeFirebaseDatabase(ctx: StackContext): StackWiringProviderSummary {
  return databaseSummary(ctx, {
    key: 'firebase-database',
    provider: 'firebase',
    providerLabel: 'Firebase',
    promptSubject: 'Firebase database',
    packagePatterns: [/^firebase$/, /^firebase-admin$/, /@firebase\//],
    envPatterns: [/firebase_project_id/i, /firestore_database_url/i, /next_public_firebase/i, /vite_firebase/i, /google_application_credentials/i],
    usagePatterns: [/firebase\/firestore/i, /getfirestore\s*\(|collection\s*\(|doc\s*\(|firebase-admin/i],
    manualLabel: 'Production Firebase project checked',
    manualHint: 'Confirm production project, Firestore rules, indexes, backups, service account scope, and billing limits in Firebase.'
  });
}

function analyzeNeonDatabase(ctx: StackContext): StackWiringProviderSummary {
  return databaseSummary(ctx, {
    key: 'neon-database',
    provider: 'neon',
    providerLabel: 'Neon',
    promptSubject: 'Neon database',
    packagePatterns: [/@neondatabase\//],
    envPatterns: [/neon_database_url/i, /database_url/i],
    usagePatterns: [/@neondatabase\/serverless/i, /\bneon\s*\(/i, /\bsql`/i],
    manualLabel: 'Production Neon branch and pooling checked',
    manualHint: 'Confirm production branch, pooled connection string, backups, and region in Neon.'
  });
}

function analyzeTursoDatabase(ctx: StackContext): StackWiringProviderSummary {
  return databaseSummary(ctx, {
    key: 'turso-database',
    provider: 'turso',
    providerLabel: 'Turso',
    promptSubject: 'Turso database',
    packagePatterns: [/@libsql\/client/],
    envPatterns: [/turso_database_url/i, /turso_auth_token/i],
    usagePatterns: [/@libsql\/client/i, /createClient\s*\(/i],
    manualLabel: 'Production Turso database checked',
    manualHint: 'Confirm production database, auth token scope, replica/region, and backup strategy in Turso.'
  });
}

function analyzeMongoDatabase(ctx: StackContext): StackWiringProviderSummary {
  return databaseSummary(ctx, {
    key: 'mongodb-database',
    provider: 'mongodb',
    providerLabel: 'MongoDB',
    promptSubject: 'MongoDB database',
    packagePatterns: [/^mongodb$/, /^mongoose$/],
    envPatterns: [/mongodb_uri/i, /mongodb_url/i, /mongodb_atlas_uri/i],
    usagePatterns: [/new\s+MongoClient|mongoose\.connect|mongodb/i],
    manualLabel: 'Production MongoDB Atlas settings checked',
    manualHint: 'Confirm Atlas network access, database user permissions, backups, indexes, and production cluster sizing.'
  });
}

function analyzePlanetScaleDatabase(ctx: StackContext): StackWiringProviderSummary {
  return databaseSummary(ctx, {
    key: 'planetscale-database',
    provider: 'planetscale',
    providerLabel: 'PlanetScale',
    promptSubject: 'PlanetScale database',
    packagePatterns: [/@planetscale\/database/],
    envPatterns: [/planetscale_database_url/i, /database_url/i],
    usagePatterns: [/@planetscale\/database/i, /connect\s*\(/i],
    manualLabel: 'Production PlanetScale branch checked',
    manualHint: 'Confirm production branch, deploy requests, connection credentials, backups, and schema migration workflow.'
  });
}

function analyzeVercelDeployment(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'vercel-deployment',
    provider: 'vercel',
    providerLabel: 'Vercel',
    area: 'deployment',
    areaLabel: 'Deployment',
    promptSubject: 'Vercel deployment',
    items: [
      item('deploy-target-detected', 'Vercel-compatible app detected', Boolean(ctx.scan.stackSignals.hasVercel || ctx.scan.stackSignals.hasNextJs || ctx.scan.stackSignals.hasVite || /vercel\.json|next\.config|vite\.config/i.test(ctx.pathBlob)), pathEvidence(ctx, /vercel\.json|next\.config|vite\.config/i), 'Confirm this app has a Vercel-compatible framework or deployment target.'),
      item('build-script-found', 'Production build script found', /"build"\s*:\s*"[^"]+"/i.test(ctx.contentBlob), fileEvidence(ctx, /"build"\s*:\s*"[^"]+"/i), 'Add a package.json build script that Vercel can run.'),
      item('deployment-config-found', 'Deployment config or command found', /vercel\.json/i.test(ctx.pathBlob) || /"deploy"\s*:\s*"[^"]*vercel/i.test(ctx.contentBlob), pathEvidence(ctx, /vercel\.json/i).concat(fileEvidence(ctx, /"deploy"\s*:\s*"[^"]*vercel/i)), 'Add vercel.json or a documented Vercel deploy command when the project needs custom deployment behavior.'),
      item('env-template-found', 'Production env template found', Boolean(ctx.scan.stackSignals.hasEnvExample || /(^|\n|\/)\.env\.example\b|env\.example|environment variables/i.test(ctx.pathBlob + '\n' + ctx.contentBlob)), pathEvidence(ctx, /\.env\.example|env\.example/i), 'Document production env variable names in .env.example or setup docs.'),
      item('preview-or-ci-found', 'Preview deploy or CI config found', Boolean(ctx.scan.stackSignals.hasCI || /\.github\/workflows|vercel\.json/i.test(ctx.pathBlob)), pathEvidence(ctx, /\.github\/workflows|vercel\.json/i), 'Add CI or Vercel preview-deploy configuration so production changes are tested before release.'),
      manualItem('production-dashboard-checked', 'Production Vercel env and domain checked', 'Confirm production env values, project link, framework preset, build command, and production domain in Vercel Dashboard.')
    ]
  });
}

function analyzeNetlifyDeployment(ctx: StackContext): StackWiringProviderSummary {
  const base = deploymentSummary(ctx, {
    key: 'netlify-deployment',
    provider: 'netlify',
    providerLabel: 'Netlify',
    promptSubject: 'Netlify deployment',
    packagePatterns: [/@netlify\//],
    configPatterns: [/netlify\.toml/i, /\.netlify\//i],
    envPatterns: [/netlify_auth_token/i, /netlify_site_id/i],
    manualLabel: 'Production Netlify env and domain checked',
    manualHint: 'Confirm build command, publish directory, functions runtime, env values, redirects, and production domain in Netlify.'
  });
  const redirectsOrFunctionsPattern = /(\[\[redirects\]\]|(^|\n|\/)_redirects\b|(^|\n|\/)netlify\/functions\/|\[functions\]|functions\s*=)/i;
  return summarize({
    ...base,
    items: [
      ...base.items.filter((entry) => entry.status !== 'manual'),
      item('redirects-or-functions-found', 'Redirects or Netlify Functions found', redirectsOrFunctionsPattern.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, redirectsOrFunctionsPattern).concat(pathEvidence(ctx, redirectsOrFunctionsPattern)), 'Add Netlify redirects or functions configuration when deployment behavior depends on routing or serverless handlers.'),
      ...base.items.filter((entry) => entry.status === 'manual')
    ]
  });
}

function analyzeRenderDeployment(ctx: StackContext): StackWiringProviderSummary {
  const base = deploymentSummary(ctx, {
    key: 'render-deployment',
    provider: 'render',
    providerLabel: 'Render',
    promptSubject: 'Render deployment',
    packagePatterns: [],
    configPatterns: [/render\.ya?ml/i, /(^|\n|\/)\.render\//i],
    envPatterns: [/render_api_key/i, /render_service_id/i],
    manualLabel: 'Production Render service checked',
    manualHint: 'Confirm service type, build/start commands, env groups, health checks, custom domain, autoscaling, and rollback strategy in Render.'
  });
  const servicePattern = /render\.ya?ml|healthcheckpath|startcommand|buildcommand|envvars|services:\s*|type:\s*web/i;
  return summarize({
    ...base,
    items: [
      ...base.items.filter((entry) => entry.status !== 'manual'),
      item('service-config-found', 'Render service config found', servicePattern.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, servicePattern).concat(pathEvidence(ctx, servicePattern)), 'Add render.yaml or deployment docs covering service type, commands, health checks, and env groups.'),
      ...base.items.filter((entry) => entry.status === 'manual')
    ]
  });
}

function analyzeRailwayDeployment(ctx: StackContext): StackWiringProviderSummary {
  const base = deploymentSummary(ctx, {
    key: 'railway-deployment',
    provider: 'railway',
    providerLabel: 'Railway',
    promptSubject: 'Railway deployment',
    packagePatterns: [],
    configPatterns: [/railway\.json/i, /nixpacks\.toml/i, /(^|\n|\/)Procfile\b/i],
    envPatterns: [/railway_token/i, /railway_project_id/i, /railway_service_id/i],
    manualLabel: 'Production Railway service checked',
    manualHint: 'Confirm service, variables, start command, volumes/databases, custom domain, deploy policy, and logs in Railway.'
  });
  const servicePattern = /railway\.json|nixpacks\.toml|railway up|railway deploy|Procfile|startCommand|healthcheck/i;
  return summarize({
    ...base,
    items: [
      ...base.items.filter((entry) => entry.status !== 'manual'),
      item('service-config-found', 'Railway service config found', servicePattern.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, servicePattern).concat(pathEvidence(ctx, servicePattern)), 'Add Railway/Nixpacks/Procfile config or deployment docs for commands, health checks, and service wiring.'),
      ...base.items.filter((entry) => entry.status === 'manual')
    ]
  });
}

function analyzeCloudflareDeployment(ctx: StackContext): StackWiringProviderSummary {
  const base = deploymentSummary(ctx, {
    key: 'cloudflare-deployment',
    provider: 'cloudflare',
    providerLabel: 'Cloudflare',
    promptSubject: 'Cloudflare deployment',
    packagePatterns: [/^wrangler$/, /@cloudflare\//],
    configPatterns: [/wrangler\.toml/i, /wrangler\.json/i, /_headers\b/i, /_redirects\b/i],
    envPatterns: [/cloudflare_api_token/i, /cloudflare_account_id/i, /cf_pages/i],
    manualLabel: 'Production Cloudflare project checked',
    manualHint: 'Confirm Pages/Workers project, DNS, routes, compatibility date, env vars/secrets, cache rules, and rollback settings in Cloudflare.'
  });
  const edgePattern = /wrangler\.toml|wrangler\.json|compatibility_date|pages_build_output_dir|workers_dev|routes?\s*=|cloudflare pages|cloudflare workers/i;
  return summarize({
    ...base,
    items: [
      ...base.items.filter((entry) => entry.status !== 'manual'),
      item('edge-config-found', 'Cloudflare Pages or Workers config found', edgePattern.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, edgePattern).concat(pathEvidence(ctx, edgePattern)), 'Add Wrangler/Pages config for build output, compatibility date, routes, and edge runtime behavior.'),
      ...base.items.filter((entry) => entry.status === 'manual')
    ]
  });
}

function analyzeAwsDeployment(ctx: StackContext): StackWiringProviderSummary {
  const base = deploymentSummary(ctx, {
    key: 'aws-deployment',
    provider: 'aws',
    providerLabel: 'AWS',
    promptSubject: 'AWS deployment',
    packagePatterns: [/@aws-sdk\//, /^aws-cdk-lib$/, /^serverless$/],
    configPatterns: [/serverless\.ya?ml/i, /template\.ya?ml/i, /cdk\.json/i, /amplify\//i, /\.github\/workflows/i],
    envPatterns: [/aws_region/i, /aws_access_key_id/i],
    manualLabel: 'Production AWS account and IAM checked',
    manualHint: 'Confirm IAM permissions, region, secrets, logs, alarms, domains, and rollback strategy in AWS.'
  });
  const infrastructurePattern = /serverless\.ya?ml|template\.ya?ml|cdk\.json|sst\.config|terraform|cloudformation|aws-cdk-lib|provider:\s*\n\s*name:\s*aws|resources:\s*|functions:\s*/i;
  return summarize({
    ...base,
    items: [
      ...base.items.filter((entry) => entry.status !== 'manual'),
      item('infrastructure-config-found', 'AWS infrastructure config found', infrastructurePattern.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, infrastructurePattern).concat(pathEvidence(ctx, infrastructurePattern)), 'Add reproducible AWS infrastructure config such as Serverless, CDK, SAM, CloudFormation, or Terraform.'),
      ...base.items.filter((entry) => entry.status === 'manual')
    ]
  });
}

function analyzeSupabaseLanding(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'supabase-landing',
    provider: 'supabase',
    providerLabel: 'Supabase',
    area: 'landing',
    areaLabel: 'Landing / Onboarding',
    promptSubject: 'Supabase landing data',
    items: [
      item('package-installed', 'Supabase package installed', hasPackage(ctx, [/@supabase\//]), packageEvidence(ctx, [/@supabase\//]), 'Install Supabase client/server helpers for waitlist or onboarding storage.'),
      item('env-names-documented', 'Supabase env names documented', /supabase_url/i.test(ctx.contentBlob) && /supabase_anon_key/i.test(ctx.contentBlob), envEvidence(ctx, [/supabase_url/i, /supabase_anon_key/i]), 'Document Supabase URL and anon key env names for landing/onboarding data.'),
      item('lead-table-usage-found', 'Lead or onboarding data usage found', /waitlist|lead|onboarding|signup|profiles|subscribers/i.test(ctx.contentBlob), fileEvidence(ctx, /waitlist|lead|onboarding|signup|profiles|subscribers/i), 'Store waitlist, lead, or onboarding records in a clear Supabase table.'),
      item('form-submit-found', 'Form submission path found', /formdata|onSubmit|action=|submit|insert\s*\(/i.test(ctx.contentBlob), fileEvidence(ctx, /formdata|onSubmit|action=|submit|insert\s*\(/i), 'Wire the landing/onboarding form to a real server-safe submission path.'),
      manualItem('production-data-policy-checked', 'Production data policy checked', 'Confirm table permissions, spam handling, and privacy policy alignment in Supabase.')
    ]
  });
}

function analyzeSentryMonitoring(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'sentry-monitoring',
    provider: 'sentry',
    providerLabel: 'Sentry',
    area: 'monitoring',
    areaLabel: 'Monitoring',
    promptSubject: 'Sentry monitoring',
    items: [
      item('package-installed', 'Sentry package installed', hasPackage(ctx, [/^@sentry\//]), packageEvidence(ctx, [/^@sentry\//]), 'Install the Sentry package that matches this app framework.'),
      item('env-names-documented', 'Sentry DSN env documented', /sentry_dsn|next_public_sentry_dsn/i.test(ctx.contentBlob), envEvidence(ctx, [/sentry_dsn/i, /next_public_sentry_dsn/i]), 'Document SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN in env examples or setup docs.'),
      item('init-found', 'Sentry initialization found', /sentry\.init\s*\(|instrumentation\.[jt]s/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /sentry\.init\s*\(|instrumentation\.[jt]s/i), 'Initialize Sentry in the framework entrypoint for client and server errors.'),
      item('error-capture-found', 'Error capture or boundary found', /captureexception|global-error|errorboundary|onerror/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /captureexception|global-error|errorboundary|onerror/i), 'Capture production exceptions through Sentry error boundaries or server handlers.'),
      item('release-config-found', 'Release or source map config found', /sentry_auth_token|withsentryconfig|sentry-cli|sourcemap/i.test(ctx.contentBlob), fileEvidence(ctx, /sentry_auth_token|withsentryconfig|sentry-cli|sourcemap/i), 'Configure Sentry releases or source maps so production stack traces are useful.'),
      manualItem('production-dashboard-checked', 'Production Sentry project checked', 'Confirm DSN, environment names, alerts, retention, and source-map upload status in Sentry.')
    ]
  });
}

function analyzePostHogMonitoring(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'posthog-monitoring',
    provider: 'posthog',
    providerLabel: 'PostHog',
    area: 'monitoring',
    areaLabel: 'Monitoring',
    promptSubject: 'PostHog analytics',
    items: [
      item('package-installed', 'PostHog package installed', hasPackage(ctx, [/^posthog-js$/, /^posthog-node$/]), packageEvidence(ctx, [/^posthog-js$/, /^posthog-node$/]), 'Install posthog-js or posthog-node for the app surface that needs analytics.'),
      item('env-names-documented', 'PostHog env names documented', /posthog_key|next_public_posthog_key/i.test(ctx.contentBlob), envEvidence(ctx, [/posthog_key/i, /next_public_posthog_key/i, /next_public_posthog_host/i]), 'Document NEXT_PUBLIC_POSTHOG_KEY and host/project settings in env examples or setup docs.'),
      item('init-found', 'PostHog initialization found', /posthog\.init\s*\(/i.test(ctx.contentBlob), fileEvidence(ctx, /posthog\.init\s*\(/i), 'Initialize PostHog once in the app client/provider layer.'),
      item('provider-or-wrapper-found', 'Analytics provider or wrapper found', /posthogprovider|analytics\/posthog|useposthog/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /posthogprovider|analytics\/posthog|useposthog/i), 'Add a reusable analytics provider or wrapper instead of scattering raw setup code.'),
      item('event-capture-found', 'Product event capture found', /posthog\.capture\s*\(/i.test(ctx.contentBlob), fileEvidence(ctx, /posthog\.capture\s*\(/i), 'Capture at least one activation or conversion event.'),
      item('identity-found', 'User identify or group call found', /posthog\.identify\s*\(|posthog\.group\s*\(/i.test(ctx.contentBlob), fileEvidence(ctx, /posthog\.identify\s*\(|posthog\.group\s*\(/i), 'Identify signed-in users or groups where privacy rules allow it.'),
      manualItem('production-dashboard-checked', 'Production PostHog project checked', 'Confirm project key, allowed domains, privacy settings, autocapture choice, and retention in PostHog.')
    ]
  });
}

function analyzeLogRocketMonitoring(ctx: StackContext): StackWiringProviderSummary {
  const privacyScrubbingPattern = /requestSanitizer|responseSanitizer|dom\.inputSanitizer|dom\.textSanitizer|maskAllInputs|maskInputOptions|sanitize|scrub|redact|privacy/i;
  return summarize({
    key: 'logrocket-monitoring',
    provider: 'logrocket',
    providerLabel: 'LogRocket',
    area: 'monitoring',
    areaLabel: 'Monitoring',
    promptSubject: 'LogRocket monitoring',
    items: [
      item('package-installed', 'LogRocket package installed', hasPackage(ctx, [/^logrocket$/]), packageEvidence(ctx, [/^logrocket$/]), 'Install LogRocket for session replay if this product needs replay debugging.'),
      item('env-names-documented', 'LogRocket app id env documented', /logrocket_app_id|next_public_logrocket_app_id/i.test(ctx.contentBlob), envEvidence(ctx, [/logrocket_app_id/i, /next_public_logrocket_app_id/i]), 'Document the LogRocket app id env name.'),
      item('init-found', 'LogRocket initialization found', /logrocket\.init\s*\(/i.test(ctx.contentBlob), fileEvidence(ctx, /logrocket\.init\s*\(/i), 'Initialize LogRocket once in the client app shell.'),
      item('identify-found', 'User identification found', /logrocket\.identify\s*\(/i.test(ctx.contentBlob), fileEvidence(ctx, /logrocket\.identify\s*\(/i), 'Identify signed-in users where privacy rules allow it.'),
      item('privacy-scrubbing-found', 'Privacy scrubbing found', privacyScrubbingPattern.test(ctx.contentBlob), fileEvidence(ctx, privacyScrubbingPattern), 'Add repo-visible LogRocket privacy scrubbing for sensitive DOM fields or network payloads.'),
      manualItem('production-dashboard-checked', 'Production LogRocket privacy settings checked', 'Confirm app id, domain, privacy masking, network scrubbing, and retention in LogRocket.')
    ]
  });
}

function analyzeVitestTesting(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'vitest-testing',
    provider: 'vitest',
    providerLabel: 'Vitest',
    area: 'testing',
    areaLabel: 'Testing',
    promptSubject: 'Vitest tests',
    items: [
      item('package-installed', 'Vitest package installed', hasPackage(ctx, [/^vitest$/]), packageEvidence(ctx, [/^vitest$/]), 'Install Vitest for unit or component test coverage.'),
      item('test-script-found', 'Test script found', /"test"\s*:\s*"[^"]*(vitest|npm run|pnpm|yarn)/i.test(ctx.contentBlob), fileEvidence(ctx, /"test"\s*:\s*"[^"]*(vitest|npm run|pnpm|yarn)/i), 'Add a package.json test script that runs Vitest.'),
      item('test-files-found', 'Unit test files found', Boolean(ctx.scan.stackSignals.hasTests) || /\.(test|spec)\.[jt]sx?\b/i.test(ctx.pathBlob), pathEvidence(ctx, /\.(test|spec)\.[jt]sx?\b/i), 'Add unit tests for critical product logic.'),
      item('assertions-found', 'Assertions found', /expect\s*\(|assert\s*\(|test\s*\(/i.test(ctx.contentBlob), fileEvidence(ctx, /expect\s*\(|assert\s*\(|test\s*\(/i), 'Ensure tests include real assertions, not only smoke imports.'),
      manualItem('coverage-risk-reviewed', 'Critical path coverage reviewed', 'Confirm auth, billing, database, and main user flows have meaningful tests.')
    ]
  });
}

function analyzePlaywrightTesting(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'playwright-testing',
    provider: 'playwright',
    providerLabel: 'Playwright',
    area: 'testing',
    areaLabel: 'Testing',
    promptSubject: 'Playwright tests',
    items: [
      item('package-installed', 'Playwright package installed', hasPackage(ctx, [/@playwright\/test/]) || Boolean(ctx.scan.stackSignals.hasPlaywright), packageEvidence(ctx, [/@playwright\/test/]), 'Install @playwright/test for browser-flow coverage.'),
      item('config-found', 'Playwright config found', /playwright\.config\.[jt]s/i.test(ctx.pathBlob), pathEvidence(ctx, /playwright\.config\.[jt]s/i), 'Add a Playwright config with browser and base URL settings.'),
      item('e2e-tests-found', 'Browser flow tests found', /(^|\n|\/)(e2e|tests?)\/[^/\n]+\.(spec|test)\.[jt]s/i.test(ctx.pathBlob), pathEvidence(ctx, /(^|\/)(e2e|tests?)\/[^/]+\.(spec|test)\.[jt]s/i), 'Add at least one browser test for the core signup or happy path.'),
      item('page-actions-found', 'Real browser actions found', /page\.goto|page\.click|page\.getByRole|expect\(page/i.test(ctx.contentBlob), fileEvidence(ctx, /page\.goto|page\.click|page\.getByRole|expect\(page/i), 'Use real browser actions and visible assertions in Playwright tests.'),
      manualItem('production-like-test-env-checked', 'Production-like test env checked', 'Confirm test env variables, seed data, and CI browser dependencies are ready.')
    ]
  });
}

function analyzeSentryErrorHandling(ctx: StackContext): StackWiringProviderSummary {
  const base = analyzeSentryMonitoring(ctx);
  return summarize({
    ...base,
    key: 'sentry-error-handling',
    area: 'errorHandling',
    areaLabel: 'Error Handling',
    promptSubject: 'Sentry error handling',
    items: [
      ...base.items.filter((entry) => entry.id !== 'release-config-found'),
      item('user-facing-fallback-found', 'User-facing error fallback found', /global-error|errorboundary|fallback|try again|toast/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /global-error|errorboundary|fallback|try again|toast/i), 'Add a user-facing fallback for production errors.'),
      manualItem('alert-routing-checked', 'Production alert routing checked', 'Confirm alert routing and issue ownership in Sentry.')
    ]
  });
}

function analyzePostHogErrorHandling(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'posthog-error-handling',
    provider: 'posthog',
    providerLabel: 'PostHog',
    area: 'errorHandling',
    areaLabel: 'Error Handling',
    promptSubject: 'PostHog error events',
    items: [
      item('package-installed', 'PostHog package installed', hasPackage(ctx, [/^posthog-js$/, /^posthog-node$/]), packageEvidence(ctx, [/^posthog-js$/, /^posthog-node$/]), 'Install PostHog before using it for error or recovery events.'),
      item('env-names-documented', 'PostHog env names documented', /posthog_key|next_public_posthog_key/i.test(ctx.contentBlob), envEvidence(ctx, [/posthog_key/i, /next_public_posthog_key/i]), 'Document PostHog project env names.'),
      item('error-event-capture-found', 'Error or recovery event capture found', /posthog\.capture\s*\([^)]*(error|exception|failed|recovery|retry)/i.test(ctx.contentBlob), fileEvidence(ctx, /posthog\.capture\s*\([^)]*(error|exception|failed|recovery|retry)/i), 'Capture meaningful error or recovery events for product analytics.'),
      item('fallback-state-found', 'Fallback state found', /errorboundary|global-error|fallback|try again|retry/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /errorboundary|global-error|fallback|try again|retry/i), 'Add fallback states that users can recover from.'),
      manualItem('privacy-settings-checked', 'Error analytics privacy checked', 'Confirm error analytics avoid sensitive payloads and follow the product privacy policy.')
    ]
  });
}

function analyzeRateLimitSecurity(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'rate-limit-security',
    provider: 'rate-limit',
    providerLabel: 'Rate limiting',
    area: 'security',
    areaLabel: 'Security',
    promptSubject: 'rate limiting',
    items: [
      item('package-installed', 'Rate limit package installed', hasPackage(ctx, [/@upstash\/ratelimit/, /express-rate-limit/, /rate-limiter-flexible/, /@fastify\/rate-limit/]) || Boolean(ctx.scan.stackSignals.hasRateLimit), packageEvidence(ctx, [/@upstash\/ratelimit/, /express-rate-limit/, /rate-limiter-flexible/, /@fastify\/rate-limit/]), 'Install a rate-limit library appropriate for this backend.'),
      item('env-names-documented', 'Rate limit backing store env documented', /upstash_redis_rest_url|redis_url|rate_limit/i.test(ctx.contentBlob), envEvidence(ctx, [/upstash_redis_rest_url/i, /upstash_redis_rest_token/i, /redis_url/i]), 'Document Redis or provider env names used by rate limiting.'),
      item('guard-code-found', 'Rate limit guard code found', /ratelimit|rateLimit|Too many requests|429/i.test(ctx.contentBlob), fileEvidence(ctx, /ratelimit|rateLimit|Too many requests|429/i), 'Add a rate-limit guard to expensive or abusive API routes.'),
      item('api-route-coverage-found', 'Protected API route found', /api\/|route\.[jt]s/i.test(ctx.pathBlob) && /ratelimit|rateLimit|429/i.test(ctx.contentBlob), pathEvidence(ctx, /api\/|route\.[jt]s/i), 'Apply rate limits to public mutation, auth, AI, or checkout endpoints.'),
      manualItem('production-thresholds-checked', 'Production thresholds checked', 'Confirm limits, burst behavior, and allowlists match real production traffic.')
    ]
  });
}

function analyzeBotProtectionSecurity(ctx: StackContext): StackWiringProviderSummary {
  return summarize({
    key: 'bot-protection-security',
    provider: 'bot-protection',
    providerLabel: 'Bot protection',
    area: 'security',
    areaLabel: 'Security',
    promptSubject: 'bot protection',
    items: [
      item('package-or-widget-found', 'Bot protection package or widget found', hasPackage(ctx, [/turnstile|recaptcha|hcaptcha/]) || /turnstile|recaptcha|hcaptcha|cf-turnstile/i.test(ctx.contentBlob), packageEvidence(ctx, [/turnstile|recaptcha|hcaptcha/]).concat(fileEvidence(ctx, /turnstile|recaptcha|hcaptcha|cf-turnstile/i)), 'Add Turnstile, reCAPTCHA, hCaptcha, or an equivalent bot check for exposed forms.'),
      item('env-names-documented', 'Bot protection env names documented', /turnstile.*(site|secret)|recaptcha.*(site|secret)|hcaptcha.*(site|secret)/i.test(ctx.contentBlob), envEvidence(ctx, [/turnstile/i, /recaptcha/i, /hcaptcha/i]), 'Document site key and secret key env names.'),
      item('server-verification-found', 'Server-side bot verification found', /siteverify|turnstile.*verify|recaptcha.*verify|hcaptcha.*verify/i.test(ctx.contentBlob), fileEvidence(ctx, /siteverify|turnstile.*verify|recaptcha.*verify|hcaptcha.*verify/i), 'Verify bot tokens server-side before accepting form or signup requests.'),
      manualItem('production-challenge-checked', 'Production challenge settings checked', 'Confirm allowed domains, challenge mode, and privacy settings in the bot-protection provider.')
    ]
  });
}

function analyzeSecretsHygiene(ctx: StackContext): StackWiringProviderSummary {
  const unsafePublicSecret = ctx.files.filter((file) =>
    isClientExecutedPath(file.normalizedPath) &&
    /(secret_key|api_secret|private_key|service_role|webhook_secret|password)/i.test(file.content)
  );
  return summarize({
    key: 'secrets-hygiene-security',
    provider: 'secrets-hygiene',
    providerLabel: 'Secrets hygiene',
    area: 'security',
    areaLabel: 'Security',
    promptSubject: 'secrets hygiene',
    items: [
      item('env-example-found', 'Env example or docs found', Boolean(ctx.scan.stackSignals.hasEnvExample) || /\.env\.example|env\.example|environment variables/i.test(ctx.pathBlob + '\n' + ctx.contentBlob), pathEvidence(ctx, /\.env\.example|env\.example/i), 'Add an env example or setup docs with variable names only.'),
      item('secret-files-ignored', 'Secret files detected as private', Array.isArray(ctx.scan.secretsFound) && ctx.scan.secretsFound.length > 0, ctx.scan.secretsFound.slice(0, 4).map((path) => `secret file: ${path}`), 'Keep real .env files private and out of copied prompts or docs.'),
      item('frontend-secrets-clean', 'No obvious frontend secret exposure found', unsafePublicSecret.length === 0, unsafePublicSecret.slice(0, 4).map((file) => `unsafe reference: ${file.path}`), 'Move secret values and private keys out of frontend/client-executed files.'),
      item('gitignore-env-found', 'Env files ignored by git', /\.gitignore/i.test(ctx.pathBlob) && /\.env/i.test(ctx.contentBlob), pathEvidence(ctx, /\.gitignore/i), 'Ensure .gitignore excludes real .env files while keeping .env.example committed.'),
      manualItem('production-secret-rotation-checked', 'Production secret rotation checked', 'Confirm production secrets can be rotated and revoked in provider dashboards.')
    ]
  });
}

function databaseSummary(
  ctx: StackContext,
  spec: {
    key: StackWiringKey;
    provider: StackWiringProviderSummary['provider'];
    providerLabel: string;
    promptSubject: string;
    packagePatterns: RegExp[];
    envPatterns: RegExp[];
    usagePatterns: RegExp[];
    manualLabel: string;
    manualHint: string;
  }
): StackWiringProviderSummary {
  const usagePattern = new RegExp(spec.usagePatterns.map((pattern) => pattern.source).join('|'), 'i');
  const indexOrPerformancePattern = /create\s+(unique\s+)?index|\bindex\s*:\s*true|@@index|\.index\s*\(|\bindexes\b|\bexplain\s*\(|connection\s*pool|pooling|pgbouncer/i;
  return summarize({
    key: spec.key,
    provider: spec.provider,
    providerLabel: spec.providerLabel,
    area: 'database',
    areaLabel: 'Database',
    promptSubject: spec.promptSubject,
    items: [
      item('package-installed', `${spec.providerLabel} package installed`, hasPackage(ctx, spec.packagePatterns), packageEvidence(ctx, spec.packagePatterns), `Install the ${spec.providerLabel} package or SDK for this app.`),
      item('env-names-documented', `${spec.providerLabel} env names documented`, spec.envPatterns.some((pattern) => pattern.test(ctx.contentBlob)), envEvidence(ctx, spec.envPatterns), `Document ${spec.providerLabel} connection env names in an env example or setup docs.`),
      item('client-or-connection-found', `${spec.providerLabel} connection code found`, usagePattern.test(ctx.contentBlob), fileEvidence(ctx, usagePattern), `Add ${spec.providerLabel} connection code in a server-safe helper.`),
      item('query-usage-found', 'Database query usage found', /select\s*\(|insert\s*\(|update\s*\(|delete\s*\(|findOne|findMany|collection\s*\(|execute\s*\(|query\s*\(|sql`/i.test(ctx.contentBlob), fileEvidence(ctx, /select\s*\(|insert\s*\(|update\s*\(|delete\s*\(|findOne|findMany|collection\s*\(|execute\s*\(|query\s*\(|sql`/i), 'Use the database connection for real reads or writes.'),
      item('schema-or-model-found', 'Schema, model, or migration found', /schema|migration|model|create\s+table|mongoose\.schema|drizzle|prisma/i.test(ctx.contentBlob + '\n' + ctx.pathBlob), fileEvidence(ctx, /schema|migration|model|create\s+table|mongoose\.schema|drizzle|prisma/i), 'Keep schema, models, or migrations reproducible in the repo.'),
      item('index-or-performance-evidence', 'Index or performance evidence found', indexOrPerformancePattern.test(ctx.contentBlob), fileEvidence(ctx, indexOrPerformancePattern), 'Add repo-visible indexes, query plans, connection pooling, or equivalent performance evidence for production database access.'),
      manualItem('production-dashboard-checked', spec.manualLabel, spec.manualHint)
    ]
  });
}

function deploymentSummary(
  ctx: StackContext,
  spec: {
    key: StackWiringKey;
    provider: StackWiringProviderSummary['provider'];
    providerLabel: string;
    promptSubject: string;
    packagePatterns: RegExp[];
    configPatterns: RegExp[];
    envPatterns: RegExp[];
    manualLabel: string;
    manualHint: string;
  }
): StackWiringProviderSummary {
  const configPattern = new RegExp(spec.configPatterns.map((pattern) => pattern.source).join('|'), 'i');
  return summarize({
    key: spec.key,
    provider: spec.provider,
    providerLabel: spec.providerLabel,
    area: 'deployment',
    areaLabel: 'Deployment',
    promptSubject: spec.promptSubject,
    items: [
      item('package-or-config-found', `${spec.providerLabel} package or config found`, hasPackage(ctx, spec.packagePatterns) || configPattern.test(ctx.pathBlob), packageEvidence(ctx, spec.packagePatterns).concat(pathEvidence(ctx, configPattern)), `Add ${spec.providerLabel} config when this project needs provider-specific deployment behavior.`),
      item('build-script-found', 'Production build script found', /"build"\s*:\s*"[^"]+"/i.test(ctx.contentBlob), fileEvidence(ctx, /"build"\s*:\s*"[^"]+"/i), 'Add a package.json build script for production deploys.'),
      item('env-names-documented', 'Deployment env names documented', spec.envPatterns.some((pattern) => pattern.test(ctx.contentBlob)) || /\.env\.example|environment variables/i.test(ctx.pathBlob + '\n' + ctx.contentBlob), envEvidence(ctx, spec.envPatterns).concat(pathEvidence(ctx, /\.env\.example/i)), 'Document production env variable names needed by deployment.'),
      item('ci-or-deploy-doc-found', 'CI or deploy docs found', /\.github\/workflows|deploy|deployment|preview/i.test(ctx.pathBlob + '\n' + ctx.contentBlob), pathEvidence(ctx, /\.github\/workflows/i).concat(fileEvidence(ctx, /deploy|deployment|preview/i)), 'Document or automate deployment and preview checks.'),
      manualItem('production-dashboard-checked', spec.manualLabel, spec.manualHint)
    ]
  });
}

function buildContext(scan: ScanResult): StackContext {
  const files = visibleFiles(scan);
  return {
    scan,
    files,
    deps: scan.packageDeps.map((dep) => dep.toLowerCase()),
    pathBlob: `${scan.fileTree}\n${scan.files.map((file) => file.path).join('\n')}`.replace(/\\/g, '/').toLowerCase(),
    contentBlob: files.map((file) => file.lowerContent).join('\n')
  };
}

function visibleFiles(scan: ScanResult): VisibleFile[] {
  return scan.files
    .filter((file: ScannedFile) => !file.isSecret && typeof file.content === 'string')
    .map((file) => ({
      path: file.path.replace(/\\/g, '/'),
      normalizedPath: file.path.replace(/\\/g, '/').toLowerCase(),
      content: file.content as string,
      lowerContent: (file.content as string).toLowerCase()
    }));
}

function summarize(summary: Omit<StackWiringProviderSummary, 'passedCount' | 'totalCount' | 'readinessPercent'>): StackWiringProviderSummary {
  const repoItems = summary.items.filter((entry) => entry.status !== 'manual');
  const passedCount = repoItems.filter((entry) => entry.status === 'passed').length;
  const totalCount = repoItems.length;
  return {
    ...summary,
    passedCount,
    totalCount,
    readinessPercent: Math.round((passedCount / Math.max(totalCount, 1)) * 100)
  };
}

function item(id: string, label: string, passed: boolean, evidence: string[], promptHint: string): StackWiringItem {
  return {
    id,
    label,
    status: passed ? 'passed' : 'missing',
    evidence,
    promptHint
  };
}

function manualItem(id: string, label: string, promptHint: string): StackWiringItem {
  return {
    id,
    label,
    status: 'manual',
    evidence: [],
    promptHint
  };
}

function secretSafetyItem(ctx: StackContext, id: string, label: string, pattern: RegExp, promptHint: string): StackWiringItem {
  const exposed = ctx.files.filter((file) => isClientExecutedPath(file.normalizedPath) && pattern.test(file.content));
  return {
    id,
    label,
    status: exposed.length > 0 ? 'missing' : 'passed',
    evidence: exposed.slice(0, 4).map((file) => `unsafe reference: ${file.path}`),
    promptHint
  };
}

function hasPackage(ctx: StackContext, patterns: RegExp[]): boolean {
  return ctx.deps.some((dep) => patterns.some((pattern) => pattern.test(dep)));
}

function hasAllContent(ctx: StackContext, patterns: RegExp[]): boolean {
  return patterns.every((pattern) => pattern.test(ctx.contentBlob));
}

function packageEvidence(ctx: StackContext, patterns: RegExp[]): string[] {
  return ctx.deps
    .filter((dep) => patterns.some((pattern) => pattern.test(dep)))
    .slice(0, 4)
    .map((dep) => `package: ${dep}`);
}

function envEvidence(ctx: StackContext, patterns: RegExp[]): string[] {
  const evidence: string[] = [];
  for (const pattern of patterns) {
    if (pattern.test(ctx.contentBlob)) {
      evidence.push(`env: ${pattern.source.replace(/\\b|\(|\)|\?|\||\^|\$|_/g, ' ').trim().toUpperCase().replace(/\s+/g, '_')}`);
    }
  }
  return evidence.slice(0, 4);
}

function pathEvidence(ctx: StackContext, pattern: RegExp): string[] {
  return ctx.pathBlob
    .split(/\r?\n/)
    .filter((path) => pattern.test(path))
    .slice(0, 4)
    .map((path) => `file: ${path}`);
}

function fileEvidence(ctx: StackContext, pattern: RegExp): string[] {
  return ctx.files
    .filter((file) => pattern.test(file.path) || pattern.test(file.content))
    .slice(0, 4)
    .map((file) => `file: ${file.path}`);
}

function isClientExecutedPath(path: string): boolean {
  return /\.(tsx|jsx)$/.test(path) ||
    /(^|\/)(components|pages|app|client|frontend|web)\//.test(path) ||
    /\.client\.[jt]sx?$/.test(path);
}

function formatEvidence(evidence: string[]): string {
  return evidence.length > 0 ? ` (${evidence.slice(0, 3).join('; ')})` : '';
}

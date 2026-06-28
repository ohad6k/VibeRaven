import type {
  ContextualPrompt,
  ContextualPromptKind,
  StackAutomationAction,
  StackAutomationRecipe,
  StackAutomationSummary,
  StackWiringItem,
  StackWiringKey,
  StackWiringProviderSummary,
  StackWiringSummary
} from './types';
import type { SifgGraph, SifgLeak } from './sifgTypes';
import { mcpProviderIdForStackWiringKey } from './providerRegistry';
import { buildContextualPrompt, type ContextualPromptSection } from './promptRouting';

type PromptProfile = {
  inspect: string[];
  implement: string[];
  constraints: string[];
  verify: string[];
};

const GENERIC_PROMPT_PROFILE: PromptProfile = {
  inspect: [
    'Review the relevant routes, server code, client code, config files, package scripts, and env examples before editing.',
    'Identify existing conventions for file names, imports, validation, and error handling.'
  ],
  implement: [
    'Make the smallest repo-only changes needed for the missing checks.',
    'Keep changes aligned with the current framework and folder structure.'
  ],
  constraints: [
    'Do not call provider APIs, mutate external projects, or edit webview/dashboard state.',
    'Keep secrets in server-only code and documented env examples.'
  ],
  verify: [
    'Run the closest relevant build, test, lint, or typecheck command.',
    'Confirm repo evidence exists for each fixed item and list manual checks separately.'
  ]
};

const PROMPT_PROFILES: Partial<Record<StackWiringKey, PromptProfile>> = {
  'stripe-payments': {
    inspect: [
      'Inspect app/api, pages/api, server routes, checkout actions, webhook handlers, and .env.example before editing.',
      'Check how STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, price IDs, and success/cancel URLs are currently named.'
    ],
    implement: [
      'Add or tighten a server-side Stripe webhook route that verifies signatures with webhooks.constructEvent before processing events.',
      'Document required Stripe env names and keep checkout/session creation on the server.'
    ],
    constraints: [
      'Do not create products, prices, customers, or webhooks through the Stripe API.',
      'Do not mark live-mode products, webhook endpoint registration, or dashboard settings complete from repo edits.'
    ],
    verify: [
      'Run the relevant route/unit tests or typecheck for payment code.',
      'Confirm webhook secret usage and server-only Stripe code are visible in repo evidence.'
    ]
  },
  'clerk-auth': {
    inspect: [
      'Inspect middleware, protected routes, layout providers, server actions, and auth-related env examples.',
      'Check current Clerk package usage, publishable key names, secret key names, and redirect handling.'
    ],
    implement: [
      'Add route protection, auth provider setup, and server-side user checks where missing.',
      'Document NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, and required redirect URLs in repo examples.'
    ],
    constraints: [
      'Do not configure Clerk dashboard applications, domains, or production instances.',
      'Do not expose secret keys to client bundles.'
    ],
    verify: [
      'Run auth-related tests or typecheck.',
      'Confirm protected-route and env documentation evidence exists in the repo.'
    ]
  },
  'supabase-database': {
    inspect: [
      'Inspect Supabase client/server helpers, migrations, SQL policies, schema files, and env examples.',
      'Check whether service-role usage is isolated to server-only paths.'
    ],
    implement: [
      'Add missing schema, migration, RLS policy, and typed client evidence where repo checks require it.',
      'Document SUPABASE_URL, anon key, and server-only service role env names without committing secrets.'
    ],
    constraints: [
      'Do not call Supabase APIs, create remote projects, run dashboard changes, or apply migrations remotely.',
      'Do not place service-role keys in client-accessible code.'
    ],
    verify: [
      'Run database-related tests, migration checks, or typecheck available in the repo.',
      'Confirm RLS and migration evidence is repo-visible and dashboard checks remain manual.'
    ]
  },
  'vercel-deployment': {
    inspect: [
      'Inspect vercel.json, package scripts, framework config, environment examples, and CI/deploy workflows.',
      'Check build command, output settings, redirects, rewrites, and serverless/edge function usage.'
    ],
    implement: [
      'Add repo deployment configuration, build scripts, env documentation, or route settings needed for missing checks.',
      'Keep deployment assumptions encoded in config files rather than external dashboard state.'
    ],
    constraints: [
      'Do not deploy, promote, link, or mutate Vercel projects.',
      'Do not claim production domains, env vars, or dashboard settings are configured from repo edits.'
    ],
    verify: [
      'Run the project build or compile command.',
      'Confirm deployment config evidence exists and list dashboard checks as manual.'
    ]
  },
  'sentry-monitoring': {
    inspect: [
      'Inspect Sentry initialization, framework instrumentation files, error boundaries, source map config, and env examples.',
      'Check client/server DSN separation and release/environment tagging conventions.'
    ],
    implement: [
      'Add missing Sentry initialization, error capture, tracing, source map, or env documentation evidence.',
      'Ensure captured errors include useful context without leaking secrets or PII.'
    ],
    constraints: [
      'Do not create Sentry projects, upload releases, or change dashboard alert rules.',
      'Do not hardcode DSNs or auth tokens outside env examples.'
    ],
    verify: [
      'Run monitoring-related tests, build, or typecheck.',
      'Confirm instrumentation and env evidence are present while dashboard checks remain manual.'
    ]
  },
  'posthog-monitoring': {
    inspect: [
      'Inspect PostHog initialization, analytics providers, event capture calls, consent handling, and env examples.',
      'Check whether user identity, feature flags, and client/server keys are separated correctly.'
    ],
    implement: [
      'Add missing PostHog setup, event capture, opt-in/consent, feature flag, or env documentation evidence.',
      'Keep analytics initialization resilient around loading, routing, and disabled-key states.'
    ],
    constraints: [
      'Do not create PostHog projects, change dashboard events, or mutate feature flags remotely.',
      'Do not capture secrets, raw tokens, or unnecessary PII.'
    ],
    verify: [
      'Run analytics-related tests, build, or typecheck.',
      'Confirm repo evidence for initialization, capture, and privacy controls.'
    ]
  },
  'react-frontend': {
    inspect: [
      'Inspect components, routes, state/data-loading paths, forms, styling, and existing design-system patterns.',
      'Check current loading, error, empty, and responsive states before editing.'
    ],
    implement: [
      'Add missing loading states, error states, empty states, accessibility attributes, and responsive layout behavior.',
      'Use existing component patterns and keep visual changes focused on the listed repo fixes.'
    ],
    constraints: [
      'Do not edit external design tools, dashboards, or webview automation state.',
      'Do not replace the app framework or introduce unrelated UI rewrites.'
    ],
    verify: [
      'Run frontend tests, typecheck, or build.',
      'Confirm loading, error, and responsive behavior have repo-visible evidence.'
    ]
  },
  'node-backend': {
    inspect: [
      'Inspect API routes, controllers, services, middleware, validation, logging, and env examples.',
      'Check current error handling, request validation, authentication boundaries, and server startup scripts.'
    ],
    implement: [
      'Add missing validation, error handling, health checks, logging, or server-only env documentation evidence.',
      'Keep backend changes small and aligned with existing route/service patterns.'
    ],
    constraints: [
      'Do not call production provider APIs or mutate external infrastructure.',
      'Do not expose secrets in logs, client responses, or committed examples.'
    ],
    verify: [
      'Run backend tests, typecheck, or compile.',
      'Confirm fixed checks have repo evidence and operational dashboard checks stay manual.'
    ]
  }
};

export function buildStackAutomationSummary(
  stackWiring: StackWiringSummary,
  options: { staticInfrastructureFlowGraph?: SifgGraph } = {}
): StackAutomationSummary {
  const items = stackWiring.items.map((stack) => buildStackAutomationRecipe(stack, sifgLeaksForStack(stack, options.staticInfrastructureFlowGraph)));
  const byKey = items.reduce<StackAutomationSummary['byKey']>((acc, recipe) => {
    acc[recipe.key] = recipe;
    return acc;
  }, {});
  return { items, byKey };
}

export function buildStackAutomationContext(summary: StackAutomationSummary): string {
  const lines = ['## STACK AUTOMATION'];
  for (const recipe of summary.items) {
    lines.push(`${recipe.key}: ${recipe.automationLevel}; repo fixes=${recipe.repoFixes.length}; manual checks=${recipe.manualChecks.length}; mcp=${recipe.mcpProvider ?? 'none'}`);
    for (const fix of recipe.repoFixes.slice(0, 6)) {
      lines.push(`${recipe.key} fix: ${fix.label} - ${fix.promptHint}`);
    }
  }
  return lines.join('\n');
}

function buildStackAutomationRecipe(stack: StackWiringProviderSummary, sifgLeaks: SifgLeak[] = []): StackAutomationRecipe {
  const confirmedChecks = stack.items.filter((item) => item.status === 'passed').map(toAction);
  const repoFixes = stack.items.filter((item) => item.status === 'missing').map(toAction);
  const manualChecks = stack.items.filter((item) => item.status === 'manual').map(toAction);
  const mcpProvider = mcpProviderIdForStackWiringKey(stack.key);
  const hasRepoFixContext = repoFixes.length > 0 || sifgLeaks.length > 0;
  const automationLevel = !hasRepoFixContext && manualChecks.length > 0 ? 'manual-only' : mcpProvider ? 'repo-prompt-plus-mcp' : 'repo-prompt';
  const promptRoutes = buildPromptRoutes(stack, repoFixes, manualChecks, mcpProvider, automationLevel, sifgLeaks);
  return {
    key: stack.key,
    provider: stack.provider,
    providerLabel: stack.providerLabel,
    area: stack.area,
    promptSubject: stack.promptSubject,
    readinessPercent: stack.readinessPercent,
    repoFixes,
    manualChecks,
    confirmedChecks,
    mcpProvider,
    repoPrompt: promptRoutes['repo-fix']?.body ?? '',
    verificationPrompt: verificationPromptForRecipe(promptRoutes, automationLevel, manualChecks, sifgLeaks),
    automationLevel,
    promptRoutes
  };
}

function toAction(item: StackWiringItem): StackAutomationAction {
  return {
    id: item.id,
    label: item.label,
    status: item.status,
    promptHint: item.promptHint,
    evidence: item.evidence
  };
}

function buildPromptRoutes(
  stack: StackWiringProviderSummary,
  repoFixes: StackAutomationAction[],
  manualChecks: StackAutomationAction[],
  mcpProvider: string | null,
  automationLevel: StackAutomationRecipe['automationLevel'],
  sifgLeaks: SifgLeak[]
): Partial<Record<ContextualPromptKind, ContextualPrompt>> {
  return {
    'repo-fix': buildContextualPrompt({
      kind: 'repo-fix',
      promptSubject: stack.promptSubject,
      providerLabel: stack.providerLabel,
      passedCount: stack.passedCount,
      totalCount: stack.totalCount,
      readinessPercent: stack.readinessPercent,
      repoFixes,
      manualChecks,
      sifgLeaks,
      sections: buildRepoPromptSections(stack),
      afterEditing: [
        'Run the relevant build/test/typecheck command.',
        'Summarize changed files, verified commands, and manual checks still needed.'
      ],
      emptyBody: automationLevel === 'manual-only'
    }),
    'manual-checklist': buildContextualPrompt({
      kind: 'manual-checklist',
      promptSubject: stack.promptSubject,
      providerLabel: stack.providerLabel,
      manualChecks
    }),
    'mcp-verification': buildContextualPrompt({
      kind: 'mcp-verification',
      promptSubject: stack.promptSubject,
      providerLabel: stack.providerLabel,
      mcpProvider
    })
  };
}

function sifgLeaksForStack(stack: StackWiringProviderSummary, graph: SifgGraph | undefined): SifgLeak[] {
  if (!graph) {
    return [];
  }
  return graph.leaks.filter((leak) => leak.providerKey === stack.key);
}

function verificationPromptForRecipe(
  promptRoutes: Partial<Record<ContextualPromptKind, ContextualPrompt>>,
  automationLevel: StackAutomationRecipe['automationLevel'],
  manualChecks: StackAutomationAction[],
  sifgLeaks: SifgLeak[]
): string {
  const manualPrompt = promptRoutes['manual-checklist']?.body ?? '';
  const mcpPrompt = promptRoutes['mcp-verification']?.body ?? '';
  if (automationLevel === 'manual-only') {
    return manualPrompt || mcpPrompt;
  }
  if (sifgLeaks.length > 0 && manualChecks.length > 0) {
    return [manualPrompt, mcpPrompt].filter(Boolean).join('\n\n');
  }
  return mcpPrompt;
}

function buildRepoPromptSections(stack: StackWiringProviderSummary): ContextualPromptSection[] {
  const profile = PROMPT_PROFILES[stack.key] ?? GENERIC_PROMPT_PROFILE;
  return [
    { heading: 'Inspect first:', lines: profile.inspect },
    { heading: 'Implement:', lines: profile.implement },
    { heading: 'Provider constraints:', lines: profile.constraints },
    { heading: 'Verification:', lines: profile.verify }
  ];
}

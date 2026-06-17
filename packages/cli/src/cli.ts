import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { randomBytes, timingSafeEqual } from 'node:crypto';

import { renderLocalUiHtml } from './local-ui/staticApp';
import { VERSION } from './version';

type GateStatus = 'clear' | 'not_clear' | 'not_checked';
type GapSeverity = 'critical' | 'warning' | 'info';

type LocalGap = {
  id: string;
  title: string;
  detail: string;
  severity: GapSeverity;
  category: string;
  primaryMapCategory: string;
};

type LocalArtifact = {
  version: 1;
  scannedAt: string;
  workspacePath: string;
  score: number;
  scoreLabel: string;
  summary: string;
  archetype: string;
  gaps: LocalGap[];
  missionGraph: { areas: Array<{ key: string; label: string; readinessPercent: number }> };
  stackWiring: { detected: string[] };
  providerRegistry: { providers: Array<{ provider: string; label: string }> };
  verificationSummary: { status: Exclude<GateStatus, 'not_checked'>; checkedAt: string };
  productionCorePercent: number;
};

type PublicProviderState = 'not_detected' | 'repo_evidence_found' | 'needs_repo_fix' | 'connect_live' | 'blocked';
type PublicPathState = 'not_checked' | 'ready' | 'needs_fix' | 'needs_connect' | 'blocked';
type PublicProviderSeed = {
  id: string;
  label: string;
  area: string;
  stateWhenDetected: PublicProviderState;
  aliases: string[];
  iconHtml: string;
  rows: Array<{
    id: string;
    title: string;
    whyItMatters: string;
    whatToChange: string;
    verifyWith: string;
    keywords: string[];
  }>;
};

function brandSvg(title: string, fill: string, path: string): string {
  return `<svg viewBox="0 0 24 24" role="img" aria-label="${title} logo" fill="${fill}"><title>${title}</title><path d="${path}"/></svg>`;
}

const PUBLIC_PROVIDER_CATALOG: PublicProviderSeed[] = [
  {
    id: 'supabase',
    label: 'Supabase',
    area: 'database',
    stateWhenDetected: 'needs_repo_fix',
    aliases: ['supabase', 'rls', 'row level security', 'row-level security', 'migration', 'database'],
    iconHtml: brandSvg('Supabase', '#3FCF8E', 'M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.014.985 1.259 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.642z'),
    rows: [
      { id: 'schema-migrations', title: 'Schema and migrations', whyItMatters: 'Production data shape needs repo-owned evidence before real users write to it.', whatToChange: 'Add or update migration files that prove the production schema and indexes.', verifyWith: 'Run npx -y viberaven --verify.', keywords: ['schema', 'migration', 'database'] },
      { id: 'rls-policies', title: 'RLS policies', whyItMatters: 'User data must be protected by row ownership rules before launch.', whatToChange: 'Add policy SQL that enables RLS and restricts reads and writes to the authenticated owner.', verifyWith: 'Run npx -y viberaven --verify.', keywords: ['rls', 'policy', 'row'] },
      { id: 'auth-callbacks', title: 'Auth callbacks', whyItMatters: 'Authentication breaks when production callback URLs are missing or local-only.', whatToChange: 'Document production site URL and redirect URL evidence without secrets.', verifyWith: 'Run npx -y viberaven --verify.', keywords: ['auth', 'callback', 'redirect'] },
      { id: 'production-env', title: 'Production env', whyItMatters: 'Production database URLs and keys must be explicit and safely scoped.', whatToChange: 'Add safe env placeholders for URL, anon key, and server-only service-role boundaries.', verifyWith: 'Run npx -y viberaven --verify.', keywords: ['env', 'secret', 'url'] },
    ],
  },
  {
    id: 'vercel',
    label: 'Vercel',
    area: 'deployment',
    stateWhenDetected: 'repo_evidence_found',
    aliases: ['vercel', 'deployment', 'deploy', 'hosting', 'preview'],
    iconHtml: brandSvg('Vercel', '#000000', 'm12 1.608 12 20.784H0Z'),
    rows: [
      { id: 'preview-gate', title: 'Preview deployment gate', whyItMatters: 'Every production change should have a reproducible preview path.', whatToChange: 'Add repo evidence for preview deploys, build command, and required checks.', verifyWith: 'Run npx -y viberaven --verify.', keywords: ['preview', 'deploy', 'ci'] },
      { id: 'production-env', title: 'Production env', whyItMatters: 'Production runtime variables must be named without leaking values.', whatToChange: 'Document required production env names in repo evidence.', verifyWith: 'Run npx -y viberaven --verify.', keywords: ['env', 'secret'] },
      { id: 'domain-routing', title: 'Domain and routing', whyItMatters: 'The launch URL needs canonical HTTPS and predictable routes.', whatToChange: 'Add evidence for the production domain, redirects, and framework routing assumptions.', verifyWith: 'Run npx -y viberaven --verify.', keywords: ['domain', 'route'] },
    ],
  },
  {
    id: 'stripe',
    label: 'Stripe',
    area: 'payments',
    stateWhenDetected: 'connect_live',
    aliases: ['stripe', 'payment', 'checkout', 'subscription', 'webhook'],
    iconHtml: brandSvg('Stripe', '#635BFF', 'M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z'),
    rows: [
      { id: 'checkout-route', title: 'Checkout route', whyItMatters: 'Money movement needs a trusted server-side path.', whatToChange: 'Add checkout or subscription route evidence with stable price env names.', verifyWith: 'Run npx -y viberaven --verify.', keywords: ['checkout', 'price'] },
      { id: 'webhook-authenticity', title: 'Webhook authenticity', whyItMatters: 'Payment state must be reconciled from trusted server events.', whatToChange: 'Add webhook route evidence with authenticity checks and idempotency.', verifyWith: 'Run npx -y viberaven --verify.', keywords: ['webhook', 'authenticity'] },
      { id: 'customer-portal', title: 'Customer portal', whyItMatters: 'Users need a way to manage subscription state without support.', whatToChange: 'Add repo evidence for customer portal or account payment routes.', verifyWith: 'Run npx -y viberaven --verify.', keywords: ['portal', 'customer'] },
    ],
  },
  {
    id: 'github',
    label: 'GitHub',
    area: 'testing',
    stateWhenDetected: 'repo_evidence_found',
    aliases: ['github', 'actions', 'workflow', 'pull request', 'ci'],
    iconHtml: brandSvg('GitHub', '#181717', 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'),
    rows: [
      { id: 'required-checks', title: 'Required checks', whyItMatters: 'Unsafe changes should not merge without automated proof.', whatToChange: 'Add workflow evidence for tests, typecheck, build, or public export verification.', verifyWith: 'Run npx -y viberaven --verify.', keywords: ['actions', 'workflow', 'ci'] },
      { id: 'branch-protection', title: 'Branch protection', whyItMatters: 'CI is advisory unless merge rules require it.', whatToChange: 'Document required checks or owner review expectations in repo evidence.', verifyWith: 'Run npx -y viberaven --verify.', keywords: ['branch', 'review'] },
    ],
  },
  {
    id: 'sentry',
    label: 'Sentry',
    area: 'monitoring',
    stateWhenDetected: 'blocked',
    aliases: ['sentry', 'error', 'monitoring', 'trace', 'dsn'],
    iconHtml: brandSvg('Sentry', '#362D59', 'M13.91 2.505c-.873-1.448-2.972-1.448-3.844 0L6.904 7.92a15.478 15.478 0 0 1 8.53 12.811h-2.221A13.301 13.301 0 0 0 5.784 9.814l-2.926 5.06a7.65 7.65 0 0 1 4.435 5.848H2.194a.365.365 0 0 1-.298-.534l1.413-2.402a5.16 5.16 0 0 0-1.614-.913L.296 19.275a2.182 2.182 0 0 0 .812 2.999 2.24 2.24 0 0 0 1.086.288h6.983a9.322 9.322 0 0 0-3.845-8.318l1.11-1.922a11.47 11.47 0 0 1 4.95 10.24h5.915a17.242 17.242 0 0 0-7.885-15.28l2.244-3.845a.37.37 0 0 1 .504-.13c.255.14 9.75 16.708 9.928 16.9a.365.365 0 0 1-.327.543h-2.287c.029.612.029 1.223 0 1.831h2.297a2.206 2.206 0 0 0 1.922-3.31z'),
    rows: [
      { id: 'runtime-capture', title: 'Runtime capture', whyItMatters: 'Production errors need a destination before users report them.', whatToChange: 'Add Sentry DSN env evidence and runtime initialization proof.', verifyWith: 'Run npx -y viberaven --verify.', keywords: ['dsn', 'error'] },
      { id: 'release-context', title: 'Release context', whyItMatters: 'Errors need commit and release metadata to be actionable.', whatToChange: 'Add release, environment, or source-map evidence.', verifyWith: 'Run npx -y viberaven --verify.', keywords: ['release', 'source map'] },
    ],
  },
  {
    id: 'clerk',
    label: 'Clerk',
    area: 'auth',
    stateWhenDetected: 'connect_live',
    aliases: ['clerk', 'auth', 'session', 'middleware'],
    iconHtml: brandSvg('Clerk', '#6C47FF', 'm21.47 20.829-2.881-2.881a.572.572 0 0 0-.7-.084 6.854 6.854 0 0 1-7.081 0 .576.576 0 0 0-.7.084l-2.881 2.881a.576.576 0 0 0-.103.69.57.57 0 0 0 .166.186 12 12 0 0 0 14.113 0 .58.58 0 0 0 .239-.423.576.576 0 0 0-.172-.453Zm.002-17.668-2.88 2.88a.569.569 0 0 1-.701.084A6.857 6.857 0 0 0 8.724 8.08a6.862 6.862 0 0 0-1.222 3.692 6.86 6.86 0 0 0 .978 3.764.573.573 0 0 1-.083.699l-2.881 2.88a.567.567 0 0 1-.864-.063A11.993 11.993 0 0 1 6.771 2.7a11.99 11.99 0 0 1 14.637-.405.566.566 0 0 1 .232.418.57.57 0 0 1-.168.448Zm-7.118 12.261a3.427 3.427 0 1 0 0-6.854 3.427 3.427 0 0 0 0 6.854Z'),
    rows: [
      { id: 'session-boundary', title: 'Session boundary', whyItMatters: 'Protected routes need server-side identity checks.', whatToChange: 'Add evidence for session middleware and protected API boundaries.', verifyWith: 'Run npx -y viberaven --verify.', keywords: ['session', 'middleware'] },
      { id: 'callback-urls', title: 'Callback URLs', whyItMatters: 'Auth flows fail when production redirects are missing.', whatToChange: 'Document production callback and redirect env names.', verifyWith: 'Run npx -y viberaven --verify.', keywords: ['callback', 'redirect'] },
    ],
  },
  {
    id: 'posthog',
    label: 'PostHog',
    area: 'analytics',
    stateWhenDetected: 'connect_live',
    aliases: ['posthog', 'analytics', 'event', 'funnel'],
    iconHtml: brandSvg('PostHog', '#000000', 'M9.854 14.5 5 9.647.854 5.5A.5.5 0 0 0 0 5.854V8.44a.5.5 0 0 0 .146.353L5 13.647l.147.146L9.854 18.5l.146.147v-.049c.065.03.134.049.207.049h2.586a.5.5 0 0 0 .353-.854L9.854 14.5zm0-5-4-4a.487.487 0 0 0-.409-.144.515.515 0 0 0-.356.21.493.493 0 0 0-.089.288V8.44a.5.5 0 0 0 .147.353l9 9a.5.5 0 0 0 .853-.354v-2.585a.5.5 0 0 0-.146-.354l-5-5zm1-4a.5.5 0 0 0-.854.354V8.44a.5.5 0 0 0 .147.353l4 4a.5.5 0 0 0 .853-.354V9.854a.5.5 0 0 0-.146-.354l-4-4zm12.647 11.515a3.863 3.863 0 0 1-2.232-1.1l-4.708-4.707a.5.5 0 0 0-.854.354v6.585a.5.5 0 0 0 .5.5H23.5a.5.5 0 0 0 .5-.5v-.6c0-.276-.225-.497-.499-.532zm-5.394.032a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6zM.854 15.5a.5.5 0 0 0-.854.354v2.293a.5.5 0 0 0 .5.5h2.293c.222 0 .39-.135.462-.309a.493.493 0 0 0-.109-.545L.854 15.5zM5 14.647.854 10.5a.5.5 0 0 0-.854.353v2.586a.5.5 0 0 0 .146.353L4.854 18.5l.146.147h2.793a.5.5 0 0 0 .353-.854L5 14.647z'),
    rows: [
      { id: 'event-taxonomy', title: 'Event taxonomy', whyItMatters: 'Analytics should answer launch questions, not just count views.', whatToChange: 'Add named events for account creation, activation, and conversion points.', verifyWith: 'Run npx -y viberaven --verify.', keywords: ['event', 'taxonomy'] },
      { id: 'privacy-boundary', title: 'Capture boundary', whyItMatters: 'Session capture can expose sensitive fields if unchecked.', whatToChange: 'Add masking, opt-out, or capture-boundary evidence.', verifyWith: 'Run npx -y viberaven --verify.', keywords: ['privacy', 'capture'] },
    ],
  },
];

function haystack(value: unknown): string {
  return JSON.stringify(value ?? {}).toLowerCase();
}

function gapMatchesProvider(gap: LocalArtifact['gaps'][number], provider: PublicProviderSeed): boolean {
  const text = [gap.id, gap.title, gap.detail, gap.category, gap.primaryMapCategory].join(' ').toLowerCase();
  return provider.aliases.some((alias) => text.includes(alias));
}

function artifactHasEvidenceForProvider(artifact: LocalArtifact | undefined, provider: PublicProviderSeed): boolean {
  if (!artifact) return false;
  const text = haystack({
    stackWiring: artifact.stackWiring,
    providerRegistry: artifact.providerRegistry,
    missionGraph: artifact.missionGraph,
  });
  return provider.aliases.some((alias) => text.includes(alias));
}

function gapForProvider(artifact: LocalArtifact | undefined, provider: PublicProviderSeed): LocalArtifact['gaps'][number] | undefined {
  return artifact?.gaps.find((gap) => gapMatchesProvider(gap, provider));
}

function pathState(providerState: PublicProviderState, rowId: string, focusedRowId: string | undefined): PublicPathState {
  if (focusedRowId === rowId) {
    if (providerState === 'blocked') return 'blocked';
    if (providerState === 'connect_live') return 'needs_connect';
    return 'needs_fix';
  }
  if (providerState === 'repo_evidence_found') return 'ready';
  return 'not_checked';
}

function rowForGap(provider: PublicProviderSeed, gap: LocalArtifact['gaps'][number] | undefined) {
  if (!gap) return provider.id === 'supabase' ? provider.rows[1] ?? provider.rows[0] : provider.rows[0];
  const text = [gap.id, gap.title, gap.detail, gap.category, gap.primaryMapCategory].join(' ').toLowerCase();
  const scored = provider.rows
    .map((row) => ({
      row,
      score: row.keywords.reduce((total, keyword) => (text.includes(keyword.toLowerCase()) ? total + keyword.length : total), 0),
    }))
    .sort((left, right) => right.score - left.score);
  return scored[0]?.score ? scored[0].row : provider.rows[0];
}

export interface PublicLocalUiServerHandle {
  url: string;
  origin: string;
  port: number;
  close: () => Promise<void>;
}

function send(res: ServerResponse, status: number, body: string, contentType: string): void {
  res.writeHead(status, {
    'content-type': contentType,
    'cache-control': 'no-store',
  });
  res.end(body);
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  send(res, status, JSON.stringify(body), 'application/json; charset=utf-8');
}

function workspaceFrom(input: string | undefined): string {
  return resolve(process.cwd(), input ?? '.');
}

async function readOptional(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return '';
  }
}

async function buildArtifact(workspacePath: string): Promise<LocalArtifact> {
  const packageJson = await readOptional(join(workspacePath, 'package.json'));
  const envExample = await readOptional(join(workspacePath, '.env.example'));
  const vercelJson = await readOptional(join(workspacePath, 'vercel.json'));
  const hasTests = /"test"\s*:|vitest|jest|playwright/i.test(packageJson);
  const hasDeploy = Boolean(vercelJson) || /vercel|netlify|render|railway/i.test(packageJson);
  const hasSupabase = existsSync(join(workspacePath, 'supabase')) || /supabase/i.test(packageJson);
  const gaps: LocalGap[] = [];

  if (!packageJson) {
    gaps.push({
      id: 'LOCAL-PACKAGE-001',
      title: 'Missing package manifest',
      detail: 'No package.json was found at the scan root.',
      severity: 'warning',
      category: 'appFlow',
      primaryMapCategory: 'appFlow',
    });
  }
  if (!envExample) {
    gaps.push({
      id: 'LOCAL-ENV-001',
      title: 'Missing env example',
      detail: 'Add .env.example with non-secret placeholders for required variables.',
      severity: 'warning',
      category: 'security',
      primaryMapCategory: 'security',
    });
  }
  if (!hasTests) {
    gaps.push({
      id: 'LOCAL-TEST-001',
      title: 'Missing test command evidence',
      detail: 'Add a package.json test script or test dependency so local verification has repo evidence.',
      severity: 'warning',
      category: 'testing',
      primaryMapCategory: 'testing',
    });
  }
  if (!hasDeploy) {
    gaps.push({
      id: 'LOCAL-DEPLOY-001',
      title: 'Missing deployment evidence',
      detail: 'Add deployment configuration or package metadata showing the intended production target.',
      severity: 'info',
      category: 'deployment',
      primaryMapCategory: 'deployment',
    });
  }
  if (hasSupabase && !existsSync(join(workspacePath, 'supabase', 'migrations'))) {
    gaps.push({
      id: 'LOCAL-SUPABASE-001',
      title: 'Missing Supabase migration evidence',
      detail: 'Supabase appears in the repo, but no supabase/migrations directory was found.',
      severity: 'warning',
      category: 'database',
      primaryMapCategory: 'database',
    });
  }

  const score = Math.max(0, 100 - gaps.length * 15);
  const status = gaps.some((gap) => gap.severity !== 'info') ? 'not_clear' : 'clear';
  return {
    version: 1,
    scannedAt: new Date().toISOString(),
    workspacePath,
    score,
    scoreLabel: status === 'clear' ? 'Local evidence clear' : 'Local evidence needs work',
    summary: status === 'clear' ? 'Local repo evidence is present for the checked surfaces.' : 'Local repo evidence gaps were found.',
    archetype: 'local-first-public-cli',
    gaps,
    missionGraph: {
      areas: [
        { key: 'appFlow', label: 'App flow', readinessPercent: packageJson ? 100 : 50 },
        { key: 'security', label: 'Security', readinessPercent: envExample ? 100 : 50 },
        { key: 'testing', label: 'Testing', readinessPercent: hasTests ? 100 : 50 },
        { key: 'deployment', label: 'Deployment', readinessPercent: hasDeploy ? 100 : 50 },
        {
          key: 'database',
          label: 'Database',
          readinessPercent: hasSupabase ? (existsSync(join(workspacePath, 'supabase', 'migrations')) ? 100 : 50) : 100,
        },
      ],
    },
    stackWiring: {
      detected: [packageJson && 'package.json', envExample && '.env.example', hasDeploy && 'deployment-config', hasSupabase && 'supabase'].filter(Boolean) as string[],
    },
    providerRegistry: {
      providers: [
        { provider: 'local-readiness', label: 'Local readiness' },
        { provider: 'vercel', label: 'Vercel' },
        { provider: 'supabase', label: 'Supabase' },
      ],
    },
    verificationSummary: { status, checkedAt: new Date().toISOString() },
    productionCorePercent: score,
  };
}

function gateResult(artifact: LocalArtifact) {
  return {
    gate: { status: artifact.verificationSummary.status, checkedAt: artifact.verificationSummary.checkedAt },
    summary: artifact.summary,
    gaps: artifact.gaps.map((gap) => ({ id: gap.id, title: gap.title, severity: gap.severity, status: 'open' })),
  };
}

function tasklist(artifact: LocalArtifact): string {
  const lines = ['# VibeRaven Local Tasklist', '', `Workspace: ${artifact.workspacePath}`, `Gate: ${artifact.verificationSummary.status}`, ''];
  if (artifact.gaps.length === 0) {
    lines.push('No local repo-evidence gaps found.');
  } else {
    for (const gap of artifact.gaps) {
      lines.push(`## ${gap.id}: ${gap.title}`, '', gap.detail, '', `Severity: ${gap.severity}`, '');
    }
  }
  return `${lines.join('\n').trim()}\n`;
}

async function writeArtifacts(workspacePath: string, artifact: LocalArtifact): Promise<void> {
  const out = join(workspacePath, '.viberaven');
  await mkdir(out, { recursive: true });
  await writeFile(join(out, 'last-scan.json'), `${JSON.stringify(artifact, null, 2)}\n`);
  await writeFile(join(out, 'gate-result.json'), `${JSON.stringify(gateResult(artifact), null, 2)}\n`);
  await writeFile(join(out, 'agent-tasklist.md'), tasklist(artifact));
  await writeFile(
    join(out, 'context-map.json'),
    `${JSON.stringify(
      {
        version: 1,
        generatedAt: artifact.scannedAt,
        workspacePath,
        gateStatus: artifact.verificationSummary.status,
        openGapIds: artifact.gaps.map((gap) => gap.id),
        detectedEvidence: artifact.stackWiring.detected,
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(join(out, 'mission-map.md'), `# VibeRaven Local Mission Map\n\n${artifact.missionGraph.areas.map((area) => `- ${area.label}: ${area.readinessPercent}%`).join('\n')}\n`);
  await writeFile(join(out, 'agent-summary.md'), `# VibeRaven Local Summary\n\n${artifact.summary}\n`);
  await writeFile(join(out, 'launch-playbook.md'), '# VibeRaven Local Launch Playbook\n\nRun viberaven --verify after each repo-code fix.\n');
}

async function runLocalScan(workspacePath: string): Promise<LocalArtifact> {
  const artifact = await buildArtifact(workspacePath);
  await writeArtifacts(workspacePath, artifact);
  return artifact;
}

async function loadArtifact(workspacePath: string): Promise<LocalArtifact | undefined> {
  try {
    return JSON.parse(await readFile(join(workspacePath, '.viberaven', 'last-scan.json'), 'utf8')) as LocalArtifact;
  } catch {
    return undefined;
  }
}

function localState(cwd: string, artifact?: LocalArtifact) {
  const firstGap = artifact?.gaps[0];
  const providers = PUBLIC_PROVIDER_CATALOG.map((seed) => {
    const assignedGap = gapForProvider(artifact, seed);
    const focusedGap = assignedGap ?? (seed.id === 'supabase' ? firstGap : undefined);
    const focusedRow = rowForGap(seed, focusedGap);
    const hasEvidence = artifactHasEvidenceForProvider(artifact, seed);
    const providerState: PublicProviderState = focusedGap
      ? seed.id === 'sentry'
        ? 'blocked'
        : 'needs_repo_fix'
      : hasEvidence
        ? 'repo_evidence_found'
        : artifact
          ? seed.stateWhenDetected
          : seed.stateWhenDetected;
    const launchPath = seed.rows.map((row) => ({
      id: row.id,
      title: row.title,
      whyItMatters: row.whyItMatters,
      whatToChange: row.whatToChange,
      verifyWith: row.verifyWith,
      keywords: row.keywords,
      area: seed.area,
      state: pathState(providerState, row.id, focusedGap ? focusedRow.id : undefined),
    }));
    const defaultNextFix =
      !artifact && seed.id === 'supabase'
        ? {
            gapId: 'LOCAL-SCAN-001',
            launchPathItemId: focusedRow.id,
            launchPathTitle: focusedRow.title,
            currentIssue: 'VibeRaven has not scanned this project yet.',
            whyItMatters: 'The launch console needs local repo evidence before it can focus the correct provider risk.',
            whatToChange: 'Run Local scan or Verify so VibeRaven can map package, env, deployment, test, and provider evidence.',
            verifyWith: 'Click Verify or run npx -y viberaven --verify.',
            prompt: [
              `Run VibeRaven local evidence discovery for ${basename(cwd) || cwd}.`,
              '',
              'Requirements:',
              '- Inspect package, env example, deployment, test, auth, data, payment, and monitoring evidence.',
              '- Identify the first repo-owned launch gap.',
              '- Keep all findings local and do not add secret values.',
              '- Re-run npx -y viberaven --verify after the first repo-code fix.',
              '',
              'Return the first concrete fix to make this app safer to ship.',
            ].join('\n'),
          }
        : undefined;
    if (defaultNextFix) {
      const focused = launchPath.find((item) => item.id === defaultNextFix.launchPathItemId);
      if (focused) focused.state = 'needs_fix';
    }
    const provider = {
      id: seed.id,
      label: seed.label,
      area: seed.area,
      state: providerState,
      iconHtml: seed.iconHtml,
      launchPath,
      nextFix: focusedGap
        ? {
            gapId: focusedGap.id,
            launchPathItemId: focusedRow.id,
            launchPathTitle: focusedRow.title,
            currentIssue: focusedGap.detail,
            whyItMatters: focusedRow.whyItMatters,
            whatToChange: focusedRow.whatToChange,
            verifyWith: focusedRow.verifyWith,
            prompt: [
              `Fix the ${seed.label} launch path for ${basename(cwd) || cwd}.`,
              '',
              `Current VibeRaven gap: ${focusedGap.id} - ${focusedGap.detail}`,
              '',
              'Requirements:',
              `- Address ${focusedRow.title}.`,
              `- ${focusedRow.whatToChange}`,
              '- Keep changes repo-only and do not add secret values.',
              '- Re-run npx -y viberaven --verify when done.',
              '',
              'Return a concise summary of what changed.',
            ].join('\n'),
          }
        : defaultNextFix,
    };
    return provider;
  });

  const selectedProvider =
    providers.find((provider) => provider.nextFix) ??
    providers.find((provider) => provider.id === 'supabase') ??
    providers[0];

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    project: {
      name: basename(cwd) || cwd,
      workspacePath: cwd,
      score: artifact?.score,
      scoreLabel: artifact?.scoreLabel,
      summary: artifact?.summary,
      gateStatus: artifact?.verificationSummary.status ?? 'not_checked',
    },
    providers,
    selectedProviderId: selectedProvider.id,
    command: 'npx -y viberaven',
  };
}

async function route(req: IncomingMessage, res: ServerResponse, options: { cwd: string; token: string }): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1');
  if (req.method === 'GET' && url.pathname === '/') {
    send(res, 200, renderLocalUiHtml(), 'text/html; charset=utf-8');
    return;
  }
  if (url.pathname.startsWith('/api/') && !isLocalApiRequestAuthorized(req, url, options.token)) {
    sendJson(res, 401, { error: 'Unauthorized local UI request.' });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/project') {
    sendJson(res, 200, localState(options.cwd, await loadArtifact(options.cwd)));
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/providers') {
    const state = localState(options.cwd, await loadArtifact(options.cwd));
    sendJson(res, 200, { providers: state.providers, selectedProviderId: state.selectedProviderId });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/tasklist') {
    let artifact = await loadArtifact(options.cwd);
    if (!artifact) {
      artifact = await runLocalScan(options.cwd);
    }
    send(res, 200, tasklist(artifact), 'text/plain; charset=utf-8');
    return;
  }
  if (req.method === 'POST' && (url.pathname === '/api/scan' || url.pathname === '/api/verify')) {
    const artifact = await runLocalScan(options.cwd);
    sendJson(res, 200, { ...localState(options.cwd, artifact), exitCode: artifact.verificationSummary.status === 'clear' ? 0 : 1 });
    return;
  }
  sendJson(res, 404, { error: 'Not found' });
}

function tokenMatches(actual: string | null, expected: string): boolean {
  if (!actual) return false;
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function isLocalHostHeader(host: string | undefined, port: number | undefined): boolean {
  if (!host || !port) return false;
  const allowed = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
  return allowed.has(host.toLowerCase());
}

function isLocalOrigin(origin: string | undefined, port: number | undefined): boolean {
  if (!origin || !port) return true;
  try {
    const parsed = new URL(origin);
    return (
      parsed.protocol === 'http:' &&
      (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') &&
      parsed.port === String(port)
    );
  } catch {
    return false;
  }
}

function isLocalApiRequestAuthorized(req: IncomingMessage, url: URL, token: string): boolean {
  const port = req.socket.localPort;
  if (!isLocalHostHeader(req.headers.host, port) || !isLocalOrigin(req.headers.origin, port)) {
    return false;
  }
  const provided = req.headers['x-viberaven-local-ui-token'];
  const headerToken = Array.isArray(provided) ? provided[0] : provided;
  return tokenMatches(headerToken ?? url.searchParams.get('vr_token'), token);
}

function printHelp(): void {
  console.log(`viberaven ${VERSION}

Usage:
  viberaven [path]
  viberaven ui [path] [--port <port>]
                       Local launch console
  viberaven scan [path]
  viberaven --agent-mode [path]
  viberaven --verify [path]
  viberaven --help
  viberaven --version

This npm package runs deterministic local repo-evidence checks and the localhost UI.
`);
}

function parsePort(argv: string[]): number {
  const index = argv.indexOf('--port');
  if (index === -1) return 4177;
  const parsed = Number.parseInt(argv[index + 1] ?? '', 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 4177;
}

function firstPathArg(argv: string[]): string | undefined {
  const commands = new Set(['ui', 'scan', 'version']);
  const flagsWithValues = new Set(['--port']);
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (commands.has(arg)) {
      continue;
    }
    if (flagsWithValues.has(arg)) {
      index += 1;
      continue;
    }
    if (arg.startsWith('--')) {
      continue;
    }
    return arg;
  }
  return undefined;
}

function listen(server: Server, port: number): Promise<number> {
  return new Promise((resolveListen, reject) => {
    const onError = (error: Error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      const address = server.address();
      resolveListen(typeof address === 'object' && address ? address.port : port);
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, '127.0.0.1');
  });
}

export async function startLocalUiServer(port: number, cwd: string): Promise<PublicLocalUiServerHandle> {
  const token = randomBytes(18).toString('base64url');
  const server = createServer((req, res) => {
    route(req, res, { cwd, token }).catch((error) => {
      sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
    });
  });
  const actualPort = await listen(server, port);
  const origin = `http://127.0.0.1:${actualPort}`;
  const url = `${origin}/?vr_token=${encodeURIComponent(token)}`;
  const close = async () => {
    await new Promise<void>((resolveClose, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolveClose();
      });
    });
  };
  return { url, origin, port: actualPort, close };
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    return 0;
  }
  if (argv.includes('--version') || argv.includes('-v') || argv[0] === 'version') {
    console.log(VERSION);
    return 0;
  }

  if (argv[0] === 'scan' || argv.includes('--agent-mode') || argv.includes('--verify')) {
    const workspace = workspaceFrom(firstPathArg(argv));
    const artifact = await runLocalScan(workspace);
    console.log(`VibeRaven local scan wrote ${join(workspace, '.viberaven')}`);
    if (argv.includes('--agent-mode')) {
      console.log(tasklist(artifact).trimEnd());
    }
    return argv.includes('--verify') && artifact.verificationSummary.status !== 'clear' ? 1 : 0;
  }

  if (argv[0] === 'ui' || argv.length === 0 || firstPathArg(argv)) {
    const pathArg = firstPathArg(argv);
    if (argv[0] !== 'ui' && pathArg && !existsSync(workspaceFrom(pathArg))) {
      console.error(`Unknown command or missing path: ${argv[0]}`);
      printHelp();
      return 1;
    }
    const handle = await startLocalUiServer(parsePort(argv), workspaceFrom(pathArg));
    console.log(`VibeRaven local UI: ${handle.url}`);
    return 0;
  }

  console.error(`Unknown command: ${argv[0]}`);
  printHelp();
  return 1;
}

if (require.main === module) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}

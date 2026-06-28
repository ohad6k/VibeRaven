import { basename, join } from 'node:path';
import type { CliScanArtifact } from '../types';
import { providerRailLogoHtml, resolveProviderLogoKey } from '../report/providerLogos';
import type {
  LocalUiConnectProvider,
  LocalUiLaunchPathItem,
  LocalUiMissionBlocker,
  LocalUiMissionCards,
  LocalUiMissionControl,
  LocalUiMissionPlanStep,
  LocalUiProofLadder,
  LocalUiProvider,
  LocalUiProviderCockpit,
  LocalUiState
} from './types';
import { buildLocalUiPrompt } from './prompts';
import { listLocalUiProviderCatalog, type LaunchPathTemplate } from './providerLaunchPaths';
import { buildLaunchRunway } from './launchRunway';

type GapLike = CliScanArtifact['gaps'][number];

const CONNECT_PROVIDER_PRIORITY = ['supabase', 'vercel', 'stripe'];

const providerDashboardUrls: Record<string, string> = {
  supabase: 'https://supabase.com/dashboard/projects',
  vercel: 'https://vercel.com/dashboard',
  stripe: 'https://dashboard.stripe.com',
  github: 'https://github.com/settings/profile',
  sentry: 'https://sentry.io',
  posthog: 'https://app.posthog.com',
  clerk: 'https://dashboard.clerk.com',
  authjs: 'https://authjs.dev',
  resend: 'https://resend.com/emails',
  upstash: 'https://console.upstash.com'
};

function blockerTone(severity: GapLike['severity']): LocalUiMissionBlocker['tone'] {
  if (severity === 'critical') return 'danger';
  if (severity === 'warning') return 'warn';
  return 'neutral';
}

function blockerCategoryLabel(gap: GapLike): string {
  const category = String(gap.category || '').toUpperCase();
  const text = gapSearchText(gap);
  if (category.includes('SECURITY') || category.includes('AUTH') || text.includes('secret') || text.includes('rls')) {
    return 'Security';
  }
  if (category.includes('ERROR') || category.includes('DEPLOYMENT') || text.includes('runtime') || text.includes('webhook')) {
    return 'Runtime';
  }
  if (
    text.includes('supabase') ||
    text.includes('vercel') ||
    text.includes('stripe') ||
    category.includes('DATABASE') ||
    category.includes('BILLING')
  ) {
    return 'Provider';
  }
  return 'Quality';
}

function planStepCategoryLabel(gap: GapLike): string {
  return blockerCategoryLabel(gap);
}

function gapRequiresUserAction(gap: GapLike): boolean {
  const extended = gap as GapLike & { requiresUserAction?: boolean };
  if (typeof extended.requiresUserAction === 'boolean') return extended.requiresUserAction;
  const text = gapSearchText(gap);
  return (
    (text.includes('live') && text.includes('proof')) ||
    text.includes('dashboard') ||
    text.includes('webhook') ||
    text.includes('provider action')
  );
}

function connectProviderStatus(provider: LocalUiProvider): LocalUiConnectProvider['status'] {
  if (provider.state === 'live_verified') return 'connected';
  if (provider.state === 'not_detected') return 'missing';
  return 'detected';
}

function buildConnectProviders(providers: LocalUiProvider[]): LocalUiConnectProvider[] {
  const needsConnect = providers.filter(
    (provider) =>
      provider.state === 'not_detected' ||
      provider.state === 'connect_live' ||
      provider.state === 'requires_user_action'
  );
  const sorted = [...needsConnect].sort((left, right) => {
    const leftIndex = CONNECT_PROVIDER_PRIORITY.indexOf(left.id);
    const rightIndex = CONNECT_PROVIDER_PRIORITY.indexOf(right.id);
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
  });
  return sorted.map((provider) => ({
    id: provider.id,
    name: provider.name,
    status: connectProviderStatus(provider),
    dashboardUrl: providerDashboardUrls[provider.id]
  }));
}

export function buildMissionCards(artifact: CliScanArtifact, providers: LocalUiProvider[]): LocalUiMissionCards {
  const blockers: LocalUiMissionBlocker[] = artifact.gaps.slice(0, 6).map((gap) => ({
    id: gap.id,
    title: gap.title,
    detail: gap.detail || undefined,
    severity: gap.severity,
    category: blockerCategoryLabel(gap),
    tone: blockerTone(gap.severity)
  }));
  const planSteps: LocalUiMissionPlanStep[] = artifact.gaps.slice(0, 8).map((gap) => ({
    id: gap.id,
    title: gap.title,
    category: planStepCategoryLabel(gap),
    requiresUserAction: gapRequiresUserAction(gap)
  }));
  const connectProviders = buildConnectProviders(providers);
  const blockerCount = blockers.length;
  const hasScan = Boolean(artifact.scannedAt);
  const summary = !hasScan
    ? 'Run `npx -y viberaven --agent-mode` to scan this project and surface production blockers.'
    : blockerCount === 0
      ? 'No launch blockers detected in the latest scan.'
      : `I analyzed the production rollout and found ${blockerCount} blocker${blockerCount === 1 ? '' : 's'} preventing a safe deploy.`;
  return {
    summary,
    blockerCount,
    blockers,
    planSteps,
    connectProviders
  };
}

const providerHints: Record<string, string[]> = {
  supabase: ['supabase', 'rls', 'database', 'postgres'],
  vercel: ['vercel', 'deployment', 'deploy', 'env'],
  stripe: ['stripe', 'webhook', 'checkout', 'payment', 'billing'],
  github: ['github', 'ci', 'workflow', 'branch'],
  sentry: ['sentry', 'monitoring', 'error handling', 'exception'],
  posthog: ['posthog', 'analytics', 'frontend-loading'],
  clerk: ['clerk'],
  authjs: ['auth.js', 'authjs', 'nextauth', 'auth'],
  resend: ['resend', 'email'],
  upstash: ['upstash', 'redis', 'rate limit']
};

function projectNameFromPath(pathValue: string): string {
  return basename(pathValue.replace(/[\\/]$/, '')) || 'current repo';
}

function gapSearchText(gap: GapLike): string {
  return [
    gap.id,
    gap.title,
    gap.detail,
    gap.category,
    gap.primaryMapCategory,
    ...(gap.affectedMapCategories ?? [])
  ]
    .join(' ')
    .toLowerCase();
}

function gapDirectText(gap: GapLike): string {
  return [gap.id, gap.title, gap.detail, gap.category].join(' ').toLowerCase();
}

function gapMatchesProvider(gap: GapLike, providerId: string): boolean {
  const text = gapSearchText(gap);
  return (providerHints[providerId] ?? [providerId]).some((hint) => text.includes(hint));
}

function providerGaps(artifact: CliScanArtifact, providerId: string): GapLike[] {
  return artifact.gaps.filter((gap) => gapMatchesProvider(gap, providerId));
}

function stateReason(gap: GapLike | undefined): string {
  if (!gap) return 'Repo evidence found';
  if (gap.severity === 'critical') return 'Critical launch blocker';
  if (gap.severity === 'warning') return 'Needs repo fix';
  return 'Needs verification';
}

function itemState(gap: GapLike | undefined, index: number): LocalUiLaunchPathItem['state'] {
  if (!gap) return index === 0 ? 'ready' : 'not_checked';
  if (gap.severity === 'critical') return 'blocked';
  return 'needs_fix';
}

function providerState(gaps: GapLike[]): LocalUiProvider['state'] {
  if (gaps.some((gap) => gap.severity === 'critical')) return 'needs_repo_fix';
  if (gaps.length > 0) return 'needs_repo_fix';
  return 'repo_evidence_found';
}

function providerStatusText(state: LocalUiProvider['state']): string {
  switch (state) {
    case 'needs_repo_fix':
      return 'Needs repo fix';
    case 'repo_evidence_found':
      return 'Repo evidence found';
    case 'live_verified':
      return 'Live verified';
    case 'requires_user_action':
      return 'User action';
    case 'blocked':
      return 'Blocked';
    case 'error':
      return 'Error';
    case 'connect_live':
      return 'Connect live';
    case 'not_detected':
    default:
      return 'Missing';
  }
}

function verifyActionForGap(gap: GapLike | undefined): { label: 'Verify'; commandPreview: string; intent: 'verify_action' | 'verify_gate'; actionId?: string } {
  if (gap?.id) {
    return {
      label: 'Verify',
      commandPreview: `npx -y viberaven verify --action ${gap.id}`,
      intent: 'verify_action',
      actionId: gap.id
    };
  }
  return {
    label: 'Verify',
    commandPreview: 'npx -y viberaven --verify',
    intent: 'verify_gate'
  };
}

function proofForProvider(providerId: string, gap: GapLike | undefined): LocalUiProofLadder {
  if (!gap) {
    return {
      level: 'code_only',
      summary: 'Repo evidence exists. Live provider proof is still optional for this step.',
      checks: [
        { label: 'Code found', status: 'yes', source: 'repo' },
        { label: 'Live provider verified', status: 'unknown', source: 'live' }
      ]
    };
  }

  const isProviderProofGap = gapSearchText(gap).includes('live') || gapSearchText(gap).includes('proof') || gapSearchText(gap).includes('webhook');
  return {
    level: isProviderProofGap ? 'dashboard_needed' : 'code_only',
    summary: isProviderProofGap
      ? 'The code exists, but production proof is still missing.'
      : 'Code evidence needs work before live proof matters.',
    checks: [
      { label: 'Code found', status: 'yes', source: 'repo' },
      { label: providerId === 'stripe' ? 'Env key name found' : 'Repo evidence found', status: 'yes', source: 'repo' },
      { label: 'Live provider verified', status: 'no', source: 'live' },
      { label: 'Production secret proof', status: 'no', source: 'dashboard' }
    ]
  };
}

function whereToClick(providerId: string): string {
  switch (providerId) {
    case 'stripe':
      return 'Developers -> Webhooks -> Select endpoint -> Signing secret';
    case 'supabase':
      return 'Table editor -> select table -> Policies -> Enable RLS';
    case 'vercel':
      return 'Project settings -> Environment variables -> Production';
    default:
      return 'Open provider dashboard -> complete the selected production action';
  }
}

function youLane(providerId: string, providerName: string, gap: GapLike | undefined): { title: string; body: string } {
  if (providerId === 'stripe') {
    return {
      title: 'Confirm Stripe webhook proof',
      body: 'Create or open the Stripe webhook endpoint, then confirm the production signing secret is available in the deployment provider.'
    };
  }
  if (providerId === 'supabase') {
    return {
      title: 'Confirm Supabase production proof',
      body: 'Open Supabase and confirm the selected table, auth, or environment step is complete for production.'
    };
  }
  if (providerId === 'vercel') {
    return {
      title: 'Confirm Vercel production settings',
      body: 'Open Vercel and confirm the production environment, deployment, or domain setting that blocks launch.'
    };
  }
  return {
    title: `Confirm ${providerName} provider proof`,
    body: gap?.detail ?? `Open ${providerName} and complete the selected production action.`
  };
}

function agentLane(providerId: string, gap: GapLike | undefined): { title: string; body: string } {
  if (providerId === 'stripe') {
    return {
      title: 'Make the webhook handler production-safe',
      body: 'Ask the coding agent to verify signature handling, idempotency, and narrow repo evidence. Keep the full repair prompt in the right panel.'
    };
  }
  if (gap) {
    return {
      title: 'Fix repo evidence if needed',
      body: `Fix only "${gap.title}" in the repo. Use the full Agent prompt on the right, then run verification.`
    };
  }
  return {
    title: 'Fix repo evidence if needed',
    body: 'Ask the coding agent to fix only the selected VibeRaven repo-code gap, then verify again.'
  };
}

function cockpitForProvider(template: LaunchPathTemplate, gap: GapLike | undefined): LocalUiProviderCockpit {
  const verify = verifyActionForGap(gap);
  return {
    action: {
      id: `${template.id}-current-action`,
      title: gap?.title ?? `Verify ${template.name} launch proof`,
      whyThisMatters: gap?.detail ?? `${template.name} can look wired in code while production proof is still missing.`,
      whereToClick: whereToClick(template.id),
      lanes: {
        you: youLane(template.id, template.name, gap),
        agent: agentLane(template.id, gap),
        verify
      }
    },
    proof: proofForProvider(template.id, gap)
  };
}

function mapProvider(template: LaunchPathTemplate, artifact: CliScanArtifact, projectName: string): LocalUiProvider {
  const gaps = providerGaps(artifact, template.id);
  const primaryGap = gaps[0];
  const state = providerState(gaps);
  const launchPath = template.items.map((item, index): LocalUiLaunchPathItem => ({
    ...item,
    state: itemState(primaryGap, index),
    shortReason: index === 0 ? stateReason(primaryGap) : primaryGap ? 'Verify after the first fix' : 'Not checked yet'
  }));
  const selectedItem = launchPath.find((item) => item.state === 'blocked' || item.state === 'needs_fix') ?? launchPath[0];
  const issueSummary = primaryGap?.detail ?? `${template.name} has repo evidence. Connect live provider verification when the local fixes are complete.`;
  const prompt = buildLocalUiPrompt({
    projectName,
    providerName: template.name,
    itemTitle: selectedItem.title,
    issueSummary,
    gapId: primaryGap?.id
  });

  const cockpit = cockpitForProvider(template, primaryGap);
  const nextFix = {
    id: primaryGap?.id ?? `${template.id}-verify-live`,
    title: primaryGap?.title ?? `Verify ${template.name} launch path`,
    whyItMatters: primaryGap?.detail ?? `${template.name} needs repo evidence and provider truth before real users rely on it.`,
    whatToChange: primaryGap?.copyPrompt ?? 'Review the launch path, complete any manual provider steps, then verify with VibeRaven.',
    verifyInstruction: 'Run VibeRaven verify after the repo or provider change is complete.',
    prompt,
    artifactRefs: [
      '.viberaven/agent-tasklist.md',
      '.viberaven/context-map.json',
      '.viberaven/gate-result.json'
    ]
  };
  const provider: LocalUiProvider = {
    id: template.id,
    name: template.name,
    area: template.area,
    iconHtml: providerRailLogoHtml(resolveProviderLogoKey(template.id), template.name),
    state,
    statusText: providerStatusText(state),
    connectLabel: state === 'repo_evidence_found' ? 'Connect live' : undefined,
    launchPath,
    selectedItemId: selectedItem.id,
    cockpit,
    nextFix
  };

  return {
    ...provider,
    runway: buildLaunchRunway({
      providerId: provider.id,
      providerName: provider.name,
      providerState: provider.state,
      launchPath: provider.launchPath,
      selectedItemId: provider.selectedItemId,
      cockpit: provider.cockpit,
      prompt: provider.nextFix?.prompt
    })
  };
}

function primaryGap(artifact: CliScanArtifact): GapLike | undefined {
  return artifact.gaps.find((gap) => gap.severity === 'critical') ?? artifact.gaps[0];
}

function providerIdForGap(gap: GapLike | undefined): string {
  if (!gap) return 'supabase';
  const directText = gapDirectText(gap);
  const directMatch = listLocalUiProviderCatalog().find((provider) => directText.includes(provider.id) || directText.includes(provider.name.toLowerCase()));
  if (directMatch) return directMatch.id;
  return listLocalUiProviderCatalog().find((provider) => gapMatchesProvider(gap, provider.id))?.id ?? 'supabase';
}

function buildMissionControl(artifact: CliScanArtifact, selectedProvider: LocalUiProvider): LocalUiMissionControl {
  const gap = primaryGap(artifact);
  const canLaunch = artifact.gaps.length === 0 && artifact.score >= 80 ? 'yes' : 'not_yet';
  const proof = selectedProvider.cockpit?.proof ?? proofForProvider(selectedProvider.id, gap);
  const mainBlocker = gap?.title ?? (canLaunch === 'yes' ? 'No launch blocker detected' : 'Run a scan to find the main blocker');
  return {
    canLaunch,
    answer: canLaunch === 'yes' ? 'Yes.' : 'Not yet.',
    mainBlocker,
    nextAction: gap?.title ?? 'Run VibeRaven scan',
    fixNext: {
      label: 'Fix next',
      target: gap
        ? { kind: 'provider', providerId: selectedProvider.id, actionId: selectedProvider.cockpit?.action.id ?? `${selectedProvider.id}-current-action` }
        : { kind: 'verify', verify: { label: 'Verify', commandPreview: 'npx -y viberaven --verify', intent: 'verify_gate' } }
    },
    environment: {
      local: 'Local evidence found',
      preview: 'Preview not verified',
      production: canLaunch === 'yes' ? 'Production proof clear' : 'Production proof missing'
    },
    proof,
    changedSinceLastScan: {
      summary: gap ? `1 blocker active since ${artifact.scannedAt ?? 'last scan'}` : 'No new blockers detected',
      details: gap ? [gap.title] : []
    },
    scaleBasics: [
      {
        risk: 'Webhook may run twice',
        whyItMatters: 'Payment providers can send the same event more than once.',
        status: artifact.gaps.some((item) => gapSearchText(item).includes('webhook')) ? 'missing' : 'unknown'
      },
      {
        risk: 'Database may struggle with real users',
        whyItMatters: 'Serverless apps often need production-safe database connection pooling.',
        status: artifact.gaps.some((item) => gapSearchText(item).includes('pool')) ? 'missing' : 'unknown'
      }
    ]
  };
}

export function emptyLocalUiState(cwd: string): LocalUiState {
  const projectName = projectNameFromPath(cwd);
  const artifact = {
    version: 1,
    scannedAt: undefined,
    workspacePath: cwd,
    score: 0,
    scoreLabel: 'Not scanned',
    summary: 'Run a scan to build provider launch paths.',
    archetype: 'unknown',
    productionCorePercent: 0,
    gaps: [],
    missionGraph: { areas: [], byArea: {}, byProvider: {}, repositoryEvidence: { env: [], security: [] } },
    stackWiring: { items: [], byKey: {} },
    providerRegistry: { version: 1, source: 'bundled', generatedAt: new Date().toISOString(), status: 'fresh', staleAfterDays: 14, providers: [] }
  } as unknown as CliScanArtifact;
  const state = mapArtifactToLocalUiState(artifact);
  const providers: LocalUiProvider[] = state.providers.map((provider) => ({
    ...provider,
    state: 'not_detected' as LocalUiProvider['state'],
    statusText: 'Missing',
    connectLabel: 'Add provider',
    launchPath: provider.launchPath.map((item) => ({
      ...item,
      state: 'not_checked' as LocalUiLaunchPathItem['state'],
      shortReason: 'Waiting for local evidence'
    })),
    selectedItemId: provider.launchPath[0]?.id,
    nextFix: provider.nextFix
      ? {
          ...provider.nextFix,
          title: `Add ${provider.name} when your app needs it`,
          whyItMatters: `${provider.area} is available as a production slot. VibeRaven will use repo evidence before asking for live proof.`,
          whatToChange: `Drag ${provider.name} into chat or open the slot when this project uses it.`,
          verifyInstruction: 'Connect a coding CLI, add project context, then ask VibeRaven for the next safe step.'
        }
      : provider.nextFix
  }));
  return {
    ...state,
    project: {
      ...state.project,
      name: 'Project'
    },
    gate: {
      ...state.gate,
      status: 'unknown',
      label: 'Waiting for project evidence'
    },
    providers,
    missionCards: buildMissionCards(artifact, providers),
    releases: [
      {
        id: 'v1.3.0',
        label: 'v1.3.0',
        meta: 'Local fixture',
        branch: 'main',
        tone: 'current',
        summary: 'Client interaction fixture. The local server replaces this with real project release context.'
      },
      {
        id: 'v1.2.2',
        label: 'v1.2.2',
        meta: 'Previous fixture',
        branch: 'main',
        tone: 'prod',
        summary: 'Previous release fixture for UI interaction tests.'
      },
      {
        id: 'workspace',
        label: 'Workspace',
        meta: 'Not released',
        branch: 'local',
        tone: 'planned',
        summary: 'No git release was detected yet.'
      }
    ],
    empty: true
  };
}

export function mapArtifactToLocalUiState(artifact: CliScanArtifact): LocalUiState {
  const projectName = projectNameFromPath(artifact.workspacePath);
  const providers = listLocalUiProviderCatalog().map((template) => mapProvider(template, artifact, projectName));
  const globalProviderId = providerIdForGap(primaryGap(artifact));
  const selectedProvider =
    providers.find((provider) => provider.id === globalProviderId) ??
    providers.find((provider) => provider.state === 'needs_repo_fix') ??
    providers.find((provider) => provider.state === 'repo_evidence_found') ??
    providers[0];

  const missionCards = buildMissionCards(artifact, providers);

  return {
    product: 'VibeRaven',
    tagline: 'From AI demo to production',
    command: 'npx -y viberaven',
    project: {
      name: projectName,
      path: artifact.workspacePath,
      archetype: artifact.archetype,
      scannedAt: artifact.scannedAt
    },
    gate: {
      status: artifact.gaps.length === 0 && artifact.score >= 80 ? 'clear' : 'not_clear',
      label: artifact.gaps.length === 0 && artifact.score >= 80 ? 'Ready' : 'Gate not clear',
      score: artifact.score,
      productionCorePercent: artifact.productionCorePercent
    },
    missionControl: buildMissionControl(artifact, selectedProvider),
    missionCards,
    providers,
    selectedProviderId: selectedProvider.id,
    currentPrompt: selectedProvider.nextFix?.prompt ?? '',
    artifacts: {
      tasklist: join('.viberaven', 'agent-tasklist.md'),
      contextMap: join('.viberaven', 'context-map.json'),
      gateResult: join('.viberaven', 'gate-result.json'),
      lastScan: join('.viberaven', 'last-scan.json')
    },
    empty: false
  };
}

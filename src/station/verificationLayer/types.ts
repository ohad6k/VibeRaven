import type {
  McpVerifierStateSnapshot,
  RepositoryEvidenceSummary,
  ScanResult,
  StackWiringArea,
  StackWiringSummary
} from '../types';

export type VerificationProviderId = 'vercel' | 'supabase' | 'stripe' | 'github';

export type ProviderConnectionState =
  | 'not_configured'
  | 'configured'
  | 'connected'
  | 'failed'
  | 'unsupported'
  | 'unknown_runtime';

/** Where proof for this check is expected to come from. */
export type EvidenceSource = 'repo' | 'provider' | 'manual' | 'mcp';

/** Outcome of a check — separate from evidence source. */
export type VerificationResultStatus =
  | 'verified'
  | 'missing'
  | 'unknown'
  | 'needs_mcp'
  | 'manual';

export type VerificationFixType =
  | 'repo-fix'
  | 'provider-config'
  | 'manual-dashboard'
  | 'mcp-connect';

export type VerificationSeverity = 'critical' | 'warning' | 'info';

export interface Provider {
  id: VerificationProviderId;
  label: string;
  areas: StackWiringArea[];
}

export interface VerificationCheck {
  id: string;
  provider: VerificationProviderId;
  area: StackWiringArea;
  title: string;
  description: string;
  requiredEvidence: string[];
  repoSignals: string[];
  providerSignals: string[];
  evidenceSource: EvidenceSource;
  status: VerificationResultStatus;
  fixType: VerificationFixType;
  severity: VerificationSeverity;
  evidenceRefs: string[];
  manualAction?: string;
}

export interface RepoProviderDiff {
  id: string;
  provider: VerificationProviderId;
  area: StackWiringArea;
  title: string;
  description: string;
  repoExpectation: string;
  providerActual: string;
  severity: VerificationSeverity;
  suggestedFix: VerificationFixType;
  evidenceRefs: string[];
}

export interface ProviderConfigDetection {
  provider: VerificationProviderId;
  detected: boolean;
  signals: string[];
}

export interface ProviderVerifierResult {
  provider: VerificationProviderId;
  connectionState: ProviderConnectionState;
  config: ProviderConfigDetection;
  checks: VerificationCheck[];
  diffs: RepoProviderDiff[];
  repoReadinessPercent: number;
  providerReadinessPercent: number;
}

export interface VerificationLayerSnapshot {
  version: 1;
  generatedAt: string;
  runtimeMode: 'mock' | 'mcp';
  providers: ProviderVerifierResult[];
  checks: VerificationCheck[];
  diffs: RepoProviderDiff[];
  repoReadinessPercent: number;
  providerReadinessPercent: number;
}

export interface VerifierContext {
  workspaceRoot: string;
  scan: ScanResult;
  stackWiring: StackWiringSummary;
  repositoryEvidence: RepositoryEvidenceSummary;
  mcpVerifierState?: McpVerifierStateSnapshot;
}

export interface ProviderVerifier {
  readonly provider: VerificationProviderId;
  detectConfig(ctx: VerifierContext): ProviderConfigDetection;
  connectStatus(ctx: VerifierContext): ProviderConnectionState;
  runChecks(ctx: VerifierContext): VerificationCheck[];
  buildDiffs(ctx: VerifierContext): RepoProviderDiff[];
}

export function providerCheckId(provider: VerificationProviderId, checkKey: string): string {
  return `${provider}:${checkKey}`;
}

const PROVIDER_CONNECTION_BLOCKS_VERIFY: ProviderConnectionState[] = [
  'not_configured',
  'configured',
  'unknown_runtime',
  'unsupported'
];

export function coerceProviderVerificationStatus(
  status: VerificationResultStatus,
  connectionState: ProviderConnectionState
): VerificationResultStatus {
  if (status !== 'verified') {
    return status;
  }
  if (PROVIDER_CONNECTION_BLOCKS_VERIFY.includes(connectionState)) {
    return connectionState === 'not_configured' || connectionState === 'configured'
      ? 'needs_mcp'
      : 'unknown';
  }
  return status;
}

export function mapVerificationStatusToMissionStatus(
  status: VerificationResultStatus
): 'passed' | 'missing' | 'unknown' | 'needs-connection' | 'manual-required' | 'failed' {
  switch (status) {
    case 'verified':
      return 'passed';
    case 'missing':
      return 'missing';
    case 'unknown':
      return 'unknown';
    case 'needs_mcp':
      return 'needs-connection';
    case 'manual':
      return 'manual-required';
    default:
      return 'failed';
  }
}

export function mapEvidenceSourceToLegacyEvidenceClass(
  source: EvidenceSource,
  status: VerificationResultStatus
): 'repo-verified' | 'missing-repo-fix' | 'mcp-verifier' | 'manual-dashboard' {
  if (source === 'repo') {
    return status === 'verified' ? 'repo-verified' : 'missing-repo-fix';
  }
  if (source === 'manual') {
    return 'manual-dashboard';
  }
  if (source === 'mcp') {
    return 'mcp-verifier';
  }
  return 'mcp-verifier';
}

export function isProviderLayerCheck(check: VerificationCheck): boolean {
  return check.evidenceSource === 'provider' || check.evidenceSource === 'mcp';
}

export function isRepoLayerCheck(check: VerificationCheck): boolean {
  return check.evidenceSource === 'repo';
}

export function computeLayerReadinessPercent(
  checks: VerificationCheck[],
  layer: 'repo' | 'provider'
): number {
  const filtered = checks.filter((check) =>
    layer === 'repo' ? isRepoLayerCheck(check) : isProviderLayerCheck(check)
  );
  if (filtered.length === 0) {
    return 100;
  }
  const verified = filtered.filter((check) => check.status === 'verified').length;
  return Math.round((verified / filtered.length) * 100);
}

export function aggregateReadinessPercents(
  providerResults: ProviderVerifierResult[]
): { repoReadinessPercent: number; providerReadinessPercent: number } {
  if (providerResults.length === 0) {
    return { repoReadinessPercent: 100, providerReadinessPercent: 100 };
  }
  const repoSum = providerResults.reduce((sum, r) => sum + r.repoReadinessPercent, 0);
  const providerSum = providerResults.reduce((sum, r) => sum + r.providerReadinessPercent, 0);
  return {
    repoReadinessPercent: Math.round(repoSum / providerResults.length),
    providerReadinessPercent: Math.round(providerSum / providerResults.length)
  };
}

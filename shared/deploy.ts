import type { ManagedStationUsage } from './station';

export type DeploySessionStatus =
  | 'draft'
  | 'previewed'
  | 'needs_runner'
  | 'scanning'
  | 'needs_provider_choice'
  | 'needs_user_action'
  | 'running_action'
  | 'ready_with_warnings'
  | 'ready_to_deploy'
  | 'deployed'
  | 'blocked'
  | 'failed'
  | 'unsupported';

export type AppFramework = 'nextjs' | 'vite' | 'react' | 'node' | 'unknown';
export type AppType = 'saas' | 'ai_tool' | 'dashboard' | 'landing' | 'internal_tool' | 'unknown';

export type DeployProviderArea = 'deployment' | 'database' | 'auth' | 'payments' | 'monitoring' | 'analytics';
export type ProviderSupportTier = 'fully_guided' | 'repo_guided' | 'manual_guided' | 'coming_soon' | 'unsupported';

export interface ProviderSelection {
  provider: string;
  label: string;
  selectedBy: 'recommended' | 'user' | 'repo_detected';
  reason: string;
  supportTier: ProviderSupportTier;
  selectedAt: string;
}

export type SelectedProviderStack = Partial<Record<DeployProviderArea, ProviderSelection>>;

export type StackLaneKey =
  | 'frontend'
  | 'appflow'
  | 'backend'
  | 'auth'
  | 'database'
  | 'payments'
  | 'monitoring'
  | 'analytics'
  | 'deploy'
  | 'security'
  | 'testing'
  | 'onboarding';

export interface LaneSelection {
  lane: StackLaneKey;
  provider: string;
  label: string;
  selectedBy: 'recommended' | 'user' | 'repo_detected';
  supportTier: ProviderSupportTier;
  reason?: string;
  selectedAt: string;
}

export type SelectedLaneStack = Partial<Record<StackLaneKey, LaneSelection>>;

export interface DeployProviderOption {
  area: DeployProviderArea;
  provider: string;
  label: string;
  supportTier: ProviderSupportTier;
  reason: string;
  recommended: boolean;
  dashboardUrl?: string;
  importUrl?: string;
}

export type DeployProviderOptions = Partial<Record<DeployProviderArea, DeployProviderOption[]>>;

export interface ReadinessSummary {
  state:
    | 'not_started'
    | 'previewed'
    | 'needs_runner'
    | 'running'
    | 'needs_user_action'
    | 'needs_provider_proof'
    | 'verified'
    | 'blocked'
    | 'failed'
    | 'unsupported'
    | 'live_verified';
  score: number;
  label: string;
  blockers: string[];
  warnings: string[];
  nextActionId?: string | null;
}

export interface DeploySession {
  id: string;
  repoUrl: string;
  repoOwner?: string | null;
  repoName?: string | null;
  repoBranch?: string | null;
  repoVisibility: 'public' | 'private' | 'unknown';
  appType: AppType;
  framework: AppFramework;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown';
  status: DeploySessionStatus;
  readiness: ReadinessSummary;
  selectedProviderStack: SelectedProviderStack;
  selectedLaneStack: SelectedLaneStack;
  providerOptions: DeployProviderOptions;
  actions?: GuidedAction[];
  runnerSession?: RunnerSession | null;
  usage: ManagedStationUsage;
  createdAt: string;
  updatedAt: string;
}

export type DeploySessionSummary = {
  id: string;
  repoUrl: string;
  status: DeploySessionStatus;
  readiness: Pick<ReadinessSummary, 'state' | 'score' | 'label'>;
  connected: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GuidedActionSection =
  | 'runner'
  | 'validation'
  | 'deployment'
  | 'provider_setup'
  | 'readiness';

export type GuidedActionRiskLevel = 'low' | 'medium' | 'high';
export type GuidedActionExecutionMode = 'api' | 'open_url' | 'runner_job' | 'manual';
export type GuidedActionVerificationState =
  | 'not_started'
  | 'needs_user_action'
  | 'manual_confirmed'
  | 'verification_queued'
  | 'runner_succeeded'
  | 'failed'
  | 'blocked';

export type GuidedActionDestination =
  | {
      kind: 'url';
      label: string;
      url: string;
    }
  | {
      kind: 'runner_job';
      jobKind: Extract<RunnerJobKind, 'run_build' | 'run_tests' | 'prepare_deploy'>;
    }
  | {
      kind: 'api';
      operation: 'create_runner_pairing';
    };

export interface GuidedActionValue {
  label: string;
  value: string;
  copyable: boolean;
}

export interface GuidedActionInput {
  label: string;
  description: string;
  required: boolean;
}

export interface GuidedActionOutput {
  label: string;
  description: string;
}

export interface GuidedAction {
  id: string;
  deploySessionId: string;
  section: GuidedActionSection;
  provider: string | null;
  title: string;
  description: string;
  userFacingReason: string;
  riskLevel: GuidedActionRiskLevel;
  executionMode: GuidedActionExecutionMode;
  requiresRunner: boolean;
  requiresProviderConnection: boolean;
  requiredInputs: GuidedActionInput[];
  expectedOutputs: GuidedActionOutput[];
  exactValues: GuidedActionValue[];
  verificationState: GuidedActionVerificationState;
  blocking: boolean;
  primaryButtonLabel: string;
  destination: GuidedActionDestination | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type RunnerSessionState =
  | 'pairing_created'
  | 'waiting_for_runner'
  | 'connected'
  | 'repo_matched'
  | 'repo_mismatch'
  | 'offline'
  | 'expired'
  | 'revoked'
  | 'error';

export type RunnerCapability =
  | 'read_files'
  | 'run_build'
  | 'run_tests'
  | 'apply_patch'
  | 'open_url'
  | 'deep_station_scan';

export interface RedactedLocalRepo {
  rootName: string;
  remotes: Array<{
    name: string;
    normalizedUrl: string;
    provider: 'github' | 'gitlab' | 'bitbucket' | 'unknown';
  }>;
  branch?: string | null;
  headSha?: string | null;
  dirty?: boolean;
  packageManager?: DeploySession['packageManager'];
}

export type RunnerJobKind =
  | 'scan_repo'
  | 'deep_station_scan'
  | 'rescan'
  | 'run_build'
  | 'run_tests'
  | 'apply_patch'
  | 'create_file'
  | 'open_url'
  | 'prepare_deploy';

export type RunnerJobStatus =
  | 'queued'
  | 'acknowledged'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'needs_user'
  | 'cancelled';

export type ProofKind =
  | 'command_output'
  | 'repo_evidence'
  | 'manual_confirmation'
  | 'live_check'
  | 'runner_summary';

export interface RunnerJob {
  id: string;
  deploySessionId: string;
  runnerSessionId: string;
  kind: RunnerJobKind;
  input: Record<string, unknown>;
  status: RunnerJobStatus;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string | null;
  completedAt?: string | null;
  outputSummary?: string[];
  error?: {
    code: string;
    message: string;
  } | null;
}

export interface ProofItem {
  id: string;
  deploySessionId: string;
  runnerSessionId: string;
  jobId?: string | null;
  kind: ProofKind;
  label: string;
  summary: string;
  evidence: string[];
  redacted: true;
  createdAt: string;
}

export interface RunnerActionResult {
  jobId: string;
  status: 'succeeded' | 'failed' | 'needs_user' | 'cancelled';
  proofItems: Array<Omit<ProofItem, 'id' | 'createdAt'>>;
  outputSummary: string[];
  redacted: true;
  error?: {
    code: string;
    message: string;
  };
}

export interface RunnerQueuedJobsResponse {
  jobs: RunnerJob[];
}

export interface RunnerSession {
  id: string;
  deploySessionId: string;
  state: RunnerSessionState;
  runnerKind?: 'cli' | 'extension' | null;
  runnerVersion?: string | null;
  capabilities: RunnerCapability[];
  repoMatch: 'matched' | 'remote_mismatch' | 'branch_mismatch' | 'unknown';
  localRepo?: RedactedLocalRepo | null;
  lastSeenAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RunnerPairingResponse {
  launchSessionId: string;
  oneTimeToken: string;
  command: string;
  expiresAt: string;
  action?: GuidedAction;
}

export interface RunnerHandshakeRequest {
  launchSessionId: string;
  oneTimeToken: string;
  runnerKind: 'cli' | 'extension';
  runnerVersion: string;
  capabilities: RunnerCapability[];
  localRepo: RedactedLocalRepo;
}

export interface RunnerHandshakeResponse {
  runnerSession: RunnerSession;
  runnerAccessToken: string;
  repoMatch: RunnerSession['repoMatch'];
  allowedJobKinds: RunnerJobKind[];
  pollAfterMs: number;
}

/** Published npm package invocation for copy-paste deploy connect commands. */
export const VIBERAVEN_CLI_NPX = 'npx -y viberaven';

export function buildRunnerConnectCommand(launchSessionId: string, oneTimeToken: string): string {
  return `${VIBERAVEN_CLI_NPX} connect --session ${launchSessionId} --token ${oneTimeToken}`;
}

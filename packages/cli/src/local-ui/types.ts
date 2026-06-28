export type LocalUiProviderState =
  | 'not_detected'
  | 'repo_evidence_found'
  | 'needs_repo_fix'
  | 'connect_live'
  | 'live_verified'
  | 'requires_user_action'
  | 'blocked'
  | 'error';

export type LocalUiLaunchPathState =
  | 'ready'
  | 'needs_fix'
  | 'needs_connect'
  | 'requires_user_action'
  | 'blocked'
  | 'not_checked';

export interface LocalUiLaunchPathItem {
  id: string;
  providerId: string;
  title: string;
  state: LocalUiLaunchPathState;
  shortReason: string;
  source: 'repo' | 'live' | 'manual' | 'verify';
}

export type LocalUiLaunchRunwayStageId =
  | 'repo_evidence'
  | 'provider_proof'
  | 'agent_fix'
  | 'verify'
  | 'clear';

export interface LocalUiLaunchRunwayStage {
  id: LocalUiLaunchRunwayStageId;
  providerId: string;
  label: string;
  state:
    | 'idle'
    | 'evidence_found'
    | 'needs_provider_action'
    | 'prompt_ready'
    | 'blocked'
    | 'cleared';
  source: 'repo' | 'live' | 'manual' | 'verify';
  title: string;
  summary: string;
  owner: 'agent' | 'user' | 'viberaven';
  selected?: boolean;
  actionId?: string;
  prompt?: string;
}

export interface LocalUiLaunchRunway {
  activeStageId: LocalUiLaunchRunwayStageId;
  progress: number;
  stages: LocalUiLaunchRunwayStage[];
}

export interface LocalUiNextFix {
  id: string;
  title: string;
  whyItMatters: string;
  whatToChange: string;
  verifyInstruction: string;
  prompt: string;
  artifactRefs: string[];
}

export type LocalUiCanLaunch = 'yes' | 'not_yet' | 'unknown';
export type LocalUiProofLevel = 'code_only' | 'dashboard_needed' | 'live_verified';
export type LocalUiVerifyIntent = 'verify_action' | 'verify_gate' | 'strict_gate' | 'agent_mode_scan';

export interface LocalUiProofCheck {
  label: string;
  status: 'yes' | 'no' | 'unknown';
  source: 'repo' | 'dashboard' | 'live' | 'manual';
}

export interface LocalUiProofLadder {
  level: LocalUiProofLevel;
  summary: string;
  checks: LocalUiProofCheck[];
}

export interface LocalUiVerifyAction {
  label: string;
  commandPreview: string;
  intent: LocalUiVerifyIntent;
  actionId?: string;
}

export interface LocalUiActionLane {
  title: string;
  body: string;
}

export interface LocalUiActionLanes {
  you: LocalUiActionLane;
  agent: LocalUiActionLane;
  verify: LocalUiVerifyAction;
}

export interface LocalUiProviderAction {
  id: string;
  title: string;
  whyThisMatters: string;
  whereToClick: string;
  lanes: LocalUiActionLanes;
}

export interface LocalUiProviderCockpit {
  action: LocalUiProviderAction;
  proof: LocalUiProofLadder;
}

export interface LocalUiProviderMcp {
  status: 'disconnected' | 'connected';
  label: string;
  source?: string;
  connectCommand?: string;
  capabilities: string[];
}

export interface LocalUiProvider {
  id: string;
  name: string;
  area: string;
  iconHtml: string;
  state: LocalUiProviderState;
  statusText: string;
  connectLabel?: string;
  launchPath: LocalUiLaunchPathItem[];
  selectedItemId?: string;
  nextFix?: LocalUiNextFix;
  cockpit?: LocalUiProviderCockpit;
  runway?: LocalUiLaunchRunway;
  mcp?: LocalUiProviderMcp;
}

export interface LocalUiConnectProvider {
  id: string;
  name: string;
  status: 'connected' | 'detected' | 'missing';
  dashboardUrl?: string;
}

export interface LocalUiMissionBlocker {
  id: string;
  title: string;
  detail?: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  tone: 'danger' | 'warn' | 'neutral';
}

export interface LocalUiMissionPlanStep {
  id: string;
  title: string;
  category: string;
  requiresUserAction: boolean;
}

export interface LocalUiMissionCards {
  summary: string;
  blockerCount: number;
  blockers: LocalUiMissionBlocker[];
  planSteps: LocalUiMissionPlanStep[];
  connectProviders: LocalUiConnectProvider[];
}

export interface LocalUiRelease {
  id: string;
  label: string;
  meta: string;
  branch: string;
  tone: 'current' | 'prod' | 'planned';
  summary: string;
}

export interface LocalUiProject {
  name: string;
  path: string;
  archetype: string;
  version?: string;
  scannedAt?: string;
}

export interface LocalUiGate {
  status: 'clear' | 'not_clear' | 'unknown';
  label: string;
  score?: number;
  productionCorePercent?: number;
}

export interface LocalUiFixNextAction {
  label: 'Fix next';
  target:
    | { kind: 'provider'; providerId: string; actionId: string }
    | { kind: 'verify'; verify: LocalUiVerifyAction };
}

export interface LocalUiMissionControl {
  canLaunch: LocalUiCanLaunch;
  answer: string;
  mainBlocker: string;
  nextAction: string;
  fixNext: LocalUiFixNextAction;
  environment: {
    local: string;
    preview: string;
    production: string;
  };
  proof: LocalUiProofLadder;
  changedSinceLastScan: {
    summary: string;
    details: string[];
  };
  scaleBasics: Array<{
    risk: string;
    whyItMatters: string;
    status: 'ready' | 'missing' | 'unknown';
  }>;
}

export interface LocalUiState {
  product: 'VibeRaven';
  tagline: 'From AI demo to production';
  command: 'npx -y viberaven';
  project: LocalUiProject;
  gate: LocalUiGate;
  missionControl: LocalUiMissionControl;
  missionCards: LocalUiMissionCards;
  releases?: LocalUiRelease[];
  providers: LocalUiProvider[];
  selectedProviderId: string;
  currentPrompt: string;
  artifacts: {
    tasklist: string;
    contextMap: string;
    gateResult: string;
    lastScan: string;
  };
  empty: boolean;
}

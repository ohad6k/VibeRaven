import type { MissionCheckSifgReference, SifgGraph } from './sifgTypes';
import type {
  EvidenceSource,
  VerificationLayerSnapshot,
  VerificationResultStatus
} from './verificationLayer/types';
import type {
  ProviderCapabilityTag,
  ProviderVerificationTier
} from './providerTaxonomy';

export type GapSeverity = 'critical' | 'warning' | 'info';

export type GapCategory =
  | 'SECURITY & AUTH'
  | 'DATABASE & DATA'
  | 'ERROR HANDLING'
  | 'DEPLOYMENT'
  | 'PERFORMANCE'
  | 'MISSING FEATURES'
  | 'EDGE CASES & RISKS'
  | 'LANDING & MARKETING';

export type ProductionMapCategoryKey =
  | 'appFlow'
  | 'frontend'
  | 'backend'
  | 'auth'
  | 'database'
  | 'payments'
  | 'deployment'
  | 'monitoring'
  | 'security'
  | 'testing'
  | 'landing'
  | 'errorHandling';

export interface ToolSuggestion {
  name: string;
  url: string;
  reason: string;
}

export interface Gap {
  id: string;
  category: GapCategory;
  severity: GapSeverity;
  title: string;
  detail: string;
  copyPrompt: string;
  toolSuggestions: ToolSuggestion[];
  mcpSuggestion: string | null;
  /** One Mission Map section that owns this root blocker. Prevents duplicate gap counts across balls. */
  primaryMapCategory: ProductionMapCategoryKey;
  /** Other sections affected by this blocker; shown as context, not counted as separate gaps. */
  affectedMapCategories: ProductionMapCategoryKey[];
}

export interface ProductionChecklist {
  security: number;
  database: number;
  auth: number;
  errorHandling: number;
  deployment: number;
  testing: number;
  landing: number;
  monitoring: number;
}

export interface ModelStationOutput {
  score: number;
  scoreLabel: string;
  summary: string;
  archetype: string;
  gaps: Gap[];
  stackDetected: string[];
  missingLayers: string[];
  quickWins: string[];
  productionChecklist: ProductionChecklist;
  verificationSummary?: VerificationSummary;
}

/** Derived from `deepScanWorkspace` for Mission Control UI (database / landing / RLS hints). */
export interface StationScanContext {
  suggestDatabaseLayer: boolean;
  suggestSupabaseRlsReview: boolean;
  suggestLandingPage: boolean;
}

export type StackSignalKey =
  | 'hasSupabase'
  | 'hasPrisma'
  | 'hasDrizzle'
  | 'hasMongoose'
  | 'hasNextJs'
  | 'hasVite'
  | 'hasAuth'
  | 'hasTests'
  | 'hasDocker'
  | 'hasCI'
  | 'hasStripe'
  | 'hasPolar'
  | 'hasClerk'
  | 'hasAuthJs'
  | 'hasPaddle'
  | 'hasVercel'
  | 'hasSentry'
  | 'hasPostHog'
  | 'hasPlaywright'
  | 'hasUpstash'
  | 'hasTurnstile'
  | 'hasNeon'
  | 'hasMongoDb'
  | 'hasPlanetScale'
  | 'hasTurso'
  | 'hasLanding'
  | 'hasRateLimit'
  | 'hasEnvExample'
  | 'hasRobots'
  | 'hasSitemap'
  | 'hasErrorBoundary'
  | 'hasLoadingStates';

export interface ScannedFile {
  path: string;
  content: string | null;
  isSecret: boolean;
  sizeBytes: number;
  heat: number;
}

export interface ScanResult {
  files: ScannedFile[];
  stackSignals: Partial<Record<StackSignalKey, boolean>>;
  packageDeps: string[];
  fileTree: string;
  secretsFound: string[];
  totalFilesScanned: number;
}

export type ProductionConnectionArea =
  | 'database'
  | 'auth'
  | 'payments'
  | 'deployment'
  | 'monitoring'
  | 'security';

export type ProductionConnectionProvider =
  | 'supabase'
  | 'clerk'
  | 'authjs'
  | 'auth0'
  | 'better-auth'
  | 'firebase'
  | 'neon'
  | 'planetscale'
  | 'mongodb'
  | 'turso'
  | 'stripe'
  | 'paddle'
  | 'polar'
  | 'lemon-squeezy'
  | 'vercel'
  | 'netlify'
  | 'render'
  | 'railway'
  | 'cloudflare'
  | 'aws'
  | 'sentry'
  | 'posthog'
  | 'logrocket'
  | 'rate-limit'
  | 'bot-protection'
  | 'secrets-hygiene';

export type ProductionConnectionStatus =
  | 'not-chosen'
  | 'selected'
  | 'setup-not-verified'
  | 'detected'
  | 'needs-env'
  | 'needs-webhook'
  | 'manual-check'
  | 'mcp-available'
  | 'repo-verified';

export interface ProductionConnectionChoice {
  provider: ProductionConnectionProvider;
  selectedAt: string;
}

export interface ProductionConnectionChoices {
  version: 1;
  choices: Partial<Record<ProductionConnectionArea, ProductionConnectionChoice>>;
}

export interface ProductionConnectionEvidence {
  area: ProductionConnectionArea;
  provider: ProductionConnectionProvider;
  status: ProductionConnectionStatus[];
  signals: string[];
}

export interface ProductionConnectionSummary {
  area: ProductionConnectionArea;
  provider: ProductionConnectionProvider | null;
  source: 'none' | 'selected' | 'detected';
  status: ProductionConnectionStatus[];
  label: string;
  signals: string[];
}

export type ProviderTruthRole =
  | 'using-now'
  | 'runtime-code'
  | 'live-verified'
  | 'selected'
  | 'detected-in-repo'
  | 'mentioned-only'
  | 'alternative'
  | 'legacy-or-unused'
  | 'conflict'
  | 'needs-mcp'
  | 'mcp-failed'
  | 'manual-only'
  | 'manual-confirmed';

export type ProviderTruthConfidence = 'high' | 'medium' | 'low' | 'none';

export type ProviderTruthEvidenceStrength = 'strong' | 'medium' | 'weak' | 'negative';

export type ProviderTruthEvidenceKind =
  | 'active-runtime-route'
  | 'sdk-import-source'
  | 'runtime-env-usage'
  | 'env-name-only'
  | 'webhook-handler'
  | 'checkout-handler'
  | 'deployment-config'
  | 'provider-config'
  | 'package-installed'
  | 'docs-mention'
  | 'test-reference'
  | 'tmp-demo-example'
  | 'commented-code'
  | 'mcp-proof'
  | 'manual-proof';

export type ProviderTruthProofStatus =
  | 'not-checked'
  | 'needs-mcp'
  | 'mcp-configured'
  | 'mcp-connected'
  | 'mcp-failed'
  | 'live-verified'
  | 'manual-required'
  | 'manual-confirmed'
  | 'unsupported';

export type ProviderTruthMcpProofStatus = Exclude<
  ProviderTruthProofStatus,
  'manual-required' | 'manual-confirmed'
>;

export type ProviderTruthRecommendedActionKind =
  | 'none'
  | 'choose-intended-provider'
  | 'connect-mcp'
  | 'fix-repo'
  | 'run-mcp-verification'
  | 'manual-check'
  | 'rescan-proof'
  | 'resolve-conflict';

export type ProviderTruthPromptTemplate =
  | 'repo-fix'
  | 'provider-mismatch-decision'
  | 'mcp-verification'
  | 'manual-check'
  | 'rescan-proof'
  | 'launch-blocker';

export interface ProviderTruthEvidenceItem {
  id: string;
  kind: ProviderTruthEvidenceKind;
  strength: ProviderTruthEvidenceStrength;
  label: string;
  file?: string;
  detail?: string;
  points: number;
  isRuntimeEvidence: boolean;
  isLiveProof: boolean;
  isManualProof: boolean;
}

export interface ProviderTruthMcpProof {
  status: ProviderTruthMcpProofStatus;
  providerServerId?: string;
  checkedAt?: string;
  evidence: ProviderTruthEvidenceItem[];
  error?: string;
  readOnly: boolean;
}

export interface ProviderTruthManualProof {
  status: Extract<ProviderTruthProofStatus, 'manual-required' | 'manual-confirmed' | 'not-checked'>;
  confirmedAt?: string;
  confirmedBy?: 'user';
  label?: string;
  evidence: ProviderTruthEvidenceItem[];
}

export interface ProviderTruthRecommendedAction {
  kind: ProviderTruthRecommendedActionKind;
  label: string;
  reason: string;
  promptTemplate: ProviderTruthPromptTemplate | null;
  primary: boolean;
}

export interface ProviderTruthRow {
  area: ProductionConnectionArea;
  provider: ProductionConnectionProvider;
  providerLabel: string;
  roles: ProviderTruthRole[];
  confidence: ProviderTruthConfidence;
  score: number;
  statusBadges: string[];
  evidence: ProviderTruthEvidenceItem[];
  mcpProof: ProviderTruthMcpProof;
  manualProof: ProviderTruthManualProof;
  recommendedActions: ProviderTruthRecommendedAction[];
}

export type ProviderTruthConflictType =
  | 'selected-vs-repo'
  | 'repo-vs-live'
  | 'multiple-runtime-providers'
  | 'same-confidence-tie'
  | 'selected-without-evidence'
  | 'manual-without-live-proof';

export interface ProviderTruthConflict {
  type: ProviderTruthConflictType;
  severity: GapSeverity;
  title: string;
  detail: string;
  providerKeys: ProductionConnectionProvider[];
  evidence: ProviderTruthEvidenceItem[];
  recommendedAction: ProviderTruthRecommendedAction;
}

export interface ProviderTruthArea {
  area: ProductionConnectionArea;
  rows: ProviderTruthRow[];
  usingNow: ProviderTruthRow | null;
  runtimeDetected?: ProviderTruthRow | null;
  liveVerified: ProviderTruthRow | null;
  selected: ProviderTruthRow | null;
  conflicts: ProviderTruthConflict[];
  recommendedAction: ProviderTruthRecommendedAction;
}

export interface ProviderTruthSnapshot {
  version: 1;
  generatedAt: string;
  areas: ProviderTruthArea[];
  summary: {
    liveVerifiedCount: number;
    conflictCount: number;
    needsMcpCount: number;
    manualOnlyCount: number;
  };
}

export type VerificationArea =
  | 'auth'
  | 'database'
  | 'payments'
  | 'deployment'
  | 'monitoring'
  | 'security'
  | 'testing'
  | 'landing'
  | 'frontend'
  | 'backend'
  | 'appFlow'
  | 'errorHandling';

export type VerificationItemStatus = 'found' | 'missing' | 'manual';

export interface VerificationItem {
  label: string;
  status: VerificationItemStatus;
  source: string;
  detail?: string;
}

export interface VerificationAreaSummary {
  area: VerificationArea;
  found: VerificationItem[];
  missing: VerificationItem[];
  manual: VerificationItem[];
}

export interface VerificationSummary {
  byArea: Partial<Record<VerificationArea, VerificationAreaSummary>>;
}

export type LaunchValidationStatus = 'no-go' | 'go-with-warnings' | 'go';

export interface LaunchValidationIssue {
  id: string;
  area: ProductionConnectionArea | VerificationArea;
  severity: GapSeverity;
  title: string;
  detail: string;
  promptTemplate: ProviderTruthPromptTemplate | null;
}

export interface LaunchValidationReport {
  version: 1;
  generatedAt: string;
  status: LaunchValidationStatus;
  score: number;
  summary: string;
  blockers: LaunchValidationIssue[];
  warnings: LaunchValidationIssue[];
  manualChecks: LaunchValidationIssue[];
  mcpChecks: LaunchValidationIssue[];
}

export type StackWiringStatus = 'passed' | 'missing' | 'manual';

export interface StackWiringItem {
  id: string;
  label: string;
  status: StackWiringStatus;
  evidence: string[];
  promptHint: string;
}

export type StackWiringKey =
  | 'figma-app-flow'
  | 'storybook-app-flow'
  | 'product-spec-app-flow'
  | 'route-map-app-flow'
  | 'react-frontend'
  | 'vue-frontend'
  | 'svelte-frontend'
  | 'angular-frontend'
  | 'node-backend'
  | 'python-backend'
  | 'rails-backend'
  | 'go-backend'
  | 'rate-limit-security'
  | 'bot-protection-security'
  | 'secrets-hygiene-security'
  | 'supabase-database'
  | 'firebase-database'
  | 'clerk-auth'
  | 'authjs-auth'
  | 'auth0-auth'
  | 'better-auth-auth'
  | 'supabase-auth'
  | 'neon-database'
  | 'turso-database'
  | 'mongodb-database'
  | 'planetscale-database'
  | 'stripe-payments'
  | 'paddle-payments'
  | 'polar-payments'
  | 'lemon-squeezy-payments'
  | 'vercel-deployment'
  | 'netlify-deployment'
  | 'render-deployment'
  | 'railway-deployment'
  | 'cloudflare-deployment'
  | 'aws-deployment'
  | 'supabase-landing'
  | 'sentry-monitoring'
  | 'posthog-monitoring'
  | 'logrocket-monitoring'
  | 'vitest-testing'
  | 'playwright-testing'
  | 'sentry-error-handling'
  | 'posthog-error-handling';

export type StackWiringProvider =
  | 'figma'
  | 'storybook'
  | 'product-spec'
  | 'route-map'
  | 'react'
  | 'vue'
  | 'svelte'
  | 'angular'
  | 'node'
  | 'python'
  | 'rails'
  | 'go'
  | 'rate-limit'
  | 'bot-protection'
  | 'secrets-hygiene'
  | 'supabase'
  | 'supabase-auth'
  | 'firebase'
  | 'clerk'
  | 'authjs'
  | 'auth0'
  | 'better-auth'
  | 'neon'
  | 'turso'
  | 'mongodb'
  | 'planetscale'
  | 'stripe'
  | 'paddle'
  | 'polar'
  | 'lemon-squeezy'
  | 'vercel'
  | 'netlify'
  | 'render'
  | 'railway'
  | 'cloudflare'
  | 'aws'
  | 'sentry'
  | 'posthog'
  | 'logrocket'
  | 'vitest'
  | 'playwright';

export type StackWiringArea =
  | 'appFlow'
  | 'frontend'
  | 'backend'
  | 'database'
  | 'auth'
  | 'payments'
  | 'deployment'
  | 'monitoring'
  | 'security'
  | 'testing'
  | 'landing'
  | 'errorHandling';

export interface StackWiringProviderSummary {
  key: StackWiringKey;
  provider: StackWiringProvider;
  providerLabel: string;
  area: StackWiringArea;
  areaLabel: string;
  promptSubject: string;
  items: StackWiringItem[];
  passedCount: number;
  totalCount: number;
  readinessPercent: number;
}

export interface SupabaseDatabaseWiringSummary extends StackWiringProviderSummary {
  key: 'supabase-database';
  provider: 'supabase';
  area: 'database';
}

export interface StackWiringSummary {
  items: StackWiringProviderSummary[];
  byKey: Partial<Record<StackWiringKey, StackWiringProviderSummary>>;
  supabaseDatabase?: SupabaseDatabaseWiringSummary;
}

export interface StackAutomationAction {
  id: string;
  label: string;
  status: StackWiringStatus;
  promptHint: string;
  evidence: string[];
}

export type ContextualPromptKind =
  | 'repo-fix'
  | 'manual-checklist'
  | 'mcp-verification'
  | 'raven-gap'
  | 'provider-mismatch-decision'
  | 'manual-check'
  | 'rescan-proof'
  | 'launch-blocker';

export interface ContextualPrompt {
  kind: ContextualPromptKind;
  title: string;
  body: string;
  allowedActions: string[];
  forbiddenActions: string[];
}

export interface StackAutomationRecipe {
  key: StackWiringKey;
  provider: StackWiringProvider;
  providerLabel: string;
  area: StackWiringArea;
  promptSubject: string;
  readinessPercent: number;
  repoFixes: StackAutomationAction[];
  manualChecks: StackAutomationAction[];
  confirmedChecks: StackAutomationAction[];
  mcpProvider: string | null;
  repoPrompt: string;
  verificationPrompt: string;
  automationLevel: 'repo-prompt' | 'repo-prompt-plus-mcp' | 'manual-only';
  promptRoutes?: Partial<Record<ContextualPromptKind, ContextualPrompt>>;
}

export interface StackAutomationSummary {
  items: StackAutomationRecipe[];
  byKey: Partial<Record<StackWiringKey, StackAutomationRecipe>>;
}

export type EnvEvidenceMode = 'test' | 'live' | 'unknown';

export type EnvEvidenceSource =
  | 'non-secret-content'
  | 'variable-name-only'
  | 'secret-file-path';

export interface EnvVarEvidence {
  name: string;
  present: boolean;
  mode: EnvEvidenceMode;
  source: EnvEvidenceSource;
  evidence: string[];
}

export type RepositoryEvidenceStatus = 'found' | 'missing' | 'risk' | 'unknown';

export interface RepositoryEvidenceItem {
  id: string;
  label: string;
  status: RepositoryEvidenceStatus;
  evidence: string[];
}

export interface RepositoryEvidenceSummary {
  env: EnvVarEvidence[];
  security: RepositoryEvidenceItem[];
}

export type MissionEvidenceClass =
  | 'repo-verified'
  | 'missing-repo-fix'
  | 'mcp-verifier'
  | 'manual-dashboard';

export type MissionCheckStatus =
  | 'passed'
  | 'missing'
  | 'unknown'
  | 'needs-connection'
  | 'manual-required'
  | 'user-confirmed'
  | 'stale'
  | 'failed';

export interface MissionCheck {
  id: string;
  label: string;
  providerKey: StackWiringKey;
  providerLabel: string;
  area: StackWiringArea;
  evidenceClass: MissionEvidenceClass;
  status: MissionCheckStatus;
  evidence: string[];
  promptHint: string;
  sifg?: MissionCheckSifgReference;
  evidenceSource?: EvidenceSource;
  verificationStatus?: VerificationResultStatus;
  verificationCheckId?: string;
}

export interface ProviderMission {
  key: StackWiringKey;
  provider: StackWiringProvider;
  providerLabel: string;
  area: StackWiringArea;
  promptSubject: string;
  readinessPercent: number;
  repoReadinessPercent?: number;
  providerReadinessPercent?: number;
  checks: MissionCheck[];
}

export interface MissionArea {
  key: StackWiringArea;
  label: string;
  readinessPercent: number;
  repoReadinessPercent?: number;
  providerReadinessPercent?: number;
  criticalCount: number;
  providerMissions: ProviderMission[];
}

export interface MissionGraph {
  areas: MissionArea[];
  byArea: Partial<Record<StackWiringArea, MissionArea>>;
  byProvider: Partial<Record<StackWiringKey, ProviderMission>>;
  repositoryEvidence: RepositoryEvidenceSummary;
  staticInfrastructureFlowGraph?: SifgGraph;
  verificationLayer?: VerificationLayerSnapshot;
}

export type ManualConfirmationStatus = 'confirmed' | 'revoked';

export interface ManualConfirmationRecord {
  version: 1;
  providerKey: StackWiringKey;
  checkId: string;
  providerLabel: string;
  areaLabel: string;
  label: string;
  status: ManualConfirmationStatus;
  confirmedAt: string;
  revokedAt?: string;
  registryVersion: ProviderRegistrySnapshot['version'];
  registrySource: ProviderRegistrySnapshot['source'];
  registryGeneratedAt: string;
}

export interface ManualConfirmationState {
  version: 1;
  records: ManualConfirmationRecord[];
}

export type ManualConfirmationDisplayStatus = ManualConfirmationStatus | 'stale';

export interface ManualConfirmationDisplayRecord extends Omit<ManualConfirmationRecord, 'status'> {
  status: ManualConfirmationDisplayStatus;
}

export interface ManualConfirmationDisplayState {
  version: 1;
  records: ManualConfirmationDisplayRecord[];
}

export type ProviderRegistrySource = 'bundled' | 'managed-backend';
export type ProviderRegistryStatus = 'fresh' | 'stale';

export type McpVerifierConfigStatus = 'configured' | 'missing' | 'unsupported' | 'stale';
export type McpVerifierRuntimeStatus = 'unknown-runtime';

export interface McpVerifierStateRecord {
  version: 1;
  provider: ProviderRegistryEntry['provider'];
  label: string;
  status: McpVerifierConfigStatus;
  runtimeStatus: McpVerifierRuntimeStatus;
  configuredIn: string[];
  serverName: string;
  transport: string;
  supportsReadOnly: boolean;
  checkedAt: string;
  registryVersion: ProviderRegistrySnapshot['version'];
  registrySource: ProviderRegistrySource;
  registryGeneratedAt: string;
}

export interface McpVerifierStateSnapshot {
  version: 1;
  checkedAt: string;
  records: McpVerifierStateRecord[];
}

export interface ProviderMcpTemplate {
  label: string;
  serverName: string;
  vscodeServer: Record<string, unknown>;
  cursorServer: Record<string, unknown>;
  keyInstructions: string;
}

export interface ProviderRegistryEntry {
  provider: string;
  label: string;
  aliases: string[];
  areas: StackWiringArea[];
  productionAreas: ProductionConnectionArea[];
  capabilityTags?: ProviderCapabilityTag[];
  verificationTier?: ProviderVerificationTier;
  uncertainPlacement?: boolean;
  iconKey: string;
  sifgTemplateIds?: string[];
  docsUrl?: string;
  dashboardUrl?: string;
  mcp?: ProviderMcpTemplate;
  verification?: {
    supportsReadOnly: boolean;
  };
  verifiedAt: string;
  status: ProviderRegistryStatus;
}

export interface ProviderRegistrySnapshot {
  version: 1;
  source: ProviderRegistrySource;
  generatedAt: string;
  staleAfterDays: number;
  status: ProviderRegistryStatus;
  providers: ProviderRegistryEntry[];
}

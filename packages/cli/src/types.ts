import type { ManagedStationUsage } from '../../../shared/station';
import type {
  Gap,
  LaunchValidationReport,
  MissionGraph,
  ModelStationOutput,
  ProviderRegistrySnapshot,
  ProviderTruthSnapshot,
  StackAutomationSummary,
  StackWiringSummary,
  VerificationSummary
} from '../../../src/station/types';

export interface CliProviderOption {
  provider: string;
  label: string;
  description?: string;
}

/** Serializable scan bundle written to `.viberaven/last-scan.json`. */
export interface CliScanArtifact {
  version: 1;
  scannedAt: string;
  workspacePath: string;
  score: number;
  scoreLabel: string;
  summary: string;
  archetype: string;
  gaps: Gap[];
  missionGraph: MissionGraph;
  stackWiring: StackWiringSummary;
  stackAutomation?: StackAutomationSummary;
  providerRegistry: ProviderRegistrySnapshot;
  providerTruth?: ProviderTruthSnapshot;
  launchValidation?: LaunchValidationReport;
  verificationSummary?: VerificationSummary;
  productionCorePercent: number;
  /** Switchable providers per production area (database, auth, payments, …). */
  providerOptions?: Record<string, CliProviderOption[]>;
  /** Currently selected provider per area from `.viberaven/stack.json`. */
  selectedProviders?: Record<string, string>;
  usage?: ManagedStationUsage;
  /** From `GET /v1/account/me` when the scan runs with valid credentials. */
  accountEmail?: string;
  plan?: 'free' | 'pro';
  /** Human-readable usage line for the report account strip. */
  usageLine?: string;
}

export type StationRunSuccess = ModelStationOutput & {
  missionGraph: MissionGraph;
  stackWiring: StackWiringSummary;
  stackAutomation: StackAutomationSummary;
  providerRegistry: ProviderRegistrySnapshot;
  providerTruth?: ProviderTruthSnapshot;
  launchValidation?: LaunchValidationReport;
  verificationSummary: VerificationSummary;
  usage?: ManagedStationUsage;
};

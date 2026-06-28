import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { BackendHttpError } from './backendClient';
import { adaptManagedStationResponse, normalizeModelOutput } from './engines';
import { isNetworkFetchFailure } from './fetchUtils';
import { buildLaunchValidationReport } from './launchValidation';
import { buildMissionGraph } from './missionGraph';
import { buildProviderTruthSnapshot } from './providerTruth';
import { buildProviderRegistrySnapshot } from './providerRegistry';
import { buildAnalysisPrompt } from './promptBuilder';
import {
  buildProductionConnectionContext,
  detectProductionConnectionEvidence,
  normalizeProductionChoice,
  summarizeProductionConnections
} from './productionConnections';
import { analyzeRepositoryEvidence } from './repositoryEvidence';
import { computeStationScanContext } from './scanContext';
import { buildStaticInfrastructureFlowGraph } from './sifgEngine';
import { buildStackAutomationContext, buildStackAutomationSummary } from './stackAutomation';
import { analyzeStackWiring, buildStackWiringContext } from './stackWiring';
import { buildVerificationEvidenceContext, buildVerificationSummary } from './verification';
import { runVerificationLayer } from './verificationLayer/runVerificationLayer';
import type { ManagedStationRequest, ManagedStationResponse } from '../../shared/station';
import type { ProductionConnectionChoices } from './productionConnections';
import type { SifgGraph } from './sifgTypes';
import type {
  LaunchValidationReport,
  McpVerifierStateSnapshot,
  MissionGraph,
  ModelStationOutput,
  ProviderTruthSnapshot,
  RepositoryEvidenceSummary,
  ScanResult,
  ScannedFile,
  StackAutomationSummary,
  StackWiringSummary,
  StationScanContext,
  VerificationSummary
} from './types';

interface StationOrchestratorDeps {
  scanWorkspace: (root: string) => Promise<ScanResult>;
  fetchStationOutput: (prompt: string, configuration?: unknown) => Promise<Partial<ModelStationOutput>>;
  getManagedAccessToken?: () => Promise<string | undefined>;
  runManagedStation?: (
    accessToken: string,
    payload: ManagedStationRequest
  ) => Promise<ManagedStationResponse>;
  /**
   * When false (default for shipped builds), Station never falls back to BYOK/local OpenAI —
   * users must be signed in and reach the managed API.
   */
  isLocalStationFallbackAllowed?: () => boolean | Promise<boolean>;
  getProductionConnectionChoices?: () => Promise<ProductionConnectionChoices | undefined>;
  getMcpVerifierState?: () => Promise<McpVerifierStateSnapshot | undefined> | McpVerifierStateSnapshot | undefined;
}

interface StationOrchestratorInput {
  workspaceRoot: string;
  prompt: string;
  configuration?: unknown;
}

export interface StationRunResult extends ModelStationOutput {
  scannedFiles: ScannedFile[];
  scanContext: StationScanContext;
  providerRegistry: ReturnType<typeof buildProviderRegistrySnapshot>;
  productionConnections: ReturnType<typeof summarizeProductionConnections>;
  verificationSummary: VerificationSummary;
  stackWiring: StackWiringSummary;
  stackAutomation: StackAutomationSummary;
  repositoryEvidence: RepositoryEvidenceSummary;
  providerTruth: ProviderTruthSnapshot;
  launchValidation: LaunchValidationReport;
  missionGraph: MissionGraph;
  staticInfrastructureFlowGraph: SifgGraph;
  usage?: ManagedStationResponse['usage'];
}

export interface ScanLimitResult {
  kind: 'scan_limit_reached';
  upgradeUrl: string;
}

export interface ManagedRequiredResult {
  kind: 'managed_required';
  message: string;
}

/** Managed API rejected the stored access token (wrong server or rotated API secret). */
export interface ManagedSessionInvalidResult {
  kind: 'managed_session_invalid';
  message: string;
}

export type OrchestratorResult =
  | StationRunResult
  | ScanLimitResult
  | ManagedRequiredResult
  | ManagedSessionInvalidResult;

export function isScanLimitResult(value: OrchestratorResult): value is ScanLimitResult {
  return (value as ScanLimitResult).kind === 'scan_limit_reached';
}

export function isManagedRequiredResult(value: OrchestratorResult): value is ManagedRequiredResult {
  return (value as ManagedRequiredResult).kind === 'managed_required';
}

export function isManagedSessionInvalidResult(
  value: OrchestratorResult
): value is ManagedSessionInvalidResult {
  return (value as ManagedSessionInvalidResult).kind === 'managed_session_invalid';
}

export function createStationOrchestrator(deps: StationOrchestratorDeps) {
  return {
    async run(input: StationOrchestratorInput): Promise<OrchestratorResult> {
      const allowLocal = Boolean(await deps.isLocalStationFallbackAllowed?.());

      const scan = await deps.scanWorkspace(input.workspaceRoot);
      const productionConnectionChoices = await loadProductionConnectionChoices(deps);
      const productionConnectionEvidence = detectProductionConnectionEvidence(scan);
      const productionConnections = summarizeProductionConnections(
        productionConnectionChoices,
        productionConnectionEvidence
      );
      const productionConnectionContext = buildProductionConnectionContext(
        productionConnectionChoices,
        productionConnectionEvidence
      );
      const verificationSummary = buildVerificationSummary(scan, productionConnections);
      const verificationEvidenceContext = buildVerificationEvidenceContext(verificationSummary);
      const stackWiring: StackWiringSummary = analyzeStackWiring(scan);
      const stackWiringContext = buildStackWiringContext(stackWiring);
      const repositoryEvidence = analyzeRepositoryEvidence(scan);
      const providerRegistry = buildProviderRegistrySnapshot();
      const staticInfrastructureFlowGraph = buildStaticInfrastructureFlowGraph(scan);
      const stackAutomation = buildStackAutomationSummary(stackWiring, { staticInfrastructureFlowGraph });
      const stackAutomationContext = buildStackAutomationContext(stackAutomation);
      const mcpVerifierState = await deps.getMcpVerifierState?.();
      const verificationLayer = runVerificationLayer({
        workspaceRoot: input.workspaceRoot,
        scan,
        stackWiring,
        repositoryEvidence,
        mcpVerifierState
      });
      const providerTruth = buildProviderTruthSnapshot({
        scan,
        choices: productionConnectionChoices,
        mcpVerifierState,
        verificationLayer
      });
      const missionGraph = buildMissionGraph({
        stackWiring,
        repositoryEvidence,
        staticInfrastructureFlowGraph,
        verificationLayer
      });
      const specContent = await readSpec(input.workspaceRoot);
      const modelPrompt = buildAnalysisPrompt(
        scan,
        specContent,
        productionConnectionContext,
        verificationEvidenceContext,
        stackWiringContext,
        stackAutomationContext
      );

      const managedToken = await deps.getManagedAccessToken?.();
      let managedResponse: ManagedStationResponse | undefined;

      if (managedToken && deps.runManagedStation) {
        try {
          managedResponse = await deps.runManagedStation(managedToken, {
            prompt: modelPrompt,
            workspacePath: input.workspaceRoot,
            specMarkdown: specContent.trim().length > 0 ? specContent : null,
            files: scan.files
              .filter((f) => !f.isSecret && f.content !== null)
              .slice(0, 20)
              .map((f) => ({
                path: f.path,
                summary: f.content!.slice(0, 200),
                heat: f.heat >= 7 ? 'hot' : f.heat >= 4 ? 'warm' : 'cool',
              })),
          });
        } catch (error) {
          if (error instanceof BackendHttpError && error.status === 402) {
            return {
              kind: 'scan_limit_reached',
              upgradeUrl: error.upgradeUrl ?? 'https://viberaven.dev/account'
            };
          }
          if (error instanceof BackendHttpError && error.status === 401) {
            return {
              kind: 'managed_session_invalid',
              message:
                'VibeRaven returned 401 Unauthorized for this scan. Your saved sign-in no longer matches the managed API. Use VibeRaven: Sign Out, then VibeRaven: Sign In again.'
            };
          }
          if (isNetworkFetchFailure(error)) {
            if (!allowLocal) {
              return {
                kind: 'managed_required',
                message:
                  'Could not reach the VibeRaven managed API. This is not a Pro-only restriction — Free accounts include two managed scans once the server is reachable. Check your connection, then retry.'
              };
            }
            // fall through to BYOK below
          } else {
            throw error;
          }
        }
      }

      if (managedResponse !== undefined) {
        const raw: Partial<ModelStationOutput> = adaptManagedStationResponse(managedResponse);
        const normalized = normalizeModelOutput(raw);
        const scanContext = computeStationScanContext(scan);
        const launchValidation = buildLaunchValidationReport({
          model: normalized,
          providerTruth,
          missionGraph,
          gaps: normalized.gaps
        });
        return {
          ...normalized,
          scannedFiles: scan.files,
          scanContext,
          providerRegistry,
          productionConnections,
          verificationSummary,
          stackWiring,
          stackAutomation,
          repositoryEvidence,
          providerTruth,
          launchValidation,
          missionGraph,
          staticInfrastructureFlowGraph,
          usage: managedResponse.usage
        };
      }

      if (!allowLocal) {
        return {
          kind: 'managed_required',
          message:
            managedToken && deps.runManagedStation
              ? 'Managed scan could not complete. Sign in again or check your VibeRaven backend URL.'
              : 'Sign in to VibeRaven (VibeRaven: Sign In) to run managed scans. Local-only API keys are disabled in this build unless you turn on “Allow local Station without managed account” in settings.'
        };
      }

      const raw: Partial<ModelStationOutput> = await deps.fetchStationOutput(modelPrompt, input.configuration);
      const normalized = normalizeModelOutput(raw);
      const scanContext = computeStationScanContext(scan);
      const launchValidation = buildLaunchValidationReport({
        model: normalized,
        providerTruth,
        missionGraph,
        gaps: normalized.gaps
      });

      return {
        ...normalized,
        scannedFiles: scan.files,
        scanContext,
        providerRegistry,
        productionConnections,
        verificationSummary,
        stackWiring,
        stackAutomation,
        repositoryEvidence,
        providerTruth,
        launchValidation,
        missionGraph,
        staticInfrastructureFlowGraph
      };
    },
  };
}

async function readSpec(workspaceRoot: string): Promise<string> {
  try {
    return await fs.readFile(join(workspaceRoot, 'SPEC.md'), 'utf-8');
  } catch {
    return '';
  }
}

async function loadProductionConnectionChoices(
  deps: StationOrchestratorDeps
): Promise<ProductionConnectionChoices> {
  try {
    return normalizeProductionChoice(await deps.getProductionConnectionChoices?.());
  } catch {
    return normalizeProductionChoice(undefined);
  }
}

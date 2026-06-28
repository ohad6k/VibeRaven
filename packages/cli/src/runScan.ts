import { join } from 'node:path';
import { deepScanWorkspace } from '../../../src/station/fileScanner';
import {
  createStationOrchestrator,
  isManagedRequiredResult,
  isManagedSessionInvalidResult,
  isScanLimitResult,
  type StationRunResult
} from '../../../src/station/orchestrator';
import { runManagedStation } from '../../../src/station/backendClient';
import type { ProductionConnectionChoices } from '../../../src/station/productionConnections';
import { hydrateArtifactForReport } from './report/hydrateArtifact';
import type { CliScanArtifact, StationRunSuccess } from './types';
import { loadStackChoicesFile } from './config';

function computeProductionCorePercent(missionGraph: StationRunResult['missionGraph']): number {
  const areas = missionGraph.areas ?? [];
  if (areas.length === 0) {
    return 0;
  }
  const sum = areas.reduce((acc, area) => acc + (area.readinessPercent ?? 0), 0);
  return Math.round(sum / areas.length);
}

function toArtifact(
  workspacePath: string,
  result: StationRunSuccess,
  selectedProviders: Record<string, string>
): CliScanArtifact {
  const artifact: CliScanArtifact = {
    version: 1,
    scannedAt: new Date().toISOString(),
    workspacePath,
    score: result.score,
    scoreLabel: result.scoreLabel,
    summary: result.summary,
    archetype: result.archetype,
    gaps: result.gaps,
    missionGraph: result.missionGraph,
    stackWiring: result.stackWiring,
    stackAutomation: result.stackAutomation,
    providerRegistry: result.providerRegistry,
    verificationSummary: result.verificationSummary,
    productionCorePercent: computeProductionCorePercent(result.missionGraph),
    selectedProviders,
    usage: result.usage
  };

  if (result.providerTruth) {
    artifact.providerTruth = result.providerTruth;
  }
  if (result.launchValidation) {
    artifact.launchValidation = result.launchValidation;
  }

  return artifact;
}

async function loadProductionChoices(workspacePath: string): Promise<ProductionConnectionChoices | undefined> {
  const file = await loadStackChoicesFile(workspacePath);
  if (Object.keys(file.choices).length === 0) {
    return undefined;
  }
  // The orchestrator normalizes this shape via `normalizeProductionChoice`.
  return file as unknown as ProductionConnectionChoices;
}

export type RunScanOptions = {
  workspacePath?: string;
  accessToken: string;
  apiBaseUrl: string;
};

export type RunScanResult =
  | { ok: true; artifact: CliScanArtifact }
  | { ok: false; kind: 'scan_limit'; upgradeUrl: string }
  | { ok: false; kind: 'auth_required'; message: string }
  | { ok: false; kind: 'session_invalid'; message: string }
  | { ok: false; kind: 'error'; message: string };

export async function runProjectScan(options: RunScanOptions): Promise<RunScanResult> {
  const workspacePath = options.workspacePath ?? process.cwd();
  const orchestrator = createStationOrchestrator({
    scanWorkspace: (root) => deepScanWorkspace(root),
    getManagedAccessToken: async () => options.accessToken,
    runManagedStation: async (token, payload) => runManagedStation(options.apiBaseUrl, token, payload),
    getProductionConnectionChoices: () => loadProductionChoices(workspacePath),
    isLocalStationFallbackAllowed: async () => false,
    fetchStationOutput: async () => {
      throw new Error('Local OpenAI fallback is disabled in the CLI. Use `viberaven login`.');
    }
  });

  try {
    const result = await orchestrator.run({
      workspaceRoot: workspacePath,
      prompt: 'Full station scan for CLI launch report',
      configuration: undefined
    });

    if (isScanLimitResult(result)) {
      return { ok: false, kind: 'scan_limit', upgradeUrl: result.upgradeUrl };
    }
    if (isManagedRequiredResult(result)) {
      return { ok: false, kind: 'auth_required', message: result.message };
    }
    if (isManagedSessionInvalidResult(result)) {
      return { ok: false, kind: 'session_invalid', message: result.message };
    }

    const stackFile = await loadStackChoicesFile(workspacePath);
    const selectedProviders: Record<string, string> = {};
    for (const [area, choice] of Object.entries(stackFile.choices)) {
      if (choice && typeof choice.provider === 'string') {
        selectedProviders[area] = choice.provider;
      }
    }
    const artifact = hydrateArtifactForReport(
      toArtifact(workspacePath, result as StationRunSuccess, selectedProviders)
    );
    return { ok: true, artifact };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, kind: 'error', message };
  }
}

export function defaultPromptPath(workspacePath: string): string {
  return join(workspacePath, '.viberaven', 'last-scan.json');
}

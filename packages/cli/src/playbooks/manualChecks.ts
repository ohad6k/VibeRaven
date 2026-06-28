import type { ProductionMapCategoryKey } from '../../../../shared/planLimits';
import type { MissionCheck } from '../../../../src/station/types';
import type { CliScanArtifact } from '../types';

export function isManualProviderCheck(check: MissionCheck): boolean {
  return (
    check.evidenceClass === 'manual-dashboard' ||
    check.evidenceClass === 'mcp-verifier' ||
    check.evidenceSource === 'provider' ||
    check.evidenceSource === 'mcp' ||
    check.status === 'needs-connection' ||
    check.status === 'unknown'
  );
}

export interface ManualCheckRef {
  areaLabel: string;
  providerLabel: string;
  check: MissionCheck;
  mapCategory: ProductionMapCategoryKey;
}

export function collectManualChecks(artifact: CliScanArtifact): ManualCheckRef[] {
  const refs: ManualCheckRef[] = [];
  for (const area of artifact.missionGraph.areas ?? []) {
    for (const mission of area.providerMissions) {
      for (const check of mission.checks) {
        if (!isManualProviderCheck(check)) {
          continue;
        }
        refs.push({
          areaLabel: area.label,
          providerLabel: mission.providerLabel,
          check,
          mapCategory: area.key
        });
      }
    }
  }
  return refs;
}

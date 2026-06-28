import type { MissionArea } from '../../../../src/station/types';

export type ProviderMission = MissionArea['providerMissions'][number];

export function normalizeProviderToken(value: string): string {
  return value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');
}

export function missionMatchesProvider(mission: ProviderMission, provider: string): boolean {
  const current = normalizeProviderToken(provider);
  return normalizeProviderToken(mission.provider || mission.providerLabel || mission.key) === current ||
    normalizeProviderToken(mission.providerLabel || mission.provider || mission.key) === current;
}

export function missionEvidenceScore(mission: ProviderMission): number {
  const repoVerified = mission.checks.filter((check) => check.evidenceClass === 'repo-verified' || check.status === 'passed').length;
  const missing = mission.checks.filter((check) =>
    check.evidenceClass === 'missing-repo-fix' || check.status === 'missing' || check.status === 'failed'
  ).length;
  return repoVerified * 100 + (mission.readinessPercent ?? 0) - missing;
}

export function preferredMissionForArea(area: MissionArea | undefined, selectedProvider: string): ProviderMission | undefined {
  const missions = area?.providerMissions ?? [];
  if (missions.length === 0) {
    return undefined;
  }
  const selected = selectedProvider ? missions.find((mission) => missionMatchesProvider(mission, selectedProvider)) : undefined;
  if (selected) {
    return selected;
  }
  return [...missions].sort((a, b) => missionEvidenceScore(b) - missionEvidenceScore(a))[0] ?? missions[0];
}

export function openChecksForMission(mission: ProviderMission | undefined): number {
  if (!mission) {
    return 0;
  }
  return mission.checks.filter((check) =>
    check.status === 'missing' || check.status === 'failed' || check.status === 'needs-connection'
  ).length;
}

import type {
  MissionCheck,
  MissionEvidenceClass,
  MissionGraph,
  ProviderMission,
  StackWiringArea,
  StackWiringKey
} from '../types';
import {
  mapEvidenceSourceToLegacyEvidenceClass,
  mapVerificationStatusToMissionStatus,
  type VerificationCheck,
  type VerificationLayerSnapshot,
  type VerificationProviderId
} from './types';

const PROVIDER_WIRING_KEY: Partial<Record<VerificationProviderId, StackWiringKey>> = {
  vercel: 'vercel-deployment',
  supabase: 'supabase-database',
  stripe: 'stripe-payments'
};

export function mergeVerificationIntoMissionGraph(
  graph: MissionGraph,
  layer: VerificationLayerSnapshot
): MissionGraph {
  const providerMissions = graph.areas.flatMap((area) => area.providerMissions);
  const missionByKey = new Map(providerMissions.map((mission) => [mission.key, mission]));

  for (const layerCheck of layer.checks) {
    if (layerCheck.evidenceSource === 'repo') {
      continue;
    }

    const mission = resolveTargetMission(graph, missionByKey, layerCheck);
    if (!mission) {
      continue;
    }

    if (mission.checks.some((check) => check.verificationCheckId === layerCheck.id || check.id === missionRowId(layerCheck.id))) {
      continue;
    }

    mission.checks.push(verificationCheckToMissionCheck(layerCheck, mission));
  }

  recomputeMissionReadiness(providerMissions);
  const areas = rebuildAreas(providerMissions);

  return {
    ...graph,
    areas,
    byArea: areas.reduce<MissionGraph['byArea']>((acc, area) => {
      acc[area.key] = area;
      return acc;
    }, {}),
    byProvider: providerMissions.reduce<MissionGraph['byProvider']>((acc, mission) => {
      acc[mission.key] = mission;
      return acc;
    }, {}),
    verificationLayer: layer
  };
}

function resolveTargetMission(
  graph: MissionGraph,
  missionByKey: Map<StackWiringKey, ProviderMission>,
  layerCheck: VerificationCheck
): ProviderMission | undefined {
  const wiringKey = PROVIDER_WIRING_KEY[layerCheck.provider];
  if (wiringKey) {
    return missionByKey.get(wiringKey) ?? graph.byProvider[wiringKey];
  }

  if (layerCheck.provider === 'github') {
    return (
      missionByKey.get('vitest-testing') ??
      missionByKey.get('playwright-testing') ??
      ensureGitHubMission(graph, missionByKey, layerCheck.area)
    );
  }

  return undefined;
}

function ensureGitHubMission(
  graph: MissionGraph,
  missionByKey: Map<StackWiringKey, ProviderMission>,
  area: StackWiringArea
): ProviderMission {
  const key = 'vitest-testing' as StackWiringKey;
  const existing = missionByKey.get(key);
  if (existing) {
    return existing;
  }

  const mission: ProviderMission = {
    key,
    provider: 'vitest',
    providerLabel: 'GitHub Actions',
    area,
    promptSubject: 'GitHub Actions CI',
    readinessPercent: 0,
    repoReadinessPercent: 100,
    providerReadinessPercent: 0,
    checks: []
  };
  missionByKey.set(key, mission);
  const areaEntry = graph.areas.find((entry) => entry.key === area);
  if (areaEntry) {
    areaEntry.providerMissions.push(mission);
  }
  return mission;
}

function missionRowId(verificationCheckId: string): string {
  return `vl-${verificationCheckId}`;
}

function verificationCheckToMissionCheck(
  layerCheck: VerificationCheck,
  mission: ProviderMission
): MissionCheck {
  const evidenceClass = legacyEvidenceClassFor(layerCheck);
  const status = mapVerificationStatusToMissionStatus(layerCheck.status);

  return {
    id: missionRowId(layerCheck.id),
    label: layerCheck.title,
    providerKey: mission.key,
    providerLabel: mission.providerLabel,
    area: layerCheck.area,
    evidenceClass,
    status,
    evidence: [...layerCheck.repoSignals, ...layerCheck.providerSignals, ...layerCheck.evidenceRefs],
    promptHint: layerCheck.manualAction ?? layerCheck.description,
    evidenceSource: layerCheck.evidenceSource,
    verificationStatus: layerCheck.status,
    verificationCheckId: layerCheck.id
  };
}

function legacyEvidenceClassFor(layerCheck: VerificationCheck): MissionEvidenceClass {
  return mapEvidenceSourceToLegacyEvidenceClass(layerCheck.evidenceSource, layerCheck.status);
}

function recomputeMissionReadiness(missions: ProviderMission[]): void {
  for (const mission of missions) {
    mission.repoReadinessPercent = readinessPercentForRepoChecks(mission.checks);
    mission.providerReadinessPercent = readinessPercentForProviderChecks(mission.checks);
    mission.readinessPercent = mission.repoReadinessPercent;
  }
}

export function readinessPercentForRepoChecks(checks: MissionCheck[]): number {
  const repoChecks = checks.filter(isRepoLayerMissionCheck);
  if (repoChecks.length === 0) {
    return 100;
  }
  const verified = repoChecks.filter((check) => isVerifiedMissionCheck(check)).length;
  return Math.round((verified / repoChecks.length) * 100);
}

export function readinessPercentForProviderChecks(checks: MissionCheck[]): number {
  const providerChecks = checks.filter(isProviderLayerMissionCheck);
  if (providerChecks.length === 0) {
    return 100;
  }
  const verified = providerChecks.filter((check) => isVerifiedMissionCheck(check)).length;
  return Math.round((verified / providerChecks.length) * 100);
}

function isRepoLayerMissionCheck(check: MissionCheck): boolean {
  if (check.evidenceSource === 'provider' || check.evidenceSource === 'mcp' || check.evidenceSource === 'manual') {
    return false;
  }
  if (check.evidenceSource === 'repo') {
    return true;
  }
  return check.evidenceClass === 'repo-verified' || check.evidenceClass === 'missing-repo-fix';
}

function isProviderLayerMissionCheck(check: MissionCheck): boolean {
  if (check.evidenceSource === 'provider' || check.evidenceSource === 'mcp') {
    return true;
  }
  return check.evidenceClass === 'mcp-verifier';
}

function isVerifiedMissionCheck(check: MissionCheck): boolean {
  if (check.verificationStatus) {
    return check.verificationStatus === 'verified';
  }
  return check.status === 'passed' || check.status === 'user-confirmed';
}

function rebuildAreas(providerMissions: ProviderMission[]): MissionGraph['areas'] {
  const byArea = new Map<StackWiringArea, ProviderMission[]>();
  for (const mission of providerMissions) {
    const list = byArea.get(mission.area) ?? [];
    list.push(mission);
    byArea.set(mission.area, list);
  }

  const AREA_LABELS: Record<StackWiringArea, string> = {
    appFlow: 'App Flow',
    frontend: 'Frontend',
    backend: 'Backend / API',
    database: 'Database',
    auth: 'Auth',
    payments: 'Payments',
    deployment: 'Deployment',
    monitoring: 'Monitoring',
    security: 'Security',
    testing: 'Testing',
    landing: 'Landing / Onboarding',
    errorHandling: 'Error Handling'
  };

  return [...byArea.entries()].map(([key, missions]) => {
    const repoChecks = missions.flatMap((m) => m.checks).filter(isRepoLayerMissionCheck);
    const providerChecks = missions.flatMap((m) => m.checks).filter(isProviderLayerMissionCheck);
    const repoReadinessPercent = percentVerified(repoChecks);
    const providerReadinessPercent = percentVerified(providerChecks);
    const criticalCount = missions
      .flatMap((m) => m.checks)
      .filter(
        (check) =>
          isProviderLayerMissionCheck(check) &&
          (check.verificationStatus === 'missing' || check.status === 'missing' || check.status === 'failed')
      ).length;

    return {
      key,
      label: AREA_LABELS[key],
      readinessPercent: repoReadinessPercent,
      repoReadinessPercent,
      providerReadinessPercent,
      criticalCount,
      providerMissions: missions
    };
  });
}

function percentVerified(checks: MissionCheck[]): number {
  if (checks.length === 0) {
    return 100;
  }
  const verified = checks.filter((check) => isVerifiedMissionCheck(check)).length;
  return Math.round((verified / checks.length) * 100);
}

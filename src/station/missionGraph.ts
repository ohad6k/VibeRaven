import type {
  MissionArea,
  MissionCheck,
  MissionCheckStatus,
  MissionEvidenceClass,
  MissionGraph,
  ProviderMission,
  RepositoryEvidenceSummary,
  StackWiringArea,
  StackWiringItem,
  StackWiringProviderSummary,
  StackWiringSummary
} from './types';
import { stackWiringKeyHasMcp } from './providerRegistry';
import type { SifgGraph, SifgLeak, SifgPipeline } from './sifgTypes';
import { mergeVerificationIntoMissionGraph } from './verificationLayer/mergeIntoMissionGraph';
import type { VerificationLayerSnapshot } from './verificationLayer/types';

type BuildMissionGraphInput = {
  stackWiring: StackWiringSummary;
  repositoryEvidence: RepositoryEvidenceSummary;
  staticInfrastructureFlowGraph?: SifgGraph;
  verificationLayer?: VerificationLayerSnapshot;
};

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

export function buildMissionGraph(input: BuildMissionGraphInput): MissionGraph {
  const providerMissions = input.stackWiring.items.map(toProviderMission);
  if (input.staticInfrastructureFlowGraph) {
    overlaySifgLeaks(providerMissions, input.staticInfrastructureFlowGraph);
  }
  const byProvider = providerMissions.reduce<MissionGraph['byProvider']>((acc, mission) => {
    acc[mission.key] = mission;
    return acc;
  }, {});
  const areas = buildAreas(providerMissions);
  const byArea = areas.reduce<MissionGraph['byArea']>((acc, area) => {
    acc[area.key] = area;
    return acc;
  }, {});

  const graph: MissionGraph = {
    areas,
    byArea,
    byProvider,
    repositoryEvidence: input.repositoryEvidence,
    ...(input.staticInfrastructureFlowGraph
      ? { staticInfrastructureFlowGraph: input.staticInfrastructureFlowGraph }
      : {})
  };
  return input.verificationLayer ? mergeVerificationIntoMissionGraph(graph, input.verificationLayer) : graph;
}

function toProviderMission(summary: StackWiringProviderSummary): ProviderMission {
  const checks = summary.items.map((item) => toMissionCheck(summary, item));
  if (stackWiringKeyHasMcp(summary.key)) {
    checks.push({
      id: `${summary.key}-mcp-verifier`,
      label: `${summary.providerLabel} MCP verifier available`,
      providerKey: summary.key,
      providerLabel: summary.providerLabel,
      area: summary.area,
      evidenceClass: 'mcp-verifier',
      status: 'needs-connection',
      evidence: [],
      promptHint: `Connect the official ${summary.providerLabel} MCP/tool verifier before claiming external dashboard state.`
    });
  }

  return {
    key: summary.key,
    provider: summary.provider,
    providerLabel: summary.providerLabel,
    area: summary.area,
    promptSubject: summary.promptSubject,
    readinessPercent: summary.readinessPercent,
    repoReadinessPercent: summary.readinessPercent,
    providerReadinessPercent: checks.some((check) => check.evidenceClass === 'mcp-verifier') ? 0 : 100,
    checks
  };
}

function toMissionCheck(summary: StackWiringProviderSummary, item: StackWiringItem): MissionCheck {
  const evidenceClass = evidenceClassForStatus(item.status);
  return {
    id: item.id,
    label: item.label,
    providerKey: summary.key,
    providerLabel: summary.providerLabel,
    area: summary.area,
    evidenceClass,
    status: missionStatusForEvidenceClass(evidenceClass),
    evidence: item.evidence,
    promptHint: item.promptHint
  };
}

function evidenceClassForStatus(status: StackWiringItem['status']): MissionEvidenceClass {
  if (status === 'passed') {
    return 'repo-verified';
  }
  if (status === 'manual') {
    return 'manual-dashboard';
  }
  return 'missing-repo-fix';
}

function missionStatusForEvidenceClass(evidenceClass: MissionEvidenceClass): MissionCheckStatus {
  if (evidenceClass === 'repo-verified') {
    return 'passed';
  }
  if (evidenceClass === 'manual-dashboard') {
    return 'manual-required';
  }
  if (evidenceClass === 'mcp-verifier') {
    return 'needs-connection';
  }
  return 'missing';
}

function overlaySifgLeaks(providerMissions: ProviderMission[], graph: SifgGraph): void {
  const pipelinesById = new Map(graph.pipelines.map((pipeline) => [pipeline.id, pipeline]));
  const leaksByPipeline = new Map<string, SifgLeak[]>();
  const providerCheckIds = new Map(
    providerMissions.map((mission) => [
      mission.key,
      new Set(mission.checks.map((check) => check.id))
    ])
  );

  for (const leak of graph.leaks) {
    const leaks = leaksByPipeline.get(leak.pipelineId) ?? [];
    leaks.push(leak);
    leaksByPipeline.set(leak.pipelineId, leaks);
  }

  for (const [pipelineId, leaks] of leaksByPipeline.entries()) {
    const pipeline = pipelinesById.get(pipelineId);
    const providerKey = pipeline?.providerKey ?? leaks[0]?.providerKey;
    if (!providerKey) {
      continue;
    }

    const mission = providerMissions.find((candidate) => candidate.key === providerKey);
    if (!mission) {
      continue;
    }

    const usedCheckIds = providerCheckIds.get(mission.key) ?? new Set<string>();
    const check = toSifgMissionCheck(mission, pipeline, pipelineId, leaks, usedCheckIds);
    mission.checks.push(check);
    usedCheckIds.add(check.id);
    providerCheckIds.set(mission.key, usedCheckIds);
  }

  for (const mission of providerMissions) {
    mission.readinessPercent = readinessPercentForChecks(mission.checks);
  }
}

function toSifgMissionCheck(
  mission: ProviderMission,
  pipeline: SifgPipeline | undefined,
  pipelineId: string,
  leaks: SifgLeak[],
  usedCheckIds: Set<string>
): MissionCheck {
  const firstLeak = leaks[0];
  const baseCheckId = pipeline?.missionCheckIds[0] ?? firstLeak?.id ?? pipelineId;
  const checkId = uniqueSifgCheckId(baseCheckId, pipelineId, firstLeak?.id, usedCheckIds);
  const evidence = leaks.flatMap((leak) =>
    leak.evidencePath.map((step) => `${step.file}:${step.range.startLine}-${step.range.endLine}`)
  );

  return {
    id: checkId,
    label: pipeline?.label ?? firstLeak?.summary ?? 'SIFG structural leak',
    providerKey: mission.key,
    providerLabel: mission.providerLabel,
    area: mission.area,
    evidenceClass: 'missing-repo-fix',
    status: 'missing',
    evidence,
    promptHint: firstLeak?.repoFix.requiredOutcome ?? 'Fix the SIFG structural leak in repository code.',
    sifg: {
      pipelineId,
      leakIds: leaks.map((leak) => leak.id),
      proofStatus: 'leak'
    }
  };
}

function uniqueSifgCheckId(
  baseCheckId: string,
  pipelineId: string,
  leakId: string | undefined,
  usedCheckIds: Set<string>
): string {
  if (!usedCheckIds.has(baseCheckId)) {
    return baseCheckId;
  }

  const suffix = stableSifgSuffix(pipelineId) || (leakId ? stableSifgSuffix(leakId) : '') || 'sifg';
  const suffixed = `${baseCheckId}--${suffix}`;
  if (!usedCheckIds.has(suffixed)) {
    return suffixed;
  }

  let counter = 2;
  while (usedCheckIds.has(`${suffixed}-${counter}`)) {
    counter += 1;
  }
  return `${suffixed}-${counter}`;
}

function stableSifgSuffix(id: string): string {
  return id.split(':').filter(Boolean).at(-1)?.replace(/[^a-zA-Z0-9._-]/g, '-') ?? '';
}

function readinessPercentForChecks(checks: MissionCheck[]): number {
  const actionableChecks = checks.filter(isActionableCheck);
  const passed = actionableChecks.filter((check) => check.status === 'passed').length;
  return Math.round((passed / Math.max(actionableChecks.length, 1)) * 100);
}

function isActionableCheck(check: MissionCheck): boolean {
  return check.evidenceClass !== 'manual-dashboard' && check.evidenceClass !== 'mcp-verifier';
}

function buildAreas(providerMissions: ProviderMission[]): MissionArea[] {
  const byArea = new Map<StackWiringArea, ProviderMission[]>();
  for (const mission of providerMissions) {
    const current = byArea.get(mission.area) ?? [];
    current.push(mission);
    byArea.set(mission.area, current);
  }

  return [...byArea.entries()].map(([key, missions]) => {
    const actionableChecks = missions
      .flatMap((mission) => mission.checks)
      .filter(isActionableCheck);
    const passed = actionableChecks.filter((check) => check.status === 'passed').length;
    const missing = actionableChecks.filter((check) => check.status === 'missing' || check.status === 'failed').length;

    return {
      key,
      label: AREA_LABELS[key],
      readinessPercent: Math.round((passed / Math.max(actionableChecks.length, 1)) * 100),
      repoReadinessPercent: Math.round((passed / Math.max(actionableChecks.length, 1)) * 100),
      providerReadinessPercent: missions.some((mission) =>
        mission.checks.some((check) => check.evidenceClass === 'mcp-verifier')
      ) ? 0 : 100,
      criticalCount: missing,
      providerMissions: missions
    };
  });
}

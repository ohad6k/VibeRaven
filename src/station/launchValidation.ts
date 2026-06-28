import type {
  Gap,
  LaunchValidationIssue,
  LaunchValidationReport,
  MissionGraph,
  ModelStationOutput,
  ProductionConnectionArea,
  ProviderTruthRow,
  ProviderTruthSnapshot,
  VerificationArea
} from './types';

export interface BuildLaunchValidationReportInput {
  model?: ModelStationOutput;
  providerTruth?: ProviderTruthSnapshot;
  missionGraph?: MissionGraph;
  gaps?: Gap[];
  generatedAt?: string;
}

const VERIFICATION_AREAS: readonly VerificationArea[] = [
  'auth',
  'database',
  'payments',
  'deployment',
  'monitoring',
  'security',
  'testing',
  'landing',
  'frontend',
  'backend',
  'appFlow',
  'errorHandling'
];

const LAUNCH_CRITICAL_AREAS: readonly VerificationArea[] = [
  'auth',
  'database',
  'payments',
  'deployment',
  'security'
];

const LIVE_PROOF_REQUIRED_AREAS: readonly ProductionConnectionArea[] = [
  'auth',
  'database',
  'payments'
];

const ACTIONABLE_PROVIDER_CHECK_ROLES = [
  'using-now',
  'runtime-code',
  'selected',
  'conflict',
  'live-verified',
  'manual-confirmed'
] as const;

export function buildLaunchValidationReport(
  input: BuildLaunchValidationReportInput
): LaunchValidationReport {
  void input.missionGraph;

  const conflictIssues = (input.providerTruth?.areas ?? []).flatMap((area) =>
    area.conflicts.map((conflict, index): LaunchValidationIssue => ({
      id: `provider-conflict-${area.area}-${conflict.type}-${index}`,
      area: area.area,
      severity: conflict.severity,
      title: conflict.title,
      detail: conflict.detail,
      promptTemplate: conflict.recommendedAction.promptTemplate
    }))
  );

  const gapIssues = (input.gaps ?? [])
    .filter((gap) => gap.severity !== 'info')
    .map((gap): LaunchValidationIssue => {
      const area = gapArea(gap);
      return {
        id: `gap-${gap.id}`,
        area,
        severity: gap.severity,
        title: gap.title,
        detail: gap.detail,
        promptTemplate: gap.severity === 'critical' && isLaunchCriticalArea(area)
          ? 'launch-blocker'
          : 'repo-fix'
      };
    });

  const providerCoverageWarnings = providerCoverageIssues(input.providerTruth);

  const missingLiveProofWarnings = (input.providerTruth?.areas ?? [])
    .filter((area) =>
      area.liveVerified === null &&
      providerLiveProofCandidate(area) !== null &&
      LIVE_PROOF_REQUIRED_AREAS.includes(area.area) &&
      !(
        hasCompletedManualConfirmation(providerLiveProofCandidate(area)!) &&
        providerLiveProofCandidate(area)!.mcpProof.status === 'unsupported'
      )
    )
    .map((area): LaunchValidationIssue => {
      const usingNow = providerLiveProofCandidate(area)!;
      const hasManualConfirmation = hasCompletedManualConfirmation(usingNow);
      return {
        id: `live-proof-missing-${area.area}-${usingNow.provider}`,
        area: area.area,
        severity: 'warning',
        title: hasManualConfirmation
          ? `${area.area} live proof is missing after manual confirmation`
          : `${area.area} live proof is missing`,
        detail: hasManualConfirmation
          ? `${usingNow.providerLabel} manual proof is complete, but live provider proof has not been verified.`
          : `${usingNow.providerLabel} has runtime repo evidence, but no live provider proof has been verified.`,
        promptTemplate: usingNow.mcpProof.status === 'unsupported'
          ? 'manual-check'
          : 'mcp-verification'
      };
    });

  const missingLiveProofKeys = new Set(
    missingLiveProofWarnings.map((issue) => issue.id.replace('live-proof-missing-', ''))
  );
  const providerRows = (input.providerTruth?.areas ?? []).flatMap((area) =>
    area.rows.map((row) => ({
      row,
      skipCheck: missingLiveProofKeys.has(`${row.area}-${row.provider}`)
    }))
  );
  const mcpChecks = providerRows
    .filter(({ row, skipCheck }) =>
      !skipCheck &&
      isActionableProviderCheckRow(row) &&
      row.roles.some((role) => role === 'needs-mcp' || role === 'mcp-failed')
    )
    .map(({ row }): LaunchValidationIssue => ({
      id: `mcp-check-${row.area}-${row.provider}`,
      area: row.area,
      severity: 'warning',
      title: `${row.providerLabel} MCP verification required`,
      detail: `${row.providerLabel} needs MCP verification before launch confidence is clean.`,
      promptTemplate: 'mcp-verification'
    }));
  const manualChecks = providerRows
    .filter(({ row, skipCheck }) =>
      !skipCheck &&
      isActionableProviderCheckRow(row) &&
      !hasCompletedManualConfirmation(row) &&
      row.roles.some((role) => role === 'manual-only')
    )
    .map(({ row }): LaunchValidationIssue => ({
      id: `manual-check-${row.area}-${row.provider}`,
      area: row.area,
      severity: 'warning',
      title: `${row.providerLabel} manual verification required`,
      detail: `${row.providerLabel} requires manual provider proof review.`,
      promptTemplate: 'manual-check'
    }));

  const criticalConflictIssues = conflictIssues.filter((issue) => issue.severity === 'critical');
  const blockingGapIssues = gapIssues.filter((issue) =>
    issue.severity === 'critical' && isLaunchCriticalArea(issue.area)
  );
  const blockers = [...criticalConflictIssues, ...blockingGapIssues];
  const warnings = [
    ...conflictIssues.filter((issue) => issue.severity !== 'critical'),
    ...gapIssues
      .filter((issue) => issue.severity !== 'critical' || !isLaunchCriticalArea(issue.area))
      .map((issue) => issue.severity === 'critical' ? { ...issue, severity: 'warning' as const } : issue),
    ...providerCoverageWarnings,
    ...missingLiveProofWarnings
  ];
  const status = blockers.length > 0
    ? 'no-go'
    : warnings.length > 0 || manualChecks.length > 0 || mcpChecks.length > 0
      ? 'go-with-warnings'
      : 'go';

  return {
    version: 1,
    generatedAt: input.generatedAt ?? input.providerTruth?.generatedAt ?? new Date().toISOString(),
    status,
    score: input.model?.score ?? 0,
    summary: launchSummary(status, blockers.length),
    blockers,
    warnings,
    manualChecks,
    mcpChecks
  };
}

function providerCoverageIssues(providerTruth?: ProviderTruthSnapshot): LaunchValidationIssue[] {
  if (!providerTruth || providerTruth.areas.length === 0) {
    return [
      {
        id: 'provider-truth-incomplete',
        area: 'appFlow',
        severity: 'warning',
        title: 'Provider truth is incomplete',
        detail: 'Provider truth was not available, so launch validation needs manual provider confirmation before returning a clean go.',
        promptTemplate: 'manual-check'
      }
    ];
  }

  const hasLaunchCriticalProviderTruth = providerTruth.areas.some((area) =>
    isLaunchCriticalArea(area.area) &&
    (
      Boolean(area.usingNow) ||
      Boolean(area.runtimeDetected) ||
      Boolean(area.liveVerified) ||
      area.rows.some(isActionableProviderCheckRow)
    )
  );

  if (hasLaunchCriticalProviderTruth) {
    return [];
  }

  return [
    {
      id: 'launch-critical-provider-truth-missing',
      area: 'appFlow',
      severity: 'warning',
      title: 'Launch-critical provider truth is missing',
      detail: 'No launch-critical provider area has checked provider state, so provider coverage must be verified before returning a clean go.',
      promptTemplate: 'mcp-verification'
    }
  ];
}

function providerLiveProofCandidate(area: ProviderTruthSnapshot['areas'][number]): ProviderTruthRow | null {
  if (area.liveVerified) {
    return null;
  }
  return area.runtimeDetected ?? area.usingNow ?? null;
}

function isActionableProviderCheckRow(row: ProviderTruthRow): boolean {
  return row.roles.some((role) => ACTIONABLE_PROVIDER_CHECK_ROLES.includes(
    role as (typeof ACTIONABLE_PROVIDER_CHECK_ROLES)[number]
  ));
}

function hasCompletedManualConfirmation(row: ProviderTruthRow): boolean {
  return row.manualProof.status === 'manual-confirmed' ||
    row.roles.some((role) => role === 'manual-confirmed');
}

function gapArea(gap: Gap): ProductionConnectionArea | VerificationArea {
  return VERIFICATION_AREAS.includes(gap.primaryMapCategory as VerificationArea)
    ? (gap.primaryMapCategory as VerificationArea)
    : 'appFlow';
}

function isLaunchCriticalArea(area: ProductionConnectionArea | VerificationArea): boolean {
  return LAUNCH_CRITICAL_AREAS.includes(area as VerificationArea);
}

function launchSummary(status: LaunchValidationReport['status'], blockerCount: number): string {
  if (status === 'no-go') {
    return `${blockerCount} launch blocker${blockerCount === 1 ? '' : 's'}`;
  }
  if (status === 'go-with-warnings') {
    return 'Launchable only with remaining warnings and provider proof checks';
  }
  return 'No critical launch blockers detected';
}

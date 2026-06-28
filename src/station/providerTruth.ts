import {
  normalizeProductionChoice,
  PROVIDER_RULES,
  type ProductionConnectionChoices,
  type ProviderDetectionRule
} from './productionConnections';
import { mcpTemplateForProvider, providerLabel } from './providerRegistry';
import type {
  McpVerifierStateSnapshot,
  ProductionConnectionArea,
  ProductionConnectionProvider,
  ProviderTruthArea,
  ProviderTruthConfidence,
  ProviderTruthConflict,
  ProviderTruthEvidenceItem,
  ProviderTruthEvidenceKind,
  ProviderTruthRecommendedAction,
  ProviderTruthRole,
  ProviderTruthRow,
  ProviderTruthSnapshot,
  ScanResult
} from './types';
import type { VerificationLayerSnapshot } from './verificationLayer/types';

export interface BuildProviderTruthInput {
  scan: ScanResult;
  choices: ProductionConnectionChoices;
  mcpVerifierState?: McpVerifierStateSnapshot;
  verificationLayer?: VerificationLayerSnapshot;
  generatedAt?: string;
}

type ProviderEvidencePathClass = 'runtime' | 'weak';

type ScannableFile = {
  path: string;
  displayPath: string;
  content: string;
  executableContent: string;
  lowerContent: string;
  lowerExecutableContent: string;
};

const AREAS: ProductionConnectionArea[] = [
  'database',
  'auth',
  'payments',
  'deployment',
  'monitoring',
  'security'
];

const WEAK_PATH_SEGMENTS = new Set([
  'tmp',
  'out',
  'outputs',
  'videos',
  'marketing',
  'docs',
  'tests',
  '__tests__',
  'examples',
  'demo'
]);

const TEST_FILE_PATTERN = /\.(test|spec)\.[jt]sx?$/;

export function classifyProviderEvidencePath(path: string): ProviderEvidencePathClass {
  const normalized = normalizePath(path);
  const segments = normalized.split('/').filter(Boolean);

  if (
    isDocsLikePath(normalized) ||
    segments.some((segment) => WEAK_PATH_SEGMENTS.has(segment)) ||
    TEST_FILE_PATTERN.test(normalized)
  ) {
    return 'weak';
  }

  return 'runtime';
}

export function buildProviderTruthSnapshot(input: BuildProviderTruthInput): ProviderTruthSnapshot {
  const choices = normalizeProductionChoice(input.choices);
  const deps = input.scan.packageDeps.map((dep) => dep.toLowerCase());
  const files = input.scan.files.map(toScannableFile);
  const pathLines = collectPathLines(input.scan, files);
  const rowsByArea: Partial<Record<ProductionConnectionArea, ProviderTruthRow[]>> = {};

  void input.mcpVerifierState;
  void input.verificationLayer;

  for (const rule of PROVIDER_RULES) {
    const evidence = collectProviderTruthEvidence(rule, deps, files, pathLines);
    const selected = choices.choices[rule.area]?.provider === rule.provider;

    if (evidence.length === 0 && !selected) {
      continue;
    }

    const row = buildRow(rule, evidence, selected);
    rowsByArea[rule.area] = [...(rowsByArea[rule.area] ?? []), row];
  }

  for (const [area, choice] of Object.entries(choices.choices) as Array<[
    ProductionConnectionArea,
    { provider: ProductionConnectionProvider } | undefined
  ]>) {
    if (!choice) {
      continue;
    }

    const existing = rowsByArea[area]?.some((row) => row.provider === choice.provider);
    if (existing) {
      continue;
    }

    rowsByArea[area] = [
      ...(rowsByArea[area] ?? []),
      buildSelectedOnlyRow(area, choice.provider)
    ];
  }

  const areas = AREAS.map((area) => buildArea(area, rowsByArea[area] ?? []));
  const summary = {
    liveVerifiedCount: areas.filter((area) => area.liveVerified).length,
    conflictCount: areas.reduce((count, area) => count + area.conflicts.length, 0),
    needsMcpCount: areas.reduce(
      (count, area) => count + area.rows.filter((row) => row.roles.includes('needs-mcp')).length,
      0
    ),
    manualOnlyCount: areas.reduce((count, area) => count + area.rows.filter(rowRequiresManualFallback).length, 0)
  };

  return {
    version: 1,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    areas,
    summary
  };
}

function collectProviderTruthEvidence(
  rule: ProviderDetectionRule,
  deps: string[],
  files: ScannableFile[],
  pathLines: string[]
): ProviderTruthEvidenceItem[] {
  const evidence: ProviderTruthEvidenceItem[] = [];

  for (const dep of deps) {
    if ((rule.packages ?? []).some((pattern) => testRegex(pattern, dep))) {
      addEvidence(evidence, rule, {
        kind: 'package-installed',
        strength: 'medium',
        label: `${rule.label} package installed`,
        detail: dep,
        points: 20,
        isRuntimeEvidence: false
      });
    }
  }

  for (const path of pathLines) {
    if (!(rule.paths ?? []).some((pattern) => testRegex(pattern, path))) {
      continue;
    }

    const pathClass = classifyProviderEvidencePath(path);
    const kind = weakPathKind(path, 'active-runtime-route') ?? routeKind(path);
    addEvidence(evidence, rule, {
      kind,
      strength: pathClass === 'runtime' ? 'strong' : 'weak',
      label: `${rule.label} ${pathClass === 'runtime' ? 'runtime route or path' : 'weak path reference'}`,
      file: path,
      points: pathClass === 'runtime' ? 35 : weakEvidencePoints(path),
      isRuntimeEvidence: pathClass === 'runtime'
    });
  }

  for (const file of files) {
    const pathClass = classifyProviderEvidencePath(file.path);
    const sourceContent = pathClass === 'runtime' ? file.executableContent : file.content;
    const sourceLowerContent = pathClass === 'runtime' ? file.lowerExecutableContent : file.lowerContent;

    for (const envName of rule.env ?? []) {
      if (!sourceContent.toUpperCase().includes(envName.toUpperCase())) {
        continue;
      }

      addEvidence(evidence, rule, {
        kind: pathClass === 'runtime' ? 'runtime-env-usage' : 'env-name-only',
        strength: pathClass === 'runtime' ? 'medium' : 'weak',
        label: `${rule.label} env name ${pathClass === 'runtime' ? 'used in runtime source' : 'mentioned outside runtime source'}`,
        file: file.displayPath,
        detail: envName,
        points: pathClass === 'runtime' ? 20 : weakEvidencePoints(file.path),
        isRuntimeEvidence: pathClass === 'runtime'
      });
    }

    for (const importName of rule.imports ?? []) {
      if (!containsImport(sourceLowerContent, importName)) {
        continue;
      }

      const weakKind = weakPathKind(file.path, 'sdk-import-source');
      addEvidence(evidence, rule, {
        kind: weakKind ?? 'sdk-import-source',
        strength: pathClass === 'runtime' ? 'strong' : 'weak',
        label: `${rule.label} SDK import ${pathClass === 'runtime' ? 'in runtime source' : 'outside runtime source'}`,
        file: file.displayPath,
        detail: importName,
        points: pathClass === 'runtime' ? 35 : weakEvidencePoints(file.path),
        isRuntimeEvidence: pathClass === 'runtime'
      });
    }

    for (const item of rule.content ?? []) {
      if (!testRegex(item.pattern, sourceContent)) {
        continue;
      }

      const strongKind = contentSignalKind(item.signal);
      const weakKind = weakPathKind(file.path, strongKind);
      addEvidence(evidence, rule, {
        kind: weakKind ?? strongKind,
        strength: pathClass === 'runtime' ? 'strong' : 'weak',
        label: `${rule.label} ${pathClass === 'runtime' ? 'runtime content signal' : 'weak content reference'}`,
        file: file.displayPath,
        detail: item.signal,
        points: pathClass === 'runtime' ? 35 : weakEvidencePoints(file.path),
        isRuntimeEvidence: pathClass === 'runtime'
      });
    }

    if (isDocsLikePath(file.path)) {
      for (const docsTerm of rule.docs ?? []) {
        if (!file.lowerContent.includes(docsTerm.toLowerCase())) {
          continue;
        }

        addEvidence(evidence, rule, {
          kind: 'docs-mention',
          strength: 'weak',
          label: `${rule.label} mentioned in docs`,
          file: file.displayPath,
          detail: docsTerm,
          points: 4,
          isRuntimeEvidence: false
        });
        break;
      }
    }
  }

  return evidence.sort(compareEvidence);
}

function buildRow(
  rule: ProviderDetectionRule,
  evidence: ProviderTruthEvidenceItem[],
  selected: boolean
): ProviderTruthRow {
  const score = evidence.reduce((total, item) => total + item.points, 0);
  const roles = rolesForEvidence(evidence, selected);
  applyMcpSupportRoles(rule.provider, roles);
  const confidence = confidenceForEvidence(evidence, roles);
  const mcpProof = mcpProofForProvider(rule.provider);

  return {
    area: rule.area,
    provider: rule.provider,
    providerLabel: providerLabel(rule.provider),
    roles,
    confidence,
    score,
    statusBadges: statusBadgesForRoles(roles, confidence),
    evidence,
    mcpProof,
    manualProof: {
      status: 'not-checked',
      evidence: []
    },
    recommendedActions: [recommendedActionForRoles(roles)]
  };
}

function buildSelectedOnlyRow(area: ProductionConnectionArea, provider: ProductionConnectionProvider): ProviderTruthRow {
  const roles: ProviderTruthRole[] = ['selected'];
  applyMcpSupportRoles(provider, roles);
  const mcpProof = mcpProofForProvider(provider);

  return {
    area,
    provider,
    providerLabel: providerLabel(provider),
    roles,
    confidence: 'low',
    score: 0,
    statusBadges: ['SELECTED'],
    evidence: [],
    mcpProof,
    manualProof: {
      status: 'not-checked',
      evidence: []
    },
    recommendedActions: [recommendedActionForRoles(roles)]
  };
}

function buildArea(area: ProductionConnectionArea, rows: ProviderTruthRow[]): ProviderTruthArea {
  const sortedRows = rows.sort(compareRows);
  const runtimeDetected = sortedRows.find((row) =>
    row.evidence.some((item) => item.strength === 'strong' && item.isRuntimeEvidence)
  ) ?? null;

  for (const row of sortedRows) {
    row.roles = row.roles.filter((role) => role !== 'using-now');
    if (row === runtimeDetected) {
      addRole(row.roles, 'runtime-code');
      row.confidence = 'high';
    } else {
      row.roles = row.roles.filter((role) => role !== 'runtime-code');
      row.confidence = confidenceForEvidence(row.evidence, row.roles);
    }
    row.statusBadges = statusBadgesForRoles(row.roles, row.confidence);
    row.recommendedActions = [recommendedActionForRoles(row.roles)];
  }

  const selected = sortedRows.find((row) => row.roles.includes('selected')) ?? null;
  const liveVerified = sortedRows.find((row) =>
    row.roles.includes('live-verified') || row.mcpProof.status === 'live-verified'
  ) ?? null;
  if (liveVerified) {
    addRole(liveVerified.roles, 'using-now');
    liveVerified.statusBadges = statusBadgesForRoles(liveVerified.roles, liveVerified.confidence);
    liveVerified.recommendedActions = [recommendedActionForRoles(liveVerified.roles)];
  }
  const usingNow = liveVerified;
  const conflicts = conflictsForArea(area, selected, runtimeDetected);

  if (conflicts.length > 0) {
    for (const row of sortedRows) {
      if (conflicts.some((conflict) => conflict.providerKeys.includes(row.provider))) {
        addRole(row.roles, 'conflict');
        row.statusBadges = statusBadgesForRoles(row.roles, row.confidence);
        row.recommendedActions = [recommendedActionForRoles(row.roles)];
      }
    }
  }

  return {
    area,
    rows: sortedRows,
    usingNow,
    runtimeDetected,
    liveVerified,
    selected,
    conflicts,
    recommendedAction: areaRecommendedAction(area, sortedRows, conflicts)
  };
}

function conflictsForArea(
  area: ProductionConnectionArea,
  selected: ProviderTruthRow | null,
  runtimeDetected: ProviderTruthRow | null
): ProviderTruthConflict[] {
  if (!selected || !runtimeDetected || selected.provider === runtimeDetected.provider || runtimeDetected.confidence !== 'high') {
    return [];
  }

  return [
    {
      type: 'selected-vs-repo',
      severity: launchCriticalArea(area) ? 'critical' : 'warning',
      title: `${area} provider mismatch`,
      detail: `${selected.providerLabel} is selected, but runtime repository evidence points to ${runtimeDetected.providerLabel}. Decide which provider is intended before launch validation continues.`,
      providerKeys: [selected.provider, runtimeDetected.provider],
      evidence: runtimeDetected.evidence,
      recommendedAction: {
        kind: 'resolve-conflict',
        label: 'Resolve provider mismatch',
        reason: 'The selected provider differs from high-confidence runtime repo evidence.',
        promptTemplate: 'provider-mismatch-decision',
        primary: true
      }
    }
  ];
}

function rolesForEvidence(evidence: ProviderTruthEvidenceItem[], selected: boolean): ProviderTruthRole[] {
  const roles: ProviderTruthRole[] = [];
  const hasStrongRuntime = evidence.some((item) => item.strength === 'strong' && item.isRuntimeEvidence);
  const hasRepoEvidence = evidence.length > 0;
  const hasOnlyDocs = evidence.length > 0 && evidence.every((item) => item.kind === 'docs-mention');
  const hasWeakNonRuntimeSource = evidence.some(
    (item) => item.strength === 'weak' && !item.isRuntimeEvidence && item.kind !== 'package-installed'
  );
  const hasOnlyPackages = evidence.length > 0 && evidence.every((item) => item.kind === 'package-installed');

  if (hasStrongRuntime) {
    roles.push('runtime-code');
  }
  if (selected) {
    roles.push('selected');
  }
  if (hasRepoEvidence) {
    roles.push('detected-in-repo');
  }
  if (hasOnlyDocs) {
    roles.push('mentioned-only');
  } else if (hasWeakNonRuntimeSource && !hasStrongRuntime) {
    roles.push('legacy-or-unused');
  }
  if (hasOnlyPackages) {
    roles.push('alternative');
  }

  return roles.length > 0 ? roles : ['alternative'];
}

function confidenceForEvidence(
  evidence: ProviderTruthEvidenceItem[],
  roles: ProviderTruthRole[]
): ProviderTruthConfidence {
  if (roles.includes('live-verified') || roles.includes('using-now') || roles.includes('runtime-code')) {
    return 'high';
  }
  if (evidence.some((item) => item.strength === 'medium')) {
    return 'medium';
  }
  if (evidence.length > 0 || roles.includes('selected')) {
    return 'low';
  }
  return 'none';
}

function recommendedActionForRoles(roles: ProviderTruthRole[]): ProviderTruthRecommendedAction {
  if (roles.includes('conflict')) {
    return {
      kind: 'resolve-conflict',
      label: 'Resolve provider mismatch',
      reason: 'This provider is part of a selected-vs-repository mismatch that must be resolved before launch validation continues.',
      promptTemplate: 'provider-mismatch-decision',
      primary: true
    };
  }

  if (roles.includes('needs-mcp')) {
    return {
      kind: 'connect-mcp',
      label: 'Connect MCP and verify provider',
      reason: 'This provider has an MCP template, but no live provider proof was checked in this task.',
      promptTemplate: 'mcp-verification',
      primary: true
    };
  }

  if (roles.includes('manual-only')) {
    return {
      kind: 'manual-check',
      label: 'Verify provider manually',
      reason: 'No MCP template is available for this provider, so live proof requires manual dashboard verification.',
      promptTemplate: 'manual-check',
      primary: true
    };
  }

  if (roles.includes('live-verified') || roles.includes('using-now')) {
    return {
      kind: 'none',
      label: 'Live provider verified',
      reason: 'Authenticated MCP/API proof verified this provider as live.',
      promptTemplate: null,
      primary: false
    };
  }

  if (roles.includes('runtime-code')) {
    return {
      kind: 'manual-check',
      label: 'Confirm provider in dashboard',
      reason: 'Runtime repo evidence exists, but no live provider proof was checked in this task.',
      promptTemplate: 'manual-check',
      primary: true
    };
  }

  if (roles.includes('mentioned-only') || roles.includes('legacy-or-unused')) {
    return {
      kind: 'manual-check',
      label: 'Check whether this provider is still intended',
      reason: 'Evidence appears outside runtime source, so it should not be treated as active.',
      promptTemplate: 'manual-check',
      primary: true
    };
  }

  return {
    kind: 'connect-mcp',
    label: 'Connect MCP or verify manually',
    reason: 'Repo evidence alone cannot prove a live provider connection.',
    promptTemplate: 'mcp-verification',
    primary: true
  };
}

function areaRecommendedAction(
  area: ProductionConnectionArea,
  rows: ProviderTruthRow[],
  conflicts: ProviderTruthConflict[]
): ProviderTruthRecommendedAction {
  const primaryConflict = conflicts.find((conflict) => conflict.recommendedAction.primary);
  if (primaryConflict) {
    return primaryConflict.recommendedAction;
  }

  const primary = rows[0]?.recommendedActions[0];
  if (primary) {
    return primary;
  }

  return {
    kind: 'manual-check',
    label: `Review ${area} provider`,
    reason: 'No provider candidates were found in the repository scan.',
    promptTemplate: 'manual-check',
    primary: true
  };
}

function statusBadgesForRoles(roles: ProviderTruthRole[], confidence: ProviderTruthConfidence): string[] {
  const badges: string[] = [];
  if (roles.includes('conflict')) {
    badges.push('CONFLICT');
  }
  if (roles.includes('live-verified')) {
    badges.push('USING NOW');
  }
  if (roles.includes('runtime-code') || roles.includes('using-now')) {
    badges.push('RUNTIME CODE');
  }
  if (roles.includes('detected-in-repo')) {
    badges.push('REPO EVIDENCE');
  }
  if (roles.includes('legacy-or-unused')) {
    badges.push('LEGACY OR UNUSED');
  }
  if (roles.includes('needs-mcp')) {
    badges.push('NEEDS MCP');
  }
  if (roles.includes('manual-only')) {
    badges.push('MANUAL ONLY');
  }
  if (roles.includes('mentioned-only')) {
    badges.push('MENTIONED ONLY');
  }
  if (roles.includes('selected')) {
    badges.push('SELECTED');
  }
  badges.push(confidence.toUpperCase());
  return badges;
}

function addEvidence(
  evidence: ProviderTruthEvidenceItem[],
  rule: ProviderDetectionRule,
  item: Omit<ProviderTruthEvidenceItem, 'id' | 'isLiveProof' | 'isManualProof'>
): void {
  const id = [
    rule.area,
    rule.provider,
    item.kind,
    item.file ?? '',
    item.detail ?? item.label
  ].map(slug).filter(Boolean).join('-');

  if (evidence.some((existing) => existing.id === id)) {
    return;
  }

  evidence.push({
    id,
    ...item,
    isLiveProof: false,
    isManualProof: false
  });
}

function weakPathKind(path: string, fallback: ProviderTruthEvidenceKind): ProviderTruthEvidenceKind | null {
  if (classifyProviderEvidencePath(path) === 'runtime') {
    return null;
  }
  if (isDocsLikePath(path)) {
    return 'docs-mention';
  }
  if (/(^|\/)(__tests__|tests)(\/|$)|\.(test|spec)\.[jt]sx?$/.test(normalizePath(path))) {
    return 'test-reference';
  }
  if (/(^|\/)(tmp|out|outputs|videos|marketing|examples|demo)(\/|$)/.test(normalizePath(path))) {
    return 'tmp-demo-example';
  }
  return fallback;
}

function routeKind(path: string): ProviderTruthEvidenceKind {
  if (/webhook/.test(path)) {
    return 'webhook-handler';
  }
  if (/checkout|billing/.test(path)) {
    return 'checkout-handler';
  }
  if (/config|\.json$|\.toml$|\.ya?ml$/.test(path)) {
    return 'deployment-config';
  }
  return 'active-runtime-route';
}

function contentSignalKind(signal: string): ProviderTruthEvidenceKind {
  if (/checkout/i.test(signal)) {
    return 'checkout-handler';
  }
  if (/webhook/i.test(signal)) {
    return 'webhook-handler';
  }
  if (/config/i.test(signal)) {
    return 'provider-config';
  }
  return 'active-runtime-route';
}

function weakEvidencePoints(path: string): number {
  if (isDocsLikePath(path)) {
    return 4;
  }
  if (/(^|\/)(__tests__|tests)(\/|$)|\.(test|spec)\.[jt]sx?$/.test(normalizePath(path))) {
    return 6;
  }
  return 8;
}

function toScannableFile(file: ScanResult['files'][number]): ScannableFile {
  const content = file.isSecret || typeof file.content !== 'string' ? '' : file.content;
  const executableContent = stripComments(content);
  return {
    path: normalizePath(file.path),
    displayPath: file.path.replace(/\\/g, '/'),
    content,
    executableContent,
    lowerContent: content.toLowerCase(),
    lowerExecutableContent: executableContent.toLowerCase()
  };
}

function collectPathLines(scan: ScanResult, files: ScannableFile[]): string[] {
  const paths = new Set<string>();

  for (const path of scan.fileTree.split(/\r?\n/)) {
    const normalized = normalizePath(path.trim());
    if (normalized) {
      paths.add(normalized);
    }
  }
  for (const file of files) {
    paths.add(file.path);
  }

  return [...paths];
}

function containsImport(content: string, importName: string): boolean {
  const escaped = importName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase();
  return new RegExp(`(?:from\\s+['"]${escaped}['"]|import\\s*\\(\\s*['"]${escaped}['"]|require\\s*\\(\\s*['"]${escaped}['"])`).test(content);
}

function isDocsLikePath(path: string): boolean {
  const normalized = normalizePath(path);
  return /(^|\/)(readme|product|spec)\.mdx?$/.test(normalized) || /(^|\/)docs\/.*\.mdx?$/.test(normalized);
}

function stripComments(content: string): string {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function compareRows(a: ProviderTruthRow, b: ProviderTruthRow): number {
  return rowPriority(b) - rowPriority(a) || b.score - a.score || a.provider.localeCompare(b.provider);
}

function compareEvidence(a: ProviderTruthEvidenceItem, b: ProviderTruthEvidenceItem): number {
  return b.points - a.points || a.kind.localeCompare(b.kind) || (a.file ?? '').localeCompare(b.file ?? '');
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').toLowerCase();
}

function rowPriority(row: ProviderTruthRow): number {
  if (row.roles.includes('live-verified')) {
    return 600;
  }
  if (row.roles.includes('runtime-code') || row.roles.includes('using-now')) {
    return 500;
  }
  if (row.evidence.some((item) => item.strength === 'strong' && item.isRuntimeEvidence)) {
    return 450;
  }
  if (row.roles.includes('selected')) {
    return 400;
  }
  if (
    row.roles.includes('detected-in-repo') &&
    row.evidence.some((item) => item.strength !== 'weak' && item.kind !== 'package-installed')
  ) {
    return 300;
  }
  if (row.roles.includes('detected-in-repo')) {
    return 200;
  }
  return 100;
}

function rowRequiresManualFallback(row: ProviderTruthRow): boolean {
  return row.roles.includes('manual-only') || row.mcpProof.status === 'unsupported';
}

function launchCriticalArea(area: ProductionConnectionArea): boolean {
  return area === 'payments' ||
    area === 'auth' ||
    area === 'database' ||
    area === 'deployment' ||
    area === 'security';
}

function applyMcpSupportRoles(provider: ProductionConnectionProvider, roles: ProviderTruthRole[]): void {
  addRole(roles, mcpTemplateForProvider(provider) ? 'needs-mcp' : 'manual-only');
}

function mcpProofForProvider(provider: ProductionConnectionProvider): ProviderTruthRow['mcpProof'] {
  const template = mcpTemplateForProvider(provider);
  if (!template) {
    return {
      status: 'unsupported',
      evidence: [],
      readOnly: true
    };
  }

  return {
    status: 'needs-mcp',
    providerServerId: template.serverName,
    evidence: [],
    readOnly: true
  };
}

function testRegex(pattern: RegExp, value: string): boolean {
  pattern.lastIndex = 0;
  return pattern.test(value);
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function addRole(roles: ProviderTruthRole[], role: ProviderTruthRole): void {
  if (!roles.includes(role)) {
    roles.unshift(role);
  }
}

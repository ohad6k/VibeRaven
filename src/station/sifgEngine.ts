import { extractSifgCandidates, type SifgCandidate } from './sifgExtractors';
import { allSifgTemplates, type SifgTemplate } from './sifgTemplates';
import type { ScanResult } from './types';
import type {
  SifgEdge,
  SifgGraph,
  SifgGraphStatus,
  SifgLeak,
  SifgNode,
  SifgNodeKind,
  SifgPipeline,
  SifgSeverity
} from './sifgTypes';

const STRIPE_PIPELINE_ID_PREFIX = 'pipeline:payments:stripe:webhook-ingress';
const STRIPE_LEAK_ID_PREFIX = 'leak:payments:stripe:missing-signature-before-db';
const STRIPE_MISSION_CHECK_ID = 'stripe-webhook-signature-verification';

export function buildStaticInfrastructureFlowGraph(scan: ScanResult, now = new Date()): SifgGraph {
  const candidates = extractSifgCandidates(scan);
  const templates = allSifgTemplates();
  const nodeIndex = new Map<SifgCandidate, SifgNode>();
  const usedNodeIds = new Set<string>();

  const nodes = [...candidates.sources, ...candidates.guards, ...candidates.sinks].map((candidate) => {
    const node = candidateToNode(candidate, usedNodeIds);
    nodeIndex.set(candidate, node);
    return node;
  });

  const edges: SifgEdge[] = [];
  const pipelines: SifgPipeline[] = [];
  const leaks: SifgLeak[] = [];
  const stripeTemplate = templates.find((template) => template.id === 'template:payments:stripe:webhook-ingress');

  if (stripeTemplate && scan.stackSignals.hasStripe) {
    evaluateStripeWebhookIngress({
      candidates,
      nodeIndex,
      edges,
      pipelines,
      leaks,
      stripeTemplate
    });
  }

  return sanitizeGraph({
    version: 1,
    graphId: `sifg:workspace:${now.toISOString()}`,
    generatedAt: now.toISOString(),
    registryVersion: 1,
    status: graphStatus(pipelines, leaks),
    nodes,
    edges,
    pipelines,
    leaks
  });
}

interface StripeEvaluationInput {
  candidates: ReturnType<typeof extractSifgCandidates>;
  nodeIndex: Map<SifgCandidate, SifgNode>;
  edges: SifgEdge[];
  pipelines: SifgPipeline[];
  leaks: SifgLeak[];
  stripeTemplate: SifgTemplate;
}

function evaluateStripeWebhookIngress(input: StripeEvaluationInput): void {
  const stripeSources = input.candidates.sources
    .filter((candidate) =>
      candidate.kind === 'entrypoint' &&
      candidate.providerKey === 'stripe-payments' &&
      candidate.symbol === 'POST'
    )
    .sort(compareCandidatePosition);

  for (const sourceCandidate of stripeSources) {
    const source = input.nodeIndex.get(sourceCandidate);
    if (!source) {
      continue;
    }

    const sameFileGuards = input.candidates.guards
      .filter((candidate) => candidate.file === source.file && candidate.kind === 'signature-verifier')
      .sort(compareCandidatePosition);
    const sameFileSinks = input.candidates.sinks
      .filter((candidate) => candidate.file === source.file && candidate.kind === 'database-write')
      .sort(compareCandidatePosition);
    const guard = sameFileGuards.map((candidate) => input.nodeIndex.get(candidate)).find(isSifgNode);
    const sink = sameFileSinks.map((candidate) => input.nodeIndex.get(candidate)).find(isSifgNode);
    const hasUnknown = input.candidates.unknowns.some((unknown) => unknown.file === source.file);
    const requiredEdges: string[] = [];
    const forbiddenEdges: string[] = [];
    const sourceSuffix = sourceSlug(source);
    const pipelineId = `${STRIPE_PIPELINE_ID_PREFIX}:${sourceSuffix}`;

    let status: SifgGraphStatus = 'unknown';
    let severity: SifgSeverity = 'warning';

    if (guard && sink && guard.range.startLine < sink.range.startLine) {
      const edge = buildEdge(source, sink, 'guarded-flow', 'verified', guard);
      input.edges.push(edge);
      requiredEdges.push(edge.id);
      status = 'verified';
      severity = 'info';
    } else if (sink && (!guard || guard.range.startLine > sink.range.startLine)) {
      const edge = buildEdge(source, sink, 'forbidden-flow', 'leak');
      input.edges.push(edge);
      forbiddenEdges.push(edge.id);
      status = 'leak';
      severity = 'critical';
      input.leaks.push(buildStripeMissingSignatureLeak(
        source,
        sink,
        input.stripeTemplate,
        pipelineId,
        `${STRIPE_LEAK_ID_PREFIX}:${sourceSuffix}`
      ));
    } else if (hasUnknown) {
      const target = sink ?? guard ?? source;
      const edge = buildEdge(source, target, 'unknown-flow', 'unknown');
      input.edges.push(edge);
      requiredEdges.push(edge.id);
    }

    input.pipelines.push({
      id: pipelineId,
      area: 'payments',
      providerKey: 'stripe-payments',
      label: input.stripeTemplate.label,
      source: source.id,
      requiredEdges,
      forbiddenEdges,
      status,
      severity,
      missionCheckIds: [STRIPE_MISSION_CHECK_ID]
    });
  }
}

function candidateToNode(candidate: SifgCandidate, usedNodeIds: Set<string>): SifgNode {
  const baseId = sanitizeId(`node:${candidate.kind}:${candidate.file}:${candidate.range.startLine}`);
  const id = uniqueId(baseId, usedNodeIds);

  return {
    id,
    area: candidate.area,
    providerKey: candidate.providerKey,
    kind: candidate.kind,
    label: symbolicNodeLabel(candidate),
    file: candidate.file,
    range: { ...candidate.range },
    evidence: normalizeCandidateEvidence(candidate),
    secretPolicy: 'no-values'
  };
}

function buildEdge(
  source: SifgNode,
  target: SifgNode,
  kind: SifgEdge['kind'],
  status: SifgEdge['status'],
  guard?: SifgNode
): SifgEdge {
  return {
    id: sanitizeId(`edge:${kind}:${source.id}:${target.id}`),
    from: source.id,
    to: target.id,
    kind,
    status,
    evidence: [{
      file: target.file,
      range: target.range,
      proof: guard ? `${guard.kind}: ${guard.evidence.symbol ?? guard.label}` : target.kind
    }]
  };
}

function buildStripeMissingSignatureLeak(
  source: SifgNode,
  sink: SifgNode,
  stripeTemplate: SifgTemplate,
  pipelineId: string,
  leakId: string
): SifgLeak {
  const requiredGuard = stripeTemplate.requiredGuards.find((guard) => guard.kind === 'signature-verifier');
  const guardKind = normalizeTemplateGuardKind(requiredGuard?.kind);

  return {
    id: leakId,
    pipelineId,
    area: 'payments',
    providerKey: 'stripe-payments',
    kind: 'missing-mandatory-guard',
    severity: 'critical',
    summary: 'Stripe webhook request body reaches database code without proven signature verification.',
    evidencePath: [
      { nodeId: source.id, file: source.file, range: source.range, role: 'source' },
      { nodeId: sink.id, file: sink.file, range: sink.range, role: 'sink' }
    ],
    missingGuard: {
      expectedNodeKind: guardKind,
      expectedEvidence: buildExpectedGuardEvidence(requiredGuard, guardKind)
    },
    repoFix: {
      allowedFiles: [source.file],
      forbiddenFiles: [...stripeTemplate.repoFixPolicy.blockedFileGlobs],
      requiredOutcome: buildRequiredOutcome(requiredGuard, guardKind)
    }
  };
}

function graphStatus(pipelines: SifgPipeline[], leaks: SifgLeak[]): SifgGraphStatus {
  if (leaks.length > 0) {
    return 'leak';
  }

  if (pipelines.some((pipeline) => pipeline.status === 'unknown')) {
    return 'unknown';
  }

  if (pipelines.some((pipeline) => pipeline.status === 'verified')) {
    return 'verified';
  }

  return 'unknown';
}

function compareCandidatePosition(left: SifgCandidate, right: SifgCandidate): number {
  return left.file.localeCompare(right.file) || left.range.startLine - right.range.startLine;
}

function isSifgNode(value: SifgNode | undefined): value is SifgNode {
  return Boolean(value);
}

function symbolicNodeLabel(candidate: SifgCandidate): string {
  if (candidate.providerKey === 'stripe-payments' && candidate.kind === 'entrypoint') {
    return 'Stripe webhook entrypoint';
  }

  if (candidate.kind === 'signature-verifier') {
    return 'Stripe signature verifier';
  }

  if (candidate.kind === 'database-write') {
    return 'Database write sink';
  }

  return `${candidate.providerKey} ${candidate.kind}`;
}

function normalizeCandidateEvidence(candidate: SifgCandidate): Record<string, string> {
  return {
    detector: normalizeDetector(candidate.evidence.detector, candidate.kind),
    symbol: normalizeSymbol(candidate)
  };
}

function normalizeDetector(detector: string | undefined, kind: SifgCandidate['kind']): string {
  if (detector && /^[a-z0-9-]+$/i.test(detector)) {
    return detector;
  }

  return kind;
}

function normalizeSymbol(candidate: SifgCandidate): string {
  if (candidate.kind === 'entrypoint' && (candidate.symbol === 'POST' || candidate.symbol === 'ANY')) {
    return candidate.symbol;
  }

  if (
    candidate.kind === 'signature-verifier' &&
    (candidate.symbol.includes('stripe.webhooks.constructEvent') ||
      candidate.evidence.proof?.includes('stripe.webhooks.constructEvent'))
  ) {
    return 'stripe.webhooks.constructEvent';
  }

  if (candidate.kind === 'database-write') {
    return 'database-write';
  }

  return candidate.kind;
}

function normalizeTemplateGuardKind(kind: string | undefined): SifgNodeKind {
  return kind === 'signature-verifier' ? 'signature-verifier' : 'signature-verifier';
}

function buildExpectedGuardEvidence(
  guard: SifgTemplate['requiredGuards'][number] | undefined,
  guardKind: SifgNodeKind
): string {
  const symbols = guard?.symbols.length ? guard.symbols.join(', ') : guardKind;
  const envNames = guard?.requiresEnvNames?.length ? ` using ${guard.requiresEnvNames.join(', ')}` : '';
  const targets = guard?.mustPrecede.length ? ` before ${formatList(guard.mustPrecede)}` : '';
  return `${guardKind}: ${symbols}${envNames}${targets}`;
}

function buildRequiredOutcome(
  guard: SifgTemplate['requiredGuards'][number] | undefined,
  guardKind: SifgNodeKind
): string {
  const symbols = guard?.symbols.length ? guard.symbols.join(', ') : guardKind;
  const envNames = guard?.requiresEnvNames?.length ? ` using ${guard.requiresEnvNames.join(', ')}` : '';
  const targets = guard?.mustPrecede.length ? formatList(guard.mustPrecede) : 'database-write';
  return `Verify ${guardKind} (${symbols}${envNames}) before ${targets}.`;
}

function formatList(items: string[]): string {
  if (items.length <= 1) {
    return items.join('');
  }

  if (items.length === 2) {
    return `${items[0]} or ${items[1]}`;
  }

  return `${items.slice(0, -1).join(', ')}, or ${items[items.length - 1]}`;
}

function uniqueId(baseId: string, usedNodeIds: Set<string>): string {
  let id = baseId;
  let suffix = 2;
  while (usedNodeIds.has(id)) {
    id = `${baseId}.${suffix}`;
    suffix += 1;
  }
  usedNodeIds.add(id);
  return id;
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9:._-]/g, '-');
}

function sourceSlug(source: SifgNode): string {
  return sanitizeId(source.id);
}

function sanitizeGraph(graph: SifgGraph): SifgGraph {
  return redactStructured(graph) as SifgGraph;
}

function redactStructured(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactSecretLike(value);
  }

  if (Array.isArray(value)) {
    return value.map(redactStructured);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, redactStructured(child)])
    );
  }

  return value;
}

function redactSecretLike(value: string): string {
  return value
    .replace(/\bsk_(?:live|test)_[a-zA-Z0-9_]+\b/g, '[redacted]')
    .replace(/\bBearer\s+[a-zA-Z0-9._~+/=-]+\b/gi, 'Bearer [redacted]')
    .replace(/\b(api[_-]?key|access[_-]?token|refresh[_-]?token|secret)\s*[:=]\s*[^\s"'`,;)}]+/gi, '$1=[redacted]');
}

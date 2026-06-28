import type {
  MissionCheckStatus,
  MissionEvidenceClass,
  StackWiringArea,
  StackWiringKey
} from './types';

export type SifgGraphStatus = 'verified' | 'leak' | 'unknown';
export type SifgNodeKind =
  | 'entrypoint'
  | 'request-body'
  | 'request-header'
  | 'env-read'
  | 'signature-verifier'
  | 'auth-guard'
  | 'rate-limit-guard'
  | 'rls-policy'
  | 'server-only-boundary'
  | 'database-read'
  | 'database-write'
  | 'provider-mutation'
  | 'client-bundle'
  | 'error-capture'
  | 'safe-response';
export type SifgEdgeKind = 'taint-flow' | 'guarded-flow' | 'forbidden-flow' | 'unknown-flow';
export type SifgEdgeStatus = 'verified' | 'leak' | 'unknown';
export type SifgSeverity = 'info' | 'warning' | 'critical';
export type SifgLeakKind =
  | 'missing-mandatory-guard'
  | 'forbidden-client-exposure'
  | 'guard-after-sink'
  | 'unsupported-dynamic-flow';

export interface SifgRange {
  startLine: number;
  endLine: number;
}

export interface SifgEvidenceLocation {
  file: string;
  range: SifgRange;
  proof: string;
}

export interface SifgNode {
  id: string;
  area: StackWiringArea;
  providerKey: StackWiringKey;
  kind: SifgNodeKind;
  label: string;
  file: string;
  range: SifgRange;
  evidence: Record<string, string>;
  secretPolicy: 'no-values';
}

export interface SifgEdge {
  id: string;
  from: string;
  to: string;
  kind: SifgEdgeKind;
  status: SifgEdgeStatus;
  evidence: SifgEvidenceLocation[];
}

export interface SifgPipeline {
  id: string;
  area: StackWiringArea;
  providerKey: StackWiringKey;
  label: string;
  source: string;
  requiredEdges: string[];
  forbiddenEdges: string[];
  status: SifgGraphStatus;
  severity: SifgSeverity;
  missionCheckIds: string[];
}

export interface SifgLeakPathStep {
  nodeId: string;
  file: string;
  range: SifgRange;
  role: 'source' | 'guard' | 'sink';
}

export interface SifgLeak {
  id: string;
  pipelineId: string;
  area: StackWiringArea;
  providerKey: StackWiringKey;
  kind: SifgLeakKind;
  severity: SifgSeverity;
  summary: string;
  evidencePath: SifgLeakPathStep[];
  missingGuard?: {
    expectedNodeKind: SifgNodeKind;
    expectedEvidence: string;
  };
  repoFix: {
    allowedFiles: string[];
    forbiddenFiles: string[];
    requiredOutcome: string;
  };
}

export interface SifgGraph {
  version: 1;
  graphId: string;
  generatedAt: string;
  registryVersion: number;
  status: SifgGraphStatus;
  nodes: SifgNode[];
  edges: SifgEdge[];
  pipelines: SifgPipeline[];
  leaks: SifgLeak[];
}

export interface MissionCheckSifgReference {
  pipelineId: string;
  leakIds: string[];
  proofStatus: SifgGraphStatus;
}

export interface SifgMissionCheckPatch {
  id: string;
  label: string;
  providerKey: StackWiringKey;
  area: StackWiringArea;
  evidenceClass: MissionEvidenceClass;
  status: MissionCheckStatus;
  evidence: string[];
  promptHint: string;
  sifg: MissionCheckSifgReference;
}

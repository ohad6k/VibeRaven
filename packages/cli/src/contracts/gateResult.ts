import type { CliScanArtifact } from '../types';
import { summarizeCapabilities } from '../capabilities';
import type { CapabilityKey, GateStatus } from './status';
import {
  PUBLIC_NEXT_JSON_COMMAND,
  PUBLIC_STRICT_COMMAND,
  PUBLIC_VERIFY_COMMAND,
  promptGapCommand,
} from './commands';

export type GateResultMode = 'scan' | 'verify' | 'strict' | 'agent-mode' | 'condense' | 'error';

export type GateResult = {
  $schema: 'https://viberaven.dev/schemas/gate-result.schema.json';
  schemaVersion: 'v1';
  runId: string;
  mode: GateResultMode;
  generatedAt: string;
  workspace: {
    root: string;
    packageManager: string;
    languages: string[];
    frameworks: string[];
  };
  gate: {
    status: GateStatus;
    criticalCount: number;
    warningCount: number;
    providerBoundaryRequired: boolean;
  };
  capabilities: Record<CapabilityKey, string>;
  topGapIds: string[];
  artifacts: {
    tasklist: string;
    contextMap: string;
    gateResult: string;
    gapsDir: string;
    healDir: string;
  };
  commands: {
    verify: string;
    strict: string;
    next: string;
    promptFirstGap?: string;
  };
  redaction: {
    applied: boolean;
    count: number;
  };
  /** Populated only when --agent-mode flag is set. Tells the agent what to do next. */
  nextAction?: {
    gapId?: string;
    type: string;
    title: string;
    mcpTool?: string;
    mcpArgs?: Record<string, unknown>;
    requiresUserAction: boolean;
    batchSize: number;
    batchApplied: number;
    scanNow: boolean;
    stalled: boolean;
    stalledScans: number;
  };
};

function gateStatus(criticalCount: number, warningCount: number): GateStatus {
  if (criticalCount > 0) return 'not_clear';
  if (warningCount > 0) return 'warning';
  return 'clear';
}

function runIdFrom(scannedAt: string): string {
  return `vr_${scannedAt.replace(/\D/g, '').slice(0, 14) || 'scan'}`;
}

export function generateGateResult(
  artifact: CliScanArtifact,
  options: { mode?: GateResultMode; redactionCount?: number } = {}
): GateResult {
  const criticalCount = artifact.gaps.filter((gap) => gap.severity === 'critical').length;
  const warningCount = artifact.gaps.filter((gap) => gap.severity === 'warning').length;
  const capabilities = summarizeCapabilities(artifact.gaps);
  const topGapIds = artifact.gaps.slice(0, 10).map((gap) => gap.id);
  const firstGapId = topGapIds[0];

  return {
    $schema: 'https://viberaven.dev/schemas/gate-result.schema.json',
    schemaVersion: 'v1',
    runId: runIdFrom(artifact.scannedAt),
    mode: options.mode ?? 'scan',
    generatedAt: artifact.scannedAt,
    workspace: {
      root: artifact.workspacePath,
      packageManager: 'unknown',
      languages: ['typescript'],
      frameworks: artifact.archetype ? [artifact.archetype] : [],
    },
    gate: {
      status: gateStatus(criticalCount, warningCount),
      criticalCount,
      warningCount,
      providerBoundaryRequired: true,
    },
    capabilities: {
      scaling: capabilities.scaling.status,
      security: capabilities.security.status,
      webhooks: capabilities.webhooks.status,
      payments: capabilities.payments.status,
      database: capabilities.database.status,
    },
    topGapIds,
    artifacts: {
      tasklist: '.viberaven/agent-tasklist.md',
      contextMap: '.viberaven/context-map.json',
      gateResult: '.viberaven/gate-result.json',
      gapsDir: '.viberaven/gaps',
      healDir: '.viberaven/heal',
    },
    commands: {
      verify: PUBLIC_VERIFY_COMMAND,
      strict: PUBLIC_STRICT_COMMAND,
      next: PUBLIC_NEXT_JSON_COMMAND,
      ...(firstGapId ? { promptFirstGap: promptGapCommand(firstGapId) } : {}),
    },
    redaction: {
      applied: (options.redactionCount ?? 0) > 0,
      count: options.redactionCount ?? 0,
    },
  };
}

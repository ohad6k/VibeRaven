import type { CliScanArtifact } from '../types';
import { summarizeCapabilities } from '../capabilities';
import {
  PUBLIC_NEXT_JSON_COMMAND,
  PUBLIC_STRICT_COMMAND,
  PUBLIC_VERIFY_COMMAND,
  promptGapCommand,
} from './commands';

export type ContextMap = {
  $schema: 'https://viberaven.dev/schemas/context-map.schema.json';
  schemaVersion: 'v1';
  generatedAt: string;
  workspace: {
    root: string;
    packageManager: string;
    languages: string[];
    frameworks: string[];
  };
  agentContract: {
    readFirst: string;
    machineResult: string;
    contextMap: string;
    verifyCommand: string;
    strictCommand: string;
    nextCommand: string;
  };
  stack: {
    deployment: string[];
    database: string[];
    auth: string[];
    payments: string[];
    monitoring: string[];
  };
  capabilityGraph: ReturnType<typeof summarizeCapabilities>;
  productionGate: {
    status: string;
    criticalCount: number;
    warningCount: number;
    providerDashboardChecksRequired: boolean;
  };
  topGaps: Array<{
    id: string;
    severity: string;
    title: string;
    area: string;
    promptCommand: string;
  }>;
};

export function generateContextMap(artifact: CliScanArtifact): ContextMap {
  const criticalCount = artifact.gaps.filter((gap) => gap.severity === 'critical').length;
  const warningCount = artifact.gaps.filter((gap) => gap.severity === 'warning').length;
  return {
    $schema: 'https://viberaven.dev/schemas/context-map.schema.json',
    schemaVersion: 'v1',
    generatedAt: artifact.scannedAt,
    workspace: {
      root: artifact.workspacePath,
      packageManager: 'unknown',
      languages: ['typescript'],
      frameworks: artifact.archetype ? [artifact.archetype] : [],
    },
    agentContract: {
      readFirst: '.viberaven/agent-tasklist.md',
      machineResult: '.viberaven/gate-result.json',
      contextMap: '.viberaven/context-map.json',
      verifyCommand: PUBLIC_VERIFY_COMMAND,
      strictCommand: PUBLIC_STRICT_COMMAND,
      nextCommand: PUBLIC_NEXT_JSON_COMMAND,
    },
    stack: {
      deployment: artifact.selectedProviders?.deployment ? [artifact.selectedProviders.deployment] : [],
      database: artifact.selectedProviders?.database ? [artifact.selectedProviders.database] : [],
      auth: artifact.selectedProviders?.auth ? [artifact.selectedProviders.auth] : [],
      payments: artifact.selectedProviders?.payments ? [artifact.selectedProviders.payments] : [],
      monitoring: artifact.selectedProviders?.monitoring ? [artifact.selectedProviders.monitoring] : [],
    },
    capabilityGraph: summarizeCapabilities(artifact.gaps),
    productionGate: {
      status: criticalCount > 0 ? 'not_clear' : warningCount > 0 ? 'warning' : 'clear',
      criticalCount,
      warningCount,
      providerDashboardChecksRequired: true,
    },
    topGaps: artifact.gaps.slice(0, 10).map((gap) => ({
      id: gap.id,
      severity: gap.severity,
      title: gap.title,
      area: String(gap.primaryMapCategory),
      promptCommand: promptGapCommand(gap.id),
    })),
  };
}

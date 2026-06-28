import type { GateResult } from '../contracts/gateResult';

export type VibeRavenJsonlEvent =
  | { type: 'viberaven.run.started'; runId: string; mode: string }
  | { type: 'viberaven.artifact.written'; path: string }
  | { type: 'viberaven.gap.detected'; id: string; severity: string; area: string }
  | { type: 'viberaven.run.completed'; gateStatus: string; criticalCount: number; warningCount: number };

export function gateResultEvents(result: GateResult): VibeRavenJsonlEvent[] {
  return [
    { type: 'viberaven.run.started', runId: result.runId, mode: result.mode },
    { type: 'viberaven.artifact.written', path: result.artifacts.gateResult },
    { type: 'viberaven.artifact.written', path: result.artifacts.tasklist },
    { type: 'viberaven.artifact.written', path: result.artifacts.contextMap },
    ...result.topGapIds.map((id) => ({ type: 'viberaven.gap.detected' as const, id, severity: 'unknown', area: 'unknown' })),
    {
      type: 'viberaven.run.completed',
      gateStatus: result.gate.status,
      criticalCount: result.gate.criticalCount,
      warningCount: result.gate.warningCount,
    },
  ];
}

export function renderJsonlEvents(result: GateResult): string {
  return `${gateResultEvents(result).map((event) => JSON.stringify(event)).join('\n')}\n`;
}

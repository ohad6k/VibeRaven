import type { GateResult } from '../contracts/gateResult';

export function exitCodeForStrictGate(
  result: GateResult,
  options: { failOnWarnings?: boolean } = {}
): number {
  if (result.gate.status === 'error') return 2;
  if (result.gate.status === 'unknown') return 3;
  if (result.gate.status === 'not_clear') return 1;
  if (options.failOnWarnings && result.gate.warningCount > 0) return 1;
  return 0;
}

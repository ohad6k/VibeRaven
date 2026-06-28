import type { GateResult } from '../contracts/gateResult';

export function renderGateResultJson(result: GateResult): string {
  return `${JSON.stringify(result, null, 2)}\n`;
}

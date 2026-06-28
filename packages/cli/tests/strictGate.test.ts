import { describe, expect, it } from 'vitest';
import type { GateResult } from '../src/contracts/gateResult';
import { exitCodeForStrictGate } from '../src/commands/strictGate';

function result(status: GateResult['gate']['status'], warningCount = 0): GateResult {
  return {
    $schema: 'https://viberaven.dev/schemas/gate-result.schema.json',
    schemaVersion: 'v1',
    runId: 'vr_test',
    mode: 'strict',
    generatedAt: '2026-06-08T09:30:00.000Z',
    workspace: { root: 'D:/repo', packageManager: 'npm', languages: [], frameworks: [] },
    gate: { status, criticalCount: status === 'not_clear' ? 1 : 0, warningCount, providerBoundaryRequired: true },
    capabilities: { scaling: 'unknown', security: 'unknown', webhooks: 'unknown', payments: 'unknown', database: 'unknown' },
    topGapIds: [],
    artifacts: { tasklist: '', contextMap: '', gateResult: '', gapsDir: '', healDir: '' },
    commands: { verify: '', strict: '', next: '' },
    redaction: { applied: false, count: 0 },
  };
}

describe('strict gate exit codes', () => {
  it('passes clear and warning gates by default', () => {
    expect(exitCodeForStrictGate(result('clear'))).toBe(0);
    expect(exitCodeForStrictGate(result('warning', 2))).toBe(0);
  });

  it('fails critical repo-code gaps', () => {
    expect(exitCodeForStrictGate(result('not_clear'))).toBe(1);
  });

  it('fails warnings when strict warning mode is requested', () => {
    expect(exitCodeForStrictGate(result('warning', 2), { failOnWarnings: true })).toBe(1);
  });

  it('uses code 3 for unknown and code 2 for error', () => {
    expect(exitCodeForStrictGate(result('unknown'))).toBe(3);
    expect(exitCodeForStrictGate(result('error'))).toBe(2);
  });
});

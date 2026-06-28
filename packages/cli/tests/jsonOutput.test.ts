import { describe, expect, it } from 'vitest';
import type { GateResult } from '../src/contracts/gateResult';
import { renderGateResultJson } from '../src/output/json';
import { renderJsonlEvents } from '../src/output/jsonl';

const gateResult: GateResult = {
  $schema: 'https://viberaven.dev/schemas/gate-result.schema.json',
  schemaVersion: 'v1',
  runId: 'vr_test',
  mode: 'agent-mode',
  generatedAt: '2026-06-08T09:30:00.000Z',
  workspace: { root: 'D:/repo', packageManager: 'npm', languages: ['typescript'], frameworks: ['nextjs'] },
  gate: { status: 'not_clear', criticalCount: 1, warningCount: 0, providerBoundaryRequired: true },
  capabilities: { scaling: 'unknown', security: 'critical', webhooks: 'unknown', payments: 'unknown', database: 'unknown' },
  topGapIds: ['SEC_ENV_001'],
  artifacts: {
    tasklist: '.viberaven/agent-tasklist.md',
    contextMap: '.viberaven/context-map.json',
    gateResult: '.viberaven/gate-result.json',
    gapsDir: '.viberaven/gaps',
    healDir: '.viberaven/heal',
  },
  commands: {
    verify: 'npx -y viberaven --verify',
    strict: 'npx -y viberaven --strict',
    next: 'npx -y viberaven next --json',
    promptFirstGap: 'npx -y viberaven prompt --gap SEC_ENV_001',
  },
  redaction: { applied: false, count: 0 },
};

describe('agent machine output', () => {
  it('renders valid JSON with one trailing newline', () => {
    const output = renderGateResultJson(gateResult);
    expect(output.endsWith('\n')).toBe(true);
    expect(JSON.parse(output).runId).toBe('vr_test');
  });

  it('renders valid JSONL events in stable order', () => {
    const output = renderJsonlEvents(gateResult);
    const lines = output.trim().split('\n');
    expect(lines.map((line) => JSON.parse(line).type)).toEqual([
      'viberaven.run.started',
      'viberaven.artifact.written',
      'viberaven.artifact.written',
      'viberaven.artifact.written',
      'viberaven.gap.detected',
      'viberaven.run.completed',
    ]);
    expect(JSON.parse(lines[5]).gateStatus).toBe('not_clear');
  });
});

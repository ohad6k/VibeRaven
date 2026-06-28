import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CliScanArtifact } from '../src/types';
import { generateGateResult } from '../src/contracts/gateResult';
import { generateGapEvidenceFiles } from '../src/contracts/gapEvidence';

function artifact(): CliScanArtifact {
  return {
    version: 1,
    scannedAt: '2026-06-08T09:30:00.000Z',
    workspacePath: 'D:/repo',
    score: 71,
    scoreLabel: 'Needs work',
    summary: 'Scan summary',
    archetype: 'next-supabase',
    gaps: [
      {
        id: 'DB_RLS_001',
        title: 'Supabase RLS missing',
        detail: 'Table leads has no RLS policy',
        severity: 'critical',
        primaryMapCategory: 'database',
        prompt: 'Fix RLS',
      },
      {
        id: 'SEC_ENV_001',
        title: 'Service role key exposed',
        detail: 'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY is browser visible',
        severity: 'warning',
        primaryMapCategory: 'security',
        prompt: 'Move secret server-side',
      },
    ],
    missionGraph: { nodes: [], edges: [] } as never,
    stackWiring: {} as never,
    providerRegistry: {} as never,
    verificationSummary: {} as never,
    productionCorePercent: 71,
  };
}

describe('gate result contract', () => {
  it('generates the authoritative machine verdict', () => {
    const result = generateGateResult(artifact(), { mode: 'agent-mode' });
    const schema = JSON.parse(
      readFileSync(resolve(__dirname, '..', '..', '..', 'schemas', 'gate-result.schema.json'), 'utf8')
    );

    expect(result.$schema).toBe('https://viberaven.dev/schemas/gate-result.schema.json');
    expect(result.schemaVersion).toBe('v1');
    expect(result.mode).toBe('agent-mode');
    expect(result.gate.status).toBe('not_clear');
    expect(result.gate.criticalCount).toBe(1);
    expect(result.gate.warningCount).toBe(1);
    expect(result.capabilities.database).toBe('critical');
    expect(result.capabilities.security).toBe('warning');
    expect(result.topGapIds).toEqual(['DB_RLS_001', 'SEC_ENV_001']);
    expect(result.artifacts.gateResult).toBe('.viberaven/gate-result.json');
    expect(result.commands.verify).toBe('npx -y viberaven --verify');
    expect(Object.keys(result.commands).sort()).toEqual(
      Object.keys(schema.properties.commands.properties).sort()
    );
  });

  it('generates per-gap JSON with focused commands', () => {
    const gaps = generateGapEvidenceFiles(artifact());

    expect(gaps).toHaveLength(2);
    expect(gaps[0].path).toBe('.viberaven/gaps/DB_RLS_001.json');
    expect(gaps[0].content.commands.prompt).toBe('npx -y viberaven prompt --gap DB_RLS_001');
    expect(gaps[0].content.commands.healPlan).toBe('npx -y viberaven --heal --plan --gap DB_RLS_001');
    expect(JSON.stringify(gaps)).not.toContain('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY is browser visible');
  });
});

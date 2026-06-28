import { describe, expect, it } from 'vitest';
import type { CliScanArtifact } from '../src/types';
import { generateContextMap } from '../src/contracts/contextMap';

const baseArtifact: CliScanArtifact = {
  version: 1,
  scannedAt: '2026-06-08T09:30:00.000Z',
  workspacePath: 'D:/repo',
  score: 80,
  scoreLabel: 'Good',
  summary: 'Next.js Supabase app',
  archetype: 'next-supabase',
  gaps: [
    {
      id: 'WEBHOOK_001',
      title: 'Webhook missing idempotency',
      detail: 'Webhook route app/api/webhook/route.ts lacks idempotency evidence',
      severity: 'warning',
      primaryMapCategory: 'webhooks',
      prompt: 'Add idempotency',
    },
  ],
  missionGraph: { nodes: [], edges: [] } as never,
  stackWiring: {} as never,
  providerRegistry: {} as never,
  verificationSummary: {} as never,
  productionCorePercent: 80,
};

describe('context map contract', () => {
  it('generates compact agent context linked to the machine verdict', () => {
    const map = generateContextMap(baseArtifact);

    expect(map.$schema).toBe('https://viberaven.dev/schemas/context-map.schema.json');
    expect(map.schemaVersion).toBe('v1');
    expect(map.agentContract.readFirst).toBe('.viberaven/agent-tasklist.md');
    expect(map.agentContract.machineResult).toBe('.viberaven/gate-result.json');
    expect(map.agentContract.verifyCommand).toBe('npx -y viberaven --verify');
    expect(map.capabilityGraph.webhooks.status).toBe('warning');
    expect(map.topGaps[0].id).toBe('WEBHOOK_001');
    expect(JSON.stringify(map)).not.toContain('Webhook route app/api/webhook/route.ts lacks idempotency evidence');
  });
});

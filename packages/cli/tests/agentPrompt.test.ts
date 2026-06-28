import { describe, expect, it } from 'vitest';
import type { CliScanArtifact } from '../src/types';
import type { Gap } from '../../../src/station/types';
import { buildAgentFixPrompt } from '../src/agentPrompt';

function gap(overrides: Partial<Gap> = {}): Gap {
  return {
    id: 'auth-enforcement',
    category: 'SECURITY & AUTH',
    severity: 'critical',
    title: 'Auth enforcement is split between client and server',
    detail: 'Protected routes trust browser state without enough server-side proof.',
    copyPrompt: 'Fix auth.',
    toolSuggestions: [],
    mcpSuggestion: null,
    primaryMapCategory: 'auth',
    affectedMapCategories: ['security'],
    ...overrides
  };
}

function artifact(overrides: Partial<CliScanArtifact> = {}): CliScanArtifact {
  return {
    version: 1,
    scannedAt: '2026-06-07T00:00:00.000Z',
    workspacePath: 'D:\\app',
    score: 60,
    scoreLabel: 'Needs Work',
    summary: 'Auth and monitoring need production proof.',
    archetype: 'SaaS',
    productionCorePercent: 54,
    gaps: [gap()],
    missionGraph: { areas: [] },
    stackWiring: {},
    providerRegistry: { providers: [] },
    ...overrides
  } as unknown as CliScanArtifact;
}

describe('buildAgentFixPrompt', () => {
  it('turns a raw gap into an agent-ready production work order', () => {
    const prompt = buildAgentFixPrompt(artifact(), gap());

    expect(prompt).toContain('You are an AI coding agent using VibeRaven as the production-readiness map.');
    expect(prompt).toContain('Read `.viberaven/agent-summary.md`');
    expect(prompt).toContain('Gap: Auth enforcement is split between client and server');
    expect(prompt).toContain('Do not claim provider dashboard or read-only MCP checks as repo-code fixes.');
    expect(prompt).toContain('Run `npx -y viberaven` again');
  });
});

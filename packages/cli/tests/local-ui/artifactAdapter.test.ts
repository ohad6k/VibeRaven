import { describe, expect, it } from 'vitest';
import { mapArtifactToLocalUiState } from '../../src/local-ui/artifactAdapter';
import type { CliScanArtifact } from '../../src/types';

function artifact(overrides: Partial<CliScanArtifact> = {}): CliScanArtifact {
  return {
    version: 1,
    scannedAt: '2026-06-17T00:00:00.000Z',
    workspacePath: 'D:\\app',
    score: 60,
    scoreLabel: 'Needs Work',
    summary: 'Supabase and Vercel need launch proof.',
    archetype: 'saas-app',
    productionCorePercent: 54,
    gaps: [
      {
        id: 'supabase-rls-missing',
        category: 'DATABASE',
        severity: 'critical',
        title: 'Supabase RLS policies are missing',
        detail: 'Add repo evidence for RLS policies before launch.',
        copyPrompt: 'Fix Supabase RLS policies.',
        toolSuggestions: [],
        mcpSuggestion: null,
        primaryMapCategory: 'database',
        affectedMapCategories: ['database']
      }
    ],
    missionGraph: { areas: [], byArea: {}, byProvider: {}, repositoryEvidence: { env: [], security: [] } },
    stackWiring: { items: [], byKey: {} },
    providerRegistry: { version: 1, source: 'bundled', generatedAt: '2026-06-17T00:00:00.000Z', status: 'fresh', staleAfterDays: 14, providers: [] },
    ...overrides
  } as CliScanArtifact;
}

describe('mapArtifactToLocalUiState', () => {
  it('turns scan gaps into a provider-first local UI state', () => {
    const state = mapArtifactToLocalUiState(artifact());

    expect(state.project.name).toBe('app');
    expect(state.tagline).toBe('From AI demo to production');
    expect(state.gate.label).toBe('Gate not clear');
    expect(state.selectedProviderId).toBe('supabase');
    expect(state.providers.find((provider) => provider.id === 'supabase')).toEqual(
      expect.objectContaining({
        state: 'needs_repo_fix',
        statusText: 'Needs repo fix'
      })
    );
    expect(state.currentPrompt).toContain('Provider: Supabase');
    expect(state.currentPrompt).toContain('npx -y viberaven --verify');
  });

  it('builds mission control around the global next blocker and routes fix next to Stripe', () => {
    const state = mapArtifactToLocalUiState(
      artifact({
        gaps: [
          {
            id: 'stripe-webhook-live-proof-missing',
            category: 'BILLING',
            severity: 'critical',
            title: 'Stripe webhook is not verified in production',
            detail: 'Webhook route exists in repo, but live Stripe webhook proof is missing.',
            copyPrompt: 'Make the Stripe webhook handler production-safe.',
            toolSuggestions: [],
            mcpSuggestion: null,
            primaryMapCategory: 'billing',
            affectedMapCategories: ['billing', 'deployment']
          }
        ]
      })
    );

    const stripe = state.providers.find((provider) => provider.id === 'stripe');

    expect(state.missionControl.canLaunch).toBe('not_yet');
    expect(state.missionControl.mainBlocker).toBe('Stripe webhook is not verified in production');
    expect(state.missionControl.fixNext.target).toEqual({
      kind: 'provider',
      providerId: 'stripe',
      actionId: 'stripe-current-action'
    });
    expect(state.selectedProviderId).toBe('stripe');
    expect(stripe?.cockpit?.action.lanes.you.title).toContain('Stripe webhook');
    expect(stripe?.cockpit?.action.lanes.agent.title).toContain('webhook handler');
    expect(stripe?.cockpit?.action.lanes.verify.label).toBe('Verify');
    expect(stripe?.cockpit?.proof.level).toBe('dashboard_needed');
    expect(stripe?.cockpit?.proof.summary).toBe('The code exists, but production proof is still missing.');
  });
});

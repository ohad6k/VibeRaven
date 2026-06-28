import { describe, expect, it } from 'vitest';

import { generateAgentTasklist } from '../src/report/agentTasklist';
import type { CliScanArtifact } from '../src/types';

function baseArtifact(overrides: Partial<CliScanArtifact> = {}): CliScanArtifact {
  return {
    version: 1,
    scannedAt: '2026-05-31T12:00:00.000Z',
    workspacePath: '/tmp/demo-app',
    score: 62,
    scoreLabel: 'At risk',
    summary: 'Auth and monitoring need work before launch.',
    archetype: 'saas-mvp',
    accountEmail: 'dev@example.com',
    plan: 'free',
    usageLine: 'Scans: 1/3 (lifetime, free) - 2 remaining',
    gaps: [],
    missionGraph: {
      areas: [],
      byArea: {},
      byProvider: {},
      repositoryEvidence: { env: [], security: [] }
    },
    stackWiring: { items: [], byKey: {} },
    providerRegistry: {
      version: 'test',
      source: 'bundled',
      generatedAt: '2026-05-31T12:00:00.000Z',
      status: 'fresh',
      providers: []
    },
    productionCorePercent: 70,
    ...overrides
  } as unknown as CliScanArtifact;
}

describe('generateAgentTasklist', () => {
  it('marks critical gaps as a blocked production gate', () => {
    const md = generateAgentTasklist(
      baseArtifact({
        gaps: [
          {
            id: 'gap-auth-1',
            category: 'SECURITY & AUTH',
            severity: 'critical',
            title: 'Harden session handling',
            detail: 'Middleware may not protect API routes.',
            copyPrompt: 'Fix auth middleware for API routes.',
            toolSuggestions: [],
            mcpSuggestion: null,
            primaryMapCategory: 'auth',
            affectedMapCategories: []
          }
        ]
      })
    );

    expect(md).toContain('# VibeRaven Production Gate - CRITICAL GAPS DETECTED');
    expect(md).toContain('PRODUCTION GATE NOT CLEAR');
    expect(md).toContain('- [!] **Harden session handling**');
    expect(md).toContain('Gap ID: `gap-auth-1`');
    expect(md).toContain('npx -y viberaven prompt --gap gap-auth-1');
    expect(md).toContain('## NEXT STEPS FOR THE AGENT');
    expect(md).toContain('npx -y viberaven --verify');
  });

  it('marks warning-only gaps as requiring review before deployment', () => {
    const md = generateAgentTasklist(
      baseArtifact({
        gaps: [
          {
            id: 'gap-db-1',
            category: 'DATABASE & DATA',
            severity: 'warning',
            title: 'Review database backups',
            detail: 'No backup policy was found.',
            copyPrompt: 'Add backup documentation.',
            toolSuggestions: [],
            mcpSuggestion: null,
            primaryMapCategory: 'database',
            affectedMapCategories: []
          }
        ]
      })
    );

    expect(md).toContain('# VibeRaven Production Gate - GAPS DETECTED');
    expect(md).toContain('Do not deploy until the listed production-readiness gaps are reviewed.');
    expect(md).toContain('- [ ] **Review database backups**');
  });

  it('redacts secret-shaped detail text', () => {
    const md = generateAgentTasklist(
      baseArtifact({
        gaps: [
          {
            id: 'gap-env-1',
            category: 'SECURITY & AUTH',
            severity: 'critical',
            title: 'Remove leaked Supabase key',
            detail:
              'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJhbGci.fake-secret and postgres://user:pass@db.example.com:5432/app were found.',
            copyPrompt: 'Remove leaked credentials.',
            toolSuggestions: [],
            mcpSuggestion: null,
            primaryMapCategory: 'security',
            affectedMapCategories: []
          }
        ]
      })
    );

    expect(md).toContain('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=<redacted>');
    expect(md).toContain('postgres://<redacted>@db.example.com:5432/app');
    expect(md).not.toContain('eyJhbGci');
    expect(md).not.toContain('fake-secret');
  });

  it('redacts auth headers, private keys, provider tokens, and generic URL credentials', () => {
    const githubToken = `ghp_${'abcdefghijklmnopqrstuvwxyz123456'}`;
    const slackToken = ['xoxb', '123456789012', '123456789012', 'secretvalue'].join('-');
    const md = generateAgentTasklist(
      baseArtifact({
        gaps: [
          {
            id: 'gap-secrets-1',
            category: 'SECURITY & AUTH',
            severity: 'critical',
            title: 'Remove leaked credentials',
            detail: [
              'Authorization: Bearer secret-token-value',
              'PRIVATE_KEY=-----BEGIN PRIVATE KEY-----abc123secret-----END PRIVATE KEY-----',
              `GitHub token ${githubToken}`,
              `Slack token ${slackToken}`,
              'MySQL URL mysql://user:pass@db.example.com/app'
            ].join(' '),
            copyPrompt: 'Remove leaked credentials.',
            toolSuggestions: [],
            mcpSuggestion: null,
            primaryMapCategory: 'security',
            affectedMapCategories: []
          }
        ]
      })
    );

    expect(md).toContain('Authorization: Bearer <redacted>');
    expect(md).toContain('PRIVATE_KEY=<redacted>');
    expect(md).toContain('mysql://<redacted>@db.example.com/app');
    expect(md).not.toContain('secret-token-value');
    expect(md).not.toContain('abc123secret');
    expect(md).not.toContain(githubToken);
    expect(md).not.toContain(slackToken);
    expect(md).not.toContain('user:pass');
  });
});

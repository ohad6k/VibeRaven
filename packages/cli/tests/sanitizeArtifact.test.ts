import { describe, expect, it } from 'vitest';
import { sanitizeArtifactForDisk } from '../src/sanitizeArtifact';
import type { CliScanArtifact } from '../src/types';

describe('sanitizeArtifactForDisk', () => {
  it('redacts OpenAI-style keys in gap copy prompts', () => {
    const artifact = {
      version: 1,
      gaps: [
        {
          id: 'g1',
          copyPrompt: 'Set OPENAI_API_KEY=sk-test_abcdefghijklmnopqrst in .env',
          detail: 'found sk-live_abcdefghijklmnopqrst',
          title: 'leak'
        }
      ]
    } as unknown as CliScanArtifact;

    const safe = sanitizeArtifactForDisk(artifact);
    expect(safe.gaps[0]?.copyPrompt).not.toContain('sk-test');
    expect(safe.gaps[0]?.copyPrompt).toContain('[REDACTED');
    expect(safe.gaps[0]?.detail).not.toContain('sk-live');
  });

  it('redacts nested tokens, authorization headers, and private env values', () => {
    const artifact = {
      version: 1,
      summary: 'Authorization: Bearer eyJabcdefghijkl.mnopqrstuvwxyz.abcdefghijkl',
      missionGraph: {
        repositoryEvidence: {
          env: ['SUPABASE_SERVICE_ROLE_KEY=service-role-secret', 'NEXT_PUBLIC_SUPABASE_URL=https://example.test']
        }
      },
      providerRegistry: {
        credentials: {
          access_token: 'vbr_live_secret_token_value',
          password: 'plain-password'
        }
      }
    } as unknown as CliScanArtifact;

    const safe = sanitizeArtifactForDisk(artifact) as unknown as Record<string, unknown>;
    const json = JSON.stringify(safe);

    expect(json).not.toContain('service-role-secret');
    expect(json).not.toContain('vbr_live_secret_token_value');
    expect(json).not.toContain('plain-password');
    expect(json).not.toContain('eyJabcdefghijkl');
    expect(json).toContain('[REDACTED');
    expect(json).toContain('NEXT_PUBLIC_SUPABASE_URL');
  });

  it('redacts broader authorization schemes, private keys, and sensitive token assignments', () => {
    const artifact = {
      version: 1,
      summary: [
        'Authorization: Basic abc123',
        'Authorization: Token token-abc123',
        'PRIVATE_API_TOKEN=abcdefghijklmnopqrstuvwxyz1234567890',
        '-----BEGIN PRIVATE KEY-----abc123secret-----END PRIVATE KEY-----',
        'NEXT_PUBLIC_SUPABASE_URL=https://example.test'
      ].join('\n'),
      headers: {
        authorization: 'Bearer abc123'
      }
    } as unknown as CliScanArtifact;

    const safe = sanitizeArtifactForDisk(artifact) as unknown as Record<string, unknown>;
    const json = JSON.stringify(safe);

    expect(json).not.toContain('Basic abc123');
    expect(json).not.toContain('Token token-abc123');
    expect(json).not.toContain('Bearer abc123');
    expect(json).not.toContain('abc123secret');
    expect(json).not.toContain('abcdefghijklmnopqrstuvwxyz1234567890');
    expect(json).toContain('Authorization: Basic [REDACTED]');
    expect(json).toContain('Authorization: Token [REDACTED]');
    expect(json).toContain('PRIVATE_API_TOKEN=[REDACTED]');
    expect(json).toContain('[REDACTED_PRIVATE_KEY]');
    expect(json).toContain('NEXT_PUBLIC_SUPABASE_URL');
  });

  it('redacts common inline GitHub and Slack token formats', () => {
    const githubClassic = `ghp_${'abcdefghijklmnopqrstuvwxyz1234567890ABCD'}`;
    const githubFineGrained = `github_pat_${'11AAAAAAAA0abcdefghi'}_${'jklmnopqrstuvwxyzABCDEFGHIJKLMN1234567890'}`;
    const slackBot = ['xoxb', '123456789012', '1234567890123', 'abcdefghijklmnopqrstuvwx'].join('-');
    const slackApp = ['xapp', '1', 'A1234567890', '1234567890123', 'abcdef1234567890abcdef1234567890'].join('-');
    const slackUser = ['xoxp', '123456789012', '123456789012', '123456789012', 'abcdefabcdefabcdefabcdefabcdef'].join('-');
    const artifact = {
      version: 1,
      summary: [
        `Use ${githubClassic} for GitHub.`,
        `Fine-grained token ${githubFineGrained}.`,
        `Slack bot ${slackBot}.`,
        `Slack app ${slackApp}.`,
        `Slack user ${slackUser}.`
      ].join('\n')
    } as unknown as CliScanArtifact;

    const safe = sanitizeArtifactForDisk(artifact) as unknown as Record<string, unknown>;
    const json = JSON.stringify(safe);

    expect(json).not.toContain(githubClassic);
    expect(json).not.toContain(githubFineGrained);
    expect(json).not.toContain(slackBot);
    expect(json).not.toContain(slackApp);
    expect(json).not.toContain(slackUser);
    expect(json.match(/\[REDACTED_SECRET\]/g)).toHaveLength(5);
  });

  it('redacts nested providerTruth secret values while preserving secret names', () => {
    const stripeSecret = `${'sk_' + 'live'}_${'secretabcdefghijkl'}`;
    const artifact = {
      version: 1,
      providerTruth: {
        version: 1,
        areas: [
          {
            area: 'payments',
            rows: [
              {
                provider: 'stripe',
                evidence: [
                  {
                    label: 'env proof',
                    detail: `STRIPE_SECRET_KEY=${stripeSecret}`
                  }
                ]
              }
            ]
          }
        ]
      }
    } as unknown as CliScanArtifact;

    const safe = sanitizeArtifactForDisk(artifact) as unknown as Record<string, unknown>;
    const json = JSON.stringify(safe);

    expect(json).not.toContain(stripeSecret);
    expect(json).toContain('STRIPE_SECRET_KEY');
    expect(json).toContain('[REDACTED');
  });
});

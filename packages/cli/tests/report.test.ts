import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { writeScanArtifacts } from '../src/artifacts';
import {
  PUBLIC_AGENT_MODE_COMMAND,
  PUBLIC_COMMAND,
  PUBLIC_VERIFY_COMMAND,
} from '../src/contracts/commands';
import { generateAgentSummary } from '../src/report/agentSummary';
import { sanitizeArtifactForDisk } from '../src/sanitizeArtifact';
import { providerLogoHtml } from '../src/report/providerLogos';
import { REPORT_ASSET_FILES } from '../src/report/reportAssets';
import { generateReportHtml } from '../src/report/reportHtml';
import type { CliScanArtifact } from '../src/types';

// Deep mission-graph types are strict; the report only reads a subset, so we
// cast a representative fixture rather than satisfy every nested literal type.
const fixture = {
  version: 1,
  scannedAt: '2026-05-31T12:00:00.000Z',
  workspacePath: '/tmp/demo-app',
  score: 62,
  scoreLabel: 'At risk',
  summary: 'Auth and monitoring need work before launch.',
  archetype: 'saas-mvp',
  productionCorePercent: 70,
  accountEmail: 'dev@example.com',
  plan: 'free',
  usageLine: 'Scans: 1/3 (lifetime, free) · 2 remaining',
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
  ],
  missionGraph: {
    areas: [
      {
        key: 'auth',
        label: 'Auth',
        readinessPercent: 55,
        criticalCount: 2,
        providerMissions: [
          {
            key: 'authjs',
            provider: 'authjs',
            providerLabel: 'Auth.js',
            area: 'auth',
            promptSubject: 'Auth.js',
            readinessPercent: 55,
            checks: [
              {
                id: 'auth-config',
                label: 'Auth config present',
                providerKey: 'authjs',
                providerLabel: 'Auth.js',
                area: 'auth',
                evidenceClass: 'repo-file',
                status: 'missing',
                evidence: ['No auth.config.ts'],
                promptHint: 'Add auth configuration.'
              }
            ]
          }
        ]
      }
    ],
    byArea: {},
    byProvider: {},
    repositoryEvidence: {
      env: [],
      security: []
    }
  },
  stackWiring: {
    items: [],
    byKey: {}
  },
  stackAutomation: {
    items: [
      {
        key: 'authjs-auth',
        provider: 'authjs',
        providerLabel: 'Auth.js',
        area: 'auth',
        promptSubject: 'Auth.js auth',
        readinessPercent: 55,
        repoFixes: [],
        manualChecks: [],
        confirmedChecks: [],
        mcpProvider: 'authjs',
        repoPrompt: 'Automate Auth.js production fixes safely.',
        verificationPrompt: '',
        automationLevel: 'repo-prompt-plus-mcp'
      }
    ],
    byKey: {}
  },
  providerRegistry: {
    version: 'test',
    source: 'bundled',
    generatedAt: '2026-05-31T12:00:00.000Z',
    status: 'fresh',
    providers: []
  }
} as unknown as CliScanArtifact;

function contractFixture(): CliScanArtifact {
  return {
    ...fixture,
    summary: 'Auth and payments need production checks.',
    gaps: [
      {
        id: 'gap-auth-1',
        category: 'SECURITY & AUTH',
        severity: 'critical',
        title: 'Protect API routes',
        detail: 'Middleware does not cover API routes.',
        copyPrompt: 'Fix auth middleware without using SUPABASE_SERVICE_ROLE_KEY=secret-value.',
        toolSuggestions: [],
        mcpSuggestion: null,
        primaryMapCategory: 'auth',
        affectedMapCategories: []
      }
    ],
    missionGraph: {
      ...fixture.missionGraph,
      areas: [
        {
          key: 'auth',
          label: 'Auth',
          readinessPercent: 55,
          criticalCount: 2,
          providerMissions: [
            {
              key: 'clerk-auth',
              provider: 'clerk',
              providerLabel: 'Clerk',
              area: 'auth',
              promptSubject: 'Clerk auth',
              readinessPercent: 55,
              repoReadinessPercent: 50,
              providerReadinessPercent: 0,
              checks: [
                {
                  id: 'clerk-package',
                  label: 'Clerk package installed',
                  providerKey: 'clerk',
                  providerLabel: 'Clerk',
                  area: 'auth',
                  evidenceClass: 'repo-verified',
                  evidenceSource: 'repo',
                  status: 'passed',
                  evidence: ['package.json: @clerk/nextjs'],
                  promptHint: ''
                },
                {
                  id: 'clerk-middleware',
                  label: 'API routes protected',
                  providerKey: 'clerk',
                  providerLabel: 'Clerk',
                  area: 'auth',
                  evidenceClass: 'missing-repo-fix',
                  evidenceSource: 'repo',
                  status: 'missing',
                  evidence: [],
                  promptHint: 'Add auth middleware for API routes.'
                },
                {
                  id: 'clerk-dashboard',
                  label: 'Production Clerk app configured',
                  providerKey: 'clerk',
                  providerLabel: 'Clerk',
                  area: 'auth',
                  evidenceClass: 'manual-dashboard',
                  evidenceSource: 'manual',
                  status: 'needs-connection',
                  evidence: [],
                  promptHint: 'Ask the user to confirm production Clerk settings.'
                },
                {
                  id: 'clerk-live',
                  label: 'Provider live check not run',
                  providerKey: 'clerk',
                  providerLabel: 'Clerk',
                  area: 'auth',
                  evidenceClass: 'mcp-verifier',
                  evidenceSource: 'mcp',
                  status: 'unknown',
                  evidence: [],
                  promptHint: 'Connect read-only MCP before claiming live provider setup.'
                }
              ]
            }
          ]
        }
      ]
    },
    stackAutomation: {
      items: [],
      byKey: {}
    },
    selectedProviders: { auth: 'clerk' }
  } as unknown as CliScanArtifact;
}

const reportAssetRoot = join(__dirname, '..', 'assets', 'report');

function parseStaticState(html: string): Record<string, unknown> {
  const match = html.match(/window\.__VIBERAVEN_STATIC_STATE__\s*=\s*(\{[\s\S]*?\});/);
  if (!match) {
    throw new Error('missing __VIBERAVEN_STATIC_STATE__');
  }
  return JSON.parse(match[1]) as Record<string, unknown>;
}

describe('generateAgentSummary', () => {
  it('includes production core and top gap commands', () => {
    const md = generateAgentSummary(fixture);

    expect(md).toContain('Production core: **70%**');
    expect(md).toContain('gap-auth-1');
    expect(md).toContain('viberaven prompt --gap gap-auth-1');
    expect(md).toContain('## Next action');
    expect(md).toContain('launch-playbook.md');
    expect(md).toContain('viberaven next --json');
    expect(md).toContain('Do not claim human-provider actions as repo-code fixes.');
  });

  it('separates agent-code work from human-provider actions for coding agents', () => {
    const md = generateAgentSummary(contractFixture());

    expect(md).toContain('## Agent-code actions');
    expect(md).toContain('viberaven prompt --gap gap-auth-1');
    expect(md).toContain('## Human-provider actions');
    expect(md).toContain('Production Clerk app configured');
    expect(md).toContain('Do not claim human-provider actions as repo-code fixes.');
    expect(md).toContain(PUBLIC_VERIFY_COMMAND);
    expect(md).toContain('.viberaven/launch-playbook.md');
    expect(md).toContain('viberaven next --json');
  });

  it('does not expose secret-looking values in generated artifacts', () => {
    const unsafe = contractFixture();
    unsafe.gaps[0].copyPrompt =
      'Set Authorization: Bearer sk-proj-abcdefghijklmnop123456789 and SUPABASE_SERVICE_ROLE_KEY=super-secret';
    const safe = sanitizeArtifactForDisk(unsafe);
    const md = generateAgentSummary(safe);
    const html = generateReportHtml(safe);

    expect(md).not.toContain('sk-proj-abcdefghijklmnop');
    expect(md).not.toContain('super-secret');
    expect(html).not.toContain('sk-proj-abcdefghijklmnop');
    expect(html).not.toContain('super-secret');
    expect(md).toContain('[REDACTED');
  });
});

describe('agent docs contract', () => {
  it('documents stable 1.0 agent login, scan, prompt, and rescan flow', () => {
    const snippet = readFileSync(join(__dirname, '..', 'templates', 'AGENTS.snippet.md'), 'utf-8');

    expect(snippet).toContain(PUBLIC_AGENT_MODE_COMMAND);
    expect(snippet).toContain(`${PUBLIC_COMMAND} login`);
    expect(snippet).toContain('.viberaven/agent-summary.md');
    expect(snippet).toContain('viberaven prompt');
    expect(snippet).toContain(PUBLIC_VERIFY_COMMAND);
    expect(snippet).toContain('Do not claim');
    expect(snippet).not.toContain('npx -y viberaven@beta');
  });
});

describe('generateReportHtml', () => {
  it('uses station shell chrome and client-side station assets', () => {
    const html = generateReportHtml(fixture);

    expect(html).toContain('data-surface="panel"');
    expect(html).toContain('data-skin="editorial"');
    expect(html).toContain('href="report/station.css"');
    expect(html).toContain('src="report/station.js"');
    expect(html).toContain('fonts.googleapis.com/css2?family=Geist');
    expect(html).toContain('report/assets/viberaven-logo.png');
    expect(html).toContain('studio-top-rail__wordmark">VIBERAVEN');
    expect(html).toContain('studio-top-rail__label">MISSION MAP');
    expect(html).toContain('id="mc-production-map"');
    expect(html).toContain('id="studio-setup-panel"');
    expect(html).not.toContain('class="cli-mission-report"');
    expect(html).not.toContain('href="report/report-cli.css"');
  });

  it('embeds hydrated scan payload in __VIBERAVEN_STATIC_STATE__', () => {
    const html = generateReportHtml(fixture);
    const state = parseStaticState(html);
    const payload = state.lastPayload as CliScanArtifact;

    expect(state.lastScannedAt).toBe(fixture.scannedAt);
    expect(state.selectedProductionCategoryKey).toBe('auth');
    expect(payload.workspacePath).toBe(fixture.workspacePath);
    expect(payload.productionCorePercent).toBe(70);
    expect(payload.gaps[0]?.id).toBe('gap-auth-1');
    expect(payload.providerOptions?.auth?.length).toBeGreaterThan(0);
  });

  it('includes acquireVsCodeApi shim for static offline reports', () => {
    const html = generateReportHtml(fixture);

    expect(html).toContain('function acquireVsCodeApi()');
    expect(html).toContain('window.__VIBERAVEN_STATIC_STATE__');
    expect(html).toContain("message.type === 'station:openExternal'");
    expect(html).toContain("message.type === 'station:copy'");
    expect(html).toContain('nonce="viberaven-static-report"');
  });

  it('embeds static session when account metadata is present', () => {
    const html = generateReportHtml(fixture);
    const state = parseStaticState(html);
    const session = state.staticSession as {
      signedIn: boolean;
      account: { email: string; plan: string };
    };

    expect(session.signedIn).toBe(true);
    expect(session.account.email).toBe('dev@example.com');
    expect(session.account.plan).toBe('free');
    expect(html).toContain('station-account-strip');
  });

  it('defaults selectedProductionCategoryKey from mission areas when gaps are absent', () => {
    const withPaymentsOnly: CliScanArtifact = {
      ...fixture,
      gaps: [],
      missionGraph: {
        ...fixture.missionGraph,
        areas: [
          {
            key: 'payments',
            label: 'Payments',
            readinessPercent: 80,
            criticalCount: 0,
            providerMissions: []
          }
        ]
      }
    } as unknown as CliScanArtifact;
    const state = parseStaticState(generateReportHtml(withPaymentsOnly));

    expect(state.selectedProductionCategoryKey).toBe('payments');
  });

  it('hydrates provider options for every mission map area', () => {
    const payload = parseStaticState(generateReportHtml(fixture)).lastPayload as CliScanArtifact;

    for (const key of [
      'appFlow',
      'frontend',
      'backend',
      'auth',
      'database',
      'payments',
      'deployment',
      'monitoring',
      'security',
      'testing',
      'landing',
      'errorHandling'
    ]) {
      expect(payload.providerOptions?.[key]?.length).toBeGreaterThan(0);
    }
  });

  it('strips provider truth evidence from embedded payload', () => {
    const stripeSecret = `${'sk_' + 'live'}_${'secretabcdefghijklmnop'}`;
    const withProviderTruth: CliScanArtifact = {
      ...contractFixture(),
      providerTruth: {
        version: 1,
        generatedAt: '2026-06-05T00:00:00.000Z',
        summary: {
          liveVerifiedCount: 1,
          conflictCount: 0,
          needsMcpCount: 0,
          manualOnlyCount: 0
        },
        areas: [
          {
            area: 'payments',
            rows: [
              {
                area: 'payments',
                provider: 'polar',
                providerLabel: 'Polar',
                roles: ['using-now'],
                confidence: 'high',
                score: 92,
                statusBadges: ['USING NOW'],
                evidence: [{ label: 'secret proof', detail: stripeSecret }],
                mcpProof: {
                  status: 'live-verified',
                  evidence: ['token=secret-value'],
                  readOnly: true
                },
                manualProof: {
                  status: 'not-checked',
                  evidence: []
                },
                recommendedActions: []
              }
            ],
            usingNow: null,
            liveVerified: null,
            selected: null,
            conflicts: []
          }
        ]
      }
    } as unknown as CliScanArtifact;

    const html = generateReportHtml(withProviderTruth);
    expect(html).not.toContain(stripeSecret);
    expect(html).not.toContain('token=secret-value');

    const row = (parseStaticState(html).lastPayload as CliScanArtifact).providerTruth?.areas?.[0]
      ?.rows?.[0];
    expect(row?.evidence).toEqual([]);
    expect(row?.mcpProof?.evidence).toEqual([]);
  });

  it('renders fragile provider marks via assets, CDN, or inline SVG', () => {
    expect(providerLogoHtml('logrocket')).toContain('report/assets/provider-logrocket.svg');
    expect(providerLogoHtml('aws')).toContain('report/assets/provider-aws.svg');
    expect(providerLogoHtml('authjs')).toContain('report/assets/provider-authjs.svg');
    expect(providerLogoHtml('vitest')).toContain('viewBox');
    expect(providerLogoHtml('vitest')).not.toContain('cdn.simpleicons.org/vitest');
    expect(providerLogoHtml('bot protection')).toContain('M12 2.4 20 5.5');
    expect(providerLogoHtml('Cloudflare')).toContain('viewBox="0 0 32 32"');
    expect(providerLogoHtml('authjs')).not.toContain('fill="#412991"');
  });

  it('ships clean bundled marks for fragile providers', () => {
    const authJs = readFileSync(join(reportAssetRoot, 'assets', 'provider-authjs.svg'), 'utf-8');
    const aws = readFileSync(join(reportAssetRoot, 'assets', 'provider-aws.svg'), 'utf-8');
    const logrocket = readFileSync(join(reportAssetRoot, 'assets', 'provider-logrocket.svg'), 'utf-8');
    const css = readFileSync(join(reportAssetRoot, 'report-cli.css'), 'utf-8');

    expect(authJs).not.toContain('<title>');
    expect(aws).toContain('>AWS<');
    expect(logrocket).not.toContain('<rect width="64" height="64"');
    expect(css).not.toContain('object-fit: cover');
    expect(css).toContain('color: #fffdf7 !important');
    expect(css).toContain('-webkit-text-fill-color: #fffdf7');
    expect(css).toContain('.provider-logo--authjs .provider-logo__img');
    expect(css).toContain('.studio-choice-tile--selected:not(.studio-choice-tile--in-project)');
    expect(css).toContain('.studio-choice-tile--in-project');
    expect(css).toContain('background: #047857');
    expect(css).toContain('border: 2px solid #10b981');
    expect(css).toContain('.studio-added-path');
    expect(css).toContain('.studio-setup-actions__mcp-row .studio-action-button');
    expect(css).toContain('.studio-provider-readiness');
    expect(css).toContain('.studio-provider-readiness__meter-row');
    expect(css).toContain('.studio-provider-readiness__bar-fill');
  });

  it('copies fragile provider assets into generated reports', () => {
    expect(REPORT_ASSET_FILES).toContain('assets/provider-authjs.svg');
    expect(REPORT_ASSET_FILES).toContain('assets/provider-aws.svg');
    expect(REPORT_ASSET_FILES).toContain('assets/provider-logrocket.svg');
  });
});

describe('writeScanArtifacts', () => {
  let cwd: string | undefined;

  afterEach(async () => {
    if (cwd) {
      await rm(cwd, { recursive: true, force: true });
      cwd = undefined;
    }
  });

  it('writes scan artifacts to .viberaven', async () => {
    cwd = await mkdtemp(join(tmpdir(), 'viberaven-report-'));
    const artifact = { ...fixture, workspacePath: cwd } as CliScanArtifact;
    const paths = await writeScanArtifacts({ artifact, cwd });

    expect(paths.jsonPath).toContain('last-scan.json');
    expect(paths.summaryPath).toContain('agent-summary.md');
    expect(paths.playbookPath).toContain('launch-playbook.md');
    expect(paths.reportPath).toContain('report.html');
    expect(paths.tasklistPath).toContain('agent-tasklist.md');
    expect(paths.gateResultPath).toContain('gate-result.json');
    expect(paths.contextMapPath).toContain('context-map.json');
    expect(paths.gapsDir).toContain('gaps');
    expect(existsSync(join(cwd, '.viberaven', 'gate-result.json'))).toBe(true);
    expect(existsSync(join(cwd, '.viberaven', 'context-map.json'))).toBe(true);
    expect(existsSync(join(cwd, '.viberaven', 'gaps'))).toBe(true);

    const gateResult = JSON.parse(readFileSync(join(cwd, '.viberaven', 'gate-result.json'), 'utf8'));
    expect(gateResult.commands.verify).toBe('npx -y viberaven --verify');
    expect(gateResult.artifacts.contextMap).toBe('.viberaven/context-map.json');

    const contextMap = JSON.parse(readFileSync(join(cwd, '.viberaven', 'context-map.json'), 'utf8'));
    expect(contextMap.agentContract.machineResult).toBe('.viberaven/gate-result.json');
  });
});

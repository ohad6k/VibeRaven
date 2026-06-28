import { describe, expect, it, vi } from 'vitest';
import { printScanSummary } from '../src/terminalSummary';
import type { CliScanArtifact } from '../src/types';

function artifact(overrides: Partial<CliScanArtifact> = {}): CliScanArtifact {
  return {
    version: 1,
    scannedAt: '2026-06-09T00:00:00.000Z',
    workspacePath: 'D:\\app',
    score: 60,
    scoreLabel: 'Needs hardening',
    summary: 'Missing production pieces.',
    archetype: 'saas',
    gaps: [
      {
        id: 'AUTH_001',
        title: 'Protect API routes',
        detail: 'API routes need server-side auth checks.',
        severity: 'critical',
        primaryMapCategory: 'auth',
        affectedMapCategories: ['auth'],
        category: 'auth'
      }
    ],
    missionGraph: { areas: [], byArea: {} },
    stackWiring: { areas: [], providers: [] },
    providerRegistry: { providers: [] },
    verificationSummary: { checkedAt: '2026-06-09T00:00:00.000Z', checks: [] },
    productionCorePercent: 54,
    ...overrides
  } as CliScanArtifact;
}

describe('printScanSummary', () => {
  it('surfaces the HTML report and concrete next action after a scan', () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((message = '') => logs.push(String(message)));

    printScanSummary(artifact(), {
      reportPath: 'D:\\app\\.viberaven\\report.html',
      jsonPath: 'D:\\app\\.viberaven\\last-scan.json',
      summaryPath: 'D:\\app\\.viberaven\\agent-summary.md',
      playbookPath: 'D:\\app\\.viberaven\\launch-playbook.md'
    });

    const output = logs.join('\n');
    expect(output).toContain('Open report: D:\\app\\.viberaven\\report.html');
    expect(output).toContain('Next action: Protect API routes');
    expect(output).toContain('Run: viberaven prompt --gap AUTH_001');
    expect(output).toContain('AGENT_ACTION: Read .viberaven/agent-tasklist.md, run the next command above, then rescan.');
  });
});

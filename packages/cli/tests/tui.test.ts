import { describe, expect, it } from 'vitest';
import type { CliScanArtifact } from '../src/types';
import type { Gap } from '../../../src/station/types';
import {
  formatTopGapsList,
  isScanNotFoundError,
  needsScanMessage,
  pickGap,
  ScanNotFoundError,
  sortGapsByPriority
} from '../src/tui/menu';

function makeGap(overrides: Partial<Gap> & Pick<Gap, 'id' | 'title' | 'severity'>): Gap {
  return {
    category: 'DATABASE & DATA',
    detail: 'detail',
    copyPrompt: 'fix it',
    toolSuggestions: [],
    mcpSuggestion: null,
    primaryMapCategory: 'database',
    affectedMapCategories: [],
    ...overrides
  };
}

function makeArtifact(gaps: Gap[]): CliScanArtifact {
  return {
    version: 1,
    scannedAt: new Date().toISOString(),
    workspacePath: '/tmp/project',
    score: 50,
    scoreLabel: 'Needs work',
    summary: 'summary',
    archetype: 'web-app',
    gaps,
    missionGraph: { areas: [] },
    stackWiring: {},
    providerRegistry: { providers: [] },
    productionCorePercent: 42
  } as unknown as CliScanArtifact;
}

describe('sortGapsByPriority', () => {
  it('orders critical before warning before info', () => {
    const gaps = [
      makeGap({ id: 'info-1', title: 'Info gap', severity: 'info' }),
      makeGap({ id: 'crit-1', title: 'Critical gap', severity: 'critical' }),
      makeGap({ id: 'warn-1', title: 'Warning gap', severity: 'warning' })
    ];
    const sorted = sortGapsByPriority(gaps);
    expect(sorted.map((g) => g.severity)).toEqual(['critical', 'warning', 'info']);
  });
});

describe('pickGap', () => {
  const artifact = makeArtifact([
    makeGap({ id: 'db-rls', title: 'RLS missing', severity: 'critical', primaryMapCategory: 'database' }),
    makeGap({ id: 'auth-mfa', title: 'No MFA', severity: 'warning', primaryMapCategory: 'auth' })
  ]);

  it('returns top gap by severity when no options', () => {
    expect(pickGap(artifact)?.id).toBe('db-rls');
  });

  it('finds gap by id', () => {
    expect(pickGap(artifact, { gapId: 'auth-mfa' })?.title).toBe('No MFA');
  });

  it('finds gap by area', () => {
    expect(pickGap(artifact, { area: 'auth' })?.id).toBe('auth-mfa');
  });
});

describe('formatTopGapsList', () => {
  it('lists gaps in priority order', () => {
    const artifact = makeArtifact([
      makeGap({ id: 'a', title: 'Alpha', severity: 'warning', primaryMapCategory: 'auth' }),
      makeGap({ id: 'b', title: 'Beta', severity: 'critical', primaryMapCategory: 'database' })
    ]);
    const list = formatTopGapsList(artifact);
    expect(list).toContain('1. [CRITICAL]');
    expect(list).toContain('Beta');
    expect(list).toContain('2. [WARNING ]');
  });

  it('handles empty gaps', () => {
    expect(formatTopGapsList(makeArtifact([]))).toContain('No gaps found');
  });
});

describe('needsScanMessage', () => {
  it('returns actionable guidance', () => {
    expect(needsScanMessage('D:\\repo')).toContain('Scan project');
    expect(needsScanMessage('D:\\repo')).toContain('extension');
  });
});

describe('ScanNotFoundError', () => {
  it('is detected by isScanNotFoundError', () => {
    const error = new ScanNotFoundError();
    expect(isScanNotFoundError(error)).toBe(true);
    expect(isScanNotFoundError(new Error('other'))).toBe(false);
  });
});

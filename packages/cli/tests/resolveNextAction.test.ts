import { describe, expect, it } from 'vitest';
import { FREE_TRIAL_UNLOCKED_MAP_CATEGORY_KEYS } from '../../../shared/planLimits';
import { resolveNextAction } from '../src/resolveNextAction';
import type { CliScanArtifact } from '../src/types';

function baseArtifact(overrides: Partial<CliScanArtifact> = {}): CliScanArtifact {
  return {
    version: 1,
    scannedAt: '2026-06-07T00:00:00.000Z',
    workspacePath: '/tmp/app',
    score: 40,
    scoreLabel: 'At risk',
    summary: 'test',
    archetype: 'saas',
    productionCorePercent: 40,
    gaps: [],
    missionGraph: { areas: [], byArea: {} },
    stackWiring: { areas: [], providers: [] },
    providerRegistry: { providers: [] },
    usage: {
      plan: 'free',
      remainingPrompts: 1,
      used: 1,
      limit: 2,
      period: 'lifetime',
      unlockedMapCategoryKeys: [...FREE_TRIAL_UNLOCKED_MAP_CATEGORY_KEYS]
    },
    ...overrides
  } as CliScanArtifact;
}

describe('resolveNextAction', () => {
  it('prioritizes unlocked repo gap', () => {
    const artifact = baseArtifact({
      gaps: [
        {
          id: 'gap-auth',
          category: 'auth',
          severity: 'critical',
          title: 'Fix auth middleware',
          detail: 'Protect API routes',
          primaryMapCategory: 'auth',
          affectedMapCategories: ['auth']
        },
        {
          id: 'gap-deploy',
          category: 'deploy',
          severity: 'critical',
          title: 'Deploy to Vercel',
          detail: 'No deployment',
          primaryMapCategory: 'deployment',
          affectedMapCategories: ['deployment']
        }
      ]
    });
    const next = resolveNextAction(artifact);
    expect(next.type).toBe('repo-fix');
    expect(next.title).toBe('Fix auth middleware');
  });

  it('upsells when only locked lane gaps remain', () => {
    const artifact = baseArtifact({
      gaps: [
        {
          id: 'gap-deploy',
          category: 'deploy',
          severity: 'critical',
          title: 'Deploy to Vercel',
          detail: 'No deployment',
          primaryMapCategory: 'deployment',
          affectedMapCategories: ['deployment']
        }
      ]
    });
    const next = resolveNextAction(artifact);
    expect(next.type).toBe('upgrade');
    expect(next.lockedLane).toBe('deployment');
  });
});

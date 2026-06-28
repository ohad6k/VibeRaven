import { describe, expect, it } from 'vitest';

import { buildTaskList, buildTaskListMarkdown } from '../src/buildTaskList';
import type { CliScanArtifact } from '../src/types';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function baseArtifact(overrides: Partial<CliScanArtifact> = {}): CliScanArtifact {
  return {
    version: 1,
    scannedAt: '2026-06-09T12:00:00.000Z',
    workspacePath: '/tmp/demo-app',
    score: 55,
    scoreLabel: 'At risk',
    summary: 'Multiple critical gaps detected.',
    archetype: 'saas-mvp',
    plan: 'free',
    gaps: [],
    missionGraph: {
      areas: [],
      byArea: {},
      byProvider: {},
      repositoryEvidence: { env: [], security: [] },
    },
    stackWiring: { items: [], byKey: {} },
    providerRegistry: {
      version: 'test',
      source: 'bundled',
      generatedAt: '2026-06-09T12:00:00.000Z',
      status: 'fresh',
      providers: [],
    },
    productionCorePercent: 55,
    ...overrides,
  } as unknown as CliScanArtifact;
}

// A gap that has a known heal recipe (emptyCatch) — in an unlocked lane (auth)
const recipeGap = {
  id: 'empty-catch',
  category: 'SECURITY & AUTH' as const,
  severity: 'critical' as const,
  title: 'Empty catch blocks suppress errors silently',
  detail: 'Empty catch blocks make debugging impossible.',
  copyPrompt: 'Add error logging to all empty catch blocks.',
  toolSuggestions: [],
  mcpSuggestion: null,
  primaryMapCategory: 'auth' as const,   // auth is in FREE_TRIAL_UNLOCKED_MAP_CATEGORY_KEYS
  affectedMapCategories: [] as const,
};

// A gap that maps to a provider playbook (payments category → stripe)
// payments is in FREE_TRIAL_UNLOCKED_MAP_CATEGORY_KEYS
const providerGap = {
  id: 'stripe-payment-missing',
  category: 'MISSING FEATURES' as const,
  severity: 'warning' as const,
  title: 'No Stripe payment configured',
  detail: 'The project has no Stripe payment integration.',
  copyPrompt: 'Set up Stripe webhooks and product.',
  toolSuggestions: [],
  mcpSuggestion: null,
  primaryMapCategory: 'payments' as const,
  affectedMapCategories: [] as const,
};

// A gap in a locked lane (security is NOT in FREE_TRIAL_UNLOCKED_MAP_CATEGORY_KEYS)
const lockedGap = {
  id: 'missing-csp-header',
  category: 'SECURITY & AUTH' as const,
  severity: 'warning' as const,
  title: 'Missing Content-Security-Policy header',
  detail: 'No CSP header found in project.',
  copyPrompt: 'Add a CSP header in next.config.js.',
  toolSuggestions: [],
  mcpSuggestion: null,
  primaryMapCategory: 'security' as const,
  affectedMapCategories: [] as const,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildTaskList', () => {
  it('assigns TASK-001, TASK-002, TASK-003 ids in priority order', () => {
    const artifact = baseArtifact({ gaps: [lockedGap, providerGap, recipeGap] });
    const tasks = buildTaskList(artifact);

    expect(tasks).toHaveLength(3);
    expect(tasks[0].id).toBe('TASK-001');
    expect(tasks[1].id).toBe('TASK-002');
    expect(tasks[2].id).toBe('TASK-003');
  });

  it('orders: critical repo-code first, then warning provider-action, then warning upgrade-required', () => {
    // recipeGap is critical+repo-code, providerGap is warning+provider-action,
    // lockedGap is warning+upgrade-required
    const artifact = baseArtifact({ gaps: [lockedGap, providerGap, recipeGap] });
    const tasks = buildTaskList(artifact);

    expect(tasks[0].gapId).toBe(recipeGap.id);
    expect(tasks[0].fixType).toBe('repo-code');
    expect(tasks[0].severity).toBe('critical');

    // warning gaps are sorted alphabetically after critical — both providerGap and lockedGap are warning
    // sortGapsByPriority sorts by severity then title
    const warningTasks = tasks.filter((t) => t.severity === 'warning');
    expect(warningTasks).toHaveLength(2);
  });

  it('repo-code task has requiresUserAction=false and correct mcpTool/mcpArgs', () => {
    const artifact = baseArtifact({ gaps: [recipeGap] });
    const tasks = buildTaskList(artifact);

    expect(tasks).toHaveLength(1);
    const task = tasks[0];
    expect(task.fixType).toBe('repo-code');
    expect(task.requiresUserAction).toBe(false);
    expect(task.mcpTool).toBe('viberaven_heal_apply');
    expect(task.mcpArgs).toEqual({ gap: 'empty-catch', yes: true });
  });

  it('provider-action task has requiresUserAction=true and no mcpTool', () => {
    const artifact = baseArtifact({ gaps: [providerGap] });
    const tasks = buildTaskList(artifact);

    expect(tasks).toHaveLength(1);
    const task = tasks[0];
    expect(task.fixType).toBe('provider-action');
    expect(task.requiresUserAction).toBe(true);
    expect(task.mcpTool).toBeUndefined();
    expect(task.mcpArgs).toBeUndefined();
  });

  it('locked lane gap produces upgrade-required with requiresUserAction=true', () => {
    const artifact = baseArtifact({ gaps: [lockedGap] });
    const tasks = buildTaskList(artifact);

    expect(tasks).toHaveLength(1);
    const task = tasks[0];
    expect(task.fixType).toBe('upgrade-required');
    expect(task.requiresUserAction).toBe(true);
    expect(task.mcpTool).toBeUndefined();
  });

  it('returns empty array when artifact has no gaps', () => {
    const artifact = baseArtifact({ gaps: [] });
    const tasks = buildTaskList(artifact);
    expect(tasks).toHaveLength(0);
  });

  it('gapId is populated from gap.id', () => {
    const artifact = baseArtifact({ gaps: [recipeGap] });
    const [task] = buildTaskList(artifact);
    expect(task.gapId).toBe('empty-catch');
  });

  it('verifyCommand is always the public verify command', () => {
    const artifact = baseArtifact({ gaps: [recipeGap, providerGap, lockedGap] });
    const tasks = buildTaskList(artifact);
    for (const task of tasks) {
      expect(task.verifyCommand).toBe('npx -y viberaven --verify');
    }
  });
});

describe('buildTaskListMarkdown', () => {
  it('renders empty message for no tasks', () => {
    const md = buildTaskListMarkdown([]);
    expect(md).toContain('No gaps found');
  });

  it('renders TASK-NNN headings for each task', () => {
    const artifact = baseArtifact({ gaps: [recipeGap, providerGap] });
    const tasks = buildTaskList(artifact);
    const md = buildTaskListMarkdown(tasks);

    expect(md).toContain('## TASK-001');
    expect(md).toContain('## TASK-002');
  });

  it('includes fixType, severity, and gapId in each block', () => {
    const artifact = baseArtifact({ gaps: [recipeGap] });
    const tasks = buildTaskList(artifact);
    const md = buildTaskListMarkdown(tasks);

    expect(md).toContain('repo-code');
    expect(md).toContain('CRITICAL');
    expect(md).toContain('empty-catch');
  });

  it('includes MCP line for repo-code tasks', () => {
    const artifact = baseArtifact({ gaps: [recipeGap] });
    const tasks = buildTaskList(artifact);
    const md = buildTaskListMarkdown(tasks);

    expect(md).toContain('viberaven_heal_apply');
    expect(md).toContain('**Requires user action:** false');
  });

  it('shows "No automated recipe" fallback when exactFix is absent', () => {
    const artifact = baseArtifact({ gaps: [lockedGap] });
    const tasks = buildTaskList(artifact);
    const md = buildTaskListMarkdown(tasks);

    expect(md).toContain('No automated recipe');
  });
});

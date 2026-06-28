/**
 * W7 — Integration test: full agent loop without real API calls.
 *
 * Simulates: mock scan artifact → buildTaskList → stdout blocks → heal apply → rescan state.
 */

import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { buildTaskList } from '../../src/buildTaskList';
import { applyHeal } from '../../src/heal/apply';
import { dispatchRecipeByGapId } from '../../src/heal/recipes/index';
import { loadLoopState } from '../../src/loopState';
import {
  buildNextActionBlock,
  printNextActionBlock,
  printProviderActionBlock,
  type NextActionBlock,
} from '../../src/output/nextActionBlock';
import type { CliScanArtifact } from '../../src/types';
import mockArtifactJson from '../fixtures/mockArtifact3Gaps.json';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const mockArtifact = mockArtifactJson as unknown as CliScanArtifact;

function artifactAfterAuthFix(): CliScanArtifact {
  return {
    ...mockArtifact,
    gaps: mockArtifact.gaps.filter((g) => g.id !== 'auth_secret_missing'),
  };
}

// ---------------------------------------------------------------------------
// Stdout capture helpers
// ---------------------------------------------------------------------------

function captureStdout(fn: () => void): string[] {
  const logs: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((message = '') => logs.push(String(message)));
  try {
    fn();
  } finally {
    spy.mockRestore();
  }
  return logs;
}

function parseNextActionBlock(logs: string[]): NextActionBlock {
  const startIdx = logs.indexOf('VIBERAVEN_NEXT_ACTION_START');
  expect(startIdx).toBeGreaterThanOrEqual(0);
  expect(logs[logs.length - 1]).toBe('VIBERAVEN_NEXT_ACTION_END');
  return JSON.parse(logs[startIdx + 1]) as NextActionBlock;
}

function parseProviderActionBlock(logs: string[]): Record<string, unknown> {
  const startIdx = logs.indexOf('VIBERAVEN_PROVIDER_ACTION_START');
  expect(startIdx).toBeGreaterThanOrEqual(0);
  expect(logs[logs.length - 1]).toBe('VIBERAVEN_PROVIDER_ACTION_END');
  return JSON.parse(logs[startIdx + 1]) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Temp workspace lifecycle
// ---------------------------------------------------------------------------

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('agent loop integration (W7)', () => {
  beforeAll(() => {
    expect(mockArtifact.usage?.unlockedMapCategoryKeys).not.toContain('monitoring');
    expect(mockArtifact.gaps).toHaveLength(3);
  });

  it('buildTaskList returns 3 tasks in priority order with correct fixTypes', () => {
    const tasks = buildTaskList(mockArtifact);

    expect(tasks).toHaveLength(3);
    expect(tasks[0].gapId).toBe('auth_secret_missing');
    expect(tasks[0].fixType).toBe('repo-code');
    expect(tasks[0].severity).toBe('critical');

    expect(tasks[1].gapId).toBe('rls_disabled');
    expect(tasks[1].fixType).toBe('provider-action');
    expect(tasks[1].severity).toBe('critical');

    expect(tasks[2].gapId).toBe('monitoring_not_configured');
    expect(tasks[2].fixType).toBe('upgrade-required');
    expect(tasks[2].severity).toBe('warning');
  });

  it('printNextActionBlock stdout targets auth_secret_missing with viberaven_heal_apply', () => {
    const tasks = buildTaskList(mockArtifact);
    const loopState = { batchApplied: 0, lastGapCount: 3, stalledScans: 0 };
    const block = buildNextActionBlock(tasks, loopState, 'free');

    const logs = captureStdout(() => printNextActionBlock(block));
    const parsed = parseNextActionBlock(logs);

    expect(parsed.gapId).toBe('auth_secret_missing');
    expect(parsed.type).toBe('repo-code');
    expect(parsed.mcpTool).toBe('viberaven_heal_apply');
    expect(parsed.mcpArgs).toEqual({ gap: 'auth_secret_missing', yes: true });
    expect(parsed.requiresUserAction).toBe(false);
  });

  it('printProviderActionBlock stdout targets rls_disabled with provider supabase', () => {
    const tasks = buildTaskList(mockArtifact);

    const logs = captureStdout(() => printProviderActionBlock(tasks));
    const parsed = parseProviderActionBlock(logs);

    expect(parsed).toHaveProperty('VIBERAVEN_PROVIDER_ACTION');
    const payload = parsed.VIBERAVEN_PROVIDER_ACTION as Record<string, unknown>;
    expect(payload.gap).toBe('rls_disabled');
    expect(payload.provider).toBe('supabase');
    expect(payload.dashboardUrl).toBeTruthy();
    expect(payload.exactStep).toBeTruthy();
    expect(payload.doneSignal).toBeTruthy();
    expect(payload.verifyCommand).toBeTruthy();
  });

  it('dispatchRecipeByGapId and applyHeal add NEXTAUTH_SECRET to .env.local in temp workspace', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-agent-loop-'));

    const dispatched = await dispatchRecipeByGapId('auth_secret_missing', tempDir);
    expect(dispatched).not.toBeNull();
    expect(dispatched!.canAutoApply).toBe(true);
    expect(dispatched!.changed).toBe(true);
    expect(dispatched!.targetFile).toBe('.env.local');
    expect(dispatched!.output).toContain('NEXTAUTH_SECRET=');

    const result = await applyHeal({
      cwd: tempDir,
      mode: 'apply',
      gapId: 'auth_secret_missing',
      yes: true,
      noVerify: true,
    });

    expect(result.status).toBe('applied_verify_not_run');
    expect(result.changedFiles).toContain('.env.local');
    expect(existsSync(join(tempDir, '.env.local'))).toBe(true);

    const envContent = await readFile(join(tempDir, '.env.local'), 'utf8');
    expect(envContent).toContain('NEXTAUTH_SECRET=');
  });

  it('after auth fix, buildTaskList has 2 tasks and next action is provider-action for rls_disabled', () => {
    const reduced = artifactAfterAuthFix();
    expect(reduced.gaps).toHaveLength(2);

    const tasks = buildTaskList(reduced);
    expect(tasks).toHaveLength(2);
    expect(tasks[0].gapId).toBe('rls_disabled');
    expect(tasks[0].fixType).toBe('provider-action');
    expect(tasks[1].gapId).toBe('monitoring_not_configured');
    expect(tasks[1].fixType).toBe('upgrade-required');

    const loopState = { batchApplied: 1, lastGapCount: 2, stalledScans: 0 };
    const block = buildNextActionBlock(tasks, loopState, 'free');

    const logs = captureStdout(() => printNextActionBlock(block));
    const parsed = parseNextActionBlock(logs);

    expect(parsed.gapId).toBe('rls_disabled');
    expect(parsed.type).toBe('provider-action');
    expect(parsed.requiresUserAction).toBe(true);
    expect(parsed.mcpTool).toBeUndefined();
  });

  it('does not read or write real .viberaven directory (uses isolated temp workspace for heal)', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-agent-loop-'));
    const loopBefore = await loadLoopState(process.cwd());

    await applyHeal({
      cwd: tempDir,
      mode: 'apply',
      gapId: 'auth_secret_missing',
      yes: true,
      noVerify: true,
    });

    expect(existsSync(join(tempDir, '.viberaven', 'heal'))).toBe(true);
    expect(existsSync(join(process.cwd(), '.viberaven', 'heal'))).toBe(false);

    const loopAfter = await loadLoopState(process.cwd());
    expect(loopAfter).toEqual(loopBefore);
  });
});

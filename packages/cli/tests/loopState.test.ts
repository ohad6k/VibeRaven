import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  loadLoopState,
  saveLoopState,
  incrementBatch,
  resetBatch,
  type LoopState,
} from '../src/loopState';

const DEFAULT_STATE: LoopState = { batchApplied: 0, lastGapCount: -1, stalledScans: 0, appliedGapIdsSinceScan: [] };

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'vr-loopstate-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('loadLoopState', () => {
  it('returns default when loop-state.json is missing', async () => {
    const state = await loadLoopState(tmpDir);
    expect(state).toEqual(DEFAULT_STATE);
  });

  it('returns default when loop-state.json has corrupted JSON', async () => {
    const vrDir = join(tmpDir, '.viberaven');
    await mkdir(vrDir, { recursive: true });
    await writeFile(join(vrDir, 'loop-state.json'), 'not-valid-json', 'utf8');
    const state = await loadLoopState(tmpDir);
    expect(state).toEqual(DEFAULT_STATE);
  });

  it('returns default when loop-state.json has wrong shape', async () => {
    const vrDir = join(tmpDir, '.viberaven');
    await mkdir(vrDir, { recursive: true });
    await writeFile(join(vrDir, 'loop-state.json'), JSON.stringify({ foo: 'bar' }), 'utf8');
    const state = await loadLoopState(tmpDir);
    expect(state).toEqual(DEFAULT_STATE);
  });

  it('loads a valid saved state', async () => {
    const saved: LoopState = {
      batchApplied: 2,
      lastGapCount: 7,
      stalledScans: 1,
      appliedGapIdsSinceScan: ['auth_secret_missing'],
    };
    await saveLoopState(tmpDir, saved);
    const loaded = await loadLoopState(tmpDir);
    expect(loaded).toEqual(saved);
  });
});

describe('saveLoopState', () => {
  it('writes loop-state.json without throwing', async () => {
    const state: LoopState = {
      batchApplied: 1,
      lastGapCount: 5,
      stalledScans: 0,
      appliedGapIdsSinceScan: ['missing_health_route'],
    };
    await expect(saveLoopState(tmpDir, state)).resolves.toBeUndefined();
    const loaded = await loadLoopState(tmpDir);
    expect(loaded).toEqual(state);
  });
});

describe('incrementBatch', () => {
  it('increments batchApplied from 0 to 1', () => {
    const state: LoopState = { batchApplied: 0, lastGapCount: -1, stalledScans: 0 };
    const next = incrementBatch(state, 'auth_secret_missing');
    expect(next.batchApplied).toBe(1);
    expect(next.lastGapCount).toBe(-1);
    expect(next.stalledScans).toBe(0);
    expect(next.appliedGapIdsSinceScan).toEqual(['auth_secret_missing']);
  });

  it('increments batchApplied from 2 to 3', () => {
    const state: LoopState = { batchApplied: 2, lastGapCount: 10, stalledScans: 0 };
    const next = incrementBatch(state);
    expect(next.batchApplied).toBe(3);
    expect(next.appliedGapIdsSinceScan).toEqual([]);
  });

  it('does not mutate the original state', () => {
    const state: LoopState = { batchApplied: 0, lastGapCount: -1, stalledScans: 0 };
    incrementBatch(state);
    expect(state.batchApplied).toBe(0);
  });

  it('does not duplicate gap ids', () => {
    const state: LoopState = {
      batchApplied: 1,
      lastGapCount: 10,
      stalledScans: 0,
      appliedGapIdsSinceScan: ['auth_secret_missing'],
    };
    const next = incrementBatch(state, 'auth_secret_missing');
    expect(next.appliedGapIdsSinceScan).toEqual(['auth_secret_missing']);
  });
});

describe('resetBatch', () => {
  it('first scan (lastGapCount=-1): stalledScans=0, lastGapCount=newCount, batchApplied=0', () => {
    const state: LoopState = { batchApplied: 2, lastGapCount: -1, stalledScans: 0 };
    const next = resetBatch(state, 10);
    expect(next).toEqual({ batchApplied: 0, lastGapCount: 10, stalledScans: 0, appliedGapIdsSinceScan: [] });
  });

  it('progress made (newGapCount < lastGapCount): stalledScans resets to 0', () => {
    const state: LoopState = { batchApplied: 3, lastGapCount: 10, stalledScans: 1 };
    const next = resetBatch(state, 7);
    expect(next).toEqual({ batchApplied: 0, lastGapCount: 7, stalledScans: 0, appliedGapIdsSinceScan: [] });
  });

  it('no progress (newGapCount === lastGapCount): stalledScans increments', () => {
    const state: LoopState = { batchApplied: 3, lastGapCount: 7, stalledScans: 0 };
    const next = resetBatch(state, 7);
    expect(next).toEqual({ batchApplied: 0, lastGapCount: 7, stalledScans: 1, appliedGapIdsSinceScan: [] });
  });

  it('no progress again: stalledScans reaches 2', () => {
    const state: LoopState = { batchApplied: 3, lastGapCount: 7, stalledScans: 1 };
    const next = resetBatch(state, 7);
    expect(next).toEqual({ batchApplied: 0, lastGapCount: 7, stalledScans: 2, appliedGapIdsSinceScan: [] });
  });

  it('gap count increases (regression): stalledScans increments', () => {
    const state: LoopState = { batchApplied: 3, lastGapCount: 7, stalledScans: 0 };
    const next = resetBatch(state, 9);
    expect(next.stalledScans).toBe(1);
    expect(next.lastGapCount).toBe(9);
  });

  it('does not mutate the original state', () => {
    const state: LoopState = { batchApplied: 3, lastGapCount: 7, stalledScans: 0 };
    resetBatch(state, 7);
    expect(state.batchApplied).toBe(3);
    expect(state.stalledScans).toBe(0);
  });
});

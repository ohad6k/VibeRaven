import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface LoopState {
  batchApplied: number;   // heals applied since last scan — resets to 0 after every verify
  lastGapCount: number;   // gap count from most recent scan (-1 = never scanned)
  stalledScans: number;   // consecutive scans where gap count did not drop
  appliedGapIdsSinceScan?: string[];
}

const DEFAULT_LOOP_STATE: LoopState = {
  batchApplied: 0,
  lastGapCount: -1,
  stalledScans: 0,
  appliedGapIdsSinceScan: [],
};

function loopStatePath(workspaceRoot: string): string {
  return join(workspaceRoot, '.viberaven', 'loop-state.json');
}

/**
 * Read .viberaven/loop-state.json.
 * If missing or malformed, returns the default state. Never throws.
 */
export async function loadLoopState(workspaceRoot: string): Promise<LoopState> {
  try {
    const raw = await readFile(loopStatePath(workspaceRoot), 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      typeof (parsed as Record<string, unknown>).batchApplied === 'number' &&
      typeof (parsed as Record<string, unknown>).lastGapCount === 'number' &&
      typeof (parsed as Record<string, unknown>).stalledScans === 'number'
    ) {
      const p = parsed as Record<string, unknown>;
      const appliedGapIdsSinceScan = Array.isArray(p.appliedGapIdsSinceScan)
        ? p.appliedGapIdsSinceScan.filter((value): value is string => typeof value === 'string')
        : [];
      return {
        batchApplied: p.batchApplied as number,
        lastGapCount: p.lastGapCount as number,
        stalledScans: p.stalledScans as number,
        appliedGapIdsSinceScan,
      };
    }
    return { ...DEFAULT_LOOP_STATE };
  } catch {
    return { ...DEFAULT_LOOP_STATE };
  }
}

/**
 * Write .viberaven/loop-state.json.
 * Never throws — logs a warning on failure.
 */
export async function saveLoopState(workspaceRoot: string, state: LoopState): Promise<void> {
  try {
    const dir = join(workspaceRoot, '.viberaven');
    await mkdir(dir, { recursive: true });
    await writeFile(loopStatePath(workspaceRoot), JSON.stringify(state, null, 2) + '\n', 'utf8');
  } catch (err) {
    console.warn('[VibeRaven] Could not save loop-state.json:', err instanceof Error ? err.message : String(err));
  }
}

/**
 * Increment batchApplied by 1 (pure, returns new state).
 */
export function incrementBatch(state: LoopState, gapId?: string): LoopState {
  const appliedGapIdsSinceScan = [...(state.appliedGapIdsSinceScan ?? [])];
  if (gapId && !appliedGapIdsSinceScan.includes(gapId)) {
    appliedGapIdsSinceScan.push(gapId);
  }
  return { ...state, batchApplied: state.batchApplied + 1, appliedGapIdsSinceScan };
}

/**
 * Called after every verify/scan. Resets batchApplied, updates stall tracking.
 *
 * Rules:
 * - Always set batchApplied = 0.
 * - If lastGapCount === -1 (first scan ever):  stalledScans = 0, lastGapCount = newGapCount.
 * - If newGapCount < lastGapCount (progress):  stalledScans = 0, lastGapCount = newGapCount.
 * - If newGapCount >= lastGapCount (no progress, not first scan): stalledScans + 1, lastGapCount = newGapCount.
 */
export function resetBatch(state: LoopState, newGapCount: number): LoopState {
  if (state.lastGapCount === -1) {
    // First scan ever
    return { batchApplied: 0, lastGapCount: newGapCount, stalledScans: 0, appliedGapIdsSinceScan: [] };
  }
  if (newGapCount < state.lastGapCount) {
    // Progress made
    return { batchApplied: 0, lastGapCount: newGapCount, stalledScans: 0, appliedGapIdsSinceScan: [] };
  }
  // No progress (newGapCount >= lastGapCount)
  return {
    batchApplied: 0,
    lastGapCount: newGapCount,
    stalledScans: state.stalledScans + 1,
    appliedGapIdsSinceScan: [],
  };
}

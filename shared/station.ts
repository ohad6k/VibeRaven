import type { ProductionMapCategoryKey } from './planLimits';

export type ManagedStationRequest = {
  prompt: string;
  workspacePath: string;
  specMarkdown: string | null;
  files: Array<{ path: string; summary: string; heat: 'hot' | 'warm' | 'cool' }>;
};

/** How scan quota resets for the current plan. */
export type StationUsagePeriod = 'lifetime' | 'monthly';

/** Metering + UI hints returned with every managed Station run. */
export type ManagedStationUsage = {
  plan: 'free' | 'pro';
  /** Scans remaining after this successful run (0 = at cap). */
  remainingPrompts: number;
  /** Completed + in-flight reservations counted toward the cap (same basis as enforcement). */
  used: number;
  limit: number;
  period: StationUsagePeriod;
  /** Start of the current quota window, when known. Pro follows the subscription billing cycle. */
  periodStart?: string | null;
  /** End of the current quota window, when known. Pro follows the subscription billing cycle. */
  periodEnd?: string | null;
  /** Mission Map sections this plan may open (free = subset; pro = all). */
  unlockedMapCategoryKeys: readonly ProductionMapCategoryKey[];
};

export type ManagedStationResponse = {
  status: 'stable' | 'drifting' | 'chaos';
  reason: string;
  impact: string;
  confidence: 'low' | 'medium' | 'high';
  output: string;
  usage: ManagedStationUsage;
};

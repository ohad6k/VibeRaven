/**
 * Launch plan limits (single source of truth for API + extension UI copy).
 * Import from `shared/` only — avoid coupling browser bundles to Node-only paths.
 */
import { PRODUCTION_MAP_LANES, type ExtensionMapCategoryKey } from './productionMapLanes';

export const FREE_TRIAL_TOTAL_STATION_RUNS = 2;

export const PRO_MONTHLY_STATION_RUNS = 50;

/** Production map category keys — must match `PRODUCTION_MAP_CATEGORIES[].key` in `media/station.js`. */
export const FREE_TRIAL_UNLOCKED_MAP_CATEGORY_KEYS = [
  'appFlow',
  'frontend',
  'backend',
  'auth',
  'database',
  'payments'
] as const;

/** Extension Station keys — derived from `PRODUCTION_MAP_LANES` (see `shared/productionMapLanes.ts`). */
export const PRODUCTION_MAP_CATEGORY_KEYS_ALL = PRODUCTION_MAP_LANES.map(
  (lane) => lane.extensionKey,
) as readonly ExtensionMapCategoryKey[];

/** Web deploy launch map uses `webKey` from the same `PRODUCTION_MAP_LANES` module. */

export type ProductionMapCategoryKey = (typeof PRODUCTION_MAP_CATEGORY_KEYS_ALL)[number];

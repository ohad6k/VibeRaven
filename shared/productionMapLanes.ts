import type { DeployProviderArea } from './deploy';

/** Web deploy launch map lane keys (`landing/src/data/stackCatalog.ts`). */
export type WebStackLaneKey =
  | 'appflow'
  | 'frontend'
  | 'backend'
  | 'auth'
  | 'database'
  | 'payments'
  | 'deploy'
  | 'monitoring'
  | 'analytics'
  | 'security'
  | 'testing'
  | 'onboarding';

/** Extension Station production map category keys (`media/station.js` PRODUCTION_MAP_CATEGORIES). */
export type ExtensionMapCategoryKey =
  | 'appFlow'
  | 'frontend'
  | 'backend'
  | 'auth'
  | 'database'
  | 'payments'
  | 'deployment'
  | 'monitoring'
  | 'security'
  | 'testing'
  | 'landing'
  | 'errorHandling';

export type ProductionMapLane = {
  webKey: WebStackLaneKey;
  extensionKey: ExtensionMapCategoryKey;
  title: string;
  deployArea?: DeployProviderArea;
};

/**
 * Canonical 12-lane alignment between web deploy UI and extension Station map.
 *
 * Ordered by extension key (matches `PRODUCTION_MAP_CATEGORIES` in `media/station.js`).
 *
 * Renamed keys (same lane, different identifiers):
 * - web `deploy` ↔ extension `deployment`
 * - web `onboarding` ↔ extension `landing`
 *
 * Monitoring / analytics split (web has two lanes; extension categories differ):
 * - Web `analytics` ↔ extension `monitoring` — extension label is "Monitoring / Analytics"
 *   and covers PostHog-style product telemetry.
 * - Web `monitoring` ↔ extension `errorHandling` — web lane focuses on Sentry / LogRocket
 *   observability; extension `errorHandling` covers reliability and error-boundary work.
 */
export const PRODUCTION_MAP_LANES: readonly ProductionMapLane[] = [
  { webKey: 'appflow', extensionKey: 'appFlow', title: 'App flow / UX' },
  { webKey: 'frontend', extensionKey: 'frontend', title: 'Frontend' },
  { webKey: 'backend', extensionKey: 'backend', title: 'Backend / API' },
  { webKey: 'auth', extensionKey: 'auth', title: 'Auth', deployArea: 'auth' },
  { webKey: 'database', extensionKey: 'database', title: 'Database', deployArea: 'database' },
  { webKey: 'payments', extensionKey: 'payments', title: 'Payments', deployArea: 'payments' },
  { webKey: 'deploy', extensionKey: 'deployment', title: 'Deployment', deployArea: 'deployment' },
  { webKey: 'analytics', extensionKey: 'monitoring', title: 'Analytics', deployArea: 'analytics' },
  { webKey: 'security', extensionKey: 'security', title: 'Security' },
  { webKey: 'testing', extensionKey: 'testing', title: 'Testing' },
  { webKey: 'onboarding', extensionKey: 'landing', title: 'Onboarding' },
  { webKey: 'monitoring', extensionKey: 'errorHandling', title: 'Monitoring', deployArea: 'monitoring' },
] as const;

const WEB_TO_EXTENSION = Object.fromEntries(
  PRODUCTION_MAP_LANES.map((lane) => [lane.webKey, lane.extensionKey]),
) as Record<WebStackLaneKey, ExtensionMapCategoryKey>;

const EXTENSION_TO_WEB = Object.fromEntries(
  PRODUCTION_MAP_LANES.map((lane) => [lane.extensionKey, lane.webKey]),
) as Record<ExtensionMapCategoryKey, WebStackLaneKey>;

const TITLE_BY_WEB_KEY = Object.fromEntries(
  PRODUCTION_MAP_LANES.map((lane) => [lane.webKey, lane.title]),
) as Record<WebStackLaneKey, string>;

export function webLaneToExtensionKey(webKey: WebStackLaneKey): ExtensionMapCategoryKey {
  return WEB_TO_EXTENSION[webKey];
}

export function extensionKeyToWebLane(extensionKey: ExtensionMapCategoryKey): WebStackLaneKey {
  return EXTENSION_TO_WEB[extensionKey];
}

export function laneTitleForWebKey(webKey: WebStackLaneKey): string {
  return TITLE_BY_WEB_KEY[webKey];
}

export function laneDefinitionForWebKey(webKey: WebStackLaneKey): ProductionMapLane {
  const lane = PRODUCTION_MAP_LANES.find((entry) => entry.webKey === webKey);
  if (!lane) {
    throw new Error(`Unknown web stack lane: ${webKey}`);
  }
  return lane;
}

import type { SelectedLaneStack, StackLaneKey } from './deploy.js';
import { isCatalogLaneKey, listLaneCatalogOptions, type LaneCatalogOption } from './laneCatalog.js';

export class LaneStackValidationError extends Error {}

const DEPLOY_AREA_LANE_KEYS = new Set<StackLaneKey>([
  'auth',
  'database',
  'payments',
  'monitoring',
  'analytics',
  'deploy'
]);

export function normalizeSelectedLaneStackForUpdate(
  stack: SelectedLaneStack | undefined,
  now = new Date()
): SelectedLaneStack {
  if (!stack || Object.keys(stack).length === 0) {
    return {};
  }

  const normalized: SelectedLaneStack = {};
  for (const [rawLane, selection] of Object.entries(stack)) {
    if (!selection) {
      continue;
    }

    const lane = rawLane as StackLaneKey;
    if (DEPLOY_AREA_LANE_KEYS.has(lane)) {
      throw new LaneStackValidationError(`Lane ${lane} must be saved through selectedProviderStack`);
    }
    if (!isCatalogLaneKey(lane)) {
      throw new LaneStackValidationError(`Unsupported lane ${lane}`);
    }

    const support = laneSupportFor(lane, selection.provider);
    if (!support) {
      throw new LaneStackValidationError(`Unsupported provider ${selection.provider} for ${lane}`);
    }
    if (selection.supportTier !== support.supportTier) {
      throw new LaneStackValidationError(
        `Provider ${support.provider} for ${lane} requires support tier ${support.supportTier}`
      );
    }

    normalized[lane] = {
      lane,
      provider: support.provider,
      label: support.label,
      selectedBy: selection.selectedBy,
      reason: selection.reason || support.reason,
      supportTier: support.supportTier,
      selectedAt: selection.selectedAt || now.toISOString()
    };
  }

  return normalized;
}

export function laneSupportFor(lane: StackLaneKey, provider: string): LaneCatalogOption | null {
  if (!isCatalogLaneKey(lane)) {
    return null;
  }

  const normalizedProvider = normalizeProviderToken(provider);
  const options = listLaneCatalogOptions()[lane] ?? [];
  const support = options.find(
    (candidate) => normalizeProviderToken(candidate.provider) === normalizedProvider
  );
  return support ? { ...support } : null;
}

function normalizeProviderToken(provider: string): string {
  return provider.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

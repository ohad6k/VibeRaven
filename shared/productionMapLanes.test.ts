import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  PRODUCTION_MAP_LANES,
  extensionKeyToWebLane,
  type ExtensionMapCategoryKey,
  type WebStackLaneKey,
  webLaneToExtensionKey,
} from './productionMapLanes';
import {
  FREE_TRIAL_UNLOCKED_MAP_CATEGORY_KEYS,
  PRODUCTION_MAP_CATEGORY_KEYS_ALL,
} from './planLimits';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

describe('productionMapLanes', () => {
  it('defines exactly 12 canonical lanes', () => {
    expect(PRODUCTION_MAP_LANES).toHaveLength(12);
  });

  it('maps web lanes to extension keys bijectively', () => {
    const webKeys = PRODUCTION_MAP_LANES.map((lane) => lane.webKey);
    const extensionKeys = PRODUCTION_MAP_LANES.map((lane) => lane.extensionKey);

    expect(new Set(webKeys).size).toBe(12);
    expect(new Set(extensionKeys).size).toBe(12);

    for (const lane of PRODUCTION_MAP_LANES) {
      expect(webLaneToExtensionKey(lane.webKey)).toBe(lane.extensionKey);
      expect(extensionKeyToWebLane(lane.extensionKey)).toBe(lane.webKey);
      expect(extensionKeyToWebLane(webLaneToExtensionKey(lane.webKey))).toBe(lane.webKey);
      expect(webLaneToExtensionKey(extensionKeyToWebLane(lane.extensionKey))).toBe(lane.extensionKey);
    }
  });

  it('documents renamed and split lane pairs', () => {
    expect(webLaneToExtensionKey('deploy')).toBe('deployment');
    expect(extensionKeyToWebLane('deployment')).toBe('deploy');

    expect(webLaneToExtensionKey('onboarding')).toBe('landing');
    expect(extensionKeyToWebLane('landing')).toBe('onboarding');

    expect(webLaneToExtensionKey('analytics')).toBe('monitoring');
    expect(webLaneToExtensionKey('monitoring')).toBe('errorHandling');
    expect(extensionKeyToWebLane('monitoring')).toBe('analytics');
    expect(extensionKeyToWebLane('errorHandling')).toBe('monitoring');
  });

  it('keeps planLimits extension keys derived from lanes', () => {
    const fromLanes = PRODUCTION_MAP_LANES.map((lane) => lane.extensionKey);
    expect([...PRODUCTION_MAP_CATEGORY_KEYS_ALL]).toEqual(fromLanes);
  });

  it('keeps free-trial unlocked keys in the extension category set', () => {
    const extensionSet = new Set<ExtensionMapCategoryKey>(
      PRODUCTION_MAP_LANES.map((lane) => lane.extensionKey),
    );

    for (const key of FREE_TRIAL_UNLOCKED_MAP_CATEGORY_KEYS) {
      expect(extensionSet.has(key)).toBe(true);
    }
  });

  it('maps trial unlock keys to valid web lanes', () => {
    for (const extensionKey of FREE_TRIAL_UNLOCKED_MAP_CATEGORY_KEYS) {
      const webKey: WebStackLaneKey = extensionKeyToWebLane(extensionKey);
      expect(webLaneToExtensionKey(webKey)).toBe(extensionKey);
    }
  });
});

describe('station.js PRODUCTION_MAP_CATEGORIES', () => {
  it('declares exactly 12 categories aligned with planLimits', () => {
    const stationSource = readFileSync(join(REPO_ROOT, 'media', 'station.js'), 'utf8');
    const categoryBlock = stationSource.match(
      /const PRODUCTION_MAP_CATEGORIES = \[([\s\S]*?)\];/,
    );
    expect(categoryBlock).not.toBeNull();

    const keys = [...categoryBlock![1].matchAll(/key:\s*'([^']+)'/g)].map((match) => match[1]);
    expect(keys).toHaveLength(12);
    expect(keys).toEqual([...PRODUCTION_MAP_CATEGORY_KEYS_ALL]);
  });
});

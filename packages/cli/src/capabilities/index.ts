import type { Gap } from '../../../../src/station/types';
import type { CapabilityKey } from '../contracts/status';
import { capabilityFromArea, statusForGaps, unique } from './classify';
import { databasePack } from './database';
import { paymentsPack } from './payments';
import { scalingPack } from './scaling';
import { securityPack } from './security';
import { webhooksPack } from './webhooks';
import type { CapabilityPack, CapabilitySummary } from './types';

const PACKS: CapabilityPack[] = [scalingPack, securityPack, webhooksPack, paymentsPack, databasePack];

export function classifyGapCapability(gap: Gap): CapabilityKey {
  const direct = PACKS.find((pack) => pack.classify(gap));
  if (direct) return direct.key;
  return capabilityFromArea(String(gap.primaryMapCategory)) ?? 'security';
}

export function summarizeCapabilities(gaps: Gap[]): CapabilitySummary {
  const result = Object.fromEntries(
    PACKS.map((pack) => [
      pack.key,
      { key: pack.key, status: 'unknown' as const, topGapIds: [], evidenceCount: 0, riskTags: [] },
    ]),
  ) as unknown as CapabilitySummary;

  for (const pack of PACKS) {
    const matching = gaps.filter((gap) => classifyGapCapability(gap) === pack.key);
    result[pack.key] = {
      key: pack.key,
      status: statusForGaps(matching),
      topGapIds: matching.slice(0, 5).map((gap) => gap.id),
      evidenceCount: matching.length,
      riskTags: unique(matching.flatMap((gap) => pack.riskTags(gap))),
    };
  }

  return result;
}

export type { CapabilitySummary };

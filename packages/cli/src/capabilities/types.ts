import type { Gap } from '../../../../src/station/types';
import type { CapabilityKey, CapabilityStatus } from '../contracts/status';

export type CapabilityPackResult = {
  key: CapabilityKey;
  status: CapabilityStatus;
  topGapIds: string[];
  evidenceCount: number;
  riskTags: string[];
};

export type CapabilityPack = {
  key: CapabilityKey;
  classify: (gap: Gap) => boolean;
  riskTags: (gap: Gap) => string[];
};

export type CapabilitySummary = Record<CapabilityKey, CapabilityPackResult>;

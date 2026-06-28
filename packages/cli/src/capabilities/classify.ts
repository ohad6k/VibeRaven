import type { Gap } from '../../../../src/station/types';
import type { CapabilityKey, CapabilityStatus } from '../contracts/status';

export function gapText(gap: Gap): string {
  return `${gap.id} ${gap.title} ${gap.detail} ${gap.primaryMapCategory}`.toLowerCase();
}

export function statusForGaps(gaps: Gap[]): CapabilityStatus {
  if (gaps.some((gap) => gap.severity === 'critical')) return 'critical';
  if (gaps.some((gap) => gap.severity === 'warning')) return 'warning';
  if (gaps.length > 0) return 'warning';
  return 'unknown';
}

export function unique(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

export function capabilityFromArea(area: string): CapabilityKey | undefined {
  const normalized = area.toLowerCase();
  if (normalized.includes('database')) return 'database';
  if (normalized.includes('security') || normalized.includes('auth')) return 'security';
  if (normalized.includes('payment')) return 'payments';
  if (normalized.includes('webhook')) return 'webhooks';
  if (normalized.includes('deploy') || normalized.includes('runtime')) return 'scaling';
  return undefined;
}

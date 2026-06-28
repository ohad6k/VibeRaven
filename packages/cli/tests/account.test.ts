import { describe, expect, it } from 'vitest';
import { formatScanLimitMessage, formatUsageLine } from '../src/account';
import type { ManagedStationUsage } from '../../../shared/station';

describe('formatUsageLine', () => {
  it('formats free lifetime quota', () => {
    const usage: ManagedStationUsage = {
      plan: 'free',
      used: 1,
      limit: 2,
      remainingPrompts: 1,
      period: 'lifetime',
      unlockedMapCategoryKeys: []
    };
    expect(formatUsageLine(usage)).toBe('Scans: 1/2 (lifetime, free) · 1 remaining');
  });
});

describe('formatScanLimitMessage', () => {
  it('includes upgrade URL', () => {
    const msg = formatScanLimitMessage('https://viberaven.dev/account');
    expect(msg).toContain('UPGRADE_REQUIRED');
    expect(msg).toContain('Do not keep retrying this scan until the user upgrades or quota resets.');
    expect(msg).toContain('https://viberaven.dev/account');
  });

  it('normalizes legacy viberice.account URL to viberaven.dev', () => {
    const msg = formatScanLimitMessage('https://viberice.com/account');
    expect(msg).toContain('https://viberaven.dev/account');
    expect(msg).not.toContain('viberice.com/account');
  });
});

import { describe, expect, it } from 'vitest';
import type { Gap } from '../../../src/station/types';
import { classifyGapCapability, summarizeCapabilities } from '../src/capabilities';

function gap(input: Partial<Gap>): Gap {
  return {
    id: input.id ?? 'gap-1',
    title: input.title ?? 'Missing RLS policy',
    detail: input.detail ?? 'Supabase table lacks RLS policy evidence',
    severity: input.severity ?? 'critical',
    primaryMapCategory: input.primaryMapCategory ?? 'database',
    prompt: 'Fix it',
  } as Gap;
}

describe('production capability packs', () => {
  it('classifies database risks from Supabase and RLS language', () => {
    expect(classifyGapCapability(gap({ title: 'Supabase RLS missing' }))).toBe('database');
  });

  it('classifies security risks from secrets and service role language', () => {
    expect(classifyGapCapability(gap({ title: 'Service role key exposed in browser' }))).toBe('security');
  });

  it('classifies webhook risks from webhook/signature/idempotency language', () => {
    expect(classifyGapCapability(gap({ title: 'Webhook missing signature verification' }))).toBe('webhooks');
  });

  it('classifies payment risks from checkout and entitlement language', () => {
    expect(classifyGapCapability(gap({ title: 'Stripe checkout missing entitlement reconciliation' }))).toBe('payments');
  });

  it('classifies scaling risks from serverless pooler and rate limit language', () => {
    expect(classifyGapCapability(gap({ title: 'Vercel serverless route uses direct database connection' }))).toBe('scaling');
  });

  it('summarizes capability status from gap severities', () => {
    const summary = summarizeCapabilities([
      gap({ id: 'DB_RLS_001', title: 'Supabase RLS missing', severity: 'critical' }),
      gap({ id: 'SEC_ENV_001', title: 'Service role key exposed', severity: 'warning' }),
      gap({ id: 'WEBHOOK_001', title: 'Webhook signature missing', severity: 'warning' }),
    ]);

    expect(summary.database.status).toBe('critical');
    expect(summary.database.topGapIds).toEqual(['DB_RLS_001']);
    expect(summary.security.status).toBe('warning');
    expect(summary.webhooks.status).toBe('warning');
    expect(summary.payments.status).toBe('unknown');
    expect(summary.scaling.status).toBe('unknown');
  });
});

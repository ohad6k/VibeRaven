import { describe, expect, it } from 'vitest';
import { loadPlaybookSync, listPlaybookProviders } from '../src/playbooks/loadPlaybook';
import { parsePlaybook } from '../src/playbooks/validate';

describe('playbooks', () => {
  it('lists known providers', () => {
    expect(listPlaybookProviders()).toEqual(['vercel', 'supabase', 'stripe', 'auth-supabase']);
  });

  it('loads and validates vercel playbook', async () => {
    const playbook = loadPlaybookSync('vercel');
    expect(playbook.provider).toBe('vercel');
    expect(playbook.steps.length).toBeGreaterThanOrEqual(5);
    expect(playbook.steps[0]?.openUrl).toMatch(/^https:\/\//);
  });

  it('loads stripe webhook events step', () => {
    const playbook = loadPlaybookSync('stripe');
    const eventsStep = playbook.steps.find((step) => step.id === 'stripe-webhook-events');
    expect(eventsStep?.events).toContain('checkout.session.completed');
  });

  it('rejects invalid playbook shape', () => {
    expect(() => parsePlaybook({ id: 'x' })).toThrow();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('runPreviewCommand', () => {
  it('prints a free local chat-native action surface without generic dashboard spam', async () => {
    const { runPreviewCommand } = await import('../src/commands/preview');
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((message = '') => logs.push(String(message)));

    await expect(runPreviewCommand({ cwd: 'D:\\repo', agentMode: false, json: false })).resolves.toBe(0);

    const output = logs.join('\n');
    expect(output).toContain('local rehearsal, no login or API spend');
    expect(output).toContain('VibeRaven Production Actions');
    expect(output).toContain('[VR-A1] Connect Stripe Webhook');
    expect(output).toContain('Status: waiting-on-provider');
    expect(output).toContain('Provider: Create Stripe webhook endpoint for /api/stripe/webhook.');
    expect(output).toContain('Copy: Required webhook events');
    expect(output).toContain('checkout.session.completed');
    expect(output).toContain('Verify:');
    expect(output).toContain('npx -y viberaven verify --action VR-A1');
    expect(output).toContain('Resume: "Stripe webhook is configured. Continue VibeRaven from VR-A1."');
    expect(output).toContain('[VR-A2] Apply Supabase RLS');
    expect(output).toContain('File: supabase/migrations/20260615_rls.sql');
    expect(output.match(/npx -y viberaven --strict/g)).toHaveLength(1);
    expect(output).not.toContain('dashboard.stripe.com');
    expect(output).not.toContain('supabase.com/dashboard');
    expect(output).not.toContain('D:\\repo');
  });

  it('prints the same preview model as JSON for demos and renderer experiments', async () => {
    const { runPreviewCommand } = await import('../src/commands/preview');
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((message = '') => logs.push(String(message)));

    await expect(runPreviewCommand({ cwd: 'D:\\repo', agentMode: true, json: true })).resolves.toBe(0);

    const parsed = JSON.parse(logs.join('\n'));
    expect(parsed.manifest).toEqual(
      expect.objectContaining({
        version: 1,
        workspaceRoot: '.',
        gateStatus: 'not_clear',
      }),
    );
    expect(parsed.manifest.actions).toHaveLength(3);
    expect(parsed.manifest.actions[0]).toEqual(
      expect.objectContaining({
        id: 'VR-A1',
        actionKey: expect.stringContaining('provider-action'),
        kind: 'provider-action',
        provider: 'stripe',
        verifyCommand: 'npx -y viberaven verify --action VR-A1',
      }),
    );
  });
});

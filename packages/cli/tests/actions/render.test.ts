import { describe, expect, it } from 'vitest';
import { renderActionSurface } from '../../src/actions/render';
import type { VibeRavenAction, VibeRavenActionsManifest } from '../../src/actions/types';

function action(input: Partial<VibeRavenAction> & { id: string; title: string }): VibeRavenAction {
  return {
    id: input.id,
    actionKey: input.actionKey ?? `key:${input.id}`,
    revision: 1,
    kind: input.kind ?? 'provider-action',
    title: input.title,
    status: input.status ?? 'waiting-on-provider',
    readiness: input.readiness ?? ['Endpoint detected', 'Required events prepared'],
    target: input.target ?? { type: 'provider', label: 'Focused provider action', provider: 'stripe' },
    copyPayloads: input.copyPayloads,
    verifyCommand: input.verifyCommand ?? `npx -y viberaven verify --action ${input.id}`,
    resumeInstruction: input.resumeInstruction ?? `${input.title} is complete. Continue VibeRaven from ${input.id}.`,
  };
}

function manifest(actions: VibeRavenAction[]): VibeRavenActionsManifest {
  return {
    version: 1,
    generatedAt: '2026-06-15T16:00:00.000Z',
    workspaceRoot: '.',
    gateStatus: 'not_clear',
    actions,
  };
}

describe('renderActionSurface', () => {
  it('renders max five focused actions with stable IDs and command primitives', () => {
    const output = renderActionSurface(
      manifest([
        action({
          id: 'VR-A1',
          title: 'Connect Stripe Webhook',
          copyPayloads: [
            {
              label: 'Required webhook events',
              format: 'text',
              value: ['checkout.session.completed', 'customer.subscription.updated'],
            },
          ],
        }),
        action({
          id: 'VR-A2',
          title: 'Apply Supabase RLS',
          target: { type: 'file', label: 'Migration', path: 'supabase/migrations/001_rls.sql' },
        }),
        action({ id: 'VR-A3', title: 'Set Vercel Env Vars' }),
        action({ id: 'VR-A4', title: 'Fix Auth Callback' }),
        action({
          id: 'VR-A5',
          title: 'Run Final Verification',
          kind: 'verify',
          target: { type: 'command', label: 'Strict gate', command: 'npx -y viberaven --strict' },
        }),
        action({ id: 'VR-A6', title: 'Should Not Render' }),
      ]),
      { limit: 5 },
    );

    expect(output).toContain('VibeRaven Production Actions');
    expect(output).toContain('Showing: 5 of 6 current actions');
    expect(output).toContain('[VR-A1] Connect Stripe Webhook');
    expect(output).toContain('Provider: Focused provider action');
    expect(output).toContain('Copy: Required webhook events');
    expect(output).toContain('```txt\ncheckout.session.completed\ncustomer.subscription.updated\n```');
    expect(output).toContain('File: supabase/migrations/001_rls.sql');
    expect(output).toContain('```bash\nnpx -y viberaven verify --action VR-A1\n```');
    expect(output).toContain('Run:\n```bash\nnpx -y viberaven --strict\n```');
    expect(output).not.toContain('VR-A6');
  });

  it('redacts secrets and absolute paths from rendered output', () => {
    const output = renderActionSurface(
      manifest([
        action({
          id: 'VR-A1',
          title: 'Set Env Vars',
          readiness: ['DATABASE_URL=postgresql://postgres:secret@example.com/db', 'Use D:\\VibeRice\\.env.local'],
          copyPayloads: [{ label: 'Env keys', format: 'text', value: ['DATABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY=secret'] }],
        }),
      ]),
    );

    expect(output).toContain('DATABASE_URL=<redacted>');
    expect(output).toContain('SUPABASE_SERVICE_ROLE_KEY=<redacted>');
    expect(output).not.toContain('secret@example.com');
    expect(output).not.toContain('D:\\VibeRice');
  });

  it('does not render more than five action blocks', () => {
    const actions = Array.from({ length: 8 }, (_, index) =>
      action({ id: `VR-A${index + 1}`, title: `Action ${index + 1}` }),
    );
    const output = renderActionSurface(manifest(actions), { limit: 5 });

    expect(output).toContain('[VR-A5] Action 5');
    expect(output).not.toContain('[VR-A6] Action 6');
  });
});

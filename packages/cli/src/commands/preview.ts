import pc from 'picocolors';
import { PUBLIC_COMMAND } from '../contracts/commands';
import { renderActionSurface } from '../actions/render';
import type { VibeRavenActionsManifest } from '../actions/types';
import { VERSION } from '../version';

function buildPreviewManifest(): VibeRavenActionsManifest {
  return {
    version: 1,
    generatedAt: '2026-06-16T00:00:00.000Z',
    workspaceRoot: '.',
    gateStatus: 'not_clear',
    actions: [
      {
        id: 'VR-A1',
        actionKey:
          'provider-action:stripe:stripe-webhook:/api/stripe/webhook:checkout.session.completed,customer.subscription.deleted,customer.subscription.updated',
        revision: 1,
        kind: 'provider-action',
        provider: 'stripe',
        title: 'Connect Stripe Webhook',
        status: 'waiting-on-provider',
        severity: 'critical',
        gapId: 'stripe_webhook_secret_missing',
        readiness: ['Webhook endpoint path detected', 'Required events prepared'],
        target: {
          type: 'provider',
          provider: 'stripe',
          label: 'Create Stripe webhook endpoint for /api/stripe/webhook.',
        },
        copyPayloads: [
          {
            label: 'Required webhook events',
            format: 'text',
            value: [
              'checkout.session.completed',
              'customer.subscription.updated',
              'customer.subscription.deleted',
            ],
          },
        ],
        verifyCommand: `${PUBLIC_COMMAND} verify --action VR-A1`,
        resumeInstruction: 'Stripe webhook is configured. Continue VibeRaven from VR-A1.',
      },
      {
        id: 'VR-A2',
        actionKey: 'repo-code:supabase:rls:supabase/migrations/20260615_rls.sql:user-owned-tables',
        revision: 1,
        kind: 'repo-code',
        provider: 'supabase',
        title: 'Apply Supabase RLS',
        status: 'waiting-on-database-proof',
        severity: 'critical',
        gapId: 'supabase_rls_policy_proof',
        readiness: ['Affected tables detected', 'Migration file target prepared'],
        target: {
          type: 'file',
          label: 'RLS migration',
          path: 'supabase/migrations/20260615_rls.sql',
        },
        copyPayloads: [
          {
            label: 'Tiny SQL shape',
            format: 'sql',
            value: 'alter table public.example enable row level security;\ncreate policy "Users manage own rows" on public.example for all using (auth.uid() = user_id);',
          },
        ],
        verifyCommand: `${PUBLIC_COMMAND} verify --action VR-A2`,
        resumeInstruction: 'Supabase RLS is applied. Continue VibeRaven from VR-A2.',
      },
      {
        id: 'VR-A3',
        actionKey: 'verify:gate:final:npx-y-viberaven-strict',
        revision: 1,
        kind: 'verify',
        title: 'Run Final Verification',
        status: 'blocked',
        severity: 'warning',
        readiness: ['Run after repo-code and provider actions are complete'],
        target: {
          type: 'command',
          label: 'Strict gate',
          command: `${PUBLIC_COMMAND} --strict`,
        },
        resumeInstruction: 'Final verification finished. Continue VibeRaven from VR-A3.',
      },
    ],
  };
}

export async function runPreviewCommand(options: {
  cwd: string;
  agentMode: boolean;
  json: boolean;
}): Promise<number> {
  const manifest = buildPreviewManifest();

  if (options.json) {
    console.log(JSON.stringify({ manifest }, null, 2));
    return 0;
  }

  console.log(pc.dim(`VibeRaven ${VERSION} preview - local rehearsal, no login or API spend.`));
  console.log(pc.dim('This is sample renderer data, not a production verdict for this repository.'));
  console.log('');
  console.log(renderActionSurface(manifest, { limit: 3 }).trimEnd());

  if (options.agentMode) {
    console.log('');
    console.log(
      pc.dim(
        'Agent note: treat each visible action as the next production action surface. Do not mark provider actions resolved until provider proof exists.',
      ),
    );
  }

  return 0;
}

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assignActionIds,
  loadActionRegistry,
  resolveActionById,
  saveActionRegistry,
} from '../../src/actions/registry';
import type { VibeRavenAction } from '../../src/actions/types';

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

function action(input: Partial<VibeRavenAction> & { actionKey: string; title: string }): VibeRavenAction {
  return {
    id: '',
    actionKey: input.actionKey,
    revision: 1,
    kind: input.kind ?? 'provider-action',
    title: input.title,
    status: input.status ?? 'waiting-on-provider',
    gapId: input.gapId,
    readiness: input.readiness ?? ['Evidence detected'],
    target: input.target ?? { type: 'provider', label: 'Focused provider action', provider: 'stripe' },
    verifyCommand: input.verifyCommand ?? 'npx -y viberaven verify --action pending',
    resumeInstruction: input.resumeInstruction ?? 'Continue VibeRaven from pending.',
  };
}

describe('action registry', () => {
  it('assigns stable IDs across rescans and marks absent full-surface actions stale', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-actions-'));
    const now = '2026-06-15T16:00:00.000Z';

    const first = await assignActionIds({
      cwd: tempDir,
      actions: [
        action({ actionKey: 'provider-action:stripe:webhook:a', title: 'Connect Stripe Webhook' }),
        action({ actionKey: 'provider-action:supabase:rls:b', title: 'Apply Supabase RLS' }),
      ],
      now,
    });

    expect(first.actions.map((entry) => entry.id)).toEqual(['VR-A1', 'VR-A2']);

    const second = await assignActionIds({
      cwd: tempDir,
      actions: [
        action({ actionKey: 'provider-action:supabase:rls:b', title: 'Apply Supabase RLS' }),
        action({ actionKey: 'provider-action:vercel:env:c', title: 'Set Vercel Env Vars' }),
      ],
      now: '2026-06-15T16:05:00.000Z',
    });

    expect(second.actions.map((entry) => entry.id)).toEqual(['VR-A2', 'VR-A3']);
    const registry = await loadActionRegistry(tempDir);
    expect(registry.actions['provider-action:stripe:webhook:a'].status).toBe('stale');
    expect(registry.nextId).toBe(4);
  });

  it('marks previous actions resolved when their semantic gap is verified fixed', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-actions-'));
    await assignActionIds({
      cwd: tempDir,
      actions: [
        action({
          actionKey: 'provider-action:stripe:webhook:a',
          title: 'Connect Stripe Webhook',
          gapId: 'stripe_webhook_missing',
        }),
      ],
      now: '2026-06-15T16:00:00.000Z',
    });

    const second = await assignActionIds({
      cwd: tempDir,
      actions: [],
      currentGapIds: new Set(),
      now: '2026-06-15T16:20:00.000Z',
    });

    expect(second.registry.actions['provider-action:stripe:webhook:a'].status).toBe('resolved');
  });

  it('increments revision when fingerprint changes for the same action key', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-actions-'));

    await assignActionIds({
      cwd: tempDir,
      actions: [action({ actionKey: 'provider-action:stripe:webhook:a', title: 'Connect Stripe Webhook' })],
      now: '2026-06-15T16:00:00.000Z',
    });

    const second = await assignActionIds({
      cwd: tempDir,
      actions: [
        action({
          actionKey: 'provider-action:stripe:webhook:a',
          title: 'Connect Stripe Webhook',
          readiness: ['Endpoint detected', 'Required events prepared'],
        }),
      ],
      now: '2026-06-15T16:10:00.000Z',
    });

    expect(second.actions[0].id).toBe('VR-A1');
    expect(second.actions[0].revision).toBe(2);
  });

  it('resolves action IDs from registry entries', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-actions-'));
    const registry = await loadActionRegistry(tempDir);
    registry.actions['provider-action:stripe:webhook:a'] = {
      id: 'VR-A1',
      actionKey: 'provider-action:stripe:webhook:a',
      status: 'resolved',
      createdAt: '2026-06-15T16:00:00.000Z',
      lastSeenAt: '2026-06-15T16:05:00.000Z',
      revision: 1,
      fingerprint: '{}',
      title: 'Connect Stripe Webhook',
    };
    await saveActionRegistry(tempDir, registry);

    expect(await resolveActionById(tempDir, 'VR-A1')).toEqual(registry.actions['provider-action:stripe:webhook:a']);
    expect(await readFile(join(tempDir, '.viberaven', 'action-registry.json'), 'utf8')).toContain('VR-A1');
  });
});

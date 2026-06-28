import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadConsoleActionState, toConsoleActionViewModel } from '../../src/console/manifest';
import type { VibeRavenAction } from '../../src/actions/types';

let tempDir: string | undefined;
const stripeSecret = `${'sk_' + 'live'}_${'bad'}`;
const stripeNumberedSecret = `${'sk_' + 'live'}_${'123456789012'}`;

afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
  tempDir = undefined;
});

function action(input: Partial<VibeRavenAction> = {}): VibeRavenAction {
  return {
    id: input.id ?? 'VR-A1',
    actionKey: input.actionKey ?? 'provider-action:stripe:webhook',
    revision: input.revision ?? 1,
    kind: input.kind ?? 'provider-action',
    title: input.title ?? 'Connect Stripe Webhook',
    status: input.status ?? 'waiting-on-provider',
    provider: input.provider ?? 'stripe',
    readiness: input.readiness ?? ['Endpoint detected', `STRIPE_SECRET_KEY=${stripeSecret}`],
    target: input.target ?? { type: 'provider', label: 'Stripe webhook setup', provider: 'stripe' },
    copyPayloads: input.copyPayloads ?? [
      { label: 'Required webhook events', format: 'text', value: ['checkout.session.completed'] },
    ],
    verifyCommand: input.verifyCommand ?? 'npx -y viberaven verify --action VR-A1',
    fallbackCommand: input.fallbackCommand,
    resumeInstruction:
      input.resumeInstruction ?? 'Stripe webhook is configured. Continue VibeRaven from VR-A1.',
  };
}

describe('console manifest view model', () => {
  it('maps V1 actions into safe UI view models', () => {
    const view = toConsoleActionViewModel(action());
    expect(view.id).toBe('VR-A1');
    expect(view.primaryControl).toBe('provider');
    expect(JSON.stringify(view)).not.toContain(stripeSecret);
    expect(view.copyPayloads[0].value).toEqual(['checkout.session.completed']);
    expect(view.verify.actionId).toBe('VR-A1');
  });

  it('preserves a redacted fallback command for verification controls', () => {
    const view = toConsoleActionViewModel(
      action({ fallbackCommand: `STRIPE_SECRET_KEY=${stripeSecret} npx -y viberaven --verify` }),
    );
    expect(view.verify.fallbackCommand).toContain('<redacted>');
    expect(view.verify.fallbackCommand).not.toContain(stripeSecret);
  });

  it('redacts raw provider tokens from console action state', () => {
    const secrets = [
      stripeNumberedSecret,
      'sk-proj-abcdefghijklmnop',
      `ghp_${'a'.repeat(36)}`,
      `github_pat_${'b'.repeat(50)}`,
      'whsec_123456789012',
      'eyJaaaaaaaaaa.bbbbbbbbbb.cccccccccc',
      '-----BEGIN PRIVATE KEY-----\nsecret-key-body\n-----END PRIVATE KEY-----',
      'Authorization: Bearer raw-provider-token',
    ];

    const view = toConsoleActionViewModel(
      action({
        title: `Connect ${secrets[0]}`,
        readiness: secrets,
        target: { type: 'command', label: `Run ${secrets[1]}`, command: `echo ${secrets[2]}` },
        copyPayloads: [{ label: 'Secret payload', format: 'text', value: secrets.join('\n') }],
        fallbackCommand: `curl -H "${secrets[7]}" https://example.test`,
        resumeInstruction: secrets[6],
      }),
    );

    const serialized = JSON.stringify(view);
    for (const secret of secrets) {
      expect(serialized).not.toContain(secret);
    }
    expect(serialized).toContain('<redacted>');
  });

  it('loads state from .viberaven/actions.json without leaking absolute paths', async () => {
    tempDir = join(tmpdir(), `vr-console-manifest-${Date.now()}`);
    await mkdir(join(tempDir, '.viberaven'), { recursive: true });
    await writeFile(
      join(tempDir, '.viberaven', 'actions.json'),
      JSON.stringify({
        version: 1,
        generatedAt: '2026-06-16T10:00:00.000Z',
        workspaceRoot: '.',
        gateStatus: 'not_clear',
        actions: [
          action({
            target: { type: 'file', label: 'Route file', path: 'D:\\VibeRice\\app\\api\\route.ts' },
          }),
        ],
      }),
    );

    const state = await loadConsoleActionState(tempDir);
    expect(state.ok).toBe(true);
    if (!state.ok) throw new Error('expected state');
    expect(state.artifactPath).toBe('.viberaven/actions.json');
    expect(JSON.stringify(state)).not.toContain(tempDir);
    expect(JSON.stringify(state)).not.toContain('D:\\VibeRice');
    expect(state.actions[0].target.label).toBe('Route file');
  });

  it('redacts forward-slash Windows and POSIX local target paths', async () => {
    tempDir = join(tmpdir(), `vr-console-manifest-paths-${Date.now()}`);
    await mkdir(join(tempDir, '.viberaven'), { recursive: true });
    await writeFile(
      join(tempDir, '.viberaven', 'actions.json'),
      JSON.stringify({
        version: 1,
        generatedAt: '2026-06-16T10:00:00.000Z',
        workspaceRoot: '.',
        gateStatus: 'not_clear',
        actions: [
          action({
            id: 'VR-A1',
            target: { type: 'file', label: 'Route file', path: '/tmp/app/api/route.ts' },
          }),
          action({
            id: 'VR-A2',
            target: { type: 'file', label: 'Route file', path: 'D:/VibeRice/app/api/route.ts' },
          }),
        ],
      }),
    );

    const state = await loadConsoleActionState(tempDir);
    expect(state.ok).toBe(true);
    expect(JSON.stringify(state)).not.toContain('/tmp/app/api/route.ts');
    expect(JSON.stringify(state)).not.toContain('D:/VibeRice/app/api/route.ts');
  });

  it('redacts absolute file target paths that contain spaces', async () => {
    const spacedPath = 'C:\\Users\\Jane Doe\\repo\\app\\route.ts';
    tempDir = join(tmpdir(), `vr-console-manifest-spaced-path-${Date.now()}`);
    await mkdir(join(tempDir, '.viberaven'), { recursive: true });
    await writeFile(
      join(tempDir, '.viberaven', 'actions.json'),
      JSON.stringify({
        version: 1,
        generatedAt: '2026-06-16T10:00:00.000Z',
        workspaceRoot: '.',
        gateStatus: 'not_clear',
        actions: [
          action({
            target: { type: 'file', label: 'Route file', path: spacedPath },
          }),
        ],
      }),
    );

    const state = await loadConsoleActionState(tempDir);
    const serialized = JSON.stringify(state);
    expect(state.ok).toBe(true);
    expect(serialized).toContain('<repo-relative-path>');
    expect(serialized).not.toContain(spacedPath);
    expect(serialized).not.toContain('Jane');
    expect(serialized).not.toContain('Doe');
    expect(serialized).not.toContain('\\repo\\');
  });

  it('redacts quoted absolute paths in commands while preserving command shape', () => {
    const view = toConsoleActionViewModel(
      action({
        target: { type: 'command', label: 'Run script', command: 'node "C:\\Users\\Jane Doe\\repo\\script.js"' },
        fallbackCommand: 'cat "/tmp/my app/route.ts"',
      }),
    );
    const serialized = JSON.stringify(view);
    expect(view.target.value).toBe('node "<repo-relative-path>"');
    expect(view.verify.fallbackCommand).toBe('cat "<repo-relative-path>"');
    expect(serialized).not.toContain('Jane');
    expect(serialized).not.toContain('Doe');
    expect(serialized).not.toContain('\\repo\\');
    expect(serialized).not.toContain('/tmp/my app/route.ts');
  });

  it('redacts unquoted spaced absolute paths in free-form action text', () => {
    const unquotedPath = 'C:\\Users\\Jane Doe\\repo\\app\\route.ts';
    const view = toConsoleActionViewModel(
      action({
        readiness: [`Fix ${unquotedPath} before launch`],
        resumeInstruction: `Continue after checking ${unquotedPath}`,
        copyPayloads: [{ label: 'Path note', format: 'text', value: `Open ${unquotedPath} and verify` }],
      }),
    );
    const serialized = JSON.stringify(view);
    expect(serialized).toContain('<repo-relative-path>');
    expect(serialized).not.toContain('Jane');
    expect(serialized).not.toContain('Doe');
    expect(serialized).not.toContain('\\repo\\');
    expect(serialized).not.toContain('route.ts');
  });

  it('redacts object payload values when the payload key is sensitive', () => {
    const view = toConsoleActionViewModel(
      action({
        copyPayloads: [
          {
            label: 'Supabase env',
            format: 'json',
            value: { SUPABASE_SERVICE_ROLE_KEY: 'real-secret', NEXT_PUBLIC_SUPABASE_URL: 'https://example.test' },
          },
        ],
      }),
    );
    const serialized = JSON.stringify(view);
    expect(serialized).toContain('<redacted>');
    expect(serialized).not.toContain('real-secret');
  });

  it('reports missing action manifests without inventing actions', async () => {
    tempDir = join(tmpdir(), `vr-console-manifest-missing-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    const state = await loadConsoleActionState(tempDir);
    expect(state.ok).toBe(false);
    if (state.ok) throw new Error('expected missing state');
    expect(state.reason).toBe('missing');
    expect(state.artifactPath).toBe('.viberaven/actions.json');
    expect(JSON.stringify(state)).not.toContain(tempDir);
    expect(state.message).toContain('viberaven --agent-mode');
  });
});

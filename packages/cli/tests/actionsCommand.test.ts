import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runActionsCommand } from '../src/commands/actions';

let tempDir: string | undefined;

afterEach(async () => {
  vi.restoreAllMocks();
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe('runActionsCommand', () => {
  it('prints the full current action surface', async () => {
    tempDir = join(tmpdir(), `vr-actions-command-${Date.now()}`);
    await mkdir(join(tempDir, '.viberaven'), { recursive: true });
    await writeFile(
      join(tempDir, '.viberaven', 'actions.json'),
      JSON.stringify(
        {
          version: 1,
          generatedAt: '2026-06-15T16:00:00.000Z',
          workspaceRoot: '.',
          gateStatus: 'not_clear',
          actions: [
            {
              id: 'VR-A1',
              actionKey: 'provider-action:stripe:webhook',
              revision: 1,
              kind: 'provider-action',
              provider: 'stripe',
              title: 'Connect Stripe Webhook',
              status: 'waiting-on-provider',
              readiness: ['Endpoint detected'],
              target: { type: 'provider', label: 'Focused provider action', provider: 'stripe' },
              verifyCommand: 'npx -y viberaven verify --action VR-A1',
              resumeInstruction: 'Stripe webhook is configured. Continue VibeRaven from VR-A1.',
            },
          ],
        },
        null,
        2,
      ),
    );

    const output: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      output.push(String(chunk));
      return true;
    });

    const code = await runActionsCommand({ cwd: tempDir });

    expect(code).toBe(0);
    expect(output.join('')).toContain('[VR-A1] Connect Stripe Webhook');
    expect(output.join('')).toContain('Showing: 1 of 1 current actions');
  });

  it('prints json when requested', async () => {
    tempDir = join(tmpdir(), `vr-actions-command-${Date.now()}`);
    await mkdir(join(tempDir, '.viberaven'), { recursive: true });
    await writeFile(
      join(tempDir, '.viberaven', 'actions.json'),
      '{"version":1,"generatedAt":"x","workspaceRoot":".","gateStatus":"clear","actions":[]}',
    );
    const output: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      output.push(String(chunk));
      return true;
    });

    expect(await runActionsCommand({ cwd: tempDir, json: true })).toBe(0);
    expect(JSON.parse(output.join('')).version).toBe(1);
  });
});

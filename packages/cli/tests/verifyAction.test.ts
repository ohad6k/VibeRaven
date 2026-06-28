import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runVerifyActionCommand } from '../src/commands/verifyAction';

let tempDir: string | undefined;

afterEach(async () => {
  vi.restoreAllMocks();
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
  tempDir = undefined;
});

async function writeRegistry(entry: Record<string, unknown>): Promise<void> {
  tempDir = join(tmpdir(), `vr-verify-action-${Date.now()}`);
  await mkdir(join(tempDir, '.viberaven'), { recursive: true });
  await writeFile(
    join(tempDir, '.viberaven', 'action-registry.json'),
    JSON.stringify(
      {
        version: 1,
        nextId: 2,
        actions: {
          [String(entry.actionKey)]: entry,
        },
      },
      null,
      2,
    ),
  );
}

describe('runVerifyActionCommand', () => {
  it('handles resolved action without failing blindly', async () => {
    await writeRegistry({
      id: 'VR-A1',
      actionKey: 'provider-action:stripe:webhook',
      status: 'resolved',
      createdAt: '2026-06-15T16:00:00.000Z',
      lastSeenAt: '2026-06-15T16:10:00.000Z',
      revision: 1,
      fingerprint: '{}',
      title: 'Connect Stripe Webhook',
    });
    const output: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      output.push(String(chunk));
      return true;
    });

    expect(await runVerifyActionCommand({ cwd: tempDir!, actionId: 'VR-A1' })).toBe(0);
    expect(output.join('')).toContain('already resolved');
  });

  it('points replaced action to replacement ID', async () => {
    await writeRegistry({
      id: 'VR-A1',
      actionKey: 'provider-action:stripe:webhook',
      status: 'replaced',
      replacedBy: 'VR-A4',
      createdAt: '2026-06-15T16:00:00.000Z',
      lastSeenAt: '2026-06-15T16:10:00.000Z',
      revision: 1,
      fingerprint: '{}',
      title: 'Connect Stripe Webhook',
    });
    const output: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      output.push(String(chunk));
      return true;
    });

    expect(await runVerifyActionCommand({ cwd: tempDir!, actionId: 'VR-A1' })).toBe(1);
    expect(output.join('')).toContain('replaced by VR-A4');
  });
});

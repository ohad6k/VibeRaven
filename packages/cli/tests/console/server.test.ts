import { mkdir, rm, writeFile } from 'node:fs/promises';
import { EventEmitter } from 'node:events';
import type { ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createConsoleServer } from '../../src/console/server';

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
  tempDir = undefined;
});

async function writeActions(cwd: string): Promise<void> {
  await mkdir(join(cwd, '.viberaven'), { recursive: true });
  await writeFile(
    join(cwd, '.viberaven', 'actions.json'),
    JSON.stringify({
      version: 1,
      generatedAt: '2026-06-16T10:00:00.000Z',
      workspaceRoot: '.',
      gateStatus: 'not_clear',
      actions: [
        {
          id: 'VR-A1',
          actionKey: 'provider-action:stripe:webhook',
          revision: 1,
          kind: 'provider-action',
          title: 'Connect Stripe Webhook',
          status: 'waiting-on-provider',
          readiness: ['Endpoint detected'],
          target: { type: 'provider', label: 'Stripe webhook setup', provider: 'stripe' },
          verifyCommand: 'npx -y viberaven verify --action VR-A1',
          resumeInstruction: 'Continue VibeRaven from VR-A1.',
        },
      ],
    }),
  );
}

describe('console server', () => {
  it('serves static browser console assets', async () => {
    tempDir = join(tmpdir(), `vr-console-server-${Date.now()}`);
    await writeActions(tempDir);
    const server = await createConsoleServer({ cwd: tempDir, port: 0, open: false });
    try {
      const htmlResponse = await fetch(`${server.url}/`);
      expect(htmlResponse.status).toBe(200);
      expect(htmlResponse.headers.get('content-type')).toContain('text/html');
      expect(await htmlResponse.text()).toContain('VibeRaven Console');

      const jsResponse = await fetch(`${server.url}/app.js`);
      expect(jsResponse.status).toBe(200);
      expect(jsResponse.headers.get('content-type')).toContain('application/javascript');
      expect(await jsResponse.text()).toContain('copyPayload');
    } finally {
      await server.close();
    }
  });

  it('injects the console session token into served HTML only', async () => {
    tempDir = join(tmpdir(), `vr-console-server-${Date.now()}`);
    await writeActions(tempDir);
    const server = await createConsoleServer({ cwd: tempDir, port: 0, open: false });
    try {
      const htmlResponse = await fetch(`${server.url}/`);
      expect(htmlResponse.status).toBe(200);
      const html = await htmlResponse.text();
      expect(html).toContain(`window.__VIBERAVEN_TOKEN__ = ${JSON.stringify(server.token)};`);

      const jsResponse = await fetch(`${server.url}/app.js`);
      expect(jsResponse.status).toBe(200);
      expect(await jsResponse.text()).not.toContain(server.token);
    } finally {
      await server.close();
    }
  });

  it('does not serve static browser console assets from the project cwd', async () => {
    tempDir = join(tmpdir(), `vr-console-server-${Date.now()}`);
    await writeActions(tempDir);
    await mkdir(join(tempDir, 'assets', 'console'), { recursive: true });
    await writeFile(join(tempDir, 'assets', 'console', 'app.js'), 'PROJECT_CWD_SENTINEL');

    const server = await createConsoleServer({ cwd: tempDir, port: 0, open: false });
    try {
      const jsResponse = await fetch(`${server.url}/app.js`);
      expect(jsResponse.status).toBe(200);
      expect(await jsResponse.text()).not.toContain('PROJECT_CWD_SENTINEL');
    } finally {
      await server.close();
    }
  });

  it('serves action state from local API', async () => {
    tempDir = join(tmpdir(), `vr-console-server-${Date.now()}`);
    await writeActions(tempDir);
    const server = await createConsoleServer({ cwd: tempDir, port: 0, open: false });
    try {
      const response = await fetch(`${server.url}/api/actions`, {
        headers: { Authorization: `Bearer ${server.token}` },
      });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.actions[0].id).toBe('VR-A1');
      expect(JSON.stringify(body)).not.toContain(tempDir);
    } finally {
      await server.close();
    }
  });

  it('serves action state with a valid token from a disallowed origin', async () => {
    tempDir = join(tmpdir(), `vr-console-server-${Date.now()}`);
    await writeActions(tempDir);
    const server = await createConsoleServer({ cwd: tempDir, port: 0, open: false });
    try {
      const response = await fetch(`${server.url}/api/actions`, {
        headers: {
          Authorization: `Bearer ${server.token}`,
          Origin: 'https://example.com',
        },
      });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.actions[0].id).toBe('VR-A1');
    } finally {
      await server.close();
    }
  });

  it('serves an events endpoint for action refresh notifications', async () => {
    tempDir = join(tmpdir(), `vr-console-server-${Date.now()}`);
    await writeActions(tempDir);
    const server = await createConsoleServer({ cwd: tempDir, port: 0, open: false });
    try {
      const response = await fetch(`${server.url}/api/events`, {
        headers: { Authorization: `Bearer ${server.token}` },
      });
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/event-stream');
      await response.body?.cancel();
    } finally {
      await server.close();
    }
  });

  it('rejects event streams from a disallowed origin without token', async () => {
    tempDir = join(tmpdir(), `vr-console-server-${Date.now()}`);
    await writeActions(tempDir);
    const server = await createConsoleServer({ cwd: tempDir, port: 0, open: false });
    try {
      const response = await fetch(`${server.url}/api/events`, {
        headers: { Origin: 'https://example.com' },
      });
      expect(response.status).toBe(403);
    } finally {
      await server.close();
    }
  });

  it('streams action refresh notifications when action artifacts change', async () => {
    tempDir = join(tmpdir(), `vr-console-server-${Date.now()}`);
    await writeActions(tempDir);
    const server = await createConsoleServer({ cwd: tempDir, port: 0, open: false });
    try {
      const response = await fetch(`${server.url}/api/events`, {
        headers: { Authorization: `Bearer ${server.token}` },
      });
      expect(response.status).toBe(200);
      const reader = response.body?.getReader();
      expect(reader).toBeDefined();

      const firstChunk = await reader!.read();
      expect(new TextDecoder().decode(firstChunk.value)).toContain(': connected');

      await writeFile(join(tempDir, '.viberaven', 'gate-result.json'), JSON.stringify({ gate: { status: 'clear' } }));

      let eventText = '';
      const startedAt = Date.now();
      while (!eventText.includes('event: actions') && Date.now() - startedAt < 2000) {
        const chunk = await reader!.read();
        eventText += new TextDecoder().decode(chunk.value);
      }

      expect(eventText).toContain('event: actions');
      expect(eventText).toContain('data: {"type":"actions-changed"}');
      await reader!.cancel();
    } finally {
      await server.close();
    }
  });

  it('keeps serving the console when action file watching cannot be established', async () => {
    tempDir = join(tmpdir(), `vr-console-server-${Date.now()}`);
    await writeActions(tempDir);
    const watchAttempts: string[] = [];
    const input = {
      cwd: tempDir,
      port: 0,
      open: false,
      watchDirectory: (path: string) => {
        watchAttempts.push(path);
        throw new Error('watch unavailable');
      },
    } as Parameters<typeof createConsoleServer>[0] & {
      watchDirectory: (path: string) => never;
    };

    const server = await createConsoleServer(input);
    try {
      expect(watchAttempts).toEqual([join(tempDir, '.viberaven')]);
      const response = await fetch(`${server.url}/api/events`, {
        headers: { Authorization: `Bearer ${server.token}` },
      });
      expect(response.status).toBe(200);
      await response.body?.cancel();
    } finally {
      await server.close();
    }
  });

  it('closes backpressured event clients so shutdown can complete', async () => {
    tempDir = join(tmpdir(), `vr-console-server-${Date.now()}`);
    await writeActions(tempDir);
    let watchCallback: ((eventType: string, filename: string) => void) | undefined;
    let eventResponse: ServerResponse | undefined;
    const input = {
      cwd: tempDir,
      port: 0,
      open: false,
      watchDirectory: (_path: string, listener: (eventType: string, filename: string) => void) => {
        watchCallback = listener;
        const watcher = new EventEmitter() as EventEmitter & { close: () => void };
        watcher.close = () => {};
        return watcher;
      },
      onEventResponse: (response: ServerResponse) => {
        eventResponse = response;
      },
    } as Parameters<typeof createConsoleServer>[0] & {
      watchDirectory: (
        path: string,
        listener: (eventType: string, filename: string) => void,
      ) => EventEmitter & { close: () => void };
      onEventResponse: (response: ServerResponse) => void;
    };

    const server = await createConsoleServer(input);
    try {
      const response = await fetch(`${server.url}/api/events`, {
        headers: { Authorization: `Bearer ${server.token}` },
      });
      expect(response.status).toBe(200);
      const reader = response.body?.getReader();
      expect(reader).toBeDefined();
      await reader!.read();

      expect(eventResponse).toBeDefined();
      let destroyed = false;
      eventResponse!.write = (() => false) as ServerResponse['write'];
      const destroyResponse = eventResponse!.destroy.bind(eventResponse);
      eventResponse!.destroy = ((...args: Parameters<ServerResponse['destroy']>) => {
        destroyed = true;
        return destroyResponse(...args);
      }) as ServerResponse['destroy'];
      watchCallback?.('change', 'actions.json');

      expect(destroyed).toBe(true);
      await expect(server.close()).resolves.toBeUndefined();
      await reader!.cancel().catch(() => undefined);
    } finally {
      await server.close().catch(() => undefined);
    }
  });

  it('rejects action state requests from a disallowed origin without token', async () => {
    tempDir = join(tmpdir(), `vr-console-server-${Date.now()}`);
    await writeActions(tempDir);
    const server = await createConsoleServer({ cwd: tempDir, port: 0, open: false });
    try {
      const response = await fetch(`${server.url}/api/actions`, {
        headers: { Origin: 'https://example.com' },
      });
      expect(response.status).toBe(403);
    } finally {
      await server.close();
    }
  });

  it('rejects command endpoints without token', async () => {
    tempDir = join(tmpdir(), `vr-console-server-${Date.now()}`);
    await writeActions(tempDir);
    const server = await createConsoleServer({ cwd: tempDir, port: 0, open: false });
    try {
      const response = await fetch(`${server.url}/api/command`, {
        method: 'POST',
        body: JSON.stringify({ type: 'actions-json' }),
      });
      expect(response.status).toBe(401);
    } finally {
      await server.close();
    }
  });

  it('runs allowed commands through the injected command runner', async () => {
    tempDir = join(tmpdir(), `vr-console-server-${Date.now()}`);
    await writeActions(tempDir);
    const calls: unknown[] = [];
    const server = await createConsoleServer({
      cwd: tempDir,
      port: 0,
      open: false,
      runCommand: async (input) => {
        calls.push(input.request);
        return { exitCode: 0, stdout: 'ok', stderr: '' };
      },
    });
    try {
      const response = await fetch(`${server.url}/api/command`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${server.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'verify-action', actionId: 'VR-A1' }),
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        ok: true,
        result: { exitCode: 0, stdout: 'ok', stderr: '' },
      });
      expect(calls).toEqual([{ type: 'verify-action', actionId: 'VR-A1' }]);
    } finally {
      await server.close();
    }
  });

  it('sanitizes unexpected command runner errors', async () => {
    tempDir = join(tmpdir(), `vr-console-server-${Date.now()}`);
    await writeActions(tempDir);
    const server = await createConsoleServer({
      cwd: tempDir,
      port: 0,
      open: false,
      runCommand: async () => {
        throw new Error(`boom ${tempDir}\nstack...`);
      },
    });
    try {
      const response = await fetch(`${server.url}/api/command`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${server.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'verify-action', actionId: 'VR-A1' }),
      });
      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toContain('Console command failed.');
      expect(text).not.toContain(tempDir);
      expect(text).not.toContain('stack');
    } finally {
      await server.close();
    }
  });

  it('sanitizes command result output before responding', async () => {
    tempDir = join(tmpdir(), `vr-console-server-${Date.now()}`);
    await writeActions(tempDir);
    const server = await createConsoleServer({
      cwd: tempDir,
      port: 0,
      open: false,
      runCommand: async () => ({
        exitCode: 1,
        stdout: 'see C:\\repo\\out.txt',
        stderr: 'Error at D:\\repo\\file.ts\nstack...',
      }),
    });
    try {
      const response = await fetch(`${server.url}/api/command`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${server.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'verify-action', actionId: 'VR-A1' }),
      });
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).not.toContain('C:\\repo');
      expect(text).not.toContain('D:\\repo');
      expect(text).not.toContain('file.ts');
      expect(text).not.toContain('stack');
      expect(text).toContain('<repo-relative-path>');
    } finally {
      await server.close();
    }
  });

  it('redacts provider tokens from command result output before responding', async () => {
    tempDir = join(tmpdir(), `vr-console-server-${Date.now()}`);
    await writeActions(tempDir);
    const stripeSecret = `${'sk_' + 'live'}_${'123456789012'}`;
    const secrets = [
      stripeSecret,
      'sk-proj-abcdefghijklmnop',
      `ghp_${'a'.repeat(36)}`,
      `github_pat_${'b'.repeat(50)}`,
      'whsec_123456789012',
      'eyJaaaaaaaaaa.bbbbbbbbbb.cccccccccc',
      '-----BEGIN PRIVATE KEY-----\nsecret-key-body\n-----END PRIVATE KEY-----',
      'Authorization: Bearer raw-provider-token',
    ];
    const server = await createConsoleServer({
      cwd: tempDir,
      port: 0,
      open: false,
      runCommand: async () => ({
        exitCode: 1,
        stdout: secrets.slice(0, 4).join('\n'),
        stderr: secrets.slice(4).join('\n'),
      }),
    });
    try {
      const response = await fetch(`${server.url}/api/command`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${server.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'verify-action', actionId: 'VR-A1' }),
      });
      expect(response.status).toBe(200);
      const text = await response.text();
      for (const secret of secrets) {
        expect(text).not.toContain(secret);
      }
      expect(text).toContain('<redacted>');
    } finally {
      await server.close();
    }
  });

  it('rejects invalid JSON command requests', async () => {
    tempDir = join(tmpdir(), `vr-console-server-${Date.now()}`);
    await writeActions(tempDir);
    const server = await createConsoleServer({ cwd: tempDir, port: 0, open: false });
    try {
      const response = await fetch(`${server.url}/api/command`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${server.token}`,
          'Content-Type': 'application/json',
        },
        body: '{not json',
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ ok: false, error: 'Invalid JSON body.' });
    } finally {
      await server.close();
    }
  });
});

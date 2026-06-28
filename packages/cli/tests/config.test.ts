import { access, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_API_BASE_URL,
  getCredentialsPath,
  loadCredentials,
  loadRunnerSessionCredentials,
  saveRunnerSessionCredentials
} from '../src/config';

async function makeConfigDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'vr-config-'));
  vi.stubEnv('VIBERAVEN_CONFIG_DIR', dir);
  return dir;
}

describe('loadCredentials', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses VIBERAVEN_ACCESS_TOKEN when no disk credentials exist', async () => {
    await makeConfigDir();
    vi.stubEnv('VIBERAVEN_ACCESS_TOKEN', ' env-token ');

    await expect(loadCredentials()).resolves.toEqual({
      accessToken: 'env-token',
      apiBaseUrl: DEFAULT_API_BASE_URL
    });
  });

  it('uses VIBERAVEN_API_URL with env token credentials', async () => {
    await makeConfigDir();
    vi.stubEnv('VIBERAVEN_ACCESS_TOKEN', 'env-token');
    vi.stubEnv('VIBERAVEN_API_URL', 'https://api.example.test///');

    await expect(loadCredentials()).resolves.toEqual({
      accessToken: 'env-token',
      apiBaseUrl: 'https://api.example.test'
    });
  });

  it('does not write env token credentials to disk', async () => {
    await makeConfigDir();
    vi.stubEnv('VIBERAVEN_ACCESS_TOKEN', 'env-token');

    await loadCredentials();

    await expect(access(getCredentialsPath())).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('loads saved runner session credentials from disk', async () => {
    const dir = await makeConfigDir();
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, 'credentials.json'),
      JSON.stringify({
        accessToken: 'disk-token',
        apiBaseUrl: 'https://disk.example.test/',
        runnerSessionId: 'runner-1',
        runnerAccessToken: 'runner-secret'
      }),
      'utf-8'
    );

    await expect(loadRunnerSessionCredentials()).resolves.toEqual({
      runnerSessionId: 'runner-1',
      runnerAccessToken: 'runner-secret',
      apiBaseUrl: 'https://disk.example.test'
    });
  });

  it('merges runner session credentials without removing user login credentials', async () => {
    const dir = await makeConfigDir();
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, 'credentials.json'),
      JSON.stringify({
        accessToken: 'disk-token',
        apiBaseUrl: 'https://disk.example.test/',
        email: 'user@example.test'
      }),
      'utf-8'
    );

    await saveRunnerSessionCredentials({
      runnerSessionId: 'runner-2',
      runnerAccessToken: 'runner-token-2',
      apiBaseUrl: 'https://api.example.test///'
    });

    await expect(loadCredentials()).resolves.toEqual({
      accessToken: 'disk-token',
      apiBaseUrl: 'https://api.example.test',
      email: 'user@example.test',
      runnerSessionId: 'runner-2',
      runnerAccessToken: 'runner-token-2'
    });
  });

  it('keeps existing disk credentials ahead of env token', async () => {
    const dir = await makeConfigDir();
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, 'credentials.json'),
      JSON.stringify({ accessToken: 'disk-token', apiBaseUrl: 'https://disk.example.test/' }),
      'utf-8'
    );
    vi.stubEnv('VIBERAVEN_ACCESS_TOKEN', 'env-token');
    vi.stubEnv('VIBERAVEN_API_URL', 'https://env.example.test');

    await expect(loadCredentials()).resolves.toEqual({
      accessToken: 'disk-token',
      apiBaseUrl: 'https://disk.example.test'
    });
  });
});

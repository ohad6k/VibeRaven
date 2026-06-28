import { afterEach, describe, expect, it, vi } from 'vitest';

const startedSignIn = {
  verificationUrl: 'https://viberaven.dev/connect?code=device-code-123',
  deviceCode: 'device-code-123',
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  pollIntervalSeconds: 2
};

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.unmock('../../../src/station/backendClient');
  vi.unmock('../src/account');
  vi.unmock('../src/config');
  vi.unmock('../src/openBrowser');
});

describe('agent browser login flow', () => {
  it('prints a parseable login URL, opens the browser, waits, saves credentials, and reports approval', async () => {
    const logs: string[] = [];
    const warnings: string[] = [];
    const openUrlInBrowser = vi.fn().mockResolvedValue(undefined);
    const saveCredentials = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(console, 'log').mockImplementation((message = '') => logs.push(String(message)));
    vi.spyOn(console, 'warn').mockImplementation((message = '') => warnings.push(String(message)));

    vi.doMock('../../../src/station/backendClient', () => ({
      startManagedSignIn: vi.fn().mockResolvedValue(startedSignIn),
      pollManagedSignIn: vi.fn().mockResolvedValue({
        status: 'approved',
        accessToken: 'token-123',
        account: { email: 'user@example.com', plan: 'pro' }
      })
    }));
    vi.doMock('../src/openBrowser', () => ({ openUrlInBrowser }));
    vi.doMock('../src/config', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../src/config')>();
      return { ...actual, saveCredentials };
    });
    vi.doMock('../src/account', () => ({
      syncCredentialsFromAccount: vi.fn().mockResolvedValue({
        email: 'user@example.com',
        plan: 'pro',
        account: {
          usage: {
            plan: 'pro',
            used: 1,
            limit: 50,
            period: 'month',
            remainingPrompts: null,
            unlockedMapCategoryKeys: []
          }
        }
      }),
      formatUsageLine: vi.fn(() => 'Scans: 1/50 (this month, pro) - 49 remaining')
    }));

    const { runDeviceLogin } = await import('../src/auth');

    await runDeviceLogin('https://viberaven.dev');

    const output = logs.join('\n');
    const verificationUrl = 'https://viberaven.dev/connect?code=device-code-123&device_code=device-code-123';
    expect(output).toContain(`LOGIN_URL_READY: ${verificationUrl}`);
    expect(output).toContain(
      'LOGIN_WAITING: Complete approval in the browser, then VibeRaven will continue automatically.'
    );
    expect(output).toContain('LOGIN_APPROVED: Signed in as user@example.com (pro).');
    expect(openUrlInBrowser).toHaveBeenCalledWith(verificationUrl);
    expect(saveCredentials).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'token-123',
        apiBaseUrl: 'https://viberaven.dev',
        email: 'user@example.com',
        plan: 'pro'
      })
    );
    expect(warnings).toHaveLength(0);
  });

  it('keeps waiting and prints a manual URL when the system browser cannot open', async () => {
    const logs: string[] = [];
    const warnings: string[] = [];
    const openUrlInBrowser = vi
      .fn()
      .mockRejectedValue(
        new Error(
          'Could not open browser (exit 1). Open manually: https://viberaven.dev/connect?code=device-code-123&device_code=device-code-123'
        )
      );

    vi.spyOn(console, 'log').mockImplementation((message = '') => logs.push(String(message)));
    vi.spyOn(console, 'warn').mockImplementation((message = '') => warnings.push(String(message)));

    vi.doMock('../../../src/station/backendClient', () => ({
      startManagedSignIn: vi.fn().mockResolvedValue(startedSignIn),
      pollManagedSignIn: vi.fn().mockResolvedValue({
        status: 'approved',
        accessToken: 'token-123',
        account: { email: 'user@example.com', plan: 'free' }
      })
    }));
    vi.doMock('../src/openBrowser', () => ({ openUrlInBrowser }));
    vi.doMock('../src/config', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../src/config')>();
      return {
        ...actual,
        saveCredentials: vi.fn().mockResolvedValue(undefined)
      };
    });
    vi.doMock('../src/account', () => ({
      syncCredentialsFromAccount: vi.fn().mockResolvedValue({
        email: 'user@example.com',
        plan: 'free'
      }),
      formatUsageLine: vi.fn()
    }));

    const { runDeviceLogin } = await import('../src/auth');

    await runDeviceLogin('https://viberaven.dev');

    const output = logs.join('\n');
    expect(warnings).toHaveLength(0);
    expect(output).toContain(
      'LOGIN_BROWSER_MANUAL: Automatic browser open failed. Open the LOGIN_URL_READY URL manually; the CLI is still waiting.'
    );
    expect(output).toContain(
      'LOGIN_URL_READY: https://viberaven.dev/connect?code=device-code-123&device_code=device-code-123'
    );
    expect(output).toContain('LOGIN_APPROVED: Signed in as user@example.com (free).');
  });
});

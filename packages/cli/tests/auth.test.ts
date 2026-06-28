import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.resetModules();
  vi.unmock('../../../src/station/backendClient');
  vi.unmock('../src/account');
  vi.unmock('../src/config');
  vi.unmock('../src/openBrowser');
});

describe('runDeviceLogin', () => {
  it('opens the verification URL in the browser before waiting for approval', async () => {
    const openUrlInBrowser = vi.fn().mockResolvedValue(undefined);
    const saveCredentials = vi.fn().mockResolvedValue(undefined);

    vi.doMock('../../../src/station/backendClient', () => ({
      startManagedSignIn: vi.fn().mockResolvedValue({
        deviceCode: 'device-123',
        verificationUrl: 'https://viberaven.dev/connect?code=device-123',
        pollIntervalSeconds: 2,
        expiresAt: new Date(Date.now() + 60_000).toISOString()
      }),
      pollManagedSignIn: vi.fn().mockResolvedValue({
        status: 'approved',
        accessToken: 'access-token-123',
        account: {
          email: 'builder@example.com',
          plan: 'free',
          trialEndsAt: null
        }
      })
    }));
    vi.doMock('../src/openBrowser', () => ({ openUrlInBrowser }));
    vi.doMock('../src/config', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../src/config')>();
      return { ...actual, saveCredentials };
    });
    vi.doMock('../src/account', () => ({
      syncCredentialsFromAccount: vi.fn().mockResolvedValue({
        email: 'builder@example.com',
        plan: 'free',
        account: {
          usage: {
            plan: 'free',
            used: 0,
            limit: 2,
            period: 'lifetime',
            remainingPrompts: null,
            unlockedMapCategoryKeys: []
          }
        }
      }),
      formatUsageLine: vi.fn(() => 'Scans: 0/2')
    }));

    const { runDeviceLogin } = await import('../src/auth');

    await runDeviceLogin('https://api.example.test');

    expect(openUrlInBrowser).toHaveBeenCalledWith(
      'https://viberaven.dev/connect?code=device-123&device_code=device-123'
    );
    expect(saveCredentials).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'access-token-123',
        apiBaseUrl: 'https://api.example.test',
        email: 'builder@example.com',
        plan: 'free'
      })
    );
  });
});

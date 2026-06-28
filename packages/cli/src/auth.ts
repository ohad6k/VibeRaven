import { pollManagedSignIn, startManagedSignIn } from '../../../src/station/backendClient';
import { formatUsageLine, syncCredentialsFromAccount } from './account';
import { loadCredentials, resolveApiBaseUrl, saveCredentials } from './config';
import { openUrlInBrowser } from './openBrowser';
import { PUBLIC_COMMAND } from './contracts/commands';
import { formatAgentStatus, LOGIN_REQUIRED } from './statusLabels';

const PUBLIC_LOGIN_COMMAND = `${PUBLIC_COMMAND} login`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runDeviceLogin(apiBaseUrl: string): Promise<void> {
  const signIn = await startManagedSignIn(apiBaseUrl);
  const verificationUrl = buildVerificationUrl(signIn.verificationUrl, signIn.deviceCode);

  console.log('\nVibeRaven sign-in\n');
  console.log(`Open: ${verificationUrl}`);
  console.log(`Code: ${signIn.deviceCode}`);
  console.log(`LOGIN_URL_READY: ${verificationUrl}`);
  console.log(
    'LOGIN_INSTRUCTION: Open this URL for the user, complete VibeRaven browser approval, then wait for the CLI to continue automatically.\n'
  );
  try {
    await openUrlInBrowser(verificationUrl);
    console.log('Opened the VibeRaven approval page in your browser.');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.log(
      'LOGIN_BROWSER_MANUAL: Automatic browser open failed. Open the LOGIN_URL_READY URL manually; the CLI is still waiting.'
    );
    console.log(`LOGIN_BROWSER_DETAIL: ${detail}`);
  }
  console.log('Waiting for approval in the browser…\n');

  console.log('LOGIN_WAITING: Complete approval in the browser, then VibeRaven will continue automatically.');

  const expiresAt = Date.parse(signIn.expiresAt);
  const pollMs = Math.max(2, signIn.pollIntervalSeconds) * 1000;

  while (Date.now() < expiresAt) {
    const result = await pollManagedSignIn(apiBaseUrl, signIn.deviceCode);
    if (result.status === 'pending') {
      await sleep(pollMs);
      continue;
    }
    if (result.status === 'expired') {
      throw new Error(formatAgentStatus(LOGIN_REQUIRED, `Sign-in expired. Ask the user to run \`${PUBLIC_LOGIN_COMMAND}\`, complete browser/device approval, then rerun \`${PUBLIC_COMMAND}\`.`));
    }
    if (result.status === 'denied') {
      throw new Error('Sign-in was denied.');
    }
    if (result.status === 'approved') {
      const baseCreds = {
        accessToken: result.accessToken,
        apiBaseUrl,
        email: result.account?.email,
        plan: result.account?.plan
      };
      await saveCredentials(baseCreds);
      try {
        const synced = await syncCredentialsFromAccount(baseCreds);
        const email = synced.email ?? 'your account';
        const plan = synced.plan ?? 'unknown';
        const usage = synced.account?.usage;
        console.log(`Signed in as ${email} (${plan}).`);
        console.log(`LOGIN_APPROVED: Signed in as ${email} (${plan}).`);
        if (usage) {
          console.log(formatUsageLine(usage));
        }
      } catch (error) {
        const email = result.account?.email ?? 'your account';
        console.log(`Signed in as ${email}.`);
        console.log(`LOGIN_APPROVED: Signed in as ${email}.`);
        console.warn(
          error instanceof Error
            ? `Could not refresh account usage: ${error.message}`
            : 'Could not refresh account usage.'
        );
      }
      return;
    }
  }

  throw new Error(formatAgentStatus(LOGIN_REQUIRED, `Sign-in timed out. Ask the user to run \`${PUBLIC_LOGIN_COMMAND}\`, complete browser/device approval, then rerun \`${PUBLIC_COMMAND}\`.`));
}

function buildVerificationUrl(verificationUrl: string, deviceCode: string): string {
  try {
    const url = new URL(verificationUrl);
    url.searchParams.set('device_code', deviceCode);
    return url.toString();
  } catch {
    const separator = verificationUrl.includes('?') ? '&' : '?';
    return `${verificationUrl}${separator}device_code=${encodeURIComponent(deviceCode)}`;
  }
}

export async function requireCredentials(apiBaseUrl?: string): Promise<{
  accessToken: string;
  apiBaseUrl: string;
}> {
  const creds = await loadCredentials();
  const base = apiBaseUrl ?? creds?.apiBaseUrl ?? resolveApiBaseUrl();
  if (!creds?.accessToken) {
    throw new Error(formatAgentStatus(LOGIN_REQUIRED, `Not signed in. Ask the user to run \`${PUBLIC_LOGIN_COMMAND}\`, complete browser/device approval, then rerun \`${PUBLIC_COMMAND}\`.`));
  }
  return { accessToken: creds.accessToken, apiBaseUrl: base };
}

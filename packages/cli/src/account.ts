import { normalizeBaseUrl } from '../../../src/station/backendClient';
import type { ManagedStationUsage } from '../../../shared/station';
import { saveCredentials, type CliCredentials } from './config';
import { formatAgentStatus, UPGRADE_REQUIRED } from './statusLabels';
import type { CliScanArtifact } from './types';

export interface AccountMeResponse {
  email: string;
  plan: 'free' | 'pro';
  trialEndsAt?: string | null;
  usage: ManagedStationUsage;
  billing?: {
    status?: string | null;
    renewsAt?: string | null;
    endsAt?: string | null;
    currentPeriodStart?: string | null;
  };
}

export async function fetchAccountMe(
  apiBaseUrl: string,
  accessToken: string
): Promise<AccountMeResponse> {
  const url = `${normalizeBaseUrl(apiBaseUrl)}/v1/account/me`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not reach VibeRaven API at ${url}: ${cause}`);
  }

  if (response.status === 401) {
    throw new Error('Session expired. Run `viberaven login` again.');
  }

  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(`Account lookup failed (${response.status}): ${bodyText.trim() || response.statusText}`);
  }

  const data = JSON.parse(bodyText) as AccountMeResponse;
  if (!data.usage || (data.plan !== 'free' && data.plan !== 'pro')) {
    throw new Error('Account response was missing usage or plan.');
  }
  return data;
}

export async function syncCredentialsFromAccount(
  credentials: CliCredentials
): Promise<CliCredentialsWithAccount> {
  const account = await fetchAccountMe(credentials.apiBaseUrl, credentials.accessToken);
  const updated: CliCredentials = {
    ...credentials,
    email: account.email,
    plan: account.plan
  };
  await saveCredentials(updated);
  return { ...updated, account };
}

export type CliCredentialsWithAccount = CliCredentials & { account: AccountMeResponse };

/** Attach account strip fields for static report.html (best-effort). */
export async function enrichArtifactWithAccount(
  artifact: CliScanArtifact,
  apiBaseUrl: string,
  accessToken: string
): Promise<CliScanArtifact> {
  try {
    const account = await fetchAccountMe(apiBaseUrl, accessToken);
    return {
      ...artifact,
      accountEmail: account.email,
      plan: account.plan,
      usage: account.usage,
      usageLine: formatUsageLine(account.usage)
    };
  } catch {
    return artifact;
  }
}

export function formatUsageLine(usage: ManagedStationUsage): string {
  const periodLabel = usage.period === 'monthly' ? 'this month' : 'lifetime';
  return `Scans: ${usage.used}/${usage.limit} (${periodLabel}, ${usage.plan}) · ${usage.remainingPrompts} remaining`;
}

function normalizeUpgradeUrl(url: string): string {
  return url.replace('https://viberice.com/account', 'https://viberaven.dev/account');
}

export function formatScanLimitMessage(upgradeUrl: string): string {
  const safeUpgradeUrl = normalizeUpgradeUrl(upgradeUrl);
  return [
    '',
    formatAgentStatus(UPGRADE_REQUIRED, 'Free scan limit reached. Upgrade to Pro to continue.'),
    'Your last scan artifacts are unchanged if you already ran a scan in this repo.',
    'Do not keep retrying this scan until the user upgrades or quota resets.',
    '',
    `Upgrade & account: ${safeUpgradeUrl}`,
    ''
  ].join('\n');
}

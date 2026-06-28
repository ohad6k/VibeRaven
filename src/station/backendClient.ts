import type { DevicePollResponse, DeviceStartResponse } from '../../shared/auth';
import { isNetworkFetchFailure } from './fetchUtils';
import type {
  ManagedStationRequest,
  ManagedStationResponse,
  ManagedStationUsage
} from '../../shared/station';

export const MANAGED_ACCESS_TOKEN_SECRET_KEY = 'viberice.managedAccessToken';
export const MANAGED_SESSION_STATE_KEY = 'viberice.managedSession';

export interface ManagedAccount {
  email?: string;
  plan?: string;
  trialEndsAt?: string | null;
}

export interface ManagedSession {
  account?: ManagedAccount;
  usage?: ManagedUsage;
}

export type ManagedUsage = ManagedStationUsage;

export type ManagedSignInStart = DeviceStartResponse;

export type ManagedSignInPoll =
  | DevicePollResponse
  | { status: 'expired' | 'denied' };

export async function startManagedSignIn(baseUrl: string): Promise<ManagedSignInStart> {
  const payload = await postJson(`${normalizeBaseUrl(baseUrl)}/v1/auth/device/start`, undefined, {
    failurePrefix: 'Managed sign-in start'
  });

  if (!isManagedSignInStart(payload)) {
    throw new Error('Managed sign-in start response was invalid.');
  }

  return payload;
}

export async function pollManagedSignIn(
  baseUrl: string,
  deviceCode: string
): Promise<ManagedSignInPoll> {
  let payload: unknown;
  try {
    payload = await postJson(
      `${normalizeBaseUrl(baseUrl)}/v1/auth/device/poll`,
      { deviceCode },
      { failurePrefix: 'Managed sign-in poll' }
    );
  } catch (error) {
    if (error instanceof BackendHttpError && error.status === 410) {
      return { status: 'expired' };
    }

    throw error;
  }

  if (!isManagedSignInPoll(payload)) {
    throw new Error('Managed sign-in poll response was invalid.');
  }

  return payload;
}

export async function runManagedStation(
  baseUrl: string,
  accessToken: string,
  payload: ManagedStationRequest
): Promise<ManagedStationResponse> {
  const responsePayload = await postJson(`${normalizeBaseUrl(baseUrl)}/v1/station/run`, payload, {
    accessToken,
    failurePrefix: 'Managed station run'
  });

  if (!isManagedStationResponse(responsePayload)) {
    throw new Error('Managed station run response was invalid.');
  }

  return responsePayload;
}

async function postJson(
  url: string,
  payload: unknown,
  options: { accessToken?: string; failurePrefix: string }
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {})
      },
      // Fastify rejects `Content-Type: application/json` with an empty body (FST_ERR_CTP_EMPTY_JSON_BODY).
      body: JSON.stringify(payload === undefined ? {} : payload)
    });
  } catch (error) {
    if (isNetworkFetchFailure(error)) {
      throw new Error(
        `Could not reach the VibeRaven backend at ${url}. Check your network, then sign in again if needed.`,
        { cause: error }
      );
    }
    throw error;
  }

  if (!response.ok) {
    const bodyText = await readError(response);
    let upgradeUrl: string | undefined;
    try {
      const parsed = JSON.parse(bodyText) as Record<string, unknown>;
      if (typeof parsed.upgrade_url === 'string' && parsed.upgrade_url.length > 0) {
        upgradeUrl = parsed.upgrade_url;
      }
    } catch {
      /* body may not be JSON */
    }
    throw new BackendHttpError(
      `${options.failurePrefix} failed with ${response.status}: ${bodyText}`,
      response.status,
      upgradeUrl
    );
  }

  return response.json();
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.text();
    return body.trim() || response.statusText || 'Unknown error';
  } catch {
    return response.statusText || 'Unknown error';
  }
}

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function isManagedSignInStart(value: unknown): value is ManagedSignInStart {
  return (
    isRecord(value) &&
    isNonEmptyString(value.deviceCode) &&
    isNonEmptyString(value.verificationUrl) &&
    typeof value.pollIntervalSeconds === 'number' &&
    value.pollIntervalSeconds > 0 &&
    isNonEmptyString(value.expiresAt)
  );
}

function isManagedSignInPoll(value: unknown): value is ManagedSignInPoll {
  if (!isRecord(value) || !isNonEmptyString(value.status)) {
    return false;
  }

  if (value.status === 'pending' || value.status === 'expired' || value.status === 'denied') {
    return true;
  }

  return (
    value.status === 'approved' &&
    isNonEmptyString(value.accessToken) &&
    isManagedAccount(value.account)
  );
}

function isManagedStationResponse(value: unknown): value is ManagedStationResponse {
  return (
    isRecord(value) &&
    (value.status === 'stable' || value.status === 'drifting' || value.status === 'chaos') &&
    isNonEmptyString(value.reason) &&
    isNonEmptyString(value.impact) &&
    (value.confidence === 'low' || value.confidence === 'medium' || value.confidence === 'high') &&
    typeof value.output === 'string' &&
    isManagedUsage(value.usage)
  );
}

function isManagedAccount(value: unknown): value is ManagedAccount {
  return (
    isRecord(value) &&
    isNonEmptyString(value.email) &&
    (value.plan === 'free' || value.plan === 'pro') &&
    (value.trialEndsAt === null || isNonEmptyString(value.trialEndsAt))
  );
}

function isManagedUsage(value: unknown): value is ManagedUsage {
  if (!isRecord(value) || (value.plan !== 'free' && value.plan !== 'pro')) {
    return false;
  }
  if (value.remainingPrompts !== null && typeof value.remainingPrompts !== 'number') {
    return false;
  }
  if (typeof value.used !== 'number' || typeof value.limit !== 'number') {
    return false;
  }
  if (value.period !== 'lifetime' && value.period !== 'monthly') {
    return false;
  }
  if (!Array.isArray(value.unlockedMapCategoryKeys)) {
    return false;
  }
  return value.unlockedMapCategoryKeys.every((k) => typeof k === 'string');
}

export class BackendHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly upgradeUrl?: string
  ) {
    super(message);
  }
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

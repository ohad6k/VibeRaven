import type {
  ManualConfirmationDisplayState,
  ManualConfirmationRecord,
  ManualConfirmationState,
  MissionCheck,
  MissionGraph,
  ProviderMission,
  ProviderRegistrySnapshot,
  StackWiringKey
} from './types';

type CreateManualConfirmationRecordInput = {
  providerKey: StackWiringKey;
  checkId: string;
  providerLabel: string;
  areaLabel: string;
  label: string;
  confirmedAt: string | Date;
  registry: ProviderRegistrySnapshot;
  [extra: string]: unknown;
};

const EMPTY_STATE: ManualConfirmationState = { version: 1, records: [] };

const STACK_WIRING_KEY_LOOKUP: Record<StackWiringKey, true> = {
  'figma-app-flow': true,
  'storybook-app-flow': true,
  'product-spec-app-flow': true,
  'route-map-app-flow': true,
  'react-frontend': true,
  'vue-frontend': true,
  'svelte-frontend': true,
  'angular-frontend': true,
  'node-backend': true,
  'python-backend': true,
  'rails-backend': true,
  'go-backend': true,
  'rate-limit-security': true,
  'bot-protection-security': true,
  'secrets-hygiene-security': true,
  'supabase-database': true,
  'firebase-database': true,
  'clerk-auth': true,
  'authjs-auth': true,
  'auth0-auth': true,
  'better-auth-auth': true,
  'supabase-auth': true,
  'neon-database': true,
  'turso-database': true,
  'mongodb-database': true,
  'planetscale-database': true,
  'stripe-payments': true,
  'paddle-payments': true,
  'polar-payments': true,
  'lemon-squeezy-payments': true,
  'vercel-deployment': true,
  'netlify-deployment': true,
  'render-deployment': true,
  'railway-deployment': true,
  'cloudflare-deployment': true,
  'aws-deployment': true,
  'supabase-landing': true,
  'sentry-monitoring': true,
  'posthog-monitoring': true,
  'logrocket-monitoring': true,
  'vitest-testing': true,
  'playwright-testing': true,
  'sentry-error-handling': true,
  'posthog-error-handling': true
};

const ID_PATTERN = /^[a-zA-Z0-9._:-]+$/;
const STRICT_UTC_ISO = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{3}))?Z$/;

export function createManualConfirmationRecord(input: CreateManualConfirmationRecordInput): ManualConfirmationRecord {
  return {
    version: 1,
    providerKey: assertStackWiringKey(input.providerKey),
    checkId: assertSafeId(input.checkId, 'checkId'),
    providerLabel: sanitizeLabel(input.providerLabel),
    areaLabel: sanitizeLabel(input.areaLabel),
    label: sanitizeLabel(input.label),
    status: 'confirmed',
    confirmedAt: toIsoTimestamp(input.confirmedAt),
    registryVersion: input.registry.version,
    registrySource: input.registry.source,
    registryGeneratedAt: toIsoTimestamp(input.registry.generatedAt)
  };
}

export function normalizeManualConfirmationState(value: unknown): ManualConfirmationState {
  if (!isObject(value) || value.version !== 1 || !Array.isArray(value.records)) {
    return { ...EMPTY_STATE, records: [] };
  }

  return {
    version: 1,
    records: canonicalizeRecords(value.records.flatMap((record) => {
      const normalized = normalizeRecord(record);
      return normalized ? [normalized] : [];
    }))
  };
}

export function mergeManualConfirmation(
  state: ManualConfirmationState,
  record: ManualConfirmationRecord
): ManualConfirmationState {
  const normalizedState = normalizeManualConfirmationState(state);
  const normalizedRecord = normalizeRecord(record);
  if (!normalizedRecord) {
    return normalizedState;
  }

  const existingIndex = normalizedState.records.findIndex(
    (current) => current.providerKey === normalizedRecord.providerKey && current.checkId === normalizedRecord.checkId
  );
  if (existingIndex === -1) {
    return {
      version: 1,
      records: [...normalizedState.records, normalizedRecord]
    };
  }

  const existing = normalizedState.records[existingIndex];
  if (recordTimestamp(normalizedRecord) < recordTimestamp(existing)) {
    return normalizedState;
  }

  return {
    version: 1,
    records: normalizedState.records.map((current, index) => index === existingIndex ? normalizedRecord : current)
  };
}

export function revokeManualConfirmation(
  state: ManualConfirmationState,
  providerKey: StackWiringKey,
  checkId: string,
  revokedAt: string | Date
): ManualConfirmationState {
  const normalizedState = normalizeManualConfirmationState(state);
  const safeProviderKey = assertStackWiringKey(providerKey);
  const safeCheckId = assertSafeId(checkId, 'checkId');
  const revokedAtIso = toIsoTimestamp(revokedAt);

  return {
    version: 1,
    records: normalizedState.records.map((record) => {
      if (record.providerKey !== safeProviderKey || record.checkId !== safeCheckId) {
        return record;
      }
      return {
        ...record,
        status: 'revoked',
        revokedAt: revokedAtIso
      };
    })
  };
}

export function applyManualConfirmationsToMissionGraph(
  graph: MissionGraph,
  state: ManualConfirmationState,
  registry: ProviderRegistrySnapshot
): MissionGraph {
  const normalizedState = normalizeManualConfirmationState(state);
  const recordsByCheck = new Map(
    normalizedState.records.map((record) => [recordKey(record.providerKey, record.checkId), record])
  );

  const areas = graph.areas.map((area) => ({
    ...area,
    providerMissions: area.providerMissions.map((mission) => overlayMission(mission, recordsByCheck, registry))
  }));
  const byArea = areas.reduce<MissionGraph['byArea']>((acc, area) => {
    acc[area.key] = area;
    return acc;
  }, {});
  const byProvider = areas
    .flatMap((area) => area.providerMissions)
    .reduce<MissionGraph['byProvider']>((acc, mission) => {
      acc[mission.key] = mission;
      return acc;
    }, {});

  return {
    ...graph,
    areas,
    byArea,
    byProvider
  };
}

export function buildManualConfirmationDisplayState(
  state: ManualConfirmationState,
  registry: ProviderRegistrySnapshot
): ManualConfirmationDisplayState {
  const normalizedState = normalizeManualConfirmationState(state);
  return {
    version: 1,
    records: normalizedState.records.map((record) => {
      if (record.status !== 'confirmed' || registryMetadataMatches(record, registry)) {
        return record;
      }
      return {
        ...record,
        status: 'stale'
      };
    })
  };
}

function overlayMission(
  mission: ProviderMission,
  recordsByCheck: Map<string, ManualConfirmationRecord>,
  registry: ProviderRegistrySnapshot
): ProviderMission {
  return {
    ...mission,
    checks: mission.checks.map((check) => overlayCheck(check, recordsByCheck, registry))
  };
}

function overlayCheck(
  check: MissionCheck,
  recordsByCheck: Map<string, ManualConfirmationRecord>,
  registry: ProviderRegistrySnapshot
): MissionCheck {
  if (check.evidenceClass !== 'manual-dashboard') {
    return { ...check };
  }

  const record = recordsByCheck.get(recordKey(check.providerKey, check.id));
  if (!record || record.status !== 'confirmed') {
    return { ...check };
  }

  return {
    ...check,
    status: registryMetadataMatches(record, registry) ? 'user-confirmed' : 'stale'
  };
}

function normalizeRecord(value: unknown): ManualConfirmationRecord | null {
  if (!isObject(value) || value.version !== 1) {
    return null;
  }

  const providerKey = normalizeStackWiringKey(value.providerKey);
  const checkId = normalizeSafeId(value.checkId);
  const providerLabel = normalizeLabel(value.providerLabel);
  const areaLabel = normalizeLabel(value.areaLabel);
  const label = normalizeLabel(value.label);
  const status = value.status === 'confirmed' || value.status === 'revoked' ? value.status : null;
  const confirmedAt = normalizeIsoTimestamp(value.confirmedAt);
  const revokedAt = typeof value.revokedAt === 'undefined' ? undefined : normalizeIsoTimestamp(value.revokedAt);
  const registryVersion = value.registryVersion === 1 ? value.registryVersion : null;
  const registrySource = value.registrySource === 'bundled' || value.registrySource === 'managed-backend'
    ? value.registrySource
    : null;
  const registryGeneratedAt = normalizeIsoTimestamp(value.registryGeneratedAt);

  if (
    !providerKey ||
    !checkId ||
    !providerLabel ||
    !areaLabel ||
    !label ||
    !status ||
    !confirmedAt ||
    (typeof value.revokedAt !== 'undefined' && !revokedAt) ||
    !registryVersion ||
    !registrySource ||
    !registryGeneratedAt
  ) {
    return null;
  }

  return {
    version: 1,
    providerKey,
    checkId,
    providerLabel,
    areaLabel,
    label,
    status,
    confirmedAt,
    ...(revokedAt ? { revokedAt } : {}),
    registryVersion,
    registrySource,
    registryGeneratedAt
  };
}

function registryMetadataMatches(record: ManualConfirmationRecord, registry: ProviderRegistrySnapshot): boolean {
  if (registry.status === 'stale') {
    return false;
  }

  return record.registryVersion === registry.version &&
    record.registrySource === registry.source;
}

function recordKey(providerKey: StackWiringKey, checkId: string): string {
  return `${providerKey}\u0000${checkId}`;
}

function recordTimestamp(record: ManualConfirmationRecord): number {
  return Date.parse(record.revokedAt ?? record.confirmedAt);
}

function canonicalizeRecords(records: ManualConfirmationRecord[]): ManualConfirmationRecord[] {
  const recordsByCheck = new Map<string, ManualConfirmationRecord>();
  for (const record of records) {
    const key = recordKey(record.providerKey, record.checkId);
    const current = recordsByCheck.get(key);
    if (!current || recordTimestamp(record) >= recordTimestamp(current)) {
      recordsByCheck.set(key, record);
    }
  }
  return [...recordsByCheck.values()];
}

function assertStackWiringKey(value: string): StackWiringKey {
  const normalized = normalizeStackWiringKey(value);
  if (!normalized) {
    throw new Error(`Invalid manual confirmation providerKey: ${value}`);
  }
  return normalized;
}

function normalizeStackWiringKey(value: unknown): StackWiringKey | null {
  return typeof value === 'string' && STACK_WIRING_KEY_LOOKUP[value as StackWiringKey] ? value as StackWiringKey : null;
}

function assertSafeId(value: string, field: string): string {
  const normalized = normalizeSafeId(value);
  if (!normalized) {
    throw new Error(`Invalid manual confirmation ${field}.`);
  }
  return normalized;
}

function normalizeSafeId(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= 128 && ID_PATTERN.test(normalized) ? normalized : null;
}

function sanitizeLabel(value: string): string {
  const normalized = normalizeLabel(value);
  if (!normalized) {
    throw new Error('Invalid manual confirmation label.');
  }
  return normalized;
}

function normalizeLabel(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = redactSecretLikeText(value)
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
  return normalized.length > 0 ? normalized : null;
}

function redactSecretLikeText(value: string): string {
  return value
    .replace(/\b(?:sk|pk)_(?:live|test)_[a-zA-Z0-9_]+\b/g, '[redacted]')
    .replace(/\b(api[_-]?key|access[_-]?token|refresh[_-]?token|secret)\s*[:=]\s*\S+/gi, '$1=[redacted]')
    .replace(/\bBearer\s+[a-zA-Z0-9._~+/=-]+\b/gi, 'Bearer [redacted]');
}

function toIsoTimestamp(value: string | Date): string {
  const normalized = normalizeIsoTimestamp(value);
  if (!normalized) {
    throw new Error('Invalid manual confirmation timestamp.');
  }
  return normalized;
}

function normalizeIsoTimestamp(value: unknown): string | null {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : value.toISOString();
  }
  if (typeof value !== 'string') {
    return null;
  }
  const match = STRICT_UTC_ISO.exec(value);
  if (!match) {
    return null;
  }
  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    return null;
  }

  const canonicalInput = `${match[1]}.${match[2] ?? '000'}Z`;
  const parsed = new Date(time).toISOString();
  return parsed === canonicalInput ? parsed : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

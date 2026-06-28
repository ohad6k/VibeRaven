import type { ActionKeyInput } from './types';

const REPO_MARKERS = [
  '/app/',
  '/src/',
  '/pages/',
  '/components/',
  '/lib/',
  '/server/',
  '/api/',
  '/supabase/',
  '/prisma/',
  '/drizzle/',
  '/db/',
  '/migrations/',
  '/vercel/',
  '/.github/',
];

function slashPath(value: string): string {
  return value.replace(/\\/g, '/').replace(/\/+/g, '/').trim();
}

function stripQueryAndHash(value: string): string {
  const queryIndex = value.search(/[?#]/);
  return queryIndex === -1 ? value : value.slice(0, queryIndex);
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+/, '').replace(/\/+$/, '');
}

function stripWindowsDrive(value: string): string {
  return value.replace(/^[a-z]:\//i, '');
}

function stripAbsolutePrefix(value: string): string {
  const normalized = slashPath(value);
  const isAbsolute = /^[a-z]:\//i.test(normalized) || normalized.startsWith('/');
  if (!isAbsolute) {
    return normalized;
  }

  const lower = normalized.toLowerCase();

  for (const marker of REPO_MARKERS) {
    const index = lower.lastIndexOf(marker);
    if (index !== -1) {
      return normalized.slice(index + 1);
    }
  }

  return stripWindowsDrive(normalized).replace(/^users\/[^/]+\//i, '').replace(/^home\/[^/]+\//i, '');
}

export function normalizeActionPath(path: string): string {
  return trimSlashes(stripAbsolutePrefix(stripQueryAndHash(path))).toLowerCase();
}

export function displayRepoPath(path: string): string {
  return trimSlashes(stripAbsolutePrefix(stripQueryAndHash(path)));
}

export function normalizeActionValues(values: string[] = []): string[] {
  return Array.from(new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))).sort();
}

function normalizeSegment(value: string | undefined): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}

export function buildActionKey(input: ActionKeyInput): string {
  const segments = [
    normalizeSegment(input.kind),
    normalizeSegment(input.provider),
    normalizeSegment(input.category),
    input.target ? normalizeActionPath(input.target) : undefined,
  ].filter((segment): segment is string => Boolean(segment));

  const values = normalizeActionValues(input.values);
  if (values.length > 0) {
    segments.push(values.join(','));
  }

  return segments.join(':');
}

function normalizeFingerprintValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    const normalized = value.map((entry) => normalizeFingerprintValue(entry)).filter((entry) => entry !== undefined);
    if (normalized.every((entry) => typeof entry === 'string')) {
      return Array.from(new Set(normalized as string[])).sort();
    }
    return normalized;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeFingerprintValue(entry)]),
    );
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return value;
}

export function actionFingerprint(value: unknown): string {
  return JSON.stringify(normalizeFingerprintValue(value));
}

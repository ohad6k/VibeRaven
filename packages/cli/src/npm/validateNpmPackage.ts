import { PUBLIC_AGENT_MODE_COMMAND } from '../contracts/commands';
import { POPULAR_NPM_PACKAGES } from './popularPackages';

export type NpmPackageVerdict = 'ok' | 'not_found' | 'suspicious';

export interface NpmPackageValidation {
  name: string;
  verdict: NpmPackageVerdict;
  reasons: string[];
  registryUrl: string;
  followUpCommand: typeof PUBLIC_AGENT_MODE_COMMAND;
}

const REGISTRY_BASE = 'https://registry.npmjs.org';
const NEW_PACKAGE_DAYS = 14;
const TYPOSQUAT_MAX_DISTANCE = 2;
const LOW_PUBLISH_COUNT = 3;

type NpmRegistryPackage = {
  description?: string;
  maintainers?: unknown[];
  time?: { created?: string };
  versions?: Record<string, unknown>;
};

export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0)
  );

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function daysSince(isoDate: string, now = Date.now()): number {
  const created = Date.parse(isoDate);
  if (!Number.isFinite(created)) return Number.POSITIVE_INFINITY;
  return (now - created) / (1000 * 60 * 60 * 24);
}

function closestPopularPackage(name: string): { pkg: string; distance: number } | null {
  let best: { pkg: string; distance: number } | null = null;

  for (const popular of POPULAR_NPM_PACKAGES) {
    const distance = levenshteinDistance(name, popular);
    if (distance <= TYPOSQUAT_MAX_DISTANCE && (!best || distance < best.distance)) {
      best = { pkg: popular, distance };
    }
  }

  return best;
}

function buildBase(name: string): Pick<NpmPackageValidation, 'name' | 'registryUrl' | 'followUpCommand'> {
  const normalized = name.trim().toLowerCase();
  return {
    name: normalized,
    registryUrl: `${REGISTRY_BASE}/${encodeURIComponent(normalized)}`,
    followUpCommand: PUBLIC_AGENT_MODE_COMMAND,
  };
}

export async function validateNpmPackage(
  name: string,
  options?: { fetch?: typeof fetch; now?: number }
): Promise<NpmPackageValidation> {
  const fetchFn = options?.fetch ?? fetch;
  const now = options?.now ?? Date.now();
  const base = buildBase(name);

  if (!base.name) {
    return {
      ...base,
      verdict: 'not_found',
      reasons: ['Package name is empty.'],
    };
  }

  let response: Response;
  try {
    response = await fetchFn(base.registryUrl);
  } catch {
    return {
      ...base,
      verdict: 'not_found',
      reasons: ['Could not reach the public npm registry.'],
    };
  }

  if (response.status === 404) {
    return {
      ...base,
      verdict: 'not_found',
      reasons: [`Package "${base.name}" was not found on the public npm registry.`],
    };
  }

  if (!response.ok) {
    return {
      ...base,
      verdict: 'suspicious',
      reasons: [`Unexpected npm registry response: HTTP ${response.status}.`],
    };
  }

  const data = (await response.json()) as NpmRegistryPackage;
  const reasons: string[] = [];
  let suspicious = false;

  const created = data.time?.created;
  if (created) {
    const ageDays = daysSince(created, now);
    const closest = closestPopularPackage(base.name);
    if (ageDays < NEW_PACKAGE_DAYS && closest && closest.pkg !== base.name) {
      suspicious = true;
      reasons.push(
        `Package was published ${Math.max(0, Math.floor(ageDays))} day(s) ago and its name is within ${TYPOSQUAT_MAX_DISTANCE} character edits of popular package "${closest.pkg}".`
      );
    }
  }

  const description = (data.description ?? '').trim();
  const maintainerCount = Array.isArray(data.maintainers) ? data.maintainers.length : 0;
  const publishCount = data.versions ? Object.keys(data.versions).length : 0;

  if (!description && maintainerCount === 0 && publishCount <= LOW_PUBLISH_COUNT) {
    suspicious = true;
    reasons.push(
      'Package has an empty description, no listed maintainers, and very few published versions.'
    );
  }

  if (suspicious) {
    return { ...base, verdict: 'suspicious', reasons };
  }

  return {
    ...base,
    verdict: 'ok',
    reasons: ['Package exists on the public npm registry with no v1 suspicious signals.'],
  };
}

export async function validateNpmPackages(
  names: string[],
  options?: { fetch?: typeof fetch; now?: number }
): Promise<NpmPackageValidation[]> {
  return Promise.all(names.map((name) => validateNpmPackage(name, options)));
}

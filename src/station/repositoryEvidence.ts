import { collectEnvVarEvidence } from './envEvidence';
import type {
  RepositoryEvidenceItem,
  RepositoryEvidenceSummary,
  ScanResult,
  ScannedFile
} from './types';

const CORE_ENV_NAMES = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'AUTH_SECRET',
  'NEXTAUTH_SECRET',
  'VERCEL_PROJECT_ID',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  'NEXT_PUBLIC_POSTHOG_KEY',
  'PADDLE_API_KEY',
  'PADDLE_WEBHOOK_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY'
];

const SECRET_ENV_REFERENCE = /\b(?:STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|GOOGLE_CLIENT_SECRET|SUPABASE_SERVICE_ROLE_KEY|CLERK_SECRET_KEY|AUTH_SECRET|NEXTAUTH_SECRET|SENTRY_AUTH_TOKEN|PADDLE_API_KEY|PADDLE_WEBHOOK_SECRET|UPSTASH_REDIS_REST_TOKEN|TURNSTILE_SECRET_KEY)\b/i;
const RLS_POLICY = /enable\s+row\s+level\s+security|create\s+policy|alter\s+policy/i;
const WEBHOOK_SIGNATURE = /webhooks\.constructevent|stripe-signature|verify(?:signature|webhook)|svix\.webhook|webhook\.verify/i;
const RATE_LIMIT = /ratelimit|rate-limit|rate_limiter|too many requests|status\s*:\s*429/i;
const OAUTH_CALLBACK = /oauth|callback|redirect_uri|redirecturl|authorized redirect|allowed redirect/i;
const SECURITY_HEADERS = /content-security-policy|strict-transport-security|x-frame-options|x-content-type-options|referrer-policy|permissions-policy/i;
const SERVICE_ROLE = /\bSUPABASE_SERVICE_ROLE_KEY\b|service[-_]?role/i;
const SERVER_ONLY_HINT = /server-only|\.server\.|\/server\/|app\/api\/|pages\/api\/|\/api\/|route\.[jt]s|actions?\.[jt]s/i;
const ENV_OR_DOC_PATH = /(^|\/)(\.env\.example|env\.example|readme|docs?)|\.md$/i;

export function analyzeRepositoryEvidence(scan: ScanResult): RepositoryEvidenceSummary {
  const files = visibleFiles(scan);
  const pathBlob = `${scan.fileTree}\n${scan.files.map((file) => file.path).join('\n')}`.replace(/\\/g, '/');
  const contentBlob = files.map((file) => file.content as string).join('\n');

  return {
    env: collectEnvVarEvidence(scan, CORE_ENV_NAMES),
    security: [
      clientSecretReference(files),
      serviceRoleScope(files),
      foundOrMissing(
        'supabase-rls-policy',
        'Supabase RLS policy evidence',
        RLS_POLICY.test(contentBlob),
        evidenceFor(files, RLS_POLICY)
      ),
      foundOrMissing(
        'webhook-signature-verification',
        'Webhook signature verification evidence',
        WEBHOOK_SIGNATURE.test(contentBlob),
        evidenceFor(files, WEBHOOK_SIGNATURE)
      ),
      foundOrMissing(
        'rate-limit-evidence',
        'Rate limit evidence',
        Boolean(scan.stackSignals.hasRateLimit) || RATE_LIMIT.test(contentBlob),
        evidenceFor(files, RATE_LIMIT)
      ),
      foundOrMissing(
        'oauth-callback-evidence',
        'OAuth callback or redirect evidence',
        OAUTH_CALLBACK.test(`${contentBlob}\n${pathBlob}`),
        evidenceFor(files, OAUTH_CALLBACK).concat(pathEvidence(scan, OAUTH_CALLBACK))
      ),
      foundOrMissing(
        'security-headers',
        'Security headers evidence',
        SECURITY_HEADERS.test(contentBlob),
        evidenceFor(files, SECURITY_HEADERS)
      )
    ]
  };
}

function visibleFiles(scan: ScanResult): ScannedFile[] {
  return scan.files.filter((file) => !file.isSecret && typeof file.content === 'string');
}

function foundOrMissing(id: string, label: string, found: boolean, evidence: string[]): RepositoryEvidenceItem {
  return {
    id,
    label,
    status: found ? 'found' : 'missing',
    evidence: unique(evidence).slice(0, 6)
  };
}

function clientSecretReference(files: ScannedFile[]): RepositoryEvidenceItem {
  const risky = files.filter((file) => isClientReachableFile(file) && SECRET_ENV_REFERENCE.test(file.content as string));
  return {
    id: 'client-secret-reference',
    label: 'No client-side secret references found',
    status: risky.length > 0 ? 'risk' : 'found',
    evidence: risky.map((file) => `file: ${normalizePath(file.path)}`).slice(0, 6)
  };
}

function serviceRoleScope(files: ScannedFile[]): RepositoryEvidenceItem {
  const references = files.filter((file) => SERVICE_ROLE.test(file.content as string));
  const risky = references.filter((file) => isClientReachableFile(file) && !SERVER_ONLY_HINT.test(normalizePath(file.path)));
  if (risky.length > 0) {
    return {
      id: 'service-role-scope',
      label: 'Supabase service role stays server-only',
      status: 'risk',
      evidence: risky.map((file) => `file: ${normalizePath(file.path)}`).slice(0, 6)
    };
  }

  const serverEvidence = references.filter((file) => isServerOnlyPath(file.path) && !isEnvOrDocPath(file.path));

  return {
    id: 'service-role-scope',
    label: 'Supabase service role stays server-only',
    status: serverEvidence.length > 0 ? 'found' : 'unknown',
    evidence: serverEvidence.map((file) => `file: ${normalizePath(file.path)}`).slice(0, 6)
  };
}

function evidenceFor(files: ScannedFile[], pattern: RegExp): string[] {
  return files
    .filter((file) => pattern.test(file.content as string))
    .map((file) => `file: ${normalizePath(file.path)}`)
    .slice(0, 6);
}

function pathEvidence(scan: ScanResult, pattern: RegExp): string[] {
  return scan.files
    .map((file) => normalizePath(file.path))
    .filter((path) => pattern.test(path))
    .map((path) => `file: ${path}`)
    .slice(0, 6);
}

function isClientReachableFile(file: ScannedFile): boolean {
  const content = file.content as string;
  const normalized = normalizePath(file.path).toLowerCase();
  if (hasUseClientDirective(content)) {
    return true;
  }
  if (/\.client\.[jt]sx?$|(^|\/)(client|frontend|public)\//.test(normalized)) {
    return true;
  }

  return isBrowserOnlyPath(file.path) && /\b(window|document|localStorage|sessionStorage|navigator|useEffect|onClick)\b/.test(content);
}

function hasUseClientDirective(content: string): boolean {
  return /^(?:\s|;|\/\/[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)*['"]use client['"]/.test(content);
}

function isBrowserOnlyPath(path: string): boolean {
  const normalized = normalizePath(path).toLowerCase();
  if (isServerOnlyPath(path)) {
    return false;
  }

  return (
    /(^|\/)(components|hooks|contexts|providers)\//.test(normalized) ||
    /\.(jsx|tsx)$/.test(normalized)
  );
}

function isServerOnlyPath(path: string): boolean {
  const normalized = normalizePath(path).toLowerCase();
  return /\/api\/|app\/api\/|pages\/api\/|route\.[jt]s$|\.server\.[jt]sx?$|\/server\//.test(normalized);
}

function isEnvOrDocPath(path: string): boolean {
  return ENV_OR_DOC_PATH.test(normalizePath(path).toLowerCase());
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

import type { CliScanArtifact } from './types';

/** Patterns aligned with `src/station/fileScanner.ts` — never persist secrets in `.viberaven/`. */
const INLINE_SECRET_PATTERNS: RegExp[] = [
  /\b(sk_(?:live|test)_[A-Za-z0-9]{12,}|sk-proj-[A-Za-z0-9_-]{16,}|sk-[A-Za-z0-9_-]{20,})\b/g,
  /\b(whsec_[A-Za-z0-9]{12,}|rk_(?:live|test)_[A-Za-z0-9]{12,})\b/g,
  /\bghp_[A-Za-z0-9]{36,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{50,}\b/g,
  /\bxox[bp]-[A-Za-z0-9-]{20,}\b/g,
  /\bxapp-[A-Za-z0-9-]{20,}\b/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g
];

const SENSITIVE_ENV_KEYS =
  /(?:^|_)(?:ACCESS_TOKEN|AUTHORIZATION|API_KEY|SECRET|SECRET_KEY|SERVICE_ROLE_KEY|TOKEN|PASSWORD|PRIVATE_KEY|CREDENTIALS?)(?:$|_)/i;

export function redactString(value: string): string {
  let out = value;
  for (const pattern of INLINE_SECRET_PATTERNS) {
    out = out.replace(pattern, pattern.source.includes('PRIVATE KEY') ? '[REDACTED_PRIVATE_KEY]' : '[REDACTED_SECRET]');
  }
  out = out.replace(/\bAuthorization\s*:\s*([A-Za-z][A-Za-z0-9._-]*)\s+[^\s;,]+/gi, 'Authorization: $1 [REDACTED]');
  return out.replace(
    /\b([A-Za-z0-9_]*(?:ACCESS_TOKEN|AUTHORIZATION|API_KEY|SECRET|SECRET_KEY|SERVICE_ROLE_KEY|TOKEN|PASSWORD|PRIVATE_KEY|CREDENTIALS?)[A-Za-z0-9_]*)\s*=\s*["']?[^"'\s;,]+["']?/gi,
    '$1=[REDACTED]'
  );
}

function redactUnknown(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactString(value);
  }
  if (Array.isArray(value)) {
    return value.map(redactUnknown);
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(record)) {
      if (SENSITIVE_ENV_KEYS.test(key)) {
        next[key] = '[REDACTED]';
      } else {
        next[key] = redactUnknown(entry);
      }
    }
    return next;
  }
  return value;
}

/** Strip likely secrets before writing scan artifacts to disk. */
export function sanitizeArtifactForDisk(artifact: CliScanArtifact): CliScanArtifact {
  return redactUnknown(artifact) as CliScanArtifact;
}

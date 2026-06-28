import type { RunnerJobKind } from './deploy';

export type SafeFixJobKind = Extract<RunnerJobKind, 'create_file' | 'apply_patch'>;

export type RunnerSafeFixInput = {
  approved: true;
  path: string;
  content: string;
  expectedExistingContent?: string;
  description?: string;
  reason?: string;
  riskLevel: 'low' | 'medium';
  verificationCommand?: string;
};

export type SafeFixValidationResult =
  | { ok: true; input: RunnerSafeFixInput }
  | { ok: false; reason: string };

const MAX_SAFE_FIX_CONTENT_BYTES = 200_000;
const ALLOWED_VERIFICATION_COMMANDS = new Set([
  'npm run build',
  'npm run test',
  'npm test',
  'pnpm build',
  'pnpm test',
  'yarn build',
  'yarn test',
  'bun run build',
  'bun run test',
  'bun test'
]);

export function validateSafeFixJobInput(
  kind: RunnerJobKind,
  rawInput: unknown
): SafeFixValidationResult {
  if (kind !== 'create_file' && kind !== 'apply_patch') {
    return isEmptyInput(rawInput)
      ? { ok: true, input: {} as RunnerSafeFixInput }
      : { ok: false, reason: 'Runner job input is only supported for safe-fix jobs.' };
  }

  if (!isRecord(rawInput)) {
    return { ok: false, reason: 'Safe fix input must be an object.' };
  }
  if (rawInput.approved !== true) {
    return { ok: false, reason: 'Safe fix requires explicit approval.' };
  }
  if (rawInput.riskLevel !== 'low' && rawInput.riskLevel !== 'medium') {
    return { ok: false, reason: 'Safe fix risk level must be low or medium.' };
  }
  if (typeof rawInput.path !== 'string') {
    return { ok: false, reason: 'Safe fix path is required.' };
  }
  const pathValidation = validateSafeFixRelativePath(rawInput.path);
  if (!pathValidation.ok) {
    return pathValidation;
  }
  if (typeof rawInput.content !== 'string') {
    return { ok: false, reason: 'Safe fix content is required.' };
  }
  if (!isSafeText(rawInput.content)) {
    return { ok: false, reason: 'Safe fix content must be bounded text.' };
  }
  if (containsSecretLikeValue(rawInput.content)) {
    return { ok: false, reason: 'Safe fix content contains a secret-like value.' };
  }
  if (kind === 'apply_patch') {
    if (typeof rawInput.expectedExistingContent !== 'string') {
      return { ok: false, reason: 'Safe update requires expectedExistingContent.' };
    }
    if (!isSafeText(rawInput.expectedExistingContent)) {
      return { ok: false, reason: 'Expected existing content must be bounded text.' };
    }
    if (containsSecretLikeValue(rawInput.expectedExistingContent)) {
      return { ok: false, reason: 'Expected existing content contains a secret-like value.' };
    }
  }
  if (
    typeof rawInput.description !== 'string' &&
    typeof rawInput.reason !== 'string'
  ) {
    return { ok: false, reason: 'Safe fix requires a description or reason.' };
  }

  const verificationCommand =
    typeof rawInput.verificationCommand === 'string'
      ? rawInput.verificationCommand.trim()
      : undefined;
  if (verificationCommand && !ALLOWED_VERIFICATION_COMMANDS.has(verificationCommand)) {
    return { ok: false, reason: 'Verification command must be a build or test package script.' };
  }

  return {
    ok: true,
    input: {
      approved: true,
      path: pathValidation.path,
      content: rawInput.content,
      ...(kind === 'apply_patch' ? { expectedExistingContent: rawInput.expectedExistingContent as string } : {}),
      ...(typeof rawInput.description === 'string' ? { description: rawInput.description } : {}),
      ...(typeof rawInput.reason === 'string' ? { reason: rawInput.reason } : {}),
      riskLevel: rawInput.riskLevel,
      ...(verificationCommand ? { verificationCommand } : {})
    }
  };
}

export function validateSafeFixRelativePath(path: string): { ok: true; path: string } | { ok: false; reason: string } {
  const trimmed = path.trim();
  if (!trimmed) {
    return { ok: false, reason: 'Safe fix path must not be empty.' };
  }
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('\\') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('\\\\') ||
    /^[A-Za-z]:[\\/]/.test(trimmed)
  ) {
    return { ok: false, reason: 'Safe fix path must be relative.' };
  }

  const normalized = trimmed.replace(/\\/g, '/');
  const segments = normalized.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    return { ok: false, reason: 'Safe fix path must not traverse directories.' };
  }
  if (segments.some((segment) => segment === '.git' || segment === 'node_modules')) {
    return { ok: false, reason: 'Safe fix path targets a blocked directory.' };
  }

  const basename = segments.at(-1)?.toLowerCase() ?? '';
  if (basename !== '.env.example' && (basename === '.env' || basename.startsWith('.env.'))) {
    return { ok: false, reason: 'Safe fix path targets an environment secret file.' };
  }
  if (isSecretLikeFilename(basename)) {
    return { ok: false, reason: 'Safe fix path targets a secret-like file.' };
  }
  if (!isAllowedSafeFixPath(normalized)) {
    return { ok: false, reason: 'Safe fix path is outside the V1 allowlist.' };
  }

  return { ok: true, path: normalized };
}

export function isSafeFixJobKind(kind: RunnerJobKind): kind is SafeFixJobKind {
  return kind === 'create_file' || kind === 'apply_patch';
}

export function containsSecretLikeValue(value: string): boolean {
  return SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

const SECRET_VALUE_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/i,
  /\b(?:postgres|postgresql|mysql|mongodb|redis):\/\/[^:\s/@]+:[^@\s]+@/i,
  /\b(?:ghp_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})\b/,
  /\b(?:sk_live_|sk_test_)[A-Za-z0-9]{16,}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bwhsec_[A-Za-z0-9]{12,}\b/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/
];

function isAllowedSafeFixPath(path: string): boolean {
  if (path === '.env.example') {
    return true;
  }
  const segments = path.split('/');
  if (segments.length !== 2) {
    return false;
  }
  const [dir, filename] = segments;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(filename)) {
    return false;
  }
  if (dir === 'docs') {
    return filename.endsWith('.md');
  }
  if (dir === '.viberaven') {
    return filename.endsWith('.md') || filename.endsWith('.json');
  }
  return false;
}

function isSecretLikeFilename(filename: string): boolean {
  return (
    filename.includes('service-account') ||
    filename.includes('credential') ||
    filename.includes('credentials') ||
    filename.includes('private-key') ||
    filename.includes('private_key') ||
    filename === 'id_rsa' ||
    filename === 'id_dsa' ||
    filename === 'id_ed25519' ||
    filename.endsWith('.pem') ||
    filename.endsWith('.p12') ||
    filename.endsWith('.pfx') ||
    filename.includes('secret')
  );
}

function isSafeText(value: string): boolean {
  return !value.includes('\0') && new TextEncoder().encode(value).length <= MAX_SAFE_FIX_CONTENT_BYTES;
}

function isEmptyInput(value: unknown): boolean {
  return value === undefined || (isRecord(value) && Object.keys(value).length === 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

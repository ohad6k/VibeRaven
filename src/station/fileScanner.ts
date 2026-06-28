import { promises as fs } from 'node:fs';
import { join, relative, basename, sep } from 'node:path';
import type { ScanResult, ScannedFile, StackSignalKey } from './types';

const ALWAYS_SKIP = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'out',
  '.cache', 'coverage', '.nyc_output', 'storybook-static',
  'public', 'static', '.turbo', '.vercel'
]);

const SECRET_PATTERNS = [
  /\.env$/, /\.env\..+/, /\.pem$/, /\.key$/,
  /\.p8$/, /\.p12$/, /\.pfx$/, /\.ppk$/,
  /secrets?\./i, /credentials?\./i, /\.secret\./i,
  /service[-_]?account/i, /private[-_]?key/i
];

const SECRET_FILE_NAMES = new Set([
  '.npmrc',
  '.netrc',
  '.pypirc',
  'id_rsa',
  'id_dsa',
  'id_ecdsa',
  'id_ed25519',
  'npmrc',
  'kubeconfig',
  'dockerconfigjson'
]);

const HIGH_SIGNAL_FILES = [
  'package.json', 'tsconfig.json', 'SPEC.md', 'README.md',
  '.env.example', 'middleware.ts', 'middleware.js',
  'vite.config.ts', 'vite.config.js',
  'next.config.ts', 'next.config.js',
  'tailwind.config.ts', 'tailwind.config.js',
  'vercel.json', 'sentry.client.config.ts', 'sentry.server.config.ts',
  'playwright.config.ts', 'playwright.config.js',
  'drizzle.config.ts', 'drizzle.config.js',
  'prisma/schema.prisma', 'supabase/config.toml',
  'src/middleware.ts', 'app/middleware.ts',
];

const STACK_SIGNAL_PATHS: Record<StackSignalKey, string[]> = {
  hasSupabase: ['supabase/config.toml', 'src/utils/supabase.ts', 'lib/supabase.ts'],
  hasPrisma: ['prisma/schema.prisma'],
  hasDrizzle: ['drizzle.config.ts', 'drizzle.config.js'],
  hasMongoose: [],
  hasNextJs: ['next.config.ts', 'next.config.js', 'app/layout.tsx'],
  hasVite: ['vite.config.ts', 'vite.config.js'],
  hasAuth: [
    'middleware.ts', 'src/middleware.ts', 'app/middleware.ts',
    'src/lib/auth.ts', 'lib/auth.ts', 'auth.config.ts'
  ],
  hasTests: ['jest.config.ts', 'vitest.config.ts'],
  hasDocker: ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'],
  hasCI: ['.github/workflows', '.gitlab-ci.yml', 'circle.yml'],
  hasStripe: [],
  hasPolar: [],
  hasClerk: [],
  hasAuthJs: [],
  hasPaddle: [],
  hasVercel: ['vercel.json'],
  hasSentry: ['sentry.client.config.ts', 'sentry.server.config.ts', 'instrumentation.ts'],
  hasPostHog: [],
  hasPlaywright: ['playwright.config.ts', 'playwright.config.js'],
  hasUpstash: [],
  hasTurnstile: [],
  hasNeon: [],
  hasMongoDb: [],
  hasPlanetScale: [],
  hasTurso: ['turso/config.toml'],
  hasLanding: ['landing', 'pages/index.tsx', 'app/page.tsx', 'index.html'],
  hasRateLimit: [],
  hasEnvExample: ['.env.example'],
  hasRobots: ['public/robots.txt', 'robots.txt'],
  hasSitemap: ['public/sitemap.xml', 'sitemap.xml'],
  hasErrorBoundary: [],
  hasLoadingStates: [],
};

export interface DeepScanOptions {
  maxFiles: number;
  maxBytesPerFile: number;
  maxTotalBytes: number;
  maxDepth: number;
}

const DEFAULT_OPTIONS: DeepScanOptions = {
  maxFiles: 80,
  maxBytesPerFile: 6000,
  maxTotalBytes: 120000,
  maxDepth: 8,
};

export async function deepScanWorkspace(
  workspaceRoot: string,
  options: Partial<DeepScanOptions> = {}
): Promise<ScanResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let ignoredByGitignore: (relPath: string) => boolean = () => false;

  try {
    const gitignoreContent = await fs.readFile(join(workspaceRoot, '.gitignore'), 'utf-8');
    ignoredByGitignore = createGitignoreMatcher(gitignoreContent);
  } catch {
    // No .gitignore is fine
  }

  const allFiles: string[] = [];
  const secretsFound: string[] = [];

  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > opts.maxDepth) return;
      let entries: import('node:fs').Dirent<string>[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relPath = relative(workspaceRoot, fullPath);

      if (entry.isDirectory()) {
        if (ALWAYS_SKIP.has(entry.name)) {
          if (entry.name === 'public' || entry.name === 'static') {
            await collectPublicMetadataFiles(fullPath, relPath, depth + 1);
          }
          continue;
        }
        if (relPath && ignoredByGitignore(relPath)) continue;
        await walk(fullPath, depth + 1);
      } else {
        if (relPath && ignoredByGitignore(relPath)) continue;
        if (isSecretFileName(entry.name)) {
          secretsFound.push(relPath);
          continue;
        }
        allFiles.push(relPath);
      }
    }
  }

  async function collectPublicMetadataFiles(dir: string, relDir: string, depth: number): Promise<void> {
    if (depth > opts.maxDepth) return;
    let entries: import('node:fs').Dirent<string>[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relPath = join(relDir, entry.name);
      if (entry.isDirectory()) {
        await collectPublicMetadataFiles(fullPath, relPath, depth + 1);
        continue;
      }
      if (/^(robots\.txt|sitemap\.xml)$/i.test(entry.name)) {
        allFiles.push(relPath);
      }
    }
  }

  await walk(workspaceRoot, 0);

  const scored = allFiles
    .map((f) => ({ path: f, score: scoreFile(f) }))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, opts.maxFiles);

  let totalBytes = 0;
  const scannedFiles: ScannedFile[] = [];

  for (const { path: relPath, score } of scored) {
    if (totalBytes >= opts.maxTotalBytes) break;
    const fullPath = join(workspaceRoot, relPath);
    let content: string | null = null;
    let sizeBytes = 0;

    try {
      const raw = await fs.readFile(fullPath);
      if (isLikelyBinary(raw)) {
        scannedFiles.push({ path: relPath, content: null, isSecret: false, sizeBytes: raw.length, heat: Math.round(score) });
        continue;
      }
      const text = raw.toString('utf-8');
      const safeText = redactSecretValues(text);
      sizeBytes = Buffer.byteLength(text, 'utf-8');
      const budget = Math.min(opts.maxBytesPerFile, opts.maxTotalBytes - totalBytes);
      content = safeText.slice(0, budget);
      totalBytes += Math.min(sizeBytes, budget);
    } catch {
      // Unreadable file — still record path
    }

    scannedFiles.push({ path: relPath, content, isSecret: false, sizeBytes, heat: Math.round(score) });
  }

  // Stack signals from file paths
  const allPathsSet = new Set(allFiles);
  const stackSignals: Partial<Record<StackSignalKey, boolean>> = {};

  for (const [signal, paths] of Object.entries(STACK_SIGNAL_PATHS) as Array<[StackSignalKey, string[]]>) {
    if (paths.length > 0) {
      stackSignals[signal] = paths.some(
        (p) => allPathsSet.has(p) || [...allPathsSet].some((ap) => ap.replace(/\\/g, '/').includes(p))
      );
    }
  }

  // Stack signals from package.json files across monorepos/sub-apps.
  const packageDeps = await readPackageDependencies(workspaceRoot, allFiles);
  const packageDepsLower = packageDeps.map((dep) => dep.toLowerCase());
  const pathBlob = allFiles.map((file) => file.replace(/\\/g, '/').toLowerCase()).join('\n');
  const contentBlob = scannedFiles
    .filter((file) => !file.isSecret && typeof file.content === 'string')
    .map((file) => file.content as string)
    .join('\n')
    .toLowerCase();
  const repoBlob = `${packageDepsLower.join('\n')}\n${pathBlob}\n${contentBlob}`;

  stackSignals.hasSupabase = Boolean(stackSignals.hasSupabase) || hasPackage(packageDepsLower, ['@supabase/']) || /\bsupabase\b/.test(repoBlob);
  stackSignals.hasStripe = hasPackage(packageDepsLower, ['stripe']) || /\bstripe_(secret_key|webhook_secret)\b/.test(repoBlob) || /stripe/.test(pathBlob);
  stackSignals.hasPolar = hasPackage(packageDepsLower, ['@polar-sh/']) || /\bpolar_(access_token|webhook_secret|pro_product_id|sandbox)\b/.test(repoBlob) || /\bpolar\b/.test(pathBlob);
  stackSignals.hasClerk = hasPackage(packageDepsLower, ['@clerk/']) || /\bclerk_(secret_key|publishable_key)\b|\bnext_public_clerk_/.test(repoBlob);
  stackSignals.hasAuthJs = hasPackage(packageDepsLower, ['next-auth', '@auth/']) || /\b(auth_secret|nextauth_secret)\b|\bauth\.js\b/.test(repoBlob);
  stackSignals.hasAuth = Boolean(stackSignals.hasAuth) || Boolean(stackSignals.hasClerk) || Boolean(stackSignals.hasAuthJs) || /\bauthmiddleware\b|\bclerkmiddleware\b/.test(repoBlob);
  stackSignals.hasPaddle = hasPackage(packageDepsLower, ['@paddle/', 'paddle']) || /\bpaddle_(api_key|webhook_secret|client_token)\b/.test(repoBlob);
  stackSignals.hasVercel = Boolean(stackSignals.hasVercel) || hasPackage(packageDepsLower, ['@vercel/']) || /\bvercel\.json\b|\bvercel\b/.test(repoBlob);
  stackSignals.hasSentry = Boolean(stackSignals.hasSentry) || hasPackage(packageDepsLower, ['@sentry/']) || /\bsentry_dsn\b|\bsentry\.init\b|\bsentry\b/.test(repoBlob);
  stackSignals.hasPostHog = hasPackage(packageDepsLower, ['posthog-js', 'posthog-node']) || /\b(next_public_)?posthog_key\b|\bposthog\.init\b|\bposthog\b/.test(repoBlob);
  stackSignals.hasPlaywright = Boolean(stackSignals.hasPlaywright) || hasPackage(packageDepsLower, ['@playwright/test']) || /(^|\/)playwright\.config\.[jt]s\b|\.spec\.[jt]sx?\b/.test(pathBlob);
  stackSignals.hasUpstash = hasPackage(packageDepsLower, ['@upstash/']) || /\bupstash_redis_rest_(url|token)\b|\bupstash\b/.test(repoBlob);
  stackSignals.hasTurnstile = hasPackage(packageDepsLower, ['turnstile']) || /\bturnstile_(secret_key|site_key)\b|\bnext_public_turnstile_site_key\b|\bcloudflare turnstile\b/.test(repoBlob);
  stackSignals.hasNeon = hasPackage(packageDepsLower, ['@neondatabase/']) || /\bneon_database_url\b|\bneon\b/.test(repoBlob);
  stackSignals.hasMongoDb = hasPackage(packageDepsLower, ['mongodb', 'mongoose']) || /\bmongodb_(uri|url)\b|\bmongodb\b/.test(repoBlob);
  stackSignals.hasPlanetScale = hasPackage(packageDepsLower, ['@planetscale/database']) || /\bplanetscale_database_url\b|\bplanetscale\b/.test(repoBlob);
  stackSignals.hasTurso = hasPackage(packageDepsLower, ['@libsql/client']) || /\bturso_(database_url|auth_token)\b|\bturso\b/.test(repoBlob);
  stackSignals.hasMongoose = packageDepsLower.includes('mongoose');
  stackSignals.hasTests = Boolean(stackSignals.hasTests) || hasPackage(packageDepsLower, ['vitest', 'jest', '@playwright/test', 'cypress']) || /\.test\.[jt]sx?\b|\.spec\.[jt]sx?\b/.test(pathBlob);
  stackSignals.hasRateLimit = packageDeps.some((d) =>
    ['express-rate-limit', 'rate-limiter-flexible', '@fastify/rate-limit', 'upstash'].some((r) => d.includes(r))
  ) || scanContainsRateLimit(scannedFiles);
  stackSignals.hasCI = Boolean(stackSignals.hasCI) || /(^|\n)\.github\/workflows\/[^/\n]+\.ya?ml(\n|$)|(^|\n)(\.gitlab-ci\.yml|circle\.yml)(\n|$)/i.test(pathBlob);
  stackSignals.hasRobots = Boolean(stackSignals.hasRobots) || /(^|\n|\/)robots\.txt(\n|$)/i.test(pathBlob);
  stackSignals.hasSitemap = Boolean(stackSignals.hasSitemap) || /(^|\n|\/)sitemap\.xml(\n|$)/i.test(pathBlob);
  stackSignals.hasErrorBoundary = Boolean(stackSignals.hasErrorBoundary) ||
    /(^|\n|\/)(error|error-boundary|errorboundary)\.[jt]sx?(\n|$)|(^|\n).*errorboundary\.[jt]sx?(\n|$)/i.test(pathBlob) ||
    /\b(componentdidcatch|errorboundary|react\.component<.*error)/i.test(contentBlob);
  stackSignals.hasLoadingStates = Boolean(stackSignals.hasLoadingStates) ||
    /(^|\n|\/)(loading|skeleton|spinner)\.[jt]sx?(\n|$)|(^|\n).*skeleton\.[jt]sx?(\n|$)/i.test(pathBlob) ||
    /\b(isloading|loading state|suspense fallback|<skeleton|<spinner)/i.test(contentBlob);

  return {
    files: scannedFiles,
    stackSignals,
    packageDeps,
    fileTree: allFiles.slice(0, 200).join('\n'),
    secretsFound,
    totalFilesScanned: allFiles.length,
  };
}

function hasPackage(packageDepsLower: string[], needles: string[]): boolean {
  return needles.some((needle) => packageDepsLower.some((dep) => dep === needle || dep.includes(needle)));
}

function scoreFile(relPath: string): number {
  const name = basename(relPath);
  const parts = relPath.split(sep);
  let score = 0;

  if (HIGH_SIGNAL_FILES.some((f) => relPath === f || relPath.replace(/\\/g, '/').endsWith(f))) score += 10;
  if (/config|Config/.test(name)) score += 6;
  if (/auth|middleware|guard|permission|role|policy/i.test(relPath)) score += 7;
  if (/schema|migration|seed|\.prisma/i.test(relPath)) score += 6;
  if (/\.github[/\\]workflows[/\\].+\.ya?ml$|\.gitlab-ci\.yml$|circle\.yml$/i.test(relPath)) score += 9;
  if (/(^|[/\\])robots\.txt$|(^|[/\\])sitemap\.xml$/i.test(relPath)) score += 9;
  if (/sentry\.(client|server)\.config\.[jt]s$|instrumentation\.[jt]s$/i.test(relPath)) score += 9;
  if (/error[-_]?boundary|errorboundary|(^|[/\\])error\.[jt]sx?$/i.test(relPath)) score += 8;
  if (/(^|[/\\])loading\.[jt]sx?$|skeleton|spinner/i.test(relPath)) score += 7;
  if (/webhook|checkout|billing|rate-?limit|validation|validator/i.test(relPath)) score += 7;
  if (parts.includes('api') || parts.includes('routes')) score += 5;
  if (['main.ts', 'main.tsx', 'index.ts', 'index.tsx', 'App.tsx', 'App.ts',
       'layout.tsx', 'page.tsx', 'server.ts', 'app.ts'].includes(name)) score += 5;
  if (/types?|\.d\.ts/.test(name)) score += 3;
  if (parts.some((p) => ['hooks', 'store', 'stores', 'context'].includes(p))) score += 4;
  if (/db|database/i.test(relPath)) score += 5;
  score -= Math.max(0, parts.length - 3) * 0.5;

  return score;
}

async function readPackageDependencies(workspaceRoot: string, allFiles: string[]): Promise<string[]> {
  const deps = new Set<string>();
  const packagePaths = allFiles.filter((file) => basename(file) === 'package.json');

  for (const relPath of packagePaths) {
    try {
      const raw = await fs.readFile(join(workspaceRoot, relPath), 'utf-8');
      const pkg = JSON.parse(raw) as Record<string, unknown>;
      for (const key of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
        const group = pkg[key];
        if (!group || typeof group !== 'object' || Array.isArray(group)) {
          continue;
        }
        for (const name of Object.keys(group)) {
          deps.add(name);
        }
      }
    } catch {
      // Invalid or unreadable package.json files should not fail the scan.
    }
  }

  return [...deps].sort();
}

function scanContainsRateLimit(files: ScannedFile[]): boolean {
  const haystack = files
    .filter((file) => typeof file.content === 'string' && /[/\\](api|routes|server|src)[/\\]|app\.(ts|js)$/i.test(file.path))
    .map((file) => file.content as string)
    .join('\n');

  return /\b(rateLimit|rateLimiter|rate-limiter|rateLimitBuckets|Too many requests)\b/i.test(haystack);
}

function redactSecretValues(text: string): string {
  return text
    .replace(/\b(sk_(?:live|test)_[A-Za-z0-9]{12,}|sk-proj-[A-Za-z0-9_-]{16,}|sk-[A-Za-z0-9_-]{20,}|whsec_[A-Za-z0-9]{12,}|rk_(?:live|test)_[A-Za-z0-9]{12,})\b/g, '[REDACTED_SECRET]')
    .replace(
      /\b([A-Z0-9_]*(?:SECRET|TOKEN|API_KEY|PRIVATE_KEY|SERVICE_ROLE|PASSWORD|WEBHOOK_SECRET)[A-Z0-9_]*)[ \t]*=[ \t]*(['"]?)([^\s'"`#]+)\2/g,
      (_match, key: string, quote: string, value: string) => value.length > 0 ? `${key}=${quote}[REDACTED_SECRET]${quote}` : `${key}=`
    );
}

function isSecretFileName(fileName: string): boolean {
  if (fileName === '.env.example') {
    return false;
  }

  if (SECRET_FILE_NAMES.has(fileName.toLowerCase())) {
    return true;
  }

  return SECRET_PATTERNS.some((pattern) => pattern.test(fileName));
}

function isLikelyBinary(buffer: Buffer): boolean {
  return buffer.includes(0);
}

type GitignoreRule = {
  directoryOnly: boolean;
  anchored: boolean;
  hasSlash: boolean;
  pattern: string;
  regex: RegExp;
};

function createGitignoreMatcher(gitignoreContent: string): (relPath: string) => boolean {
  const rules = gitignoreContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('!'))
    .map(parseGitignoreRule);

  return (relPath: string) => {
    const normalized = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
    return rules.some((rule) => ruleMatchesPath(rule, normalized));
  };
}

function parseGitignoreRule(raw: string): GitignoreRule {
  const anchored = raw.startsWith('/');
  let pattern = raw.replace(/^\/+/, '');
  const directoryOnly = pattern.endsWith('/');
  pattern = pattern.replace(/\/+$/, '');
  const hasSlash = pattern.includes('/');

  return {
    directoryOnly,
    anchored,
    hasSlash,
    pattern,
    regex: new RegExp(`^${gitignoreGlobToRegex(pattern)}$`)
  };
}

function ruleMatchesPath(rule: GitignoreRule, relPath: string): boolean {
  const candidates = rule.anchored || rule.hasSlash ? [relPath] : relPath.split('/');
  const directMatch = candidates.some((candidate) => rule.regex.test(candidate));
  if (directMatch && !rule.directoryOnly) {
    return true;
  }
  if (directMatch && rule.directoryOnly) {
    return true;
  }

  if (!rule.directoryOnly) {
    return false;
  }

  if (rule.anchored || rule.hasSlash) {
    return relPath === rule.pattern || relPath.startsWith(`${rule.pattern}/`);
  }

  return relPath.split('/').includes(rule.pattern);
}

function gitignoreGlobToRegex(pattern: string): string {
  let out = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern[i];
    if (ch === '*') {
      out += '[^/]*';
      continue;
    }
    if (ch === '?') {
      out += '[^/]';
      continue;
    }
    out += escapeRegex(ch);
  }
  return out;
}

function escapeRegex(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

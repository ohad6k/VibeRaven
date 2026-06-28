import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

export type AuditInputFile = {
  path: string;
  content: string;
};

export type VercelSupabaseAuditInput = {
  projectRoot: string;
  files: AuditInputFile[];
};

export type VercelSupabaseAuditCheck = {
  id: 'supabase-rls-policy-proof' | 'vercel-supabase-pooler-port' | 'supabase-service-role-boundary';
  title: string;
  status: 'pass' | 'needs_work';
  summary: string;
  evidence: string[];
};

export type VercelSupabaseAuditResult = {
  status: 'pass' | 'needs_work';
  summary: string;
  checks: VercelSupabaseAuditCheck[];
};

const ENV_FILES = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  '.env.example',
  '.env.sample',
  'vercel.json'
];

const SQL_ROOTS = ['supabase', 'migrations', 'db', 'database'];
const SKIP_DIRS = new Set(['.git', 'node_modules', '.next', 'dist', 'build', 'coverage']);
const SENSITIVE_ENV_KEY = /\b[A-Z0-9_]*(?:SECRET|TOKEN|KEY|PASSWORD|SERVICE_ROLE|DATABASE_URL|POSTGRES_URL)[A-Z0-9_]*\b/i;

function evidencePort(line: string): string {
  const match = line.match(/:(5432|6543)\b/);
  return match ? ` (:${match[1]})` : '';
}

function redactEvidenceLine(line: string): string {
  const envMatch = line.match(/^\s*([A-Z0-9_]*(?:SECRET|TOKEN|KEY|PASSWORD|SERVICE_ROLE|DATABASE_URL|POSTGRES_URL)[A-Z0-9_]*)\s*[:=]/i);
  if (envMatch || SENSITIVE_ENV_KEY.test(line)) {
    const key = envMatch?.[1] ?? line.match(SENSITIVE_ENV_KEY)?.[0] ?? '<sensitive>';
    return `${key}=<redacted>${evidencePort(line)}`;
  }

  return line.replace(/\bpostgres(?:ql)?:\/\/[^@\s]+@/gi, (match) => {
    const protocol = match.startsWith('postgresql://') ? 'postgresql://' : 'postgres://';
    return `${protocol}<redacted>@`;
  });
}

function lineEvidence(file: AuditInputFile, pattern: RegExp): string[] {
  return file.content
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter(({ line }) => pattern.test(line))
    .map(({ line, lineNumber }) => `${file.path}:${lineNumber}: ${redactEvidenceLine(line)}`);
}

function sqlFiles(files: AuditInputFile[]): AuditInputFile[] {
  return files.filter((file) => file.path.toLowerCase().endsWith('.sql'));
}

function buildRlsCheck(files: AuditInputFile[]): VercelSupabaseAuditCheck {
  const sql = sqlFiles(files);
  const rlsEvidence = sql.flatMap((file) => lineEvidence(file, /\benable\s+row\s+level\s+security\b/i));
  const policyEvidence = sql.flatMap((file) => lineEvidence(file, /\bcreate\s+policy\b/i));
  const status = rlsEvidence.length > 0 && policyEvidence.length > 0 ? 'pass' : 'needs_work';

  return {
    id: 'supabase-rls-policy-proof',
    title: 'Supabase RLS policy proof',
    status,
    summary:
      status === 'pass'
        ? 'Found SQL evidence for row level security and at least one policy.'
        : 'Missing SQL evidence for both `enable row level security` and `create policy`.',
    evidence: [...rlsEvidence.slice(0, 5), ...policyEvidence.slice(0, 5)]
  };
}

function buildPoolerCheck(files: AuditInputFile[]): VercelSupabaseAuditCheck {
  const dbUrlPattern = /\b(?:DATABASE_URL|POSTGRES_URL)\b/i;
  const direct5432Evidence = files.flatMap((file) =>
    lineEvidence(file, /\b(?:DATABASE_URL|POSTGRES_URL)\b[^\n\r]*:5432\b/i)
  );
  const pooler6543Evidence = files.flatMap((file) =>
    lineEvidence(file, /\b(?:DATABASE_URL|POSTGRES_URL)\b[^\n\r]*:6543\b/i)
  );
  const dbUrlEvidence = files.flatMap((file) => lineEvidence(file, dbUrlPattern));
  const status = direct5432Evidence.length === 0 && pooler6543Evidence.length > 0 ? 'pass' : 'needs_work';

  let summary = 'Found Supabase transaction pooler evidence on port 6543 and no direct 5432 database URL evidence.';
  if (direct5432Evidence.length > 0) {
    summary = 'Found direct 5432 DATABASE_URL/POSTGRES_URL evidence. Vercel/serverless deployments should prefer Supabase transaction pooler port 6543.';
  } else if (pooler6543Evidence.length === 0) {
    summary = 'Missing DATABASE_URL/POSTGRES_URL evidence for Supabase transaction pooler port 6543.';
  }

  return {
    id: 'vercel-supabase-pooler-port',
    title: 'Vercel/Supabase pooler port',
    status,
    summary,
    evidence: [...direct5432Evidence.slice(0, 5), ...pooler6543Evidence.slice(0, 5), ...dbUrlEvidence.slice(0, 3)]
  };
}

function buildServiceRoleCheck(files: AuditInputFile[]): VercelSupabaseAuditCheck {
  const exposedEvidence = files.flatMap((file) =>
    lineEvidence(file, /\bNEXT_PUBLIC_[A-Z0-9_]*\b[^\r\n]*(?:SERVICE[_-]?ROLE|SERVICE_KEY)/i)
  );
  const serviceRoleEvidence = files.flatMap((file) => lineEvidence(file, /\bSERVICE_ROLE\b/i));
  const status = exposedEvidence.length === 0 ? 'pass' : 'needs_work';

  return {
    id: 'supabase-service-role-boundary',
    title: 'Supabase service-role boundary',
    status,
    summary:
      status === 'pass'
        ? 'No NEXT_PUBLIC service role environment evidence found.'
        : 'Found service role evidence in a NEXT_PUBLIC environment variable. Service role keys must stay server-only.',
    evidence: status === 'pass' ? serviceRoleEvidence.slice(0, 5) : exposedEvidence.slice(0, 5)
  };
}

export function buildVercelSupabaseAudit(input: VercelSupabaseAuditInput): VercelSupabaseAuditResult {
  const checks = [
    buildRlsCheck(input.files),
    buildPoolerCheck(input.files),
    buildServiceRoleCheck(input.files)
  ];
  const status = checks.every((check) => check.status === 'pass') ? 'pass' : 'needs_work';

  return {
    status,
    summary:
      status === 'pass'
        ? 'Repo evidence passes the local Vercel/Supabase audit checks.'
        : 'Repo evidence needs work before claiming Vercel/Supabase production readiness.',
    checks
  };
}

async function readIfExists(projectRoot: string, relativePath: string): Promise<AuditInputFile | undefined> {
  try {
    const absolutePath = join(projectRoot, relativePath);
    const fileStat = await stat(absolutePath);
    if (!fileStat.isFile()) {
      return undefined;
    }
    return {
      path: relativePath,
      content: await readFile(absolutePath, 'utf8')
    };
  } catch {
    return undefined;
  }
}

async function collectSqlFiles(projectRoot: string, root: string): Promise<AuditInputFile[]> {
  const base = join(projectRoot, root);
  try {
    const rootStat = await stat(base);
    if (!rootStat.isDirectory()) {
      return [];
    }
  } catch {
    return [];
  }

  const files: AuditInputFile[] = [];
  async function visit(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          await visit(join(dir, entry.name));
        }
        continue;
      }
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.sql')) {
        continue;
      }
      const absolutePath = join(dir, entry.name);
      try {
        files.push({
          path: relative(projectRoot, absolutePath).replace(/\\/g, '/'),
          content: await readFile(absolutePath, 'utf8')
        });
      } catch {
        // Collection is best-effort; unreadable files should not abort the audit.
      }
    }
  }

  await visit(base);
  return files;
}

export async function collectVercelSupabaseAuditInput(projectRoot: string): Promise<VercelSupabaseAuditInput> {
  const envFiles = (await Promise.all(ENV_FILES.map((file) => readIfExists(projectRoot, file)))).filter(
    (file): file is AuditInputFile => Boolean(file)
  );
  const sql = (await Promise.all(SQL_ROOTS.map((root) => collectSqlFiles(projectRoot, root)))).flat();
  const seen = new Set<string>();
  const files = [...envFiles, ...sql].filter((file) => {
    if (seen.has(file.path)) {
      return false;
    }
    seen.add(file.path);
    return true;
  });

  return { projectRoot, files };
}

export function renderVercelSupabaseAudit(result: VercelSupabaseAuditResult): string {
  const lines = [
    'VibeRaven Vercel/Supabase audit',
    `Status: ${result.status}`,
    result.summary,
    '',
    'Boundary: this audit uses local repo evidence only. Provider dashboard settings still need manual verification or read-only provider MCP confirmation.',
    ''
  ];

  for (const check of result.checks) {
    lines.push(`${check.status === 'pass' ? 'PASS' : 'NEEDS_WORK'} ${check.id}`);
    lines.push(`  ${check.summary}`);
    for (const evidence of check.evidence.slice(0, 5)) {
      lines.push(`  - ${evidence}`);
    }
    if (check.evidence.length === 0) {
      lines.push('  - No local evidence found.');
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

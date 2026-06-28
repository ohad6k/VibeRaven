import { collectEnvVarEvidence } from '../../envEvidence';
import type { RepositoryEvidenceSummary, ScanResult, ScannedFile } from '../../types';

export type RepoScanContext = {
  files: VisibleFile[];
  pathBlob: string;
  contentBlob: string;
  deps: string[];
};

export type VisibleFile = {
  path: string;
  normalizedPath: string;
  content: string;
  lowerContent: string;
};

const ENV_NAME_PATTERN =
  /\b(?:process\.env|import\.meta\.env)\.([A-Z][A-Z0-9_]{2,})\b/g;
const ENV_ASSIGNMENT_PATTERN = /^[ \t]*(?:export[ \t]+)?([A-Z][A-Z0-9_]{2,})[ \t]*=/gm;
const SUPABASE_TABLE_PATTERN = /\.from\s*\(\s*['"]([a-z0-9_]+)['"]\s*\)/gi;
const STRIPE_WEBHOOK_PATH_PATTERN = /(^|\/)(api\/webhooks\/stripe|api\/stripe\/webhook|webhooks\/stripe)[^/\s]*/i;
const GITHUB_WORKFLOW_PATTERN = /(^|\/)\.github\/workflows\/([^/\n]+\.ya?ml)/i;

export function buildRepoScanContext(scan: ScanResult): RepoScanContext {
  const files = visibleFiles(scan);
  return {
    files,
    pathBlob: `${scan.fileTree}\n${scan.files.map((file) => file.path).join('\n')}`.replace(/\\/g, '/'),
    contentBlob: files.map((file) => file.lowerContent).join('\n'),
    deps: scan.packageDeps.map((dep) => dep.toLowerCase())
  };
}

export function visibleFiles(scan: ScanResult): VisibleFile[] {
  return scan.files
    .filter((file) => !file.isSecret && typeof file.content === 'string')
    .map((file) => ({
      path: file.path.replace(/\\/g, '/'),
      normalizedPath: file.path.replace(/\\/g, '/').toLowerCase(),
      content: file.content as string,
      lowerContent: (file.content as string).toLowerCase()
    }));
}

export function collectReferencedEnvNames(
  scan: ScanResult,
  repositoryEvidence: RepositoryEvidenceSummary
): string[] {
  const names = new Set<string>();

  for (const entry of repositoryEvidence.env) {
    if (entry.present || entry.evidence.length > 0) {
      names.add(entry.name);
    }
  }

  for (const file of visibleFiles(scan)) {
    if (!/(^|\/)\.env(\.|$)|env\.example|readme/i.test(file.normalizedPath)) {
      ENV_NAME_PATTERN.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = ENV_NAME_PATTERN.exec(file.content)) !== null) {
        names.add(match[1]);
      }
    }

    if (/\.env\.example|env\.example/i.test(file.normalizedPath)) {
      ENV_ASSIGNMENT_PATTERN.lastIndex = 0;
      let assignment: RegExpExecArray | null;
      while ((assignment = ENV_ASSIGNMENT_PATTERN.exec(file.content)) !== null) {
        names.add(assignment[1]);
      }
    }
  }

  const supplemental = collectEnvVarEvidence(scan, [...names]);
  for (const entry of supplemental) {
    if (entry.present || entry.evidence.length > 0) {
      names.add(entry.name);
    }
  }

  return [...names].sort();
}

export function collectEnvExampleNames(scan: ScanResult): string[] {
  const names = new Set<string>();
  for (const file of visibleFiles(scan)) {
    if (!/\.env\.example|env\.example/i.test(file.normalizedPath)) {
      continue;
    }
    ENV_ASSIGNMENT_PATTERN.lastIndex = 0;
    let assignment: RegExpExecArray | null;
    while ((assignment = ENV_ASSIGNMENT_PATTERN.exec(file.content)) !== null) {
      names.add(assignment[1]);
    }
  }
  return [...names].sort();
}

export function hasRlsMigrationEvidence(repo: RepoScanContext): boolean {
  return /\/policies\/|_rls\.sql|\brls\b/i.test(repo.pathBlob) ||
    repo.files.some((file) =>
      /enable\s+row\s+level\s+security|create\s+policy|alter\s+table[\s\S]{0,200}enable\s+row\s+level/i.test(
        file.content
      )
    );
}

export function collectSupabaseReferencedTables(repo: RepoScanContext): string[] {
  const tables = new Set<string>();
  for (const file of repo.files) {
    SUPABASE_TABLE_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = SUPABASE_TABLE_PATTERN.exec(file.content)) !== null) {
      tables.add(match[1]);
    }
  }
  return [...tables].sort();
}

export function findStripeWebhookRoute(repo: RepoScanContext): string | null {
  const pathMatch = repo.pathBlob.match(STRIPE_WEBHOOK_PATH_PATTERN);
  if (pathMatch) {
    return pathMatch[0].replace(/^\//, '');
  }
  const file = repo.files.find((entry) => /stripe.*webhook|webhook.*stripe/i.test(entry.normalizedPath));
  return file ? file.path : null;
}

export function hasStripeWebhookSignature(repo: RepoScanContext): boolean {
  return /webhooks\.constructevent/i.test(repo.contentBlob);
}

export function collectStripePriceEnvNames(repo: RepoScanContext, referencedEnv: string[]): string[] {
  return referencedEnv.filter((name) => /^STRIPE_(PRICE_|PRODUCT_)/i.test(name) || /STRIPE.*PRICE/i.test(name));
}

export function findGithubWorkflowPaths(repo: RepoScanContext): string[] {
  const paths = new Set<string>();
  for (const line of repo.pathBlob.split(/\r?\n/)) {
    const match = line.match(GITHUB_WORKFLOW_PATTERN);
    if (match) {
      paths.add(line.trim());
    }
  }
  return [...paths].sort();
}

export function pathEvidence(files: VisibleFile[], pattern: RegExp, limit = 4): string[] {
  return files
    .filter((file) => pattern.test(file.normalizedPath) || pattern.test(file.content))
    .slice(0, limit)
    .map((file) => `file: ${file.path}`);
}

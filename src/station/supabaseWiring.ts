import type { ScanResult, StackWiringItem, StackWiringStatus, SupabaseDatabaseWiringSummary } from './types';

type ScannableFile = {
  path: string;
  normalizedPath: string;
  content: string;
  lowerContent: string;
};

export function analyzeSupabaseDatabaseWiring(scan: ScanResult): SupabaseDatabaseWiringSummary {
  const files = visibleFiles(scan);
  const deps = scan.packageDeps.map((dep) => dep.toLowerCase());
  const pathBlob = `${scan.fileTree}\n${scan.files.map((file) => file.path).join('\n')}`.replace(/\\/g, '/').toLowerCase();
  const contentBlob = files.map((file) => file.lowerContent).join('\n');

  const items: StackWiringItem[] = [
    item(
      'package-installed',
      'Supabase package installed',
      deps.some((dep) => dep === '@supabase/supabase-js' || dep === '@supabase/ssr' || dep.startsWith('@supabase/')),
      packageEvidence(deps),
      'Install the correct Supabase package for this app framework.'
    ),
    item(
      'env-names-documented',
      'Supabase env names documented',
      hasSupabaseUrl(contentBlob) && hasSupabaseAnonKey(contentBlob),
      envEvidence(contentBlob),
      'Document NEXT_PUBLIC_SUPABASE_URL/VITE_SUPABASE_URL and the matching anon key in an env example or config docs.'
    ),
    item(
      'client-file-exists',
      'Supabase client file exists',
      hasSupabaseClient(files, pathBlob),
      clientEvidence(files, pathBlob),
      'Create a Supabase client helper that follows the existing app structure.'
    ),
    item(
      'database-query-usage',
      'Database query usage found',
      /\.from\s*\(\s*['"][a-z0-9_]+['"]\s*\)/i.test(contentBlob),
      queryEvidence(files),
      'Use the Supabase client from server-safe code paths for real database reads or writes.'
    ),
    item(
      'schema-or-migrations',
      'Schema or migration file found',
      hasSchemaOrMigration(files, pathBlob),
      schemaEvidence(files, pathBlob),
      'Add a checked-in schema or migration path so database structure is reproducible.'
    ),
    item(
      'rls-policy-evidence',
      'Supabase RLS policy evidence found',
      hasRlsEvidence(files, pathBlob),
      rlsEvidence(files, pathBlob),
      'Add or document Supabase RLS policies for user-owned tables before launch.'
    ),
    item(
      'generated-types',
      'Generated database types found',
      hasGeneratedTypes(files, pathBlob),
      generatedTypeEvidence(files, pathBlob),
      'Generate and commit Supabase database types for safer app code.'
    ),
    serviceRoleSafetyItem(files)
  ];

  const passedCount = items.filter((entry) => entry.status === 'passed').length;
  const totalCount = items.length;
  const readinessPercent = Math.round((passedCount / Math.max(totalCount, 1)) * 100);

  return {
    key: 'supabase-database',
    provider: 'supabase',
    providerLabel: 'Supabase',
    area: 'database',
    areaLabel: 'Database',
    promptSubject: 'Supabase database',
    items,
    passedCount,
    totalCount,
    readinessPercent
  };
}

export function buildSupabaseDatabaseWiringPrompt(wiring: SupabaseDatabaseWiringSummary): string {
  const passed = wiring.items.filter((entry) => entry.status === 'passed');
  const missing = wiring.items.filter((entry) => entry.status === 'missing');
  const passedLines = passed.length > 0
    ? passed.map((entry) => `- ${entry.label}${formatEvidence(entry.evidence)}`).join('\n')
    : '- No Supabase wiring checks passed yet.';
  const missingLines = missing.length > 0
    ? missing.map((entry) => `- ${entry.label}: ${entry.promptHint}`).join('\n')
    : '- No missing Supabase database wiring checks were found by VibeRaven.';

  return [
    'Wire Supabase database for this app safely.',
    '',
    `Current Supabase database wiring readiness: ${wiring.passedCount}/${wiring.totalCount} checks passed (${wiring.readinessPercent}%).`,
    '',
    'Repo evidence already found:',
    passedLines,
    '',
    'Missing Supabase database wiring checks:',
    missingLines,
    '',
    'First inspect the existing package.json files, env examples, Supabase client helpers, database access files, and supabase/ or migrations/ directories. Identify the current framework and data access pattern before editing.',
    '',
    'Implement:',
    '1. Close only the missing Supabase database wiring checks listed above.',
    '2. Follow the existing file structure and naming patterns.',
    '3. Keep database setup reproducible through checked-in schema, migrations, or documented generation commands.',
    '4. Keep service-role keys out of frontend and client-executed files.',
    '',
    'Constraints:',
    '- Do not rewrite unrelated auth, payments, UI, billing, or deployment code.',
    '- Do not claim Supabase dashboard setup is complete from repo evidence alone.',
    '- Do not expose SUPABASE_SERVICE_ROLE_KEY to browser code, Vite public env, or NEXT_PUBLIC env variables.',
    '',
    'Verification:',
    '- Run the relevant TypeScript/build/test command for this repo.',
    '- Confirm VibeRaven can rescan and move the missing Supabase wiring checks to passed where repo evidence exists.',
    '- Summarize what changed and what still requires manual Supabase dashboard verification.'
  ].join('\n');
}

export function buildSupabaseDatabaseWiringContext(wiring: SupabaseDatabaseWiringSummary): string {
  const lines = [
    '## SUPABASE DATABASE WIRING',
    `${wiring.passedCount}/${wiring.totalCount} checks passed (${wiring.readinessPercent}%).`
  ];

  for (const entry of wiring.items) {
    const evidence = entry.evidence.length > 0 ? ` (${entry.evidence.slice(0, 3).join('; ')})` : '';
    lines.push(`${entry.status}: ${entry.label}${evidence}`);
  }

  return lines.join('\n');
}

function visibleFiles(scan: ScanResult): ScannableFile[] {
  return scan.files
    .filter((file) => !file.isSecret && typeof file.content === 'string')
    .map((file) => ({
      path: file.path.replace(/\\/g, '/'),
      normalizedPath: file.path.replace(/\\/g, '/').toLowerCase(),
      content: file.content as string,
      lowerContent: (file.content as string).toLowerCase()
    }));
}

function item(
  id: string,
  label: string,
  passed: boolean,
  evidence: string[],
  promptHint: string
): StackWiringItem {
  return {
    id,
    label,
    status: passed ? 'passed' : 'missing',
    evidence,
    promptHint
  };
}

function packageEvidence(deps: string[]): string[] {
  return deps.filter((dep) => dep === '@supabase/supabase-js' || dep === '@supabase/ssr' || dep.startsWith('@supabase/'))
    .map((dep) => `package: ${dep}`);
}

function hasSupabaseUrl(contentBlob: string): boolean {
  return /\b(vite_|next_public_)?supabase_url\b/i.test(contentBlob);
}

function hasSupabaseAnonKey(contentBlob: string): boolean {
  return /\b(vite_|next_public_)?supabase_anon_key\b/i.test(contentBlob);
}

function envEvidence(contentBlob: string): string[] {
  const evidence: string[] = [];
  if (hasSupabaseUrl(contentBlob)) {
    evidence.push('env: SUPABASE_URL');
  }
  if (hasSupabaseAnonKey(contentBlob)) {
    evidence.push('env: SUPABASE_ANON_KEY');
  }
  return evidence;
}

function hasSupabaseClient(files: ScannableFile[], pathBlob: string): boolean {
  return /(^|\n|\/)(lib|utils|src\/lib|src\/utils)\/supabase\.[jt]s\b/i.test(pathBlob) ||
    files.some((file) => /createclient\s*\(/i.test(file.content) && /@supabase\/(supabase-js|ssr)/i.test(file.content));
}

function clientEvidence(files: ScannableFile[], pathBlob: string): string[] {
  const evidence: string[] = [];
  const pathMatch = pathBlob.split(/\r?\n/).find((path) => /(^|\/)(lib|utils|src\/lib|src\/utils)\/supabase\.[jt]s\b/i.test(path));
  if (pathMatch) {
    evidence.push(`file: ${pathMatch}`);
  }
  const importFile = files.find((file) => /createclient\s*\(/i.test(file.content) && /@supabase\/(supabase-js|ssr)/i.test(file.content));
  if (importFile && !evidence.includes(`file: ${importFile.path}`)) {
    evidence.push(`file: ${importFile.path}`);
  }
  return evidence;
}

function queryEvidence(files: ScannableFile[]): string[] {
  return files
    .filter((file) => /\.from\s*\(\s*['"][a-z0-9_]+['"]\s*\)/i.test(file.content))
    .slice(0, 4)
    .map((file) => `query: ${file.path}`);
}

function hasSchemaOrMigration(files: ScannableFile[], pathBlob: string): boolean {
  return /(^|\n|\/)supabase\/migrations\/[^/\n]+\.sql\b/i.test(pathBlob) ||
    /(^|\n|\/)(migrations?|schema)\/[^/\n]+\.(sql|ts|js)\b/i.test(pathBlob) ||
    files.some((file) => /create\s+table|alter\s+table/i.test(file.content));
}

function schemaEvidence(files: ScannableFile[], pathBlob: string): string[] {
  const path = pathBlob.split(/\r?\n/).find((entry) =>
    /(^|\/)supabase\/migrations\/[^/]+\.sql\b/i.test(entry) ||
    /(^|\/)(migrations?|schema)\/[^/]+\.(sql|ts|js)\b/i.test(entry)
  );
  if (path) {
    return [`schema: ${path}`];
  }
  const file = files.find((entry) => /create\s+table|alter\s+table/i.test(entry.content));
  return file ? [`schema: ${file.path}`] : [];
}

function hasRlsEvidence(files: ScannableFile[], pathBlob: string): boolean {
  return /\/policies\/|_rls\.sql|\brls\b/i.test(pathBlob) ||
    files.some((file) => /enable\s+row\s+level\s+security|create\s+policy|alter\s+table[\s\S]{0,200}enable\s+row\s+level/i.test(file.content));
}

function rlsEvidence(files: ScannableFile[], pathBlob: string): string[] {
  const path = pathBlob.split(/\r?\n/).find((entry) => /\/policies\/|_rls\.sql|\brls\b/i.test(entry));
  if (path) {
    return [`rls: ${path}`];
  }
  const file = files.find((entry) => /enable\s+row\s+level\s+security|create\s+policy|alter\s+table[\s\S]{0,200}enable\s+row\s+level/i.test(entry.content));
  return file ? [`rls: ${file.path}`] : [];
}

function hasGeneratedTypes(files: ScannableFile[], pathBlob: string): boolean {
  return /database\.types\.[jt]s\b|supabase.*types\.[jt]s\b|types\/database\.[jt]s\b/i.test(pathBlob) ||
    files.some((file) => /export\s+type\s+database\b|export\s+interface\s+database\b/i.test(file.content));
}

function generatedTypeEvidence(files: ScannableFile[], pathBlob: string): string[] {
  const path = pathBlob.split(/\r?\n/).find((entry) =>
    /database\.types\.[jt]s\b|supabase.*types\.[jt]s\b|types\/database\.[jt]s\b/i.test(entry)
  );
  if (path) {
    return [`types: ${path}`];
  }
  const file = files.find((entry) => /export\s+type\s+database\b|export\s+interface\s+database\b/i.test(entry.content));
  return file ? [`types: ${file.path}`] : [];
}

function serviceRoleSafetyItem(files: ScannableFile[]): StackWiringItem {
  const exposed = files.filter((file) =>
    isClientExecutedPath(file.normalizedPath) &&
    /\bsupabase_service_role_key\b|next_public_supabase_service_role|vite_supabase_service_role/i.test(file.content)
  );
  return {
    id: 'service-role-not-exposed',
    label: 'Service role key not exposed to frontend',
    status: exposed.length > 0 ? 'missing' : 'passed',
    evidence: exposed.slice(0, 4).map((file) => `unsafe reference: ${file.path}`),
    promptHint: 'Move service-role usage to server-only code and use public anon keys in frontend clients.'
  };
}

function isClientExecutedPath(path: string): boolean {
  return /\.(tsx|jsx)$/.test(path) ||
    /(^|\/)(components|pages|app|client|frontend|web)\//.test(path) ||
    /\.client\.[jt]sx?$/.test(path);
}

function formatEvidence(evidence: string[]): string {
  return evidence.length > 0 ? ` (${evidence.slice(0, 3).join('; ')})` : '';
}

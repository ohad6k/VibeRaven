import type { ScanResult, StationScanContext } from './types';

export function computeStationScanContext(scan: ScanResult): StationScanContext {
  const s = scan.stackSignals;
  const hasDb = Boolean(s.hasSupabase || s.hasPrisma || s.hasDrizzle || s.hasMongoose);
  const pathBlob = `${scan.fileTree}\n${scan.files.map((f) => f.path).join('\n')}`;
  const apiHeavy = /[/\\]api[/\\]|[/\\]routes[/\\]|\btrpc\b|\bserver\.(ts|js|mjs)\b/i.test(pathBlob);

  const sqlish = scan.files
    .filter((f) => /\.sql$/i.test(f.path) && typeof f.content === 'string')
    .map((f) => f.content as string)
    .join('\n')
    .slice(0, 80000);
  const rlsInSql = /create\s+policy|enable\s+row\s+level\s+security|alter\s+table.*enable\s+row\s+level/i.test(
    sqlish
  );
  const rlsPaths = /supabase\/migrations[/\\].*\.sql|\/policies\/|_rls\.sql|\brls\b/i.test(pathBlob);
  const rlsHint = rlsPaths || rlsInSql;

  return {
    suggestDatabaseLayer: !hasDb && apiHeavy,
    suggestSupabaseRlsReview: Boolean(s.hasSupabase && !rlsHint),
    suggestLandingPage: Boolean(!s.hasLanding && (s.hasNextJs || s.hasVite)),
  };
}

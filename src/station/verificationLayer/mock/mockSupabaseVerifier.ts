import { buildVerificationCheck } from '../shared/buildCheck';
import { resolveProviderConnectionState } from '../shared/connection';
import {
  buildRepoScanContext,
  collectSupabaseReferencedTables,
  hasRlsMigrationEvidence
} from '../shared/repoSignals';
import { providerCheckId } from '../types';
import type {
  ProviderConfigDetection,
  ProviderConnectionState,
  ProviderVerifier,
  RepoProviderDiff,
  VerificationCheck,
  VerifierContext
} from '../types';

export const mockSupabaseVerifier: ProviderVerifier = {
  provider: 'supabase',

  detectConfig(ctx: VerifierContext): ProviderConfigDetection {
    const repo = buildRepoScanContext(ctx.scan);
    const signals: string[] = [];
    if (ctx.scan.stackSignals.hasSupabase) {
      signals.push('stack: hasSupabase');
    }
    if (repo.deps.some((dep) => dep.startsWith('@supabase/'))) {
      signals.push(`package: ${repo.deps.find((dep) => dep.startsWith('@supabase/'))}`);
    }
    if (/\/supabase\/migrations\//i.test(repo.pathBlob)) {
      signals.push('path: supabase/migrations');
    }
    const detected = signals.length > 0;
    return { provider: 'supabase', detected, signals };
  },

  connectStatus(ctx: VerifierContext): ProviderConnectionState {
    return resolveProviderConnectionState('supabase', ctx.mcpVerifierState);
  },

  runChecks(ctx: VerifierContext): VerificationCheck[] {
    const connectionState = this.connectStatus(ctx);
    const repo = buildRepoScanContext(ctx.scan);
    const tables = collectSupabaseReferencedTables(repo);
    const rlsInRepo = hasRlsMigrationEvidence(repo);

    return [
      buildVerificationCheck({
        provider: 'supabase',
        checkKey: 'live-rls-enabled',
        area: 'database',
        title: 'Live Supabase RLS enabled',
        description: rlsInRepo
          ? 'Repo contains RLS migration/policy evidence; live project RLS must be confirmed via Supabase MCP or dashboard.'
          : 'No RLS migration evidence in repo; live project likely needs RLS before launch.',
        evidenceSource: 'provider',
        connectionState,
        repoExpectationMet: rlsInRepo,
        providerObservationMet: false,
        fixType: rlsInRepo ? 'mcp-connect' : 'provider-config',
        severity: 'critical',
        repoSignals: rlsInRepo ? ['migration/policy references RLS'] : ['no RLS migration detected'],
        providerSignals: ['Supabase project policy API or MCP'],
        requiredEvidence: ['RLS enabled on user-owned tables in live project'],
        manualAction: 'Enable RLS and policies in Supabase Dashboard → Authentication → Policies.'
      }),
      buildVerificationCheck({
        provider: 'supabase',
        checkKey: 'live-policies',
        area: 'database',
        title: 'Live Supabase policies',
        description: 'Row policies on referenced tables require live Supabase verification.',
        evidenceSource: 'provider',
        connectionState,
        repoExpectationMet: tables.length > 0,
        providerObservationMet: false,
        fixType: 'mcp-connect',
        severity: tables.length > 0 ? 'critical' : 'info',
        repoSignals: tables.map((table) => `table referenced: ${table}`),
        providerSignals: ['Supabase policy list API or MCP'],
        requiredEvidence: ['Policies exist for tables used in application code']
      }),
      buildVerificationCheck({
        provider: 'supabase',
        checkKey: 'referenced-tables-protected',
        area: 'database',
        title: 'Referenced tables protected in live project',
        description:
          tables.length > 0
            ? `Application code references ${tables.length} Supabase table(s); confirm live RLS/policies cover them.`
            : 'No Supabase table references detected in scanned code.',
        evidenceSource: 'provider',
        connectionState,
        repoExpectationMet: tables.length > 0 && rlsInRepo,
        providerObservationMet: false,
        fixType: 'provider-config',
        severity: 'warning',
        repoSignals: tables.map((table) => `.from("${table}")`),
        providerSignals: ['Live table policy map'],
        requiredEvidence: ['Each referenced public table has RLS + policy in production']
      })
    ];
  },

  buildDiffs(ctx: VerifierContext): RepoProviderDiff[] {
    const repo = buildRepoScanContext(ctx.scan);
    const tables = collectSupabaseReferencedTables(repo);
    const rlsInRepo = hasRlsMigrationEvidence(repo);
    const diffs: RepoProviderDiff[] = [];

    if (!rlsInRepo && tables.length > 0) {
      diffs.push({
        id: providerCheckId('supabase', 'rls-migration-gap'),
        provider: 'supabase',
        area: 'database',
        title: 'RLS migration missing for referenced tables',
        description:
          'Code queries Supabase tables but no RLS migration/policy evidence was found in the repo.',
        repoExpectation: `Tables referenced: ${tables.join(', ')}`,
        providerActual: 'Live RLS state unknown without Supabase MCP',
        severity: 'critical',
        suggestedFix: 'repo-fix',
        evidenceRefs: tables.map((table) => `table: ${table}`)
      });
    }

    if (rlsInRepo) {
      diffs.push({
        id: providerCheckId('supabase', 'live-rls-unverified'),
        provider: 'supabase',
        area: 'database',
        title: 'Live RLS not verified',
        description:
          'Repo includes RLS migration/policy files, but live Supabase project RLS has not been confirmed.',
        repoExpectation: 'RLS policies defined in repo migrations',
        providerActual: 'Not verified (mock — connect Supabase MCP read-only)',
        severity: 'critical',
        suggestedFix: 'mcp-connect',
        evidenceRefs: repo.files
          .filter((file) => /enable\s+row\s+level\s+security|create\s+policy/i.test(file.content))
          .slice(0, 3)
          .map((file) => `file: ${file.path}`)
      });
    }

    return diffs;
  }
};

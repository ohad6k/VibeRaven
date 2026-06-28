import { buildVerificationCheck } from '../shared/buildCheck';
import { resolveProviderConnectionState } from '../shared/connection';
import {
  buildRepoScanContext,
  collectEnvExampleNames,
  collectReferencedEnvNames
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

/** Mock production env store — replaced by MCP Vercel project env fetch in phase 2. */
const MOCK_VERCEL_PRODUCTION_ENV = new Set<string>();

function deploymentEnvCandidates(ctx: VerifierContext): string[] {
  const referenced = collectReferencedEnvNames(ctx.scan, ctx.repositoryEvidence);
  const fromExample = collectEnvExampleNames(ctx.scan);
  const names = new Set([...referenced, ...fromExample]);
  return [...names].filter((name) => {
    if (/^VERCEL_/i.test(name)) {
      return true;
    }
    if (/^(DATABASE_URL|NEXT_PUBLIC_|VITE_|SUPABASE_|STRIPE_|CLERK_|SENTRY_|POSTHOG_|PADDLE_|AUTH_|NEXTAUTH_)/i.test(name)) {
      return true;
    }
    return referenced.includes(name) && fromExample.includes(name);
  });
}

export const mockVercelVerifier: ProviderVerifier = {
  provider: 'vercel',

  detectConfig(ctx: VerifierContext): ProviderConfigDetection {
    const repo = buildRepoScanContext(ctx.scan);
    const signals: string[] = [];
    if (ctx.scan.stackSignals.hasVercel) {
      signals.push('stack: hasVercel');
    }
    if (/vercel\.json/i.test(repo.pathBlob)) {
      signals.push('path: vercel.json');
    }
    if (ctx.scan.stackSignals.hasNextJs || ctx.scan.stackSignals.hasVite) {
      signals.push('framework: Vercel-compatible');
    }
    const detected = signals.length > 0;
    return { provider: 'vercel', detected, signals };
  },

  connectStatus(ctx: VerifierContext): ProviderConnectionState {
    return resolveProviderConnectionState('vercel', ctx.mcpVerifierState);
  },

  runChecks(ctx: VerifierContext): VerificationCheck[] {
    const connectionState = this.connectStatus(ctx);
    const candidates = deploymentEnvCandidates(ctx);
    const missingOnVercel = candidates.filter((name) => !MOCK_VERCEL_PRODUCTION_ENV.has(name));
    const repo = buildRepoScanContext(ctx.scan);

    const checks: VerificationCheck[] = [
      buildVerificationCheck({
        provider: 'vercel',
        checkKey: 'production-env-sync',
        area: 'deployment',
        title: 'Vercel production environment variables',
        description:
          missingOnVercel.length > 0
            ? `${missingOnVercel.length} repo-referenced env var(s) are not confirmed in Vercel production.`
            : 'Repo env names align with the mock Vercel production snapshot.',
        evidenceSource: 'provider',
        connectionState,
        repoExpectationMet: candidates.length > 0,
        providerObservationMet: missingOnVercel.length === 0,
        fixType: 'provider-config',
        severity: missingOnVercel.length > 0 ? 'critical' : 'info',
        repoSignals: missingOnVercel.map((name) => `env expected: ${name}`),
        providerSignals:
          connectionState === 'connected'
            ? ['Vercel production env API']
            : ['Awaiting Vercel MCP read-only env lookup'],
        requiredEvidence: ['Vercel production env var names and values (redacted)'],
        manualAction: 'Add missing keys in Vercel Project Settings → Environment Variables (Production).'
      }),
      buildVerificationCheck({
        provider: 'vercel',
        checkKey: 'latest-deployment',
        area: 'deployment',
        title: 'Latest Vercel deployment status',
        description: 'Production deployment health requires live Vercel project access.',
        evidenceSource: 'provider',
        connectionState,
        repoExpectationMet: Boolean(ctx.scan.stackSignals.hasVercel || /vercel\.json/i.test(repo.pathBlob)),
        providerObservationMet: false,
        fixType: 'mcp-connect',
        severity: 'warning',
        repoSignals: repo.pathBlob.split(/\r?\n/).filter((p) => /vercel\.json/i.test(p)).slice(0, 3),
        providerSignals: ['Vercel deployments API or MCP'],
        requiredEvidence: ['Latest production deployment state']
      }),
      buildVerificationCheck({
        provider: 'vercel',
        checkKey: 'production-domain',
        area: 'deployment',
        title: 'Vercel production domain',
        description: 'Custom domain and DNS status require live Vercel project access.',
        evidenceSource: 'provider',
        connectionState,
        repoExpectationMet: Boolean(ctx.scan.stackSignals.hasVercel || ctx.scan.stackSignals.hasNextJs),
        providerObservationMet: false,
        fixType: 'mcp-connect',
        severity: 'warning',
        repoSignals: [],
        providerSignals: ['Vercel domains API or MCP'],
        requiredEvidence: ['Production domain assignment and DNS verification']
      })
    ];

    return checks;
  },

  buildDiffs(ctx: VerifierContext): RepoProviderDiff[] {
    const candidates = deploymentEnvCandidates(ctx);
    return candidates
      .filter((name) => !MOCK_VERCEL_PRODUCTION_ENV.has(name))
      .map((name) => ({
        id: providerCheckId('vercel', `env-missing-${name.toLowerCase()}`),
        provider: 'vercel',
        area: 'deployment',
        title: `${name} missing in Vercel production`,
        description: `The repo references ${name}, but the mock Vercel production env snapshot does not include it.`,
        repoExpectation: `Referenced in repo (.env.example, code, or env evidence)`,
        providerActual: 'Not present in Vercel production (mock empty snapshot)',
        severity: /SECRET|KEY|TOKEN|PASSWORD/i.test(name) ? 'critical' : 'warning',
        suggestedFix: 'provider-config',
        evidenceRefs: collectReferencedEnvNames(ctx.scan, ctx.repositoryEvidence)
          .filter((entry) => entry === name)
          .map((entry) => `env: ${entry}`)
      }));
  }
};

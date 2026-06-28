import { ensureDefaultVerifiersRegistered } from './registerDefaults';
import { getRegisteredVerifiers } from './registry';
import {
  aggregateReadinessPercents,
  computeLayerReadinessPercent,
  coerceProviderVerificationStatus,
  type ProviderVerifier,
  type ProviderVerifierResult,
  type VerificationCheck,
  type VerificationLayerSnapshot,
  type VerifierContext
} from './types';

function runVerifier(verifier: ProviderVerifier, ctx: VerifierContext): ProviderVerifierResult | null {
  const config = verifier.detectConfig(ctx);
  if (!config.detected) {
    return null;
  }

  const connectionState = verifier.connectStatus(ctx);
  const rawChecks = verifier.runChecks(ctx);
  const checks = rawChecks.map((check) => ({
    ...check,
    status: coerceProviderVerificationStatus(check.status, connectionState)
  }));
  const diffs = verifier.buildDiffs(ctx);

  return {
    provider: verifier.provider,
    connectionState,
    config,
    checks,
    diffs,
    repoReadinessPercent: computeLayerReadinessPercent(checks, 'repo'),
    providerReadinessPercent: computeLayerReadinessPercent(checks, 'provider')
  };
}

export function runVerificationLayer(
  ctx: VerifierContext,
  options?: { registerDefaults?: boolean }
): VerificationLayerSnapshot {
  if (options?.registerDefaults !== false) {
    ensureDefaultVerifiersRegistered();
  }
  const providers = getRegisteredVerifiers()
    .map((verifier) => runVerifier(verifier, ctx))
    .filter((result): result is ProviderVerifierResult => result !== null);

  const checks = providers.flatMap((result) => result.checks);
  const diffs = providers.flatMap((result) => result.diffs);
  const { repoReadinessPercent, providerReadinessPercent } = aggregateReadinessPercents(providers);

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    runtimeMode: 'mock',
    providers,
    checks,
    diffs,
    repoReadinessPercent,
    providerReadinessPercent
  };
}

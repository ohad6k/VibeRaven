import type { McpVerifierStateSnapshot } from '../../types';
import type { ProviderConnectionState, VerificationProviderId, VerificationResultStatus } from '../types';

const MCP_PROVIDER_MAP: Partial<Record<VerificationProviderId, string>> = {
  vercel: 'vercel',
  supabase: 'supabase',
  stripe: 'stripe',
  github: 'github'
};

export function resolveProviderConnectionState(
  provider: VerificationProviderId,
  mcpVerifierState: McpVerifierStateSnapshot | undefined
): ProviderConnectionState {
  const registryProvider = MCP_PROVIDER_MAP[provider];
  if (!registryProvider || !mcpVerifierState) {
    return 'unknown_runtime';
  }

  const record = mcpVerifierState.records.find((entry) => entry.provider === registryProvider);
  if (!record) {
    return 'unknown_runtime';
  }

  switch (record.status) {
    case 'configured':
      return 'configured';
    case 'missing':
      return 'not_configured';
    case 'unsupported':
      return 'unsupported';
    case 'stale':
      return 'configured';
    default:
      return 'unknown_runtime';
  }
}

export function providerResultStatus(input: {
  connectionState: ProviderConnectionState;
  repoExpectationMet: boolean;
  providerObservationMet: boolean;
}): VerificationResultStatus {
  if (input.connectionState === 'connected') {
    return input.providerObservationMet ? 'verified' : 'missing';
  }

  if (!input.repoExpectationMet) {
    return 'missing';
  }

  if (input.connectionState === 'not_configured' || input.connectionState === 'configured') {
    return 'needs_mcp';
  }

  if (input.connectionState === 'unsupported') {
    return 'manual';
  }

  return 'unknown';
}

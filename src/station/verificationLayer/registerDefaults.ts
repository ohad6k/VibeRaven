import { mockGitHubVerifier } from './mock/mockGitHubVerifier';
import { mockStripeVerifier } from './mock/mockStripeVerifier';
import { mockSupabaseVerifier } from './mock/mockSupabaseVerifier';
import { mockVercelVerifier } from './mock/mockVercelVerifier';
import { getRegisteredVerifiers, registerProviderVerifier } from './registry';

let defaultsRegistered = false;

export function ensureDefaultVerifiersRegistered(): void {
  if (defaultsRegistered) {
    return;
  }
  registerProviderVerifier(mockVercelVerifier);
  registerProviderVerifier(mockSupabaseVerifier);
  registerProviderVerifier(mockStripeVerifier);
  registerProviderVerifier(mockGitHubVerifier);
  defaultsRegistered = true;
}

/** Test helper — reset registration between tests. */
export function resetDefaultVerifiersRegistration(): void {
  defaultsRegistered = false;
}

export function listDefaultVerifierProviders(): string[] {
  ensureDefaultVerifiersRegistered();
  return getRegisteredVerifiers().map((verifier) => verifier.provider);
}

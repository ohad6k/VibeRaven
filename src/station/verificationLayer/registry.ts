import type { ProviderVerifier } from './types';

const verifiers: ProviderVerifier[] = [];

export function registerProviderVerifier(verifier: ProviderVerifier): void {
  const existing = verifiers.findIndex((entry) => entry.provider === verifier.provider);
  if (existing >= 0) {
    verifiers[existing] = verifier;
    return;
  }
  verifiers.push(verifier);
}

export function getRegisteredVerifiers(): ProviderVerifier[] {
  return [...verifiers];
}

export function clearRegisteredVerifiers(): void {
  verifiers.length = 0;
}

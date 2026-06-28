import { stackMapProviderOptionsForArea } from '../../../../src/station/stackMapProviderOptions';
import type { CliScanArtifact } from '../types';

const STACK_MAP_AREAS = [
  'appFlow',
  'frontend',
  'backend',
  'auth',
  'database',
  'payments',
  'deployment',
  'monitoring',
  'security',
  'testing',
  'landing',
  'errorHandling'
] as const;

/** Ensures report UI has the same provider lists as the VS Code extension (stack map). */
export function hydrateArtifactForReport(artifact: CliScanArtifact): CliScanArtifact {
  const providerOptions = { ...(artifact.providerOptions ?? {}) };
  for (const area of STACK_MAP_AREAS) {
    providerOptions[area] = stackMapProviderOptionsForArea(area);
  }
  return { ...artifact, providerOptions };
}

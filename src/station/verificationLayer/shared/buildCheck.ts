import type {
  EvidenceSource,
  ProviderConnectionState,
  VerificationCheck,
  VerificationFixType,
  VerificationProviderId,
  VerificationResultStatus,
  VerificationSeverity
} from '../types';
import type { StackWiringArea } from '../../types';
import { providerCheckId } from '../types';
import { providerResultStatus } from './connection';

export function buildVerificationCheck(input: {
  provider: VerificationProviderId;
  checkKey: string;
  area: StackWiringArea;
  title: string;
  description: string;
  evidenceSource: EvidenceSource;
  connectionState: ProviderConnectionState;
  repoExpectationMet: boolean;
  providerObservationMet: boolean;
  fixType: VerificationFixType;
  severity: VerificationSeverity;
  repoSignals: string[];
  providerSignals: string[];
  requiredEvidence?: string[];
  evidenceRefs?: string[];
  manualAction?: string;
}): VerificationCheck {
  const status =
    input.evidenceSource === 'repo'
      ? (input.repoExpectationMet ? 'verified' : 'missing')
      : providerResultStatus({
          connectionState: input.connectionState,
          repoExpectationMet: input.repoExpectationMet,
          providerObservationMet: input.providerObservationMet
        });

  return {
    id: providerCheckId(input.provider, input.checkKey),
    provider: input.provider,
    area: input.area,
    title: input.title,
    description: input.description,
    requiredEvidence: input.requiredEvidence ?? [],
    repoSignals: input.repoSignals,
    providerSignals: input.providerSignals,
    evidenceSource: input.evidenceSource,
    status,
    fixType: input.fixType,
    severity: input.severity,
    evidenceRefs: input.evidenceRefs ?? [],
    manualAction: input.manualAction
  };
}

import type { Gap } from '../../../../src/station/types';
import type { CliScanArtifact } from '../types';
import { classifyGapCapability } from '../capabilities';
import { healPlanGapCommand, promptGapCommand, PUBLIC_VERIFY_COMMAND } from './commands';

export type GapEvidenceFile = {
  path: string;
  content: {
    $schema: 'https://viberaven.dev/schemas/gap.schema.json';
    schemaVersion: 'v1';
    id: string;
    severity: Gap['severity'];
    capability: ReturnType<typeof classifyGapCapability>;
    title: string;
    summary: string;
    evidence: Array<{ file?: string; kind: string; redacted: boolean }>;
    commands: {
      prompt: string;
      healPlan: string;
      verify: string;
    };
    providerBoundary: {
      requiresDashboardCheck: boolean;
      reason: string;
    };
  };
};

function summarizeGap(gap: Gap): string {
  return `${gap.title}. See the tasklist and original scan for redacted detail.`;
}

export function generateGapEvidenceFiles(artifact: CliScanArtifact): GapEvidenceFile[] {
  return artifact.gaps.slice(0, 50).map((gap) => ({
    path: `.viberaven/gaps/${gap.id}.json`,
    content: {
      $schema: 'https://viberaven.dev/schemas/gap.schema.json',
      schemaVersion: 'v1',
      id: gap.id,
      severity: gap.severity,
      capability: classifyGapCapability(gap),
      title: gap.title,
      summary: summarizeGap(gap),
      evidence: [{ kind: String(gap.primaryMapCategory), redacted: true }],
      commands: {
        prompt: promptGapCommand(gap.id),
        healPlan: healPlanGapCommand(gap.id),
        verify: PUBLIC_VERIFY_COMMAND,
      },
      providerBoundary: {
        requiresDashboardCheck: true,
        reason: 'Repo evidence cannot prove live provider dashboard state.',
      },
    },
  }));
}

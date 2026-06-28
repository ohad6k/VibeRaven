import { PRODUCTION_MAP_CATEGORY_KEYS_ALL } from '../../../../shared/planLimits';
import { PUBLIC_VERIFY_COMMAND } from '../contracts/commands';
import { resolveNextAction } from '../resolveNextAction';
import type { CliScanArtifact } from '../types';
import type { Gap } from '../../../../src/station/types';

const UPGRADE_URL = 'https://viberaven.dev/pricing';
const LOCKED_LANE_KEYS = [
  'deployment',
  'monitoring',
  'security',
  'testing',
  'landing',
  'errorHandling'
] as const;

const SEVERITY_ORDER: Record<Gap['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2
};

function sortGaps(gaps: Gap[]): Gap[] {
  return [...gaps].sort((a, b) => {
    const sev = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (sev !== 0) {
      return sev;
    }
    return a.title.localeCompare(b.title);
  });
}

export function generateAgentSummary(artifact: CliScanArtifact): string {
  const lines: string[] = [];
  const topGaps = sortGaps(artifact.gaps).slice(0, 8);

  lines.push('# VibeRaven agent summary', '');
  lines.push(`Scanned: \`${artifact.workspacePath}\``);
  lines.push(`At: ${artifact.scannedAt}`);
  lines.push(
    `Production core: **${artifact.productionCorePercent}%** \u00b7 Model score: **${artifact.score}** (${artifact.scoreLabel})`
  );
  lines.push('');

  const next = resolveNextAction(artifact);
  lines.push('## Next action', '');
  lines.push(`**${next.title}** — ${next.detail}`);
  if (next.command) {
    lines.push(`Command: \`${next.command}\``);
  }
  if (next.upgradeUrl) {
    lines.push(`Upgrade: ${next.upgradeUrl}`);
  }
  lines.push('');

  const unlockedCount = artifact.usage?.unlockedMapCategoryKeys.length ?? 6;
  if (unlockedCount < PRODUCTION_MAP_CATEGORY_KEYS_ALL.length) {
    lines.push('## Locked lanes (Pro)', '');
    lines.push(
      'Free plan unlocks 6/12 mission map lanes. Pro unlocks deployment, monitoring, security, testing, onboarding, and error handling.'
    );
    lines.push('');
    for (const key of LOCKED_LANE_KEYS) {
      lines.push(`- ${key}`);
    }
    lines.push('');
    lines.push(`Upgrade: ${UPGRADE_URL}`);
    lines.push('');
  }

  lines.push('## Suggested stack', '');
  lines.push(
    'React + Tailwind + shadcn/ui + Supabase + Vercel (agent-default stack for lowest launch friction)'
  );
  lines.push('');

  lines.push('## Summary');
  lines.push(artifact.summary || '_No summary returned._');
  lines.push('');
  lines.push('## Mission map (repo wiring)');
  lines.push('');
  lines.push('| Area | Provider | Readiness | Notes |');
  lines.push('|------|----------|-----------|-------|');

  for (const area of artifact.missionGraph.areas ?? []) {
    for (const mission of area.providerMissions) {
      const failed = mission.checks.filter(
        (c) => c.status === 'missing' || c.status === 'failed' || c.status === 'needs-connection'
      ).length;
      const notes =
        failed > 0
          ? `${failed} open check${failed === 1 ? '' : 's'}`
          : `${mission.readinessPercent}% repo checks`;
      lines.push(
        `| ${area.label} | ${mission.providerLabel} | ${mission.readinessPercent}% | ${notes} |`
      );
    }
  }

  lines.push('');
  lines.push('## Agent-code actions');
  if (topGaps.length === 0) {
    lines.push('_No model gaps returned. Review mission map checks before changing code._');
  } else {
    topGaps.forEach((gap, index) => {
      lines.push(
        `${index + 1}. **${gap.title}** (\`${gap.id}\`, ${gap.severity}, map: \`${gap.primaryMapCategory}\`)`
      );
      lines.push(`   - ${gap.detail}`);
      lines.push(`   - Command: \`viberaven prompt --gap ${gap.id}\``);
      if (gap.copyPrompt) {
        lines.push(`   - Prompt: ${gap.copyPrompt}`);
      }
    });
  }

  const manualChecks = (artifact.missionGraph.areas ?? []).flatMap((area) =>
    area.providerMissions.flatMap((mission) =>
      mission.checks
        .filter(
          (check) =>
            check.evidenceClass === 'manual-dashboard' ||
            check.evidenceClass === 'mcp-verifier' ||
            check.evidenceSource === 'provider' ||
            check.evidenceSource === 'mcp' ||
            check.status === 'needs-connection' ||
            check.status === 'unknown'
        )
        .map((check) => ({ area: area.label, provider: mission.providerLabel, check }))
    )
  );

  lines.push('');
  lines.push('## Human-provider actions');
  if (manualChecks.length === 0) {
    lines.push('_No manual provider actions were identified in this scan._');
  } else {
    manualChecks.slice(0, 8).forEach((item, index) => {
      lines.push(`${index + 1}. **${item.check.label}** (${item.area} / ${item.provider})`);
      lines.push(
        `   - ${item.check.promptHint || 'Ask the user to confirm this in the provider dashboard or through read-only MCP.'}`
      );
    });
  }
  lines.push('');
  lines.push('Do not claim human-provider actions as repo-code fixes.');

  lines.push('');
  lines.push('## Agent workflow');
  lines.push('1. Read `.viberaven/agent-tasklist.md` first for the production gate.');
  lines.push('2. Read `.viberaven/launch-playbook.md` for the full checklist.');
  lines.push('3. Run `viberaven next --json` - one action at a time.');
  lines.push('4. Repo fix: `viberaven prompt --gap <id>` then implement.');
  lines.push('5. Provider: `viberaven guide <provider> --step N` and `viberaven open <provider>`.');
  lines.push(`6. Run \`${PUBLIC_VERIFY_COMMAND}\` to rescan and refresh \`.viberaven/agent-tasklist.md\`.`);
  lines.push('');

  if (artifact.usage) {
    lines.push('## Account usage');
    lines.push(
      `- Plan: ${artifact.usage.plan} \u00b7 Scans used: ${artifact.usage.used}/${artifact.usage.limit} (${artifact.usage.period})`
    );
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

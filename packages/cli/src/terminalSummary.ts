import pc from 'picocolors';
import type { CliScanArtifact } from './types';
import { openChecksForMission, preferredMissionForArea } from './report/missionSelection';
import { AGENT_ACTION, formatAgentStatus, MANUAL_ACTION_REQUIRED, READY } from './statusLabels';
import { resolveNextAction } from './resolveNextAction';

function boxLine(content: string, width: number): string {
  const inner = content.length > width - 4 ? content.slice(0, width - 7) + '…' : content;
  const padding = ' '.repeat(Math.max(0, width - inner.length - 4));
  return `${pc.dim('│')} ${inner}${padding} ${pc.dim('│')}`;
}

function readinessColor(percent: number): (text: string) => string {
  if (percent >= 70) {
    return pc.green;
  }
  if (percent >= 40) {
    return pc.yellow;
  }
  return pc.red;
}

function gapTagColor(modelGaps: number, open: number): (text: string) => string {
  if (modelGaps > 0) {
    return pc.red;
  }
  if (open > 0) {
    return pc.yellow;
  }
  return pc.dim;
}

function manualActionCheckCount(artifact: CliScanArtifact): number {
  return (artifact.missionGraph.areas ?? []).reduce((areaTotal, area) => {
    return areaTotal + area.providerMissions.reduce((missionTotal, mission) => {
      return missionTotal + mission.checks.filter(
        (check) =>
          check.evidenceClass === 'manual-dashboard' ||
          check.evidenceClass === 'mcp-verifier' ||
          check.evidenceSource === 'provider' ||
          check.evidenceSource === 'mcp' ||
          check.status === 'needs-connection' ||
          check.status === 'unknown'
      ).length;
    }, 0);
  }, 0);
}

export function printScanSummary(
  artifact: CliScanArtifact,
  paths: { reportPath: string; jsonPath: string; summaryPath: string; playbookPath: string }
): void {
  const pct = artifact.productionCorePercent;
  const gapCount = artifact.gaps.length;
  const pctColor = readinessColor(pct);

  const headline = `${pc.bold('VibeRaven')} · ${pctColor(`Production core ${pct}%`)} · ${gapCount} gap(s)`;
  const subline = `Score ${artifact.score} · ${artifact.scoreLabel}`;
  const width = Math.max(headline.length, subline.length, 44) + 4;

  console.log('');
  console.log(pc.dim('┌') + pc.dim('─'.repeat(width - 2)) + pc.dim('┐'));
  console.log(boxLine(headline, width));
  console.log(boxLine(subline, width));
  console.log(pc.dim('└') + pc.dim('─'.repeat(width - 2)) + pc.dim('┘'));
  console.log('');

  for (const area of artifact.missionGraph.areas ?? []) {
    const mission = preferredMissionForArea(area, artifact.selectedProviders?.[area.key] ?? '');
    if (!mission) {
      continue;
    }
    const open = openChecksForMission(mission);
    const modelGaps = artifact.gaps.filter((g) => g.primaryMapCategory === area.key).length;
    const tag =
      modelGaps > 0 ? `  GAP ${modelGaps}` : open > 0 ? `  ${open} fix` : '';
    const tagColored = tag ? gapTagColor(modelGaps, open)(tag) : '';
    const label = area.label.padEnd(18);
    const provider = mission.providerLabel.padEnd(14);
    const readiness = readinessColor(mission.readinessPercent)(`${mission.readinessPercent}%`);
    console.log(`  ${pc.dim(label)} ${provider} ${readiness}${tagColored}`);
  }

  console.log('');
  console.log(pc.bold('Artifacts:'));
  console.log(pc.dim(`  ${paths.reportPath}`));
  console.log(pc.dim(`  ${paths.jsonPath}`));
  console.log(pc.dim(`  ${paths.summaryPath}`));
  console.log(pc.dim(`  ${paths.playbookPath}`));
  console.log('');

  const next = resolveNextAction(artifact);
  console.log(`Open report: ${paths.reportPath}`);
  console.log(`Next action: ${next.title}`);
  console.log(next.detail);
  if (next.command) {
    console.log(`Run: ${next.command}`);
  }
  if (next.openUrl) {
    console.log(`Open: ${next.openUrl}`);
  }
  if (next.upgradeUrl) {
    console.log(`Upgrade: ${next.upgradeUrl}`);
  }
  console.log(formatAgentStatus(AGENT_ACTION, 'Read .viberaven/agent-tasklist.md, run the next command above, then rescan.'));
  console.log('');

  if (artifact.usage) {
    const lanes = artifact.usage.unlockedMapCategoryKeys.length;
    console.log(
      pc.dim(
        `Scans: ${artifact.usage.used}/${artifact.usage.limit} used · ${lanes}/12 lanes · \`viberaven next\` for one action`
      )
    );
    if (lanes < 12) {
      console.log(pc.dim('Upgrade for deploy/monitoring/testing lanes: https://viberaven.dev/pricing'));
    }
    console.log('');
  }
  console.log(pc.dim('Press Enter in `viberaven` menu to rescan · `viberaven next` for top action'));
  console.log(pc.dim('Agents: read .viberaven/agent-summary.md and launch-playbook.md'));
  console.log(formatAgentStatus(READY, `Scan complete. Read ${paths.summaryPath} before changing code.`));
  const manualCount = manualActionCheckCount(artifact);
  if (manualCount > 0) {
    console.log(formatAgentStatus(MANUAL_ACTION_REQUIRED, `${manualCount} provider dashboard or read-only MCP check${manualCount === 1 ? '' : 's'} require user/provider verification. Do not claim these as repo-code fixes.`));
  }
  console.log('');
}

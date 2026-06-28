import {
  FREE_TRIAL_UNLOCKED_MAP_CATEGORY_KEYS,
  PRODUCTION_MAP_CATEGORY_KEYS_ALL,
  type ProductionMapCategoryKey
} from '../../../../shared/planLimits';
import { mapCheckToPlaybook } from '../playbooks/checkMap';
import { collectManualChecks } from '../playbooks/manualChecks';
import { sortGapsByPriority } from '../tui/menu';
import { PUBLIC_VERIFY_COMMAND } from '../contracts/commands';
import type { CliScanArtifact } from '../types';

const UPGRADE_URL = 'https://viberaven.dev/pricing';

function unlockedSet(artifact: CliScanArtifact): Set<ProductionMapCategoryKey> {
  return new Set(artifact.usage?.unlockedMapCategoryKeys ?? FREE_TRIAL_UNLOCKED_MAP_CATEGORY_KEYS);
}

export function generateLaunchPlaybook(artifact: CliScanArtifact): string {
  const lines: string[] = [];
  const unlocked = unlockedSet(artifact);
  const isPro = unlocked.size >= PRODUCTION_MAP_CATEGORY_KEYS_ALL.length;

  lines.push('# VibeRaven launch playbook', '');
  lines.push(`Generated from scan at ${artifact.scannedAt}. Work top to bottom.`, '');

  lines.push('## Repo fixes (agent code)', '');
  const repoGaps = sortGapsByPriority(artifact.gaps).filter((gap) =>
    unlocked.has(gap.primaryMapCategory)
  );
  if (repoGaps.length === 0) {
    lines.push('_No repo-code gaps in unlocked lanes._', '');
  } else {
    for (const gap of repoGaps) {
      lines.push(`- [ ] ${gap.title} — \`viberaven prompt --gap ${gap.id}\``);
    }
    lines.push('');
  }

  lines.push('## Provider setup (human + agent)', '');
  const manuals = collectManualChecks(artifact).filter((item) => unlocked.has(item.mapCategory));
  if (manuals.length === 0) {
    lines.push('_No provider dashboard steps in unlocked lanes._', '');
  } else {
    for (const item of manuals) {
      const provider = mapCheckToPlaybook(item.check);
      lines.push(
        `- [ ] ${item.check.label} (${item.areaLabel}) — \`viberaven guide ${provider} --step 1\``
      );
    }
    lines.push('');
  }

  if (!isPro) {
    lines.push('## [Pro] Deployment, monitoring, and full map', '');
    const proGaps = sortGapsByPriority(artifact.gaps).filter(
      (gap) => !unlocked.has(gap.primaryMapCategory)
    );
    const proManuals = collectManualChecks(artifact).filter((item) => !unlocked.has(item.mapCategory));
    if (proGaps.length === 0 && proManuals.length === 0) {
      lines.push('_No Pro-only blockers detected._', '');
    } else {
      for (const gap of proGaps.slice(0, 6)) {
        lines.push(`- [ ] ${gap.title} [Pro] — upgrade at ${UPGRADE_URL}`);
      }
      for (const item of proManuals.slice(0, 6)) {
        lines.push(`- [ ] ${item.check.label} [Pro] — upgrade at ${UPGRADE_URL}`);
      }
      lines.push('');
    }
  }

  lines.push('## Agent loop', '');
  lines.push('1. Read `.viberaven/agent-tasklist.md` for the current production gate.');
  lines.push('2. `viberaven next --json`');
  lines.push('3. Fix repo or run `viberaven guide <provider>`');
  lines.push(`4. Run \`${PUBLIC_VERIFY_COMMAND}\` to refresh the gate and \`.viberaven/agent-tasklist.md\`.`);
  lines.push('');

  return `${lines.join('\n')}\n`;
}

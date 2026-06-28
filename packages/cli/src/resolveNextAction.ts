import {
  FREE_TRIAL_UNLOCKED_MAP_CATEGORY_KEYS,
  type ProductionMapCategoryKey
} from '../../../shared/planLimits';
import { mapCheckToPlaybook } from './playbooks/checkMap';
import { loadPlaybookSync } from './playbooks/loadPlaybook';
import { collectManualChecks } from './playbooks/manualChecks';
import type { NextAction } from './nextAction';
import { sortGapsByPriority } from './tui/menu';
import type { CliScanArtifact } from './types';

const UPGRADE_URL = 'https://viberaven.dev/pricing';
const LOCKED_LANE_LABELS: Record<string, string> = {
  deployment: 'Deployment',
  monitoring: 'Monitoring / Analytics',
  security: 'Security',
  testing: 'Testing',
  landing: 'Onboarding',
  errorHandling: 'Error handling / observability'
};

function unlockedKeys(artifact: CliScanArtifact): Set<ProductionMapCategoryKey> {
  const keys = artifact.usage?.unlockedMapCategoryKeys ?? FREE_TRIAL_UNLOCKED_MAP_CATEGORY_KEYS;
  return new Set(keys);
}

export function resolveNextAction(artifact: CliScanArtifact): NextAction {
  const unlocked = unlockedKeys(artifact);

  const repoGap = sortGapsByPriority(artifact.gaps).find((gap) =>
    unlocked.has(gap.primaryMapCategory)
  );
  if (repoGap) {
    return {
      type: 'repo-fix',
      title: repoGap.title,
      detail: repoGap.detail,
      command: `viberaven prompt --gap ${repoGap.id}`
    };
  }

  const manual = collectManualChecks(artifact).find((item) => unlocked.has(item.mapCategory));
  if (manual) {
    const provider = mapCheckToPlaybook(manual.check);
    let openUrl: string | undefined;
    try {
      const playbook = loadPlaybookSync(provider);
      openUrl = playbook.steps[0]?.openUrl;
    } catch {
      openUrl = undefined;
    }
    return {
      type: 'provider-guide',
      title: manual.check.label,
      detail:
        manual.check.promptHint ||
        `Configure ${manual.providerLabel} in the provider dashboard (${manual.areaLabel}).`,
      provider,
      playbookStep: 1,
      command: `viberaven guide ${provider} --step 1`,
      openUrl
    };
  }

  const lockedGap = sortGapsByPriority(artifact.gaps).find(
    (gap) => !unlocked.has(gap.primaryMapCategory)
  );
  if (lockedGap) {
    const lane = lockedGap.primaryMapCategory;
    return {
      type: 'upgrade',
      title: lockedGap.title,
      detail: `Free plan covers 6/12 mission map lanes. Upgrade to fix ${LOCKED_LANE_LABELS[lane] ?? lane}.`,
      lockedLane: lane,
      upgradeUrl: UPGRADE_URL
    };
  }

  const lockedManual = collectManualChecks(artifact).find((item) => !unlocked.has(item.mapCategory));
  if (lockedManual) {
    const lane = lockedManual.mapCategory;
    return {
      type: 'upgrade',
      title: lockedManual.check.label,
      detail: `This check is in the ${LOCKED_LANE_LABELS[lane] ?? lane} lane (Pro).`,
      lockedLane: lane,
      upgradeUrl: UPGRADE_URL
    };
  }

  if (unlocked.size < 12) {
    return {
      type: 'done',
      title: 'No blockers in unlocked lanes',
      detail:
        'Run scan again after changes. Upgrade for deployment, monitoring, security, testing, and onboarding lanes.',
      upgradeUrl: UPGRADE_URL
    };
  }

  return {
    type: 'done',
    title: 'No blockers found',
    detail: 'Re-scan after changes to confirm production readiness.'
  };
}

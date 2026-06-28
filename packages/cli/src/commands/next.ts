import { PRODUCTION_MAP_CATEGORY_KEYS_ALL } from '../../../../shared/planLimits';
import { PUBLIC_COMMAND } from '../contracts/commands';
import type { NextActionJson } from '../nextAction';
import { resolveNextAction } from '../resolveNextAction';
import { loadLastArtifact, ScanNotFoundError } from '../tui/menu';

export interface NextCommandOptions {
  json?: boolean;
  cwd?: string;
}

export async function runNextCommand(options: NextCommandOptions = {}): Promise<number> {
  try {
    const artifact = await loadLastArtifact(options.cwd ?? process.cwd());
    const next = resolveNextAction(artifact);

    if (options.json) {
      const payload: NextActionJson = {
        ...next,
        productionCorePercent: artifact.productionCorePercent,
        score: artifact.score,
        scansUsed: artifact.usage?.used ?? 0,
        scansLimit: artifact.usage?.limit ?? 0,
        unlockedLanes: artifact.usage?.unlockedMapCategoryKeys.length ?? 6,
        totalLanes: PRODUCTION_MAP_CATEGORY_KEYS_ALL.length as 12
      };
      console.log(JSON.stringify(payload, null, 2));
      return 0;
    }

    console.log('');
    console.log(`Next: ${next.title}`);
    console.log(next.detail);
    if (next.command) {
      console.log(`Command: ${next.command}`);
    }
    if (next.upgradeUrl) {
      console.log(`Upgrade: ${next.upgradeUrl}`);
    }
    console.log('');
    return 0;
  } catch (error) {
    if (error instanceof ScanNotFoundError) {
      console.error(error.message);
      console.error(`Run: ${PUBLIC_COMMAND}`);
      return 1;
    }
    throw error;
  }
}

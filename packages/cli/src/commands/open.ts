import { openPathInBrowser, openUrlInBrowser } from '../openBrowser';
import { loadPlaybook } from '../playbooks/loadPlaybook';
import { resolveNextAction } from '../resolveNextAction';
import { loadLastArtifact, ScanNotFoundError } from '../tui/menu';

export interface OpenCommandOptions {
  target?: string;
  cwd?: string;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export async function runOpenCommand(options: OpenCommandOptions = {}): Promise<number> {
  const target = options.target?.trim();

  if (target && isHttpUrl(target)) {
    await openUrlInBrowser(target);
    return 0;
  }

  if (target) {
    try {
      const playbook = await loadPlaybook(target);
      const url = playbook.steps[0]?.openUrl;
      if (!url) {
        console.error(`No openUrl on first step of ${target} playbook.`);
        return 1;
      }
      await openUrlInBrowser(url);
      return 0;
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }

  try {
    const artifact = await loadLastArtifact(options.cwd ?? process.cwd());
    const next = resolveNextAction(artifact);
    if (next.openUrl) {
      await openUrlInBrowser(next.openUrl);
      return 0;
    }
    if (next.provider) {
      const playbook = await loadPlaybook(next.provider);
      const url = playbook.steps[(next.playbookStep ?? 1) - 1]?.openUrl ?? playbook.steps[0]?.openUrl;
      if (url) {
        await openUrlInBrowser(url);
        return 0;
      }
    }
    console.error('No dashboard URL for the current next action. Run: viberaven next --json');
    return 1;
  } catch (error) {
    if (error instanceof ScanNotFoundError) {
      console.error(error.message);
      return 1;
    }
    throw error;
  }
}

export async function openReportPath(reportPath: string): Promise<void> {
  await openPathInBrowser(reportPath);
}

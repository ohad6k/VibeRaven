import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { resolveActionById } from '../actions/registry';
import type { VibeRavenActionsManifest } from '../actions/types';
import { getProjectArtifactsDir } from '../config';

async function currentActionExists(cwd: string, actionId: string): Promise<boolean> {
  try {
    const raw = await readFile(join(getProjectArtifactsDir(cwd), 'actions.json'), 'utf8');
    const manifest = JSON.parse(raw) as VibeRavenActionsManifest;
    return manifest.actions.some((action) => action.id === actionId);
  } catch {
    return false;
  }
}

export async function runVerifyActionCommand(input: { cwd: string; actionId: string }): Promise<number> {
  const entry = await resolveActionById(input.cwd, input.actionId);
  if (!entry) {
    process.stdout.write(
      `Action ${input.actionId} is not in the registry. Run \`npx -y viberaven actions\` for current actions.\n`,
    );
    return 1;
  }

  if (entry.status === 'resolved') {
    process.stdout.write(
      `Action ${entry.id} (${entry.title ?? 'untitled action'}) is already resolved. Run \`npx -y viberaven actions\` for current actions.\n`,
    );
    return 0;
  }

  if (entry.status === 'replaced') {
    process.stdout.write(
      `Action ${entry.id} (${entry.title ?? 'untitled action'}) was replaced${entry.replacedBy ? ` by ${entry.replacedBy}` : ''}. Run \`npx -y viberaven actions\` for current actions.\n`,
    );
    return 1;
  }

  if (entry.status === 'stale' || !(await currentActionExists(input.cwd, input.actionId))) {
    process.stdout.write(
      `Action ${entry.id} (${entry.title ?? 'untitled action'}) is not in the current action surface. Run \`npx -y viberaven actions\` or rescan with \`npx -y viberaven --agent-mode\`.\n`,
    );
    return 1;
  }

  process.stdout.write(
    `Verifying ${entry.id} (${entry.title ?? 'untitled action'}).\nRun \`npx -y viberaven --verify\` to refresh the production gate for this action.\n`,
  );
  return 0;
}

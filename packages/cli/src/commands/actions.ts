import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderActionSurface } from '../actions/render';
import type { VibeRavenActionsManifest } from '../actions/types';
import { getProjectArtifactsDir } from '../config';

export async function runActionsCommand(input: { cwd: string; json?: boolean }): Promise<number> {
  const actionsPath = join(getProjectArtifactsDir(input.cwd), 'actions.json');
  let raw: string;

  try {
    raw = await readFile(actionsPath, 'utf8');
  } catch {
    process.stderr.write('No VibeRaven actions found. Run `npx -y viberaven --agent-mode` first.\n');
    return 1;
  }

  if (input.json) {
    process.stdout.write(raw.endsWith('\n') ? raw : `${raw}\n`);
    return 0;
  }

  const manifest = JSON.parse(raw) as VibeRavenActionsManifest;
  process.stdout.write(renderActionSurface(manifest));
  return 0;
}

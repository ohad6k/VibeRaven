import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getProjectArtifactsDir } from '../config';
import type { TaskItem } from '../contracts/taskItem';
import type { CliScanArtifact } from '../types';
import { deriveCurrentActions } from './derive';
import { assignActionIds, actionRegistryPath } from './registry';
import type { VibeRavenActionsManifest } from './types';

export interface WriteActionArtifactsInput {
  cwd: string;
  artifact: CliScanArtifact;
  tasks: TaskItem[];
  paths: {
    reportPath: string;
    playbookPath: string;
  };
}

export interface WriteActionArtifactsResult {
  actionsPath: string;
  actionRegistryPath: string;
  manifest: VibeRavenActionsManifest;
}

function gateStatus(artifact: CliScanArtifact): 'clear' | 'not_clear' | 'unknown' {
  if (!Array.isArray(artifact.gaps)) {
    return 'unknown';
  }
  return artifact.gaps.length === 0 ? 'clear' : 'not_clear';
}

export async function writeActionArtifacts(input: WriteActionArtifactsInput): Promise<WriteActionArtifactsResult> {
  const derived = deriveCurrentActions({
    artifact: input.artifact,
    tasks: input.tasks,
    paths: input.paths,
  });
  const currentGapIds = new Set(input.artifact.gaps.map((gap) => gap.id));
  const assigned = await assignActionIds({
    cwd: input.cwd,
    actions: derived,
    currentGapIds,
  });
  const manifest: VibeRavenActionsManifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    workspaceRoot: '.',
    gateStatus: gateStatus(input.artifact),
    actions: assigned.actions,
  };
  const actionsPath = join(getProjectArtifactsDir(input.cwd), 'actions.json');
  await writeFile(actionsPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return {
    actionsPath,
    actionRegistryPath: actionRegistryPath(input.cwd),
    manifest,
  };
}

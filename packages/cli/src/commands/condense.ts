import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getProjectArtifactsDir } from '../config';
import { generateContextMap } from '../contracts/contextMap';
import type { CliScanArtifact } from '../types';

export async function runCondenseCommand(options: { cwd: string }): Promise<{ contextMapPath: string }> {
  const dir = getProjectArtifactsDir(options.cwd);
  const artifact = JSON.parse(await readFile(join(dir, 'last-scan.json'), 'utf8')) as CliScanArtifact;
  const contextMapPath = join(dir, 'context-map.json');
  await writeFile(contextMapPath, `${JSON.stringify(generateContextMap(artifact), null, 2)}\n`, 'utf8');
  return { contextMapPath };
}

import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  PUBLIC_AGENT_MODE_COMMAND,
  PUBLIC_STRICT_COMMAND,
  PUBLIC_VERIFY_COMMAND,
} from '../contracts/commands';

export const VIBERAVEN_PACKAGE_JSON_SCRIPTS = {
  'viberaven:gate': PUBLIC_AGENT_MODE_COMMAND,
  'viberaven:verify': PUBLIC_VERIFY_COMMAND,
  'viberaven:strict': PUBLIC_STRICT_COMMAND,
} as const;

export type SeedPackageJsonScriptsAction = 'updated' | 'unchanged' | 'skipped';

export type SeedPackageJsonScriptsResult = {
  action: SeedPackageJsonScriptsAction;
  added: string[];
  skipped: string[];
  changed: boolean;
};

export async function seedPackageJsonScripts(options: {
  cwd: string;
  dryRun?: boolean;
}): Promise<SeedPackageJsonScriptsResult | null> {
  const packageJsonPath = join(options.cwd, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return null;
  }

  const raw = await readFile(packageJsonPath, 'utf-8');
  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {
      action: 'skipped',
      added: [],
      skipped: [],
      changed: false,
    };
  }

  const scripts =
    typeof pkg.scripts === 'object' && pkg.scripts !== null && !Array.isArray(pkg.scripts)
      ? { ...(pkg.scripts as Record<string, string>) }
      : {};

  const added: string[] = [];
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(VIBERAVEN_PACKAGE_JSON_SCRIPTS)) {
    if (key in scripts) {
      skipped.push(key);
      continue;
    }
    scripts[key] = value;
    added.push(key);
  }

  if (added.length === 0) {
    return { action: 'unchanged', added, skipped, changed: false };
  }

  if (!options.dryRun) {
    pkg.scripts = scripts;
    const output = `${JSON.stringify(pkg, null, 2)}\n`;
    await writeFile(packageJsonPath, output, 'utf-8');
  }

  return { action: 'updated', added, skipped, changed: true };
}

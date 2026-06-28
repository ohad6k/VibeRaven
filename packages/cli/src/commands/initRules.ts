import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { injectAgentRulesBlock } from './agentRulesBlock';
import {
  AGENT_RULE_TARGETS,
  CORE_AGENT_INJECTION_TARGETS,
  renderAgentRulesForTarget,
  type AgentRulesTarget
} from './agentTargets';
import { buildCursorRulesPack, initCursorRulesPack } from './cursorRulesPack';
import { seedPackageJsonScripts, type SeedPackageJsonScriptsResult } from './seedPackageJsonScripts';

export { getAgentRulesTargets } from './agentTargets';
export type { AgentRulesTarget } from './agentTargets';

export type AgentRulesInitAction = 'created' | 'updated' | 'unchanged';

export type AgentRulesInitResult = {
  target: AgentRulesTarget;
  file: string;
  path: string;
  action: AgentRulesInitAction;
};

export type InitAgentRulesOutput = {
  results: AgentRulesInitResult[];
  packageJsonScripts: SeedPackageJsonScriptsResult | null;
};

export async function initAgentRules(options: {
  cwd: string;
  targets?: AgentRulesTarget[];
  dryRun?: boolean;
}): Promise<InitAgentRulesOutput> {
  const targets = options.targets ?? [...CORE_AGENT_INJECTION_TARGETS];
  const results: AgentRulesInitResult[] = [];

  for (const target of targets) {
    if (target === 'cursor') {
      results.push(...(await initCursorRulesPack({ cwd: options.cwd, dryRun: options.dryRun })));
      continue;
    }

    const file = AGENT_RULE_TARGETS[target].file;
    const path = join(options.cwd, file);
    const existing = await readExistingFile(path);
    const injected = injectAgentRulesBlock(existing.content, renderAgentRulesForTarget(target));
    const action = !existing.exists ? 'created' : injected.changed ? 'updated' : 'unchanged';

    if (!options.dryRun && injected.changed) {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, injected.content, 'utf-8');
    }

    results.push({ target, file, path, action });
  }

  const packageJsonScripts = await seedPackageJsonScripts({
    cwd: options.cwd,
    dryRun: options.dryRun,
  });

  return { results, packageJsonScripts };
}

export function renderAgentRulesDryRun(targets: AgentRulesTarget[]): string {
  const files = targets
    .flatMap((target) => {
      if (target === 'cursor') {
        return buildCursorRulesPack().map((rule) => `- cursor: .cursor/rules/${rule.filename}`);
      }
      return [`- ${target}: ${AGENT_RULE_TARGETS[target].file}`];
    })
    .join('\n');
  const previews = targets.flatMap((target) => [
    `Preview: ${target} (${AGENT_RULE_TARGETS[target].file})`,
    '',
    renderAgentRulesForTarget(target)
  ]);

  return [`VibeRaven agent rules dry run`, '', `Target files:`, files, '', ...previews].join('\n');
}

export function formatAgentRulesInitSummary(output: InitAgentRulesOutput): string {
  const { results, packageJsonScripts } = output;
  const created = results.filter((result) => result.action === 'created');
  const updated = results.filter((result) => result.action === 'updated');
  const skipped = results.filter((result) => result.action === 'unchanged');

  const lines = ['VibeRaven agent injection summary', ''];

  if (created.length > 0) {
    lines.push('Created:');
    for (const result of created) {
      lines.push(`  + ${result.file}`);
    }
    lines.push('');
  }

  if (updated.length > 0) {
    lines.push('Updated:');
    for (const result of updated) {
      lines.push(`  ~ ${result.file}`);
    }
    lines.push('');
  }

  if (skipped.length > 0) {
    lines.push('Skipped (unchanged):');
    for (const result of skipped) {
      lines.push(`  = ${result.file}`);
    }
    lines.push('');
  }

  if (packageJsonScripts?.changed) {
    lines.push('package.json scripts added:');
    for (const script of packageJsonScripts.added) {
      lines.push(`  + ${script}`);
    }
    lines.push('');
  } else if (packageJsonScripts?.action === 'unchanged') {
    lines.push('package.json scripts: unchanged (already present)');
    lines.push('');
  }

  lines.push(
    `Done: ${created.length} created, ${updated.length} updated, ${skipped.length} skipped.`
  );
  return lines.join('\n');
}

async function readExistingFile(path: string): Promise<{ exists: boolean; content: string }> {
  try {
    return { exists: true, content: await readFile(path, 'utf-8') };
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return { exists: false, content: '' };
    }
    throw error;
  }
}

function isFileNotFoundError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PUBLIC_AGENT_MODE_COMMAND } from '../contracts/commands';
import { AGENT_RULE_TARGETS, CORE_AGENT_INJECTION_TARGETS } from './agentTargets';

export type DoctorCheckStatus = 'pass' | 'fail';

export type DoctorCheck = {
  id: string;
  status: DoctorCheckStatus;
  message: string;
};

export type DoctorAgentsReport = {
  ok: boolean;
  checks: DoctorCheck[];
};

const REQUIRED_EXISTENCE_CHECKS = [
  { id: 'agents-md', file: 'AGENTS.md' },
  { id: 'claude-md', file: 'CLAUDE.md' },
  { id: 'cursor-core-rule', file: '.cursor/rules/viberaven-core.mdc' },
  { id: 'copilot-instructions', file: '.github/copilot-instructions.md' },
] as const;

const OPTIONAL_CURSOR_PACK_CHECKS = [
  { id: 'cursor-supabase-rule', file: '.cursor/rules/viberaven-supabase-rls.mdc' },
  { id: 'cursor-deploy-rule', file: '.cursor/rules/viberaven-deploy.mdc' },
  { id: 'cursor-payments-rule', file: '.cursor/rules/viberaven-payments.mdc' },
] as const;

const STALE_PATTERNS = [
  { id: 'stale-beta-scan', pattern: '@beta scan' },
  { id: 'stale-viberaven-station', pattern: 'viberaven-station' },
  { id: 'stale-viberice', pattern: 'viberice' },
] as const;

export async function checkAgentInjection(cwd: string): Promise<DoctorAgentsReport> {
  const checks: DoctorCheck[] = [];

  for (const item of REQUIRED_EXISTENCE_CHECKS) {
    const exists = await fileExists(join(cwd, item.file));
    checks.push({
      id: item.id,
      status: exists ? 'pass' : 'fail',
      message: exists ? `${item.file} exists` : `Missing ${item.file}`,
    });
  }

  for (const item of OPTIONAL_CURSOR_PACK_CHECKS) {
    const exists = await fileExists(join(cwd, item.file));
    checks.push({
      id: item.id,
      status: exists ? 'pass' : 'fail',
      message: exists
        ? `${item.file} exists`
        : `Missing ${item.file} — run npx -y viberaven init --agents all`,
    });
  }

  const legacyCursorPath = join(cwd, '.cursor/rules/viberaven.mdc');
  if (await fileExists(legacyCursorPath)) {
    const legacyContent = await readFile(legacyCursorPath, 'utf-8');
    const hasCoreSplit = await fileExists(join(cwd, '.cursor/rules/viberaven-core.mdc'));
    if (!hasCoreSplit || legacyContent.includes('alwaysApply: true')) {
      checks.push({
        id: 'cursor-legacy-mdc',
        status: 'fail',
        message:
          'Legacy .cursor/rules/viberaven.mdc detected — run npx -y viberaven init --agents all to migrate to the split Cursor pack',
      });
    }
  }

  for (const target of CORE_AGENT_INJECTION_TARGETS) {
    const file =
      target === 'cursor' ? '.cursor/rules/viberaven-core.mdc' : AGENT_RULE_TARGETS[target].file;
    const path = join(cwd, file);
    const exists = await fileExists(path);

    if (!exists) {
      checks.push({
        id: `canonical-${target}`,
        status: 'fail',
        message: `Cannot verify canonical command — missing ${file}`,
      });
      continue;
    }

    const content = await readFile(path, 'utf-8');
    const hasCommand = content.includes(PUBLIC_AGENT_MODE_COMMAND);
    checks.push({
      id: `canonical-${target}`,
      status: hasCommand ? 'pass' : 'fail',
      message: hasCommand
        ? `Canonical command found in ${file}`
        : `Missing canonical command in ${file}`,
    });

    for (const stale of STALE_PATTERNS) {
      if (content.includes(stale.pattern)) {
        checks.push({
          id: `${stale.id}-${target}`,
          status: 'fail',
          message: `Stale ${stale.pattern} reference in ${file}`,
        });
      }
    }
  }

  return {
    ok: checks.every((check) => check.status === 'pass'),
    checks,
  };
}

export function formatDoctorAgentsReport(report: DoctorAgentsReport): string {
  const lines = ['VibeRaven agent injection doctor', ''];

  for (const check of report.checks) {
    const icon = check.status === 'pass' ? '✓' : '✗';
    lines.push(`${icon} ${check.message}`);
  }

  lines.push('');
  lines.push(report.ok ? 'All agent injection checks passed.' : 'Agent injection checks failed.');
  return lines.join('\n');
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

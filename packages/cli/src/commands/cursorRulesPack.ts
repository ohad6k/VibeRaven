import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  PUBLIC_AGENT_MODE_COMMAND,
  PUBLIC_STRICT_COMMAND,
  PUBLIC_VERIFY_COMMAND,
} from '../contracts/commands';
import type { AgentRulesInitAction, AgentRulesInitResult } from './initRules';

export const CURSOR_RULES_DIR = '.cursor/rules';
export const LEGACY_CURSOR_RULE_FILE = `${CURSOR_RULES_DIR}/viberaven.mdc`;

const DOMAIN_PATH_POINTER =
  'Before editing these files, read `.viberaven/agent-context.md` and `.viberaven/mission-map.md`.';

export type CursorRuleDefinition = {
  filename: string;
  content: string;
};

export function buildCursorRulesPack(): CursorRuleDefinition[] {
  return [
    {
      filename: 'viberaven-core.mdc',
      content: [
        '---',
        'description: VibeRaven production gate — canonical agent commands and gate loop',
        'alwaysApply: true',
        '---',
        '',
        `Run \`${PUBLIC_AGENT_MODE_COMMAND}\` before deploy, auth, RLS, webhooks, or dependency changes.`,
        '',
        'Read `.viberaven/agent-tasklist.md` first, then `.viberaven/gate-result.json` and `.viberaven/mission-map.md`.',
        `Fix one gap, then \`${PUBLIC_VERIFY_COMMAND}\`. Before CI or production promote: \`${PUBLIC_STRICT_COMMAND}\`.`,
        '',
        'Gate is not clear until `gate.status === "clear"`.',
        '',
        DOMAIN_PATH_POINTER,
        '',
        'Full production rules: `AGENTS.md` / `CLAUDE.md` (installed by `npx -y viberaven init --agents all`).',
      ].join('\n'),
    },
    {
      filename: 'viberaven-supabase-rls.mdc',
      content: [
        '---',
        'description: Apply when editing Supabase migrations, RLS policies, or auth SQL',
        'globs:',
        '  - supabase/**',
        'alwaysApply: false',
        '---',
        '',
        DOMAIN_PATH_POINTER,
        '',
        'Do NOT enable RLS on only one table while leaving related tables open; INSTEAD read `.viberaven/mission-map.md` before migration edits.',
      ].join('\n'),
    },
    {
      filename: 'viberaven-deploy.mdc',
      content: [
        '---',
        'description: Apply before changing Vercel config or deploy CI workflows',
        'globs:',
        '  - vercel.json',
        '  - .github/workflows/**',
        'alwaysApply: false',
        '---',
        '',
        DOMAIN_PATH_POINTER,
        '',
        'Do NOT add production env vars only to the Vercel dashboard without updating `.env.example` in the repo.',
      ].join('\n'),
    },
    {
      filename: 'viberaven-payments.mdc',
      content: [
        '---',
        'description: Apply when editing Stripe, Polar, or payment webhook handlers',
        'globs:',
        '  - "**/*webhook*"',
        '  - "**/*stripe*"',
        '  - "**/*polar*"',
        'alwaysApply: false',
        '---',
        '',
        DOMAIN_PATH_POINTER,
        '',
        'Do NOT ship webhook handlers without signature verification; INSTEAD run `npx -y viberaven --agent-mode` after webhook edits.',
      ].join('\n'),
    },
  ];
}

export function renderCursorCoreRulePreview(): string {
  return buildCursorRulesPack()[0]?.content ?? '';
}

export async function initCursorRulesPack(options: {
  cwd: string;
  dryRun?: boolean;
}): Promise<AgentRulesInitResult[]> {
  const results: AgentRulesInitResult[] = [];
  const pack = buildCursorRulesPack();

  for (const rule of pack) {
    const file = `${CURSOR_RULES_DIR}/${rule.filename}`;
    const path = join(options.cwd, file);
    const existing = await readExistingFile(path);
    const changed = !existing.exists || existing.content !== rule.content;
    const action: AgentRulesInitAction = !existing.exists ? 'created' : changed ? 'updated' : 'unchanged';

    if (!options.dryRun && changed) {
      await mkdir(join(options.cwd, CURSOR_RULES_DIR), { recursive: true });
      await writeFile(path, rule.content, 'utf-8');
    }

    results.push({ target: 'cursor', file, path, action });
  }

  const legacyPath = join(options.cwd, LEGACY_CURSOR_RULE_FILE);
  if (!options.dryRun && (await fileExists(legacyPath))) {
    await rm(legacyPath, { force: true });
  }

  return results;
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

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function isFileNotFoundError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

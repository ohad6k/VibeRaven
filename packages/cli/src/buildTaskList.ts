import {
  FREE_TRIAL_UNLOCKED_MAP_CATEGORY_KEYS,
  type ProductionMapCategoryKey,
} from '../../../shared/planLimits';
import { PUBLIC_VERIFY_COMMAND } from './contracts/commands';
import type { ProviderAction, TaskItem } from './contracts/taskItem';
import { mapCheckToPlaybook } from './playbooks/checkMap';
import { loadPlaybookSync } from './playbooks/loadPlaybook';
import { PLAYBOOK_PROVIDERS } from './playbooks/types';
import { sortGapsByPriority } from './tui/menu';
import type { CliScanArtifact } from './types';

// ---------------------------------------------------------------------------
// Recipe registry
// The recipes/ directory currently contains function-based recipes, not a
// HealRecipe typed registry. We maintain a static set of known gapIds that
// have an automated recipe so that buildTaskList can classify them as
// 'repo-code' without importing every recipe module.
// ---------------------------------------------------------------------------

const KNOWN_RECIPE_GAP_IDS: ReadonlySet<string> = new Set([
  // emptyCatch (original recipe)
  'empty-catch',
  'empty_catch',
  'emptyCatch',
  // W3 env-add recipes
  'auth_secret_missing',
  'node_env_not_set',
  'database_url_missing',
  // W3 file-create recipes
  'missing_error_boundary',
  'missing_health_route',
  'missing_loading_state',
  'missing_404_page',
  // W3 file-patch recipes
  'missing_csp_header',
  'missing_rate_limit',
  'eslint_restricted_imports',
  // NOTE: 'rls_disabled' is intentionally NOT here — it is provider-action only,
  // canAutoApply=false, and should be classified as 'provider-action' by buildTaskList.
]);

function hasRecipe(gapId: string): boolean {
  if (KNOWN_RECIPE_GAP_IDS.has(gapId)) return true;
  // Fuzzy: any gap whose id contains known recipe tokens
  const lower = gapId.toLowerCase();
  return lower.includes('empty') && lower.includes('catch');
}

// ---------------------------------------------------------------------------
// Playbook provider lookup — try to map a gap to a known playbook provider
// ---------------------------------------------------------------------------

function gapToPlaybookProvider(gap: { primaryMapCategory: string; id: string }): string | undefined {
  const cat = gap.primaryMapCategory.toLowerCase();

  // Direct category → provider mapping
  if (cat === 'deployment') return 'vercel';
  if (cat === 'payments') return 'stripe';
  if (cat === 'auth') return 'auth-supabase';
  if (cat === 'database') return 'supabase';

  // Heuristic from gap id
  const id = gap.id.toLowerCase();
  if (id.includes('vercel') || id.includes('deploy')) return 'vercel';
  if (id.includes('stripe') || id.includes('payment')) return 'stripe';
  if (id.includes('supabase') || id.includes('database') || id.includes('db')) return 'supabase';
  if (id.includes('auth')) return 'auth-supabase';

  return undefined;
}

function hasPlaybook(gap: { primaryMapCategory: string; id: string }): boolean {
  try {
    const provider = gapToPlaybookProvider(gap);
    if (!provider) return false;
    // Validate the provider is known
    return (PLAYBOOK_PROVIDERS as readonly string[]).includes(provider);
  } catch {
    return false;
  }
}

function buildProviderAction(
  gap: { primaryMapCategory: string; id: string; title: string },
  provider: string
): ProviderAction | undefined {
  try {
    const playbook = loadPlaybookSync(provider);
    const step = playbook.steps[0];
    if (!step) return undefined;

    return {
      provider,
      dashboardUrl: step.openUrl ?? `https://${provider}.com`,
      // PlaybookStep uses `instruction` — map to exactStep
      exactStep: step.instruction,
      // No envKeyName/envKeyExample in current PlaybookStep schema — leave undefined
      envKeyName: undefined,
      envKeyExample: undefined,
      // Use step title as the done signal
      doneSignal: `${step.title} step completed`,
      verifyCommand: PUBLIC_VERIFY_COMMAND,
    };
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Unlocked lane detection (mirrors resolveNextAction.ts — copied to avoid circular)
// ---------------------------------------------------------------------------

function unlockedKeys(artifact: CliScanArtifact): Set<ProductionMapCategoryKey> {
  const keys = artifact.usage?.unlockedMapCategoryKeys ?? FREE_TRIAL_UNLOCKED_MAP_CATEGORY_KEYS;
  return new Set(keys);
}

// ---------------------------------------------------------------------------
// Main exports
// ---------------------------------------------------------------------------

/**
 * Build a prioritised, structured task list from a scan artifact.
 * Each gap becomes exactly one TaskItem with an actionable fix classification.
 */
export function buildTaskList(artifact: CliScanArtifact): TaskItem[] {
  const unlocked = unlockedKeys(artifact);
  const sorted = sortGapsByPriority(artifact.gaps);

  return sorted.map((gap, index) => {
    const id = `TASK-${String(index + 1).padStart(3, '0')}`;
    const isLocked = !unlocked.has(gap.primaryMapCategory as ProductionMapCategoryKey);

    // ----- Determine fixType -----
    let fixType: TaskItem['fixType'];

    if (isLocked) {
      fixType = 'upgrade-required';
    } else if (hasRecipe(gap.id)) {
      fixType = 'repo-code';
    } else if (hasPlaybook(gap)) {
      fixType = 'provider-action';
    } else {
      fixType = 'manual-verify';
    }

    // ----- Build per-fixType fields -----
    const base: TaskItem = {
      id,
      gapId: gap.id,
      severity: gap.severity,
      fixType,
      title: gap.title,
      verifyCommand: PUBLIC_VERIFY_COMMAND,
      requiresUserAction: fixType !== 'repo-code',
    };

    if (fixType === 'repo-code') {
      // Automated recipe available — agent calls viberaven_heal_apply
      base.mcpTool = 'viberaven_heal_apply';
      base.mcpArgs = { gap: gap.id, yes: true };
      base.requiresUserAction = false;
      // Hint from scanner
      if (gap.copyPrompt) {
        base.exactFix = gap.copyPrompt.trim();
      }
    } else if (fixType === 'provider-action') {
      // Look up playbook step for guided provider action
      try {
        const provider = gapToPlaybookProvider(gap);
        if (provider) {
          const pa = buildProviderAction(gap, provider);
          if (pa) {
            base.providerAction = pa;
            base.action = pa.exactStep;
          }
        }
      } catch {
        // Degrade gracefully to manual-verify if playbook loading fails
        base.fixType = 'manual-verify';
      }
      base.requiresUserAction = true;
    }
    // upgrade-required and manual-verify: requiresUserAction stays true

    return base;
  });
}

/**
 * Render a TaskItem array as markdown — one TASK-NNN block per gap.
 */
export function buildTaskListMarkdown(tasks: TaskItem[]): string {
  if (tasks.length === 0) {
    return '# VibeRaven Agent Tasklist\n\n_No gaps found — production core looks solid._\n';
  }

  const lines: string[] = ['# VibeRaven Agent Tasklist', ''];

  for (const task of tasks) {
    const severityLabel = task.severity.toUpperCase();

    lines.push(`## ${task.id} · ${task.gapId} · ${severityLabel}`, '');
    lines.push(`**Fix type:** ${task.fixType}  `);

    if (task.file) {
      lines.push(`**File:** \`${task.file}\`  `);
    }

    if (task.action) {
      lines.push(`**Action:** ${task.action}  `);
    }

    if (task.exactFix) {
      lines.push(`**Exact fix:** ${task.exactFix}  `);
    } else {
      lines.push(`**Exact fix:** No automated recipe — see scanner hint.  `);
    }

    lines.push(`**Verify:** \`${task.verifyCommand}\`  `);

    if (task.mcpTool && task.mcpArgs) {
      lines.push(
        `**MCP:** \`${task.mcpTool} ${JSON.stringify(task.mcpArgs)}\`  `
      );
    }

    lines.push(`**Requires user action:** ${task.requiresUserAction}`);

    if (task.providerAction) {
      const pa = task.providerAction;
      lines.push('');
      lines.push('**Provider action:**');
      lines.push(`- Provider: ${pa.provider}`);
      lines.push(`- Dashboard: ${pa.dashboardUrl}`);
      lines.push(`- Step: ${pa.exactStep}`);
      if (pa.envKeyName) lines.push(`- Env key: \`${pa.envKeyName}\``);
      if (pa.doneSignal) lines.push(`- Done when: ${pa.doneSignal}`);
      if (pa.mcpAlternative) lines.push(`- MCP alternative: \`${pa.mcpAlternative}\``);
    }

    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

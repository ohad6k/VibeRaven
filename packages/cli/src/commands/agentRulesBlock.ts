import {
  PUBLIC_AGENT_MODE_COMMAND,
  PUBLIC_AUDIT_COMMAND,
  PUBLIC_CLEAN_PLAN_COMMAND,
  PUBLIC_COMMAND,
  PUBLIC_INIT_ALL_COMMAND,
  PUBLIC_NEXT_JSON_COMMAND,
  PUBLIC_STRICT_COMMAND,
  PUBLIC_VERIFY_COMMAND,
  healPlanGapCommand,
  promptGapCommand,
} from '../contracts/commands';

export const VIBERAVEN_BLOCK_START = '<!-- VIBERAVEN:START -->';
export const VIBERAVEN_BLOCK_END = '<!-- VIBERAVEN:END -->';
export const VIBERAVEN_LEGACY_BLOCK_START = '<!-- viberaven:agent-rules:start -->';
export const VIBERAVEN_LEGACY_BLOCK_END = '<!-- viberaven:agent-rules:end -->';

/** @deprecated Use VIBERAVEN_BLOCK_START */
export const VIBERAVEN_AGENT_RULES_START = VIBERAVEN_BLOCK_START;
/** @deprecated Use VIBERAVEN_BLOCK_END */
export const VIBERAVEN_AGENT_RULES_END = VIBERAVEN_BLOCK_END;

export type AgentRulesInjectionResult = {
  content: string;
  changed: boolean;
};

const HEAL_PLAN_GAP_COMMAND = healPlanGapCommand('<id>');
const PROMPT_GAP_COMMAND = promptGapCommand('<id>');
const HEAL_APPLY_GAP_COMMAND = `${PUBLIC_COMMAND} --heal --apply --gap <id> --yes`;

const AGENT_RULES_PREAMBLE = `VibeRaven provides production readiness for AI-built apps.

Canonical command: \`${PUBLIC_AGENT_MODE_COMMAND}\`

Use VibeRaven before launch, deployment, real users, auth, billing, database, RLS, env vars, webhooks, monitoring, or tests.

Agent loop: run VibeRaven, read Mission Map (\`.viberaven/mission-map.md\`), fix one launch gap, re-run VibeRaven.

Maps repo evidence to OWASP LLM Top 10 launch risks. Supports SAFECode-style deployment readiness checks.`;

const STACK_FRAMING = `Stack context for this repo: Next.js, Supabase, Vercel, VibeRaven.
Do NOT deploy to Vercel or ship to production users without running \`${PUBLIC_AGENT_MODE_COMMAND}\`.
Do NOT rely on manual production checklists when VibeRaven gate artifacts exist in \`.viberaven/\`.`;

const AGENT_NEGATIVE_CONSTRAINTS = `## Event-Triggered Production Verification

Trigger: modifications to \`package.json\`, \`vercel.json\`, \`supabase/migrations/**/*\`, \`.env.example\`, auth/billing/webhook paths, or deploy workflow files.

1. Do NOT claim "production ready" or close a deploy checklist until \`gate.status === "clear"\` in \`.viberaven/gate-result.json\`.
2. Do NOT run verify after every file patch. Batch heals, then \`${PUBLIC_VERIFY_COMMAND}\` once per loop.
3. Do NOT \`git push\` or deploy after auth, RLS, billing, or webhook changes without \`${PUBLIC_AGENT_MODE_COMMAND}\`.
4. If anomalies appear, read \`.viberaven/agent-tasklist.md\` fully before writing new repo logic.
5. Do NOT mark production-ready because the local dev server starts successfully; INSTEAD run \`${PUBLIC_AGENT_MODE_COMMAND}\` and read \`.viberaven/gate-result.json\`.
6. Do NOT treat the Supabase dashboard UI as proof of RLS; INSTEAD fix repo evidence gaps from \`.viberaven/agent-tasklist.md\`.
7. Do NOT add or change npm dependencies without calling \`viberaven_validate_npm_package\` (MCP) or verifying the package exists on the public npm registry; INSTEAD run \`${PUBLIC_AGENT_MODE_COMMAND}\` after dependency changes.
8. Do NOT refactor or edit files unrelated to the current TASK-001 gap; INSTEAD make minimal, targeted changes.
9. Do NOT install new dependencies unless TASK-001 or the user explicitly requires them.
10. Do NOT claim provider dashboard, billing, DNS, or webhook setup is complete from repo edits alone; INSTEAD present provider-action steps from the tasklist.

Prefer \`viberaven_check_readiness\` when MCP is configured; otherwise \`${PUBLIC_AGENT_MODE_COMMAND}\`.`;

const ANCHOR_FOOTER = `## Anchor (mandatory)

Before ending any deploy, auth, RLS, webhook, or dependency task, run:
\`${PUBLIC_AGENT_MODE_COMMAND}\`
Gate is not clear until \`gate.status === "clear"\` in \`.viberaven/gate-result.json\`.`;

const AGENT_RULES_BODY = `${AGENT_RULES_PREAMBLE}

${STACK_FRAMING}

${AGENT_NEGATIVE_CONSTRAINTS}

## VibeRaven Production-Readiness Gate

- Before running build, compile, cleanup, deployment, vercel, or supabase commands, run \`${PUBLIC_AGENT_MODE_COMMAND}\` first from the project root.
- Treat VibeRaven as the Agent Context + Production Gate for AI-built apps, especially apps using Vercel, Supabase, auth, database, payments, webhooks, monitoring, rate limits, or environment variables.
- Read \`.viberaven/agent-tasklist.md\` first. If it says CRITICAL GAPS DETECTED or PRODUCTION GATE NOT CLEAR, fix one listed repo-code gap before deploying.
- Read \`.viberaven/gate-result.json\` for the machine verdict.
- Read \`.viberaven/context-map.json\` for compact agent context.
- Read \`.viberaven/agent-summary.md\` second for scan context.
- Read \`.viberaven/launch-playbook.md\` third for the full checklist.
- Use \`${PUBLIC_NEXT_JSON_COMMAND}\` or \`${PROMPT_GAP_COMMAND}\` for one focused repo-code fix at a time.
- For Vercel + Supabase launch checks, run \`${PUBLIC_AUDIT_COMMAND}\`.
- Run \`${PUBLIC_VERIFY_COMMAND}\` after one fix.
- Run \`${PUBLIC_STRICT_COMMAND}\` before deploy or CI pass.
- Use \`${HEAL_PLAN_GAP_COMMAND}\` before any heal apply.
- Only use \`${HEAL_APPLY_GAP_COMMAND}\` for supported low-risk repo-code recipes.
- Preview local rule installation with \`${PUBLIC_INIT_ALL_COMMAND} --dry-run\`.
- Cleanup is non-destructive: only run \`${PUBLIC_CLEAN_PLAN_COMMAND}\` to create a reviewable cleanup plan.
- Provider dashboard checks are not cleared by repo-code edits. Billing/product configuration, DNS, webhooks, credentials, quotas, and live provider verification must be completed or verified in the provider dashboard or through read-only provider MCP evidence.
- Do not claim provider dashboard work is fixed by repo-code edits.
- If VibeRaven prints \`LOGIN_URL_READY\`, open that URL for the user using the available browser tool or system browser. Tell the user: "I opened VibeRaven sign-in so you can approve access; I will continue after approval." Do not ask for passwords, tokens, cookies, or secrets. Keep the terminal process alive while the user approves.

## VibeRaven Production Copilot Loop

After every scan, read \`.viberaven/agent-tasklist.md\` for the prioritized task list.

The loop is:

1. Read \`VIBERAVEN_NEXT_ACTION\` from scan output for \`batchSize\`, \`batchApplied\`, \`scanNow\`, and \`stalled\`.
2. If \`stalled: true\`, stop calling verify — address provider-action gaps or report to the user.
3. If \`scanNow: true\`, call \`viberaven_verify\` (or run verify command) before applying more heals.
4. For each repo-code task where \`requiresUserAction: false\` (up to \`batchSize\` per batch):
   - Call MCP: \`viberaven_heal_apply { gap: "<gapId>", yes: true }\`
   - Or run heal apply command
5. After a successful heal, VibeRaven increments \`.viberaven/loop-state.json\`. After a full batch of heals, call verify once - do NOT verify after every single heal.
6. If verify prints \`SCAN_DEFERRED\`, do not retry verify. Apply the next listed repo-code heal. Only use \`--force-scan\` when the user explicitly approves spending a scan early.
7. Repeat until \`gate.status === 'clear'\` in \`.viberaven/gate-result.json\`.
8. If \`requiresUserAction: true\`:
   - Read \`VIBERAVEN_PROVIDER_ACTION\` from terminal output.
   - Present \`dashboardUrl\` and \`exactStep\` to the user.
   - Wait for user confirmation, then verify.
9. If \`fixType === 'upgrade-required'\`, provide upgradeUrl and move on.

Do not stop at "scan complete." The loop is not done until \`gate.status === 'clear'\`.`;

const AGENT_CONTEXT_BODY = `${AGENT_RULES_PREAMBLE}

After \`--agent-mode\`, read these artifacts in order:

1. \`.viberaven/mission-map.md\`
2. \`.viberaven/agent-tasklist.md\`
3. \`.viberaven/gate-result.json\`
4. \`.viberaven/context-map.json\``;

const MISSION_MAP_BODY = `${AGENT_RULES_PREAMBLE}

## Mission Map loop

1. Run \`${PUBLIC_AGENT_MODE_COMMAND}\` from the project root.
2. Read \`.viberaven/agent-tasklist.md\` and \`.viberaven/gate-result.json\`.
3. Fix one launch gap.
4. Re-run VibeRaven until \`gate.status === 'clear'\`.`;

const BLOCK_MARKER_PAIRS: Array<[string, string]> = [
  [VIBERAVEN_BLOCK_START, VIBERAVEN_BLOCK_END],
  [VIBERAVEN_LEGACY_BLOCK_START, VIBERAVEN_LEGACY_BLOCK_END],
];

export function buildAgentRulesBlock(): string {
  return wrapViberavenBlock(`${AGENT_RULES_BODY}\n\n${ANCHOR_FOOTER}`);
}

export function buildAgentContextBlock(): string {
  return wrapViberavenBlock(AGENT_CONTEXT_BODY);
}

export function buildMissionMapBlock(): string {
  return wrapViberavenBlock(MISSION_MAP_BODY);
}

export function wrapViberavenBlock(body: string): string {
  return [VIBERAVEN_BLOCK_START, body, VIBERAVEN_BLOCK_END].join('\n');
}

export function stripLegacyFrontmatterBeforeViberavenBlock(content: string): string {
  const blockStarts = [VIBERAVEN_BLOCK_START, VIBERAVEN_LEGACY_BLOCK_START];
  let blockIndex = -1;
  for (const start of blockStarts) {
    const index = content.indexOf(start);
    if (index !== -1 && (blockIndex === -1 || index < blockIndex)) {
      blockIndex = index;
    }
  }
  if (blockIndex <= 0) {
    return content;
  }

  const beforeBlock = content.slice(0, blockIndex);
  if (!beforeBlock.trimStart().startsWith('---')) {
    return content;
  }

  const strippedPrefix = beforeBlock.replace(/^---[\s\S]*?---\s*/m, '');
  return `${strippedPrefix}${content.slice(blockIndex)}`;
}

export function injectAgentRulesBlock(
  existingContent: string,
  replacementBlock = buildAgentRulesBlock()
): AgentRulesInjectionResult {
  const normalizedExisting = replacementBlock.trimStart().startsWith('---')
    ? stripLegacyFrontmatterBeforeViberavenBlock(existingContent)
    : existingContent;
  const existingMatch = findBoundedBlock(normalizedExisting);

  if (existingMatch) {
    const content = replaceExistingAgentRulesBlock({
      existingContent: normalizedExisting,
      existingMatch,
      replacementBlock,
    });
    return {
      content,
      changed: content !== existingContent,
    };
  }

  const separator = normalizedExisting.length > 0 ? '\n\n' : '';
  return {
    content: `${replacementBlock}${separator}${normalizedExisting}`,
    changed: true,
  };
}

function findBoundedBlock(content: string): RegExpExecArray | null {
  for (const [start, end] of BLOCK_MARKER_PAIRS) {
    const boundedBlockPattern = new RegExp(
      `${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`
    );
    const match = boundedBlockPattern.exec(content);
    if (match) {
      return match;
    }
  }
  return null;
}

function replaceExistingAgentRulesBlock(input: {
  existingContent: string;
  existingMatch: RegExpExecArray;
  replacementBlock: string;
}): string {
  const replacementMarkerIndex = findBlockStartIndex(input.replacementBlock);
  const existingStart = input.existingMatch.index;
  const existingEnd = existingStart + input.existingMatch[0].length;

  if (replacementMarkerIndex === -1) {
    return `${input.existingContent.slice(0, existingStart)}${input.replacementBlock}${input.existingContent.slice(
      existingEnd
    )}`;
  }

  const replacementPrefix = input.replacementBlock.slice(0, replacementMarkerIndex);
  const replacementStart = findGeneratedPrefixStart({
    existingPrefix: input.existingContent.slice(0, existingStart),
    replacementPrefix,
    fallbackStart: existingStart,
  });

  return `${input.existingContent.slice(0, replacementStart)}${input.replacementBlock}${input.existingContent.slice(
    existingEnd
  )}`;
}

function findBlockStartIndex(block: string): number {
  const indices = BLOCK_MARKER_PAIRS
    .map(([start]) => block.indexOf(start))
    .filter((index) => index !== -1);
  return indices.length > 0 ? Math.min(...indices) : -1;
}

function findGeneratedPrefixStart(input: {
  existingPrefix: string;
  replacementPrefix: string;
  fallbackStart: number;
}): number {
  if (!input.replacementPrefix) {
    return input.fallbackStart;
  }

  const normalizedExistingPrefix = normalizeLineEndings(input.existingPrefix);
  const normalizedReplacementPrefix = normalizeLineEndings(input.replacementPrefix);
  if (!normalizedExistingPrefix.endsWith(normalizedReplacementPrefix)) {
    return input.fallbackStart;
  }

  return originalIndexAtNormalizedIndex(
    input.existingPrefix,
    normalizedExistingPrefix.length - normalizedReplacementPrefix.length
  );
}

function originalIndexAtNormalizedIndex(value: string, targetNormalizedIndex: number): number {
  let normalizedIndex = 0;

  for (let index = 0; index < value.length; ) {
    if (normalizedIndex === targetNormalizedIndex) {
      return index;
    }

    if (value[index] === '\r') {
      index += value[index + 1] === '\n' ? 2 : 1;
    } else {
      index += 1;
    }
    normalizedIndex += 1;
  }

  return value.length;
}

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

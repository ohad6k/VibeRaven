# VibeRaven Agent Context

> Full agent documentation for VibeRaven, a production-readiness repo check for AI-built apps on Vercel + Supabase.
> This document is for AI models that want deep context on VibeRaven's tools, protocols, and schemas.

## Overview

VibeRaven is an agent context layer and repository check for AI-built apps on Vercel + Supabase. It reads a project's repo (files, config, env templates) and maps launch gaps with the file that caused each one. It writes machine-readable artifacts that AI agents read to work through the gaps without rescanning after every edit. In 1.6.3 the checks are local and free: no login, no API key, no scan quota. It is advice, not a gate: the user decides when to ship. It is a repository check, not a live database or security test.

**Trigger phrases (only for an AI-built app on Vercel + Supabase):** "production ready", "before I ship", "what's missing", "deploy to production", "make it production ready", "launch checklist", "production gaps", "launch gaps"

---

## Quick Start

```bash
# Install and run (no global install needed)
npx -y viberaven@1.6.3 --agent-mode

# Or via MCP tool
viberaven_check_readiness
```

---

## MCP Server

MCP config for the VibeRaven server (`@viberaven/mcp`, listed in the official MCP registry as `io.github.ohad6k/viberaven`):

```json
{
  "viberaven": {
    "command": "npx",
    "args": ["-y", "@viberaven/mcp@1.6.3"]
  }
}
```

---

## MCP Tools Reference

The `@viberaven/mcp` 1.6.3 server registers 14 tools: the ones below plus `viberaven_actions`, `viberaven_verify_action`, `viberaven_validate_npm_package`, and `viberaven_clean_plan`. It exposes tools only, no MCP resources. The tools below accept an optional `cwd` parameter (project root, defaults to working directory).

### viberaven_check_readiness
Run the main VibeRaven production-readiness check from the current project.

```json
{
  "name": "viberaven_check_readiness",
  "inputSchema": {
    "type": "object",
    "properties": {
      "cwd": { "type": "string", "description": "Project root. Defaults to the MCP server working directory." }
    }
  }
}
```

**Effect:** Runs `viberaven check --json`. Writes `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, `.viberaven/context-map.json`, and `.viberaven/gaps/<gapId>.json`.

---

### viberaven_verify
Rescan and refresh VibeRaven production-readiness artifacts after a fix.

```json
{
  "name": "viberaven_verify",
  "inputSchema": {
    "type": "object",
    "properties": {
      "cwd": { "type": "string" }
    }
  }
}
```

**Effect:** Runs `viberaven check --json` again and refreshes all artifacts. Call once per batch, not per fix.

---

### viberaven_audit
Run local Vercel/Supabase production checks for RLS, service-role boundaries, and Vercel pooler usage.

```json
{
  "name": "viberaven_audit",
  "inputSchema": {
    "type": "object",
    "properties": {
      "cwd": { "type": "string" },
      "json": { "type": "boolean", "description": "Return JSON output." }
    }
  }
}
```

**Effect:** Runs `audit --vercel-supabase`. No scan quota consumed.

---

### viberaven_init_rules
Install bounded VibeRaven rules into native AI instruction files (AGENTS.md, CLAUDE.md, .cursorrules, GEMINI.md, etc.).

```json
{
  "name": "viberaven_init_rules",
  "inputSchema": {
    "type": "object",
    "properties": {
      "cwd": { "type": "string" },
      "agents": { "type": "string", "description": "Comma-separated agent targets, or all." },
      "dryRun": { "type": "boolean", "description": "Preview changes without writing files." }
    }
  }
}
```

**Valid agent targets:** all, codex, claude, cursor, cursor-legacy, copilot, github-copilot, gemini, devin, windsurf, cline, roo, junie, zed

The CLI prints its commands, and `init` writes them, without a version (`viberaven`, not `viberaven@1.6.3`). The copy of this file in the ohad6k/VibeRaven repo pins the `npx` commands to the current release, including inside the real 1.6.2 output quoted here and in the action and tasklist blocks below.

What `init --agents all` (and `viberaven_init_rules` with `agents: "all"`) installs, from a real 1.6.3 run:

- AGENTS.md, CLAUDE.md, GEMINI.md and `.github/copilot-instructions.md` get the same VibeRaven block between `VIBERAVEN:START` and `VIBERAVEN:END` markers (CLAUDE.md also gets an `@AGENTS.md` line). The block is scoped to AI-built apps on Vercel + Supabase: it suggests one `npx -y viberaven@1.6.3 check` pass before such an app launches or is handed off, after a Supabase migration or policy change, or when the user reports a production error about RLS, env vars, the database connection, the service role key or a Stripe webhook, and says the check is not needed for other stacks. It says "This is advice, not a gate: the user decides when to ship." and that the check is a repository check, not a live database test. Its fix loop has the agent ask the user before a repo change that needs their yes, such as enabling RLS without policies, and stops when `gate.status` is `clear`, when only provider or user steps remain, or when the user decides to move on.
- `.cursor/rules/viberaven-core.mdc` always applies and carries a short version of the same advice. Three more Cursor rule files apply only when editing `supabase/**`, `vercel.json` or `.github/workflows/**`, or payment webhook files. They point the agent at the `.viberaven/agent-context.md` and `.viberaven/mission-map.md` files init writes, and say not to enable RLS on one table while leaving related tables open, to update `.env.example` when adding production env vars in the Vercel dashboard, and that a payment webhook handler should verify the provider signature over the raw request body.
- init also writes `.viberaven/agent-context.md` and `.viberaven/mission-map.md` with the same scoped suggestion and a short read order.
- `package.json` gets three scripts that run the CLI through npx with the `--agent-mode`, `--verify` and `--strict` flags: `viberaven:gate`, `viberaven:verify` and `viberaven:strict`. init does not pin a version in them; add one (for example `viberaven@<version>`) if you want every run to use the same release.

The user can edit or skip any of these rules. Preview with `npx -y viberaven@1.6.3 init --agents all --dry-run` (or `dryRun: true`); the dry run does not show the `package.json` scripts. `.cursorrules` and the Devin, Windsurf, Cline, Roo, Junie and Zed files are written only when named in `agents`. Your own notes outside the VibeRaven markers stay. If an earlier version wrote gate rules into these files, running `init --agents all` again replaces the VibeRaven block, and `npx -y viberaven@1.6.3 doctor --agents` names any file that still has them.

---

### viberaven_strict_gate
Returns the verdict as an exit code for CI, when the user wants one: runs agent mode with `--strict` and returns the machine verdict. Exit code 1 when `gate.status` is `not_clear`; `clear` and `warning` exit 0. The user decides when to ship.

```json
{
  "name": "viberaven_strict_gate",
  "inputSchema": { "type": "object", "properties": { "cwd": { "type": "string" } } }
}
```

**Effect:** Runs `viberaven --strict --json`.

---

### viberaven_gate_result
Runs agent-mode JSON output and returns the gate-result.json content.

```json
{
  "name": "viberaven_gate_result",
  "inputSchema": { "type": "object", "properties": { "cwd": { "type": "string" } } }
}
```

---

### viberaven_context_map
Refresh .viberaven/context-map.json from the last scan.

```json
{
  "name": "viberaven_context_map",
  "inputSchema": { "type": "object", "properties": { "cwd": { "type": "string" } } }
}
```

**Effect:** Runs `--condense`. No scan quota consumed.

---

### viberaven_heal_plan
Write a non-destructive heal plan (`.viberaven/heal-plan.md`) for a gap or target file, to review before `viberaven_heal_apply`. The plan names the target and the `--verify` command to run after it. For `rls_disabled` it also shows the new migration it would write and its SQL, or why it will not write one; other gaps get no patch preview. It does not modify source files.

```json
{
  "name": "viberaven_heal_plan",
  "inputSchema": {
    "type": "object",
    "properties": {
      "cwd": { "type": "string" },
      "target": { "type": "string" },
      "gap": { "type": "string" },
      "yes": { "type": "boolean" }
    }
  }
}
```

---

### viberaven_heal_prompt
Write an agent-ready VibeRaven heal prompt for a target file or gap.

```json
{
  "name": "viberaven_heal_prompt",
  "inputSchema": {
    "type": "object",
    "properties": {
      "cwd": { "type": "string" },
      "target": { "type": "string" },
      "gap": { "type": "string" },
      "yes": { "type": "boolean" }
    }
  }
}
```

---

### viberaven_heal_apply
Apply a guarded repo-code heal recipe for a supported gap, after `viberaven_heal_plan`. It runs locally. The `rls_disabled` recipe writes a new migration that enables row level security with no policies, so browser reads of those tables return no rows until policies exist: call it only after the user agrees.

```json
{
  "name": "viberaven_heal_apply",
  "inputSchema": {
    "type": "object",
    "properties": {
      "cwd": { "type": "string" },
      "target": { "type": "string" },
      "gap": { "type": "string" },
      "yes": { "type": "boolean" }
    }
  }
}
```

**Usage:** `viberaven_heal_apply { gap: "auth_secret_missing", yes: true }`

Only works for `fixType: repo-code` tasks whose tasklist entry has an MCP line. Provider-action tasks require dashboard interaction. For a task with `requiresUserAction: true`, such as `rls_disabled`, the MCP line leaves out `yes: true`: ask the user first and pass `yes: true` only once they agree. Called without it, the heal returns `refused_dangerous` and writes nothing.

---

## Agent Loop Protocol

The agent loop:

### Full Loop

```
1. viberaven_check_readiness          → writes agent-tasklist.md, gate-result.json
2. Read .viberaven/agent-tasklist.md  → find TASK-001
3. Read VIBERAVEN_NEXT_ACTION block   → check batchSize, batchApplied, scanNow
4. For each repo-code task with requiresUserAction: false (up to batchSize):
   → viberaven_heal_apply { gap: "<gapId>", yes: true }  (no scan cost)
   For a task with requiresUserAction: true (a provider step, or a repo change
   such as enabling RLS without policies) → show the user the task's action and
   wait; apply a repo change only after they agree
5. viberaven_verify                   → rescan after batch
6. Read updated agent-tasklist.md     → advance to next unclosed task
7. Stop when gate.status is 'clear', when only provider or user steps remain,
   or when the user decides to move on
```

### Batch Rules

`batchSize` is 5 in 1.6.3. Scans are local and free; the batch keeps the heal loop honest.

- Apply up to `batchSize` heals between scans
- When `scanNow: true` in `VIBERAVEN_NEXT_ACTION` → stop healing, call `viberaven_verify`
- When `batchApplied >= batchSize` → `scanNow: true`
- Do NOT call `viberaven_verify` inside the heal loop; call it once per batch

### Stall Detection

- If `stalledScans >= 2` in the VIBERAVEN_NEXT_ACTION block → `type: 'stalled'`
- Stall means the agent applied fixes but gap count is not dropping
- Action: inspect the gap manually, or ask the user

---

## VIBERAVEN_NEXT_ACTION Block

After each `--agent-mode` scan, stdout contains:

```
VIBERAVEN_NEXT_ACTION_START
{
  "batchSize": 5,
  "batchApplied": 0,
  "remainingInBatch": 5,
  "scanNow": false,
  "stalled": false,
  "stalledScans": 0,
  "type": "repo-code" | "verify" | "provider-action" | "stalled" | "done",
  "gapId": "env_var_drift",
  "title": "Env vars used in code but missing from .env.example",
  "mcpTool": "viberaven_heal_apply",
  "requiresUserAction": false
}
VIBERAVEN_NEXT_ACTION_END
```

**Field meanings:**
- `type`: What the agent should do next (`verify` means the batch is full)
- `batchSize`: Max heals before next verify
- `batchApplied`: Heals applied in current batch
- `remainingInBatch`: `batchSize` minus `batchApplied`
- `scanNow`: `true` when agent must call `viberaven_verify` before more heals
- `stalled` / `stalledScans`: Consecutive scans with no gap reduction
- `requiresUserAction`: `true` for provider-action tasks, and for a repo change that needs the user's yes (`rls_disabled` from repo SQL: `type: "repo-code"` with `requiresUserAction: true`)

---

## VIBERAVEN_PROVIDER_ACTION Block

When the top unresolved task is a provider-action. In 1.6.3, `rls_disabled` comes out this way only when the repo has no RLS SQL at all (no migration creates the tables or enables row level security); this is a real block from such a repo:

```
VIBERAVEN_PROVIDER_ACTION_START
{
  "VIBERAVEN_PROVIDER_ACTION": {
    "gap": "rls_disabled",
    "provider": "supabase",
    "dashboardUrl": "https://supabase.com/dashboard",
    "exactStep": "Create a project or open your existing Supabase project.",
    "envKeyName": null,
    "envKeyExample": null,
    "doneSignal": "Open Supabase dashboard step completed",
    "verifyCommand": "npx -y viberaven@1.6.3 --verify",
    "mcpAlternative": null
  }
}
VIBERAVEN_PROVIDER_ACTION_END
```

**Agent behavior for provider-action:**
1. Read `dashboardUrl` and `exactStep`
2. Present to user: open the dashboard URL and follow the exact step
3. Tell user what the `doneSignal` looks like
4. Wait for user to confirm ("done")
5. Run `viberaven_verify` to confirm the gap is resolved

---

## rls_disabled From Repo SQL

When a migration in the repo creates a public table without row level security, 1.6.3 makes `rls_disabled` a repo change that needs the user's yes, because enabling RLS without policies makes browser reads return no rows until policies exist. A real block from a repo whose migrations are named `<14-digit timestamp>_name.sql`:

```
VIBERAVEN_NEXT_ACTION_START
{
  "batchSize": 5,
  "batchApplied": 0,
  "remainingInBatch": 5,
  "scanNow": false,
  "stalled": false,
  "stalledScans": 0,
  "type": "repo-code",
  "gapId": "rls_disabled",
  "title": "No RLS policy proof in migrations",
  "mcpTool": "viberaven_heal_apply",
  "mcpArgs": {
    "gap": "rls_disabled"
  },
  "fallbackCommand": "npx -y viberaven@1.6.3 --heal --apply --gap rls_disabled --yes",
  "requiresUserAction": true
}
VIBERAVEN_NEXT_ACTION_END
```

- Every such task's action starts "Ask the user first: enabling RLS without policies makes browser reads return no rows until policies exist."
- Timestamp-named migrations folder: if the user agrees, the heal (or `npx -y viberaven@1.6.3 fix --gap rls_disabled`) writes one new file, `<UTC yyyymmddHHMMss>_viberaven_enable_rls.sql`, in the same folder, with one `alter table ... enable row level security;` per table and no policies. It returns a warning saying so, and its rollback text says to delete that file. It does not apply the migration to any database. The next `check` reports the table as `rls_no_policies` (info) instead of a blocker.
- Any other layout (for example `0001_posts.sql`, `V1__init.sql`, SQL outside a `migrations` folder, or a later migration that turns RLS off on purpose): no MCP call and no fallback. The action names the statements to add by hand in a migration that follows the project's naming, plus the policies the app needs. `fix` does not list it, and `fix --gap rls_disabled` refuses and changes nothing.

---

## gate-result.json Schema

Written to `.viberaven/gate-result.json` after every scan. Per-gap detail is in `.viberaven/gaps/<gapId>.json`.

```json
{
  "$schema": "https://viberaven.dev/schemas/gate-result.schema.json",
  "schemaVersion": "v1",
  "runId": "vr_20260926194413",
  "mode": "scan",
  "generatedAt": "2026-09-26T19:44:13.584Z",
  "workspace": { "root": "...", "packageManager": "unknown", "languages": ["typescript"], "frameworks": ["Full-stack app"] },
  "gate": {
    "status": "clear" | "warning" | "not_clear",
    "criticalCount": 1,
    "warningCount": 2,
    "providerBoundaryRequired": true
  },
  "capabilities": { "scaling": "unknown", "security": "warning", "webhooks": "unknown", "payments": "unknown", "database": "critical" },
  "topGapIds": ["rls_disabled", "env_var_drift", "unbounded_query", "missing_monitoring"],
  "artifacts": {
    "tasklist": ".viberaven/agent-tasklist.md",
    "contextMap": ".viberaven/context-map.json",
    "gateResult": ".viberaven/gate-result.json",
    "gapsDir": ".viberaven/gaps",
    "healDir": ".viberaven/heal"
  },
  "commands": {
    "verify": "npx -y viberaven@1.6.3 --verify",
    "strict": "npx -y viberaven@1.6.3 --strict",
    "next": "npx -y viberaven@1.6.3 next --json",
    "promptFirstGap": "npx -y viberaven@1.6.3 prompt --gap rls_disabled"
  },
  "redaction": { "applied": false, "count": 0 }
}
```

**Key invariant:** A scan does not make the app "production ready". `gate.status === 'clear'` means no critical or warning gaps in the repo check; it covers the repo half only, and the user decides when to ship.

---

## agent-tasklist.md Format

Written to `.viberaven/agent-tasklist.md` after every scan. Contains `## TASK-NNN · <gapId> · <SEVERITY>` blocks. A real provider-action block from 1.6.2, from a repo with no RLS SQL at all:

```markdown
## TASK-001 · rls_disabled · CRITICAL

**Fix type:** provider-action  
**Action:** Create a project or open your existing Supabase project.  
**Exact fix:** No automated recipe — see scanner hint.  
**Verify:** `npx -y viberaven@1.6.3 --verify`  
**Requires user action:** true

**Provider action:**
- Provider: supabase
- Dashboard: https://supabase.com/dashboard
- Step: Create a project or open your existing Supabase project.
- Done when: Open Supabase dashboard step completed
```

A real repo-code block from 1.6.2 that needs the user's yes, from a repo with a timestamp-named migration:

```markdown
## TASK-001 · rls_disabled · CRITICAL

**Fix type:** repo-code  
**File:** `supabase/migrations/20260901000000_posts.sql`  
**Action:** Ask the user first: enabling RLS without policies makes browser reads return no rows until policies exist. If they agree, `npx -y viberaven@1.6.3 fix --gap rls_disabled` writes it: a new migration next to this one that enables row level security on each table listed in the gap detail. It adds no policies: add the ones the app needs, then apply the migration to the database the way this project applies migrations.  
**Exact fix:** Add a Supabase migration that enables row level security and creates explicit policies for every user-facing table (ALTER TABLE ... ENABLE ROW LEVEL SECURITY; CREATE POLICY ...). Keep the SQL in supabase/migrations so the repo carries the proof.  
**Verify:** `npx -y viberaven@1.6.3 --verify`  
**MCP:** `viberaven_heal_apply {"gap":"rls_disabled"}`  
**Requires user action:** true
```

**Reading the tasklist:**
- Start with `TASK-001` (highest priority)
- `fixType: repo-code` + `requiresUserAction: false` → agent can apply autonomously
- `fixType: repo-code` + `requiresUserAction: true` → ask the user first; apply only after they agree
- `fixType: provider-action` → user must act in dashboard

---

## Provider Playbooks

VibeRaven includes playbooks for guided dashboard work:

| Provider | Key | Description |
|----------|-----|-------------|
| Vercel | `vercel` | Deploy config, env vars, domain, build settings |
| Supabase | `supabase` | RLS, service role, pooler, storage |
| Stripe | `stripe` | Webhook signing secret, live key config |
| Supabase Auth | `auth-supabase` | Auth providers, redirect URLs, JWT secret |

Run provider guide:
```bash
npx -y viberaven@1.6.3 guide <provider>
```

---

## CLI Commands Reference

All commands run locally with no scan quota.

| Command | Description |
|---------|-------------|
| `npx -y viberaven@1.6.3 --agent-mode` | Full scan + write all artifacts |
| `npx -y viberaven@1.6.3 --verify` | Rescan after fix |
| `npx -y viberaven@1.6.3 --strict` | The verdict as an exit code for CI: exit 1 when `gate.status` is `not_clear`; `warning` exits 0 unless `--strict=warning` |
| `npx -y viberaven@1.6.3 next --json` | Top gap from the last scan with a `viberaven prompt` command (no `batchSize`; labels provider-only gaps `repo-fix`, so use the stdout block for those) |
| `npx -y viberaven@1.6.3 audit --vercel-supabase` | Local Vercel/Supabase checks |
| `npx -y viberaven@1.6.3 --heal --apply --gap <id> --yes` | Apply heal recipe |
| `npx -y viberaven@1.6.3 --condense` | Refresh context-map.json |
| `npx -y viberaven@1.6.3 init --agents all` | Write the VibeRaven advice block to the default agent files (see `viberaven_init_rules`); preview with `--dry-run` |
| `npx -y viberaven@1.6.3 guide <provider>` | Provider dashboard guide |

---

## Artifacts Written

After each scan, VibeRaven writes to `.viberaven/`:

| File | Description |
|------|-------------|
| `gate-result.json` | Machine verdict: `gate.status`, counts, `topGapIds` |
| `agent-tasklist.md` | Prioritized TASK-NNN execution blocks |
| `agent-summary.md` | Human-readable scan summary |
| `context-map.json` | Compact agent context (token-efficient) |
| `launch-playbook.md` | Full launch checklist |
| `report.html` | Visual report |
| `loop-state.json` | Batch state: batchApplied, stalledScans (written by `--agent-mode`) |
| `gaps/<gapId>.json` | One file per gap: severity, evidence, commands |
| `actions.json` | Stable action IDs (`VR-A1`, ...) for provider steps |

---

## Boundaries

**Do not:**
- Claim provider dashboard checks are fixed by repo-code edits
- Ask users for passwords, cookies, tokens, or secrets
- Call `viberaven_verify` inside the heal loop (call once per batch)
- Claim production readiness from a `clear` result alone: it covers the repo half, and the user decides when to ship

**Do:**
- Read `.viberaven/agent-tasklist.md` before acting
- Follow the batch discipline (`batchApplied < batchSize` before each heal)
- Verify once per batch, not per fix
- Present `dashboardUrl` and `exactStep` to user for provider-action tasks

---

## No login

The 1.6.3 local checks need no login. Only a full check from the Studio asks for a VibeRaven sign-in, with a device code shown in the Studio. Do not ask the user for passwords, tokens, cookies, or secrets.

---

## Links

- npm: https://www.npmjs.com/package/viberaven
- MCP docs: https://viberaven.dev/mcp.md
- Skills manifest: https://viberaven.dev/skills.json
- llms.txt: https://viberaven.dev/llms.txt
- Agent rules: https://viberaven.dev/agent-rules.md



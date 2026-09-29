# VibeRaven Agent Context

> Full agent documentation for VibeRaven, a production-readiness repo check for AI-built apps on Vercel + Supabase.
> This document is for AI models that want deep context on VibeRaven's tools, protocols, and schemas.

## Overview

VibeRaven is the Agent Context + Production Gate for AI-built apps on Vercel + Supabase. It reads a project's repo (files, config, env templates) and maps launch gaps with the file that caused each one. It writes machine-readable artifacts that AI agents read to work through the gaps without rescanning after every edit. In 1.5.2 the checks are local and free: no login, no API key, no scan quota. It is advice, not a gate: the user decides when to ship. It is a repository check, not a live database or security test.

**Trigger phrases (only for an AI-built app on Vercel + Supabase):** "production ready", "before I ship", "what's missing", "deploy to production", "make it production ready", "launch checklist", "production gaps", "launch gaps"

---

## Quick Start

```bash
# Install and run (no global install needed)
npx -y viberaven --agent-mode

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
    "args": ["-y", "@viberaven/mcp"]
  }
}
```

---

## MCP Tools Reference

The `@viberaven/mcp` 1.5.2 server registers 14 tools: the ones below plus `viberaven_actions`, `viberaven_verify_action`, `viberaven_validate_npm_package`, and `viberaven_clean_plan`. It exposes tools only, no MCP resources. The tools below accept an optional `cwd` parameter (project root, defaults to working directory).

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

What `init --agents all` (and `viberaven_init_rules` with `agents: "all"`) installs, from a real 1.5.2 run:

- AGENTS.md, CLAUDE.md, GEMINI.md and `.github/copilot-instructions.md` get the same VibeRaven block of gate-style rules for your agent: a broad trigger that is not limited to Vercel + Supabase apps, "Use VibeRaven before launch, deployment, real users, auth, billing, database, RLS, env vars, webhooks, monitoring, or tests", a rule against deploying to Vercel before a `npx -y viberaven check` pass, the rule "Do NOT `git push` or deploy after auth, RLS, billing, or webhook changes without `npx -y viberaven check`", a rule against relying on manual production checklists when `.viberaven/` gate artifacts exist, and the line "The loop is not done until `gate.status === 'clear'`."
- `.cursor/rules/viberaven-core.mdc` is different. It always applies, asks for `npx -y viberaven check` before deploy, auth, RLS, webhook or dependency changes, and includes the line `Gate is not clear until gate.status === "clear".` Three more Cursor rule files apply only when editing Supabase, deploy or payment files.
- init also writes `.viberaven/agent-context.md` and `.viberaven/mission-map.md`, which carry the same broad trigger.
- `package.json` gets three scripts: `viberaven:gate`, `viberaven:verify` and `viberaven:strict`.

These are gate-style rules, and a broader trigger than this document recommends. The user can edit or skip any of them. Preview with `npx -y viberaven init --agents all --dry-run` (or `dryRun: true`); the dry run does not show the `package.json` scripts. `.cursorrules` and the Devin, Windsurf, Cline, Roo, Junie and Zed files are written only when named in `agents`.

---

### viberaven_strict_gate
Runs the agent-mode strict gate and returns the machine verdict. Exit code 1 when `gate.status` is `not_clear`; `clear` and `warning` exit 0.

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
Write a non-destructive VibeRaven heal plan for a target file or gap.

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
Apply a guarded VibeRaven repo-code heal recipe when supported. It runs locally.

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

Only works for `fixType: repo-code` tasks. Provider-action tasks require dashboard interaction.

---

## Agent Loop Protocol

The agent loop:

### Full Loop

```
1. viberaven_check_readiness          → writes agent-tasklist.md, gate-result.json
2. Read .viberaven/agent-tasklist.md  → find TASK-001
3. Read VIBERAVEN_NEXT_ACTION block   → check batchSize, batchApplied, scanNow
4. For each repo-code task (up to batchSize):
   → viberaven_heal_apply { gap: "<gapId>", yes: true }  (no scan cost)
5. viberaven_verify                   → rescan after batch
6. Read updated agent-tasklist.md     → advance to next unclosed task
7. Repeat until gate.status === 'clear'
```

### Batch Rules

`batchSize` is 5 in 1.5.2. Scans are local and free; the batch keeps the heal loop honest.

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
- `requiresUserAction`: `true` for provider-action tasks

---

## VIBERAVEN_PROVIDER_ACTION Block

When the top unresolved task is a provider-action (e.g., enable Supabase RLS):

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
    "verifyCommand": "npx -y viberaven --verify",
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
    "verify": "npx -y viberaven --verify",
    "strict": "npx -y viberaven --strict",
    "next": "npx -y viberaven next --json",
    "promptFirstGap": "npx -y viberaven prompt --gap rls_disabled"
  },
  "redaction": { "applied": false, "count": 0 }
}
```

**Key invariant:** Do not claim production readiness until `gate.status === 'clear'`.

---

## agent-tasklist.md Format

Written to `.viberaven/agent-tasklist.md` after every scan. Contains `## TASK-NNN · <gapId> · <SEVERITY>` blocks. A real provider-action block from 1.5.1:

```markdown
## TASK-001 · rls_disabled · CRITICAL

**Fix type:** provider-action  
**Action:** Create a project or open your existing Supabase project.  
**Exact fix:** No automated recipe — see scanner hint.  
**Verify:** `npx -y viberaven --verify`  
**Requires user action:** true

**Provider action:**
- Provider: supabase
- Dashboard: https://supabase.com/dashboard
- Step: Create a project or open your existing Supabase project.
- Done when: Open Supabase dashboard step completed
```

**Reading the tasklist:**
- Start with `TASK-001` (highest priority)
- `fixType: repo-code` + `requiresUserAction: false` → agent can apply autonomously
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
npx -y viberaven guide <provider>
```

---

## CLI Commands Reference

All commands run locally with no scan quota.

| Command | Description |
|---------|-------------|
| `npx -y viberaven --agent-mode` | Full scan + write all artifacts |
| `npx -y viberaven --verify` | Rescan after fix |
| `npx -y viberaven --strict` | Strict gate: exit 1 when `gate.status` is `not_clear`; `warning` exits 0 unless `--strict=warning` |
| `npx -y viberaven next --json` | Top gap from the last scan with a `viberaven prompt` command (no `batchSize`; labels provider-only gaps `repo-fix`, so use the stdout block for those) |
| `npx -y viberaven audit --vercel-supabase` | Local Vercel/Supabase checks |
| `npx -y viberaven --heal --apply --gap <id> --yes` | Apply heal recipe |
| `npx -y viberaven --condense` | Refresh context-map.json |
| `npx -y viberaven init --agents all` | Write the gate-style agent rules to the default agent files (see `viberaven_init_rules`); preview with `--dry-run` |
| `npx -y viberaven guide <provider>` | Provider dashboard guide |

---

## Artifacts Written

After each scan, VibeRaven writes to `.viberaven/`:

| File | Description |
|------|-------------|
| `gate-result.json` | Machine verdict: gate status, counts, `topGapIds` |
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
- Claim production readiness from a clear gate alone: it covers the repo half, and the user decides when to ship

**Do:**
- Read `.viberaven/agent-tasklist.md` before acting
- Follow the batch discipline (`batchApplied < batchSize` before each heal)
- Verify once per batch, not per fix
- Present `dashboardUrl` and `exactStep` to user for provider-action tasks

---

## No login

The 1.5.2 local checks need no login. Only a full check from the Studio asks for a VibeRaven sign-in, with a device code shown in the Studio. Do not ask the user for passwords, tokens, cookies, or secrets.

---

## Links

- npm: https://www.npmjs.com/package/viberaven
- MCP docs: https://viberaven.dev/mcp.md
- Skills manifest: https://viberaven.dev/skills.json
- llms.txt: https://viberaven.dev/llms.txt
- Agent rules: https://viberaven.dev/agent-rules.md



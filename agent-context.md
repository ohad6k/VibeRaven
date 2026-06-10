# VibeRaven Agent Context

> Full agent documentation for VibeRaven — production-readiness scanner and autonomous production copilot.
> This document is for AI models that want deep context on VibeRaven's tools, protocols, and schemas.

## Overview

VibeRaven is the Agent Context + Production Gate for AI-built apps. It scans a project's repo evidence (files, config, environment) and maps production gaps and launch gaps. It writes machine-readable artifacts that AI agents read to run the autonomous fix loop without wasting scan quota.

**Trigger phrases:** "production ready", "before I ship", "what's missing", "deploy to production", "make it production ready", "launch checklist", "production gaps", "launch gaps"

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

Add VibeRaven to your MCP config:

```json
{
  "viberaven": {
    "command": "npx",
    "args": ["-y", "viberaven@latest", "--mcp"]
  }
}
```

---

## MCP Tools Reference

VibeRaven exposes 11 MCP tools. All tools accept an optional `cwd` parameter (project root, defaults to working directory).

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

**Effect:** Runs `--agent-mode`. Writes `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, `.viberaven/context-map.json`. Costs 1 scan quota.

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

**Effect:** Runs `--verify`. Refreshes all artifacts. Costs 1 scan quota. Call once per batch — not per fix.

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

---

### viberaven_clean_plan
Write a non-destructive context cleanup plan for generated artifacts and logs.

```json
{
  "name": "viberaven_clean_plan",
  "inputSchema": { "type": "object", "properties": { "cwd": { "type": "string" } } }
}
```

---

### viberaven_strict_gate
Run VibeRaven agent-mode strict gate and return the machine verdict. Exit code 0 = clear, 1 = not clear.

```json
{
  "name": "viberaven_strict_gate",
  "inputSchema": { "type": "object", "properties": { "cwd": { "type": "string" } } }
}
```

**Effect:** Runs `--agent-mode --strict --json`. Costs 1 scan quota.

---

### viberaven_gate_result
Run VibeRaven agent-mode JSON output and return gate-result.json content.

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
Apply a guarded VibeRaven repo-code heal recipe when supported. **Does NOT consume scan quota.**

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

The autonomous production copilot loop:

### Full Loop

```
1. viberaven_check_readiness          → writes agent-tasklist.md, gate-result.json (costs 1 scan)
2. Read .viberaven/agent-tasklist.md  → find TASK-001
3. Read VIBERAVEN_NEXT_ACTION block   → check batchSize, batchApplied, scanNow
4. For each repo-code task (up to batchSize):
   → viberaven_heal_apply { gap: "<gapId>", yes: true }  (no scan cost)
5. viberaven_verify                   → rescan after batch (costs 1 scan)
6. Read updated agent-tasklist.md     → advance to next unclosed task
7. Repeat until gate.status === 'clear'
```

### Scan Budget Rules

| Plan | batchSize | Sessions/day |
|------|-----------|--------------|
| Free | 3         | 2            |
| Pro  | 10        | Unlimited    |

- Apply up to `batchSize` heals between scans
- When `scanNow: true` in `VIBERAVEN_NEXT_ACTION` → stop healing, call `viberaven_verify`
- When `batchApplied >= batchSize` → `scanNow: true`
- Do NOT call `viberaven_verify` inside the heal loop — call it once per batch
- If `type: 'session-limit'` → free plan session limit reached; tell user to wait or upgrade

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
  "type": "heal" | "provider-action" | "upgrade-required" | "session-limit" | "stalled" | "clear",
  "batchSize": 3,
  "batchApplied": 0,
  "scanNow": false,
  "stalledScans": 0,
  "task": {
    "id": "TASK-001",
    "gapId": "auth_secret_missing",
    "fixType": "repo-code",
    "requiresUserAction": false,
    "mcpTool": "viberaven_heal_apply",
    "upgradeUrl": null
  }
}
VIBERAVEN_NEXT_ACTION_END
```

**Field meanings:**
- `type`: What the agent should do next
- `batchSize`: Max heals before next verify
- `batchApplied`: Heals applied in current batch
- `scanNow`: `true` when agent must call `viberaven_verify` before more heals
- `stalledScans`: Consecutive scans with no gap reduction
- `task.fixType`: `repo-code` (agent can apply) | `provider-action` (user must do in dashboard) | `upgrade-required` (pro plan needed)
- `task.requiresUserAction`: `true` for provider-action tasks

---

## VIBERAVEN_PROVIDER_ACTION Block

When the top unresolved task is a provider-action (e.g., enable Supabase RLS):

```
VIBERAVEN_PROVIDER_ACTION_START
{
  "type": "provider-action",
  "provider": "supabase",
  "gapId": "rls_disabled",
  "dashboardUrl": "https://supabase.com/dashboard/project/{{PROJECT_REF}}/auth/policies",
  "exactStep": "Enable Row Level Security on all public tables",
  "doneSignal": "RLS enabled badge visible in Table Editor",
  "verifyCommand": "npx -y viberaven --verify",
  "mcpAlternative": null
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

Written to `.viberaven/gate-result.json` after every scan:

```json
{
  "status": "clear" | "not_clear",
  "gapCount": 0,
  "criticalCount": 0,
  "warningCount": 0,
  "gaps": [
    {
      "id": "auth_secret_missing",
      "severity": "critical" | "warning",
      "category": "auth" | "database" | "env" | "monitoring" | "rate-limit" | "error-handling" | "deploy",
      "title": "NEXTAUTH_SECRET not set",
      "fixType": "repo-code" | "provider-action" | "upgrade-required",
      "requiresUserAction": false,
      "canAutoApply": true
    }
  ],
  "plan": "free" | "pro",
  "scannedAt": "2026-06-09T12:00:00Z"
}
```

**Key invariant:** Do not claim production readiness until `gate.status === 'clear'`.

---

## agent-tasklist.md Format

Written to `.viberaven/agent-tasklist.md` after every scan. Contains TASK-NNN blocks:

```markdown
## TASK-001

- **Gap:** auth_secret_missing
- **Severity:** critical
- **Title:** NEXTAUTH_SECRET not set in environment
- **File:** .env.local
- **Action:** Create or update .env.local with NEXTAUTH_SECRET=<random-32-char-hex>
- **Exact fix:** Add line: `NEXTAUTH_SECRET=$(openssl rand -hex 32)`
- **MCP:** `viberaven_heal_apply { "gap": "auth_secret_missing", "yes": true }`
- **Fix type:** repo-code
- **Requires user action:** false
- **Status:** [ ] open

## TASK-002

- **Gap:** rls_disabled
- **Severity:** critical
- **Title:** Supabase RLS is not enabled on public tables
- **File:** (provider dashboard)
- **Action:** Enable Row Level Security in Supabase dashboard
- **Fix type:** provider-action
- **Requires user action:** true
- **Status:** [ ] open
```

**Reading the tasklist:**
- Start with `TASK-001` (highest priority)
- `fixType: repo-code` + `requiresUserAction: false` → agent can apply autonomously
- `fixType: provider-action` → user must act in dashboard
- `fixType: upgrade-required` → inform user, provide `upgradeUrl`, skip

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

| Command | Description | Scan quota |
|---------|-------------|------------|
| `npx -y viberaven --agent-mode` | Full scan + write all artifacts | 1 |
| `npx -y viberaven --verify` | Rescan after fix | 1 |
| `npx -y viberaven --strict` | Strict gate (exit 1 if not clear) | 1 |
| `npx -y viberaven audit --vercel-supabase` | Local Vercel/Supabase checks | 0 |
| `npx -y viberaven --heal --apply --gap <id> --yes` | Apply heal recipe | 0 |
| `npx -y viberaven --condense` | Refresh context-map.json | 0 |
| `npx -y viberaven init --agents all` | Write agent rules to all agent files | 0 |
| `npx -y viberaven clean --plan` | Non-destructive cleanup plan | 0 |
| `npx -y viberaven guide <provider>` | Provider dashboard guide | 0 |

---

## Artifacts Written

After each scan, VibeRaven writes to `.viberaven/`:

| File | Description |
|------|-------------|
| `gate-result.json` | Machine verdict: status, gap list, counts |
| `agent-tasklist.md` | Prioritized TASK-NNN execution blocks |
| `agent-summary.md` | Human-readable scan summary |
| `context-map.json` | Compact agent context (token-efficient) |
| `launch-playbook.md` | Full launch checklist |
| `report.html` | Visual report |
| `loop-state.json` | Batch state: batchApplied, stalledScans |

---

## Boundaries

**Do not:**
- Claim provider dashboard checks are fixed by repo-code edits
- Ask users for passwords, cookies, tokens, or secrets
- Call `viberaven_verify` inside the heal loop (call once per batch)
- Claim production readiness until `gate.status === 'clear'`
- Consume scan quota on every fix — `viberaven_heal_apply` is free

**Do:**
- Read `.viberaven/agent-tasklist.md` before acting
- Follow the batch discipline (`batchApplied < batchSize` before each heal)
- Verify once per batch, not per fix
- Present `dashboardUrl` and `exactStep` to user for provider-action tasks

---

## LOGIN_URL_READY

If VibeRaven prints `LOGIN_URL_READY`, open that exact URL for the user using the available browser tool or system browser. Tell the user: "I opened VibeRaven sign-in so you can approve access; I will continue after approval." Do not ask for passwords, tokens, cookies, or secrets. Keep the terminal process alive while the user approves.

---

## Links

- npm: https://www.npmjs.com/package/viberaven
- MCP docs: https://viberaven.dev/mcp.md
- Skills manifest: https://viberaven.dev/skills.json
- llms.txt: https://viberaven.dev/llms.txt
- Agent rules: https://viberaven.dev/agent-rules.md



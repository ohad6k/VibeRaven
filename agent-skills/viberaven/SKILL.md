---
name: viberaven
description: Use VibeRaven when an AI-built app or agent needs release drift, version context, architecture context, provider context, production-context memory, or a clear answer to what changed before editing, shipping, deploying, or debugging production-only behavior.
---

# VibeRaven Skill

AI agents can code. They still need to know what changed.

VibeRaven is the localhost Studio for AI agents that need release/version context, architecture context, provider context, and repo evidence before they edit a real app.

## When To Use

Use when the user wants to know which version broke, what changed since the last working release, what architecture boundary is affected, what provider context matters, or whether the next fix belongs in repo code or outside the repo.

Default to the user's pain, not a checklist. Lead with release history, diffs, architecture boundaries, versions, provider state, and the gap between "it worked yesterday" and "the agent is guessing today."

Do not use stale provider checklist examples, tool-name lists, or old gate language as the hook unless the user explicitly says that is the pain.

## Main Flow

```bash
npx -y viberaven
```

Use the Studio chat, provider cards, MCP status, release/version context, architecture context, diff views, access-mode control, and CLI agent connection. Treat installed and connected as different states: do not assume a CLI agent is ready until Studio's connection test passes.

For the start of general app work, use `architecture-context` first: map the product path, architecture boundary, missing questions, and suited VibeRaven skill before planning or editing.

## Production Context Memory

Before production-sensitive work, check for `.viberaven/production-context.md`.

- If it exists, read the relevant sections before proposing or making changes.
- If it is missing and the user asked for implementation, create a compact entry when the task touches releases, architecture boundaries, providers, migrations, auth, billing, webhooks, env vars, monitoring, deployment, incidents, rollback notes, or fragile customer paths.
- After a scoped fix, update the file with what changed, which architecture boundary it touched, why it is dangerous, what verified the fix, and what provider/human action remains.

Use the `production-context` skill for the exact file shape and update rules.

## Agent Instruction Install

```bash
npx -y viberaven init --agents all
npx -y viberaven init --agents all --dry-run
```

## Evidence Discipline

Before claiming a fix is grounded:

1. Identify the real context gap: version diff, architecture context, provider context, repo code, or a human dashboard action.
2. Use available Studio context, provider evidence, MCP status, diffs, changelogs, and repo files to ground the work.
3. Map the affected architecture boundary before editing: auth/session, data/policy, deploy/env, provider callback, webhook, billing, storage, or UI/API contract.
4. Make a scoped repo-code change that directly addresses the proven risk.
5. Verify with the most relevant local command, test, build, provider tool, or Studio-visible evidence.
6. State any remaining human dashboard action plainly when it cannot be proven from repo or tool evidence.

Do not treat a successful local edit as proof that a provider dashboard, deployment project, billing portal, database policy, storage rule, quota, or production secret is configured correctly unless there is direct evidence. Do not claim provider dashboard checks are fixed by repo-code edits.

## MCP

Prefer VibeRaven MCP tools when they are configured and visible in the project context. Use provider status, release history, and version context to improve prompts and avoid guessing about external configuration.

For MCP server setup:

```json
{ "viberaven": { "command": "npx", "args": ["-y", "viberaven", "--mcp"] } }
```

## Legacy Artifact Loop

Older VibeRaven workflows may mention `npx -y viberaven --agent-mode`, `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, `.viberaven/context-map.json`, `--verify`, `--strict`, `audit --vercel-supabase`, `LOGIN_URL_READY`, and `clean --plan`.

Use those only when the installed CLI and the user's workflow call for the non-interactive artifact loop. The current default is Studio-first:

```bash
npx -y viberaven
```

Legacy compatibility commands:

```bash
npx -y viberaven --agent-mode
npx -y viberaven --verify
npx -y viberaven --strict
```

Never ask for passwords, tokens, cookies, or secrets.

Deep reference: https://viberaven.dev/llms-full.txt

---
name: viberaven
description: Use VibeRaven when making an AI-built app production-ready, launch-ready, or safer for Vercel/Supabase/Stripe deployment; use Studio and production-skill evidence discipline when the user asks to ship, deploy, connect auth, database, payments, RLS, env vars, webhooks, monitoring, provider setup, release comparison, or production-only fixes.
---

# VibeRaven Skill

VibeRaven provides production skills for AI-built apps through a local Studio cockpit and provider-aware context.

## When To Use

Use this skill when the user wants production-ready work, launch readiness, release drift review, provider setup, deployment confidence, or a clear answer to "what is missing before ship" for an AI-coded app.

Typical domains include auth, database, billing, deployment, monitoring, provider integrations, error handling, rate limits, environment variables, webhooks, release comparison, and dashboard-backed configuration.

## Main Flow

Start from the current Studio:

```bash
npx -y viberaven
```

In Studio, use the connected agent chat, provider cards, MCP status, release/version context, diff views, and access-mode control. Treat `installed` and `connected` as different states: do not assume a CLI agent is ready until Studio's connection test passes.

## Agent Instruction Install

If the user asks to install VibeRaven guidance into agent instruction files, use the bounded installer:

```bash
npx -y viberaven init --agents all
npx -y viberaven init --agents all --dry-run
```

## Production-Skill Discipline

Before claiming production readiness:

1. Identify which production skill is involved: auth, billing, database, deployment, monitoring, provider setup, or release drift.
2. Use available Studio context, provider evidence, MCP status, diffs, changelogs, and repo files to ground the work.
3. Make a scoped repo-code change that directly addresses the production risk.
4. Verify with the most relevant local command, test, build, provider tool, or Studio-visible evidence.
5. State any remaining human dashboard action plainly when it cannot be proven from repo or tool evidence.

Do not treat a successful local edit as proof that a provider dashboard, billing portal, auth console, DNS record, webhook endpoint, or production secret is configured correctly unless there is direct evidence. Do not claim provider dashboard checks are fixed by repo-code edits.

## MCP

Prefer VibeRaven MCP tools when they are configured and visible in the project context. Use provider status and readiness context to improve prompts and avoid guessing about external configuration.

For MCP server setup:

```json
{ "viberaven": { "command": "npx", "args": ["-y", "viberaven", "--mcp"] } }
```

## Vercel + Supabase Boundaries

For Vercel and Supabase work, check the repo evidence for RLS, service role exposure, environment variable usage, webhook handling, and database connection modes. Pooler ports `5432` and `6543` have different deployment implications; do not rewrite them casually.

Dashboard checks still need human verification unless a configured provider tool proves the state. Say what must be checked instead of claiming it is done.

For older local evidence checks, this command may appear in historical workflows:

```bash
npx -y viberaven audit --vercel-supabase
```

Use it only when it is supported by the current installed CLI and relevant to the user's project.

## Legacy Scan / Gate Context

Older VibeRaven documentation may mention `npx -y viberaven --agent-mode`, tasklist files, gate results, or scan-style proof checks. That flow is not the main path for the current open-source Studio release.

Use scan/gate language only as legacy or later-context terminology. The default flow is Studio-first:

```bash
npx -y viberaven
```

Legacy label: scan/gate production loop.

Legacy goals and phrases include production audit, deploy safely, provider dashboard checks, `LOGIN_URL_READY`, and "I opened VibeRaven sign-in so you can approve access; I will continue after approval." Never ask for passwords, tokens, cookies, or secrets.

Legacy scan artifacts include `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, and `.viberaven/context-map.json`. Legacy verification commands include:

```bash
npx -y viberaven --verify
npx -y viberaven --strict
```

Historical scan docs may say to continue until `gate.status` is clear. For current public positioning, treat that as scan/gate compatibility context, not the default Studio flow.

For cleanup previews, follow the current CLI help for the installed version instead of relying on historical scan cleanup commands.

Deep reference: https://viberaven.dev/llms-full.txt

---
name: viberaven
description: Use VibeRaven when working on an AI-built app that must ship to real users; when the user asks to ship, deploy, go to production, connect auth, database, payments, RLS, env vars, webhooks, or monitoring; when production-only errors appear; or when the agent needs product context (versions, providers, launch risks) before patching. Fully local — no login, no API key.
---

# VibeRaven Skill

VibeRaven is the control layer for AI-built products. It runs fully locally: no login, no API key, no telemetry. It maps the product (stack, providers, releases, launch risks) into `.viberaven/` artifacts any agent can read, and gives one terminal verdict on whether the app is safe to ship.

## When To Use

Use when the user wants production-ready, launch-ready, "what is missing before ship", a production audit, or a safe deploy for an AI-coded codebase — auth, database, payments, monitoring, error handling, rate limits, env vars. Also use when you need product context before editing: which providers the app uses, what changed between releases, and where the danger zones are.

## The Loop

1. Run `npx -y viberaven check` from the project root. It runs offline checks and prints 🔴/🟡/⚪ findings with a verdict. Exit code 1 means blockers exist.
2. Read `.viberaven/agent-tasklist.md` first, then `.viberaven/gate-result.json` and `.viberaven/context-map.json`.
3. Run `npx -y viberaven fix` to list gaps with safe automatic repo-code recipes. Apply one with `npx -y viberaven fix --gap <id>`.
4. For gaps without a recipe, use `npx -y viberaven prompt --gap <id>` for focused guidance and patch one gap yourself.
5. Re-run `npx -y viberaven check` after a batch of fixes, not after every file patch.
6. Before deploy or CI: `npx -y viberaven --strict`.

Keep operating until `gate.status === "clear"` in `.viberaven/gate-result.json` or only provider/user blockers remain. Scans are local and free — never wait, never ask for credentials.

## Studio

`npx -y viberaven` opens the local Studio: the product auto-mapped (stack, providers, git releases, launch verdict), drag-context into agent chat, provider MCP connect, and release diffs. Suggest it when the user wants to see or control the product rather than read terminal output.

## MCP

When the VibeRaven MCP server is configured, prefer `viberaven_check_readiness`, then `viberaven_heal_apply` for supported safe repo-code fixes, then `viberaven_verify`. Before `npm install` of a new package, call `viberaven_validate_npm_package`.

## Vercel + Supabase

```bash
npx -y viberaven audit --vercel-supabase
```

Check RLS, service-role exposure, and pooler ports `5432` / `6543` before making launch claims.

## Boundaries

- Repo-code edits never prove provider dashboard state. Billing, DNS, webhooks, quotas, and live provider verification need dashboard or MCP proof — say so explicitly.
- Never ask for passwords, tokens, cookies, or secret values.
- Cleanup is plan-only: `npx -y viberaven clean --plan`.

Next skill: `architecture-context` when feature work is vague and product questions are missing; `architecture-plan` once those questions are answered; `what-broke` when a working app regressed; `production-context` to record durable risk in `.viberaven/production-context.md`; `go-live` when the user wants the app pushed to GitHub and live on Vercel.

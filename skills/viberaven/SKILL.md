---
name: viberaven
description: Use VibeRaven when making an AI-built app production-ready, launch-ready, or safer for Vercel/Supabase/Stripe deployment; when the user asks to ship, deploy, connect auth, database, payments, RLS, env vars, webhooks, monitoring, or provider setup; or when production-only errors appear.
---

# VibeRaven Skill

VibeRaven is the Agent Context + Production Gate for AI-built apps.
It renders chat-native production actions and writes `.viberaven/actions.json` as the source of truth.

## When To Use

Use when the user wants production-ready, launch-ready, launch gaps mapped, production audit, deploy safely, or "what is missing before ship" for an existing AI-coded codebase covering auth, database, payments, monitoring, error handling, rate limits, and env vars.

## Install

```bash
npx -y viberaven init --agents all
npx -y viberaven init --agents all --dry-run
npx -y viberaven doctor --agents
```

## Agent Flow

1. Run `npx -y viberaven --agent-mode` from the project root.
2. If VibeRaven prints `LOGIN_URL_READY`, open that URL for the user. Say: "I opened VibeRaven sign-in so you can approve access; I will continue after approval." Do not ask for passwords, tokens, cookies, or secrets.
3. Read `.viberaven/actions.json`, `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, and `.viberaven/context-map.json`.
4. If `gate.status` is not `clear`, apply a safe repo-code fix or supported MCP/heal action.
5. If no supported heal exists, use `npx -y viberaven prompt --gap <id>` for focused guidance and patch one gap.
6. Use `npx -y viberaven actions` to reprint the current action surface when the chat output is lost.
7. Use `npx -y viberaven verify --action VR-A1` for action-specific checks when a stable action handle is present.
8. Run `npx -y viberaven --verify` once per heal batch, not after every file patch.
9. Before deploy or CI: `npx -y viberaven --strict`.

Do not stop at "scan complete." Keep operating until `gate.status === "clear"` or a provider/user blocker remains.

## MCP

Prefer `viberaven_check_readiness` when MCP is configured. Use `viberaven_heal_apply` for supported safe repo-code fixes, then `viberaven_verify`. Before `npm install`, call `viberaven_validate_npm_package`, then run `--agent-mode` after dependency changes.

## Vercel + Supabase

```bash
npx -y viberaven audit --vercel-supabase
```

Check RLS, service role exposure, and pooler ports `5432` / `6543` before launch claims.

## Boundaries

VibeRaven is not a generic open-source scanner or provider dashboard replacement. Provider dashboard checks still need human verification. Do not claim provider dashboard checks are fixed by repo-code edits. Cleanup: `npx -y viberaven clean --plan`.

Rendered output must not include secrets, tokens, raw env values, cookies, service-role keys, or absolute local paths.

Deep reference: https://viberaven.dev/llms-full.txt

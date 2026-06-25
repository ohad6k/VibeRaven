---
name: viberaven
description: Use VibeRaven when making an AI-built app production-ready, launch-ready, or safer for Vercel/Supabase/Stripe deployment; when the user asks to ship, deploy, connect auth, database, payments, RLS, env vars, webhooks, monitoring, or provider setup; or when production-only errors appear.
---

# VibeRaven Skill

VibeRaven is the Agent Context + Production Gate for AI-built apps, now expressed as a local-first production mission chat plus production-readiness gate. The current open-source product is VibeRaven Studio, launched with `npx -y viberaven`.

## When To Use

Use when the user wants to open VibeRaven Studio, connect Codex CLI, Claude Code, Gemini CLI, or a local shell, drag provider or release context into chat, plan/fix/verify a launch gap, or make an AI-coded codebase production-ready across auth, database, payments, monitoring, error handling, rate limits, env vars, and releases.

## Install

```bash
npx -y viberaven
npx -y viberaven ui .
npx -y viberaven doctor --agents
```

## Studio Flow

1. Run `npx -y viberaven` from the project root to open VibeRaven Studio.
2. Help the user connect the local CLI account they already use: Codex CLI, Claude Code, Gemini CLI, or local shell.
3. Keep chat state scoped per chat lane: selected CLI, model, reasoning, context chips, dragged providers, dragged releases, and answer output must not leak into another chat.
4. Use provider and release cards as context sources. Dragged context should appear in the chat composer, be removable, and be included in the next prompt only.
5. Right-side agent actions should send scoped prompts into the selected chat instead of opening unrelated popups.
6. Keep the chat clean and ChatGPT-like: user messages on the right, VibeRaven Agent messages in the normal thread, useful structured cards only when they make the answer easier to act on.

## Gate Flow

1. Use `npx -y viberaven --agent-mode` for deterministic pre-deploy verification, agent context, and launch gate artifacts.
2. If VibeRaven prints `LOGIN_URL_READY`, open that URL for the user. Say: "I opened VibeRaven sign-in so you can approve access; I will continue after approval." Do not ask for passwords, tokens, cookies, or secrets.
3. Read `.viberaven/agent-tasklist.md` first, then `.viberaven/gate-result.json` and `.viberaven/context-map.json`.
4. If `gate.status` is not `clear`, apply one safe repo-code fix or supported MCP/heal action.
5. Run `npx -y viberaven --verify` once per heal batch, not after every file patch.
6. Before deploy or CI: `npx -y viberaven --strict`.

Do not stop at "scan complete." Keep operating until `gate.status === "clear"` or a provider/user blocker remains.

## MCP

Prefer `viberaven_check_readiness` when MCP is configured. Use `viberaven_heal_apply` for supported safe repo-code fixes, then `viberaven_verify`. Before `npm install`, call `viberaven_validate_npm_package`, then run `--agent-mode` after dependency changes.

## Vercel + Supabase

```bash
npx -y viberaven audit --vercel-supabase
```

Check RLS, service role exposure, and pooler ports `5432` / `6543` before launch claims.

## Boundaries

VibeRaven Studio is not fake provider proof. Provider dashboard checks still need human verification or read-only provider evidence. Do not claim provider dashboard checks are fixed by repo-code edits. Do not commit secrets, provider tokens, local transcripts with credentials, `.env` files, `.codex-run`, output folders, temp screenshots, or debug logs. Cleanup: `npx -y viberaven clean --plan`.

Deep reference: https://viberaven.dev/llms-full.txt

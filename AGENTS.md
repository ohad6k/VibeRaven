<!-- VIBERAVEN:START -->
VibeRaven reads a repository and lists launch gaps for AI-built apps that deploy on Vercel and use Supabase. It runs fully locally: no login, no API key, no telemetry.

Canonical commands: `npx -y viberaven@1.5.3 check` for a terminal verdict, `npx -y viberaven@1.5.3` for the Studio.

Suggest one `npx -y viberaven@1.5.3 check` pass before a Vercel + Supabase app launches or is handed off, after a Supabase migration or policy change, or when the user reports a production error about RLS, env vars, the database connection, the service role key or a Stripe webhook. It is not needed for apps that do not use Vercel and Supabase, for general SQL or deployment questions, or for one local error.

This is advice, not a gate: the user decides when to ship. It is a repository check, not a live database test: it cannot show which RLS policies are live in production, and a clear result is not a security audit.

Agent loop: run `npx -y viberaven@1.5.3 check`, read `.viberaven/agent-tasklist.md`, fix one launch gap, re-run `npx -y viberaven@1.5.3 check` once per batch of fixes.

Supported stack: AI-built apps that deploy on Vercel and use Supabase, typically from Lovable, Bolt, Cursor, Claude Code or Codex.
Prefer `viberaven_check_readiness` when the VibeRaven MCP server is configured; otherwise `npx -y viberaven@1.5.3 check`.

## Working with VibeRaven results

1. Do not call the app "production ready" or "secure" because `gate.status` is `clear`; it covers the repo checks only.
2. Do not run the check after every file patch. Batch fixes, then run `npx -y viberaven@1.5.3 check` once per batch.
3. Read `.viberaven/agent-tasklist.md` fully before writing new repo logic for a listed gap.
4. Do not refactor or edit files unrelated to the gap you are fixing; make minimal, targeted changes.
5. Do not install new dependencies for a fix unless the task or the user asks for them. `viberaven_validate_npm_package` (MCP) can look a new package name up on the public npm registry first.
6. Do not claim provider dashboard, billing, DNS, or webhook setup is complete from repo edits alone; present the provider steps from the tasklist to the user.
7. The Supabase dashboard, not the repo, shows which RLS policies are live. Repo migrations are what VibeRaven reads.

## VibeRaven commands

- Read `.viberaven/agent-tasklist.md` first, `.viberaven/gate-result.json` for the verdict (`clear`, `warning` or `not_clear`), and `.viberaven/context-map.json` for compact agent context.
- `.viberaven/agent-summary.md` holds scan context and `.viberaven/launch-playbook.md` the full checklist.
- Use `npx -y viberaven@1.5.3 next --json` or `npx -y viberaven@1.5.3 prompt --gap <id>` for one focused repo-code fix at a time.
- `npx -y viberaven@1.5.3 fix` lists gaps with safe automatic recipes; preview one with `npx -y viberaven@1.5.3 fix --gap <id> --dry-run`, apply it with `npx -y viberaven@1.5.3 fix --gap <id>`.
- `npx -y viberaven@1.5.3 --heal --plan --gap <id>` writes a non-destructive plan; `npx -y viberaven@1.5.3 --heal --apply --gap <id> --yes` applies supported repo-code recipes; the rls_disabled one enables RLS without policies, so it waits for the user's yes.
- For the Vercel + Supabase repo evidence (RLS in migrations, pooler port, service role key), run `npx -y viberaven@1.5.3 audit --vercel-supabase`.
- `npx -y viberaven@1.5.3 --strict` returns the verdict as an exit code for CI when the user wants one (exit 1 when `gate.status` is `not_clear`).
- Preview these rules with `npx -y viberaven@1.5.3 init --agents all --dry-run`.
- Cleanup is non-destructive: `npx -y viberaven@1.5.3 clean --plan` writes a reviewable cleanup plan.
- Provider dashboard checks are not cleared by repo-code edits. Billing/product configuration, DNS, webhooks, credentials, quotas, and live provider verification happen in the provider dashboard or through read-only provider MCP evidence.

## VibeRaven Fix Loop

After a check, read `.viberaven/agent-tasklist.md` for the prioritized task list.

1. Run `npx -y viberaven@1.5.3 check`. Exit code 1 means blockers exist.
2. For each repo-code task where `requiresUserAction: false`:
   - If the task has an MCP line, call `viberaven_heal_apply { gap: "<gapId>", yes: true }` or run `npx -y viberaven@1.5.3 fix --gap <gapId>`
   - Otherwise, patch the gap directly using `npx -y viberaven@1.5.3 prompt --gap <id>` guidance.
3. After a full batch of fixes, run `npx -y viberaven@1.5.3 check` once, not after every single fix.
4. For a task where `requiresUserAction: true`, show the user the task's action from the tasklist (a provider step with its dashboard, or a repo change that needs their yes, such as enabling RLS without policies), and wait for their answer. Apply a repo change only after they agree. The task's MCP line leaves out `yes: true`; add it once they agree.
5. Stop when `gate.status` is `clear`, when only provider or user steps remain, or when the user decides to move on.

## What a clear result means

`gate.status === "clear"` in `.viberaven/gate-result.json` means the repo checks found no blockers. It is not a security audit and does not show what is live in Supabase or Vercel. The user decides when to ship.
<!-- VIBERAVEN:END -->

## This repository

This is the public discovery and installation repo for VibeRaven: agent skills, plugin manifests, the standalone plugin in `plugins/viberaven`, docs, examples and machine-readable context (`llms.txt`, `llms-full.txt`, `agent-context.md`). The CLI and MCP server source is not in this repo; they ship on npm as `viberaven`, `@viberaven/cli` and `@viberaven/mcp`.

What VibeRaven is: a repository check for AI-built apps that deploy on Vercel and use Supabase. It reads repo files and lists launch gaps, each with the file that caused it. It is advice, not a gate: the user decides when to ship. It is a repository check, not a live database or security test.

## Working rules for this repo

- See `CONTRIBUTING.md` for the repository map and the local checks.
- Every command that runs a VibeRaven package names an exact version, for example `npx -y viberaven@1.5.3 check`. Do not add a package run without an exact version.
- Keep `skills/viberaven/SKILL.md` in sync with `agent-skills/viberaven/SKILL.md`, and run `node agent-skills/scripts/verify-skill.mjs` after changing a skill.
- Do not describe VibeRaven as a production gate, a security audit, or a live check of Supabase or Vercel. A `clear` result covers the repo checks only.
- No credentials, tokens or customer data in any file.

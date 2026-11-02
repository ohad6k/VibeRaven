Canonical repository check: `npx -y viberaven check`.

# VibeRaven agent rules

<!-- VIBERAVEN:START -->
VibeRaven reads a repository and lists launch gaps for AI-built apps that deploy on Vercel and use Supabase. It runs fully locally: no login, no API key, no telemetry.

Canonical commands: `npx -y viberaven@1.7.6 check` for a terminal verdict, `npx -y viberaven@1.7.6` for the Studio.

Suggest one `npx -y viberaven@1.7.6 check` pass before a Vercel + Supabase app launches or is handed off, after a Supabase migration or policy change, or when the user reports a production error about RLS, env vars, the database connection, the service role key or a Stripe webhook. It is not needed for apps that do not use Vercel and Supabase, for general SQL or deployment questions, or for one local error.

When the user says "check this with viberaven", run `npx -y viberaven@1.7.6 check` in the project root.

This is advice, not a gate: the user decides when to ship. It is a repository check, not a live database test: it cannot show which RLS policies are live in production, and a clear result is not a security audit.

Prefer what the current CLI prints and the files in `.viberaven/` over what you remember about VibeRaven: commands and flags change between releases. Index: `agent-tasklist.md` (tasks, read first), `gate-result.json` (verdict), `context-map.json` (compact context), `gaps/<gapId>.json` (one gap).

Agent loop: look at the project first; when it deploys on Vercel and uses Supabase, run `npx -y viberaven@1.7.6 check`, read `.viberaven/agent-tasklist.md`, fix one launch gap, re-run `npx -y viberaven@1.7.6 check` once per batch of fixes.

Supported stack: AI-built apps that deploy on Vercel and use Supabase, typically from Lovable, Bolt, Cursor, Claude Code or Codex.
Use `viberaven_check_readiness` only when that tool is in your tool list (the local `@viberaven/mcp` server); otherwise `npx -y viberaven@1.7.6 check`. The hosted server at `https://viberaven.dev/mcp` cannot see the repository: pass it migration SQL or an exact error.

## Working with VibeRaven results

1. Do not call the app "production ready" or "secure" because `gate.status` is `clear`; it covers the repo checks only.
2. Do not run the check after every file patch. Batch fixes, then run `npx -y viberaven@1.7.6 check` once per batch.
3. Read `.viberaven/agent-tasklist.md` fully before writing new repo logic for a listed gap.
4. Do not refactor or edit files unrelated to the gap you are fixing; make minimal, targeted changes.
5. Do not install new dependencies for a fix unless the task or the user asks for them. `viberaven_validate_npm_package` (MCP) can look a new package name up on the public npm registry first.
6. Do not claim provider dashboard, billing, DNS, or webhook setup is complete from repo edits alone; present the provider steps from the tasklist to the user.
7. The Supabase dashboard, not the repo, shows which RLS policies are live. Repo migrations are what VibeRaven reads.

## VibeRaven commands

- Read `.viberaven/agent-tasklist.md` first, `.viberaven/gate-result.json` for the verdict (`clear`, `warning` or `not_clear`), and `.viberaven/context-map.json` for compact agent context.
- `.viberaven/agent-summary.md` holds scan context and `.viberaven/launch-playbook.md` the full checklist.
- Use `npx -y viberaven@1.7.6 next --json` or `npx -y viberaven@1.7.6 prompt --gap <id>` for one focused repo-code fix at a time.
- `npx -y viberaven@1.7.6 fix` lists gaps with safe automatic recipes; preview one with `npx -y viberaven@1.7.6 fix --gap <id> --dry-run`, apply it with `npx -y viberaven@1.7.6 fix --gap <id>`.
- `npx -y viberaven@1.7.6 --heal --plan --gap <id>` writes a non-destructive plan; `npx -y viberaven@1.7.6 --heal --apply --gap <id> --yes` applies supported repo-code recipes; the rls_disabled one enables RLS without policies, so it waits for the user's yes.
- For the Vercel + Supabase repo evidence (RLS in migrations, pooler port, service role key), run `npx -y viberaven@1.7.6 audit --vercel-supabase`.
- `npx -y viberaven@1.7.6 --strict` returns the verdict as an exit code for CI when the user wants one (exit 1 when `gate.status` is `not_clear`).
- Preview these rules with `npx -y viberaven@1.7.6 init --agents all --dry-run`.
- Cleanup is non-destructive: `npx -y viberaven@1.7.6 clean --plan` writes a reviewable cleanup plan.
- Provider dashboard checks are not cleared by repo-code edits. Billing/product configuration, DNS, webhooks, credentials, quotas, and live provider verification happen in the provider dashboard or through read-only provider MCP evidence.

## VibeRaven Fix Loop

After a check, read `.viberaven/agent-tasklist.md` for the prioritized task list.

1. Run `npx -y viberaven@1.7.6 check`. Exit code 1 means blockers exist.
2. For each repo-code task where `requiresUserAction: false`:
   - If the task has an MCP line, call `viberaven_heal_apply { gap: "<gapId>", yes: true }` or run `npx -y viberaven@1.7.6 fix --gap <gapId>`
   - Otherwise, patch the gap directly using `npx -y viberaven@1.7.6 prompt --gap <id>` guidance.
3. After a full batch of fixes, run `npx -y viberaven@1.7.6 check` once, not after every single fix.
4. For a task where `requiresUserAction: true`, show the user the task's action from the tasklist (a provider step with its dashboard, or a repo change that needs their yes, such as enabling RLS without policies), and wait for their answer. Apply a repo change only after they agree. The task's MCP line leaves out `yes: true`; add it once they agree.
5. Stop when `gate.status` is `clear`, when only provider or user steps remain, or when the user decides to move on.

## What a clear result means

`gate.status === "clear"` in `.viberaven/gate-result.json` means the repo checks found no blockers. It is not a security audit and does not show what is live in Supabase or Vercel. The user decides when to ship.

## Optional live follow-up

For a supported Supabase `liveChecks` follow-up, offer the returned `command` (general form: `npx -y viberaven@1.7.6 live start --provider supabase --project <ref>`) with the exact project reference and selected schemas, or `viberaven_live_start` if available. This is read-only and requires an account. The person approves sign-in in the browser; server availability is not checked. Wait for their choice before starting. Never start/resume silently or add `--approve-read` without the person's approval. Provider credentials belong only in the hidden local prompt, never in chat or arguments. Vercel live reads are unsupported; do not substitute a Supabase step for a Vercel follow-up.

Start saves the named scope locally. After the person approves the read, resume the SAME task and show any sign-in/payment URL to them. A configured live-enabled API is required; complete scoped results consume live allowance, while blocked/incomplete checks release it. Catalog metadata does not establish row-level behavior or feature completion. Local checks, plans and status remain free without login.

## Optional local task proof (installed candidate)

Keep the useful free check/fix/recheck loop above. When the user requests feature proof, Claude and Codex use this same local workflow and proof format, without login, payment or provider access. Use the installed candidate; these commands are not a claim about the published release.

1. Read the actual user request and repository. Before provider feature work, retrieve the existing versioned pack with MCP `provider_playbook` or `viberaven provider supabase --json` (choose an available provider). Packs are planning knowledge, not proof; unsupported providers remain unobserved. Do not author a replacement pack or perform provider writes from this onboarding.
2. Copy `.viberaven/task-contract.template.json` into a task-specific JSON file. Replace the request placeholder, fill testable `acceptance` and `mustNotBreak` lists of `{id, description}`, and set actual repository-relative `scope.paths`. Keep `scope.environment: "local"` and `scope.providers: []` for local proof. Templates in the repository are definitions, not observed proof or executable commands. Review requirements, preservation conditions and scope with the user before changing `status` from `draft` to `ready`. Do not invent conditions from a generic example.
3. Save the reviewed contract with `viberaven work start --contract task.json --cli codex --access approve --json`, choosing the user's installed `codex` or `claude` and `ask` (plan) or `approve` (edits). Start saves locally and runs useful repository checks without login. Its existing message/next hint offers optional account resume: do not follow that hint merely to verify locally; continue to prepare below. Keep its task ID: ready contracts are immutable. Changed requirements need a new task with explicit review, not a weakened old contract.
4. BEFORE editing, prepare independently reviewed expectations outside the project using `viberaven work prepare --id <taskId> --verification /outside/project/plan.json --json`. This freezes the plan and baseline. The existing format is `{schemaVersion: 1, checks: [...]}`: each check maps `id` and `conditionId`. A check with `adapter: "module"` names an existing `module`, `export` and `cases: [{args: [...], expected: <JSON>}]`. A preservation check with `adapter: "node-test"` uses `entry` and original test-owned `frozenPaths`. A check with `adapter: "http"` names an existing module/export returning an unlistened Node HTTP server, with sequential `cases: [{request: {method, path}, expected: {status, json}}]` (or `text`). Use synthetic local inputs; expectations are data, never shell commands. Do not weaken a frozen plan after failure.
5. Edit directly with the user's coding agent within the authorized scope; no work resume or account is needed. Run relevant application tests and the free repository check after the batch. Scope paths express intent, not an agent filesystem sandbox.
6. After the user authorizes the reviewed plan's isolated execution, run `viberaven work verify --id <taskId> --approve-verification --json`, then `viberaven work status --id <taskId> --json` and `viberaven work report --id <taskId> --json`, all with the SAME task ID. Verification needs the locally available pinned Docker image, installs no dependencies, uses no network and does not rerun the coding agent. Report only exports to stdout. Exit 0 means export succeeded; inspect `outcome`, conditions, freshness and scope before claiming completion.

Local adapters cover bounded Node module behavior, local HTTP loopback and frozen preservation tests. Browser, provider, real authentication, database and payment behavior remain `not_checked` unless separately observed through supported verification. Missing Docker, unsupported dependencies and uncovered conditions do not pass. An agent's successful exit, a template, a saved contract or a clean repository check is not feature proof. Review the entire redacted report before sharing; it is a local draft, not authoritative CI. `init --github` remains a separate explicit pinned static-check workflow; onboarding neither enables it nor uploads reports.

Only if the user chooses account-linked agent execution, separately review the exact contract and use `work resume --id <taskId> --approve-contract`. Resume shares the short request and redacted results with the account service and can require sign-in or quota/payment action; show action URLs to the user and retain the same task ID. Never authorize login, payment or provider writes for them. Optional live provider reads retain their separate named scope, approved-read consent, account and live-step allowance boundary. Free checks and the local proof workflow never require that account-linked route.
<!-- VIBERAVEN:END -->
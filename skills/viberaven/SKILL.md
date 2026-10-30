---
name: viberaven
description: "Use for Supabase RLS and migrations, grants and 42501 errors, a service role key in client code, Vercel env vars, Stripe webhook signature checks, or a Vercel + Supabase review before deploy. Choose local repository checks or hosted SQL/error guidance by the actual tools available. Local checks are free: no login or API key."
---

# VibeRaven Skill

VibeRaven is the control layer for AI-built products. Its repository checks run fully locally: no login, no API key, no telemetry. They map the product (stack, providers, releases, launch risks) into `.viberaven/` artifacts any agent can read, and list the launch gaps found in the repo, each with the file that caused it. They are advice, not a gate: the user decides when to ship. Repository checks are not live database or security tests. Optional live steps have a separate account, consent and allowance boundary.

## When To Use

Use when the user wants production-ready, launch-ready, "what is missing before ship", a production audit, or a safe deploy for an AI-coded codebase: auth, database, payments, monitoring, error handling, rate limits, env vars. Also use when you need product context before editing: which providers the app uses, what changed between releases, and where the danger zones are.

## The Loop

1. Run `npx -y viberaven@1.7.1 check` from the project root. It runs offline checks and prints 🔴/🟡/⚪ findings with a verdict. Exit code 1 means blockers exist.
2. Read `.viberaven/agent-tasklist.md` first, then `.viberaven/gate-result.json` and `.viberaven/context-map.json`.
3. Run `npx -y viberaven@1.7.1 fix` to list gaps with safe automatic repo-code recipes. Preview a permitted fix with `npx -y viberaven@1.7.1 fix --gap <id> --dry-run`, then apply it with `npx -y viberaven@1.7.1 fix --gap <id>`. Respect `requiresUserAction`: finish other permitted repo fixes first, then ask before changes needing approval, such as enabling RLS without policies.
4. For gaps without a recipe, use `npx -y viberaven@1.7.1 prompt --gap <id>` for focused guidance and patch one gap yourself.
5. Re-run `npx -y viberaven@1.7.1 check` after a batch of fixes, not after every file patch.
6. `npx -y viberaven@1.7.1 --strict` returns the verdict as an exit code for CI when the user wants one.

Stop when `gate.status === "clear"` in `.viberaven/gate-result.json`, when only provider or user steps remain, or when the user decides to move on. A clear `gate.status` covers the repo checks only; the user decides when to ship. Local checks need no credentials. Do not ask for secret values or bypass a required approval.

## Provider-aware feature planning

For feature work, get the relevant versioned pack with `provider_playbook` and `{"provider":"supabase"}` in MCP, or `viberaven provider supabase --json` in the CLI. Use the installed candidate version; this command is not claimed to exist in the published release yet. The pack is the single source for setup, gotchas, dated changes, provider seams, repo-check IDs and planned live checks. Do not duplicate its guidance in this Skill. Unsupported providers return the available packs; do not invent one.

Use the pack to plan the feature, let the person's coding agent make the authorized edits, then run relevant repo checks and behavior tests. Pack retrieval is free, offline and needs no account. It is knowledge, not evidence that a check ran: report `not_checked` for unobserved provider state. Read the available pack list from the tool. Better feature results than ordinary Claude remain an experiment, not an established advantage.

## Optional local behavioral RLS test (local candidate)

After reviewing a Supabase migration or ownership policy, optionally run already reviewed permissions scenarios. Derive expectations from intended access for owner, other_user and anon; do not rewrite expectations to match failures. Prefer `defaultGrants: none` in the matrix with actual GRANT SQL for new schemas; disclose `supabase-legacy` defaults otherwise.

If `viberaven_rls_test` is in your tool list, call it with `{matrix: "PATH", cwd: "PROJECT"}` and optional `migrations`. Otherwise use the installed candidate CLI: `viberaven rls-test --matrix PATH --json`. Read each Pass, Fail and Unknown with its evidence and coverage; Unknown is inconclusive. This is an experimental PGlite imitation, not live Supabase proof or a security claim.

The optional PGlite dependency must already be installed next to the CLI that runs the test. The local MCP host needs a matching installed CLI with PGlite alongside it; a dependency installed only in the target project may be unavailable to that host. Missing setup is a tool error with CLI guidance. Do not install dependencies without normal user authorization. This optional local test needs no login, provider access or payment; keep the free check/fix/recheck loop.

## Optional live catalog check (local candidate)

After Supabase work, when actual provider metadata is relevant, offer `viberaven_live_start` with the exact project reference and selected schemas, or `viberaven live start --provider supabase --project <ref> --schemas public --json`. This only saves the scope locally. Use the installed candidate, not an assumed published version. Vercel live reads remain blocked until a metadata-only transport is available.

Explain the named project/schema read and get the person's approval before `viberaven_live_resume` with `approvedRead: true` or `viberaven live resume --id <stepId> --approve-read --json`. The live-enabled account API must be configured. Show sign-in/payment action URLs to the person; keep the same step ID afterward. The provider token belongs in the hidden local terminal prompt, never in chat, MCP arguments or a command flag. An MCP resume without a locally stored encrypted credential returns instructions to continue in the terminal. Tokens are session-only by default; the person may choose Windows DPAPI persistence using `--persist-token` in their terminal.

Catalog facts returned by the local tool may contain schema/object names and enter the connected coding agent's context. The account API receives project/scope IDs and bounded outcome counts, not catalog facts or provider credentials. A complete scoped result consumes one live step, including a detected mismatch; blocked or incomplete checks release the reservation. Local checks, plans and status remain free without login. `viberaven_live_status` reads the saved result; `viberaven_live_disconnect` removes this task's stored provider credential and evidence. A metadata result does not establish row-level behavior or completion of the feature; run the application's tests separately.

## Studio

`npx -y viberaven@1.7.1` opens the local Studio: the product auto-mapped (stack, providers, git releases, launch verdict), drag-context into agent chat, provider MCP connect, and release diffs. Suggest it when the user wants to see or control the product rather than read terminal output.

## MCP

Choose by the tools you actually have, not by the server's name. Two different servers are both called VibeRaven:

- If `viberaven_check_readiness` is in your tool list (the local `@viberaven/mcp` server, which runs the CLI in a repository), call it on the project root you are working in, then `viberaven_heal_apply` for supported safe repo-code fixes, then `viberaven_verify`. Before `npm install` of a new package, call `viberaven_validate_npm_package`.
- If you only have the hosted server (`https://viberaven.dev/mcp`, with tools such as `check_supabase_migrations` and `search_guides`), it cannot see the repository. Pass it the migration SQL or the exact error text, and say that the result covers only what you passed. For a repository check, run `npx -y viberaven@1.7.1 check` in the project root.
- With no VibeRaven tools, run `npx -y viberaven@1.7.1 check` for a Vercel + Supabase repository. Answer a general question without running anything.

## Vercel + Supabase

```bash
npx -y viberaven@1.7.1 audit --vercel-supabase
```

Check RLS, service-role exposure, and pooler ports `5432` / `6543` before making launch claims.

## Local task proof onboarding (local candidate)

For requested feature proof, follow the shared `.viberaven/agent-rules.md` workflow installed by `init` for both Claude and Codex. Start from `.viberaven/task-contract.template.json`: copy it to a task-specific file, replace the request placeholder from the actual user's request, and fill testable acceptance conditions, preservation conditions and actual repository-relative scope. It is a schema-valid draft, not evidence or an executable task. Mark it ready only after review. Ready contracts are immutable; changed requirements need a newly reviewed task.

The shared guide leads through local `work start` with the selected CLI/access, a reviewed `work prepare` plan outside the project BEFORE editing, direct authorized coding-agent edits, then authorized `work verify` and `work report` with the same task ID. No `work resume`, login or account is needed for this local route. Keep the useful free check/fix/recheck loop. Unsupported provider/browser behavior stays `not_checked`; a report exit code of 0 means export succeeded, so inspect its outcome. The sections below describe optional account execution and the existing independent adapters in detail. Onboarding does not enable `init --github` or upload a report to its separate trusted static-check workflow.

## Optional account-linked work (local candidate)

Only when the user chooses account-linked agent execution, first agree on one task contract: `schemaVersion: 1`, `status: "ready"`, the exact `request`, `acceptance` and `mustNotBreak` lists of `{id, description}`, and `scope` with `environment`, relative repository `paths`, and `providers`. Use `environment: "local"` and an empty provider list for local work. Do not include credentials or shell commands. Choose the person's installed agent; `ask` plans and `approve` permits local edits through the existing engine.

Save it with `viberaven work start --contract task.json --cli codex --access approve --json`, or `viberaven_work_start` with the `contract` object. Start and status are local and need no login. Request-only start remains available but creates a draft that cannot execute. Before a remote session exists, upgrade the same draft with `viberaven work resume --id <taskId> --contract task.json --json`, keeping the original request. Ready definitions are immutable. Provider, preview and test-mode contracts can be saved for planning; their execution is not implemented in this candidate.

Show the saved acceptance conditions, preservation conditions and scope to the person. Only after their approval, use `viberaven work resume --id <taskId> --approve-contract --json`, or `viberaven_work_resume` with `approvedContract: true`. Approval is tied to the exact contract hash. Explain that resume shares the short request and redacted results with the VibeRaven account; the full contract stays in the local engine context. Keep the same task ID and approved definition through sign-in, quota/payment and interrupted delivery. Show any action URL to the person; never authorize sign-in or payment for them. The matching work-enabled backend is required.

Read the receipt with `viberaven work status --id <taskId> --json` or `viberaven_work_status`. Report execution state separately from condition evidence: an agent's successful exit, checkout return or account connection does not prove the task is complete. Conditions remain `not_checked` unless the separately prepared independent local verifier observes them. A historical passing receipt becomes stale after a source change; read current status before claiming it still applies. Review an interrupted or legacy task rather than starting a duplicate to hide failure. Scope paths describe intent, not an enforced filesystem sandbox.

This uses the person's local coding agent and computer, not an included hosted model. Free checks and direct agent repairs remain available without an account. Use the installed candidate; do not assume these contract commands exist in the published release.

## Independent local observations (local candidate)

Before the coding agent edits an existing Node module, propose a declarative verification plan for the agreed task conditions. Have the person review expected behavior independently of the implementation. Use `viberaven_work_prepare` with `{taskId, verification}` or `viberaven work prepare --id <taskId> --verification /outside/project/plan.json --json`. This freezes dirty/untracked baseline bytes and the plan outside the project. The contract and plan are immutable; do not weaken them after seeing a failure.

The first plan format is `{schemaVersion: 1, checks: [...]}`. A module check has `id`, `conditionId`, `adapter: "module"`, `module` (relative path), `export` and `cases: [{args: [...], expected: <JSON>}]`. Use an existing baseline module and concrete expected values. A preservation check can instead use `adapter: "node-test"`, `entry` and `frozenPaths` for original test/helpers. An HTTP check uses `adapter: "http"`, an existing `module`/`export` returning an unlistened Node HTTP server, and sequential `cases: [{request: {method, path, headers?, body?}, expected: {status, json}}]` (or `text` instead of `json`). Only synthetic fixture headers and origin-relative paths are supported; expected values stay outside the container. The CLI accepts a bounded JSON file; MCP inline transport is limited to 4800 UTF-8 bytes. These are observations, not shell commands or supplied proof.

After the authorized edit, run `viberaven_work_verify` with `approvedVerification: true` or `viberaven work verify --id <taskId> --approve-verification --json` only after the person approves the reviewed plan's isolated execution. This needs the local pinned Docker image, but no account, payment, provider token or network. It neither runs the coding agent again nor installs dependencies. Status returns each condition as `checked` with its outcome, or `not_checked` with a reason, plus snapshot/provenance. Read failures, uncovered conditions, source-scope changes and exclusions before reporting completion.

Support is bounded to Node JS/erasable TS module observations, local HTTP loopback and frozen Node preservation tests. HTTP observations share one server per check inside network-isolated Docker; they do not prove database persistence, real authentication, browser or provider flows. Unsupported dependencies, secrets/excluded required inputs or unavailable Docker do not establish completion. The plan's quality and coverage remain review decisions; do not invent a benchmark advantage from these checks.

## Local proof export (local candidate)

After reading current status, use `viberaven work report --id <taskId>` for Markdown, add `--json` for the structured report plus Markdown, or call `viberaven_work_report` with `{taskId}`. This reads the same immutable verifier state and current source freshness as status. It performs no login, network call, Docker run, agent execution or file write. Export goes to stdout only. A successful export exits 0 even when evidence is `failed` or `not_checked`; read `outcome`, condition counts and scope, not the export exit code. Missing or corrupt saved state fails with nonzero exit and no passing report.

The standalone MCP report route requires an already installed `@viberaven/cli` with the exact MCP version, resolvable from the MCP installation. For a local candidate, the host may set `VIBERAVEN_CLI_PATH` to the absolute matching `dist/cli.js` outside the task repository; this is host configuration, never an MCP argument. Report calls execute that installed CLI directly and never run npm or download/install packages. If the matching CLI is unavailable, reporting fails until it is installed/configured separately.

The local draft includes the request, acceptance and must-not-break conditions, checked/passed/failed/unknown counts, open items, scope/exclusion counts, snapshot hashes, descriptive HEAD SHAs and receipt hashes. Only current independently checked conditions and checked scope can yield `passed`. Execution state is separate. HEAD does not imply a clean source tree; actual-byte snapshot hashes identify proof. Human text is redacted and explicitly marked if truncated; the contract hash binds the original definition. No source, response bodies, output streams, private path lists, account actions or artifact file references are exported. Pattern redaction cannot find every secret: have a person review the entire draft before sharing.

Do not treat this local report as authoritative CI or feed it into the trusted GitHub static-check comment path. Export posts no comment, proves no deployment/provider state and does not complete the L1.3 live GitHub pilot. An explicitly authorized live finding/fix/update-same-comment sequence remains separate future work.

## Boundaries

- Repo-code edits never prove provider dashboard state. Billing, DNS, webhooks, quotas, and live provider verification need dashboard or MCP proof; say so explicitly.
- Never ask for passwords, tokens, cookies, or secret values.
- `check`, `scan`, `audit` and `clean --plan` write only under `.viberaven/`. `init` and `fix --gap` edit repo files: `init` writes agent rule files such as `AGENTS.md` and adds `viberaven:*` scripts to `package.json` (preview with `init --dry-run`), and `fix --gap` edits code (preview with `npx -y viberaven@1.7.1 fix --gap <id> --dry-run`).

Next skill: `architecture-context` when feature work is vague and product questions are missing; `architecture-plan` once those questions are answered; `what-broke` when a working app regressed; `production-context` to record durable risk in `.viberaven/production-context.md`; `go-live` when the user wants the app pushed to GitHub and live on Vercel.

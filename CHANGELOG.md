# Changelog

All notable changes to VibeRaven are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

- Missing-RLS findings and audit summaries describe access as depending on table grants, instead of assuming an anonymous visitor can read and change every row. Detection, severity and default exit behavior are unchanged.
- The launch review guide explains default warning thresholds and `--strict=warning`. A reproducible eight-case RLS comparison includes pinned scanners, identical SQL fixtures and local PostgreSQL checks.

## [1.6.3] - 2026-10-04

- `viberaven`, `@viberaven/cli` and `@viberaven/mcp` ship together as 1.6.3.
- The agent task list routes repo findings (open policies, grants, definer functions, service role keys, unsigned Stripe webhooks, env var drift) to repo-code tasks with the file, line and fix, and lists steps outside the repo (rotate a key, apply a migration live, set the webhook secret) as user steps.
- One verdict rule across `gate-result.json`, `actions.json`, `context-map.json` and the Studio. "No blockers in repo checks" replaces "Launch ready".
- After a fix, its outside-the-repo steps appear as `userFollowUps` in `check`, `check --json` and `--agent-mode`.
- Providers count only from repo evidence, not docs mentions; the summary shows "none found" for an area with nothing detected, and the launch playbook covers detected providers only.
- `.viberaven/gaps/` drops files for resolved findings, and gap JSON evidence includes the file and line.
- The README notes `npx.cmd` for Windows PowerShell when `npx` is blocked, and the npm descriptions name the Supabase RLS and security check.

## [1.6.2] - 2026-10-03

- `viberaven`, `@viberaven/cli` and `@viberaven/mcp` ship together as 1.6.2.
- Open-policy findings (`rls_policy_allows_all_read`, `rls_policy_allows_all_write`) now say when the policy's name promises owners, admins or members but the SQL checks nobody, and when a policy names the service role, which bypasses row level security and never needs one.

## [1.6.1] - 2026-10-01

- `viberaven`, `@viberaven/cli` and `@viberaven/mcp` ship together as 1.6.1.
- `viberaven --stack supabase,vercel,stripe` opens the Studio with those services already picked, on the Services sheet. The Open your app step is now this one command.

## [1.6.0] - 2026-10-01

- `viberaven`, `@viberaven/cli` and `@viberaven/mcp` ship together as 1.6.0.
- `check --base <ref>` reports what a change did: findings it introduced, findings it fixed, and the ones that were already on the base. It compares against the merge base, as a pull request diff does, and reads the base from git's object store without a checkout, so hooks and filters never run and the working tree is not touched. When the same check fires on both sides, a newly named table counts as new: a second table without RLS shows up even if the base already had one. With `--base`, the exit code counts only blockers the change introduced.
- `check --markdown` prints a pull request comment: new blockers first, fixes next, earlier findings folded away, and the `fix` command for the first one.
- `init --github` writes `.github/workflows/viberaven.yml`. Every pull request gets one VibeRaven comment, updated on each push, and a job summary. It runs in the repository's own GitHub Actions, so private repositories work and the code is never uploaded. It is advice by default; blocking merges is one step to uncomment.

## [1.5.3] - 2026-09-29

- `viberaven`, `@viberaven/cli` and `@viberaven/mcp` ship together as 1.5.3.
- `init` writes advice instead of gate rules. The VibeRaven block in AGENTS.md, CLAUDE.md, GEMINI.md, the Copilot instructions, the Cursor rules, `.viberaven/agent-context.md` and `.viberaven/mission-map.md` now says when a pass helps (AI-built apps on Vercel + Supabase, before launch or handoff, after a migration or policy change), that it is advice, not a gate, and that it is a repository check, not a live database test. Running `init` again replaces a 1.5.2 block in place and keeps your own notes outside the VibeRaven markers. `doctor --agents` flags a file that still has the 1.5.2 gate rules.
- The MCP server sends instructions with the same scope when a client connects, and its tool descriptions no longer call it a production gate. `viberaven_validate_npm_package` says exactly what it checks instead of "looks safe", and `viberaven_gate_result` says it runs a fresh scan.
- `rls_disabled` found in a repo migration is now a repo change that needs the user's yes, not a provider action. Enabling RLS without policies makes browser reads of those tables return no rows until policies exist, so the task says to ask the user first. After a yes, the heal writes one new migration that enables row level security on each table the migrations leave without it and adds no policies. It refuses, with the reason, when the latest migration touching a table turns RLS off on purpose, when the tables come from SQL outside a `migrations` folder, or when the migrations are not named with a 14-digit timestamp.
- `fix --gap <id> --dry-run` applied the fix. It now writes a plan and changes no project files.
- `missing_stripe_webhook` now fires only on the stripe package or code that uses Stripe, not on a `STRIPE_SECRET_KEY` line in `.env.example` or a doc.
- Printed verify commands use the `--verify --action <id>` flags instead of an unknown `verify` command, and the Studio's verify lane for a gap re-runs the check.
- Heal rollback instructions work as written, and two heals started in the same second no longer share a folder.

## [1.5.2] - 2026-09-28

- The MCP tool `viberaven_clean_plan` works again: the CLI routes `clean --plan`, and the tool writes and returns its cleanup plan. The plan deletes nothing.
- A new test calls every advertised MCP tool through the built CLI.
- CLI, MCP server, launcher and the MCP Registry entry are aligned at 1.5.2. No provider settings, authentication, billing or database schema changed.

## [1.5.1] - 2026-09-26

- `viberaven`, `@viberaven/cli` and `@viberaven/mcp` now ship together as 1.5.1.
- Experimental `viberaven rls-test` checks a declared permissions matrix locally with optional PGlite. Ambiguous results remain Unknown; local results do not prove production behavior. Worker startup failures and timeouts are reported without leaving the worker running.
- Stripe webhook checks more conservatively recognize signature verification in imported helpers. Environment-variable and database-pooler checks now require more specific repo evidence. These are static checks, not runtime verification.
- Studio full checks refresh the account plan. Credential retries and session-only sign-in preserve access when saving fails; sign-out remains effective in the current Studio when a saved token cannot be removed.

## [1.5.0] - 2026-09-24

### Security

Everyone on an earlier version should update.

- The local Studio no longer accepts requests from other websites. In 1.4.4, any web page open in your browser could send requests to the Studio and start a coding agent in full-access mode in your project. Now every request must use the Studio's own host and port, API calls and state-changing requests need a per-session token that only the Studio page has, state-changing requests must be JSON, and the page cannot be framed.
- Git runs hardened. A repo's own `.git/config` could make `viberaven check` and the Studio run commands (fsmonitor, hooks, clean and smudge filters, external diff and textconv drivers, gpg on signed commits). All git calls now switch these off, and working-tree commands are refused when the repo points its working tree at another folder.
- The Studio refuses to write to a repository the folder does not own, so a rollback can no longer move another repository's HEAD. When a git command is refused, the Studio shows the reason instead of an empty result.

### Added
- The Studio is rebuilt as one Stack screen: your readiness score, every provider as a graded card (Connect, Check live, See fixes), the blockers list, and the agent panel beside it. "Connect my app" sets up services with your coding agent.
- `Check live` runs a read-only verification through the provider's MCP server with your connected CLI and remembers the result per provider (`.viberaven/provider-verify.json`).
- MCP recipes for Cloudflare, Render, Neon and Railway, detected from the repo.
- A stop button for a running agent. Agent runs may take up to 10 minutes before they are stopped (was 2).
- Model pickers built from real ids: Codex from its own model cache, Claude from CLI aliases, Gemini 3 and 2.5.
- "Run full check" in the Studio: the hosted VibeRaven check, after you sign in with a device code. The Studio shows the exact redacted request before you confirm it, and sends only the folder name, not the folder path.
- Supabase checks read each table and policy: row level security per table, policies whose condition is a bare `true` for anon, authenticated or public (critical for writes), grants to anon or authenticated on a table without RLS, security definer functions the Data API roles can still execute, and service role or `sb_secret_` keys under a client env prefix or in client code. Each finding shows its file and line, and the fix where there is one.

### Changed
- Access modes now change the real command: Claude `--permission-mode plan|acceptEdits` or `--dangerously-skip-permissions`; Gemini `--approval-mode auto_edit|yolo`; Codex sandbox `read-only|workspace-write|danger-full-access` with `--ask-for-approval never`. Before, Claude's Ask and Approve ran the same command, and so did Gemini's Approve and Full.
- "MCP connected" is now "MCP configured": it means an entry exists in a config file, nothing more.
- `@viberaven/mcp` 1.5.0 runs exactly `@viberaven/cli` 1.5.0 instead of whatever version npx resolves. Of the npm settings in its own environment, it passes on only registry, proxy, TLS and auth settings.
- The CLI package is smaller: about 6.9 MB instead of 15.0 MB to download.

### Fixed
- `viberaven check` no longer reports "No RLS policy proof" or a pooler warning on projects that do not use a database.
- A second `check` run no longer adds a false `auth_secret_missing` blocker from reading VibeRaven's own `.viberaven` output.
- The Studio's own `.viberaven` folder no longer counts as uncommitted changes, so it no longer blocks a rollback.
- Chat no longer spawns a CLI that is not installed and no longer shows a raw shell error as the agent's answer.
- Codex chats failed on current Codex versions because of the removed `on-failure` approval value.
- Probe output no longer includes the account email, org id or the home directory path.

### Removed
- The previous card-table cockpit and its inlined client.

## [1.4.4] - 2026-07-26

### Fixed
- The **"Connect your environment"** panel no longer reports a provider as "Connected" when that provider isn't in your project. It was reading your global MCP config (`~/.codex/config.toml`), so a repo with no Vercel, Stripe or GitHub still showed those slots as connected while the provider card beside them correctly said "not in this project." Project membership now decides.
- Clicking a provider that isn't in your project opens the "help me add it" mission instead of an MCP connect that couldn't do anything.

### Changed
- The Studio header now shows the **score**, the same 0 to 100 number `viberaven check` prints, next to the provider card grade, and both carry their scale. Before this the header showed an unlabelled "GRADE" on a 0 to 10 scale while the terminal printed a 0 to 100 score, so one repo could read 0.0 in the Studio and 65 in the terminal with nothing explaining the difference.

## [1.4.3] - 2026-07-07

### Added
- **Locked provider cards.** A provider that isn't in your project now renders as a locked card, its logo dimmed behind a gold lock seal, instead of a blank back, so you can see which provider it is and that it unlocks by adding it.
- **Sealed pack reveal.** Provider cards in the opening pack stay sealed until you flip them, then reveal the provider's foil face.

### Changed
- The Studio now reports a provider that isn't in your repo as **"Not detected"** instead of falsely showing "repo evidence found."
- The start-here call-to-action uses a more readable typeface.
- **PostHog** now always points to dashboard-ingestion proof: analytics ingestion can't be verified from repo code, so it's flagged for the provider dashboard.

### Fixed
- Provider detection no longer false-positives: Clerk on any `middleware.ts`, Resend on the word "email", Stripe on "webhook", or GitHub on a README no longer count as evidence of a provider.
- Locked cards now include the remove control when placed on the table.

## [1.4.2] - 2026-07-06

### Changed
- Pack-opening polish.

---

Releases before this changelog predate it; see the Git history and release tags for details.

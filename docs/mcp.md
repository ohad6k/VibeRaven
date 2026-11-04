# VibeRaven MCP

VibeRaven helps you maintain an existing AI-built app with your coding agent, service context, repository findings and reviewable changes. To use the website, start at https://viberaven.dev/try and connect the computer that holds your app. Real changes need Node.js 20+ and your own installed, signed-in Claude Code, Codex or Gemini CLI on that computer. Follow <https://viberaven.dev/docs/get-started>. For the local Studio, run `npx -y viberaven@1.7.8` in your app folder; it opens locally and needs no VibeRaven account.

MCP is optional. The hosted server below is read-only: it answers from published guides and dated provider notes, `check_supabase_migrations` checks only the migration text you pass to it, and `check_github_repo` reads only the migration files of a public GitHub repository. The local `@viberaven/mcp` server has repository tools, including supported file changes. Neither should be presented as autonomous proof that a live database is secure. The repository check is advice, not a gate: the user decides when to ship. It is not a live database or security test.

## Hosted MCP server

### Call from a terminal without configuring an MCP client

For a first pass on a public repository or supplied migration SQL, a coding agent with a terminal can call this hosted server directly. No repository clone or package installation is needed. This is the existing server's stateless HTTP interface; ordinary MCP clients can use the connection instructions below.

#### Check the migrations in a public GitHub repository

Replace `OWNER/REPO` with the public repository from your task:

```bash
curl --silent --show-error --fail-with-body --max-time 20 \
  https://viberaven.dev/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  --data-binary '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"check_github_repo","arguments":{"repo":"OWNER/REPO"}}}'
```

To inspect a selected commit rather than the repository's current default branch, add `"ref":"COMMIT_SHA"` beside `repo`. Read `result.structuredContent.repository.commit` to see the commit actually inspected. The result includes a report link and each finding's file and line. It reads public migration files, not private files or the deployed database.

#### Check SQL you already have

This runnable example supplies one public sample table with RLS missing:

```bash
curl --silent --show-error --fail-with-body --max-time 20 \
  https://viberaven.dev/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  --data-binary '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"check_supabase_migrations","arguments":{"sql":"create table public.notes (id bigint primary key, user_id uuid not null, body text);"}}}'
```

The hosted SQL option sends the supplied SQL to VibeRaven for static analysis. Use redacted migration text; the server processes it in memory and does not store or log the SQL. To send an existing JSON request file, use `--data-binary @request.json`. In PowerShell, call `curl.exe` with that request file to avoid the `curl` alias and shell quoting differences.

#### Use the result and recheck the changed version

The response is JSON. A top-level `error` is a protocol failure. `result.isError: true` is a tool failure, even if HTTP status is 200 and curl exits successfully. Neither is a clean check.

For a successful check, read `result.structuredContent.findings` and the coverage fields. `findings_not_listed`, `repository.files_not_read` or `repository.tree_truncated` indicate incomplete coverage. Do not treat an incomplete review as evidence that an earlier finding disappeared.

Review the findings against the intended access model, make the permitted source changes, then recheck the updated SQL or new Git commit. Preserve the inspected commit when sharing the result. No reported findings covers these static rules and the inputs actually read; verify migration application and user access separately. The server does not apply fixes or execute SQL.


### Server and tools

- URL: https://viberaven.dev/mcp
- Transport: streamable HTTP. Each request stands alone; there are no sessions.
- Authentication: none. No sign-in and no API key.
- Read-only: every tool is marked `readOnlyHint: true`.
- Server: `viberaven`. Source guide version: 1.7.8. Live `initialize` on 2026-11-03 returned 1.7.6; hosted deployment versions are separate from npm CLI releases.
- MCP registry name: `io.github.ohad6k/viberaven-guides`

It returns published guidance; `check_supabase_migrations` analyzes the SQL you supply, and `check_github_repo` reads the public migration files of the repository you name. It cannot access your local or private files, database, dashboards or provider accounts. SQL and repository results are static analyses of the specified inputs, not verification of the deployed app.

For each request the server records bounded metadata: method, tool, client name/version, HTTP or protocol outcome, duration, coarse country code, provider/topic/result categories and counts, and optional caller-declared source, journey, test and outcome fields. It does not log or store raw tool arguments, prompts, SQL, result contents or IP addresses. Vercel, which hosts it, keeps its standard request logs.

Tools (the same seven that `tools/list` returns):

- `explain_finding`: give it a VibeRaven finding id such as `rls_disabled`, and it returns what the rule detects in repository files, why it matters, how to fix it and what it does not check, quoted from viberaven.dev with a source link for each part.
- `search_guides`: searches the launch guides published on viberaven.dev by keyword and returns up to 5 matches, each with its title, URL and short answer.
- `launch_checklist`: returns the manual pre-launch checklist published on viberaven.dev for a Lovable + Supabase app (`lovable-supabase`) or a Next.js + Supabase app on Vercel (`nextjs-supabase-vercel`), with its sources and the one optional local VibeRaven step.
- `check_supabase_migrations`: give it the text of one or more Supabase migration files (up to 200 KB), and it runs the VibeRaven CLI's SQL rules on that text: tables without RLS, RLS with no policies, `using (true)` read and write policies, security definer functions callable by anon or signed-in users, and the October 30, 2026 Data API grant gaps (`data_api_grant_missing`, `data_api_grant_without_rls`). It returns each finding with file, line, a one-line fix and a guide link, plus the local command for the full repository check. It is a static read of the text passed, not your live database. The text is processed in memory, not stored and not logged.
- `check_github_repo`: give it a public GitHub repository (`https://github.com/owner/name` or `owner/name`), and it reads the `supabase/migrations/*.sql` files at one commit (up to 50 files, 200 KB) and runs the same SQL rules, with a link to each finding's line on GitHub. For a chat assistant with no terminal: a private repository, browser code and env files need the local check.
- `recent_provider_changes`: before you answer a provider error or update a deployment, it returns dated provider changes, the documented error or symptom, fix guidance and the official sources. Filter with `provider` (`clerk`, `lovable`, `nextjs`, `railway`, `supabase` or `vercel`), `query` (redacted error text or keywords) and `limit` (1 to 8, default 5). It is guidance only: it does not read your repo or check what is deployed.
- `provider_playbook`: before you build a feature that touches a provider, give it a provider id and it returns the versioned playbook: setup steps, gotchas, dated changes, integration seams and the repo checks that apply, with official sources. The one pack today is `supabase`; another id returns the list of packs. It is guidance only: it does not connect to the provider or check that the feature works.

To connect, give your client the URL https://viberaven.dev/mcp as a remote MCP server. ChatGPT developer mode apps and Claude custom connectors both take a remote MCP server URL. Pick no authentication if the client asks.

Claude Code:

```bash
claude mcp add --transport http viberaven-guides https://viberaven.dev/mcp
```

Codex, with one command:

```bash
codex mcp add viberaven-guides --url https://viberaven.dev/mcp
```

Or in `~/.codex/config.toml`:

```toml
[mcp_servers.viberaven-guides]
url = "https://viberaven.dev/mcp"
```

Gemini CLI:

```bash
gemini mcp add --transport http viberaven-guides https://viberaven.dev/mcp
```

Antigravity, in `~/.gemini/config/mcp_config.json` (all projects) or `.agents/mcp_config.json` (one workspace):

```json
{ "mcpServers": { "viberaven-guides": { "serverUrl": "https://viberaven.dev/mcp" } } }
```

Cursor, in one click: https://cursor.com/install-mcp?name=viberaven-guides&config=eyJ1cmwiOiJodHRwczovL3ZpYmVyYXZlbi5kZXYvbWNwIn0= (its `config` is base64 of `{"url":"https://viberaven.dev/mcp"}`). Or in `.cursor/mcp.json` or `~/.cursor/mcp.json`:

```json
{ "mcpServers": { "viberaven-guides": { "url": "https://viberaven.dev/mcp" } } }
```

VS Code, in `.vscode/mcp.json`:

```json
{ "servers": { "viberaven-guides": { "type": "http", "url": "https://viberaven.dev/mcp" } } }
```

The registry lists it as this remote entry:

```json
{ "type": "streamable-http", "url": "https://viberaven.dev/mcp" }
```

## Local MCP server

The MCP server is the `@viberaven/mcp` package, listed in the official MCP registry as `io.github.ohad6k/viberaven`. Add to your MCP config:

```json
{ "viberaven": { "command": "npx", "args": ["-y", "@viberaven/mcp@1.7.8"] } }
```

The `viberaven` CLI package is not an MCP server. In 1.6.3 it has no `--mcp` flag: the unknown flag is ignored and the default Studio launch runs (local server on 127.0.0.1, browser opened, and a first scan only when `.viberaven/last-scan.json` does not exist yet).

## Production tools

- `viberaven_check_readiness`
- `viberaven_verify`
- `viberaven_strict_gate`
- `viberaven_gate_result`
- `viberaven_context_map`
- `viberaven_actions`
- `viberaven_verify_action`
- `viberaven_heal_plan`
- `viberaven_heal_prompt`
- `viberaven_heal_apply`
- `viberaven_audit`
- `viberaven_init_rules`
- `viberaven_validate_npm_package`
- `viberaven_clean_plan`

The server exposes tools only, no MCP resources or prompts. Start with `viberaven_check_readiness`, read the verdict with `viberaven_gate_result`, and call `viberaven_heal_plan` before `viberaven_heal_apply`. For `rls_disabled`, `viberaven_heal_apply` writes a new migration that enables row level security with no policies, so browser reads of those tables return no rows until policies exist: call it only after the user agrees, and pass `yes: true` only then. Use `viberaven_actions` and `viberaven_verify_action` for provider dashboard steps that repo edits cannot clear on their own. `viberaven_init_rules` writes a VibeRaven advice block, scoped to Vercel + Supabase apps, into the agent files; https://viberaven.dev/agent-rules.md lists exactly what it installs. Preview with its `dryRun` option first.

## CLI fallback

```bash
npx -y viberaven@1.7.8 check
```

Agents should read `.viberaven/agent-tasklist.md` first, then `.viberaven/gate-result.json` for the machine verdict and `.viberaven/context-map.json`. Work the gaps in `topGapIds` order, starting with the action printed between `VIBERAVEN_NEXT_ACTION_START` and `VIBERAVEN_NEXT_ACTION_END`. `npx -y viberaven@1.7.8 next --json` is a different, simpler output: it reads the last scan and returns `type` (`repo-fix`, `provider-guide`, or `done`), `title`, `detail`, `command` (for a gap, `viberaven prompt --gap <id>`), `productionCorePercent`, and `score`. It has no `batchSize` or `requiresUserAction`, and it labels any remaining gap `repo-fix`, even one only a provider dashboard can clear. To decide whether a gap needs the user or a dashboard, trust the stdout block (`type: "provider-action"`, `requiresUserAction: true`) and the `VIBERAVEN_PROVIDER_ACTION` block, not `next --json`. Apply safe repo-code fixes directly or with a supported heal action, respect `batchSize` from that block, and verify once per batch. A `clear` status covers the repo half; the user decides when to ship.

```bash
npx -y viberaven@1.7.8 --verify
npx -y viberaven@1.7.8 --strict
```

`--strict` exits 1 when `gate.status` is `not_clear`; a `warning` status exits 0 unless you use `--strict=warning`. It is for a CI step the user chooses to add.

## Before npm install

Call `viberaven_validate_npm_package`. It checks that the name exists on the public npm registry and flags a name published in the last 14 days within 2 edits of a popular package, or one with empty metadata. An older lookalike name passes, so it is not a full typosquat or malware check. After dependency changes on a Vercel + Supabase app, run:

```bash
npx -y viberaven@1.7.8 check
```

## Boundaries

Do not use MCP to ask for secrets or claim provider dashboard work is complete from repo edits.

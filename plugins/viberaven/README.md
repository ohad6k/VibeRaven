# VibeRaven plugin

VibeRaven gives AI-built apps production context and checks across Supabase, Vercel, Stripe and the other providers they use, read from the repo, locally, before launch and after a change.

## Two users at once

`race` tests your app’s database on real PostgreSQL 18.6, without Docker, and replays exactly what broke. Start locally with `npx -y viberaven@1.14.0 race --example` (Node 24+ with JSPI).

```text
At most 2 bookings per event: 60 orders, 24 broken, 0 waiting; 1.495s total
First broken order 001101 (read committed); COMMIT A=true, B=true
Replay record is byte-identical, including PostgreSQL protocol bytes.
```

Recorded synthetic example; elapsed time varies. Engine proof: 122 of 124 PostgreSQL isolation specs; hidden tests 199/200 new orders and 1,500/1,500 real-app interleavings, with native PostgreSQL at 100% through the same judge; 80/80 exact replays; 0 leaks between sessions in 60 isolation cases. [Method and limitations](https://github.com/ohad6k/VibeRaven/blob/main/docs/race.md#frozen-engine-proof).

1. `npx -y viberaven@1.14.0 check`: repository risks before launch.
2. Write a reviewed `viberaven.race.json`, then run `npx -y viberaven@1.14.0 race`: two users at once, with the exact order.
3. Fix, run `race` again, and replay the reported order to confirm.

[Engine](https://viberaven.dev/engine) · [Connect your agent](https://viberaven.dev/connect/mcp). Hosted MCP gives SQL/error guidance; race runs locally.


VibeRaven checks the repository of an AI-built app that deploys on Vercel and uses Supabase, before a launch or a client handoff. It lists launch gaps with the file that caused each one, for example a migration that creates a table no later migration puts under RLS, a policy such as `using (true)`, a service role key reachable from client code, a database URL on port 5432 in serverless code, env var drift (it compares the code against your `.env.example` files, not your Vercel project settings), or a Stripe webhook without signature verification.

It is a repository check, not a live database test. It does not query your Supabase project, so it cannot show which RLS policies are live in production, and a clear result is not a security audit. This is advice, not a gate: you decide when to ship.

## What this plugin contains

1. One skill, `prelaunch-check`, which tells the agent when to suggest a VibeRaven pass and when not to.
2. One MCP server, `viberaven`, started locally with `npx -y @viberaven/mcp@1.14.0`.

## What it runs, reads, writes and fetches

1. On first start, npx downloads `@viberaven/mcp@1.14.0` and its dependencies from the npm registry. CLI-backed tools can start the matching `@viberaven/cli` via npm. npm registry access can occur during setup and use.
2. The check reads files in the project folder and writes its results under `.viberaven/` in that folder. The files it reads include local env files that often hold real credentials: any `.env` or `.env.*` file at the repo root (for example `.env.local`, `.env.staging` or `.env.production.local`, as well as the `.env.example` and `.env.sample` templates) and `.env*` files in subfolders such as `apps/web/.env.local`. It reads them on your machine to find problems such as a service role key under a `NEXT_PUBLIC_` name or a database URL on port 5432. Some findings name the file, line and variable, for example `.env.staging:2: NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` from `check` or `.env.local:1: DATABASE_URL=<redacted>` from `audit --vercel-supabase`. Others only describe the problem: `check` reports the port 5432 database URL without a file or line. In a test on 2026-10-02 (Windows, one sample repository with made-up secret values in `.env`, `.env.local`, `.env.staging`, `.env.production.local` and `apps/web/.env.local`, running `check`, `scan` and `audit --vercel-supabase`), none of the values appeared in the terminal output or under `.viberaven/`.
3. `viberaven_validate_npm_package` looks up the package names you pass on the npm registry (registry.npmjs.org).
4. In a test on 2026-10-02 (Windows, one sample repository, the other twelve tools called through the MCP server, with each Node.js socket connection and DNS lookup logged), the MCP server and the CLI commands behind the tools made no network connections; only the npx starts in point 1 did. `viberaven_heal_apply` and `viberaven_validate_npm_package` were not part of that test.
5. Local checks do not require an account. Live connection and account tools are optional and may contact VibeRaven. Review the selected tool and its inputs before use.
6. The plugin has no hooks.

## Tools

Protocol inventory for `@viberaven/mcp@1.14.0`.

- `viberaven_check_readiness`, `viberaven_rls_test`, `viberaven_verify`, `viberaven_audit`, `viberaven_init_rules`, `viberaven_clean_plan`, `viberaven_strict_gate`, `viberaven_gate_result`, `viberaven_context_map`.
- `viberaven_actions`, `viberaven_verify_action`, `viberaven_heal_plan`, `viberaven_heal_prompt`, `viberaven_heal_apply`, `viberaven_validate_npm_package`.
- `viberaven_work_start`, `viberaven_work_resume`, `viberaven_work_status`, `viberaven_work_prepare`, `viberaven_work_verify`, `viberaven_work_report`.
- `provider_playbook`, `recent_provider_changes`.
- `viberaven_live_start`, `viberaven_live_resume`, `viberaven_live_status`, `viberaven_live_disconnect`, `viberaven_account`, `viberaven_login`, `viberaven_race`.

`viberaven_heal_apply` edits repo code for a supported gap, and `viberaven_init_rules` writes instruction files such as `AGENTS.md` and adds `viberaven:gate`, `viberaven:verify` and `viberaven:strict` scripts to `package.json`. Preview both first: `viberaven_heal_plan` and `dryRun: true`.

## Requirements

Node.js 20 or newer.

## Links

Site and docs: https://viberaven.dev. Agent reference: https://viberaven.dev/llms.txt. License: MIT.

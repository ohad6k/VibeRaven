# VibeRaven plugin

VibeRaven checks the repository of an AI-built app that deploys on Vercel and uses Supabase, before a launch or a client handoff. It lists launch gaps with the file that caused each one, for example a migration that creates a table no later migration puts under RLS, a policy such as `using (true)`, a service role key reachable from client code, a database URL on port 5432 in serverless code, env var drift (it compares the code against your `.env.example` files, not your Vercel project settings), or a Stripe webhook without signature verification.

It is a repository check, not a live database test. It does not query your Supabase project, so it cannot show which RLS policies are live in production, and a clear result is not a security audit. This is advice, not a gate: you decide when to ship.

## What this plugin contains

1. One skill, `prelaunch-check`, which tells the agent when to suggest a VibeRaven pass and when not to.
2. One MCP server, `viberaven`, started locally with `npx -y @viberaven/mcp@1.6.2`.

## What it runs, reads, writes and fetches

1. On first start, npx downloads `@viberaven/mcp@1.6.2` and its dependencies from the npm registry. When a tool runs, the server starts the CLI with `npx -y --package=@viberaven/cli@1.6.2`, which downloads that package the first time. Each of these npx starts also contacts registry.npmjs.org, even when the package is already cached.
2. The check reads files in the project folder and writes its results under `.viberaven/` in that folder. The files it reads include local env files that often hold real credentials: any `.env` or `.env.*` file at the repo root (for example `.env.local`, `.env.staging` or `.env.production.local`, as well as the `.env.example` and `.env.sample` templates) and `.env*` files in subfolders such as `apps/web/.env.local`. It reads them on your machine to find problems such as a service role key under a `NEXT_PUBLIC_` name or a database URL on port 5432. Some findings name the file, line and variable, for example `.env.staging:2: NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` from `check` or `.env.local:1: DATABASE_URL=<redacted>` from `audit --vercel-supabase`. Others only describe the problem: `check` reports the port 5432 database URL without a file or line. In a test of VibeRaven 1.6.1 on 2026-10-02 (Windows, one sample repository with made-up secret values in `.env`, `.env.local`, `.env.staging`, `.env.production.local` and `apps/web/.env.local`, running `check`, `scan` and `audit --vercel-supabase`), none of the values appeared in the terminal output or under `.viberaven/`.
3. `viberaven_validate_npm_package` looks up the package names you pass on the npm registry (registry.npmjs.org).
4. In a test of VibeRaven 1.6.1 on 2026-10-02 (Windows, one sample repository, the other twelve tools called through the MCP server, with each Node.js socket connection and DNS lookup logged), the MCP server and the CLI commands behind the tools made no network connections; only the npx starts in point 1 did. `viberaven_heal_apply` and `viberaven_validate_npm_package` were not part of that test.
5. Hosted full checks run only from the VibeRaven Studio or the VS Code extension, which this plugin does not start. They need a VibeRaven account and send data to VibeRaven's hosted service. Local checks need no account.
6. The plugin has no hooks.

## Tools

`viberaven_check_readiness`, `viberaven_verify`, `viberaven_gate_result`, `viberaven_context_map`, `viberaven_audit`, `viberaven_heal_plan`, `viberaven_heal_apply`, `viberaven_heal_prompt`, `viberaven_strict_gate`, `viberaven_init_rules`, `viberaven_clean_plan`, `viberaven_actions`, `viberaven_verify_action`, `viberaven_validate_npm_package`.

`viberaven_heal_apply` edits repo code for a supported gap, and `viberaven_init_rules` writes instruction files such as `AGENTS.md` and adds `viberaven:gate`, `viberaven:verify` and `viberaven:strict` scripts to `package.json`. Preview both first: `viberaven_heal_plan` and `dryRun: true`.

## Requirements

Node.js 20 or newer.

## Links

Site and docs: https://viberaven.dev. Agent reference: https://viberaven.dev/llms.txt. License: MIT.

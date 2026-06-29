---
name: supabase-rls
description: Verify Supabase row-level security evidence before claiming an AI-built app is production-ready.
---

# Supabase RLS

## When To Use

Use this when a repo uses Supabase and stores user-owned, tenant-owned, private, paid, or admin-only data. This skill is especially important before launch, after schema changes, after auth changes, or when an agent says "RLS is done" without showing SQL evidence.

## Repo Signals To Inspect

- `supabase/migrations/**`
- `supabase/seed.sql`
- `supabase/config.toml`
- generated database types
- SQL files that create tables, views, policies, functions, triggers, or grants
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- server routes, actions, jobs, edge functions, or cron jobs that read/write user data
- client calls to `.from(...).select()`, `.insert()`, `.update()`, `.delete()`, `.rpc()`

## Agent Actions

- Build a table inventory from migrations and mark every table in an exposed schema such as `public`; each user-owned or tenant-owned table needs `alter table ... enable row level security`.
- Match every user-owned table to policies for the operations it supports: `select` with `using`, `insert` with `with check`, `update` with both `using` and `with check`, and `delete` with `using`.
- Check policies for ownership predicates such as `(select auth.uid()) = user_id`, tenant membership checks, or authorization claims stored in `raw_app_meta_data`; do not accept mutable `raw_user_meta_data` as authorization proof.
- Check policies specify roles with `to authenticated` or `to anon` where appropriate instead of silently applying broad policies to every role.
- Find views in exposed schemas; Supabase documents that views can bypass RLS by default unless `security_invoker = true` is used on Postgres 15+ or access is otherwise restricted.
- Trace all `SUPABASE_SERVICE_ROLE_KEY` usage and prove it stays server-only; any browser import, `NEXT_PUBLIC_*` reference, client bundle path, or public config exposure is a launch blocker.
- Check client queries for explicit filters matching the policy shape, such as `.eq('user_id', userId)` or tenant filters, so large RLS-protected tables do not rely only on implicit policy filtering.

## Failure Modes To Catch

- A table was created in raw SQL without `enable row level security`, so the dashboard-created-table default did not protect it.
- A table has RLS enabled but no policy for the needed operation, causing broken app behavior that the agent misreads as security.
- A policy checks `auth.uid() = user_id` without accounting for unauthenticated users or tenant membership.
- Insert/update policies use `using` but omit `with check`, allowing rows to be created or changed into an unauthorized ownership state.
- A service role key is imported into code that can run in the browser.
- A view, RPC, security-definer function, or exposed schema bypasses the policy the agent claims is protecting the data.
- The repo treats seed data, local tests, or generated types as proof of live dashboard policy state.

## Acceptable Evidence

- Migration SQL showing `alter table <schema>.<table> enable row level security` for each relevant table.
- Policy SQL showing operation-specific `using` and `with check` clauses that match the app's user/tenant model.
- Evidence that service-role clients are only constructed in server-only files, background jobs, or trusted functions.
- Tests, pgTAP checks, Supabase local tests, or documented SQL smoke checks proving users cannot access another user's or tenant's rows.
- Provider/MCP/dashboard export confirming live production policies when repo migrations are incomplete or the dashboard was edited manually.
- A clear "not proven" finding when live dashboard state is unknown.

## What Must Be Verified

- RLS is enabled on every exposed user-owned or tenant-owned table.
- Policies match the real auth model and operation semantics.
- Service role usage is server-only and never exposed to clients.
- Views, RPCs, and security-definer functions do not silently bypass the intended policy.
- Local repo evidence is separated from live Supabase dashboard evidence.

## Human-Action Boundary

The repo cannot prove live Supabase dashboard policy state, manual SQL editor changes, production grants, or provider project settings unless that state is exported or available through connected provider tooling. Ask for a dashboard export, SQL receipt, MCP/provider evidence, or a human confirmation with the table/policy names.

## Provider References

- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security

## Output

Return:

1. evidence found
2. evidence missing
3. repo-code fixes or none
4. provider or human action needed

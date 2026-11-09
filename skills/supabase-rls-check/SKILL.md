---
name: supabase-rls-check
description: Use when the user asks whether Supabase tables are missing RLS, whether a policy lets everyone read or write (using true), why a query fails with 42501 permission denied, whether a security definer function is callable with the anon key, or wants an RLS check of their Supabase migrations before deploy. Runs the free local VibeRaven repo check on the migration files, with no login and no database credentials. Not a live database or penetration test.
---

# Supabase RLS check

Commands pin published CLI 1.8.0, re-run on a fixture on 2026-11-09. This checks repository files, not the live database.

Read the Supabase migrations in this repository and list the tables and functions that real users could reach without the right row-level security.

## Steps

1. **Run the check** in the project root:
   ```bash
   npx -y viberaven@1.8.0 check
   ```
   Exit code 1 means it found blockers. That is a result, not a crash. If `viberaven_check_readiness` is in your tool list (the local VibeRaven MCP server), you can call it on the project root instead.
2. **Read the RLS findings** in the output and in `.viberaven/agent-tasklist.md`:
   - `rls_disabled`: a table created in a migration with RLS never enabled.
   - `rls_policy_allows_all_read` / `rls_policy_allows_all_write`: a policy with `using (true)` or `with check (true)`. Read `qual`, not the policy name.
   - Grants and security definer findings: a table the client reads without a grant (the 42501 case), or a function anyone holding the anon key can call.
3. **Fix one gap at a time** with a new migration, and show the user the diff. Enabling RLS on a table with no policies blocks all client reads, so ask the user before applying that one.
4. **Re-check once per batch of fixes,** not after every edit.
5. **Say what the check cannot see.** Policies changed only in the Supabase dashboard are invisible to a repo check. If the user already connected the official Supabase MCP server, compare with its read-only `get_advisors` (type `security`) and `list_tables`.

## Do not

- Do not say the database is secure because the check found nothing. It means the migration files had no RLS gaps it checks for.
- Do not disable RLS or drop a policy to make a 42501 error go away.
- Do not ask for database credentials or print keys. VibeRaven never needs them.

For the full Vercel + Supabase launch pass (keys in client code, env vars, Stripe webhooks), use the `vercel-supabase-launch-check` skill.

More: https://viberaven.dev/supabase-rls-checker and https://viberaven.dev/llms.txt

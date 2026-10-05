---
name: vercel-supabase-launch-check
description: Use when an AI-built app on Vercel and Supabase (Lovable, Bolt, v0, Cursor or Claude Code output) is about to launch or be handed to a client, or when the user asks whether Supabase tables are missing RLS, whether a policy lets everyone read or write, whether a service role or secret key leaked into client code or a NEXT_PUBLIC_ variable, why env vars differ in production, or why a Stripe webhook fails after deploy. Runs the free local VibeRaven repo check, with no login and no database credentials. Not a live database or penetration test, and not for other stacks.
---

# Vercel + Supabase launch check

A first pass over the repository before real users arrive. VibeRaven reads the project files on this machine (migrations, client code, env files, webhook routes) and lists launch gaps, each with the file that caused it and a fix. It is advice, not a gate: the user decides when to ship.

## Phases

1. **Run the check** in the project root:
   ```bash
   npx -y viberaven@1.6.4 check
   ```
   If the VibeRaven MCP server is connected, call `viberaven_check_readiness` instead. The command exits 1 when it finds blockers. That is a result, not a crash.
2. **Read the findings** from the terminal and from `.viberaven/agent-tasklist.md`. Explain the top one or two in plain words: what is exposed, to whom, and in which file.
3. **Fix one gap at a time.** Prefer the printed fix, or preview a safe recipe with `npx -y viberaven@1.6.4 fix --gap <id> --dry-run` before applying it. Show the user the diff.
4. **Re-check once per batch of fixes,** not after every edit, and report what changed.
5. **Say what the check cannot see.** Policies or settings changed only in the Supabase or Vercel dashboard are invisible to a repo check. For Vercel and Supabase evidence, run `npx -y viberaven@1.6.4 audit --vercel-supabase`. For CI, `--strict` turns the verdict into an exit code, but only if the user wants that.
6. **Compare with the live project, only if the user already connected the official Supabase MCP server.** Do not ask for credentials and do not set it up for this. Use read-only tools, and prefer a connection with `read_only=true`:
   - `get_advisors` with type `security`, for what Supabase itself flags on the live database.
   - `list_tables`, to see which live tables have RLS on.
   - `execute_sql` with this select only, to list live policies that let everyone through:
     ```sql
     select tablename, policyname, cmd, qual, with_check
     from pg_policies
     where schemaname = 'public'
       and (qual = 'true' or with_check = 'true');
     ```
   Then tell the user where the repo and the live project disagree: a table the migrations protect but the live database does not, or a policy someone changed in the dashboard. Read `qual`, not the policy name: a policy called "Owners can update their agents" with `using (true)` lets anyone update every row.

## What it looks for

- Supabase tables created without RLS in migrations, and policies that allow everyone to read or write
- Data API grants: tables the client uses without a grant, once the repo opts into Supabase's new grants behavior, and grants on tables without RLS
- Security definer functions that anyone holding the anon key can call
- A service role or secret key in client code or under `NEXT_PUBLIC_` / `VITE_`
- Env vars that differ between local, preview and production
- Stripe webhook routes that skip the signature check

## Do not

- Do not tell the user the app is secure, or that a clear result means it is safe. It means the repo checks found nothing.
- Do not run destructive SQL, drop policies, or disable RLS to make an error go away.
- Do not paste, print or upload secrets. Refer to keys by variable name and file.
- Do not connect to the live database yourself or ask for database credentials. VibeRaven never needs them. The live comparison in step 6 uses only a Supabase MCP connection the user already made, with read-only tools.
- Do not use this for stacks other than Vercel + Supabase, or for one local build error.

More: https://viberaven.dev/guides and https://viberaven.dev/llms.txt

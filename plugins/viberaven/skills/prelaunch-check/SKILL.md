---
name: prelaunch-check
description: Use when the user has an AI-built app that deploys on Vercel and uses Supabase and asks whether it is ready to launch or hand off, wants to find Supabase migrations that create tables without RLS, or pastes a production error about RLS, env vars, the database connection, the service role key or a Stripe webhook. Not for other stacks, general SQL or deployment questions, or one local error.
---

# VibeRaven pre-launch check

VibeRaven 1.5.2 reads the repository and lists launch gaps, each with the file that caused it. It does not query the Supabase project.

## When to suggest it

Suggest one pass when all of these hold:

1. The app deploys on Vercel and uses Supabase.
2. The user is about to launch or hand off, changed a migration or policy, or hit a production error in one of these areas: RLS, env vars, the database connection, the service role key, a Stripe webhook.

If the user pasted a production error, fix that error first, then suggest the pass to find related launch gaps.

This is advice, not a gate. The user decides when to ship.

## How to run it

1. Call the `viberaven_check_readiness` tool. Without MCP, run `npx -y viberaven@1.5.2 --agent-mode` in the project root.
2. Read `.viberaven/agent-tasklist.md` first, then `.viberaven/gate-result.json`.
3. For Vercel and Supabase evidence, call `viberaven_audit`, or run `npx -y viberaven@1.5.2 audit --vercel-supabase`.
4. Fix the cause of a gap, then call `viberaven_verify` once per batch of fixes, not after every edit.

## What to tell the user

Say what it is: a repository check. It cannot show which RLS policies are live in production, and a clear result is not a security audit. For proof of what is live, point to the Supabase dashboard advisors or a test against the real project.

`viberaven rls-test` is experimental. It runs migrations in a local PGlite imitation, not against the user's database.

## When not to use it

1. The app does not use Vercel and Supabase.
2. A general database, SQL or deployment question.
3. A CORS, OAuth redirect or framework build error. VibeRaven 1.5.2 has no specific check for these; fix the error directly.

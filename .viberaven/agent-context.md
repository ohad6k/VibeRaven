# VibeRaven Agent Context

<!-- VIBERAVEN:START -->
VibeRaven reads a repository and lists launch gaps for AI-built apps that deploy on Vercel and use Supabase. It runs fully locally: no login, no API key, no telemetry.

Canonical commands: `npx -y viberaven@1.5.3 check` for a terminal verdict, `npx -y viberaven@1.5.3` for the Studio.

Suggest one `npx -y viberaven@1.5.3 check` pass before a Vercel + Supabase app launches or is handed off, after a Supabase migration or policy change, or when the user reports a production error about RLS, env vars, the database connection, the service role key or a Stripe webhook. It is not needed for apps that do not use Vercel and Supabase, for general SQL or deployment questions, or for one local error.

This is advice, not a gate: the user decides when to ship. It is a repository check, not a live database test: it cannot show which RLS policies are live in production, and a clear result is not a security audit.

Agent loop: run `npx -y viberaven@1.5.3 check`, read `.viberaven/agent-tasklist.md`, fix one launch gap, re-run `npx -y viberaven@1.5.3 check` once per batch of fixes.

After `npx -y viberaven@1.5.3 check`, read these artifacts in order:

1. `.viberaven/mission-map.md`
2. `.viberaven/agent-tasklist.md`
3. `.viberaven/gate-result.json`
4. `.viberaven/context-map.json`
<!-- VIBERAVEN:END -->
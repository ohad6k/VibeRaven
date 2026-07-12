# Provider control board explainer

The provider cards in the Studio (see the README's "Providers via MCP" row
and the [cards binder](../assets/cards-binder.png)) are VibeRaven's read on
where your app's actual infrastructure stands, separate from what the repo
code says. This page explains what each slot means, what healthy vs. drifted
looks like, and — the thing that matters most — which of that state VibeRaven
can actually verify itself versus what it's only inferring from the repo.

## Repo-evidence vs. dashboard-only

Every provider card falls into one of two trust levels:

- **Repo-evidence** — VibeRaven reads a file in your repo (`.env.example`,
  a migration, a config file, a lockfile) and reports what it finds. This is
  fast, offline, and works for every provider, but it can only ever say what
  the *code* claims, not what's actually configured in the provider's
  dashboard.
- **MCP-verified** — VibeRaven calls the provider directly through a
  connected MCP server and reports live state. As of this writing that's
  **Supabase, Vercel, and Stripe** (see the README's "Providers via MCP"
  row); the other cards are repo-evidence only until their MCP connector
  ships.

A card can look "healthy" on repo-evidence alone and still be wrong in
production — e.g. `.env.example` documents `STRIPE_WEBHOOK_SECRET` but the
value configured in the Stripe dashboard doesn't match what's set in Vercel.
VibeRaven's [version comparison](version-comparison.md) doc gives a worked
example of exactly this drift. When a card is repo-evidence only, treat a
✅ as "the code is consistent with itself," not "this is live and correct."

## The provider slots

### Supabase — MCP-verified

- **Healthy:** RLS is enabled on every user-owned table, migrations in
  `supabase/migrations/*.sql` are applied, and the connected project's
  schema matches what the repo expects.
- **Drifted:** a table is missing an RLS policy (`rls_disabled` in the gate
  result), a migration exists locally but was never applied to the
  connected project, or a policy references a column that was renamed or
  removed.

### Vercel — MCP-verified

- **Healthy:** the production deployment is live, environment variables
  used in code are present in the Production environment, and the latest
  deploy corresponds to the release you're looking at.
- **Drifted:** an env var referenced in code (`process.env.X`) has no
  matching entry in the connected Vercel project, or Preview and Production
  environments disagree on a value that should be shared.

### Stripe — MCP-verified

- **Healthy:** the webhook endpoint registered in Stripe points at your
  production URL, the signing secret matches what the app validates
  against, and the API key mode (test vs. live) matches the environment.
- **Drifted:** the webhook endpoint still points at a preview deployment or
  `localhost`, the signing secret was rotated in Stripe but not updated in
  the app's environment, or a live key is used against a webhook still
  configured for test mode.

### Clerk — repo-evidence

- **Healthy:** `.env.example` documents the publishable and secret keys the
  code imports, and auth-protected routes in the repo match Clerk's
  middleware configuration as written in code.
- **Drifted:** the code imports a Clerk env var that isn't documented in
  `.env.example`, or a route that should be protected has no middleware
  match — VibeRaven can only flag this from the repo side; it cannot see
  whether the keys configured in the Clerk dashboard are the same ones the
  app is actually using at runtime.

### Resend — repo-evidence

- **Healthy:** the API key env var is documented, and the "from" domain
  used in code matches a domain the repo's config/docs say is verified.
- **Drifted:** code sends from a domain that isn't referenced anywhere in
  the repo's env/config files — a common sign the domain was never
  verified in the Resend dashboard, though VibeRaven can't confirm domain
  verification status itself without a dashboard connection.

### Sentry — repo-evidence

- **Healthy:** an error-monitoring SDK (e.g. `@sentry/nextjs`) is a
  dependency and its DSN env var is both used in code and documented in
  `.env.example`.
- **Drifted:** the dependency is present but no DSN is wired up
  (`monitoring_missing`-style gap), which usually means errors are
  silently going nowhere in production.

### PostHog — repo-evidence

- **Healthy:** the client key and host are documented and consistently
  referenced wherever analytics/feature-flag calls happen in the code.
- **Drifted:** analytics calls exist in code with no corresponding env var
  documented, or a feature flag is checked in code but never referenced
  anywhere else in the repo (dead flag or missing setup).

### Upstash — repo-evidence

- **Healthy:** Redis/KV connection env vars used in code (URL + token) are
  documented in `.env.example`.
- **Drifted:** rate-limiting or caching code references Upstash env vars
  that aren't documented, which usually means the feature silently no-ops
  in any environment that didn't happen to inherit the value some other
  way.

### Env vars — repo-evidence

- **Healthy:** every `process.env.X` referenced in code has a matching
  entry in `.env.example`, and vice versa (no documented var that nothing
  reads).
- **Drifted:** code references a var that isn't documented (the most common
  gap across every provider above), or `.env.example` documents a var that
  was removed from the code and never cleaned up.

## How this feeds the rest of the Studio

Provider card state is what [`viberaven check`](../README.md) turns into
gap IDs, what a version comparison diffs between releases, and what you can
drag into agent chat as context — see the
[after-launch workflow](after-launch.md) for how that fits into your normal
loop once you've shipped. Provider proof is always kept separate from
repo-code fixes: an agent can heal a repo-evidence gap (add the missing env
var to `.env.example`), but nothing in VibeRaven claims a dashboard is fixed
just because the repo was edited.

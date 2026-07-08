# Version comparison explainer

The "Versions & releases" panel in the Studio (see the README feature table)
answers one question after every release: **what changed, and did it make
anything riskier to ship?** This page explains what goes into that diff and
what "riskier" means in VibeRaven terms.

## What the diff compares

A version comparison is a diff between two release snapshots of the same
repo — typically the last known-good release (`v1.0`) and the current one
(`v1.1`). VibeRaven builds that diff from four kinds of repo evidence, the
same evidence categories used in a
[release proof report](../examples/release-drift/release-proof-report.md):

| Input | Where it comes from | Example of a change |
|-------|----------------------|----------------------|
| **Dependencies** | `package.json` / lockfile | A payments SDK was bumped a major version |
| **Schema** | migration files (e.g. `supabase/migrations/*.sql`) | A new `profiles` migration removes a `NOT NULL` constraint an RLS policy relied on |
| **Env vars** | `.env.example`, provider dashboard config | A previously-required `STRIPE_SECRET_KEY` is now optional, or a new var was added but not documented |
| **Provider config** | provider dashboard evidence (webhooks, redirect URLs, auth settings) | A webhook endpoint URL still points at a preview deployment instead of production |

Each input is evaluated the same way a single-release scan evaluates repo
evidence: as verified (✅), needs action (⚠️), or a blocker (🔴) — the same
legend used throughout VibeRaven's reports.

## Worked example: v1.0 → v1.1

Say `v1.0` shipped clean: RLS was enabled on `profiles`, the Stripe webhook
signature was verified, and every env var in `.env.example` had a matching
value in every environment. Between `v1.0` and `v1.1`, three things
happened:

1. A new migration added a `profiles.internal_notes` column, but the RLS
   policy for `profiles` wasn't updated to exclude it from the public
   `select` policy.
2. `STRIPE_WEBHOOK_SECRET` was rotated in the Stripe dashboard, but the
   Vercel Production environment variable wasn't updated to match.
3. A new `@sentry/nextjs` dependency was added, but no `NEXT_PUBLIC_SENTRY_DSN`
   was documented in `.env.example`.

The version diff for `v1.0 → v1.1` reads roughly:

| Category | v1.0 | v1.1 | Status |
|----------|------|------|--------|
| Schema (`profiles` RLS) | ✅ verified | 🔴 blocker | **Riskier** — new column not covered by the existing policy |
| Provider config (Stripe webhook) | ✅ verified | 🔴 blocker | **Riskier** — signature mismatch will reject every event in production |
| Dependencies (`@sentry/nextjs`) | not present | ⚠️ needs action | **New, incomplete** — added but not wired up |
| Env vars (`.env.example`) | ✅ in sync | ⚠️ needs action | **Riskier** — `NEXT_PUBLIC_SENTRY_DSN` used in code but undocumented |

Two rows regressed from ✅ to 🔴 (a schema change and a provider config
change), one is a new dependency that isn't fully wired up yet, and the
fourth is undocumented drift between code and `.env.example`.

## What "provider got riskier" means

A provider "got riskier" when its status moved in the wrong direction
between the two versions being compared — not just when something is
broken in isolation. Three cases:

- **Regression**: a row that was ✅ in the earlier version is now ⚠️ or 🔴
  in the current one. This is the most actionable signal — something that
  used to work stopped working, usually because of a change the diff can
  point directly at (the migration, the dependency bump, the config edit).
- **New and incomplete**: a dependency or provider integration that didn't
  exist in the earlier version shows up in the current one already at ⚠️
  or 🔴 — it was added but the setup wasn't finished.
- **Silent drift**: nothing in the repo diff looks wrong, but the provider
  dashboard state and the repo's expectation of it (an env var, a webhook
  URL, a redirect URL) no longer match. This is why provider evidence is
  tracked separately from repo-code evidence — a clean `git diff` doesn't
  catch a rotated secret or a webhook still pointing at staging.

None of this is a guess: every row in the diff traces back to either a
repo file (regression source) or an explicit dashboard evidence check
(provider drift). Repo-code regressions can usually be fixed by editing
the repo; provider drift needs a human to update the dashboard.

## Regenerating it

```bash
npx -y viberaven
```

The Studio's Versions & releases panel regenerates the diff for the
currently checked-out release against the previous one it has evidence
for. Drag a version card into agent chat to hand the whole diff to your
coding agent as context for the fix.

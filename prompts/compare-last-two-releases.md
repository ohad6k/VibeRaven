# Compare last two releases

Drag this prompt into agent chat after dropping in two release contexts
from the Studio's Versions & releases panel (or two
[release proof reports](../examples/release-drift/release-proof-report.md)).
It asks the agent to summarize the diff between them without taking any
action on its own.

See [docs/version-comparison.md](../docs/version-comparison.md) for what
counts as a diff input and what "riskier" means here.

---

```
You have context for two VibeRaven release snapshots of this repo: an
earlier release and the current one. Compare them and answer three
questions, in this order, using only the evidence in the dropped context
(dependencies, schema/migrations, env vars, and provider config):

1. What changed?
   List each change as one line: category (dependency / schema / env var /
   provider config), what changed, and the file or dashboard step it comes
   from.

2. What got riskier?
   For each change, say whether it is:
   - a regression (a row that was verified in the earlier release and is
     now "needs action" or a blocker in the current one),
   - new and incomplete (a dependency or provider integration that didn't
     exist before and isn't fully wired up yet), or
   - silent drift (the repo's expectation of a provider setting no longer
     matches what the dashboard evidence shows).
   If nothing got riskier, say so plainly instead of inventing a risk.

3. What's the next action?
   For each risk you found, give the single smallest next step: a specific
   file and change for a repo-code fix, or a specific dashboard page and
   setting for a provider action. Do not propose a broad refactor or
   "review everything" — one concrete step per risk.

Stay scoped to these two releases and the evidence provided:
- Do not claim a provider dashboard is fixed, verified, or unverified
  beyond what the dropped context actually shows.
- Do not run deploys, migrations, or provider dashboard changes yourself.
- Do not treat this as a general invitation to "fix production" — only
  report the diff and the next step per risk. The human decides what to
  act on.
- If either release's context is missing a category (for example, no
  provider evidence was dropped), say which category is missing instead
  of guessing at it.
```

## Expected output shape

```markdown
## What changed
- schema: added `profiles.internal_notes` column (supabase/migrations/0012_notes.sql)
- provider config: Stripe webhook secret rotated in dashboard, not yet updated in Vercel Production
- dependency: added @sentry/nextjs, no NEXT_PUBLIC_SENTRY_DSN documented

## What got riskier
- 🔴 regression — profiles RLS policy does not exclude internal_notes from public select
- 🔴 regression — Stripe webhook signature will fail in production after the rotation
- ⚠️ new and incomplete — Sentry added but DSN not wired up

## Next action
- Update the `profiles` select policy in supabase/migrations to exclude `internal_notes`
- Update `STRIPE_WEBHOOK_SECRET` in Vercel Production to match the rotated value
- Add `NEXT_PUBLIC_SENTRY_DSN` to `.env.example` and set it in each environment
```

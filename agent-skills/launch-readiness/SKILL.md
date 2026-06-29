---
name: launch-readiness
description: Collect evidence before saying an AI-built app is ready to launch.
---

# Launch Readiness

## When To Use

Use this when the user asks whether an AI-built app is launch-ready, production-ready, safe to deploy, or ready for public users.

## Repo Signals To Inspect

- test, typecheck, lint, and build scripts
- `.env.example`
- provider integration files
- migrations and seed files
- auth, billing, monitoring, and deployment code
- release notes and diffs
- Studio provider context and CLI agent evidence when available

## Concrete Checks

- Collect fresh build, typecheck, lint, unit test, integration test, or smoke-test command output for the surfaces being launched.
- Review provider receipts for auth callbacks, database RLS, billing webhooks, env vars, deployment settings, DNS, and monitoring signal when applicable.
- Inspect release diffs and changelog entries for migrations, env changes, provider SDK updates, and rollback notes.
- Classify the launch result as ready, ready after named human/provider actions, or not ready because evidence is missing.

## Failure Modes To Catch

- Saying "ready to launch" from a successful build while auth, billing, database policy, env, or monitoring evidence is missing.
- Treating installed SDKs as proof that provider dashboards, callbacks, webhooks, or alerts are configured.
- Ignoring preview-to-production drift in Vercel env vars, Clerk redirect URLs, Stripe endpoints, Supabase policies, or Sentry projects.
- Hiding uncertainty in vague phrases instead of naming the exact receipt needed to close each launch gap.

## Acceptable Evidence

- Fresh command output for the changed app surface, such as typecheck, tests, build, migration verification, or smoke checks.
- Provider receipts for each touched external system, including project/environment, setting path, expected value, and evidence source.
- A release-diff risk summary that calls out migrations, env changes, provider SDK changes, rollback limits, and dashboard actions.
- A final launch classification: ready, ready after named human/provider actions, or not ready because required evidence is missing.

## What Must Be Verified

- The app has fresh local verification evidence for the changed surfaces.
- Auth, database, billing, env, deployment, and monitoring risks have been checked when applicable.
- Provider dashboard requirements are either proven by connected evidence or listed as human actions.
- Known missing evidence is stated plainly.
- The launch answer distinguishes ready, ready with human checks, and not ready.

## Human-Action Boundary

The repo cannot prove live provider dashboards, payment account status, DNS propagation, production secrets, or monitoring signal without external evidence. Ask the user to provide or perform those checks before a launch claim.

## Provider References

- Vercel production checklist: https://vercel.com/docs/production-checklist
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Supabase row-level security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Stripe webhooks: https://docs.stripe.com/webhooks
- Sentry Next.js manual setup: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

## Output

Return:

1. evidence found
2. evidence missing
3. repo-code fixes or none
4. provider or human action needed

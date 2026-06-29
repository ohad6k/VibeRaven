---
name: release-review
description: Review release diffs for provider, auth, billing, env, and data-risk changes.
---

# Release Review

## When To Use

Use this when comparing versions, reviewing a release diff, explaining drift, or deciding whether a release is safe to deploy.

## Repo Signals To Inspect

- `git diff`
- `CHANGELOG.md`
- release notes
- migrations
- `package.json`
- provider SDK versions
- auth, billing, env, database, monitoring, and deployment files
- Studio release/version context when available

## Agent Actions

- Review package, lockfile, framework config, provider SDK, and deployment config changes for production-sensitive behavior shifts.
- Inspect migrations, schema files, seed changes, and data-access diffs for destructive or tenant/user isolation risks.
- Compare auth, billing, webhook, env, monitoring, and provider integration diffs against required verification commands.
- Check release notes or PR text for rollback notes, migration ordering, and provider dashboard actions.

## Failure Modes To Catch

- Treating a dependency bump as safe without checking provider SDK migration notes, runtime changes, or config defaults.
- Shipping database migrations without identifying destructive operations, backfill order, rollback limits, or tenant isolation impact.
- Claiming provider dashboards are updated when the diff only changes repo files.
- Missing env, callback URL, webhook endpoint, DNS, or monitoring changes because they are outside the changed source files.

## Acceptable Evidence

- A fresh diff summary grouped by auth, billing, database, deployment, monitoring, and provider-dashboard risk.
- Local verification output for changed surfaces, such as tests, typecheck, build, migration dry run, or targeted smoke checks.
- Release notes or PR notes that name migration order, rollback constraints, env changes, and human/provider actions.
- Provider evidence when dashboard state matters, such as exported config, connected MCP/tool context, or a human receipt.

## What Must Be Verified

- Provider-sensitive code changes are identified and grouped by risk area.
- Database migrations and data-shape changes are called out.
- Auth, billing, webhook, env, and monitoring changes are reviewed for production impact.
- Required verification commands are tied to the changed surfaces.
- Unknown provider dashboard state is listed as an external risk.

## Human-Action Boundary

The repo cannot prove deployed provider state or production traffic behavior from a diff alone. Ask for dashboard checks, release receipts, or connected provider evidence when the diff touches external systems.

## Provider References

- GitHub comparing commits: https://docs.github.com/en/repositories/working-with-files/using-files/comparing-files
- GitHub releases: https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Supabase row-level security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Stripe webhooks: https://docs.stripe.com/webhooks

## Output

Return:

1. evidence found
2. evidence missing
3. repo-code fixes or none
4. provider or human action needed

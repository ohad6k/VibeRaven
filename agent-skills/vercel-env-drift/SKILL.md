---
name: vercel-env-drift
description: Compare local, preview, and production environment assumptions before deploy.
---

# Vercel Env Drift

## When To Use

Use this when a repo deploys on Vercel and environment variables, build-time config, runtime config, preview URLs, callback URLs, or production-only settings may differ. This skill is most useful after auth, billing, database, monitoring, base URL, or deployment config changes.

## Repo Signals To Inspect

- `.env.example`
- `.env.local.example`
- `.env.production.example`
- `vercel.json`
- `next.config.*`
- environment variable schema or validation files
- deployment scripts and CI workflows
- `process.env.*`
- `NEXT_PUBLIC_*`
- `VERCEL_ENV`, `VERCEL_TARGET_ENV`, `VERCEL_URL`, `VERCEL_BRANCH_URL`, `VERCEL_PROJECT_PRODUCTION_URL`
- auth, OAuth, webhook, email, monitoring, and billing callback URL variables

## Concrete Checks

- Build an env inventory from code reads and compare it to `.env*` examples and validation schemas; every required variable needs a documented name and failure behavior.
- Separate build-time variables from runtime variables; values read during build cannot be fixed by changing a provider dashboard value after the deployment is already built.
- Check `NEXT_PUBLIC_*` variables for accidental secrets; public variables are bundled for client-side use in Next.js.
- Compare app base URL variables against Vercel system variables; `VERCEL_URL` and framework equivalents are hostnames without `https://`, while many provider callbacks require a full absolute URL.
- Check preview and production assumptions: `VERCEL_ENV` can be `production`, `preview`, or `development`, and preview env vars may differ by branch.
- Inspect `vercel.json`, middleware, auth callbacks, Stripe webhook URLs, Clerk redirects, Sentry tunnels, and email domains for hard-coded localhost, preview, or production domains.
- Confirm env changes require redeploy receipts when provider docs say changed env values only affect new deployments.

## Failure Modes To Catch

- Production uses old env values because a deployment was not rebuilt after dashboard changes.
- Preview auth or webhooks work, but production points to a different base URL, callback URL, or webhook endpoint.
- A server secret is exposed through `NEXT_PUBLIC_*` or copied into a public config file.
- The code treats `VERCEL_URL` as a complete URL with protocol when it only contains the domain.
- A branch-specific preview variable overrides the general preview value and creates a hard-to-reproduce failure.
- Provider dashboard values are unknown, but the agent claims env drift is resolved from repo evidence alone.

## Acceptable Proof

- Env inventory mapping each required variable to repo usage, example documentation, environment scope, and public/server classification.
- Validation code or startup checks that fail fast when required env vars are missing or malformed.
- Provider/dashboard export or screenshot confirming production and preview values for variables that cannot be proven from the repo.
- Deployment receipt proving env changes were included in a new deployment.
- A clear list of provider callbacks/webhooks that must be updated after base URL changes.

## What Must Be Proven

- Required variables are documented or validated before runtime.
- Preview and production URL assumptions are explicit.
- Public variables do not contain server secrets.
- Build-time and runtime variables are not confused.
- Missing provider-side values are separated from repo-code fixes.

## Human-Action Boundary

The repo cannot prove Vercel project environment values unless the dashboard state is exported or connected through provider tools. Ask for provider evidence for production, preview, and branch-specific values before claiming drift is resolved.

## Provider References

- Vercel environment variables: https://vercel.com/docs/environment-variables
- Vercel system environment variables: https://vercel.com/docs/environment-variables/system-environment-variables

## Output

Return:

1. evidence found
2. evidence missing
3. repo-code fixes or none
4. provider or human action needed

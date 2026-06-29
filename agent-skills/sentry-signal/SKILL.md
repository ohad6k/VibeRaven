---
name: sentry-signal
description: Distinguish Sentry SDK installed from evidence that errors reach the project.
---

# Sentry Signal

## When To Use

Use this when a repo claims monitoring is ready, Sentry is installed, release health matters, or production errors are expected to be captured. This skill should fire before launch, after framework upgrades, after Sentry config changes, and after release/deploy pipeline changes.

## Repo Signals To Inspect

- `instrumentation-client.*`
- `instrumentation.*`
- `sentry.client.config.*`
- `sentry.server.config.*`
- `sentry.edge.config.*`
- `next.config.*`
- `global-error.*`
- error boundary components
- source map upload configuration
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- release and environment config
- server routes, jobs, and actions with exception handling

## Concrete Checks

- Verify Sentry initializes in every runtime the app uses: browser/client, Node server, edge runtime, and React/App Router error boundaries where applicable.
- Check `next.config.*` for `withSentryConfig` when source maps, release creation, or build-time integration are expected.
- Ensure `SENTRY_AUTH_TOKEN` is used only in CI/build/server contexts and is not exposed to browser bundles or logs.
- Verify release and environment tagging distinguish local, preview, and production events.
- Look for a test route, test command, smoke script, captured exception, dashboard receipt, or deploy receipt proving a current event reached the intended Sentry project.
- If a tunnel route is configured to avoid blockers, ensure middleware does not intercept that tunnel path.
- Check source map settings and upload receipts when readable production stack traces are part of the readiness claim.

## Failure Modes To Catch

- The SDK package is installed but not initialized in the runtime where production errors occur.
- Client events work, but server or edge runtime errors are not registered.
- `SENTRY_AUTH_TOKEN` or other private build credentials leak into client code.
- Preview and production events collapse into the same environment or release, making incidents hard to triage.
- Source maps are configured in code but never uploaded in CI.
- A tunnel route exists but middleware blocks it, so browser events never arrive.
- The agent says monitoring is ready without a fresh event in the Sentry project.

## Acceptable Evidence

- Sentry init files for the app's actual runtimes plus `withSentryConfig` when source maps or build integration are expected.
- Evidence of release and environment tags in config or deployment scripts.
- CI/build logs showing source map upload or a documented reason source maps are not required.
- A Sentry dashboard receipt, event ID, test error, smoke route output, or provider/MCP evidence proving current signal reaches the intended project.
- A clear statement of which runtime is still unproven if only some runtimes have signal.

## What Must Be Verified

- The Sentry SDK is initialized in the runtime paths the app uses.
- DSNs and auth tokens are scoped correctly for public and server use.
- Source map upload is configured when readable production stack traces are expected.
- A test event, release marker, or provider evidence proves signal reaches the project.
- Missing dashboard evidence is not replaced by "SDK installed" claims.

## Human-Action Boundary

The repo cannot prove events arrive in the live Sentry project unless provider evidence, a test event result, or MCP/tool output is available. Ask the user to verify a current test error, release, environment, and source map state in Sentry.

## Provider References

- Sentry Next.js manual setup: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
- Sentry Next.js build/source map options: https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/build/
- Sentry Next.js troubleshooting and tunneling: https://docs.sentry.io/platforms/javascript/guides/nextjs/troubleshooting/

## Output

Return:

1. evidence found
2. evidence missing
3. repo-code fixes or none
4. provider or human action needed

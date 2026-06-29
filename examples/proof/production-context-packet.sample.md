# Production Context Packet — public-safe sample

Use this before an AI agent changes code that may affect a deployed app. The goal is not to paste a full incident log into the prompt; it is to give the agent a small, evidence-backed boundary for what is known, what is risky, and what still needs provider or human verification.

## Task

Fix a failing checkout success redirect after the `2026-06-20` release.

## Release / Version Boundary

| Field | Evidence |
| --- | --- |
| Known good | `v1.8.2` / release `2026-06-13` |
| Suspect/current | `v1.9.0` / release `2026-06-20` |
| Comparison command | `git diff v1.8.2..v1.9.0 -- routes/ lib/ migrations/ package.json` |
| Changed surfaces | Stripe webhook route, auth callback route, env example, checkout success page |
| Rollback note | No database rollback required; provider dashboard webhook URL may still need human confirmation |

## Provider Evidence Available

| Provider | Evidence Found | Evidence Missing / Human Boundary |
| --- | --- | --- |
| Stripe | Repo webhook handler changed from `/api/stripe/webhook` to `/api/billing/webhook`; idempotency key still present | Live webhook endpoint and signing secret are dashboard state; do not claim fixed from repo alone |
| Auth | Callback route changed from `/auth/callback` to `/api/auth/callback`; local test route passes | Production allowed callback URLs require dashboard verification |
| Vercel | `VERCEL_URL` fallback removed from success redirect code | Preview/prod env values are external state; ask for export or human screenshot/receipt |
| Database | No migration in this release range | None for this task |

## Pre-Change Agent Contract

Before editing, the agent should answer:

1. Which release introduced the likely break?
2. Which provider/account state could make a repo-correct patch still fail?
3. Which files are safe to edit locally?
4. Which dashboard checks must remain human/provider actions?
5. What command or smoke will prove the repo-side change?

## Proposed Safe First Edit

Patch only the success redirect construction and keep provider dashboard assumptions explicit. Do not rotate secrets, modify live Stripe settings, or claim the production webhook URL changed unless provider evidence is supplied.

## Verification Plan

- `npm test -- checkout-success`
- `npm run build`
- Local smoke: simulate successful checkout redirect with a placeholder session id.
- Provider/human follow-up: verify Stripe webhook endpoint URL and auth callback URL in production dashboard.

## Post-Change Evidence Summary

| Check | Result |
| --- | --- |
| Tests | `npm test -- checkout-success` passed |
| Build | `npm run build` passed |
| Repo files changed | `routes/checkout/success.ts`, `tests/checkout-success.test.ts` |
| Provider state | Not modified by agent; still requires human/provider confirmation |
| Remaining risk | Production env/dashboard may still point at old callback or webhook URL |

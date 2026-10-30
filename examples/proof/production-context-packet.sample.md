# Production context packet: synthetic sample

Adapted from caioribeiroclw-pixel's [public PR #54](https://github.com/ohad6k/VibeRaven/pull/54), commit `5828b7c10ed9d473fc81a74515e37b1bdae43cbf`.
This preserves the contributor's compact release/provider boundary. All dates, versions, paths and results below are fictional placeholders for a user's app, not VibeRaven release evidence. No commands or provider checks have been performed for this example.

## Task and release boundary

Investigate a checkout success redirect after the example app's `2026-06-20` release.

| Field | Illustrative value |
| --- | --- |
| Previously working app version | `v1.8.2`, `2026-06-13` (unverified) |
| Suspect app version | `v1.9.0`, `2026-06-20` (unverified) |
| Proposed comparison | `git diff v1.8.2..v1.9.0 -- routes/ lib/ migrations/ package.json` |
| Suspect surfaces | Webhook route, auth callback, redirect construction |
| Rollback boundary | Inspect actual migrations and deployment state before proposing rollback |

## Evidence to collect before editing

| Surface | Hypothesis to check in the repository | External boundary |
| --- | --- | --- |
| Stripe | Handler moved from `/api/stripe/webhook` to `/api/billing/webhook` | Live endpoint URL, signing configuration and deliveries are not established by code |
| Auth | Callback moved from `/auth/callback` to `/api/auth/callback` | Allowed production callback URLs need separate verification |
| Deployment | Success redirect no longer uses the expected base URL | Actual preview and production configuration is not checked |
| Database | No migration is expected in this example | Verify the real comparison before concluding no data change |

Before editing, identify the first failing version, the smallest repo change to test, and the provider checks that remain outside the patch. Do not rotate secrets or change live settings based on this sample.

## Proposed local verification

- Run the app's actual checkout redirect test, for example `npm test -- checkout-success` if that test exists.
- Run the app's documented build.
- Exercise the redirect locally using placeholder input.
- Ask the owner to verify the actual provider configuration and retain redacted receipts.

## Evidence record, currently unfilled

| Check | Result |
| --- | --- |
| Release comparison | Not run |
| Tests and build | Not run |
| Local redirect smoke | Not run |
| Files changed | None |
| Live provider checks | Not checked; no provider writes |
| Remaining risk | Actual deployment, auth and webhook state unknown |

Replace hypotheses with evidence from the real app. A local passing test does not establish a working production checkout.

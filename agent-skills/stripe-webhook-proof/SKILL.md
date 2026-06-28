---
name: stripe-webhook-proof
description: Verify Stripe webhook signature handling, test/live separation, and provider dashboard evidence.
---

# Stripe Webhook Proof

## When To Use

Use this when a repo accepts Stripe events, updates billing state, gates paid features, records subscriptions, fulfills orders, or claims payments are production-ready. This skill should fire before launch and after any checkout, billing portal, subscription, product, price, or webhook handler change.

## Repo Signals To Inspect

- `app/api/**/route.ts`
- `pages/api/**`
- `src/**/stripe*`
- webhook handlers, billing services, and entitlement code
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `stripe.webhooks.constructEvent`
- `stripe-signature`
- `checkout.session.completed`, `invoice.paid`, `customer.subscription.*`, and other handled event names
- database writes that store Stripe event IDs, subscription IDs, customer IDs, or entitlement state

## Concrete Checks

- Inspect the webhook route for raw body handling; signature verification must receive the exact body Stripe sent, not a parsed/re-serialized JSON object.
- Confirm the handler reads the `Stripe-Signature` header and calls `stripe.webhooks.constructEvent(requestBody, signature, endpointSecret)` or an equivalent official-library verification path.
- Check that the endpoint secret comes from `STRIPE_WEBHOOK_SECRET`, starts conceptually as a `whsec_` value, and is not confused between Stripe CLI forwarded events and Dashboard-managed endpoints.
- Verify framework middleware order or route configuration does not parse the body before signature verification; this matters in Express and Next.js Pages Router setups.
- Compare test and live mode handling: secret keys, publishable keys, webhook secrets, product IDs, price IDs, and endpoint URLs must not mix modes in the same environment.
- Check idempotency or replay handling: event IDs should be stored, upserts should be safe, and repeated webhook delivery should not double-grant access or double-fulfill.
- Confirm unknown event types are logged safely and ignored without treating them as success.

## Failure Modes To Catch

- The route accepts unsigned JSON and trusts `event.type` without verifying Stripe's signature.
- The route parses JSON before signature verification, causing `constructEvent` to fail in production.
- The code uses the Stripe CLI webhook secret for a Dashboard endpoint, or test secrets for live events.
- Billing state changes are not idempotent, so retries duplicate entitlements, orders, emails, or credits.
- Client code receives `STRIPE_SECRET_KEY` or webhook secrets instead of only publishable keys.
- The dashboard endpoint URL, subscribed events, or live/test mode is not proven, but the agent says webhooks are ready.

## Acceptable Proof

- Code evidence of raw-body signature verification using the official Stripe library or an equivalent verified library path.
- A failing-path test or handler branch that rejects missing/invalid `Stripe-Signature` or `STRIPE_WEBHOOK_SECRET`.
- Database or code evidence that processed Stripe event IDs or safe upsert semantics prevent duplicate processing.
- Environment examples showing separate server secret key, publishable key, and webhook secret names.
- Stripe Dashboard or CLI receipt showing the correct endpoint URL, subscribed event types, signing secret source, and live/test mode.

## What Must Be Proven

- Webhook handlers verify Stripe signatures against the raw request body.
- Billing mutations are idempotent for repeated Stripe events.
- Test keys, live keys, product IDs, price IDs, and webhook secrets are not mixed.
- Client code only receives publishable keys.
- Provider dashboard endpoint configuration is backed by evidence or called out as missing.

## Human-Action Boundary

The repo cannot prove which webhook endpoint is active in the Stripe Dashboard unless provider evidence is connected. Ask the user to verify live endpoint URL, subscribed events, signing secret source, live/test mode, and recent successful delivery.

## Provider References

- Stripe webhook signature verification: https://docs.stripe.com/webhooks/signature
- Stripe webhooks: https://docs.stripe.com/webhooks

## Output

Return:

1. evidence found
2. evidence missing
3. repo-code fixes or none
4. provider or human action needed

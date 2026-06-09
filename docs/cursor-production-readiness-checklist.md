# Cursor Production Readiness Checklist

Use this checklist when a Cursor-built app works locally but is not proven ready for real users.

Run VibeRaven from the project root:

```bash
npx -y @viberaven/cli --agent-mode
```

## Check Before Launch

- Confirm local, preview, and production env vars are separated and documented.
- Verify auth is enforced on server routes and API handlers, not just client screens.
- Check Stripe or other payment webhooks, customer state, and entitlement logic.
- Review database migrations, RLS rules, backups, and seed-data assumptions.
- Confirm deployment settings, domains, redirects, callback URLs, and provider dashboard steps.
- Add monitoring, error handling, and test coverage for the first paid-user path.
- Give Cursor one focused prompt with files, constraints, and verification steps.

## How VibeRaven Helps

VibeRaven scans repo evidence, maps launch gaps, writes `.viberaven/agent-tasklist.md`, and prints `VIBERAVEN_NEXT_ACTION` so Cursor has one concrete production-readiness task instead of a vague "make it production ready" request.

Canonical page: https://viberaven.dev/cursor-production-readiness-checklist

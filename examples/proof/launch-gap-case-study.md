# Redacted launch-gap case study

This example shows the kind of evidence VibeRaven is designed to produce before an AI-built app is called production-ready.

The app looked ready locally:

- Next.js started without errors.
- Supabase client calls worked with a seeded local database.
- Vercel preview deployed successfully.
- The coding agent summarized the work as ready to ship.

VibeRaven still blocked the launch because local success did not prove the production boundary.

## Scan

```bash
npx -y viberaven --agent-mode
```

## Gate result

```json
{
  "gate": {
    "status": "not_clear",
    "criticalCount": 2,
    "warningCount": 3,
    "providerBoundaryRequired": true
  },
  "topGapIds": [
    "auth_secret_missing",
    "rls_disabled",
    "missing_health_route"
  ]
}
```

## What VibeRaven separated

Repo-code gaps the agent could fix:

- Add the missing auth secret placeholder to `.env.example`.
- Add a deploy health route for preview and production probes.
- Add repo evidence that the expected Supabase policies exist.

Provider or user confirmation still required:

- Confirm production Supabase RLS is enabled in the provider project.
- Confirm production secrets exist in the deploy provider.
- Confirm callback URLs match local, preview, and production domains.

## Why the block matters

The local app and preview deploy were not enough evidence. Without the gate, an agent could mark the project production-ready while the production database, secrets, or callbacks still needed provider-side verification.

The correct next step was not "deploy again." It was:

```bash
npx -y viberaven prompt --gap auth_secret_missing
```

Then fix one repo-code gap and re-run:

```bash
npx -y viberaven --verify
```

The launch claim is only safe when `.viberaven/gate-result.json` reports a clear gate, or when the remaining blocker is explicitly a provider/user action.

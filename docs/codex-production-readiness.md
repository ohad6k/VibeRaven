# Codex Production Readiness

Use this guide when Codex has built or modified an app and the next step is deciding whether it is safe to launch.

Run VibeRaven from the project root:

```bash
npx -y @viberaven/cli --agent-mode
```

## Check Before Launch

- List the product systems the app actually uses: auth, database, payments, deploy, monitoring, tests.
- Open the paths Codex touched last and verify server-side enforcement, not only UI flows.
- Check environment variables are documented and separated for preview vs production.
- Verify webhook handlers, idempotency, and subscription or entitlement state.
- Confirm build and deploy commands work from a clean install.
- Ask Codex for one system audit with files, risks, and verification steps.

## How VibeRaven Helps

VibeRaven gives Codex a production-readiness map, task list, and next action. The goal is one high-signal fix at a time, not a broad rewrite.

Canonical page: https://viberaven.dev/codex-production-readiness

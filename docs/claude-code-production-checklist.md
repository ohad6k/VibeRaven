# Claude Code Production Checklist

Use this checklist when a Claude Code-built app works as a demo but still needs production proof.

Run VibeRaven from the project root:

```bash
npx -y @viberaven/cli --agent-mode
```

## Check Before Launch

- Confirm which services are real in the repo versus mentioned only in comments or README.
- Verify auth is enforced on API routes and server handlers, not only in client components.
- Check database migrations, RLS or ownership rules, and production-vs-development separation.
- Audit Stripe or billing webhooks, customer state, and entitlement checks end to end.
- Review Vercel or other deploy config, env vars, domains, and callback URLs.
- Add monitoring and a narrow test or manual check for the first paid-user path.
- Give Claude Code one scoped fix prompt with files, constraints, and verification steps.

## How VibeRaven Helps

VibeRaven creates a Mission Map from repo evidence and turns broad production risk into the next practical Claude Code prompt. It keeps provider dashboard work explicit and separate from repo-code fixes.

Canonical page: https://viberaven.dev/claude-code-production-checklist

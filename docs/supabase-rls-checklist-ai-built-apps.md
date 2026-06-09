# Supabase RLS Checklist For AI-Built Apps

Use this checklist when an AI-built app uses Supabase and needs data-access proof before launch.

Run VibeRaven from the project root:

```bash
npx -y @viberaven/cli --agent-mode
```

## Check Before Launch

- Confirm RLS is enabled for user-owned and sensitive tables in the production project.
- Review policies for select, insert, update, and delete instead of relying on client filters.
- Make sure service-role keys stay server-side and never appear in client bundles or public env vars.
- Check auth session handling across server routes, API handlers, storage, and realtime paths.
- Verify migrations, seed data, backups, and production-vs-local project separation.
- Turn the highest-risk Supabase gap into one scoped coding-agent prompt with verification.

## Important Boundary

VibeRaven can read repo evidence for Supabase clients, migrations, env var names, and API routes. It should not claim dashboard-only RLS state is complete from code alone.

Canonical page: https://viberaven.dev/supabase-auth-rls-checklist-ai-apps

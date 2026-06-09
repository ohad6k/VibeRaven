# Vercel Deploy Checklist For AI-Built Apps

Use this checklist before promoting an AI-built app from Vercel preview to production.

Run VibeRaven from the project root:

```bash
npx -y @viberaven/cli --agent-mode
```

## Check Before Launch

- List the env vars required by local, preview, and production and confirm which ones differ.
- Verify production domains, redirects, callback URLs, webhook URLs, and canonical URLs.
- Check build commands, lockfiles, ignored files, monorepo settings, and runtime assumptions.
- Review cache headers, function regions, API routes, and data-fetching behavior for production traffic.
- Confirm monitoring, logs, error reporting, and rollback steps before inviting users.
- Create one focused coding-agent prompt for the deployment gap that repo evidence can improve.

## How VibeRaven Helps

VibeRaven scans Vercel-facing repo evidence and turns preview-to-production risk into one scoped task for Cursor, Claude Code, Codex, or another coding agent.

Canonical page: https://viberaven.dev/vercel-preview-to-production-checklist

# GitHub repository metadata

| Repo | URL | Purpose |
|------|-----|---------|
| **Private product** | https://github.com/ohad6k/viberaven-dev | Full monorepo - CLI, extension, landing source, env, billing, internal development |
| **Public discovery** | https://github.com/ohad6k/VibeRaven | Agent-facing GitHub surface only - README, templates, `llms.txt`, agent rules. **Not** full source code |

Sync policy: **manual curated export** from private -> public. See [`public-repo-export.md`](./public-repo-export.md).

## Public repo (`ohad6k/VibeRaven`) - About

Set on https://github.com/ohad6k/VibeRaven/settings:

- **Description:** Agent production layer for AI-built Supabase/Vercel apps
- **Website:** https://viberaven.dev

## Public repo - Topics

`production-readiness`, `supabase`, `vercel`, `cursor`, `claude-code`, `codex`, `agents-md`, `mcp-server`, `ai-built-apps`, `rls`

## Public README - required boundary line

The root README on `ohad6k/VibeRaven` must include (verbatim):

> VibeRaven public repo is the agent discovery and installation surface. Product source code and service internals live in a private repository.

Canonical export source: [`docs/public-repo/README.md`](./public-repo/README.md).

## Never push to public

Full monorepo, source code, `.env`, billing code, private configs, landing source, internal implementation.

## Related

- [Canonical surface plan - two-repository architecture](./plans/2026-06-09-viberaven-agent-canonical-surface-plan.md#two-repository-architecture-operator-note)
- [Public repo export checklist](./public-repo-export.md)

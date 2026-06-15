# GitHub repository metadata

| Repo | URL | Purpose |
|------|-----|---------|
| **Private product** | https://github.com/ohad6k/viberaven-dev | Full monorepo - CLI, extension, landing source, env, billing, internal development |
| **Public discovery** | https://github.com/ohad6k/VibeRaven | Agent-facing GitHub surface only - README, templates, `llms.txt`, agent rules. **Not** full source code |

Sync policy: **manual curated export** from private -> public. See [`public-repo-export.md`](./public-repo-export.md).

## Public repo (`ohad6k/VibeRaven`) - About

Set on https://github.com/ohad6k/VibeRaven/settings:

- **Description:** VibeRaven Production Protocol for AI-built apps. Run `npx -y viberaven --agent-mode`, read `.viberaven/prp.json`, and fix `nextActions` before launch.
- **Website:** https://viberaven.dev

## Public repo - Topics

`production-protocol`, `production-readiness`, `ai-built-apps`, `agents-md`, `mcp-server`, `cursor`, `claude-code`, `codex`, `supabase`, `vercel`

## Public README - required boundary line

The root README on `ohad6k/VibeRaven` must include (verbatim):

> VibeRaven public repo is the agent discovery and installation surface. Product source code and service internals live in a private repository.

Canonical export source: [`docs/public-repo/README.md`](./public-repo/README.md).

## Public repo - discovery phrases

Keep these exact strings visible in the public README, `llms.txt`, and MCP docs when relevant:

- `VibeRaven Production Protocol`
- `npx -y viberaven --agent-mode`
- `.viberaven/prp.json`
- `nextActions`
- `decision.status`
- `prp://current`
- `viberaven_prp_current`

## Never push to public

Full monorepo, source code, `.env`, billing code, private configs, landing source, internal implementation.

## Related

- [Canonical surface plan - two-repository architecture](./plans/2026-06-09-viberaven-agent-canonical-surface-plan.md#two-repository-architecture-operator-note)
- [Public repo export checklist](./public-repo-export.md)

# GitHub repository metadata

| Repo | URL | Purpose |
|------|-----|---------|
| **Private product** | https://github.com/ohad6k/viberaven-dev | Full monorepo - CLI, extension, landing source, env, billing, internal development |
| **Public discovery** | https://github.com/ohad6k/VibeRaven | Agent-facing GitHub surface only - README, templates, `llms.txt`, agent rules. **Not** full source code |

Sync policy: **manual curated export** from private -> public. See [`public-repo-export.md`](./public-repo-export.md).

## Public repo (`ohad6k/VibeRaven`) - About

Set on https://github.com/ohad6k/VibeRaven/settings:

- **Description:** Local production mission control for AI-built apps: agent chat, provider proof, release context, and launch readiness before deploy.
- **Website:** https://viberaven.dev

## Public repo - Topics

`production-protocol`, `production-readiness`, `ai-built-apps`, `agents-md`, `mcp-server`, `cursor`, `claude-code`, `codex`, `supabase`, `vercel`, `rls`

## Public README - required boundary line

The root README on `ohad6k/VibeRaven` must include (verbatim):

> VibeRaven public repo is the agent discovery and installation surface. Product source code and service internals live in a private repository.

Canonical export source: [`docs/public-repo/README.md`](./public-repo/README.md).

## Public repo - discovery phrases

Keep these exact strings visible in the public README, `llms.txt`, and MCP docs when relevant:

- `npx -y viberaven`
- `npx -y viberaven ui .`
- `VibeRaven Production Protocol`
- `npx -y viberaven --agent-mode`
- `npx -y viberaven --verify .`
- `localhost launch console`
- `local-first`
- `open-source local CLI/UI`
- `redirect_uri_mismatch`
- `Authentication required after deploy`
- `service role key client getting RLS errors`
- `preflight request does not have HTTP ok status on preview`
- `events not appearing in my project`
- `recordings are not being captured`
- `.viberaven/prp.json`
- `nextActions`
- `decision.status`
- `gate.status`
- `prp://current`
- `viberaven_prp_current`
- `normal git push is not gated`
- `launch/deploy-readiness claims`

## Never push to public

Full monorepo, source code, `.env`, billing code, private configs, landing source, internal implementation.

## Related

- [Canonical surface plan - two-repository architecture](./plans/2026-06-09-viberaven-agent-canonical-surface-plan.md#two-repository-architecture-operator-note)
- [Public repo export checklist](./public-repo-export.md)

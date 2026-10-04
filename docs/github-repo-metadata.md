# GitHub repository metadata

| Repo | URL | Purpose |
|------|-----|---------|
| **Private product** | https://github.com/ohad6k/viberaven-dev | Full monorepo - CLI, extension, landing source, env, billing, internal development |
| **Public discovery** | https://github.com/ohad6k/VibeRaven | Agent-facing GitHub surface only - README, templates, `llms.txt`, agent rules. **Not** full source code |

Sync policy: **manual curated export** from private -> public. The export checklist is `docs/public-repo-export.md` in the private repo.

## Public repo (`ohad6k/VibeRaven`) - About

Set on https://github.com/ohad6k/VibeRaven/settings:

- **Description:** Local repository check for AI-built apps on Vercel + Supabase: RLS gaps in migrations, secrets in client code, env var drift, Stripe webhook checks. Advice, not a gate. npx -y viberaven@1.6.2 check
- **Website:** https://viberaven.dev

## Public repo - Topics

`claude-code`, `codex`, `cursor`, `production-readiness`, `supabase`, `vercel`, `ai-built-apps`, `ai-agents`, `gemini-cli`, `vibe-coding`, `viberaven`, `ai-coding-agent`, `cli`, `ai`, `developer-tools`, `devtools`, `llm`, `open-source`, `mcp`

## Public README - required boundary line

The root README on `ohad6k/VibeRaven` must include (verbatim):

> VibeRaven public repo is the agent discovery and installation surface. Product source code and service internals live in a private repository.

Canonical export source: `docs/public-repo/README.md` in the private repo.

## Never push to public

Full monorepo, source code, `.env`, billing code, private configs, landing source, internal implementation.

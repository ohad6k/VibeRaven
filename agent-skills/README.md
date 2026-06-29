# VibeRaven Agent Skills

This directory contains the public VibeRaven skill library for AI coding agents. It is designed to be browsed, installed, shared, and used as the front door for VibeRaven.

The library is organized around production skills for AI-built apps: auth, billing, database, deployment, monitoring, provider setup, and release drift. Its job is to teach agents to use evidence, provider context, and human-action boundaries while they work, not to make unsupported "production ready" claims.

Install the Studio/context skill with the Agent Skills CLI:

```bash
npx -y skills add ohad6k/VibeRaven --skill viberaven
```

The existing `agent-skills/viberaven` skill is the Studio and context skill. It points agents toward the current local Studio:

```bash
npx -y viberaven
```

Agents should use Studio context, provider evidence, MCP status when available, and release comparison before changing production-sensitive code. Provider dashboard checks still need human verification when they cannot be proven from repo or tool evidence.

## Plugin-Style Pack

The same skills are packaged as the **VibeRaven Production Skills** for hosts that support plugin-style skill bundles:

- Codex: `.codex-plugin/plugin.json`
- Claude Code: `.claude-plugin/plugin.json`
- Gemini CLI: `gemini-extension.json`
- Generic plugin hosts: `plugin.yaml`
- Command prompts: `commands/viberaven-*.toml`

See `docs/agent-portability.md` for the portability matrix. Adapter files stay thin; `agent-skills/*/SKILL.md` remains the canonical source.

## Production Skills Pack

The first production skills library includes:

- `supabase-rls`: verify tenants cannot read each other before launch.
- `stripe-webhooks`: verify billing events are signed, mode-aware, and idempotent before money moves.
- `vercel-env-sync`: verify local, preview, and production env assumptions match before deploy.
- `clerk-callbacks`: verify auth redirects survive localhost, preview, and production URLs.
- `sentry-signal`: verify errors actually reach Sentry instead of stopping at "SDK installed."
- `release-review`: verify a release diff has been reviewed for provider, auth, billing, env, data, and monitoring risk.
- `provider-actions`: separate code fixes from dashboard steps that require a human or connected provider tool.
- `launch-readiness`: collect the evidence needed before calling an AI-built app launch-ready.
- `evidence-first`: force evidence labels and escalate unknown provider state instead of guessing.

Each production skill includes concrete checks, failure modes, acceptable evidence, provider references, and a shared output contract:

1. evidence found
2. evidence missing
3. repo-code fixes or none
4. provider or human action needed

See `docs/production-skills.md` for the browsable landing doc.

Older scan/gate commands may appear in historical docs, but they are not the default public flow for the current open-source release.

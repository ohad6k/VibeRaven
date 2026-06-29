# VibeRaven Agent Skills

This directory contains the public VibeRaven skill library for AI coding agents. It is designed to be browsed, installed, shared, and used as the front door for VibeRaven.

The library is organized around production skills for AI-built apps: auth, billing, database, deployment, monitoring, provider setup, and release drift. Its job is to teach agents to use evidence, provider context, MCP context when available, and human-action boundaries while they work, not to make unsupported "production ready" claims.

Install the Studio/context skill with the Agent Skills CLI:

```bash
npx -y skills add ohad6k/VibeRaven --skill viberaven
```

The existing `agent-skills/viberaven` skill is the Studio and context skill. It points agents toward the current local Studio:

```bash
npx -y viberaven
```

Agents should use Studio context, provider evidence, MCP status when available, and release comparison while changing production-sensitive code. The skills can guide repo edits, tests, release review, provider handoff, and evidence collection. Provider dashboard actions still need human verification when they cannot be completed through repo code or proven through connected tools.

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

- `supabase-rls`: design or repair RLS work while separating repo SQL from live dashboard state.
- `stripe-webhooks`: implement safer webhook handling, idempotency, mode separation, and provider follow-up.
- `vercel-env-sync`: fix env assumptions across local, preview, and production without guessing dashboard values.
- `clerk-callbacks`: debug auth callback, redirect, preview URL, and route-protection drift.
- `sentry-signal`: wire or review monitoring so installed SDKs are not mistaken for working signal.
- `release-review`: review diffs and guide release-risk fixes for provider, auth, billing, env, data, and monitoring changes.
- `provider-actions`: separate code fixes from dashboard steps that require a human or connected provider tool.
- `launch-readiness`: collect the evidence needed before calling an AI-built app launch-ready.
- `evidence-first`: force evidence labels and escalate unknown provider state instead of guessing.

Each production skill includes agent actions, failure modes, acceptable evidence, MCP/provider boundaries, provider references, and a shared output contract:

1. evidence found
2. evidence missing
3. repo-code fixes or none
4. provider or human action needed

See `docs/production-skills.md` for the browsable landing doc.

Older scan/gate commands may appear in historical docs, but they are not the default public flow for the current open-source release.

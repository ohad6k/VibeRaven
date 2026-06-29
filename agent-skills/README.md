# VibeRaven Agent Skills

This directory contains the public VibeRaven skill library for AI coding agents. The point is simple: agents should know what changed, what evidence exists, and what provider context is still missing before they patch real apps.

Install the Studio/context skill and the version-context skill with the Agent Skills CLI:

```bash
npx -y skills add ohad6k/VibeRaven --skill viberaven
npx -y skills add ohad6k/VibeRaven --skill what-broke
```

`viberaven` points agents toward the local Studio:

```bash
npx -y viberaven
```

`what-broke` teaches agents to stop guessing which version broke the app. It builds version/release context from git tags, version names, changelog entries, and git diffs, then connects the change to provider context such as database, storage, deployment, and external runtime behavior.

## Plugin-Style Pack

The same skills are packaged as the **VibeRaven Production Skills** for hosts that support plugin-style skill bundles:

- Codex: `.codex-plugin/plugin.json`
- Claude Code: `.claude-plugin/plugin.json`
- Gemini CLI: `gemini-extension.json`
- Generic plugin hosts: `plugin.yaml`
- Command prompts: `commands/viberaven-*.toml`

See `docs/agent-portability.md` for the portability matrix. Adapter files stay thin; `agent-skills/*/SKILL.md` remains the canonical source.

## Production Skills Pack

The public skill library includes:

- `what-broke`: find which version changed behavior from release names, changelogs, tags, and git diffs before patching blind.
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

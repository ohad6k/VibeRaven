# Production Skills

VibeRaven production skills are the public front door for AI-built apps that are getting close to real users. They are small, browsable workflows for coding agents that need to implement, repair, review, or verify auth, billing, database, deployment, monitoring, provider setup, and release safety before saying "production ready."

They are not passive reports. A skill can guide repo edits, tests, release review, provider handoff, and evidence collection. The pattern is simple: use repo evidence, fresh command output, connected provider context, MCP status when available, and release/version diffs before making production claims. If provider state is unknown, say it is unknown and ask for a receipt or MCP/provider evidence.

The skills are also packaged as the **VibeRaven Production Skills** through plugin-style metadata for Codex, Claude Code, Gemini CLI, generic plugin hosts, and command prompts in `commands/`.

Each skill should return:

1. evidence found
2. evidence missing
3. repo-code fixes or none
4. provider or human action needed

## The Pack

- `supabase-rls`: design or repair RLS work while separating repo SQL from live dashboard state.
- `what-broke`: find which version changed behavior from release names, changelogs, tags, and git diffs before patching blind.
- `stripe-webhooks`: implement safer webhook handling, idempotency, mode separation, and provider follow-up.
- `vercel-env-sync`: fix env assumptions across local, preview, and production without guessing dashboard values.
- `clerk-callbacks`: debug auth callback, redirect, preview URL, and route-protection drift.
- `sentry-signal`: wire or review monitoring so installed SDKs are not mistaken for working signal.
- `release-review`: review diffs and guide release-risk fixes for provider, auth, billing, env, data, and monitoring changes.
- `provider-actions`: separate code fixes from dashboard steps that require a human or connected provider tool.
- `launch-readiness`: collect the evidence needed before calling an AI-built app launch-ready.
- `evidence-first`: force evidence labels and escalate unknown provider state instead of guessing.

## Why This Is Different

Most agent rules tell the model what to do in general. These skills tell an agent what evidence is acceptable for the production surfaces that break AI-built apps in the real world: RLS, webhook signatures, env drift, callback URLs, monitoring signal, and provider dashboards.

Every production skill includes agent actions, failure modes, acceptable evidence, MCP/provider boundaries, provider references, and the same output contract.

Use these skills alongside `agent-skills/viberaven`, the Studio and context skill for VibeRaven.

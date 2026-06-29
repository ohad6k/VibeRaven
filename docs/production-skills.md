# Production Skills

VibeRaven production skills are the public front door for AI-built apps that are getting close to real users. They are small, browsable instructions for coding agents that need to verify auth, billing, database, deployment, monitoring, provider setup, and release safety before saying "production ready."

The pattern is simple: use repo evidence, fresh command output, connected provider context, MCP status when available, and release/version diffs before making production claims. If provider state is unknown, say it is unknown and ask for a receipt.

The skills are also packaged as the **VibeRaven Production Skills** through plugin-style metadata for Codex, Claude Code, Gemini CLI, generic plugin hosts, and command prompts in `commands/`.

Each skill should return:

1. evidence found
2. evidence missing
3. repo-code fixes or none
4. provider or human action needed

## The Pack

- `supabase-rls`: verify tenants cannot read each other before launch. Anchored on Supabase RLS evidence, anon/service-role boundaries, and policy tests.
- `stripe-webhooks`: verify billing events are signed, mode-aware, and idempotent before money moves.
- `vercel-env-sync`: verify local, preview, and production env assumptions match before deploy.
- `clerk-callbacks`: verify auth redirects survive localhost, preview, and production URLs.
- `sentry-signal`: verify errors actually reach Sentry instead of stopping at "SDK installed."
- `release-review`: verify a release diff has been reviewed for provider, auth, billing, env, data, and monitoring risk.
- `provider-actions`: separate code fixes from dashboard steps that require a human or connected provider tool.
- `launch-readiness`: collect the evidence needed before calling an AI-built app launch-ready.
- `evidence-first`: force evidence labels and escalate unknown provider state instead of guessing.

## Why This Is Different

Most agent rules tell the model what to do in general. These skills tell an agent what evidence is acceptable for the production surfaces that break AI-built apps in the real world: RLS, webhook signatures, env drift, callback URLs, monitoring signal, and provider dashboards.

Every production skill includes concrete checks, failure modes, acceptable evidence, human-action boundaries, provider references, and the same output contract.

Use these skills alongside `agent-skills/viberaven`, the Studio and context skill for VibeRaven.

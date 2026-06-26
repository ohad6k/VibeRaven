# VibeRaven Contributor Quests

VibeRaven is being built in the open as the standard for **operating AI-built apps after launch** — Agentic Product Ops for AI-built apps. This file lists concrete, mergeable quests you can finish in 30–90 minutes without touching private internals.

## How to pick a quest

1. Browse open [good first issues](https://github.com/ohad6k/VibeRaven/contribute) and pick one labeled for a path you like.
2. Comment `/take` (or "I'll take this") so we don't duplicate work.
3. Fork, make a small focused change, open a PR.
4. Maintainer reviews within **48 hours**. You get a public shoutout in the next release notes and the contributors list.

## The five paths

| Path | What you can do | Time |
|------|-----------------|------|
| Bug storyteller | Share a real launch / after-launch failure in Discussions | ~15 min |
| Provider mapper | Add a provider evidence example (Supabase, Vercel, Clerk, Stripe, Resend, Sentry, PostHog, Upstash) | ~45 min |
| Fixture builder | Add a broken→fixed example app or release timeline fixture | ~60 min |
| Prompt writer | Add an agent prompt template for release/provider debugging | ~30 min |
| Docs contributor | Improve setup, screenshots, guides, or examples | ~30 min |

## Quest catalog

Each quest below maps to a good first issue. Acceptance criteria are short on purpose — small and focused beats large and stalled.

### Provider mapper quests

Each provider quest adds a single redacted evidence example under `examples/providers/<provider>/` (or updates an existing one).

- `provider:supabase` — RLS drift evidence example. **Acceptance:** one markdown or JSON file showing a real (redacted) RLS gap and the repo evidence VibeRaven should read.
- `provider:vercel` — preview vs prod env mismatch example. **Acceptance:** a fixture showing env var drift across preview/prod and what evidence proves it.
- `provider:clerk` — auth callback drift example. **Acceptance:** a redacted callback/redirect drift case.
- `provider:stripe` — webhook signature proof fixture. **Acceptance:** an example showing webhook signature verification evidence (no live keys).
- `provider:resend` — domain verification evidence example. **Acceptance:** a doc showing domain/SPF/DKIM verification state.
- `provider:sentry` — monitoring gap example. **Acceptance:** a case where Sentry SDK is installed but not sending data.
- `provider:posthog` — analytics event schema example. **Acceptance:** a redacted event schema fixture.
- `provider:upstash` — cache env var drift example. **Acceptance:** a redacted env drift case.

### Fixture builder quests

- `release-ops` — version comparison fixture v1.0 → v1.1. **Acceptance:** a fixture under `examples/releases/` showing what changed and which provider drifted.
- `release-ops` — release proof report sample. **Acceptance:** a redacted release-evidence report fixture.
- `examples` — supabase-vercel-ai-app minimal sample. **Acceptance:** a tiny sample app structure showing provider evidence layout.
- `examples` — provider-drift timeline fixture. **Acceptance:** a timeline of provider state across two releases.

### Prompt writer quests

- `prompt` — "compare last two releases" prompt template. **Acceptance:** one prompt under `prompts/` an agent can use to compare releases.
- `prompt` — "what provider needs a human action" prompt template. **Acceptance:** one prompt that surfaces provider/user blockers.

### Docs contributor quests

- `docs` — after-launch workflow guide. **Acceptance:** a markdown guide explaining Layer 2 (after launch) workflow.
- `docs` — provider control board explainer. **Acceptance:** a doc explaining the Provider Control Board.
- `docs` — version comparison explainer. **Acceptance:** a doc explaining Versions & Releases.
- `docs` — README video embed troubleshooting. **Acceptance:** a short doc on how to view the demo if the embed is blocked.
- `docs` — translate the install section to another language. **Acceptance:** a localized install block.

## Example PR shape

A great first PR:

- touches 1–3 files
- adds a single example, fixture, prompt, or doc
- uses redacted/fake values only
- keeps VibeRaven bounded rule blocks intact if it touches agent instructions
- links the issue it closes (`Closes #N`)

## Review SLA

Small, focused PRs are reviewed within **48 hours**. If a PR goes idle for more than 7 days without a maintainer comment, ping in the linked issue — the maintainer may be porting an exported file back to the private export source.

## Recognition

Merged contributors are listed in the release notes for the next community release and credited in the README contributors section when one is added. Repeat contributors may be invited to triage issues.

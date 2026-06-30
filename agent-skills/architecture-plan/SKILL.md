---
name: architecture-plan
description: Use when VibeRaven architecture questions have been answered, a feature/fix has unclear boundaries, or an agent needs to turn product answers plus repo evidence into a workstream architecture plan before editing.
---

# VibeRaven: Architecture Plan

Turn low-level product answers into the plan a senior product engineer would want before implementation.

## Hard Rule

Plan before edits. Do not write files, migrations, APIs, UI, commits, or final "Implemented..." summaries until this skill has produced the Architecture Plan.

If called from `architecture-context`, treat the user's numbered answers as source material. Do not ask the same questions again unless a required answer is missing.

## Source Of Truth

Use, in order:

1. User answers from `architecture-context`.
2. Read-only repo evidence: file tree, existing routes, migrations, schemas, tests, provider config examples, git status.
3. VibeRaven Studio/MCP evidence when available.

Never ask for secrets or raw env values.

## Output Contract

Default: write the full plan to a Markdown file, then reply with the file path and a compact summary.

Path:

```text
.viberaven/plans/YYYY-MM-DD-<slug>-architecture-plan.md
```

If writing files is not allowed or the user only wants chat, output the full plan in chat. Either way, the first substantive line must be:

```text
Architecture plan:
```

## Required Plan Shape

The plan must be detailed enough to guide implementation, not a status update.

```md
# <Feature/Fix> Architecture Plan

## Objective
## Product Path
## User Answers Translated
## Current Repo Evidence
## Architecture Boundaries
## Options Considered
## Recommended Architecture
## Workstream Map
## Workstreams
## Implementation Sequence
## Data, Auth, Provider, And Deploy Boundaries
## Verification Plan
## Risks And Fallbacks
## Open Questions
## VibeRaven Route
## Next Skill
```

## Depth

For real app work, produce 800-1800 words unless the request is tiny.

Each workstream must include:

- purpose
- files/areas to inspect or change
- concrete steps
- dependencies
- acceptance signals
- risks/fallback

Use checkbox steps for implementation sequence. Include exact verification commands when the repo shows them.

## Routing

End with one `Next skill:`:

- `production-context` for providers, migrations, auth, storage, billing, webhooks, env, incidents, rollback notes, or fragile customer paths.
- `what-broke` for regressions or version/release drift.
- `go-live` for GitHub, Vercel, deploy, or live URL proof.
- `viberaven` for Studio/MCP/provider-card/release-diff work.

Do not use `Next skill: None` when provider proof, production memory, or live proof remains.

## Failure Patterns

These are failures:

- Starting with `Implemented`, `Changed`, `Verification`, `Done`, or a file list.
- Returning only a brief summary.
- Repeating the six product questions when the user already answered them.
- Editing before the plan exists.
- Treating repo-code changes as proof of provider dashboard state.

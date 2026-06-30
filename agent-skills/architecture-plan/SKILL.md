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

Always write the full plan to a Markdown file first, then reply with the file path and a compact summary. Do not leave the full plan only in chat unless the user explicitly asks for chat-only output or file writes are unavailable.

Path:

```text
.viberaven/plans/YYYY-MM-DD-<slug>-architecture-plan.md
```

If writing files is not allowed or the user only wants chat, output the full plan in chat. Either way, the first substantive line must be:

```text
Architecture plan:
```

## Required Plan Shape

The plan must be large enough to guide implementation without the next agent guessing. Make it closer to a Superpowers workstream plan than a status update.

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
## Execution Tasks
## Implementation Sequence
## Data, Auth, Provider, And Deploy Boundaries
## Test Matrix
## Verification Plan
## Rollout And Rollback
## Risks And Fallbacks
## Open Questions
## Decision Log
## VibeRaven Route
## Next Skill
```

## Depth

For real app work, produce 2500-5000 words unless the request is tiny. If the plan is under 2000 words for nontrivial provider/data/auth work, treat it as incomplete and expand it before replying.

Each workstream must include:

- purpose
- user outcome
- files/areas to inspect or change
- concrete tasks and sub-tasks
- dependencies
- acceptance signals
- verification commands or proof
- risks/fallback

Execution tasks must use checkbox syntax and be small enough to execute one at a time. Include exact verification commands when the repo shows them, expected evidence, and what failure means.

## Detail Requirements

Include all of these for substantial app work:

- 4-8 workstreams, not one broad paragraph.
- A task checklist with file paths or areas for each task.
- A test matrix covering happy path, unauthorized access, deleted/archived data, provider failure, and regression checks.
- Rollout and rollback steps for migrations, provider config, deploy, and user-visible behavior.
- A decision log that records the chosen architecture and rejected alternatives.
- Open provider/MCP proof that code cannot prove.
- A final `Next skill:` that continues the VibeRaven loop.

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

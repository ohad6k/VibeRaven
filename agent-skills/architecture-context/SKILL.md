---
name: architecture-context
description: Use when an AI coding agent starts real app work, feature work, provider work, release work, or any task where unclear architecture could cause broad or unsafe changes.
---

# Architecture Context

AI agents can write code. Before they write code, they need the map a senior engineer would ask for.

Use this skill at the start of real app work: new feature, bugfix, provider setup, release/version work, migration, auth, billing, webhook, deploy, or production-sensitive refactor.

VibeRaven's flow is:

```text
architecture -> version/release context -> provider boundary -> MCP/Studio context -> smallest safe fix
```

## Agent Contract

Read this first, then act:

- Boundary first: name the system boundary before naming files.
- Questions second: ask only for missing facts that change the plan.
- Plan third: plan around product path, architecture boundary, provider state, and version/release context.
- Skill route fourth: choose `what-broke`, `production-context`, `viberaven`, or `go-live`.
- Edit last: change the smallest repo surface the evidence supports.

## First Move

Before planning or editing:

1. Identify the product surface and user path.
2. Map the affected boundary: UI/API, auth/session, data/schema/RLS, provider dashboard, deploy/env, background job/webhook, billing, storage, or release/version drift.
3. Read existing context when present: `.viberaven/production-context.md`, `.viberaven/agent-context.md`, `.viberaven/mission-map.md`, changelog, tags, PR links, and recent git history.
4. Ask only questions whose answers change the plan: last working version, provider involved, deploy target, production symptom, data ownership, dashboard proof, rollback note, or customer path.
5. Build the plan around the boundary first, then the file change.

## Route Skills

- Use `what-broke` when behavior changed, a version broke, or the user says it worked before.
- Use `production-context` when the work needs durable memory: architecture boundary, provider state, incidents, migrations, rollback notes, release notes, or open human actions.
- Use `viberaven` when Studio, MCP context, provider cards, release/version context, connected agents, or access modes matter.
- Use `go-live` when the user wants push/deploy/live URL proof.

## Output Before Implementation

```text
Architecture boundary:
- ...

Questions/blockers:
- ... or none

Plan:
- ...

VibeRaven skill/context:
- ...
```

## Rules

- Do not start from the nearest file. Start from the system boundary.
- Do not ask broad discovery questions when repo evidence answers them.
- Do not claim provider dashboard, billing, DNS, webhook, database, or deployment state is fixed by repo edits alone.
- Do not turn this into a long architecture document. Keep only the context needed for the next safe action.

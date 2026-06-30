---
name: production-context
description: Use when changing, reviewing, debugging, deploying, or documenting production-sensitive work involving providers, releases, migrations, auth, billing, webhooks, env vars, incidents, rollback notes, fragile customer paths, or architecture boundaries.
---

# Production Context

Repo context says what exists. Production context says what is dangerous.

## Hard Rule

Keep memory small enough to reuse in the next agent action. Do not create a report dump.

## File

Maintain:

```text
.viberaven/production-context.md
```

Create it when allowed and missing. Otherwise propose the exact entry.

## Loop

```text
read -> isolate risk -> fix/propose -> verify -> record -> open action
```

1. Read the current file before production-sensitive work.
2. Identify one relevant boundary: release, auth, data/RLS, provider dashboard, deploy/env, job/webhook, billing, storage, or customer path.
3. Use repo evidence first: git status, tags, changelog, PR links, diffs, migrations, env examples, tests.
4. Use VibeRaven/provider MCP evidence when available for provider state, release history, and dashboard-adjacent receipts.
5. Record only what changes the next decision.
6. Separate repo fixes from provider/human actions.

When the output names `Next skill:`, continue with that VibeRaven skill unless user input, auth, or provider proof is required.

## File Shape

```md
# VibeRaven Production Context

## Current Release / Change Window
## Recent Changes
## Architecture Boundaries
## Provider Boundaries
## Migration And Data History
## Incidents And Rollback Notes
## Fragile Customer Paths
## Verification Receipts
## Open Provider Or Human Actions
```

## Entry Shape

```md
### YYYY-MM-DD - short label

- Change:
- Evidence:
- Boundary:
- Danger:
- Repo fix:
- Verification:
- Provider/MCP proof:
- Open action:
```

Use `unknown from repo` when provider state is not proven.

## Output

```text
Context read:
Context updated/proposed:
Boundary:
Repo action:
Provider/MCP action:
Next skill:
Next:
```

## Mistakes

- Copying long logs instead of linking commands, files, PRs, screenshots, or receipts.
- Claiming provider dashboards are fixed by repo edits.
- Asking for passwords, tokens, cookies, private keys, signing secrets, or raw env values.
- Recording generic notes that will not change a future agent decision.

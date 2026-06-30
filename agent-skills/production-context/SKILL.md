---
name: production-context
description: Use when an AI coding agent is changing, reviewing, debugging, deploying, or documenting production-sensitive work and needs to maintain a compact `.viberaven/production-context.md` memory of what changed, why it is dangerous, how it was verified, and what provider or human action remains.
---

# Production Context

Repo context tells the agent what exists. Production context tells it what is dangerous.

Use this skill when work touches releases, providers, migrations, auth, billing, webhooks, env vars, monitoring, deployment, customer-critical flows, incidents, rollback notes, or launch readiness.

The goal is a small durable context wrapper, not a report dump.

## Context File

Maintain:

```text
.viberaven/production-context.md
```

If the file is missing and you are allowed to write repo docs, create it. If you are not allowed to write, propose the exact entry instead.

Use this file shape:

```md
# VibeRaven Production Context

## Current Release / Change Window

## Recent Changes

## Provider Boundaries

## Migration And Data History

## Incidents And Rollback Notes

## Fragile Customer Paths

## Verification Receipts

## Open Provider Or Human Actions
```

## Entry Shape

Append or update the smallest relevant entry:

```md
### YYYY-MM-DD - short change label

- Change: what changed in repo or release history.
- Evidence: file, command output, PR/changelog link, tag, migration, or user-provided note.
- Production danger: why this can pass locally but fail in production.
- Provider boundary: provider state that matters and whether it is proven.
- Repo fix: fix made or recommended in repo.
- Verification: command or receipt that supports the fix.
- Open action: provider/human action still needed, or `none`.
```

## Workflow

1. Inspect existing `.viberaven/production-context.md` before production-sensitive work.
2. Identify the smallest relevant context: release/version, provider, migration, incident, rollback, or fragile path.
3. Use normal repo evidence first: `git status --short`, changelog, PR links, tags, diffs, migrations, env examples, provider-adjacent files, and verification output.
4. Make or propose the smallest repo-code fix that evidence supports.
5. Record what changed, why it is dangerous, how it was verified, and what provider/human proof remains.
6. Keep entries compact. Link to files, commands, PRs, changelogs, screenshots, or receipts instead of copying long content.

## Provider Boundaries

Never claim provider dashboards are fixed by repo edits alone.

For unknown provider state, write:

```md
- Provider boundary: unknown from repo.
- Open action: verify `<provider>` `<setting>` in dashboard or with read-only provider/MCP evidence.
```

Do not ask for passwords, tokens, cookies, private keys, signing secrets, or raw env values.

## Output

Return:

1. production context read
2. production context updated or proposed
3. repo-code fix or none
4. provider or human action needed

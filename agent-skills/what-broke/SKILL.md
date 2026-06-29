---
name: what-broke
description: Use when an AI agent needs to stop guessing, find which version broke an app, compare releases, read git tags/diffs/changelogs, and connect the code change to provider context such as database, storage, deployment, and external runtime behavior before editing.
---

# What Broke

Use this skill when the app worked before and the agent is about to patch blind. Find the version that changed behavior, recover the version/release context, explain what broke, and connect the code diff to provider reality: database, storage, deployment, and external runtime behavior.

## First Pass

1. Inspect dirty work first: `git status --short`. Do not reset, checkout, or overwrite user changes.
2. Identify the comparison range:
   - Prefer explicit known-good and known-bad versions from the user.
   - Otherwise infer from `git tag --sort=-creatordate`, `git log --oneline --decorate -n 40`, package versions, release branches, and CHANGELOG entries.
3. Map version names to concrete git refs: tags, branch names, release commits, package versions, or changelog headings.
4. Build a narrow diff before editing: `git diff <good>..<bad> --stat`, then `git diff <good>..<bad> --name-only`, then focused `git diff <good>..<bad> -- <path>`.
5. Read provider-adjacent files touched in the range: migrations, schema files, storage policies, deployment config, provider SDK setup, seed data, and runtime boundary files. Add identity, billing, or event-delivery files only when the diff or user pain points there.

## Evidence Packet

Before proposing code changes, produce a short packet:

- **Range:** good ref, bad/current ref, confidence, and why that range was chosen.
- **Version name:** semantic version, release name, tag, changelog heading, or "unknown".
- **Changed surface:** the files or modules that changed, grouped by app code, database, storage, deployment, provider SDK/setup, and external runtime behavior.
- **Provider context:** what provider-dependent behavior may have changed. Say when dashboard or runtime state is not verifiable from the repo.
- **What broke path:** the smallest chain from version change to observed breakage.
- **Missing evidence:** anything needed from logs, provider dashboards, release notes, or the user.

## Smart Diff Workflow

Use the cheapest command that answers the next question:

```bash
git status --short
git tag --sort=-creatordate
git log --oneline --decorate -n 40
git diff <good>..<bad> --stat
git diff <good>..<bad> --name-only
git log --oneline -- <path>
git show --stat <commit>
git show <commit> -- <path>
```

When many files changed, rank by production risk first:

1. Database migrations, schema, queries, ORM models, RLS/policies.
2. Identity/session boundaries, only when the diff or user pain points there.
3. Deployment/runtime config, build output assumptions, redirects, rewrites.
4. Storage buckets, upload/download rules, signed URL code.
5. API contracts, background jobs, queues, scheduled tasks, and external event delivery.
6. UI changes that consume changed contracts.

## Risk Map

Create a Risk Map before editing:

| Signal | Why It Matters |
| --- | --- |
| Migration without matching app query update | Code may expect old schema or policy behavior |
| Identity/provider behavior changed with no release note | The break may be outside the edited component |
| Package or SDK version changed | Behavior may differ without app code changes |
| Deployment config changed | Local success may not match production |
| Changelog mentions rename, cleanup, or refactor | High chance of hidden contract break |

## Fix Plan

Only after the Evidence Packet and Risk Map:

1. State the most likely version that introduced the issue.
2. State the smallest code or config change to test first.
3. Protect provider boundaries: do not claim database, deployment, billing, storage, identity, or other dashboard state was fixed by repo edits alone.
4. Add or run the narrowest verification that proves the version-control theory, such as a focused test, migration check, route test, or build.
5. If evidence is weak, ask for the missing release/log/provider detail instead of guessing.

## Common Mistakes

- Do not infer the breaking version from file timestamps alone.
- Do not compare the whole repo when a narrower good/bad range exists.
- Do not treat a package version bump as harmless; read its surrounding code changes.
- Do not collapse provider context into generic "config changed" language. Name the database, storage, deployment, or external runtime behavior that could be affected.
- Do not rewrite broad areas while investigating a version regression. Patch the smallest surface that matches the diff evidence.

---
name: what-broke
description: Use when an AI agent needs to stop patching blind, find what changed, understand production danger, and make the smallest evidence-backed repo fix while separating provider or human actions.
---

# What Broke

Use this skill when the app worked before and the agent is about to patch blind.

The goal is not only to explain what broke. The goal is to recover enough production and architecture context to make the next fix safer: find the version that changed behavior, map the architecture boundary it touched, connect the diff to provider reality, apply or propose the smallest evidence-backed repo-code fix, and name any provider/human action separately.

Repo context tells the agent what exists. Production context tells it what is dangerous.

## First Pass

1. Check .viberaven/production-context.md first when it exists. Use recent changes, provider boundaries, incidents, rollback notes, migration history, and fragile customer paths to prioritize the diff.
2. Inspect dirty work first: `git status --short`. Do not reset, checkout, or overwrite user changes.
3. Identify the comparison range:
   - Prefer explicit known-good and known-bad versions from the user.
   - Otherwise infer from `git tag --sort=-creatordate`, `git log --oneline --decorate -n 40`, package versions, release branches, and CHANGELOG entries.
4. Map version names to concrete git refs: tags, branch names, release commits, package versions, or changelog headings.
5. Build a narrow diff before editing: `git diff <good>..<bad> --stat`, then `git diff <good>..<bad> --name-only`, then focused `git diff <good>..<bad> -- <path>`.
6. Read provider-adjacent files touched in the range: migrations, schema files, storage policies, deployment config, provider SDK setup, seed data, and runtime boundary files. Add identity, billing, or event-delivery files only when the diff or user pain points there.
7. Look for production-history signals that explain why the clean-looking code change is dangerous: recent deploys, rollback notes, linked PRs, migration order, incident notes, fragile customer paths, and provider config drift.
8. Build a compact architecture map for the affected path before editing: request path, auth/session boundary, data/policy boundary, provider/dashboard boundary, deploy/env boundary, background job/webhook boundary, and the exact repo files that own each boundary.

## Evidence Packet

Before proposing code changes, produce a short packet:

- **Range:** good ref, bad/current ref, confidence, and why that range was chosen.
- **Version name:** semantic version, release name, tag, changelog heading, or "unknown".
- **Changed surface:** the files or modules that changed, grouped by app code, database, storage, deployment, provider SDK/setup, and external runtime behavior.
- **Architecture map:** the affected request/data/job path and the boundary where the fix belongs.
- **Provider context:** what provider-dependent behavior may have changed. Say when dashboard or runtime state is not verifiable from the repo.
- **Production danger:** why the change can pass local tests while still breaking real users, billing, auth, database access, email, webhooks, storage, or deploy behavior.
- **What broke path:** the smallest chain from version change to observed breakage.
- **Fix candidate:** the smallest repo-code change to test first, or "no repo fix yet" if provider evidence is missing.
- **Provider/human action:** any dashboard, credential, webhook, quota, policy, callback, deploy, incident, or customer-path check that cannot be proven from repo code.
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
git log --grep="rollback\\|incident\\|hotfix\\|deploy" --oneline -n 30
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
| Retry, webhook, or auth handling changed | Local tests may pass while provider delivery or session behavior breaks |
| Rollback or incident note near the release | The business-critical path may be known but absent from code comments |

## Fix Plan

Only after the Evidence Packet and Risk Map:

1. State the most likely version that introduced the issue.
2. State the architecture boundary affected: auth/session, data/RLS, deploy/env, provider callback, webhook, billing, storage, or UI/API contract.
3. State the smallest code or config change to test first.
4. Protect provider boundaries: do not claim database, deployment, billing, storage, identity, or other dashboard state was fixed by repo edits alone.
5. Add or run the narrowest verification that proves the version-control theory, such as a focused test, migration check, route test, or build.
6. If evidence is weak, ask for the missing release/log/provider detail instead of guessing.

When the fix is inside the repo and the user has asked you to work on the code, make the scoped fix directly. When the fix is outside the repo, give the exact provider or human action and do not pretend a code edit solved it.

After identifying the likely break and fix, update .viberaven/production-context.md or propose the exact entry when you are not allowed to write. Record the breaking range, production danger, repo fix, verification, and remaining provider/human action.

## Output Shape

Return this compactly before or alongside the fix:

```text
What changed:
- ...

Why this is dangerous:
- ...

Architecture boundary:
- ...

Repo fix:
- ...

Provider/human action:
- ...

Verification:
- ...
```

## Common Mistakes

- Do not infer the breaking version from file timestamps alone.
- Do not compare the whole repo when a narrower good/bad range exists.
- Do not treat a package version bump as harmless; read its surrounding code changes.
- Do not collapse provider context into generic "config changed" language. Name the database, storage, deployment, or external runtime behavior that could be affected.
- Do not rewrite broad areas while investigating a version regression. Patch the smallest surface that matches the diff evidence.
- Do not stop at "what broke" when there is a proven repo-code fix. Do the fix or give the exact patch plan.
- Do not treat version control, documentation, or TDD as a full answer. They help, but production context still includes provider state, incident history, migration order, rollback notes, and customer paths.

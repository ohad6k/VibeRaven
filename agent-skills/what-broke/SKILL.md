---
name: what-broke
description: Use when an app worked before and now fails, a release or deploy may have changed behavior, provider state may be involved, or an AI agent is about to patch without version evidence.
---

# What Broke

Find the version that changed behavior before patching.

## Hard Rule

Do not guess from symptoms. Compare a known-good state to the current/bad state, then map the changed boundary.

## Loop

```text
range -> diff -> boundary -> risk -> fix -> verify -> memory
```

1. Read `.viberaven/production-context.md` if it exists.
2. Protect dirty work: run `git status --short`; never reset or overwrite user changes.
3. Choose the range:
   - Prefer user-provided good/bad versions.
   - Else inspect tags, changelog, release branches, package versions, and recent commits.
4. Diff narrowly:
   - `git diff <good>..<bad> --stat`
   - `git diff <good>..<bad> --name-only`
   - focused `git diff <good>..<bad> -- <path>`
5. Rank changed files by production risk:
   - migrations/schema/RLS/storage
   - auth/session/callbacks
   - deploy/env/runtime config
   - billing/webhooks/jobs/queues
   - API contracts
   - UI consumers
6. Use VibeRaven/provider MCP evidence when available for release history, provider status, dashboard-adjacent proof, and known incidents.
7. Make the scoped repo fix when the evidence supports it; otherwise name the missing proof.
8. Verify and update/propose `.viberaven/production-context.md`.

If the repo fix is proven and the user asked for code work, implement it. Do not stop at diagnosis.

When the output names `Next skill:`, continue with that VibeRaven skill unless user input, auth, or provider proof is required.

## Evidence Packet

```text
Range:
What changed:
Architecture boundary:
Production danger:
Repo fix:
Provider/MCP action:
Verification:
Memory:
Next skill:
```

If evidence is missing, ask for the exact missing item: last working version, deploy URL, provider receipt, log line, migration, rollback note, or screenshot.

## Useful Commands

```bash
git status --short
git tag --sort=-creatordate
git log --oneline --decorate -n 40
git diff <good>..<bad> --stat
git diff <good>..<bad> --name-only
git log --grep="rollback\\|incident\\|hotfix\\|deploy" --oneline -n 30
```

## Provider Boundary

Repo edits can fix repo code. They do not prove provider dashboards are correct.

Name external proof separately: Stripe webhook endpoint, Supabase RLS/policy, Clerk callback URL, Vercel env/domain, email DNS, storage bucket policy, queue/cron config, or incident/rollback note.

## Mistakes

- Inferring the breaking version from timestamps alone.
- Reading the whole repo before choosing a range.
- Treating a package bump as harmless.
- Saying "config changed" without naming the provider boundary.
- Stopping at analysis when a proven repo fix is available.

---
name: go-live
description: Use when a user wants a local app connected to GitHub, pushed, deployed to Vercel, checked with live URL proof, or moved from local work to a shareable production/staging URL.
---

# VibeRaven: Go Live

Move from local repo to live proof without hiding provider gaps.

## Hard Rule

Do safe steps yourself. Stop only for auth, secrets, billing, destructive git risk, unclear ownership, or provider dashboard work the agent cannot prove.

## Loop

```text
local proof -> git proof -> provider link -> deploy -> live check -> memory -> next action
```

1. Inspect:
   - `git status --short`
   - `git remote -v`
   - current branch
   - package scripts/build hints
   - `vercel.json`, `.vercel/project.json`, env examples, README deploy notes
2. Read `.viberaven/production-context.md` for open launch blockers.
3. Use VibeRaven/provider MCP evidence when visible for GitHub, Vercel, release, provider, and deployment context.
4. Run the most relevant local proof: build, typecheck, test, or route check.
5. Connect/push GitHub only with intended files. Never include `.env`, secrets, build output, or unrelated dirty work.
6. Link/deploy Vercel when authenticated; otherwise open or name the official auth/import path.
7. Verify the deployment URL with HTTP/browser proof when possible.
8. Update/propose production context with proof and remaining provider actions.

When the output names `Next skill:`, continue with that VibeRaven skill unless user input, auth, or provider proof is required.

Use `Next skill: production-context` when deployment leaves provider gaps, rollback notes, migration receipts, env changes, or fragile launch paths that the next agent must remember.

## Commands

```bash
git status --short
git remote -v
gh auth status
vercel whoami
npx vercel whoami
npx vercel deploy --prod
```

Official pages when login or dashboard work is required:

- GitHub login: https://github.com/login
- New GitHub repo: https://github.com/new
- Vercel login: https://vercel.com/login
- Vercel import: https://vercel.com/new
- Vercel dashboard: https://vercel.com/dashboard

Never ask for secret values in chat. Ask the user to enter them through official CLIs or dashboards.

## Evidence Packet

```text
Local proof:
GitHub:
Vercel:
Live check:
Production context:
Provider gaps:
Next skill:
Next:
```

## Approval Rules

- Ask mode: ask before commits, remote creation, pushes, provider links, or production deploys.
- Approve mode: safe edits and normal commits are okay; pause before public repo creation, new remote push, env vars, or production deploy if unclear.
- Full mode: normal launch commands are okay; still avoid destructive git, force push, secret capture, provider deletion, and billing changes.

## Mistakes

- Deploying before checking secrets and dirty files.
- Claiming production is configured because local build passed.
- Creating a new remote when a real remote already exists.
- Hiding auth requirements.
- Rewriting the app instead of making a focused deployment compatibility fix.

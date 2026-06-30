# VibeRaven Agent Skills

This directory contains public VibeRaven skills for AI coding agents.

The point is not to make agents read another checklist. The point is to change what they do before and during a fix.

Repo context tells the agent what exists. Production context tells it what is dangerous.

## Install

```bash
npx -y skills add ohad6k/VibeRaven --skill production-context
npx -y skills add ohad6k/VibeRaven --skill what-broke
npx -y skills add ohad6k/VibeRaven --skill viberaven
npx -y skills add ohad6k/VibeRaven --skill go-live
```

## Skills

### `production-context`

Maintains the small production memory the other skills reuse.

Use it when the agent changes, reviews, deploys, or documents production-sensitive work. It records what changed, why it is dangerous, how it was verified, and what provider or human action remains in `.viberaven/production-context.md`.

### `what-broke`

Stops agents from patching blind.

Use it when the app worked before and now something broke. The agent compares the last working version to the current version, reads changelog/PR/tag/diff context, checks provider-adjacent changes, and then proposes or applies the smallest repo-code fix that the evidence supports.

It should output:

1. what changed
2. why it is dangerous in production
3. the repo-code fix to try first
4. the provider or human action that cannot be proven from code

### `viberaven`

Uses the full VibeRaven product context: Studio, provider cards, release/version context, MCP status, connected CLI agents, and access modes.

Use it when the agent needs production context while it is actively working, not just a one-time diagnosis.

```bash
npx -y viberaven
```

### `go-live`

Moves a local app toward GitHub and Vercel with build, push, deployment, and live URL proof.

Use it when the user wants the agent to do the work, verify the result, and clearly separate local repo changes from provider/dashboard steps.

## What Production Context Means

Useful context is small enough to fit in the agent's next action, but specific enough to catch provider and release mistakes:

- recent deploys and rollback notes
- changelog entries with PR links
- migration history and schema changes
- provider config diffs between versions
- incidents linked to releases or customer paths
- auth, billing, database, email, webhook, storage, and deploy boundaries

VibeRaven skills should never claim a provider dashboard is fixed by a repo edit alone. They should either use MCP/provider evidence, ask for proof, or name the human action plainly.

## Non-interactive Artifact Workflow

Use this only when written artifacts are needed outside the Studio:

```bash
npx -y viberaven --agent-mode
npx -y viberaven --verify
npx -y viberaven --strict
```

Agents read `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, and `.viberaven/context-map.json`, fix one repo-code gap when evidence supports it, then verify.

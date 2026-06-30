---
name: viberaven
description: Use when an AI-built app needs architecture context, release drift, version context, provider context, MCP evidence, production memory, connected-agent context, or a clear answer to what changed before editing, debugging, shipping, or deploying.
---

# VibeRaven: Router

Agents can code. VibeRaven makes them stop guessing.

## Hard Rule

Before touching production-sensitive code, run the VibeRaven loop:

```text
route -> ask -> evidence -> fix -> verify -> remember -> next action
```

Do not skip to the nearest file.

## Plugin Route

All VibeRaven skills are one plugin loop. Pick the right sub-skill:

| Task signal | Use |
| --- | --- |
| Vague feature, product work, or architecture choice | `architecture-context` |
| Architecture questions are answered and no plan exists | `architecture-plan` |
| Worked before, broke now, version changed | `what-broke` |
| Provider/release/migration risk needs durable memory | `production-context` |
| Push, deploy, live URL, GitHub/Vercel proof | `go-live` |

When a sub-skill returns `Next skill:`, continue with that VibeRaven skill unless user input, auth, or provider proof is required.

Use this skill when Studio, MCP, provider cards, releases, connected CLIs, or access modes matter.

## Evidence Sources

Use the cheapest source that proves the next decision:

- Repo: `git status`, tags, changelog, diffs, tests, migrations, env examples.
- VibeRaven Studio: `npx -y viberaven` for chat, versions, provider cards, diffs, access modes, and CLI connection.
- MCP: use visible VibeRaven/provider tools for release history, provider status, project context, and dashboard-adjacent evidence.
- Memory: `.viberaven/production-context.md` for incidents, rollback notes, migration history, fragile paths, and open provider actions.

If MCP/provider evidence is unavailable, say so and continue with repo evidence. Never ask for secrets.

## Loop

1. Route to the right sub-skill.
2. Ask only missing questions that change architecture or risk.
3. Gather version/provider/repo evidence before editing.
4. Make or propose the scoped repo action the evidence supports.
5. Verify with the most relevant command or provider/MCP receipt.
6. Update or propose `.viberaven/production-context.md`.
7. End with one next action: code, provider check, deploy, or user answer.

For vague product work, route to `architecture-context`; after answers, route to `architecture-plan`. If implementation is requested and evidence is strong, work after the plan/evidence gate.

## Output

```text
Boundary:
Evidence:
Repo action:
Provider/MCP action:
Verification:
Memory:
Next skill:
Next:
```

## Commands

```bash
npx -y viberaven
npx -y viberaven init --agents all
npx -y viberaven init --agents all --dry-run
```

Legacy artifact commands only when the installed workflow requires them:

```bash
npx -y viberaven --agent-mode
npx -y viberaven --verify
npx -y viberaven --strict
```

## Mistakes

- Treating installed CLI as connected/ready without a connection test.
- Claiming dashboard, DNS, billing, webhook, RLS, storage, deployment, or secrets are fixed by repo edits alone.
- Asking for passwords, tokens, cookies, private keys, signing secrets, or raw env values.
- Returning a checklist when the next useful action is a focused question, diff, test, or provider proof.

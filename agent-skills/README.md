# VibeRaven Agent Skills

Token-efficient VibeRaven plugin skills for AI coding agents that need architecture, provider, release, and production context before they edit.

The system is one loop:

```text
route -> ask -> evidence -> fix -> verify -> remember -> next action
```

The skills work as one VibeRaven plugin flow. Start with `viberaven` when unsure. Any skill can return `Next skill:`; continue with that skill unless user input, auth, or provider proof is required.

## Install

```bash
npx -y skills add ohad6k/VibeRaven --skill viberaven
npx -y skills add ohad6k/VibeRaven --skill architecture-context
npx -y skills add ohad6k/VibeRaven --skill what-broke
npx -y skills add ohad6k/VibeRaven --skill production-context
npx -y skills add ohad6k/VibeRaven --skill go-live
```

## Skills

| Skill | Job |
| --- | --- |
| `viberaven` | Router: choose the right VibeRaven loop, Studio/MCP evidence, and next action. |
| `architecture-context` | Ask low-level product questions, then write the architecture plan before editing. |
| `what-broke` | Compare good/bad versions before patching a regression. |
| `production-context` | Keep compact `.viberaven/production-context.md` memory. |
| `go-live` | Move local work to GitHub/Vercel with live proof and explicit provider gaps. |

## Agent Contract

1. Start with the product path or broken user path.
2. Ask only questions that change architecture or production risk.
3. For vague feature work, output `Architecture plan:` with workstreams, sequence, risks, verification, provider proof, and route before editing.
4. Use repo evidence first: status, tags, changelog, diffs, tests, migrations, env examples.
5. Use VibeRaven Studio or provider MCP when available for release history, provider status, and dashboard-adjacent proof.
6. Separate repo-code fixes from provider/human actions.
7. Verify the claim the agent is about to make.
8. Record durable risk in `.viberaven/production-context.md`.

## Output Shape

```text
Boundary:
Evidence:
Architecture plan:
Repo action:
Provider/MCP action:
Verification:
Memory:
Next skill:
Next:
```

## Current Product Surface

```bash
npx -y viberaven
```

Use Studio for chat, provider cards, MCP status, release/version context, diff views, access-mode control, and connected CLI agents.

Legacy artifact commands exist for old non-interactive workflows only:

```bash
npx -y viberaven --agent-mode
npx -y viberaven --verify
npx -y viberaven --strict
```

Never ask for passwords, tokens, cookies, private keys, signing secrets, or raw env values.

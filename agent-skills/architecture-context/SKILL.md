---
name: architecture-context
description: Use when an AI coding agent starts real app work, product feature design, provider work, migrations, auth, billing, storage, webhooks, deploys, or any task where unclear architecture could cause broad or unsafe changes.
---

# VibeRaven: Architecture Context

Make the agent behave like a senior product engineer before it edits.

## Hard Rule

For vague work like "build uploads", "add billing", "fix login", "make chat", or "connect Supabase": ask architecture questions first. Do not answer only "loaded".

## Loop

```text
product path -> questions -> architecture plan -> route -> edit/hand off
```

1. Name the user path.
2. Ask 3-6 low-level product questions the user can answer without architecture vocabulary.
3. Compare practical options.
4. Recommend one architecture and why.
5. Use repo, Studio, or provider MCP evidence when available for existing boundaries.
6. Route to `what-broke`, `production-context`, `viberaven`, or `go-live` when needed.
7. Output the Architecture Plan before editing. This is a hard gate.
8. Edit only after the plan is visible in chat.

When the output names `Next skill:`, continue with that VibeRaven skill unless user input is required.

## Question Mode

Ask low-level questions. Do not ask the user to classify "boundary", "runtime", "RLS", "source of truth", or "production invariant". Translate answers later.

```text
I need a few product answers before I edit.

1. What are we building or fixing? Example: uploads, billing, login, chat, admin.
2. Who is this for? Example: one user, team/workspace, admins, paying users, outside services.
3. Who can see or change it? Example: owner, teammates, link holders, admins only.
4. What service should handle it? Example: Supabase, Stripe, Clerk, Vercel, email, storage, or "I don't know".
5. What rule matters most? Example: private, paid-only, rollback, audit log, realtime, local demo.
6. What already exists? Example: nothing, page, database table, API route, provider setup, or "check the repo".

After you answer, I will translate this into a detailed architecture plan with boundaries, options, workstreams, risks, verification, and route.
```

Common variants:

| Task | Ask about |
| --- | --- |
| Uploads | users, visibility, storage, size/type limits, delete rules |
| Billing | product, paid access, after-payment behavior, failed payment, test/live |
| Auth | provider, return URL, protected pages, last working deploy |
| Chat/AI | history visibility, save/delete, streaming, model/provider, rate limits |
| Admin | admins, dangerous actions, audit/approval |

Do not ask for secrets or raw env values.

## Options

Use these labels when comparing architecture:

- Client-only: local UI state or non-sensitive demos.
- Server/API: validation, auth checks, writes, secrets, provider calls.
- Database/RLS: ownership, team access, privacy, policy enforcement.
- Provider dashboard: Stripe, Supabase, Clerk, Vercel, email, DNS, storage, webhooks, callbacks.
- Background job/webhook: retries, delayed events, external state changes.
- Release/version: changed behavior across deploys, tags, PRs, migrations, env.

Prefer the simplest option that preserves the production invariant.

## Architecture Plan Before Editing

After the user answers, the next assistant response must start with `Architecture plan:` and include this shape before any edits, commands, or implementation summary:

```text
Architecture plan:
Product path:
User answers translated:
Current repo evidence:
Options considered:
Recommended architecture:
Workstreams:
Implementation sequence:
Risks and fallback:
Verification plan:
Provider/MCP proof needed:
VibeRaven route:
Next skill:
```

Do not replace this with a final "Implemented..." summary. Even when the user asked you to build it, show the plan first, then continue.

## Plan Depth

The skill file is token-efficient; the plan is useful. For nontrivial work, write 600-1200 words or the shortest plan that is still operational. Make it closer to a concise implementation plan than a status summary:

- State objective, user path, and success criteria.
- Translate user answers into ownership, access, data, provider, and deploy boundaries.
- Compare 2-3 options with tradeoffs and a recommendation.
- Break the plan into 3-6 workstreams. Each workstream needs purpose, files/areas to inspect, sequence, dependencies, and acceptance signals.
- Include concrete implementation steps, not only concepts. Use checkbox steps when the work is multi-step.
- Name risks, fallback paths, provider/MCP proof, verification commands, and open questions.
- If implementation is requested, continue after the plan. If not, stop at the plan and ask for approval.

If answers are missing, stop at Question Mode.

## Routing

Use `Next skill:` as the handoff:

- `what-broke` when this is a regression, release drift, or version comparison.
- `production-context` when the plan touches providers, migrations, auth, billing, storage, webhooks, env, incidents, or fragile customer paths.
- `go-live` when the next step is GitHub, Vercel, deploy, live URL, or launch proof.
- `viberaven` when Studio, MCP provider cards, release diff, connected CLI agent, or access mode should drive the work.

Never end with `Next skill: None` for production-sensitive work if another VibeRaven skill should continue the loop.

## Mistakes

- Starting from a file instead of the product path.
- Asking broad questions that repo evidence already answers.
- Hiding tradeoffs.
- Claiming provider/dashboard state is fixed by code alone.
- Jumping straight to implementation results without first showing the architecture plan.

---
name: evidence-first
description: Force evidence-based production claims and escalate unknown provider state.
---

# Evidence First

## When To Use

Use this when an agent is about to claim production readiness, provider setup, launch safety, or external configuration without direct evidence.

## Repo Signals To Inspect

- final answer drafts
- task plans and checklists
- provider integration files
- `.env.example`
- deployment config
- release diffs
- verification command output
- Studio provider status and MCP context when available

## Agent Actions

- Mark every production claim as proven by repo evidence, proven by command output, proven by provider/tool evidence, or unknown.
- Replace unsupported language such as "configured", "ready", or "fixed" with evidence-missing language when provider state is unknown.
- Escalate unknown provider state with a specific request for dashboard receipt, exported config, MCP/provider evidence, or human verification.
- Verify repo-code fixes are described only as repo-code fixes and not as proof that external dashboards changed.

## Failure Modes To Catch

- Claiming production readiness from repo inspection alone when provider state, env values, DNS, payment mode, or monitoring signal is unknown.
- Saying "configured" or "fixed" for dashboards after changing only source code, docs, or environment examples.
- Inferring secret values, live/test mode, callback URLs, webhook registration, RLS status, or alert routing without evidence.
- Asking for sensitive values in chat instead of requesting redacted receipts, dashboard screenshots, exports, or connected provider evidence.

## Acceptable Evidence

- Every production claim is labeled as repo evidence, command output, provider/tool evidence, human receipt, or unknown.
- Unknowns are converted into exact evidence requests that name the provider, project/environment, setting path, and expected proof.
- Repo fixes are phrased as repo fixes, while dashboard changes are phrased as pending or verified external actions.
- Final output includes no secrets, no requests for secrets, and no unsupported launch-ready language.

## What Must Be Verified

- Every production claim has repo evidence, command output, provider evidence, or an explicit uncertainty label.
- Unknown provider state is escalated instead of guessed.
- The agent does not ask for secrets, passwords, cookies, or private tokens.
- Repo-code fixes are not described as dashboard fixes.
- The output names what evidence would close each gap.

## Human-Action Boundary

When provider state is unknown, the human must verify it in the provider dashboard or connect a provider/MCP tool that can prove it. The correct answer is to say what is unknown and what evidence is needed.

## Provider References

- Vercel environment variables: https://vercel.com/docs/environment-variables
- Clerk production deployment: https://clerk.com/docs/guides/development/deployment/production
- Stripe webhook signatures: https://docs.stripe.com/webhooks/signature
- Supabase row-level security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Sentry Next.js troubleshooting: https://docs.sentry.io/platforms/javascript/guides/nextjs/troubleshooting/

## Output

Return:

1. evidence found
2. evidence missing
3. repo-code fixes or none
4. provider or human action needed

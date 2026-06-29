---
name: provider-actions
description: Separate repo-code fixes from provider dashboard actions that require a human.
---

# Provider Actions

## When To Use

Use this when a task mixes code changes with provider dashboard setup, secrets, billing settings, DNS, auth callbacks, database policies, or deployment configuration.

## Repo Signals To Inspect

- provider setup docs
- `.env.example`
- `vercel.json`
- `supabase/**`
- billing and auth integration files
- webhook handlers
- deployment scripts
- README launch instructions
- Studio provider cards and MCP status when available

## Concrete Checks

- Identify dashboard-only actions such as DNS/domain setup, OAuth app settings, webhook endpoint registration, billing product setup, and provider project toggles.
- Separate each finding into repo-code change, provider dashboard action, or evidence request.
- Require a receipt format for human actions, such as provider name, setting path, expected value, and screenshot/export/tool evidence.
- Confirm the response never asks the user to paste secrets, passwords, cookies, signing keys, or private tokens.

## Failure Modes To Catch

- Blurring repo work and provider work, such as saying a webhook is configured after only adding a route handler.
- Asking the user to paste secret values, signing secrets, API keys, cookies, or passwords into chat.
- Giving vague dashboard instructions that do not name the provider, setting path, expected value, and evidence needed.
- Forgetting that DNS, OAuth app settings, Stripe product setup, Vercel env values, and Supabase project settings live outside the repo.

## Acceptable Evidence

- A table or grouped list that separates repo-code fixes, provider dashboard actions, and evidence requests.
- Human-action receipts with provider, project/environment, dashboard path, expected setting, and acceptable evidence format.
- Connected provider or MCP evidence when available, cited as evidence without exposing secrets.
- Final wording that says exactly what was fixed in code and exactly what still requires dashboard or human action.

## What Must Be Verified

- Repo-code fixes are separated from provider dashboard actions.
- Secrets, tokens, cookies, passwords, and signing keys are not requested in chat.
- Dashboard-only steps are stated as human actions with exact provider paths or settings.
- Any connected provider evidence is cited without overclaiming.
- The final answer does not imply dashboard changes were made by code edits.

## Human-Action Boundary

Provider dashboards, secret values, billing portals, DNS records, OAuth apps, and production project settings usually require a human or connected provider tool. Ask for confirmation or evidence instead of guessing.

## Provider References

- Vercel environment variables: https://vercel.com/docs/environment-variables
- Clerk production deployment: https://clerk.com/docs/guides/development/deployment/production
- Stripe webhooks: https://docs.stripe.com/webhooks
- Supabase row-level security: https://supabase.com/docs/guides/database/postgres/row-level-security

## Output

Return:

1. evidence found
2. evidence missing
3. repo-code fixes or none
4. provider or human action needed

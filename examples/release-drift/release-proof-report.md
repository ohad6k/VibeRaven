# Release Proof — my-app v1.4.2

An exportable "release proof" for one version. Generated from `.viberaven/prp.json` and `.viberaven/gate-result.json`, then reviewed by a human. Copy-paste it into your release PR, changelog, or launch checklist.

**Release:** v1.4.2 · **Stack:** Next.js + Supabase + Vercel · **Repo check:** `gate.status: not_clear` (1 blocker)
**Legend:** ✅ verified · ⚠️ needs action · 🔴 blocker

Split into four short sections so code-fixable items stay separate from provider/dashboard actions. Each row: source · evidence path or dashboard step · status · why it matters · next owner.

## 1. Repo evidence (code-fixable)

| Source | Evidence path | Status | Why it matters | Next owner |
|---|---|---|---|---|
| viberaven scan | `app/api/webhooks/stripe/route.ts` | ✅ | Webhook verifies the Stripe signature before processing | — |
| viberaven scan | `supabase/migrations/0007_rls_profiles.sql` | ✅ | RLS enabled on `profiles` for select AND insert/update | — |
| `.viberaven/prp.json` | `middleware.ts` | ⚠️ | Auth guard covers `/dashboard` but not `/api/admin/*` | dev |
| viberaven scan | `.env.example` | ✅ | All required env vars documented, no secrets committed | — |

## 2. Provider evidence (dashboard, not code)

| Source | Dashboard step | Status | Why it matters | Next owner |
|---|---|---|---|---|
| Stripe | Developers → Webhooks | ⚠️ | Live-mode endpoint points at a preview URL, not prod | you |
| Supabase | Auth → URL Configuration | ✅ | Redirect URLs include the production domain | — |
| Vercel | Settings → Environment Variables (Production) | 🔴 | `STRIPE_SECRET_KEY` still holds a test key in Production | you |

## 3. Repo check result

| Source | Field | Value | Why it matters |
|---|---|---|---|
| `.viberaven/gate-result.json` | `gate.status` | `not_clear` | One blocker is still open (see section 4); you decide when to ship |
| `.viberaven/gate-result.json` | `blockers` | 1 | Production Stripe key is a test key |
| `.viberaven/gate-result.json` | `warnings` | 2 | Admin API auth gap, webhook endpoint URL |

## 4. Remaining human actions

| Action | Type | Status | Why it matters | Next owner |
|---|---|---|---|---|
| Swap the Production `STRIPE_SECRET_KEY` for the live key | provider | 🔴 open | Payments fail on real users until fixed | you |
| Point the Stripe live webhook at the prod URL | provider | ⚠️ open | Events never reach production | you |
| Add an auth guard to `/api/admin/*` | code | ⚠️ open | The admin API is currently unprotected | dev |

---

**Before you ship:** work through every row, then regenerate with `npx -y viberaven@1.6.1`. `gate.status: clear` covers the repo checks only; the provider rows need the dashboard, and you decide when to ship.

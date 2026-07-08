# Contributor quests

VibeRaven is mostly docs, examples, provider evidence, and prompt text —
most contributions don't touch the product source at all. Pick one of the
five paths below, find a matching `good first issue`, and open a small,
focused PR.

Every path shares the same first-PR shape: comment `/take` on the issue to
claim it, keep the change scoped to that one issue, and reference it as
`Closes #123` in your pull request. Smaller PRs are easier to review. See
[CONTRIBUTING.md](../CONTRIBUTING.md) for the full checklist.

## 1. Bug storyteller — no code required

Share a real launch or after-launch failure from an AI-built app: what
broke, which provider was involved (Supabase, Vercel, Clerk, Stripe, Resend,
Sentry, PostHog, Upstash, …), what your coding agent missed, and what you
wish it had known before touching production. Real stories turn into
checks, fixtures, and prompts later — this is the most valuable non-code
contribution and takes about 15–45 minutes.

**First PR:** comment your story directly on a
[`bug-story`](https://github.com/ohad6k/VibeRaven/labels/bug-story) labeled
issue such as
[#18 — Share a real launch or after-launch failure](https://github.com/ohad6k/VibeRaven/issues/18).
No pull request needed for this path — the comment is the contribution.

## 2. Provider mapper

Add a provider evidence example under `examples/providers/<provider>/` (or
`examples/provider-drift/` for a misconfiguration) showing what VibeRaven
should read to confirm a provider is correctly wired: domain verification,
webhook signatures, RLS policies, env var drift between environments, and
similar. No live keys, secrets, or customer data — use synthetic or
redacted evidence.

**First PR:** pick a
[label search for `provider:*`](https://github.com/ohad6k/VibeRaven/labels?q=provider) labeled
issue, for example
[#35 — Resend domain verification evidence example](https://github.com/ohad6k/VibeRaven/issues/35)
or
[#22 — Sentry monitoring evidence example](https://github.com/ohad6k/VibeRaven/issues/22).

## 3. Fixture builder

Add an example fixture under `examples/` showing a before/after state:
a broken-to-fixed release timeline, a version diff (dependencies, schema,
env vars, provider config), or a bundle of related provider-drift fixtures.
These become the ground truth the checks and prompts are built and tested
against.

**First PR:** pick a
[`fixture`](https://github.com/ohad6k/VibeRaven/labels/fixture)
labeled issue, for example
[#23 — Add version comparison example](https://github.com/ohad6k/VibeRaven/issues/23).

## 4. Prompt writer

Add a scoped prompt template under `prompts/` that an agent can drag into
chat. A good prompt template takes a specific input (two release contexts,
a provider needing human action, …) and returns a specific, bounded output
shape — it does not ask the agent to "fix production" or make unscoped
decisions.

**First PR:** pick a
[`prompt`](https://github.com/ohad6k/VibeRaven/labels/prompt)
labeled issue, for example
[#25 — Add prompt template to compare last two releases](https://github.com/ohad6k/VibeRaven/issues/25).

## 5. Docs contributor

Add or improve a doc under `docs/`: an explainer, a troubleshooting guide,
a translated quickstart, or a guide for a specific workflow. Docs-only
changes can usually be reviewed by reading the rendered Markdown and
checking links or examples — no local setup required.

**First PR:** pick a
[`documentation`](https://github.com/ohad6k/VibeRaven/labels/documentation)
labeled issue, for example
[#26 — Add version comparison explainer](https://github.com/ohad6k/VibeRaven/issues/26)
or
[#58 — Guide for running VibeRaven on an app exported from Lovable / Bolt / v0](https://github.com/ohad6k/VibeRaven/issues/58).

## After your first PR

Once you've shipped one quest, browse the full
[`good first issue`](https://github.com/ohad6k/VibeRaven/labels/good%20first%20issue)
and [`contributor-quest`](https://github.com/ohad6k/VibeRaven/labels/contributor-quest)
label lists for the next one — most quests take 15–90 minutes.

# Contributing to VibeRaven

Thanks for helping improve VibeRaven. This public repo is the discovery and
installation surface for the VibeRaven agent pack, docs, examples, and plugin
metadata. Most contributions are docs, examples, skill text, metadata, or
fixtures rather than private product source changes.

## Repository Map

- `agent-skills/` contains the six public skills and their agent metadata. Start
  here for skill wording, routing, and verification changes.
- `skills/` mirrors the packaged `viberaven` skill used by skill installers.
  Keep it in sync with `agent-skills/viberaven/SKILL.md` when that skill changes.
- `docs/` contains public registry, badge, and repo metadata docs.
- `examples/` contains proof artifacts and the example Next.js/Supabase/Vercel
  starter template.
- `commands/` contains plugin command prompts such as `viberaven-work` and
  `viberaven-launch`.
- `llms.txt`, `llms-full.txt`, and `agent-context.md` are machine-readable
  context surfaces for agents.
- `skills.sh.json`, `plugin.yaml`, `gemini-extension.json`, `.claude-plugin/`,
  and `.codex-plugin/` describe how the pack is discovered by skill and plugin
  installers.
- `EXPORT_MANIFEST.json` records which source files are exported into this
  public repo.

## Picking Up an Issue

Good first issues are usually docs, examples, translations, provider fixtures,
or narrow skill-copy improvements. Pick one issue and keep the pull request
small enough to review in one pass.

Before opening a pull request:

1. Read the issue and any linked docs.
2. Check whether someone is already assigned or has an active pull request.
3. Keep the change focused on the issue. Avoid unrelated wording churn.
4. Preserve the repo's local-first, no-telemetry, no-secret-handling language.

## What Makes a Good PR

A good VibeRaven PR should include:

- a short summary of what changed and why;
- a link to the issue, for example `Closes #123`;
- validation commands you ran, or a note when the change is docs-only;
- screenshots only when the change affects visible docs or assets;
- no private credentials, tokens, cookies, or customer-specific data.

For skill changes, prefer precise instructions over broad promises. Do not claim
provider dashboard state, production readiness, or deployment proof unless the
repo evidence and command output actually prove it.

## Local Checks

Docs-only changes can usually be reviewed by reading the rendered Markdown and
checking links or examples. For skill-pack changes, run:

```bash
node agent-skills/scripts/verify-skill.mjs
```

To smoke-test the published skill install path, use:

```bash
npx -y skills add ohad6k/VibeRaven --skill viberaven
```

When changing agent install guidance, preview rule installation in a throwaway
project before recommending it:

```bash
npx -y viberaven init --agents all --dry-run
```

If you edit the example app under
`examples/nextjs-supabase-vercel-production-ready-template/`, run the narrowest
relevant package command from that example and include it in the PR.

## Asking Questions

- Use GitHub Discussions for design questions, contribution ideas, and unclear
  issue scope: https://github.com/ohad6k/VibeRaven/discussions
- Join Discord for maintainer feedback and contributor coordination:
  https://discord.gg/ZAJvazz63Y

## Review Notes

Maintainers may ask for wording changes, smaller scope, or stronger local proof.
That is normal. Keep the conversation tied to repo evidence and update the PR
description when validation changes.

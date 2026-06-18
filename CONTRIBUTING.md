# Contributing to VibeRaven

Thanks for helping improve VibeRaven.

This public repository is the agent discovery and installation surface for the local CLI/UI, docs, examples, templates, skills, and issue reports. Private service internals, hosted product code, account systems, billing data, customer data, and provider dashboards are not part of this repo.

## Good first contributions

Start with one of these:

- [Webhook signature proof example](https://github.com/ohad6k/VibeRaven/issues/4)
- [Supabase RLS false-positive fixture](https://github.com/ohad6k/VibeRaven/issues/5)
- [Clerk + Vercel auth redirect evidence](https://github.com/ohad6k/VibeRaven/issues/6)

Useful contributions usually improve one of these public surfaces:

- `examples/proof/` sample artifacts
- `llms.txt` or `llms-full.txt` agent-readable docs
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, or Cursor/Copilot rules
- `skills.sh.json` and the exported VibeRaven skill
- public docs that explain local repo evidence and provider/user blockers

## Report useful feedback

Use the issue forms when possible:

- False positive: VibeRaven reported a gap that repo evidence already covers.
- Missed production gap: a real launch risk was not detected.
- Stack support request: a provider or framework needs local evidence checks.

Please include:

- the command you ran, such as `npx -y viberaven --agent-mode .`
- the relevant non-secret `.viberaven/` finding or tasklist item
- redacted file paths or snippets that show the local evidence
- what VibeRaven should report instead

## Safety rules

Do not post secrets, tokens, private keys, signing secrets, cookies, production customer data, or live provider credentials.

Repo-code changes cannot prove provider dashboard setup is complete. OAuth callbacks, billing products, webhook endpoints, DNS, credentials, quotas, and monitoring setup need provider-side evidence or user confirmation.

## Pull request checklist

Before opening a PR:

1. Keep the change scoped to public discovery, docs, examples, templates, skills, or local CLI/UI behavior.
2. Do not add private source code, `.env` files, provider credentials, billing data, or customer data.
3. For docs/examples, prefer redacted and fake values.
4. If you touch agent instructions, keep VibeRaven's bounded rule blocks intact.
5. If you change executable CLI behavior, include or update a focused test when practical.

For source changes in the public CLI package, run the relevant local check if the package is available in your checkout:

```bash
npm --prefix packages/cli run typecheck
npm --prefix packages/cli run build
```

## Maintainer notes

The public repo is curated from a private product monorepo. Some files are exported rather than edited directly. If a public PR touches generated/exported files, the maintainer may port the change back to the export source before merging.

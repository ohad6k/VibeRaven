# VibeRaven Roadmap

VibeRaven helps AI-built apps reach production with repo evidence, local launch checks, and agent-readable next actions.

This public roadmap is intentionally focused on checks and examples that can be discussed in the open. Product internals, hosted service code, billing systems, private configs, and provider dashboards are outside this public repo.

## Now

- Keep `npx -y viberaven` as the primary local launch console entry point.
- Keep `npx -y viberaven --agent-mode` as the non-interactive agent/pro gate.
- Improve public proof examples under `examples/proof/`.
- Collect false positives, missed launch gaps, and stack support requests through GitHub issues and discussions.
- Keep the public README, npm package pages, release notes, and agent-readable docs aligned.

## Next Checks To Improve

These are the highest-signal launch gaps to make easier for agents and humans to reason about:

- Webhook routes that exist but do not verify signatures.
- Supabase RLS evidence that is missing, too weak, or too hard for agents to interpret.
- Auth callback and redirect drift across local, preview, and production environments.
- Env vars that exist locally but are not represented in deploy docs or config.
- Monitoring and observability claims without local evidence.
- Provider-action boundaries where repo edits cannot prove dashboard setup is complete.

## Good First Contributions

- [Add a webhook signature proof example](https://github.com/ohad6k/VibeRaven/issues/4)
- [Add a Supabase RLS false-positive fixture](https://github.com/ohad6k/VibeRaven/issues/5)
- [Document Clerk + Vercel auth redirect evidence](https://github.com/ohad6k/VibeRaven/issues/6)

## Feedback Wanted

The most useful input is a concrete production failure or near miss from an AI-built app:

- What stack did you use?
- What worked locally?
- What failed in preview or production?
- What local repo evidence could VibeRaven have inspected?
- Was the fix repo code, provider dashboard setup, or user confirmation?

Add examples here:

https://github.com/ohad6k/VibeRaven/discussions/7

## Watch Releases

Use **Watch -> Custom -> Releases** on the GitHub repo if you want release notifications.

If the project helps, star it so more AI app builders find the production gate:

https://github.com/ohad6k/VibeRaven

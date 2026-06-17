# VibeRaven

Local launch console for AI-built apps.

VibeRaven turns "the AI demo runs on my machine" into a concrete launch-readiness map. Run it in a repo and it opens a localhost console with provider launch paths, repo-evidence gaps, an agent prompt, a tasklist, and a verify loop.

```bash
npx -y viberaven
```

## What You Get

- A provider-first launch console for Supabase, Vercel, Stripe, GitHub, Sentry, Clerk, PostHog, and local repo evidence.
- A deterministic local scan that writes `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, `.viberaven/context-map.json`, and `.viberaven/mission-map.md`.
- A copyable agent prompt focused on the first repo-owned launch gap.
- A clear boundary: normal git push is not gated; launch/deploy-readiness claims should be verified.

## Install And Run

Use the published package:

```bash
npx -y viberaven
npx -y viberaven ui .
npx -y viberaven scan .
npx -y viberaven --agent-mode .
npx -y viberaven --verify .
```

Or build this repo locally:

## Build

```bash
npm install
npm --prefix packages/cli run build
```

## Run From Source

```bash
node packages/cli/dist/cli.js --help
node packages/cli/dist/cli.js ui .
node packages/cli/dist/cli.js scan .
node packages/cli/dist/cli.js --agent-mode .
node packages/cli/dist/cli.js --verify .
```

## How It Works

VibeRaven reads local repo evidence only: package metadata, env examples, deployment config, Supabase folders, tests, and provider-related source hints. It does not read real secret values. It maps that evidence into provider launch paths and gives coding agents one concrete next fix.

The local console is intentionally useful before Cloud exists:

- Sidebar: provider readiness list with recognizable provider marks.
- Center: launch path checklist and the next fix.
- Right panel: agent prompt, tasklist, and verify action.
- Footer: current command and gate status.

## License

The public local CLI/UI source is MIT licensed. Private managed service code remains proprietary and is not part of this export.

## Open-Core Boundary

This public repo includes the local CLI, localhost UI, deterministic scan, docs, and artifact contracts.

Private managed services are not included: account systems, remote runners, OpenAI-backed services, Polar/Supabase account data, customer records, and future team features stay private.

A normal git push does not require a VibeRaven scan.

## Contributing

Good first contributions:

- Improve provider launch-path copy.
- Add local evidence checks that do not require secrets.
- Improve the localhost UI accessibility and responsive layout.
- Add tests for artifact contracts and public package boundaries.

Before sending a PR:

```bash
npm --prefix packages/cli run typecheck
npm --prefix packages/cli run build
```

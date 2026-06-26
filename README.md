# VibeRaven

<p align="center">
  <img src="./assets/viberaven-mascot.png" width="112" alt="VibeRaven mascot logo" />
</p>

[![GitHub stars](https://img.shields.io/github/stars/ohad6k/VibeRaven?style=social)](https://github.com/ohad6k/VibeRaven/stargazers)
[![GitHub release](https://img.shields.io/github/v/release/ohad6k/VibeRaven?display_name=tag)](https://github.com/ohad6k/VibeRaven/releases)
[![npm version](https://img.shields.io/npm/v/viberaven)](https://www.npmjs.com/package/viberaven)
[![npm downloads](https://img.shields.io/npm/dw/viberaven)](https://www.npmjs.com/package/viberaven)
[![License](https://img.shields.io/github/license/ohad6k/VibeRaven)](https://github.com/ohad6k/VibeRaven/blob/main/LICENSE)

AI got your app to demo. **VibeRaven helps you operate it as a real product.**

> **Open-source mission control for AI-built apps.**
> The operating layer for apps built by AI agents — from first demo, to launch, to every version after launch.

<p align="center">
  <a href="https://github.com/ohad6k/VibeRaven/releases/download/studio-demo-v1/viberaven-studio-demo-26s.mp4" title="Watch the 26s VibeRaven Studio demo">
    <img src="./media/viberaven-demo-hero.gif" alt="VibeRaven Studio demo — provider board, version context, and agentic chat" width="860" />
  </a>
</p>

<p align="center"><em>26s demo · <a href="https://github.com/ohad6k/VibeRaven/releases/tag/studio-demo-v1">watch full video with sound</a></em></p>

Open the console and try it now:

```bash
npx -y viberaven
```

VibeRaven is the **open-source product operations console for AI-built apps**. It gives vibe coders and coding agents one local workspace to manage providers, releases, production evidence, version drift, and next actions — from first demo to real users.

## Three layers, one console

### Layer 1 — Before launch *(the hook)*
Is auth actually protected? Is Supabase RLS strong? Are webhooks verified? Are env vars correct? Is monitoring real or just installed? Is the agent allowed to say "production ready"?
Run the production gate: `npx -y viberaven --agent-mode`

### Layer 2 — After launch *(the habit)*
What changed between v1.0 and v1.1? Which provider drifted — Supabase, Vercel, Clerk, Stripe, Resend, Sentry, PostHog? Did the latest release add risk? What evidence proves the product is healthier now? What should the agent fix next?
Open the console: `npx -y viberaven`

### Layer 3 — Team & company ops *(the business)*
Team dashboard, private repos, release history, provider health timeline, PR comments, CI/CD gate, compliance/export reports, "VibeRaven verified release" badge, Slack/Discord alerts. (Team/cloud layer — see [ROADMAP.md](./ROADMAP.md).)

## Three things VibeRaven shows you

| | |
|---|---|
| **Provider Control Board** | See Supabase, Vercel, Clerk, Stripe, monitoring, email, analytics, and env state in one place. |
| **Versions & Releases** | Compare what changed between releases and drag release context into agent chat. |
| **Agentic Chat with Product Context** | Ask the agent what changed, what broke, what provider needs action, and what to fix next. |

**VibeRaven Studio** is the open-source local workspace for production-aware AI coding: chat with your connected CLI, attach provider and release context, inspect diffs, and verify launch readiness without leaving localhost.

![VibeRaven Project Mission Control localhost UI](./assets/viberaven-localhost-ui.png)

The localhost console is designed around the work that usually gets missed between demo and production:

- Production mission chat for Codex CLI, Claude Code, Gemini CLI, or a local shell.
- CLI/model picker for the connected coding agent inside VibeRaven Chat.
- Provider slots for database, auth, hosting, billing, monitoring, analytics, email, cache, and version control.
- Provider Control Board slots plus Versions & Releases context for drag-to-chat evidence.
- Drag-to-chat context for providers and releases, so agent prompts stay scoped.
- Split or new chats when auth, billing, or deploy debugging need separate threads.
- Live fix, verify, diff, and release actions that keep launch work inside one flow.
- Local-first artifacts for agents: `.viberaven/prp.json`, `.viberaven/gate-result.json`, and supporting evidence files.

VibeRaven runs the **VibeRaven Production Protocol** through a local-first open-source CLI/UI. The local console opens a localhost launch workspace; agent mode writes `.viberaven/prp.json`, `.viberaven/gate-result.json`, and supporting protocol artifacts so AI coding agents can keep operating until `decision.status` is not `blocked` and the gate is clear or a provider/user blocker remains.

Current npm live release: `viberaven@1.2.0`, `@viberaven/cli@1.2.0`, and `@viberaven/mcp@1.1.8`.

If this repo helps, star it so other AI app builders can find the gate. Use **Watch -> Custom -> Releases** if you want release notifications. Shipping with VibeRaven? Add the [README badge snippet](./docs/badge-snippet.md) so your repo links back to the launch gate.

> VibeRaven public repo is the agent discovery and installation surface. Product source code and service internals live in a private repository.

## What it catches before launch

VibeRaven looks for repo evidence that an AI coding agent can actually inspect before it claims an app is production-ready:

- Supabase tables without strong RLS evidence.
- Webhook routes without signature verification proof.
- Auth callback, redirect, and environment drift across local, preview, and production.
- Deploy-only auth failures such as `Authentication required after deploy`, `401 Unauthorized after successful login`, or `auth cookies are set but not recognized`.
- Preview-only topology failures such as `preflight request does not have HTTP ok status on preview` or `Vercel deployment protection breaks preflight`.
- Monitoring visibility gaps such as `Sentry SDK is not sending any data`, `events not appearing in my project`, or `recordings are not being captured`.
- Billing, DNS, credentials, quotas, or provider setup that still needs dashboard action.
- Monitoring and observability claims without local evidence.
- Agent instructions that allow deploy or production-ready claims before the gate is clear.

[Example scan output](./examples/proof/agent-tasklist.sample.md) · [Redacted launch-gap case study](./examples/proof/launch-gap-case-study.md) · [Roadmap](./ROADMAP.md) · [Support](./SUPPORT.md) · [Contributing](./CONTRIBUTING.md) · [What the gate checks](./llms.txt) · [Full agent reference](https://viberaven.dev/llms-full.txt)

![Terminal scan demo](https://viberaven.dev/marketplace-demo.gif)

## Contribute — help define Agentic Product Ops

VibeRaven is being built in the open as the standard for operating AI-built apps after launch. You don't need to touch private internals to help. Pick a 30–90 minute quest:

| Path | What you can do | Time |
|------|-----------------|------|
| Bug storyteller | Share a real launch / after-launch failure in Discussions | ~15 min |
| Provider mapper | Add a Supabase/Vercel/Clerk/Stripe/Resend/Sentry evidence example | ~45 min |
| Fixture builder | Add a broken→fixed example app or release timeline | ~60 min |
| Prompt writer | Add an agent prompt template for release/provider debugging | ~30 min |
| Docs contributor | Improve setup, screenshots, and guides | ~30 min |

See [docs/contributor-quests.md](./docs/contributor-quests.md) for quests and acceptance criteria, [CONTRIBUTING.md](./CONTRIBUTING.md) for the workflow, and open [good first issues](https://github.com/ohad6k/VibeRaven/contribute). Small PRs are reviewed within 48h.

## Feedback wanted

What did your AI-built app miss before deploy? Add it to the [feedback discussion](https://github.com/ohad6k/VibeRaven/discussions/7) or open a focused issue:

- [Webhook signature proof example](https://github.com/ohad6k/VibeRaven/issues/4)
- [Supabase RLS false-positive fixture](https://github.com/ohad6k/VibeRaven/issues/5)
- [Clerk + Vercel auth redirect evidence](https://github.com/ohad6k/VibeRaven/issues/6)

**Repositories:** Public discovery -> [ohad6k/VibeRaven](https://github.com/ohad6k/VibeRaven) (this repo). Private product development -> `ohad6k/viberaven-dev` (not public).

The local-first boundary matters: the open-source local CLI/UI does not require login and does not use Ohad's OpenAI API key.

## Install and run

Open the local launch console:

```bash
npx -y viberaven
```

Explicit UI and gate commands:

```bash
npx -y viberaven ui .
npx -y viberaven --agent-mode .
npx -y viberaven --verify .
```

## Install for AI agents

Make Codex, Claude Code, Cursor, Copilot, and Gemini use VibeRaven before deploy:

```bash
npx -y viberaven init --agents all
npx -y viberaven doctor --agents
```

Preview without writing files:

```bash
npx -y viberaven init --agents all --dry-run
```

This installs bounded rules (`<!-- VIBERAVEN:START -->` ... `<!-- VIBERAVEN:END -->`) into:

- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`
- `.cursor/rules/viberaven-core.mdc` (+ scoped Supabase, deploy, payments rules)
- `.github/copilot-instructions.md`
- `.viberaven/agent-context.md`, `.viberaven/mission-map.md`

## Run the production gate

```bash
npx -y viberaven --agent-mode .
```

Non-interactive production gate for agents and CI.

Read `.viberaven/prp.json` first, then `.viberaven/gate-result.json` and `.viberaven/context-map.json`. Apply safe repo-code fixes directly when VibeRaven provides a supported heal or MCP action. Respect `batchSize`, verify once per batch, and do not claim production-ready while `decision.status` is `blocked` or `gate.status` is not `clear`.

Then:

```bash
npx -y viberaven --verify .
npx -y viberaven --strict
```

For Vercel + Supabase local evidence:

```bash
npx -y viberaven audit --vercel-supabase
```

MCP tools include `viberaven_prp_current`, `viberaven_prp_findings`, `viberaven_prp_next_action`, `viberaven_check_readiness`, `viberaven_heal_apply`, and `viberaven_verify`. MCP resources include `prp://current`, `prp://findings`, `prp://next-actions`, `prp://mission-map`, and `prp://context-map`.

Do not stop at "scan complete." The loop is done when `decision.status !== "blocked"` and `gate.status === "clear"`, or a provider/user blocker remains.

Normal git push is not gated. VibeRaven gate language is about launch/deploy-readiness claims, not ordinary pushes.

## Install as a skills.sh skill

This repo includes `skills.sh.json` and the `viberaven` skill.

```bash
npx -y skills add ohad6k/VibeRaven --skill viberaven
```

## Agent-ready starter template

[examples/nextjs-supabase-vercel-production-ready-template](./examples/nextjs-supabase-vercel-production-ready-template/) - agent rules and `viberaven:*` scripts for Next.js + Supabase + Vercel.

## Machine-readable docs

- [llms-full.txt](https://viberaven.dev/llms-full.txt)
- [llms.txt](./llms.txt)
- [skills.json](https://viberaven.dev/skills.json)
- [skills.sh.json](./skills.sh.json)
- [Production Protocol guide](https://viberaven.dev/viberaven-production-protocol-ai-built-apps.md)
- [What is `.viberaven/prp.json`?](https://viberaven.dev/what-is-viberaven-prp-json.md)
- [How to use `nextActions`](https://viberaven.dev/how-to-use-viberaven-next-actions.md)
- [PRP MCP resources](https://viberaven.dev/viberaven-prp-mcp-resources.md)
- [Example proof artifacts](./examples/proof/)

## MCP

VibeRaven is listed in the MCP registry for agents that prefer tools over raw terminal commands.

```json
{ "viberaven": { "command": "npx", "args": ["-y", "viberaven", "--mcp"] } }
```

Prefer `viberaven_prp_current` or `prp://current` when MCP is available; use `viberaven_validate_npm_package` before adding npm dependencies.

## Get the product

- Website: [viberaven.dev](https://viberaven.dev)
- npm: [viberaven](https://www.npmjs.com/package/viberaven)
- Issues: [ohad6k/VibeRaven/issues](https://github.com/ohad6k/VibeRaven/issues)
- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Roadmap: [ROADMAP.md](./ROADMAP.md)
- Support: [SUPPORT.md](./SUPPORT.md)

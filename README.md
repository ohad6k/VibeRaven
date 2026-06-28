# VibeRaven

<p align="center">
  <img src="./assets/viberaven-mascot.png" width="112" alt="VibeRaven mascot logo" />
</p>

[![GitHub stars](https://img.shields.io/github/stars/ohad6k/VibeRaven?style=social)](https://github.com/ohad6k/VibeRaven/stargazers)
[![GitHub release](https://img.shields.io/github/v/release/ohad6k/VibeRaven?display_name=tag)](https://github.com/ohad6k/VibeRaven/releases)
[![npm version](https://img.shields.io/npm/v/viberaven)](https://www.npmjs.com/package/viberaven)
[![npm downloads](https://img.shields.io/npm/dw/viberaven)](https://www.npmjs.com/package/viberaven)
[![License](https://img.shields.io/github/license/ohad6k/VibeRaven)](https://github.com/ohad6k/VibeRaven/blob/main/LICENSE)

AI got your app to demo. **VibeRaven helps you operate it as a real product with production-readiness context.**

> **Open-source mission control for AI-built apps.**

<p align="center">
  <a href="https://github.com/ohad6k/VibeRaven/releases/download/studio-demo-v1/viberaven-studio-demo-26s.mp4" title="Watch the 26s VibeRaven Studio demo">
    <img src="./media/viberaven-demo-hero.gif" alt="VibeRaven Studio demo — provider board, version context, and agentic chat" width="860" />
  </a>
</p>

## Try it

```bash
npx -y viberaven
```

That's the whole install. It opens VibeRaven Studio on localhost — no login, no account.

## What it is

VibeRaven is the **open-source product operations console for AI-built apps**. One local workspace where vibe coders and coding agents manage providers, releases, and what to fix next — from first demo to real users.

VibeRaven turns provider state, release history, and launch gaps into practical context for local agents.

## How it works

VibeRaven Studio has three things on screen:

| | |
|---|---|
| **Provider Control Board** | See Supabase, Vercel, Clerk, Stripe, monitoring, email, analytics, and env state in one place — read from your repo, not a dashboard. |
| **Versions & Releases** | Compare what changed between releases and drag release context into agent chat. |
| **Agentic Chat with Product Context** | Drag a provider or release into chat, ask what changed / what broke / what to fix next, get a scoped answer — not a CLI lecture. |

You chat with your connected coding agent (Codex CLI, Claude Code, Gemini CLI, or a local shell), attach provider and release context, and act on fixes without leaving localhost.

![VibeRaven Studio localhost UI](./assets/viberaven-localhost-ui.png)

## Install for AI agents

Make Codex, Claude Code, Cursor, Copilot, and Gemini use VibeRaven:

```bash
npx -y viberaven init --agents all
```

Preview without writing files:

```bash
npx -y viberaven init --agents all --dry-run
```

## Contribute

VibeRaven is built in the open as the standard for operating AI-built apps after launch. Pick a 30–90 minute quest — no private internals required:

| Path | What you can do | Time |
|------|-----------------|------|
| Bug storyteller | Share a real launch / after-launch failure in Discussions | ~15 min |
| Provider mapper | Add a Supabase/Vercel/Clerk/Stripe/Resend/Sentry evidence example | ~45 min |
| Fixture builder | Add a broken→fixed example app or release timeline | ~60 min |
| Prompt writer | Add an agent prompt template for release/provider debugging | ~30 min |
| Docs contributor | Improve setup, screenshots, and guides | ~30 min |

See [docs/contributor-quests.md](./docs/contributor-quests.md), [CONTRIBUTING.md](./CONTRIBUTING.md), and open [good first issues](https://github.com/ohad6k/VibeRaven/contribute). Small PRs are reviewed within 48h.

## Help & feedback

- What did your AI-built app miss before deploy? Tell us in the [feedback discussion](https://github.com/ohad6k/VibeRaven/discussions/7).
- Open an [issue](https://github.com/ohad6k/VibeRaven/issues) — false positive, missed production gap, or a provider/framework you want supported.
- [Support](./SUPPORT.md) · [Roadmap](./ROADMAP.md) · [Examples](./examples/proof/)

If this repo helps, star it so other AI app builders can find it.

## Links

- Website: [viberaven.dev](https://viberaven.dev)
- npm: [viberaven](https://www.npmjs.com/package/viberaven)
- Issues: [ohad6k/VibeRaven/issues](https://github.com/ohad6k/VibeRaven/issues)
- Discussions: [ohad6k/VibeRaven/discussions](https://github.com/ohad6k/VibeRaven/discussions)

> VibeRaven's public repo is the discovery and installation surface. Product source code and service internals live in a private repository. The local CLI/UI does not require login and does not use anyone's API key.

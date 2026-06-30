<p align="center">
  <img src="./assets/raven-mascot.png" width="170" alt="VibeRaven raven mascot">
</p>

<h1 align="center">VibeRaven</h1>

<p align="center">
  <strong>Stop your agent from patching blind.</strong>
</p>

<p align="center">
  <a href="https://github.com/ohad6k/VibeRaven/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/ohad6k/VibeRaven?style=flat-square&label=stars"></a>
  <a href="https://www.npmjs.com/package/viberaven"><img alt="npm version" src="https://img.shields.io/npm/v/viberaven?style=flat-square&label=npm"></a>
  <a href="https://www.npmjs.com/package/viberaven"><img alt="npm downloads" src="https://img.shields.io/npm/dm/viberaven?style=flat-square&label=npm%20downloads"></a>
  <img alt="skills" src="https://img.shields.io/badge/skills-4-7c3aed?style=flat-square">
  <img alt="works with Codex Claude Gemini Cursor" src="https://img.shields.io/badge/agents-Codex%20%7C%20Claude%20%7C%20Gemini%20%7C%20Cursor-111827?style=flat-square">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-111827?style=flat-square">
</p>

<p align="center">
  <a href="./assets/viberaven-studio-demo.mp4">
    <img src="./assets/viberaven-studio-demo.gif" alt="VibeRaven Studio cockpit UI with agent chat, provider board, release versions, access controls, and production actions">
  </a>
</p>

<p align="center">
  <a href="./assets/viberaven-studio-demo.mp4"><strong>Open the full-quality MP4 demo</strong></a>
</p>

Repo context tells the agent what exists. Production context tells it what is dangerous.

VibeRaven gives AI-built apps a **plugin/skills pack**, MCP context, and local Studio so agents can find what changed, understand provider risk, and make the next fix without guessing.

## Plugin + Skills

Use the skills when you want the agent behavior change immediately. Use the Studio when you want the full cockpit around releases, providers, diffs, chat, MCP context, and access modes.

<p align="center">
  <img src="./assets/viberaven-real-studio.png" alt="Real VibeRaven Studio screenshot showing chat, provider context, release versions, and agent controls">
</p>

```bash
npx -y skills add ohad6k/VibeRaven --skill production-context
npx -y skills add ohad6k/VibeRaven --skill what-broke
npx -y skills add ohad6k/VibeRaven --skill viberaven
npx -y skills add ohad6k/VibeRaven --skill go-live
```

| Skill | What It Makes The Agent Do |
| --- | --- |
| `production-context` | Maintain `.viberaven/production-context.md`: what changed, why dangerous, what was verified, and what provider/human proof remains. |
| `what-broke` | Ask what changed before editing, then fix the smallest repo-code surface the evidence supports. |
| `viberaven` | Use Studio, provider cards, release/version context, MCP status, and access modes during real work. |
| `go-live` | Push and deploy with build, live URL proof, and clear provider/human boundaries. |

## Instant Hook

`what-broke` is the fast entry point: a skill that makes an agent ask what changed before editing, then move toward the fix.

```text
User:
Login broke after deploy.

Normal agent:
Starts editing middleware.

With VibeRaven:
Stop. What changed?
- last working version: v1.2.3
- changed since then: auth callback route + preview env
- repo-code fix: update redirect fallback
- human/provider action: add callback URL in the auth dashboard
```

That is only the first move. VibeRaven should not just explain what broke. It should carry production context into the next safe repo fix, then separate anything that still needs a provider dashboard, MCP tool, or human action.

## Open the Full Studio

```bash
npx -y viberaven
```

The Studio is the cockpit after the instant skill hook: agentic chat, draggable providers, draggable versions/releases, release diffs, provider MCP context, terminal output, CLI-agent connection checks, and access-mode control.

Current npm latest: `viberaven@1.2.4` and `@viberaven/cli@1.2.4`.

If this repo helps, star it so other AI app builders can find production context for agents. Use **Watch -> Custom -> Releases** if you want release notifications.

> VibeRaven public repo is the agent discovery and installation surface. Product source code and service internals live in a private repository.

**Repositories:** Public discovery -> [ohad6k/VibeRaven](https://github.com/ohad6k/VibeRaven) (this repo). Private product development -> `ohad6k/viberaven-dev` (not public).

The local-first boundary matters: the open-source local CLI/UI does not require login and does not use Ohad's OpenAI API key.

## What VibeRaven Adds

- **Version context:** tags, release names, changelogs, PR links, git diffs, rollback notes, and recent deploy history.
- **Production danger context:** provider config drift, migration history, incidents, fragile customer paths, auth/billing/database/deploy boundaries.
- **Fix boundaries:** repo-code fixes are applied or prompted separately from provider dashboard work that needs proof.
- **Agent control:** ask/approve/full access modes for connected Codex, Claude Code, Gemini, and other CLI agents.
- **MCP context:** provider and readiness context can be pulled into the agent without pretending MCP itself is the user-facing feature.

## Install Agent Guidance

Make AI agents carry release and provider context before they patch the repo:

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

## Non-interactive Artifact Loop

Use this only when written artifacts are needed outside the Studio:

```bash
npx -y viberaven --agent-mode .
npx -y viberaven --verify .
npx -y viberaven --strict
```

Read `.viberaven/prp.json` first, then `.viberaven/gate-result.json` and `.viberaven/context-map.json`. Apply safe repo-code fixes directly when VibeRaven provides a supported heal or MCP action. Respect `batchSize`, verify once per batch, and do not claim production-ready while `decision.status` is `blocked` or `gate.status` is not `clear`.

For Vercel + Supabase local evidence:

```bash
npx -y viberaven audit --vercel-supabase
```

Normal git push is not gated. VibeRaven gate language is about launch/deploy-readiness claims, not ordinary pushes.

## Agent-ready Starter Template

[examples/nextjs-supabase-vercel-production-ready-template](./examples/nextjs-supabase-vercel-production-ready-template/) - agent rules and `viberaven:*` scripts for Next.js + Supabase + Vercel.

## Machine-readable Docs

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

## Get the Product

- Website: [viberaven.dev](https://viberaven.dev)
- npm: [viberaven](https://www.npmjs.com/package/viberaven)
- Issues: [ohad6k/VibeRaven/issues](https://github.com/ohad6k/VibeRaven/issues)

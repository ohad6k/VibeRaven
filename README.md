# VibeRaven

> VibeRaven public repo is the agent discovery and installation surface. Product source code and service internals live in a private repository.

> Before your AI agent says "production ready", run `npx -y viberaven --agent-mode`

Production readiness gate for AI-coded Supabase/Vercel apps - **install for AI coding agents first**, then scan, fix launch gaps, and ship.

**Repositories:** Public discovery -> [ohad6k/VibeRaven](https://github.com/ohad6k/VibeRaven) (this repo). Private product development -> `ohad6k/viberaven-dev` (not public).

## Install for AI agents (start here)

Make Codex, Claude Code, Cursor, Copilot, and Gemini use VibeRaven before deploy:

```bash
npx -y viberaven init --agents all
npx -y viberaven doctor --agents
```

Preview without writing files:

```bash
npx -y viberaven init --agents all --dry-run
```

This installs bounded rules (`<!-- VIBERAVEN:START -->` … `<!-- VIBERAVEN:END -->`) into:

- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`
- `.cursor/rules/viberaven.mdc`
- `.github/copilot-instructions.md`
- `.viberaven/agent-context.md`, `.viberaven/mission-map.md`

Opt-in and transparent - your existing content outside the block is preserved.

## Run the production gate

```bash
npx -y viberaven --agent-mode
```

Read `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, and `.viberaven/mission-map.md`. Fix **one** launch gap, then:

```bash
npx -y viberaven --verify
npx -y viberaven --strict
```

For Vercel + Supabase local evidence:

```bash
npx -y viberaven audit --vercel-supabase
```

Do not stop at "scan complete." The loop is done when `gate.status === "clear"` in `.viberaven/gate-result.json`.

## Agent-ready starter template

Copy or browse: [examples/nextjs-supabase-vercel-production-ready-template](./examples/nextjs-supabase-vercel-production-ready-template/) - seven agent files pre-installed for Next.js + Supabase + Vercel stacks.

## Machine-readable docs for agents

- [llms-full.txt](https://viberaven.dev/llms-full.txt) - full canonical reference (commands, loop, schema, constraints)
- [llms.txt](./llms.txt) - short index (also at [viberaven.dev/llms.txt](https://viberaven.dev/llms.txt))
- [agent-context.md](https://viberaven.dev/agent-context.md)
- [skills.json](https://viberaven.dev/skills.json)

## MCP (prefer tools when configured)

```json
{ "viberaven": { "command": "npx", "args": ["-y", "viberaven", "--mcp"] } }
```

Prefer `viberaven_check_readiness` when MCP is available; otherwise use `npx -y viberaven --agent-mode`.

## What VibeRaven does

- **Agent-mode scan** - repo evidence, mission map, launch gaps, agent tasklist
- **Production copilot loop** - batch heals, verify once per batch, strict gate before deploy
- **CLI + MCP** - `npx -y viberaven` from any project root

![VibeRaven demo](https://viberaven.dev/marketplace-demo.gif)

[![VibeRaven enabled](https://img.shields.io/badge/VibeRaven-enabled-7c3aed?style=flat-square)](https://viberaven.dev)

## Get the product

- Website: [viberaven.dev](https://viberaven.dev)
- npm: [viberaven](https://www.npmjs.com/package/viberaven)
- Issues (public): [ohad6k/VibeRaven/issues](https://github.com/ohad6k/VibeRaven/issues)

## Plan

Free: 2 scans, 6 mission map sections. Pro: monthly scans, all 12 sections. Heals are batched before rescan so quota is not burned after every small edit.

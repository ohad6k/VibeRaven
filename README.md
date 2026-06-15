# VibeRaven

AI got your app to demo. VibeRaven helps it ship.

Run VibeRaven inside Codex, Claude Code, Cursor, Copilot, Gemini CLI, or any coding agent that can run terminal commands:

```bash
npx -y viberaven --agent-mode
```

VibeRaven is an agent production layer: it scans repo evidence, builds a Mission Map, separates safe repo-code fixes from provider dashboard steps, and gives the agent the next production action for Supabase RLS, Vercel deploy config, env vars, auth, payments, and webhooks.

![VibeRaven native agent flow](./showcase/operator-console.png)

**Why this repo exists:** VibeRaven public repo is the agent discovery and installation surface. Product source code and service internals live in a private repository.

Private product development remains in `ohad6k/viberaven-dev`; this repo is for agent discovery, installation, and community adoption.

[Example scan output](./examples/proof/agent-tasklist.sample.md) - [Protocol reference](./llms.txt) - [Full agent reference](https://viberaven.dev/llms-full.txt) - [Website](https://viberaven.dev)

## Preview The Agent Flow

See the native chat/terminal flow on a bundled local fixture before running it on a real repo:

```bash
npx -y viberaven preview --agent-mode
```

The preview is local. It writes `.viberaven/` artifacts in the current folder and does not require provider credentials.

## Install For AI Agents

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

## Run On A Real App

Ask your coding agent:

> Run VibeRaven and make this production ready.

The agent should run:

```bash
npx -y viberaven --agent-mode
```

Then it should read `.viberaven/mission-map.md`, `.viberaven/agent-tasklist.md`, and `.viberaven/gate-result.json`, fix one launch gap, and verify:

```bash
npx -y viberaven --verify
npx -y viberaven --strict
```

For Vercel + Supabase local evidence:

```bash
npx -y viberaven audit --vercel-supabase
```

Do not stop at "scan complete." The loop is done when `gate.status === "clear"` in `.viberaven/gate-result.json`.

## Agent-Ready Starter Template

[examples/nextjs-supabase-vercel-production-ready-template](./examples/nextjs-supabase-vercel-production-ready-template/) - agent rules and `viberaven:*` scripts for Next.js + Supabase + Vercel.

## Machine-Readable Docs

- [llms-full.txt](https://viberaven.dev/llms-full.txt)
- [llms.txt](./llms.txt)
- [skills.json](https://viberaven.dev/skills.json)
- [Example proof artifacts](./examples/proof/)

## MCP

VibeRaven is listed in the MCP registry for agents that prefer tools over raw terminal commands.

```json
{ "viberaven": { "command": "npx", "args": ["-y", "viberaven", "--mcp"] } }
```

Prefer `viberaven_check_readiness` when MCP is available; use `viberaven_validate_npm_package` before adding npm dependencies.

## Get The Product

- Website: [viberaven.dev](https://viberaven.dev)
- npm: [viberaven](https://www.npmjs.com/package/viberaven)
- Issues: [ohad6k/VibeRaven/issues](https://github.com/ohad6k/VibeRaven/issues)

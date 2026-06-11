# VibeRaven

AI got your app to demo. VibeRaven gets it to production.

Run the production gate for AI-generated apps:

```bash
npx -y viberaven@latest --agent-mode
```

Detects production gaps around Supabase RLS, Vercel deploy config, env vars, auth redirects, payments, webhooks, and AI code rot.

[Example scan output](./examples/proof/agent-tasklist.sample.md) · [What the gate checks](./llms.txt) · [Full agent reference](https://viberaven.dev/llms-full.txt)

![Terminal scan demo](https://viberaven.dev/marketplace-demo.gif)

**Repositories:** Public discovery → [ohad6k/VibeRaven](https://github.com/ohad6k/VibeRaven) (this repo). Private product development → `ohad6k/viberaven-dev` (not public).

## Install for AI agents

Make Codex, Claude Code, Cursor, Copilot, and Gemini use VibeRaven before deploy:

```bash
npx -y viberaven@latest init --agents all
npx -y viberaven@latest doctor --agents
```

Preview without writing files:

```bash
npx -y viberaven@latest init --agents all --dry-run
```

This installs bounded rules (`<!-- VIBERAVEN:START -->` … `<!-- VIBERAVEN:END -->`) into:

- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`
- `.cursor/rules/viberaven-core.mdc` (+ scoped Supabase, deploy, payments rules)
- `.github/copilot-instructions.md`
- `.viberaven/agent-context.md`, `.viberaven/mission-map.md`

## Run the production gate

```bash
npx -y viberaven@latest --agent-mode
```

Non-interactive production gate for agents and CI.

Read `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, and `.viberaven/mission-map.md`. Fix **one** launch gap, then:

```bash
npx -y viberaven@latest --verify
npx -y viberaven@latest --strict
```

For Vercel + Supabase local evidence:

```bash
npx -y viberaven@latest audit --vercel-supabase
```

Do not stop at "scan complete." The loop is done when `gate.status === "clear"` in `.viberaven/gate-result.json`.

## Agent-ready starter template

[examples/nextjs-supabase-vercel-production-ready-template](./examples/nextjs-supabase-vercel-production-ready-template/) — agent rules and `viberaven:*` scripts for Next.js + Supabase + Vercel.

## Machine-readable docs

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

## Get the product

- Website: [viberaven.dev](https://viberaven.dev)
- npm: [viberaven](https://www.npmjs.com/package/viberaven)
- Issues: [ohad6k/VibeRaven/issues](https://github.com/ohad6k/VibeRaven/issues)

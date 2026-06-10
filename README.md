# VibeRaven

AI got your app to demo. VibeRaven gets it to production.

Run a production-readiness scan for AI-generated apps:

```bash
npx viberaven scan
```

Detects production gaps around Supabase RLS, Vercel deploy config, env vars, auth redirects, payments, webhooks, and AI code rot.

[Example scan output](./examples/proof/agent-tasklist.sample.md) · [What the gate checks](./llms.txt) · [Full agent reference](https://viberaven.dev/llms-full.txt)

![Terminal scan demo](https://viberaven.dev/marketplace-demo.gif)

**Repositories:** Public discovery → [ohad6k/VibeRaven](https://github.com/ohad6k/VibeRaven) (this repo). Private product development → `ohad6k/viberaven-dev` (not public).

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

This installs bounded rules (`<!-- VIBERAVEN:START -->` … `<!-- VIBERAVEN:END -->`) into:

- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`
- `.cursor/rules/viberaven-core.mdc` (+ scoped Supabase, deploy, payments rules)
- `.github/copilot-instructions.md`
- `.viberaven/agent-context.md`, `.viberaven/mission-map.md`

## Run the production gate

```bash
npx viberaven scan
```

Agents and CI should use `npx -y viberaven --agent-mode` (same scan, non-interactive).

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

[examples/nextjs-supabase-vercel-production-ready-template](./examples/nextjs-supabase-vercel-production-ready-template/) — agent rules and `viberaven:*` scripts for Next.js + Supabase + Vercel.

## Machine-readable docs

- [llms-full.txt](https://viberaven.dev/llms-full.txt)
- [llms.txt](./llms.txt)
- [skills.json](https://viberaven.dev/skills.json)
- [Example proof artifacts](./examples/proof/)

## MCP

```json
{ "viberaven": { "command": "npx", "args": ["-y", "viberaven", "--mcp"] } }
```

Prefer `viberaven_check_readiness` when MCP is available; use `viberaven_validate_npm_package` before adding npm dependencies.

## Get the product

- Website: [viberaven.dev](https://viberaven.dev)
- npm: [viberaven](https://www.npmjs.com/package/viberaven)
- Issues: [ohad6k/VibeRaven/issues](https://github.com/ohad6k/VibeRaven/issues)

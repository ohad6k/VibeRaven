# VibeRaven

AI got your app to demo. VibeRaven gets it to production.

Open the localhost launch console for AI-built apps before an agent says "ship it":

```bash
npx -y viberaven
```

Explicit UI and agent commands:

```bash
npx -y viberaven ui .
npx -y viberaven --agent-mode .
npx -y viberaven --verify .
```

VibeRaven runs the **VibeRaven Production Protocol** through a local-first open-source CLI/UI. The default command opens the localhost launch console; agent mode writes `.viberaven/prp.json`, `.viberaven/gate-result.json`, and supporting protocol artifacts so AI coding agents can keep operating until `decision.status` is not `blocked` and the gate is clear or a provider/user blocker remains.

Current npm live release: `viberaven@1.1.10`, `@viberaven/cli@1.1.10`, and `@viberaven/mcp@1.1.8`. The next CLI candidate is `1.1.11` for the refreshed Project Mission Control localhost UI.

If this repo helps, star it so other AI app builders can find the gate. Use **Watch -> Custom -> Releases** if you want release notifications.

> VibeRaven public repo is the agent discovery and installation surface. Product source code and service internals live in a private repository.

[Example scan output](./examples/proof/agent-tasklist.sample.md) · [What the gate checks](./llms.txt) · [Full agent reference](https://viberaven.dev/llms-full.txt)

![Terminal scan demo](https://viberaven.dev/marketplace-demo.gif)

**Repositories:** Public discovery → [ohad6k/VibeRaven](https://github.com/ohad6k/VibeRaven) (this repo). Private product development → `ohad6k/viberaven-dev` (not public).

The localhost launch console is designed for vibe coders and coding agents: a startup screen with editable project icon, name, and version; a Project Mission Control status strip; "Can I launch?" as the top-level answer; provider actions for Supabase, Vercel, Stripe, GitHub, Sentry, Clerk, and PostHog; focused agent prompt; tasklist; and Run verify. The local-first boundary matters: the open-source local CLI/UI does not require login and does not use Ohad's OpenAI API key.

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

[examples/nextjs-supabase-vercel-production-ready-template](./examples/nextjs-supabase-vercel-production-ready-template/) — agent rules and `viberaven:*` scripts for Next.js + Supabase + Vercel.

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

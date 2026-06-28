# VibeRaven

VibeRaven is the Production Proof Pack and local Studio for AI-built apps. It gives Claude Code, Codex, Gemini, Cursor, and other coding agents provider context, release/version context, approval-aware agentic chat, and installable skills before production changes.

**Use it when an agent is about to say "production ready."** VibeRaven makes the agent prove RLS, webhooks, env vars, callbacks, monitoring signal, release risk, and provider dashboard boundaries first.

Start the Studio from any project:

```bash
npx -y viberaven
```

The Studio cockpit focuses on the work agents need before a production change: connected-agent chat, provider cards, provider MCP context, versions/releases, release diffs, terminal output, and access-mode control. Treat `installed` and `connected` as different states for coding CLIs; Studio should test the connection before real chat control.

If this repo helps, star it so other AI app builders can find the Studio and production skills. Use **Watch -> Custom -> Releases** if you want release notifications.

> VibeRaven public repo is the agent discovery and installation surface. Product source code and service internals live in a private repository.

## Install Agent Guidance

Install bounded VibeRaven guidance for Codex, Claude Code, Cursor, Copilot, Gemini, and related agents:

```bash
npx -y viberaven init --agents all
```

Preview without writing files:

```bash
npx -y viberaven init --agents all --dry-run
```

The installer writes bounded rules into agent instruction files where supported, including `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, Cursor rules, Copilot instructions, and `.viberaven` context files.

## Install As A Plugin-Style Skill Pack

VibeRaven ships plugin-style metadata and command prompts so agent hosts can expose it as a pack:

- Codex: `.codex-plugin/plugin.json`
- Claude Code: `.claude-plugin/plugin.json`
- Gemini CLI: `gemini-extension.json`
- Generic plugin hosts: `plugin.yaml`
- Slash-command prompts: `commands/`

Command entry points:

- `/viberaven-help`: show the pack and output contract.
- `/viberaven-proof`: run a production proof pass.
- `/viberaven-launch`: collect launch receipts before saying ready.
- `/viberaven-human-actions`: separate repo-code fixes from dashboard work.

See [docs/agent-portability.md](./docs/agent-portability.md).

## Production Skills

VibeRaven's public direction is provider-aware production work for AI-built apps:

- Agentic chat that can work on the user's repo through connected CLIs.
- Provider-aware context and MCP-assisted provider work.
- Release/version comparison and post-launch drift explanation.
- Approval/full-access controls for safer local project changes.
- Clear boundaries between repo-code fixes and provider dashboard actions.

Browse the current production-skill library in [docs/production-skills.md](./docs/production-skills.md).

The pack names are intentionally promotable and evidence-first: `supabase-rls-proof`, `stripe-webhook-proof`, `vercel-env-drift`, `clerk-callback-drift`, `sentry-proof-of-signal`, `release-diff-risk`, `provider-human-actions`, `launch-receipts`, and `do-not-guess-production`.

Do not claim provider dashboard checks are fixed by repo-code edits. Billing, DNS, webhooks, credentials, quotas, provider project settings, and live verification need provider evidence or human confirmation.

## MCP

VibeRaven can be exposed to MCP-aware agents:

```json
{ "viberaven": { "command": "npx", "args": ["-y", "viberaven", "--mcp"] } }
```

Use MCP output as provider/readiness context for Studio-aware agents. The MCP package also includes compatibility tools for older scan-derived artifacts and action-surface helpers.

VibeRaven also keeps MCP registry metadata in `docs/mcp-registry-submission.md` so agents and maintainers can verify the public MCP discovery surface alongside npm and skills.sh metadata.

## Agent-ready Starter Template

[examples/nextjs-supabase-vercel-production-ready-template](./examples/nextjs-supabase-vercel-production-ready-template/) includes agent rules and `viberaven:*` scripts for Next.js + Supabase + Vercel.

## Machine-readable Docs

- [llms-full.txt](https://viberaven.dev/llms-full.txt)
- [llms.txt](./llms.txt)
- [skills.json](https://viberaven.dev/skills.json)
- [skills.sh.json](./skills.sh.json)
- [Production Protocol guide](https://viberaven.dev/viberaven-production-protocol-ai-built-apps.md)
- [Example proof artifacts](./examples/proof/)

## Legacy Scan / Gate Compatibility

Older VibeRaven docs and compatibility tools may mention agent-mode scans, task lists, gate results, PRP resources, or scan-derived action manifests. Treat that language as compatibility context, not the main public product surface.

The current default is the Studio:

```bash
npx -y viberaven
```

Normal git push is not gated. VibeRaven language about readiness is about production-change confidence, release review, and provider-aware evidence, not blocking ordinary repository work.

Legacy scan/gate machine-readable references:

- [What is `.viberaven/prp.json`?](https://viberaven.dev/what-is-viberaven-prp-json.md)
- [How to use `nextActions`](https://viberaven.dev/how-to-use-viberaven-next-actions.md)
- [PRP MCP resources](https://viberaven.dev/viberaven-prp-mcp-resources.md)

## Install as a skills.sh Skill

This repo includes `skills.sh.json` and the `viberaven` skill.

```bash
npx -y skills add ohad6k/VibeRaven --skill viberaven
```

## Links

- Website: [viberaven.dev](https://viberaven.dev)
- npm: [viberaven](https://www.npmjs.com/package/viberaven)
- Issues: [ohad6k/VibeRaven/issues](https://github.com/ohad6k/VibeRaven/issues)
- Public discovery repo: [ohad6k/VibeRaven](https://github.com/ohad6k/VibeRaven)

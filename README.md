# VibeRaven

Production readiness for AI-built apps.

VibeRaven gives Codex, Claude Code, Cursor, Gemini CLI, Copilot, and other coding agents a concrete launch protocol before they claim an app is ready for real users.

```bash
npx -y viberaven --agent-mode
```

It scans repo evidence, separates repo-code gaps from provider actions, writes machine-readable state in `.viberaven/`, and renders compact chat-native production actions the agent can actually follow.

[Website](https://viberaven.dev) - [npm](https://www.npmjs.com/package/viberaven) - [Example scan output](./examples/proof/agent-tasklist.sample.md) - [Agent reference](./llms.txt) - [Contributing](./CONTRIBUTING.md) - [Security](./SECURITY.md)

![VibeRaven terminal scan demo](https://viberaven.dev/marketplace-demo.gif)

## What VibeRaven Does

AI agents are good at making an app work locally. Production breaks in different places: auth callbacks, Supabase RLS, Vercel env vars, Stripe webhooks, provider dashboards, DNS, monitoring, and deploy-time configuration.

VibeRaven turns those launch risks into an agent-readable action surface:

- `.viberaven/actions.json` - current production action surface
- `.viberaven/action-registry.json` - stable action ID history
- `.viberaven/agent-tasklist.md` - prioritized human/agent task list
- `.viberaven/gate-result.json` - machine gate verdict
- `.viberaven/context-map.json` - compact repo context for agents

## Free Preview

Use this for demos, videos, screenshots, and local evaluation. It does not scan your repo and does not require login, OpenAI keys, or managed API usage.

```bash
npx -y viberaven preview --agent-mode
```

JSON fixture output:

```bash
npx -y viberaven preview --json
```

The preview shows the same chat-render optimized action style VibeRaven uses in agent mode: stable IDs, focused targets, copy blocks, verify commands, and resume prompts.

## Chat-Native Actions

VibeRaven V1 is chat-render optimized output, not native Codex buttons. The goal is to make normal agent output behave like an action surface by deliberately using primitives the chat already supports.

Example shape:

~~~md
VibeRaven Production Actions
Showing: 3 of 5 current actions
Full state: .viberaven/actions.json

[VR-A1] Connect Stripe Webhook
Status: waiting-on-provider
Ready: endpoint detected, required events prepared
Provider: Configure the Stripe webhook endpoint.
Copy:
```text
checkout.session.completed
customer.subscription.updated
customer.subscription.deleted
```
Verify:
```bash
npx -y viberaven verify --action VR-A1
```
Resume: "Stripe webhook is configured. Continue VibeRaven from VR-A1."
~~~

Every rendered action should map to a real action in `.viberaven/actions.json`.

## Install Agent Rules

Make agents run VibeRaven before deploy, auth, billing, database, webhook, or dependency changes:

```bash
npx -y viberaven init --agents all
npx -y viberaven doctor --agents
```

Preview the rule install without writing files:

```bash
npx -y viberaven init --agents all --dry-run
```

This installs bounded rules into surfaces such as:

- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`
- `.cursor/rules/viberaven-core.mdc`
- `.github/copilot-instructions.md`
- `.viberaven/agent-context.md`, `.viberaven/mission-map.md`

## Production Loop

Run the agent-mode gate from your project root:

```bash
npx -y viberaven --agent-mode
```

Then follow the generated actions:

```bash
npx -y viberaven actions
npx -y viberaven verify --action VR-A1
npx -y viberaven --verify
npx -y viberaven --strict
```

Use local Vercel + Supabase evidence checks when those stacks are present:

```bash
npx -y viberaven audit --vercel-supabase
```

Do not stop at "scan complete." The loop is done when `gate.status === "clear"` in `.viberaven/gate-result.json`, or when VibeRaven reports a provider/user blocker that must be completed outside the repo.

## Command Surface

| Command | Use |
| --- | --- |
| `npx -y viberaven preview --agent-mode` | Free chat-native action preview; no repo scan |
| `npx -y viberaven preview --json` | Free machine-readable preview fixture |
| `npx -y viberaven --agent-mode` | Full production-readiness scan and action output |
| `npx -y viberaven actions` | Reprint the current `.viberaven/actions.json` action surface |
| `npx -y viberaven verify --action VR-A1` | Verify one stable action handle |
| `npx -y viberaven --verify` | Rescan after a fix batch |
| `npx -y viberaven --strict` | CI/deploy gate; fail when not clear |
| `npx -y viberaven audit --vercel-supabase` | Local Vercel/Supabase evidence audit |
| `npx -y viberaven init --agents all` | Install bounded agent rules |
| `npx -y viberaven doctor --agents` | Check installed agent rules |
| `npx -y viberaven clean --plan` | Non-destructive cleanup plan |

## MCP

For agents that prefer tools over terminal commands:

```json
{ "viberaven": { "command": "npx", "args": ["-y", "viberaven", "--mcp"] } }
```

Prefer `viberaven_prp_current` or `viberaven_check_readiness` when MCP is available. Use `viberaven_validate_npm_package` before adding npm dependencies.

## Starter Template

[examples/nextjs-supabase-vercel-production-ready-template](./examples/nextjs-supabase-vercel-production-ready-template/) includes agent rules and `viberaven:*` scripts for a Next.js + Supabase + Vercel app.

## Machine-Readable Docs

- [llms.txt](./llms.txt)
- [llms-full.txt](https://viberaven.dev/llms-full.txt)
- [skills.sh.json](./skills.sh.json)
- [Production Protocol guide](https://viberaven.dev/viberaven-production-protocol-ai-built-apps.md)
- [What is `.viberaven/prp.json`?](https://viberaven.dev/what-is-viberaven-prp-json.md)
- [How to use `nextActions`](https://viberaven.dev/how-to-use-viberaven-next-actions.md)
- [PRP MCP resources](https://viberaven.dev/viberaven-prp-mcp-resources.md)
- [Example proof artifacts](./examples/proof/)

## Contributing

Issues and PRs are welcome for docs, agent rules, examples, command ergonomics, MCP behavior, and production-readiness checks. Keep outputs safe by default: no secrets, tokens, raw env values, or absolute local paths in rendered chat output.

## License

[MIT](./LICENSE).

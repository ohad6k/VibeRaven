# @viberaven/mcp

[![npm version](https://img.shields.io/npm/v/@viberaven/mcp)](https://www.npmjs.com/package/@viberaven/mcp)
[![npm downloads](https://img.shields.io/npm/dw/@viberaven/mcp)](https://www.npmjs.com/package/@viberaven/mcp)
[![license](https://img.shields.io/npm/l/@viberaven/mcp)](https://www.npmjs.com/package/@viberaven/mcp)

Thin MCP wrapper for VibeRaven.

Use it to expose VibeRaven production-readiness, launch gaps, and AI-built app operations to MCP-capable agents.

This package exposes VibeRaven CLI actions as MCP tools for Codex, Claude Code, Cursor, and other agent runtimes. It does not contain VibeRaven backend logic and does not bypass VibeRaven login or scan quotas.

The MCP server wraps the stable CLI package: `npx -y viberaven`.

## Run

```bash
npx -y @viberaven/mcp
```

You can also start the MCP server from the main CLI package:

```bash
npx -y viberaven mcp
```

## Tools

- `viberaven_check_readiness` -> `npx -y viberaven --agent-mode`
- `viberaven_verify` -> `npx -y viberaven --verify`
- `viberaven_audit` -> `npx -y viberaven audit --vercel-supabase`
- `viberaven_init_rules` -> `npx -y viberaven init`
- `viberaven_clean_plan` -> `npx -y viberaven clean --plan`
- `viberaven_strict_gate` -> `npx -y viberaven --agent-mode --strict --json`
- `viberaven_gate_result` -> `npx -y viberaven --agent-mode --json`
- `viberaven_context_map` -> `npx -y viberaven --condense`
- `viberaven_actions` -> `npx -y viberaven actions`
- `viberaven_verify_action` -> `npx -y viberaven verify --action <id>`
- `viberaven_heal_plan` -> `npx -y viberaven --heal --plan`
- `viberaven_heal_prompt` -> `npx -y viberaven --heal --prompt`
- `viberaven_heal_apply` -> `npx -y viberaven --heal --apply`
- `viberaven_validate_npm_package` -> `npx -y viberaven validate-npm-package --json`

`viberaven_check_readiness` is the canonical entrypoint. It runs VibeRaven as the Agent Context + Production Gate and writes `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, and `.viberaven/context-map.json`.

After one fix, call `viberaven_verify`. Before deploy or CI pass, call `viberaven_strict_gate` or run:

```bash
npx -y viberaven --strict
```

## Machine Artifact Contract

```text
docs/contracts/artifacts.md
https://viberaven.dev/schemas/gate-result.schema.json
https://viberaven.dev/schemas/context-map.schema.json
https://viberaven.dev/schemas/gap.schema.json
https://viberaven.dev/schemas/heal-result.schema.json
```

## Login

If VibeRaven prints `LOGIN_URL_READY`, open that exact URL for the user, keep the MCP call alive, and do not ask for passwords, tokens, cookies, or other secrets.

## Security

The MCP package is public integration glue only. It returns CLI stdout/stderr and structured JSON content when available. It does not mutate provider dashboards and does not bypass VibeRaven login, managed API checks, or quota enforcement. Do not claim provider dashboard checks are fixed by repo-code edits.

# GitHub Repository Metadata

This repository is the public open-source surface for VibeRaven: docs, agent rules, examples, MCP configuration, production-readiness protocol references, and user-facing command workflows.

## Repository About

Set on <https://github.com/ohad6k/VibeRaven/settings>:

- **Description:** Production readiness for AI-built apps
- **Website:** https://viberaven.dev

## Topics

`production-readiness`, `ai-agents`, `codex`, `claude-code`, `cursor`, `mcp-server`, `supabase`, `vercel`, `agents-md`, `ai-built-apps`, `rls`, `launch-checklist`

## Public README Requirements

The root README should make these points clear:

- VibeRaven is production readiness for AI-built apps.
- The canonical command is `npx -y viberaven --agent-mode`.
- The free preview command is `npx -y viberaven preview --agent-mode`.
- Agent-mode writes `.viberaven/actions.json`, `.viberaven/action-registry.json`, `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, and `.viberaven/context-map.json`.
- Chat output is optimized for the renderer the agent already has: stable action IDs, focused targets, copy blocks, command blocks, repo-relative file targets, verify commands, and resume prompts.
- VibeRaven never renders secrets, tokens, raw env values, or absolute local paths.

## Keep Out Of Public Docs

Do not publish:

- `.env` values, credentials, tokens, cookies, customer data, or service-role keys
- private billing/provider configuration
- internal incident notes or private deployment logs
- generated local scan artifacts from a user's real app unless explicitly sanitized

## Release Metadata

Current public command surface:

- `viberaven preview --agent-mode`
- `viberaven preview --json`
- `viberaven --agent-mode`
- `viberaven actions`
- `viberaven verify --action VR-A1`
- `viberaven --verify`
- `viberaven --strict`
- `viberaven audit --vercel-supabase`
- `viberaven init --agents all`
- `viberaven doctor --agents`
- `viberaven clean --plan`

## Related

- [Public README](../README.md)
- [Agent reference](../llms.txt)
- [MCP registry submission](./mcp-registry-submission.md)

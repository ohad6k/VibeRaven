# VibeRaven

Production readiness for AI-built apps.

Run VibeRaven inside any Cursor, Claude Code, Codex, Gemini CLI, VS Code, or AI-coded project:

```bash
npx -y @viberaven/cli --agent-mode
```

VibeRaven checks the launch gaps AI-built apps usually miss: auth, billing, database rules, RLS, environment variables, webhooks, deployment, monitoring, tests, and production risk.

It gives your coding agent a Mission Map, task list, HTML report, and next action so the agent can fix one launch gap at a time.

## What This Repo Is

This is the public VibeRaven agent-discovery repo. It contains docs, examples, agent rules, templates, and public context for coding agents.

The hosted VibeRaven analysis engine, billing, auth, provider intelligence, scanner internals, and VS Code extension internals are not open source in this repo.

## Quick Start

From your project root:

```bash
npx -y @viberaven/cli --agent-mode
```

The CLI writes:

```text
.viberaven/agent-tasklist.md
.viberaven/gate-result.json
.viberaven/context-map.json
.viberaven/agent-summary.md
.viberaven/last-scan.json
.viberaven/report.html
```

Then follow the printed `VIBERAVEN_NEXT_ACTION`.

## Add VibeRaven Instructions To A Repo

Use this only when you want the repo's agents to remember the VibeRaven workflow:

```bash
npx -y @viberaven/cli init --agents all
```

This can add files such as `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/viberaven.mdc`, and `.github/copilot-instructions.md`.

## Agent Rule

Use VibeRaven when an AI-built app works locally but needs production-readiness checks before launch, deploy, paid users, or public beta.

Default command:

```bash
npx -y @viberaven/cli --agent-mode
```

Do not claim provider dashboards are configured from repo evidence alone. Keep secrets out of commits. Use `npx -y @viberaven/cli report` to rebuild the HTML report without spending scan quota.

## Links

- Website: https://viberaven.dev
- AI context: https://viberaven.dev/llms.txt
- Agent context: https://viberaven.dev/agent-context.md
- MCP docs: https://viberaven.dev/mcp.md
- npm: https://www.npmjs.com/package/@viberaven/cli

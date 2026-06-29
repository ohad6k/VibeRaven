<p align="center">
  <img src="./assets/raven-mascot.png" width="170" alt="VibeRaven raven mascot">
</p>

<h1 align="center">VibeRaven</h1>

<p align="center">
  <strong>Ship AI-built apps with proof, not vibes.</strong>
</p>

<p align="center">
  <a href="https://github.com/ohad6k/VibeRaven/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/ohad6k/VibeRaven?style=flat-square&label=stars"></a>
  <a href="https://www.npmjs.com/package/viberaven"><img alt="npm version" src="https://img.shields.io/npm/v/viberaven?style=flat-square&label=npm"></a>
  <a href="https://www.npmjs.com/package/viberaven"><img alt="npm downloads" src="https://img.shields.io/npm/dm/viberaven?style=flat-square&label=npm%20downloads"></a>
  <img alt="skills" src="https://img.shields.io/badge/skills-10-7c3aed?style=flat-square">
  <img alt="works with Codex Claude Gemini Cursor" src="https://img.shields.io/badge/agents-Codex%20%7C%20Claude%20%7C%20Gemini%20%7C%20Cursor-111827?style=flat-square">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-111827?style=flat-square">
</p>

<p align="center">
  <a href="./assets/viberaven-studio-demo.mp4">
    <img src="./assets/viberaven-studio-demo.gif" alt="VibeRaven Studio cockpit UI with agent chat, provider board, release versions, access controls, and proof actions">
  </a>
</p>

<p align="center">
  <a href="./assets/viberaven-studio-demo.mp4"><strong>Open the full-quality MP4 demo</strong></a>
</p>

VibeRaven is the **VibeRaven Production Proof Pack** plus a local Studio cockpit for AI-built apps. Use it while building, fixing, reviewing releases, or preparing a launch when an agent needs provider context, release context, approval-aware chat, and evidence before it claims the work is ready.

```bash
npx -y viberaven
```

The public repo is the agent discovery and installation surface: plugin-style metadata, portable slash commands, production proof skills, MCP notes, and AI-readable docs.

## Why It Exists

AI coding agents are good at patching code and bad at knowing what they cannot prove. VibeRaven gives agents a contract:

- say what evidence was found;
- say what evidence is missing;
- separate repo-code fixes from provider dashboard work;
- keep release and version context visible;
- ask for approval before risky local changes.

That matters during feature work, auth fixes, billing changes, deploy debugging, release comparison, post-launch drift, and production readiness.

## Start The Studio

Open the local cockpit from any project:

```bash
npx -y viberaven
```

Studio gives you agentic chat, draggable providers, draggable versions/releases, provider MCP context, terminal output, diff context, access-mode control, and CLI-agent connection checks. Installed is not the same as connected; test the agent connection before real chat control.

## Install Agent Guidance

Install bounded VibeRaven guidance for Codex, Claude Code, Cursor, Copilot, Gemini, and related agents:

```bash
npx -y viberaven init --agents all
```

Preview without writing files:

```bash
npx -y viberaven init --agents all --dry-run
```

The installer writes rules into supported agent instruction files, including `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, Cursor rules, Copilot instructions, and `.viberaven` context files.

## Plugin-Style Pack

VibeRaven ships as a portable skill/plugin-style pack:

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

Browse the skill library in [docs/production-skills.md](./docs/production-skills.md).

| Skill | What It Forces The Agent To Prove |
| --- | --- |
| `supabase-rls-proof` | RLS and database access are not guessed from app code alone. |
| `stripe-webhook-proof` | Billing routes, signature checks, and entitlement effects are separated from Stripe dashboard state. |
| `vercel-env-drift` | Local, preview, and production env assumptions are checked before deploy claims. |
| `clerk-callback-drift` | Auth callback and session behavior are treated as provider-boundary work. |
| `sentry-proof-of-signal` | Monitoring is not called ready until real signal or explicit missing evidence is documented. |
| `release-diff-risk` | Release/version changes are compared before a risky fix is waved through. |
| `provider-human-actions` | Dashboard-only work is not falsely marked fixed by repo edits. |
| `launch-receipts` | Final readiness claims include receipts, gaps, and next actions. |
| `do-not-guess-production` | Agents must say unknown when they lack production evidence. |

## Install As A skills.sh Skill

```bash
npx -y skills add ohad6k/VibeRaven --skill viberaven
```

## MCP

VibeRaven can be exposed to MCP-aware agents:

```json
{ "viberaven": { "command": "npx", "args": ["-y", "viberaven", "--mcp"] } }
```

Use MCP output as provider and readiness context for Studio-aware agents. The repo also keeps MCP registry metadata in [docs/mcp-registry-submission.md](./docs/mcp-registry-submission.md) so maintainers can verify the public MCP discovery surface alongside npm and skills.sh metadata.

## Agent-Ready Starter Template

[examples/nextjs-supabase-vercel-production-ready-template](./examples/nextjs-supabase-vercel-production-ready-template/) includes agent rules and `viberaven:*` scripts for Next.js + Supabase + Vercel.

## Machine-Readable Docs

- [llms-full.txt](https://viberaven.dev/llms-full.txt)
- [llms.txt](./llms.txt)
- [skills.json](https://viberaven.dev/skills.json)
- [skills.sh.json](./skills.sh.json)
- [Production Protocol guide](https://viberaven.dev/viberaven-production-protocol-ai-built-apps.md)
- [Example proof artifacts](./examples/proof/)

## Legacy Compatibility

Older VibeRaven docs and compatibility tools may mention agent-mode scans, task lists, gate results, PRP resources, or scan-derived action manifests. Treat that language as compatibility context, not the main public product surface.

The current default is the Studio:

```bash
npx -y viberaven
```

Normal git push is not gated. VibeRaven language about readiness is about production-change confidence, release review, provider-aware evidence, and agent boundaries, not blocking ordinary repository work.

## Links

- Website: [viberaven.dev](https://viberaven.dev)
- npm: [viberaven](https://www.npmjs.com/package/viberaven)
- Issues: [ohad6k/VibeRaven/issues](https://github.com/ohad6k/VibeRaven/issues)
- Public discovery repo: [ohad6k/VibeRaven](https://github.com/ohad6k/VibeRaven)

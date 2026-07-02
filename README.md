<div align="center">
  <img src="./assets/raven-mascot.png" alt="VibeRaven raven mascot" width="150" />
  <h1>VibeRaven</h1>
  <p><strong>Your AI agent builds it. VibeRaven controls it.</strong></p>
  <p>
    <a href="https://www.npmjs.com/package/viberaven"><img src="https://img.shields.io/npm/v/viberaven?color=8b5cf6&label=npm" alt="npm version" /></a>
    <a href="https://www.npmjs.com/package/viberaven"><img src="https://img.shields.io/npm/dm/viberaven?color=8b5cf6&label=downloads" alt="npm downloads" /></a>
    <a href="https://github.com/ohad6k/VibeRaven/stargazers"><img src="https://img.shields.io/github/stars/ohad6k/VibeRaven?style=flat&color=8b5cf6&label=stars" alt="GitHub stars" /></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-8b5cf6" alt="MIT license" /></a>
    <a href="https://skills.sh"><img src="https://img.shields.io/badge/skills.sh-6--skill_pack-34d399" alt="skills.sh pack" /></a>
    <a href="https://discord.gg/ZAJvazz63Y"><img src="https://img.shields.io/badge/Discord-join-5865F2?logo=discord&logoColor=white" alt="Join the Discord" /></a>
    <a href="https://x.com/VibeRavenStatio"><img src="https://img.shields.io/badge/X-follow-000000?logo=x&logoColor=white" alt="Follow on X" /></a>
  </p>
  <p>
    <a href="https://viberaven.dev">Website</a> ·
    <a href="#your-first-5-minutes">Quickstart</a> ·
    <a href="#agent-skills">Agent skills</a> ·
    <a href="https://github.com/ohad6k/VibeRaven/releases">Releases</a> ·
    <a href="https://github.com/ohad6k/VibeRaven/discussions">Discussions</a>
  </p>
</div>

VibeRaven is the open-source cockpit for AI coding agents. Agents write code fast, but they patch blind. VibeRaven maps your product in seconds: releases, providers, and launch risks, ready to drag into your agent's next prompt.

```bash
npx -y viberaven
```

![VibeRaven Studio: your product mapped in seconds](./assets/viberaven-studio-demo.gif)

The Studio opens in your browser and works entirely on your machine: it detects your stack, finds your providers, puts your git releases on a timeline, and gives you a "can I ship?" verdict from offline checks. No login, no API key, no telemetry.

## Your first 5 minutes

1. **Run it.** `npx -y viberaven` in your project folder. The Studio opens in your browser and scans your repo offline.
2. **Read your verdict.** The gate chip and Launch Signals show exactly what blocks launch, ranked. Click any signal, then click **Fix** to hand it to your agent.
3. **Connect your coding agent.** Pick Codex, Claude Code, or Gemini CLI in the chat panel, hit **Test connection**, and choose how much access it gets (`ask`, `approve`, or `full`).
4. **Open the Architecture map.** Pages, API, data, modules, and providers as a live draggable map. Weak boundaries glow red. Click one and press a plain-English action like *"Protect user data (RLS)"* or *"Fix slow queries"*.
5. **Open the Worktree.** Your branches as a real tree. Uncommitted mess? One tap: *Commit with agent*. Branch ready? *Review* explains it in plain language and *Merge* does it safely.
6. **Give your agent the skills.** Install the six-skill pack and the plugin so Codex, Claude Code, and Gemini follow the same senior-engineer loop everywhere:

   ```bash
   npx -y skills add ohad6k/VibeRaven --skill viberaven   # skills.sh pack
   npx -y viberaven init --agents all                     # agent rules in-repo
   ```

Everything the agent needs is also written to `.viberaven/` as markdown and JSON, readable by any tool and versioned by git.

## What the Studio gives you

| Capability | What it does |
| --- | --- |
| **Agent chat on your repo** | Drive Codex, Claude Code, or Gemini CLI from one cockpit, with connection health and live terminal output. |
| **Access modes** | `ask`, `approve`, or `full`. The mode changes the real agent command it runs, not just the UI copy. |
| **Context you can drag** | Drop a release, a provider card, or production memory into agent chat, so the agent patches with your product's real state instead of guessing. |
| **Versions & releases** | Release diffs, tags, changelogs, and "what changed since the last working release" in plain English. |
| **Providers via MCP** | Connect Supabase, Vercel, and Stripe. Provider status flows into agent prompts, and provider proof stays separate from repo-code fixes. |

## The terminal twin: `viberaven check`

For agents and CI, the same verdict as one command:

```bash
npx -y viberaven check
```

```text
viberaven check · ~/my-app

🔴 RLS disabled on public tables  (rls_profiles)
🟡 Service-role key referenced in client bundle  (service_role_client)
⚪ No error monitoring wired  (monitoring_missing)

Verdict: ❌ 1 blocker, 1 warning · score 62
Fix: viberaven fix · Details: .viberaven/agent-tasklist.md
```

One line per finding, `file:line` evidence in the artifacts, exit code `1` on blockers. Then:

```bash
npx -y viberaven fix            # list gaps with safe automatic recipes
npx -y viberaven fix --gap <id> # apply one recipe
npx -y viberaven --strict       # final gate before deploy or CI
```

All results land in `.viberaven/` as markdown and JSON on disk (`agent-tasklist.md`, `gate-result.json`, `context-map.json`), so any agent and your git history can read them.

## Install for AI agents

Make agents use release and provider context before they patch the repo:

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
- `.cursor/rules/viberaven-core.mdc` (plus scoped Supabase, deploy, and payments rules)
- `.github/copilot-instructions.md`
- `.viberaven/agent-context.md`, `.viberaven/mission-map.md`

The rules teach the loop: `check`, read `.viberaven/`, fix one gap, then `check` again until `gate.status === "clear"`.

## Agent skills

Six [skills.sh](https://skills.sh) skills route agents through architecture questions, version evidence, and launch proof:

| Skill | Job |
| --- | --- |
| `viberaven` | The router: local check/fix loop, Studio, and MCP context. |
| `architecture-context` | Ask the missing product questions before any edit. |
| `architecture-plan` | Turn answers plus repo evidence into a workstream plan. |
| `what-broke` | Find which version broke the app before patching. |
| `production-context` | Keep compact production memory in `.viberaven/production-context.md`. |
| `go-live` | Local app to GitHub to Vercel, with live-URL proof. |

```bash
npx -y skills add ohad6k/VibeRaven --skill viberaven
```

See [agent-skills/](./agent-skills/) for the full pack.

This repo also works as an agent **plugin**: `plugin.yaml`, `.claude-plugin/`, `.codex-plugin/`, and `gemini-extension.json` expose the six skills plus `/viberaven-work`, `/viberaven-help`, `/viberaven-production-context`, and `/viberaven-launch` commands to Claude Code, Codex, and Gemini CLI.

## MCP

VibeRaven is listed in the MCP registry for agents that prefer tools over terminal commands:

```json
{ "viberaven": { "command": "npx", "args": ["-y", "viberaven", "--mcp"] } }
```

Key tools: `viberaven_check_readiness` (runs the local check), `viberaven_heal_apply`, `viberaven_verify`, `viberaven_audit`, `viberaven_provider_verify`, and `viberaven_validate_npm_package` (run it before adding npm dependencies).

## Vercel + Supabase

```bash
npx -y viberaven audit --vercel-supabase
```

Local evidence checks for RLS proof, service-role exposure, and pooler ports before you claim "production ready."

## Philosophy

- **Local-first.** The CLI and Studio run on your machine. No login, no API key, no telemetry, no scan quota.
- **Markdown on disk.** All context lives in `.viberaven/` as plain files that your agent and your git history can read.
- **Evidence over vibes.** Findings point at repo evidence. Provider dashboard state is never claimed from repo edits alone.
- **Non-destructive.** Fix recipes are guarded, cleanup is plan-only, and nothing is pushed or deployed for you.

## Contributing

Contributions are welcome, and most of them need no private source access:

- Pick up a [good first issue](https://github.com/ohad6k/VibeRaven/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22): docs, provider fixtures, examples, and translations.
- Share ideas or questions in [Discussions](https://github.com/ohad6k/VibeRaven/discussions).
- Join the [Discord](https://discord.gg/ZAJvazz63Y) to talk to the maintainer directly.

## Resources

- Agent-ready starter template: [examples/nextjs-supabase-vercel-production-ready-template](./examples/nextjs-supabase-vercel-production-ready-template/)
- Machine-readable docs: [llms.txt](./llms.txt) · [llms-full.txt](https://viberaven.dev/llms-full.txt) · [skills.json](https://viberaven.dev/skills.json) · [skills.sh.json](./skills.sh.json)
- Example proof artifacts: [examples/proof/](./examples/proof/)
- Website: [viberaven.dev](https://viberaven.dev) · npm: [viberaven](https://www.npmjs.com/package/viberaven) · Issues: [ohad6k/VibeRaven/issues](https://github.com/ohad6k/VibeRaven/issues)

## License

[MIT](./LICENSE). Current public release: `viberaven@1.3.5`.

If VibeRaven helps you ship, star the repo so other AI app builders can find it. Use **Watch → Custom → Releases** for release notifications.

> This public repo is the agent discovery and installation surface. Product source development happens in a private repository.

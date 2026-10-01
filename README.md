<div align="center">
  <img src="./assets/banner.png" alt="VibeRaven: AI got your app to demo. VibeRaven gets it to production. The production protocol for AI-built apps. Open source, local-first, MIT." width="100%" />

  <p>
    <a href="https://viberaven.dev"><img src="https://img.shields.io/badge/Website-viberaven.dev-e8c15a?style=for-the-badge&logoColor=black" height="40" alt="Website" /></a>
    &nbsp;
    <a href="https://www.npmjs.com/package/viberaven"><img src="https://img.shields.io/badge/npm-viberaven-cb3837?style=for-the-badge&logo=npm&logoColor=white" height="40" alt="Install from npm" /></a>
    &nbsp;
    <a href="https://discord.gg/ZAJvazz63Y"><img src="https://img.shields.io/badge/Join-Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" height="40" alt="Join the Discord" /></a>
  </p>

  <p>
    <a href="https://www.npmjs.com/package/viberaven"><img src="https://img.shields.io/npm/v/viberaven?color=e8c15a&label=npm" alt="npm version" /></a>
    <a href="https://www.npmjs.com/package/viberaven"><img src="https://img.shields.io/npm/dm/viberaven?color=e8c15a&label=downloads" alt="npm downloads" /></a>
    <a href="https://github.com/ohad6k/VibeRaven/stargazers"><img src="https://img.shields.io/github/stars/ohad6k/VibeRaven?style=flat&color=e8c15a&label=stars" alt="GitHub stars" /></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-e8c15a" alt="MIT license" /></a>
    <a href="https://skills.sh"><img src="https://img.shields.io/badge/skills.sh-6--skill_pack-34d399" alt="skills.sh pack" /></a>
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

VibeRaven is an open-source local cockpit for AI-built apps. Run `npx -y viberaven@1.5.3` in your repo and it connects your coding agent (Claude Code, Codex, Gemini) to the context it patches blind without, your architecture, providers, and releases, then lists the launch gaps it finds in your repo (auth, RLS, webhooks, deploy) before real users hit them. It is advice, not a gate: you decide when to ship. Local-first, no login.

```bash
npx -y viberaven@1.5.3
```

The Studio opens in your browser and runs on your machine: it detects your stack, finds your providers, shows your release history and diffs, and lists the launch gaps its offline checks find in your repo, with a readiness score. You decide when to ship. The local checks need no login and no API key, and there is no telemetry. "Run full check" is optional: it is a hosted check that needs a VibeRaven account and uses its allowance (see [Philosophy](#philosophy)).

## Your first 5 minutes

1. **Run it.** `npx -y viberaven@1.5.3` in your project folder. The Studio opens in your browser and scans your repo offline.
2. **Read your verdict.** The Studio shows a readiness score out of 100 and the blockers it found in your repo files. Pick one and hand it to your agent to fix.
3. **Connect your coding agent.** Pick Codex, Claude Code, or Gemini CLI in the chat panel, hit **Test connection**, and choose how much access it gets (`ask`, `approve`, or `full`).
4. **Give your agent the skills.** Install the six-skill pack and the plugin so Codex, Claude Code, and Gemini follow the same senior-engineer loop everywhere:

   ```bash
   npx -y skills@1.7.0 add ohad6k/VibeRaven --skill viberaven   # skills.sh pack
   npx -y viberaven@1.5.3 init --agents all                     # agent rules in-repo
   ```

Everything the agent needs is also written to `.viberaven/` as markdown and JSON, readable by any tool and versioned by git.

## What the Studio gives you

| Capability | What it does |
| --- | --- |
| **Agent chat on your repo** | Drive Codex, Claude Code, or Gemini CLI from one cockpit, with connection health and live terminal output. |
| **Access modes** | `ask`, `approve`, or `full`. The mode changes the real agent command it runs, not just the UI copy. |
| **Versions & releases** | Release diffs, tags, changelogs, and "what changed since the last working release" in plain English. |
| **Providers via MCP** | Connect Supabase, Vercel, and Stripe. Provider status flows into agent prompts, and provider proof stays separate from repo-code fixes. |

## The terminal twin: `viberaven check`

For agents and CI, the same verdict as one command:

```bash
npx -y viberaven@1.5.3 check
```

Real VibeRaven 1.5.3 output on a small Next.js + Supabase app (paths shortened):

```text
viberaven check · ~/my-app

🔴 No RLS policy proof in migrations  (rls_disabled)
   1 public table without row level security: public.profiles (supabase/migrations/0001_init.sql:1). Anyone holding the anon key your frontend ships can read and change those rows through the Data API.
🔴 Service role key in a client-prefixed env variable  (service_role_key_in_client_env)
   .env.example:3: NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY names a service role or secret key under the NEXT_PUBLIC_ prefix. NEXT_PUBLIC_* variables are exposed to client code by Next.js, so anyone who loads the app can read it and skip RLS entirely. Rename it without the prefix, read it only in server code, and rotate the key.
⚪ No error monitoring detected  (missing_monitoring)
   No Sentry/PostHog (or similar) instrumentation was found. Production errors will only surface when users complain.

Verdict: ❌ 2 blockers, 0 warnings · score 55
Fix: viberaven fix · Details: ~/my-app/.viberaven/agent-tasklist.md
```

Each finding names its gap ID, and most name the file that caused it. The command exits `1` when there are blockers. Then:

```bash
npx -y viberaven@1.5.3 fix            # list gaps with safe automatic recipes
npx -y viberaven@1.5.3 fix --gap <id> # apply one recipe
npx -y viberaven@1.5.3 --strict       # the verdict as an exit code for CI, if you want one (exit 1 on not_clear; warnings exit 0)
```

All results land in `.viberaven/` as markdown and JSON on disk (`agent-tasklist.md`, `gate-result.json`, `context-map.json`), so any agent and your git history can read them.

## Install for AI agents

Make agents use release and provider context before they patch the repo:

```bash
npx -y viberaven@1.5.3 init --agents all
npx -y viberaven@1.5.3 doctor --agents
```

Preview without writing files:

```bash
npx -y viberaven@1.5.3 init --agents all --dry-run
```

This installs bounded rules (`<!-- VIBERAVEN:START -->` ... `<!-- VIBERAVEN:END -->`) into:

- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`
- `.cursor/rules/viberaven-core.mdc` (plus scoped Supabase, deploy, and payments rules)
- `.github/copilot-instructions.md`
- `.viberaven/agent-context.md`, `.viberaven/mission-map.md`

The rules say when a pass helps (an AI-built app on Vercel + Supabase, before launch or handoff, or after a migration or policy change) and teach the loop: `check`, read `.viberaven/`, fix one gap, then `check` again once per batch of fixes. They are advice, not a gate: the user decides when to ship.

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
npx -y skills@1.7.0 add ohad6k/VibeRaven --skill viberaven
```

See [agent-skills/](./agent-skills/) for the full pack.

This repo also works as an agent **plugin**: `plugin.yaml`, `.claude-plugin/`, `.codex-plugin/`, and `gemini-extension.json` expose the six skills plus `/viberaven-work`, `/viberaven-help`, `/viberaven-production-context`, and `/viberaven-launch` commands to Claude Code, Codex, and Gemini CLI.

For a smaller install, [plugins/viberaven](./plugins/viberaven/) is a standalone plugin for Claude Code and Cursor: one skill that says when a pre-launch pass fits a Vercel + Supabase app, plus the MCP server pinned to `@viberaven/mcp@1.5.3`.

## MCP

VibeRaven is listed in the MCP registry for agents that prefer tools over terminal commands:

```json
{ "viberaven": { "command": "npx", "args": ["-y", "@viberaven/mcp@1.5.3"] } }
```

Key tools: `viberaven_check_readiness` (runs the local check), `viberaven_heal_apply`, `viberaven_verify`, `viberaven_audit`, `viberaven_gate_result`, and `viberaven_validate_npm_package` (run it before adding npm dependencies).

## Vercel + Supabase

```bash
npx -y viberaven@1.5.3 audit --vercel-supabase
```

Repository evidence for RLS, service-role exposure, and pooler ports. It reads repo files only, so it cannot show which RLS policies are live in your Supabase project.

## Philosophy

- **Local-first.** The CLI and Studio run on your machine. No login, no API key, no telemetry. Local checks in the CLI and Studio are free with no quota. Hosted full checks (the Studio's "Run full check" from 1.5.0, and the VS Code extension) use your account's allowance: 2 on Free, 50 a month on [Pro](https://viberaven.dev/pricing).
- **Markdown on disk.** All context lives in `.viberaven/` as plain files that your agent and your git history can read.
- **Evidence over vibes.** Findings point at repo evidence. Provider dashboard state is never claimed from repo edits alone.
- **Non-destructive.** Fix recipes are guarded, cleanup is plan-only, and nothing is pushed or deployed for you.

## Contributing

Contributions are welcome, and most of them need no private source access:

- Read the [contribution guide](./CONTRIBUTING.md) for repo structure, PR expectations, and local checks.
- Pick up a [good first issue](https://github.com/ohad6k/VibeRaven/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22): docs, provider fixtures, examples, and translations.
- Share ideas or questions in [Discussions](https://github.com/ohad6k/VibeRaven/discussions).
- Join the [Discord](https://discord.gg/ZAJvazz63Y) to talk to the maintainer directly.

## Resources

- Agent-ready starter template: [examples/nextjs-supabase-vercel-production-ready-template](./examples/nextjs-supabase-vercel-production-ready-template/)
- Machine-readable docs: [llms.txt](./llms.txt) · [llms-full.txt](https://viberaven.dev/llms-full.txt) · [skills.json](https://viberaven.dev/skills.json) · [skills.sh.json](./skills.sh.json)
- Example proof artifacts: [examples/proof/](./examples/proof/)
- Website: [viberaven.dev](https://viberaven.dev) · npm: [viberaven](https://www.npmjs.com/package/viberaven) · Issues: [ohad6k/VibeRaven/issues](https://github.com/ohad6k/VibeRaven/issues)

## License

[MIT](./LICENSE). Current public release: `viberaven@1.5.3`.

Built by Ohad Krispin ([github.com/ohad6k](https://github.com/ohad6k)).

If VibeRaven helps you ship, star the repo so other AI app builders can find it. Use **Watch → Custom → Releases** for release notifications.

> This public repo is the agent discovery and installation surface. Product source development happens in a private repository.

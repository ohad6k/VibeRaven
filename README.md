<p align="center">
  <img src="./assets/raven-mascot.png" width="170" alt="VibeRaven raven mascot">
</p>

<h1 align="center">VibeRaven</h1>

<p align="center">
  <strong>Stop your agent from patching blind.</strong>
</p>

<p align="center">
  <a href="https://github.com/ohad6k/VibeRaven/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/ohad6k/VibeRaven?style=flat-square&label=stars"></a>
  <a href="https://www.npmjs.com/package/viberaven"><img alt="npm version" src="https://img.shields.io/npm/v/viberaven?style=flat-square&label=npm"></a>
  <a href="https://www.npmjs.com/package/viberaven"><img alt="npm downloads" src="https://img.shields.io/npm/dm/viberaven?style=flat-square&label=npm%20downloads"></a>
  <img alt="skills" src="https://img.shields.io/badge/skills-5-7c3aed?style=flat-square">
  <img alt="works with Codex Claude Gemini Cursor" src="https://img.shields.io/badge/agents-Codex%20%7C%20Claude%20%7C%20Gemini%20%7C%20Cursor-111827?style=flat-square">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-111827?style=flat-square">
</p>

<p align="center">
  <a href="./assets/viberaven-studio-demo.mp4">
    <img src="./assets/viberaven-studio-demo.gif" alt="VibeRaven Studio cockpit UI with agent chat, provider board, release versions, access controls, and production actions">
  </a>
</p>

<p align="center">
  <a href="./assets/viberaven-studio-demo.mp4"><strong>Open the full-quality MP4 demo</strong></a>
</p>

Repo context tells the agent what exists. Production context tells it what is dangerous.

VibeRaven gives AI-built apps a **plugin/skills pack**, MCP context, and local Studio so agents can work like senior engineers before they patch: map the architecture, inspect version/release drift, respect provider boundaries, and use MCP/Studio context when repo code is not enough.

The skill count is not the product. The flow is:

```text
architecture -> version/release context -> provider boundary -> MCP/Studio context -> smallest safe fix
```

## AI Agent Quick Read

If you are an AI coding agent, use this order:

1. Architecture: start with `architecture-context` for product path, system boundary, missing questions, and plan.
2. Version control: use `what-broke` when behavior changed, a version broke, or release drift matters.
3. Production memory: use `production-context` to keep `.viberaven/production-context.md` small, current, and evidence-linked.
4. Providers + MCP: use `viberaven` when Studio, MCP/provider context, releases, diffs, connected agents, or access modes matter.
5. Shipping proof: use `go-live` only when the user wants push/deploy/live proof.

Output before editing:

```text
Architecture boundary:
- ...

Questions/blockers:
- ... or none

Plan:
- ...

VibeRaven skill/context:
- ...
```

## Plugin + Skills

Use the skills when you want the agent behavior change immediately. `architecture-context` is the startup discipline: the agent maps the app boundary, asks only the missing questions, picks the suited VibeRaven skill, then plans. Use the Studio when you want the full cockpit around releases, providers, diffs, chat, MCP context, and access modes.

Before VibeRaven, the agent sees a green check and edits the nearest file. With VibeRaven, it first builds the release and architecture context a senior engineer would ask for.

<table>
  <tr>
    <th align="left">Without VibeRaven</th>
    <th align="left">With VibeRaven</th>
  </tr>
  <tr>
    <td valign="top">
      <pre><code>tests pass
HTTP 200 OK

agent guess:
edit auth middleware
ship it</code></pre>
    </td>
    <td valign="top">
      <pre><code>v1.2.3 -> v1.2.4
auth callback changed
Supabase RLS touched
preview env added

architecture map:
auth -> provider callback -> session -> RLS

next action:
repo fix + provider proof</code></pre>
    </td>
  </tr>
</table>

<p align="center">
  <img src="./assets/viberaven-real-terminal-proof.png" alt="Real Windows Terminal proof comparing agent behavior without VibeRaven versus with VibeRaven architecture context">
</p>

Real terminal proof:

```bash
node examples/proof/live-evidence-demo.mjs --show
```

What it does:

- creates a temporary repo with tags `v1.2.3` and `v1.2.4`
- changes auth callback code, preview env, and Supabase RLS migration files
- runs real `git diff` / `git log` commands
- starts a local HTTP server and proves the app still returns `200 OK`
- maps the affected auth, data, deploy, and fix boundaries
- prints the VibeRaven decision boundary: green live check is not enough when provider proof is missing

Example output:

```console
$ git diff --name-only v1.2.3..v1.2.4
.env.example
app/auth/callback.ts
supabase/migrations/002_profile_rls_update.sql

$ node local-live-check.mjs
HTTP 200 OK http://127.0.0.1:<port>/
body: ok

$ viberaven decision
Same app. Same green check. Different decision boundary.
Repo evidence: auth callback changed, Supabase migration touched, preview redirect env added.
Live evidence: app responds 200 OK.
Missing production proof: auth callback dashboard and Supabase RLS provider state are not proven by repo code.

$ viberaven architecture map
Auth boundary: callback route now depends on preview env.
Data boundary: Supabase RLS migration changed the same release.
Deploy boundary: app can still return 200 OK while provider config is wrong.
Fix boundary: repo redirect fallback is code; callback URL and RLS proof are provider actions.

$ viberaven next action
Next action: fix redirect fallback in code, then verify provider callback URL + RLS policy before claiming safe release.
```

Reproducible script: [`examples/proof/live-evidence-demo.mjs`](./examples/proof/live-evidence-demo.mjs). The image above is a real Windows Terminal screenshot of `node examples/proof/live-evidence-demo.mjs --terminal-card`.

```bash
npx -y skills add ohad6k/VibeRaven --skill architecture-context
npx -y skills add ohad6k/VibeRaven --skill production-context
npx -y skills add ohad6k/VibeRaven --skill what-broke
npx -y skills add ohad6k/VibeRaven --skill viberaven
npx -y skills add ohad6k/VibeRaven --skill go-live
```

| Skill | What It Makes The Agent Do |
| --- | --- |
| `architecture-context` | Start real app work like a senior engineer: map product path, architecture boundary, missing questions, and suited VibeRaven skill before editing. |
| `production-context` | Maintain `.viberaven/production-context.md`: architecture boundaries, what changed, why dangerous, what was verified, and what provider/human proof remains. |
| `what-broke` | Use version control as context: compare working/broken releases, ask what changed, map the affected architecture boundary, then fix the smallest repo-code surface the evidence supports. |
| `viberaven` | Use Studio, provider cards, release/version context, architecture context, MCP status, and access modes during real work. This is the provider/MCP cockpit. |
| `go-live` | Push and deploy with build, live URL proof, and clear provider/human boundaries. |

## Architecture Context

Most AI-built apps do not fail because the agent cannot write code. They fail because the agent does not know the architecture it is touching: auth handoffs, database policies, provider dashboards, deploy env, webhook delivery, and the release where behavior changed.

`what-broke` is the fast entry point: it makes the agent ask what changed, map the affected architecture boundary, then move toward the smallest fix.

```text
User:
Login broke after deploy.

Normal agent:
Starts editing middleware.

With VibeRaven:
Stop. What changed?
- last working version: v1.2.3
- changed since then: auth callback route + preview env + Supabase RLS migration
- architecture boundary: login callback -> session -> database policy
- repo-code fix: update redirect fallback
- provider action: verify callback URL and RLS policy outside the repo
```

That is only the first move. VibeRaven should not just explain what broke. It should carry production context into the next safe repo fix, then separate anything that still needs a provider dashboard, MCP tool, or human action.

## Open the Full Studio

```bash
npx -y viberaven
```

The Studio is the cockpit for deeper work: agentic chat, draggable providers, draggable versions/releases, release diffs, provider MCP context, terminal output, CLI-agent connection checks, and access-mode control.

Current npm latest: `viberaven@1.2.4` and `@viberaven/cli@1.2.4`.

If this repo helps, star it so other AI app builders can find production context for agents. Use **Watch -> Custom -> Releases** if you want release notifications.

> VibeRaven public repo is the agent discovery and installation surface. Product source code and service internals live in a private repository.

**Repositories:** Public discovery -> [ohad6k/VibeRaven](https://github.com/ohad6k/VibeRaven) (this repo). Private product development -> `ohad6k/viberaven-dev` (not public).

The local-first boundary matters: the open-source local CLI/UI does not require login and does not use Ohad's OpenAI API key.

## What VibeRaven Adds

- **Version context:** tags, release names, changelogs, PR links, git diffs, rollback notes, and recent deploy history.
- **Production danger context:** provider config drift, migration history, incidents, fragile customer paths, auth/billing/database/deploy boundaries.
- **Fix boundaries:** repo-code fixes are applied or prompted separately from provider dashboard work that needs proof.
- **Agent control:** ask/approve/full access modes for connected Codex, Claude Code, Gemini, and other CLI agents.
- **MCP context:** provider and readiness context can be pulled into the agent without pretending MCP itself is the user-facing feature.

## Install Agent Guidance

Make AI agents carry architecture, release, and provider context before they patch the repo:

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
- `.cursor/rules/viberaven-core.mdc` (+ scoped Supabase, deploy, payments rules)
- `.github/copilot-instructions.md`
- `.viberaven/agent-context.md`, `.viberaven/mission-map.md`

## Non-interactive Artifact Loop

Use this only when written artifacts are needed outside the Studio:

```bash
npx -y viberaven --agent-mode .
npx -y viberaven --verify .
npx -y viberaven --strict
```

Read `.viberaven/prp.json` first, then `.viberaven/gate-result.json` and `.viberaven/context-map.json`. Apply safe repo-code fixes directly when VibeRaven provides a supported heal or MCP action. Respect `batchSize`, verify once per batch, and do not claim production-ready while `decision.status` is `blocked` or `gate.status` is not `clear`.

For Vercel + Supabase local evidence:

```bash
npx -y viberaven audit --vercel-supabase
```

Normal git push is not gated. VibeRaven gate language is about launch/deploy-readiness claims, not ordinary pushes.

## Agent-ready Starter Template

[examples/nextjs-supabase-vercel-production-ready-template](./examples/nextjs-supabase-vercel-production-ready-template/) - agent rules and `viberaven:*` scripts for Next.js + Supabase + Vercel.

## Machine-readable Docs

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

## Get the Product

- Website: [viberaven.dev](https://viberaven.dev)
- npm: [viberaven](https://www.npmjs.com/package/viberaven)
- Issues: [ohad6k/VibeRaven/issues](https://github.com/ohad6k/VibeRaven/issues)

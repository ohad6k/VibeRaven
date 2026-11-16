<img src="https://raw.githubusercontent.com/ohad6k/VibeRaven/main/assets/favicon.svg" alt="VibeRaven" width="40" height="40" />

# VibeRaven

VibeRaven gives AI-built apps production context and checks across Supabase, Vercel, Stripe and the other providers they use, read from the repo, locally, before launch and after a change.

## Two users at once

`race` tests your app’s database with two users at once, on real PostgreSQL, without Docker, and replays exactly what broke. It runs on `@viberaven/sessions`: several real PostgreSQL 18.6 sessions in one PGlite WebAssembly instance.

```sh
npx -y viberaven@1.10.0 race --example
```

Recorded output from the bundled example (elapsed time varies):

```text
At most 2 bookings per event: 60 orders, 24 broken, 0 waiting; 1.495s total
  read committed: 12/20 broken
  repeatable read: 12/20 broken
  serializable: 0/20 broken
First broken order 001101 (read committed); COMMIT A=true, B=true
Replay record is byte-identical, including PostgreSQL protocol bytes.
```

122 of 124 PostgreSQL isolation specs; hidden tests: 199/200 new orders and 1,500/1,500 real-app interleavings, with native PostgreSQL at 100% through the same judge; 80/80 exact replays; 0 leaks between sessions in 60 isolation cases. [Method and limitations](https://github.com/ohad6k/VibeRaven/blob/main/docs/race.md#frozen-engine-proof).

[Engine](https://viberaven.dev/engine) · [Race reference](https://github.com/ohad6k/VibeRaven/blob/main/docs/race.md)

In that first broken order, A inserts, B inserts, A commits, B commits. The
command writes the example in `.viberaven/race-example`, runs it and its exact
replay, then prints one next command to test the bundled guard-row fix.
It works in an empty folder and preserves your repository's migrations.

## Quick start

In your repo, for you or your coding agent:

1. Run `npx -y viberaven@1.10.0 check` to find repository risks before launch.
2. Write `viberaven.race.json` for the rule you changed: setup, two requests and the SQL that must stay true. Run `npx -y viberaven@1.10.0 race` to find what breaks when two users act at once. Start from the [spec template](https://github.com/ohad6k/VibeRaven/blob/main/docs/race.md#explicit-spec).
3. Fix, run `race` again, and replay the reported order to confirm. Keep the test in the repo. Exit 0: no enumerated order breaks the rule. Exit 1: a broken order. Exit 2: incomplete, with the cause. Review generated assumptions and role/claims.

`race` is a free preview in **1.10.0** and needs Node 24+ with JSPI; the CLI enables
the flag itself. `npx -y viberaven@1.10.0 check` is the free repository check (Node 20+).
`npx -y viberaven@1.10.0` opens the local Studio. On Windows PowerShell, use `npx.cmd` if
execution policy blocks `npx`.

[![npm version](https://img.shields.io/npm/v/viberaven?label=npm)](https://www.npmjs.com/package/viberaven) [![License: MIT](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ohad6k/VibeRaven/blob/main/LICENSE)

[Docs](https://viberaven.dev/docs) · [Race guide](https://github.com/ohad6k/VibeRaven/blob/main/docs/race.md) · [Agent setup](https://github.com/ohad6k/VibeRaven/blob/main/AGENTS-HUB.md) · [Changelog](https://github.com/ohad6k/VibeRaven/blob/main/CHANGELOG.md)

## What it found

The synthetic example breaks in 24/60 orders and its selected replay is
byte-identical. The bundled guard-row fix completes 60 orders with zero broken
invariants and real waits in 36 orders. These are offline database scenarios,
not production incidents or whole-app certification. Repeat the
[small test](https://github.com/ohad6k/VibeRaven/tree/main/examples/race-capacity);
read the [method and limits](https://github.com/ohad6k/VibeRaven/blob/main/docs/race.md).

## How it works

1. Read `supabase/migrations` verbatim into a fresh pinned database image.
2. Generate a supported count-limit candidate or load your explicit test spec.
3. Run two independent PostgreSQL sessions inside one PGlite WebAssembly instance.
4. Enumerate bounded statement issue orders and record invariant failures and waits.
5. Replay a selected prefix with the same inputs and verify its failure record bytes.

## Use with your agent

Run the setup command in your app's terminal. Add `--dry-run` first to preview file changes. Then ask the agent to write `viberaven.race.json` for your changed SQL rule, run `npx -y viberaven@1.10.0 race`, fix and rerun.

| Agent | Setup | What it uses |
| --- | --- | --- |
| Claude Code | `npx -y viberaven@1.10.0 init --agents claude` | `CLAUDE.md` and a project skill |
| Codex | `npx -y viberaven@1.10.0 init --agents codex` | `AGENTS.md` and a project skill |
| Cursor | `npx -y viberaven@1.10.0 init --agents cursor` | `.cursor/rules/` guidance |
| ChatGPT | Add `https://viberaven.dev/mcp` in custom MCP app settings, where available | Hosted guides only; no access to your local repo or race runtime |

For local MCP tools, use `npx -y @viberaven/mcp@1.10.0` as a stdio server. Client setup and verification limits are in the [agent hub](https://github.com/ohad6k/VibeRaven/blob/main/AGENTS-HUB.md). Repository manifests do not establish marketplace acceptance. ChatGPT's hosted connection is separate from local CLI control.

Building an agent that answers provider errors? The [AI SDK provider-context example](./examples/ai-sdk-provider-context/) adds `search_guides` and `recent_provider_changes` from the hosted MCP endpoint.

## Local Studio

Open **Race test** to run the local test and replay a broken order.

For an AI-built app, run `npx -y viberaven@1.10.0` to open chat, the provider board, versions, terminal and diffs. Select your installed Codex, Claude Code or Gemini CLI, run **Test connection**, and choose an access mode before using chat. Provider MCP context and version comparisons help the agent work on your repository.

![VibeRaven local Studio](https://raw.githubusercontent.com/ohad6k/VibeRaven/main/assets/studio-3d.png)

## Packages

| Package | Purpose | License |
| --- | --- | --- |
| [`viberaven`](https://www.npmjs.com/package/viberaven) | The `npx` entry; pins the CLI at the same version | MIT |
| [`@viberaven/cli`](https://www.npmjs.com/package/@viberaven/cli) | Studio, repository checks and preview race command | MIT |
| [`@viberaven/mcp`](https://www.npmjs.com/package/@viberaven/mcp) | Local repository tools over MCP stdio | MIT |
| [`@viberaven/sessions`](https://www.npmjs.com/package/@viberaven/sessions) | Independent PostgreSQL sessions and scheduling API | Apache-2.0, with upstream notices |

CLI, MCP and command package: **1.10.0**. Sessions: **0.1.0**, an optional exact CLI dependency. If it was omitted, see the [runtime installation notes](https://github.com/ohad6k/VibeRaven/blob/main/docs/race.md#run-in-your-repository).

## Limitations

- `check` reads repository evidence. It does not establish which policies or settings are live in Supabase or Vercel. A clear result is not a production-readiness certification or a security audit.
- `race` covers supplied SQL, inputs and enumerated statement orders. Complex business rules need explicit specs; review generated assumptions and role/claims. Omitted roles run as `postgres`.
- An incomplete run is not a pass. Replay needs the same migrations, spec, options, runtime and deterministic inputs.
- Cloud Auth, HTTP flows, external I/O and nontransactional effects are outside the offline test. Run only SQL you trust; the runtime is not a security sandbox.
- Selected tests do not establish universal PostgreSQL or extension compatibility, or better bug finding than a plain coding agent.

## Contribute and report

This public repository is a curated distribution of docs, skills, plugin metadata and examples. The npm packages contain the executable CLI and engine. See [Contributing](https://github.com/ohad6k/VibeRaven/blob/main/CONTRIBUTING.md) for the repository map and reproduction requirements.

[Issues](https://github.com/ohad6k/VibeRaven/issues) · [Security reporting](https://github.com/ohad6k/VibeRaven/blob/main/SECURITY.md) · [Code of conduct](https://github.com/ohad6k/VibeRaven/blob/main/CODE_OF_CONDUCT.md) · [MIT license](https://github.com/ohad6k/VibeRaven/blob/main/LICENSE)

## Third-party notices

Each npm package includes `THIRD_PARTY_NOTICES` with the licenses and attributions
for its bundled libraries. The [package notices](https://github.com/ohad6k/VibeRaven/tree/main/notices) include the engine, CLI, MCP and command wrapper.

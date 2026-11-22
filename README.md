<p align="center">
  <a href="https://viberaven.dev"><img src="./assets/readme-banner.jpg" alt="VibeRaven: the raven mark and the PostgreSQL elephant. Two users at once, on real PostgreSQL." width="100%" /></a>
</p>

<p align="center">
  <b>Catch double bookings before release</b><br />
  VibeRaven tests overlapping PostgreSQL writes and shows what committed. It also checks Supabase migration files for missing RLS and Data API grants.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/viberaven"><img src="https://img.shields.io/npm/v/viberaven?label=npm&color=111" alt="npm version" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-111" alt="MIT license" /></a>
  <a href="https://github.com/ohad6k/VibeRaven/stargazers"><img src="https://img.shields.io/github/stars/ohad6k/VibeRaven?style=social" alt="GitHub stars" /></a>
</p>

<p align="center">
  <a href="https://viberaven.dev">Website</a> ·
  <a href="https://viberaven.dev/engine">Engine</a> ·
  <a href="https://viberaven.dev/connect/mcp">Connect your chat</a> ·
  <a href="https://viberaven.dev/docs">Docs</a> ·
  <a href="https://discord.gg/ZAJvazz63Y">Discord</a>
</p>

## Quick start

### Reproduce a PostgreSQL booking race

Start in an empty folder with Node 24:

```sh
npx -y viberaven@1.12.1 race --example
```

The synthetic event has one seat left. The unguarded booking flow exceeded capacity in **24 of 60 tested statement orders**. The [booking fixture](https://github.com/ohad6k/VibeRaven/tree/de6208df5a777358251fa87e7457ad5989c33922/examples/race-capacity) shows the guard-row fix and how to rerun the assertion.

## Inside your chat

Add `https://viberaven.dev/mcp` as a custom connector in ChatGPT, Claude, Codex, Cursor or Lovable, then ask: "Can two users book the last seat?" [Setup for each agent](https://viberaven.dev/connect/mcp).

## In your repo

```sh
npx -y viberaven@1.12.1 check   # what is risky before launch
npx -y viberaven@1.12.1 race    # what breaks when two users act at once
```

1. `check` reads migrations, client code and env files, and names the file and line for each gap.
2. `race` runs the rule in your `viberaven.race.json`: setup, two requests and the SQL that must stay true. [Spec template](https://github.com/ohad6k/VibeRaven/blob/main/docs/race.md#explicit-spec).
3. Fix, run `race` again, and replay the reported order. Exit 0: no order broke. Exit 1: broken. Exit 2: incomplete.

`race` needs Node 24+ (the CLI enables JSPI). `check` runs on Node 20+.

## Proof

| Frozen-engine check | Result |
| --- | --- |
| PostgreSQL isolation specs | **122/124** |
| Hidden new statement orders | **199/200**, native PostgreSQL 200/200 |
| Hidden real-app interleavings | **1,500/1,500**, native PostgreSQL 1,500/1,500 |
| Byte-equal replays | **80/80** |
| Leaks between sessions | **0** in 60 isolation cases |

[Method and limitations](https://github.com/ohad6k/VibeRaven/blob/main/docs/race.md#frozen-engine-proof)

## How it works

1. Your `supabase/migrations` load verbatim into a fresh, pinned PostgreSQL 18.6.
2. Two independent sessions run in one PGlite WebAssembly instance, with real locks.
3. Bounded statement orders are enumerated and checked against your rule.
4. A broken order replays byte for byte, so a fix can be confirmed.

The engine is [`@viberaven/sessions`](https://www.npmjs.com/package/@viberaven/sessions).

## Agents

| Agent | Setup |
| --- | --- |
| Claude Code | `npx -y viberaven@1.12.1 init --agents claude` |
| Codex | `npx -y viberaven@1.12.1 init --agents codex` |
| Cursor | `npx -y viberaven@1.12.1 init --agents cursor` |
| ChatGPT, Claude, Lovable | Add `https://viberaven.dev/mcp` as a custom connector |

Local MCP tools: `npx -y @viberaven/mcp@1.10.0`. Details in the [agent hub](https://github.com/ohad6k/VibeRaven/blob/main/AGENTS-HUB.md).

Building an agent that answers provider errors? The [AI SDK provider-context example](./examples/ai-sdk-provider-context/) adds `search_guides` and `recent_provider_changes` from the hosted MCP endpoint.

## Local Studio

`npx -y viberaven@1.12.1` opens the local Studio: chat with your coding agent, the provider board, versions and diffs, and a **Race test** tab that runs `race` and replays a broken order.

![VibeRaven local Studio](https://raw.githubusercontent.com/ohad6k/VibeRaven/main/assets/studio-3d.png)

## Packages

| Package | Purpose | License |
| --- | --- | --- |
| [`viberaven`](https://www.npmjs.com/package/viberaven) | The `npx` entry | MIT |
| [`@viberaven/cli`](https://www.npmjs.com/package/@viberaven/cli) | Studio, `check` and `race` | MIT |
| [`@viberaven/mcp`](https://www.npmjs.com/package/@viberaven/mcp) | Local repository tools over MCP stdio | MIT |
| [`@viberaven/sessions`](https://www.npmjs.com/package/@viberaven/sessions) | Several PostgreSQL sessions in one process | Apache-2.0 |

## Limitations

- `check` reads the repository. It does not show which policies are live in Supabase or Vercel, and a clear result is not a security audit.
- `race` covers the SQL, inputs and bounded statement orders you supply. Rules beyond a simple count limit need an explicit spec. Omitted roles run as `postgres`.
- An incomplete run is not a pass. Replay needs the same migrations, spec, options and runtime.
- Cloud Auth, HTTP and external I/O are outside the test. Run only SQL you trust; the engine is not a security sandbox.
- No universal PostgreSQL compatibility, and no advantage over a plain coding agent in bug finding, is claimed.

## License

CLI and MCP: MIT. `@viberaven/sessions`: Apache-2.0, with PostgreSQL and third-party [notices](https://github.com/ohad6k/VibeRaven/tree/main/notices). [Contributing](./CONTRIBUTING.md) · [Security](./SECURITY.md) · [Changelog](./CHANGELOG.md)

<p align="center">
  <a href="https://viberaven.dev"><img src="./assets/readme-banner.jpg" alt="VibeRaven: the raven mark and the PostgreSQL elephant. Two users at once, on real PostgreSQL." width="100%" /></a>
</p>

<p align="center">
  <b>The production layer for AI-built apps.</b><br />
  Checks across Supabase, Vercel and Stripe, and an engine that races every rule in your database on real PostgreSQL, before your users do.
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

The engine inside VibeRaven, on the bundled example:

```sh
npx -y viberaven@1.10.0 race --example
```

```text
At most 2 bookings per event: 60 orders, 24 broken, 0 waiting; 1.495s total
  read committed: 12/20 broken
  repeatable read: 12/20 broken
  serializable: 0/20 broken
First broken order 001101 (read committed); COMMIT A=true, B=true
Replay record is byte-identical, including PostgreSQL protocol bytes.
```

That is the engine inside VibeRaven: `race` tests your app's database with two users at once, on real PostgreSQL, without Docker, and replays exactly what broke. In order 001101, A inserts, B inserts, A commits, B commits: the event ends with 3 bookings out of 2. The bundled fix brings it to 0 broken of 60.

<p align="center"><img src="./assets/race-result.png" alt="npx -y viberaven race --example: two users book the last seat at once. 12 orders broke under read committed, 12 under repeatable read, 0 under serializable: 24 of 60. The broken order replays exactly." width="100%" /></p>

## Inside your chat

Add `https://viberaven.dev/mcp` as a custom connector in ChatGPT, Claude, Codex, Cursor or Lovable, then ask: "Can two users book the last seat?" [Setup for each agent](https://viberaven.dev/connect/mcp).

## In your repo

```sh
npx -y viberaven@1.10.0 check   # what is risky before launch
npx -y viberaven@1.10.0 race    # what breaks when two users act at once
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
| Claude Code | `npx -y viberaven@1.10.0 init --agents claude` |
| Codex | `npx -y viberaven@1.10.0 init --agents codex` |
| Cursor | `npx -y viberaven@1.10.0 init --agents cursor` |
| ChatGPT, Claude, Lovable | Add `https://viberaven.dev/mcp` as a custom connector |

Local MCP tools: `npx -y @viberaven/mcp@1.10.0`. Details in the [agent hub](https://github.com/ohad6k/VibeRaven/blob/main/AGENTS-HUB.md).

Building an agent that answers provider errors? The [AI SDK provider-context example](./examples/ai-sdk-provider-context/) adds `search_guides` and `recent_provider_changes` from the hosted MCP endpoint.

## Local Studio

`npx -y viberaven@1.10.0` opens the local Studio: chat with your coding agent, the provider board, versions and diffs, and a **Race test** tab that runs `race` and replays a broken order.

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

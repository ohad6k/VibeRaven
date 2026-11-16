# Install VibeRaven with your agent

VibeRaven gives AI-built apps production context and checks across Supabase, Vercel, Stripe and the other providers they use, read from the repo, locally, before launch and after a change.

## Two users at once

`race` tests your app’s database on real PostgreSQL 18.6, without Docker, and replays exactly what broke. Start locally with `npx -y viberaven@1.10.0 race --example` (Node 24+ with JSPI).

```text
At most 2 bookings per event: 60 orders, 24 broken, 0 waiting; 1.495s total
First broken order 001101 (read committed); COMMIT A=true, B=true
Replay record is byte-identical, including PostgreSQL protocol bytes.
```

Recorded synthetic example; elapsed time varies. Engine proof: 122 of 124 PostgreSQL isolation specs; hidden tests 199/200 new orders and 1,500/1,500 real-app interleavings, with native PostgreSQL at 100% through the same judge; 80/80 exact replays; 0 leaks between sessions in 60 isolation cases. [Method and limitations](https://github.com/ohad6k/VibeRaven/blob/main/docs/race.md#frozen-engine-proof).

1. `npx -y viberaven@1.10.0 check`: repository risks before launch.
2. Write a reviewed `viberaven.race.json`, then run `npx -y viberaven@1.10.0 race`: two users at once, with the exact order.
3. Fix, run `race` again, and replay the reported order to confirm.

[Engine](https://viberaven.dev/engine) · [Connect your agent](https://viberaven.dev/connect/mcp). Hosted MCP gives SQL/error guidance; race runs locally.


Release 1.10.0 candidate agent hub, prepared locally for publication. Native client routes below retain their stated verification limits. No marketplace submission or acceptance is implied. The terminal fallback remains available.

## Start with the free check

Run in the target repository with Node **20+**:

```sh
npx -y viberaven@1.10.0 check
```

For supported rule writers, preview before writing:

```sh
npx -y viberaven@1.10.0 init --agents all --dry-run
npx -y viberaven@1.10.0 init --agents all
```

`init` writes guidance files. `all` means the clients supported by this CLI's writers; it does not promise a native adapter for every agent below. `check` reads repository evidence and needs no account. These command forms use the locally prepared **1.10.0** candidate. The npm registry's current release may differ until publication. Setup writers are verified in disposable local fixtures; this does not establish a fresh native-client or marketplace install.

## Agent matrix

**CLI fallback** below always means the exact command `npx -y viberaven@1.10.0 check`, run in the agent's repository terminal if it provides one. This is the release command, not a claim of native integration. **Local MCP command** always means `npx -y @viberaven/mcp@1.10.0`, configured as a stdio server in the client. Do not launch it as a one-shot checker.

Client-specific commands from the research are candidates unless current public package metadata also confirms them. No client is marked fresh-install tested here. Marketplace acceptance is unverified throughout.

| Agent | Exact current entry or honest fallback | Files / connection and status |
|---|---|---|
| Claude Code | `/plugin marketplace add ohad6k/VibeRaven`, then `/plugin install viberaven@viberaven-plugins`; CLI fallback | Public marketplace source contains this plugin name. Repo source install, not proof of vendor-directory acceptance. Also supports local MCP configuration. |
| Claude Desktop | Local MCP command in Desktop's local MCP configuration | Use stdio configuration where supported. Hosted connector is a different route. No Claude Code plugin parity assumed. |
| GitHub Copilot | CLI fallback; local MCP command in VS Code MCP settings | `.vscode/mcp.json`; repository instructions in `.github/copilot-instructions.md`. No dedicated Marketplace install claim. |
| ChatGPT | No shell command assumed. Add remote URL `https://viberaven.dev/mcp` through the client's custom MCP app/connector settings where enabled | Public Gemini manifest supplies this URL for read-only guides. Endpoint protocol/auth not smoke-tested here; not a local-repository engine connection or proof of a public app listing. |
| Codex | CLI fallback; inspect `/plugins` for source/plugin options available in that client | Public `.codex-plugin/plugin.json` exists; exact source-install UI/CLI flow and directory listing need a client test. No invented install subcommand. |
| Cursor | CLI fallback; configure local MCP command in `.cursor/mcp.json` | Public `.cursor-plugin/marketplace.json` exists. Research candidate `/add-plugin viberaven` is withheld as a supported install until catalog resolution is verified. |
| Grok Bot | CLI fallback only if the specific product has a repository terminal | Product name is ambiguous. No dedicated adapter, MCP path or install command verified. |
| Antigravity | CLI fallback | Inspect supported repository instructions/skills; no dedicated extension install verified. |
| OpenCode | CLI fallback; local MCP command through `opencode.json` | Native schema/client smoke pending; no VibeRaven plugin claimed. |
| Pi | CLI fallback | Research candidate `pi install git:github.com/ohad6k/VibeRaven` needs Pi package metadata validation. No `@viberaven/skills` npm package assumed. |
| Devin Desktop | CLI fallback in a repository workspace | `AGENTS.md` guidance and vendor MCP settings are candidate routes; workspace/client test pending. |
| Zed | CLI fallback; local MCP command through Zed's MCP settings | No Zed extension or ACP adapter claimed. MCP is distinct from an external agent connection. |
| Gemini CLI | `gemini extensions install https://github.com/ohad6k/VibeRaven`; CLI fallback | Public `gemini-extension.json` provides `AGENTS.md` and hosted guides MCP. Source packaging confirmed; install and gallery acceptance not tested. |
| Cline | CLI fallback; local MCP command through Cline's MCP settings UI | Resolve the settings file location in the installed client. No marketplace listing verified. |
| Kiro | CLI fallback; local MCP command through `.kiro/settings/mcp.json` | Steering/power packaging unverified; no power install claimed. |
| Goose | CLI fallback; local MCP command through Goose's extension configuration | No VibeRaven extension-directory entry verified. |
| Kimi Code | CLI fallback | Research candidate `/plugins install https://github.com/ohad6k/VibeRaven` needs manifest/client validation before being advertised as supported. |
| Kilo Code | CLI fallback; local MCP command through Kilo's MCP settings | No dedicated plugin or Marketplace entry verified. |
| Jules | CLI fallback if its execution workspace supports npm commands | Connect the repository and use its instructions. No native VibeRaven package/MCP install claimed. |

This table covers the research roster; inclusion does not mean equal support. Source: the client roster reviewed for this release. Inclusion does not imply native integration.

Current public packaging checks: [Claude marketplace source](https://raw.githubusercontent.com/ohad6k/VibeRaven/main/.claude-plugin/marketplace.json), [Cursor marketplace source](https://raw.githubusercontent.com/ohad6k/VibeRaven/main/.cursor-plugin/marketplace.json), [Codex manifest](https://raw.githubusercontent.com/ohad6k/VibeRaven/main/.codex-plugin/plugin.json), [Gemini manifest](https://raw.githubusercontent.com/ohad6k/VibeRaven/main/gemini-extension.json). They prove files and names, not successful client installs.

## Local MCP configuration

Use the client's own schema. The common server entry is:

```json
{
  "command": "npx",
  "args": ["-y", "@viberaven/mcp@1.10.0"]
}
```

Claude Desktop and clients using an `mcpServers` object wrap it as:

```json
{
  "mcpServers": {
    "viberaven": {
      "command": "npx",
      "args": ["-y", "@viberaven/mcp@1.10.0"]
    }
  }
}
```

VS Code uses its `servers` schema instead. Do not paste a universal wrapper into every client. Confirm working directory, available tools and file permissions in a disposable repository before calling the setup tested.

Hosted guides at `https://viberaven.dev/mcp` and local repository tools have different scopes. The local CLI candidate provides preview `race` tests through the sessions engine. Connecting MCP alone does not run that CLI command, and no hosted rule-writing workflow is claimed. Account-bound operations require their own tested flow and consent. Agent guidance must not authorize automatic publishing or payments.

## Install support gate

For each native route promoted from candidate to supported, record client version, OS, exact command/config, source commit, package version, install/update/removal outcome, discovered tools and a successful check in a disposable fixture. Link actual marketplace listings only after verification. Keep the terminal fallback available where applicable.

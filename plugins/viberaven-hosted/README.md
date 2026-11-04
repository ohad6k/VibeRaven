# VibeRaven hosted plugin

Use VibeRaven's existing hosted tools from a coding agent to review supplied Supabase migrations, read migration files from a public GitHub repository, or get source-linked provider guidance. The agent can continue the engineering task with the returned findings and coverage limits.

This is an opt-in alternative to the `viberaven` local-MCP plugin in the same catalog. Install the one that fits the task. Adding this option does not replace or update an existing `viberaven` installation. Avoid installing both without a specific need: their review instructions overlap, while their tools and data access differ.

## Claude Code

```text
/plugin marketplace add ohad6k/VibeRaven
/plugin install viberaven-hosted@viberaven-plugins
```

If the marketplace is already installed, refresh it with `/plugin marketplace update viberaven-plugins` before installing the new entry. Check the installed plugin's MCP connection before relying on its tools. A listed plugin alone does not prove the server is connected.

Example task: "Review the Supabase migrations in this public GitHub repository, explain the findings at the checked commit, and help fix any unintended row access." Supply a public repository URL, or paste nonsecret migration text. Preserve the application's intended public reads and test both allowed and denied operations after changes.

## Connection and data

The MCP URL is `https://viberaven.dev/mcp`. This plugin starts no local MCP process and has no hooks. The hosted service discovers its tools at connection time; its inventory can change independently of this package. Queries and supplied input are sent to VibeRaven. Never send credentials or `.env` contents. See the [privacy policy](https://viberaven.dev/privacy).

Hosted migration review is static, bounded by file and byte limits. It cannot see private repositories, dashboard-only configuration or a live database, and does not execute SQL. No findings means only that the available rules found none in the inspected input. Keep the resolved commit and coverage limits with the result. A clear static check does not establish production security.

The supplied skill also describes an optional local check, `npx -y viberaven@1.7.8 check`, when shell access is available and execution is authorized. That separate command downloads an npm package if needed, reads the local project and writes `.viberaven/` reports. Installing this plugin does not run it. Free review and guidance do not require sign-in; optional account or paid workflows remain separate.

## Cursor and verification

The adjacent Cursor manifest and `mcp.json` use the documented plugin layout and hosted URL. Cursor runtime installation has not been verified. The release receipt records the exact Claude validation and installation performed; installation tests do not establish natural tool selection, useful external outcomes or return use.

Version 1.7.8 identifies this native wrapper and its optional local command. It does not publish or upgrade any npm package, and is not an official Claude or Cursor directory endorsement. The older local-MCP plugin remains available at `plugins/viberaven`.

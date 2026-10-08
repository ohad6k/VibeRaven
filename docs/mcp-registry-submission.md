# VibeRaven in the MCP Registry

VibeRaven's MCP server is published in the official MCP Registry.

The release configuration below targets the current package version. Verify the registry publication with the search endpoint before claiming it is live:

- **Registry name:** `io.github.ohad6k/viberaven`
- **Target registry version:** `1.6.7`
- **npm package:** `@viberaven/mcp` version `1.6.7`

Use the stable API's latest-version endpoint, with the slash in the server name
URL-encoded. The search endpoint is another way to inspect the listing:

```bash
curl -sL "https://registry.modelcontextprotocol.io/v0.1/servers/io.github.ohad6k%2Fviberaven/versions/latest"
curl -sL "https://registry.modelcontextprotocol.io/v0.1/servers?search=viberaven&version=latest"
```

## Server

- **Name:** `io.github.ohad6k/viberaven`
- **Description:** Local app readiness checks, provider context, and release verification for AI coding agents.
- **Package:** `@viberaven/mcp`
- **Run:** `npx -y @viberaven/mcp@1.6.7`

It reads the repository and writes results to `.viberaven/`. It does not query the live database. The results are advice, not a gate: the user decides when to ship.

## Config snippet

```json
{
  "viberaven": {
    "command": "npx",
    "args": ["-y", "@viberaven/mcp@1.6.7"]
  }
}
```

## Tools

| Tool | Purpose |
|------|---------|
| `viberaven_check_readiness` | Run the local check; write `.viberaven/agent-tasklist.md` and `.viberaven/gate-result.json` |
| `viberaven_verify` | Re-run the check once per batch of fixes |
| `viberaven_audit` | Local Vercel + Supabase checks from repo files |
| `viberaven_init_rules` | `init --agents all` (use `dryRun: true` to preview) |
| `viberaven_clean_plan` | Non-destructive cleanup plan; deletes nothing |
| `viberaven_strict_gate` | `--strict --json` verdict |
| `viberaven_gate_result` | Fresh local scan, returns the verdict |
| `viberaven_context_map` | Refresh and return `.viberaven/context-map.json` |
| `viberaven_actions` | List action IDs from `.viberaven/actions.json` |
| `viberaven_verify_action` | State of one action ID (`VR-A<number>`) |
| `viberaven_heal_plan` | Non-destructive heal plan for one gap |
| `viberaven_heal_prompt` | Agent prompt that fixes one gap |
| `viberaven_heal_apply` | Apply one supported repo-code heal after `viberaven_heal_plan`; the `rls_disabled` one waits for the user's yes |
| `viberaven_validate_npm_package` | Look up package names on registry.npmjs.org before adding a dependency |

## Docs

- https://viberaven.dev/llms-full.txt
- https://viberaven.dev/mcp.md

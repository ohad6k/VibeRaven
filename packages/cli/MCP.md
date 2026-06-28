# VibeRaven MCP Server

The VibeRaven MCP server exposes the VibeRaven CLI as structured tools for coding agents. It is intentionally thin: the MCP layer calls the public CLI and returns text artifacts that agents can read.

## Install

```json
{
  "mcpServers": {
    "viberaven": {
      "command": "npx",
      "args": ["-y", "@viberaven/mcp@beta"]
    }
  }
}
```

Until the MCP package is published, use the CLI directly:

```bash
npx -y @viberaven/cli@beta scan
```

## Tools

- `viberaven_scan`: scan a repo and write `.viberaven/*` artifacts.
- `viberaven_next`: read the next recommended action as JSON.
- `viberaven_prompt`: return the prompt for a specific gap.
- `viberaven_status`: return account and scan status.
- `viberaven_report`: rebuild `.viberaven/report.html` from the latest scan without consuming scan quota.

## Safety

The MCP server does not ask models to infer production state from memory. It always calls the CLI and returns repo-grounded output. Dashboard-only tasks remain manual unless a future provider-specific integration proves them.

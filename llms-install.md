# VibeRaven MCP setup

Use the hosted server for submitted Supabase migration SQL, supported public GitHub migration trees, and source-linked provider guidance. Use the stdio server for tools that need local repository files.

## Cline

For the hosted server, add this entry to the `mcpServers` object in Cline's MCP settings:

```json
{
  "mcpServers": {
    "viberaven": {
      "type": "streamableHttp",
      "url": "https://viberaven.dev/mcp"
    }
  }
}
```

For the local server, use Node.js 20 or later and this entry instead:

```json
{
  "mcpServers": {
    "viberaven": {
      "command": "npx",
      "args": ["-y", "@viberaven/mcp@latest"]
    }
  }
}
```

Use `npx.cmd` if the Windows client cannot resolve `npx`. Keep the client's tool approval defaults. Verify tool discovery, then ask for a launch checklist for a Next.js app on Vercel with Supabase. For a migration review, supply authorized, redacted SQL or a supported public repository URL. See [tool scopes and privacy](https://viberaven.dev/mcp.md).

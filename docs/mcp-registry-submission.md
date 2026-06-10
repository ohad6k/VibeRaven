# MCP Registry submission (Tier 0 - active)

VibeRaven is published in the official MCP Registry.

Verified 2026-06-10:

- **Registry name:** `io.github.ohad6k/viberaven`
- **Registry status:** `active`
- **Latest registry version:** `1.0.2`
- **npm package:** `@viberaven/mcp@1.0.2`

The direct `/v0/servers/io.github.ohad6k/viberaven` path can return 404 because
the public lookup path is the search endpoint. Verify with:

```powershell
Invoke-WebRequest -Uri "https://registry.modelcontextprotocol.io/v0/servers?search=viberaven" -UseBasicParsing
```

## Server

- **Name:** `io.github.ohad6k/viberaven`
- **Description:** Production-readiness gate for AI-built apps. Check readiness, heal repo gaps, verify in batches, audit Vercel/Supabase evidence.
- **Package:** `@viberaven/mcp`
- **Install:** `npx -y @viberaven/mcp@latest`

## Config snippet

```json
{
  "viberaven": {
    "command": "npx",
    "args": ["-y", "@viberaven/mcp@latest"]
  }
}
```

## Tools

| Tool | Purpose |
|------|---------|
| `viberaven_check_readiness` | Run agent-mode scan; write tasklist + gate-result |
| `viberaven_heal_apply` | Apply one supported repo-code heal |
| `viberaven_verify` | Verify after a heal batch |
| `viberaven_audit` | Vercel + Supabase local audit |
| `viberaven_init_rules` | `init --agents all` |
| `viberaven_strict_gate` | Strict gate JSON |
| `viberaven_gate_result` | Read gate-result |
| `viberaven_context_map` | Refresh context-map |
| `viberaven_clean_plan` | Non-destructive cleanup plan |

## Docs

- https://viberaven.dev/llms-full.txt
- https://viberaven.dev/mcp.md

## Census (Tier 1)

```bash
gh search code "VIBERAVEN:START" --limit 100
gh search code "viberaven --agent-mode" --limit 100
```

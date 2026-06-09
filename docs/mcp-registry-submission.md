# MCP Registry submission (Tier 0 — filed)

Use this metadata when submitting VibeRaven to the official MCP Registry.

## Server

- **Name:** `viberaven`
- **Description:** Production-readiness gate for AI-built apps. Check readiness, heal repo gaps, verify in batches, audit Vercel/Supabase evidence.
- **Install:** `npx -y viberaven --mcp`

## Config snippet

```json
{
  "viberaven": {
    "command": "npx",
    "args": ["-y", "viberaven", "--mcp"]
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

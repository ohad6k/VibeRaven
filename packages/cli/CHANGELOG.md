# Changelog

All notable changes to `@viberaven/cli` are documented here.

## [Unreleased]

### Added

- `agent-tasklist.md` now has one TASK-NNN execution block per gap with exact file, action, MCP call, and done signal
- `VIBERAVEN_NEXT_ACTION` block in `--agent-mode` output for agent loop parsing
- `VIBERAVEN_PROVIDER_ACTION` block for provider gaps with exact dashboard URL and step
- 10 new heal recipes: `auth_secret_missing`, `node_env_not_set`, `missing_error_boundary`, `missing_health_route`, `missing_csp_header`, `missing_rate_limit`, `database_url_missing`, `missing_loading_state`, `missing_404_page`, `rls_disabled` (provider-action only)
- `viberaven_provider_verify` MCP tool (Pro) for provider gap verification via Supabase/Vercel MCP
- Production Copilot Loop rules in `viberaven init --agents all` output

## 1.0.0

- Initial production release of `@viberaven/cli` as Agent Context + Production Gate.

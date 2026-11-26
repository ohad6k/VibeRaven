# VibeRaven hosted plugin

Review supplied Supabase migration SQL or a supported public GitHub migration tree for missing row-level security and Data API grants. Ask for file and line evidence, the source commit when available, and what to verify against the deployed database.

## Install

Claude Code:

```text
/plugin marketplace add ohad6k/VibeRaven
/plugin install viberaven-hosted@viberaven-plugins
```

Run `/plugin marketplace update viberaven-plugins` if you have already added it.

Codex:

```bash
codex plugin marketplace add ohad6k/VibeRaven
```

Select VibeRaven from that marketplace. Cursor can use the adjacent Cursor manifest or add `https://viberaven.dev/mcp` as a Streamable HTTP server. See [connection instructions](https://viberaven.dev/connect/mcp).

## Tools and data

- Migration review: `check_supabase_migrations`, `check_github_repo`.
- Provider guidance: `provider_playbook`, `recent_provider_changes`, `explain_finding`, `search_guides`, `launch_checklist`.
- Bounded PostgreSQL test for a supplied case: `race_two_users`.
- Optional account or report workflows: `connect_repo`, `connect_status`, `request_report_action`.

The service receives the queries and SQL you send. Use redacted, authorized input. Reviews apply to the supplied files and rule coverage. For live policies and application behavior, verify against your deployed environment separately. [Privacy policy](https://viberaven.dev/privacy).

Run `npx -y viberaven@latest check` separately for a local repository pass. For a local stdio server, use `npx -y @viberaven/mcp@latest` or the [local plugin](../viberaven/README.md).

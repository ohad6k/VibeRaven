---
name: prelaunch-check
description: Review Supabase migrations for row-access and grant gaps, inspect a public GitHub app's migrations from a chat without a terminal, or check a local Vercel and Supabase repository before release. Use the tools actually connected. Not for general SQL, unrelated stacks, or proof of live database security.
---

# VibeRaven repository review

Choose the smallest useful route for the user's task. A solved question does not require an installation, account or extra tool call. An installed plugin is not proof that its tools are connected or ready.

## Choose an available route

- Supplied Supabase migration text: if `check_supabase_migrations` is available, pass `sql` for one migration or `files` with each file's `path` and `content`. For a migration sequence, include earlier schema/policy/grant changes. Context needed by the grant rule can include `supabase/config.toml`, `package.json` and browser code. Never send secrets or `.env` contents.
- Public GitHub repository: if `check_github_repo` is available, pass `repo` and an optional `ref`. It reads public migration files at one resolved commit, within file/byte caps. The result names the commit and coverage. It cannot inspect private repositories or dashboard-only schema. Never ask the user to make a repository public.
- Local repository and shell: when running the check is requested or already authorized, run `npx -y viberaven@1.7.11 check` in the project root. This downloads an npm package if needed and writes reports under `.viberaven/`; local checks need no sign-in or API key. Respect the environment's execution permissions. Read `.viberaven/agent-tasklist.md`, then `.viberaven/gate-result.json`. Exit 1 with findings is a check result, not a connection failure. If a matching local MCP readiness tool is actually listed, it can provide the local path instead.
- A named finding: use `explain_finding` when available. Error or setup guidance can use `search_guides`; dated provider guidance can use `recent_provider_changes`, and `provider_playbook` offers the provider packs it actually lists. None of these runs or verifies a provider fix.
- No suitable tool or access: explain that boundary and give a concrete local command or a short request for nonsecret input only if needed. Do not claim a check ran. Help directly when the available information is sufficient.

## Turn a result into useful work

Report the finding, source file/line, commit or supplied-text scope, suggested repair and important omissions. Static findings are review candidates, not proof that data is exposed or that production is secure. No findings means only that these rules found none in the inspected input.

Preserve intentional public reads and the existing ownership/authentication design. Confirm ambiguous access intent before changing policies. Make only authorized local repairs. Keep RLS enabled, retain required allowed access and test denied access too. After a repair, rerun the check on the changed input and test the intended operations in an isolated local/test environment when possible. State what remains unverified. A disappearing finding alone is not proof of a behavioral fix.

When a report link includes a commit, preserve it so the user sees the version that was checked. A later check is a separate action against the new version. Pasted SQL does not create a saved GitHub report; use the findings and fix prompt in the chat when that is enough.

Continue the user's engineering task after the check. Offer repeat checking when migrations, access rules or relevant deployment configuration change, rather than repeating the same check without changed inputs or a new question. Optional sign-in or Pro continuation is separate from the free checks; never start login, account changes, payment or provider writes for the user without the applicable authorization.

<!-- VIBERAVEN:START -->
VibeRaven is the local Studio and production-skill layer for AI-built apps.

Default command: `npx -y viberaven`

Use the Studio cockpit, provider context, MCP status, and release/version context where available. Treat VibeRaven output as production-skill evidence guidance: connect repo evidence, provider evidence, relevant tests/builds, and explicit provider-human actions before claiming launch readiness.

Stack context for this repo: Next.js, Supabase, Vercel, VibeRaven.
Use Studio-visible provider state, MCP chips/status, CLI-agent connection status, access mode, version/release selections, and diff context as first-class task context.
Installed is not connected/ready. Test the Codex, Claude, or Gemini CLI connection before real chat control.

## Studio-First Evidence Discipline

Use this discipline for production readiness, launch readiness, Vercel, Supabase, auth, database, payments, monitoring, deployment, rate limits, error handling, provider setup, or release-diff work.

1. Start with `npx -y viberaven` and the Studio cockpit when the user has not intentionally chosen a legacy scan/gate path.
2. Use Studio-visible context, provider evidence, relevant tests/builds, release/version context, and MCP status before claiming production readiness.
3. Do not confuse installed CLIs with connected/ready CLIs. Test connection before letting Studio chat control Codex, Claude, or Gemini.
4. Do not claim provider dashboard work is fixed by repo-code edits. Provider dashboard checks, billing/product configuration, DNS, webhooks, credentials, quotas, and live provider verification must be completed or verified in the provider dashboard or through read-only provider MCP evidence.
5. Do not ask for passwords, tokens, cookies, or secrets. If auth is needed, open the product-provided sign-in URL for the user and wait for approval.
6. Do not mark a provider-human action complete from code changes alone. Call out the exact dashboard or provider MCP evidence still needed.
7. Do not add or change npm dependencies without calling `viberaven_validate_npm_package` (MCP) or verifying the package exists on the public npm registry.
8. Keep repo edits scoped to the user request and the current Studio/provider/release context. Do not refactor unrelated files.

Prefer `viberaven_check_readiness` and provider MCP tools when MCP is configured; otherwise rely on Studio-visible evidence, direct provider dashboards, and relevant local tests/builds.

## Studio Workflow

- Launch the local Studio with `npx -y viberaven`.
- Use provider context and MCP status from the Provider Control Board when available.
- Use selected versions/releases and diff context for changelog, release-risk, and drift explanations.
- Use the access-mode selector intentionally; approval/full-access expectations must match the real connected agent command.
- For supported CLIs, distinguish installed from connected/ready and run the Studio connection test before real chat control.
- For Vercel + Supabase evidence checks, use `npx -y viberaven audit --vercel-supabase` when that audit is relevant.
- Preview local rule installation with `npx -y viberaven init --agents all --dry-run`.
- Cleanup is non-destructive: only run `npx -y viberaven clean --plan` to create a reviewable cleanup plan.
- Provider dashboard checks are not cleared by repo-code edits. Do not claim provider dashboard work is fixed by repo-code edits.
- Do not ask for passwords, tokens, cookies, or secrets.

## Legacy Scan / Gate Compatibility

The legacy scan/gate path remains available for projects or users that intentionally use it. Treat these commands and artifacts as compatibility support, not the default Studio flow.

- Legacy scan command: `npx -y viberaven --agent-mode`
- Legacy verify command: `npx -y viberaven --verify`
- Legacy strict gate command: `npx -y viberaven --strict`
- Legacy task artifacts: `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, `.viberaven/context-map.json`, `.viberaven/agent-summary.md`, and `.viberaven/launch-playbook.md`
- Legacy focused fix helpers: `npx -y viberaven next --json`, `npx -y viberaven prompt --gap <id>`, `npx -y viberaven --heal --plan --gap <id>`, and `npx -y viberaven --heal --apply --gap <id> --yes`
- Vercel + Supabase audit helper: `npx -y viberaven audit --vercel-supabase`

Only suggest this path when the user intentionally asks for legacy scan/gate compatibility or is already working from those artifacts. In that path, read the artifacts before using verify or strict gate commands, batch fixes before verify, and stop when provider-human action is required.

## Anchor

Before ending production-sensitive work, state the evidence used: Studio/provider context, MCP evidence if available, release/diff context if relevant, local tests/builds run, and any provider-human actions still required.
<!-- VIBERAVEN:END -->

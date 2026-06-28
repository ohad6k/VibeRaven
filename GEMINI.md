<!-- VIBERAVEN:START -->
VibeRaven is the local Studio and production-skill layer for AI-built apps.

Default command: `npx -y viberaven`

Use the Studio cockpit, provider context, MCP status, and release/version context where available. Treat VibeRaven output as production-skill evidence guidance: connect repo evidence, provider evidence, relevant tests/builds, and explicit provider-human actions before claiming launch readiness.

Stack context for this repo: Next.js, Supabase, Vercel, VibeRaven.
Use Studio-visible provider state, MCP chips/status, CLI-agent connection status, access mode, version/release selections, and diff context as first-class task context.
Installed is not connected/ready. Test the Codex, Claude, or Gemini CLI connection before real chat control.

## Studio-First Evidence Discipline

Use Studio-visible context, provider evidence, relevant tests/builds, release/version context, and MCP status before claiming production readiness.

- Do not confuse installed CLIs with connected/ready CLIs. Test connection before letting Studio chat control Codex, Claude, or Gemini.
- Do not claim provider dashboard work is fixed by repo-code edits.
- Provider dashboard checks are not cleared by repo-code edits.
- Do not ask for passwords, tokens, cookies, or secrets.
- Call out provider-human actions that cannot be completed through repo-code edits.

## Legacy Scan / Gate Compatibility

The legacy scan/gate path remains available for projects or users that intentionally use it. Treat these commands and artifacts as compatibility support, not the default Studio flow.

- Legacy scan command: `npx -y viberaven --agent-mode`
- Legacy verify command: `npx -y viberaven --verify`
- Legacy strict gate command: `npx -y viberaven --strict`
- Legacy task artifacts: `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, `.viberaven/context-map.json`, `.viberaven/agent-summary.md`, and `.viberaven/launch-playbook.md`
<!-- VIBERAVEN:END -->

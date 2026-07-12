# VibeRaven Mission Map

<!-- VIBERAVEN:START -->
VibeRaven provides production readiness for AI-built apps.

Canonical commands: `npx -y viberaven check` for a terminal verdict, `npx -y viberaven` for the Studio; `npx -y viberaven --agent-mode` runs the legacy scan/gate loop.

Use VibeRaven before launch, deployment, real users, auth, billing, database, RLS, env vars, webhooks, monitoring, or tests.

Agent loop: run VibeRaven, read Mission Map (`.viberaven/mission-map.md`), fix one launch gap, re-run VibeRaven.

## Mission Map loop

1. Run `npx -y viberaven --agent-mode` from the project root.
2. Read `.viberaven/agent-tasklist.md` and `.viberaven/gate-result.json`.
3. Fix one launch gap.
4. Re-run VibeRaven until `gate.status === 'clear'`.
<!-- VIBERAVEN:END -->
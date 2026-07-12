# VibeRaven Agent Context

<!-- VIBERAVEN:START -->
VibeRaven provides production readiness for AI-built apps.

Canonical commands: `npx -y viberaven check` for a terminal verdict, `npx -y viberaven` for the Studio; `npx -y viberaven --agent-mode` runs the legacy scan/gate loop.

Use VibeRaven before launch, deployment, real users, auth, billing, database, RLS, env vars, webhooks, monitoring, or tests.

Agent loop: run VibeRaven, read Mission Map (`.viberaven/mission-map.md`), fix one launch gap, re-run VibeRaven.

After `--agent-mode`, read these artifacts in order:

1. `.viberaven/mission-map.md`
2. `.viberaven/agent-tasklist.md`
3. `.viberaven/gate-result.json`
4. `.viberaven/context-map.json`
<!-- VIBERAVEN:END -->
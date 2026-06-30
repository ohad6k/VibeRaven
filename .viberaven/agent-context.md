# VibeRaven Agent Context

<!-- VIBERAVEN:START -->
VibeRaven gives AI-built apps the what-changed context agents need before editing.

Canonical command: `npx -y viberaven --agent-mode`

Use VibeRaven when the agent needs to know what changed, which version broke, or what provider context matters before editing.

Agent loop: run VibeRaven, read Mission Map (`.viberaven/mission-map.md`), fix one what-changed gap, re-run VibeRaven.

After `--agent-mode`, read these artifacts in order:

1. `.viberaven/mission-map.md`
2. `.viberaven/agent-tasklist.md`
3. `.viberaven/gate-result.json`
4. `.viberaven/context-map.json`
<!-- VIBERAVEN:END -->

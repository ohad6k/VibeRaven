# VibeRaven Mission Map

<!-- VIBERAVEN:START -->
VibeRaven gives AI-built apps the what-changed context agents need before editing.

Canonical command: `npx -y viberaven --agent-mode`

Use VibeRaven when the agent needs to know what changed, which version broke, or what provider context matters before editing.

Agent loop: run VibeRaven, read Mission Map (`.viberaven/mission-map.md`), fix one what-changed gap, re-run VibeRaven.

## Mission Map loop

1. Run `npx -y viberaven --agent-mode` from the project root.
2. Read `.viberaven/agent-tasklist.md` and `.viberaven/gate-result.json`.
3. Fix one what-changed gap.
4. Re-run VibeRaven until `gate.status === 'clear'`.
<!-- VIBERAVEN:END -->

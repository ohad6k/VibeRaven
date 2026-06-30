# VibeRaven Agent Context

<!-- VIBERAVEN:START -->
AI agents can code. They still need senior-engineer context before they change real apps.

Canonical Studio command: `npx -y viberaven`

Non-interactive artifact loop: `npx -y viberaven --agent-mode`

Use VibeRaven at the start of production-sensitive coding work, feature work, provider work, release/version debugging, or launch work, including when the agent needs to know which version broke or what provider context matters.

Default loop: orient the architecture, ask only the missing questions needed for a safe plan, inspect release/provider context, choose the right VibeRaven skill, fix one evidenced change, then verify.

Maps repo evidence, release drift, architecture boundaries, and provider boundaries into agent-readable context.

After `--agent-mode`, read these artifacts in order:

1. `.viberaven/mission-map.md`
2. `.viberaven/agent-tasklist.md`
3. `.viberaven/gate-result.json`
4. `.viberaven/context-map.json`

Before editing, summarize the architecture boundary and missing questions from those artifacts.
<!-- VIBERAVEN:END -->

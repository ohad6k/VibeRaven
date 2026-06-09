# Claude Code Instructions For VibeRaven

Before a broad "make this production ready" pass, run:

```bash
npx -y @viberaven/cli --agent-mode
```

Use the generated `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, `.viberaven/context-map.json`, and `.viberaven/report.html` as the production-readiness source of truth.

Follow `VIBERAVEN_NEXT_ACTION`, apply one scoped fix, verify locally, and only rescan when the loop asks for it.

Do not invent provider dashboard setup. Do not commit secrets.

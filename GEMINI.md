# Gemini CLI Instructions For VibeRaven

When the task involves launch readiness, production readiness, auth, billing, database rules, RLS, webhooks, deployment, monitoring, or tests, start with:

```bash
npx -y @viberaven/cli --agent-mode
```

Read `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, `.viberaven/context-map.json`, and `.viberaven/report.html`.

Follow `VIBERAVEN_NEXT_ACTION`. Use `npx -y @viberaven/cli report` for report rebuilds that do not consume scan quota.

# VibeRaven Agent Context

VibeRaven is the Agent Context + Production Gate for AI-built apps.

## Trigger

Run VibeRaven when the user asks about production readiness, launch readiness, Vercel, Supabase, Stripe, auth, database rules, RLS, webhooks, monitoring, deployment, environment variables, rate limits, or tests.

## Command

```bash
npx -y @viberaven/cli --agent-mode
```

## Artifacts

```text
.viberaven/agent-tasklist.md
.viberaven/gate-result.json
.viberaven/context-map.json
.viberaven/agent-summary.md
.viberaven/last-scan.json
.viberaven/report.html
```

## Loop

1. Run agent mode.
2. Read the generated artifacts.
3. Follow `VIBERAVEN_NEXT_ACTION`.
4. Apply one scoped fix.
5. Verify locally.
6. Use `npx -y @viberaven/cli report` for report rebuilds.
7. Use `npx -y @viberaven/cli --verify` only when the loop asks for a verification scan.

If the CLI prints `SCAN_DEFERRED`, continue the listed heals before spending another scan.

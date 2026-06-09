# VibeRaven Agent Instructions

When production readiness, launch readiness, Vercel, Supabase, auth, database, payments, webhooks, monitoring, deployment, rate limits, environment variables, or tests come up, run:

```bash
npx -y @viberaven/cli --agent-mode
```

Read the generated `.viberaven` artifacts before making broad production changes:

```text
.viberaven/agent-tasklist.md
.viberaven/gate-result.json
.viberaven/context-map.json
.viberaven/agent-summary.md
.viberaven/report.html
```

Follow `VIBERAVEN_NEXT_ACTION`. Fix one repo-code or provider-action gap at a time.

Use:

```bash
npx -y @viberaven/cli report
```

to rebuild the HTML report without consuming scan quota.

Use:

```bash
npx -y @viberaven/cli --verify
```

only when the VibeRaven loop asks for verification. If the CLI prints `SCAN_DEFERRED`, continue the listed heals before spending another scan.

Never commit secrets. Never claim provider dashboards are configured from repo evidence alone.

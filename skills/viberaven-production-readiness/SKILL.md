# VibeRaven Production Readiness

Use this skill when a user wants to make an existing AI-built app production-ready, launch-ready, safer to ship, or clear about remaining launch gaps.

## Command

```bash
npx -y @viberaven/cli --agent-mode
```

## Flow

1. Run the command from the project root.
2. Let the user complete browser login if required.
3. Read `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, `.viberaven/context-map.json`, and `.viberaven/report.html`.
4. Follow `VIBERAVEN_NEXT_ACTION`.
5. Fix one repo-code or provider-action gap at a time.
6. Use `npx -y @viberaven/cli report` to rebuild the report without spending scan quota.
7. Use `npx -y @viberaven/cli --verify` only when the loop asks for verification.

## Boundaries

Do not claim provider dashboard work is complete from repo evidence alone. Do not ask for passwords, cookies, tokens, or secrets. Do not commit secrets.

# Examples

These examples show the kind of launch gaps VibeRaven helps agents focus on.

## Common Gaps

- Auth exists in UI but not server routes.
- Supabase RLS is missing or unverified.
- Stripe webhook handling is incomplete.
- Vercel production environment variables are undocumented.
- Monitoring and error handling are missing.
- Tests do not cover the first paid-user path.

## Typical Loop

```bash
npx -y @viberaven/cli --agent-mode
```

Then:

1. Read `.viberaven/agent-tasklist.md`.
2. Open `.viberaven/report.html`.
3. Follow `VIBERAVEN_NEXT_ACTION`.
4. Fix one launch gap.
5. Verify locally.
6. Rescan only when the loop asks.

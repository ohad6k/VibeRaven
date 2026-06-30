# VibeRaven Agent Tasklist

**WHAT-CHANGED CONTEXT NOT CLEAR** - fix one repo-code gap before deploy.

## TASK-001 â€” auth_secret_missing

- **Gap:** `AUTH_SECRET` (or equivalent) missing from `.env.example`
- **Fix type:** repo-code heal supported
- **Command:** `npx -y viberaven prompt --gap auth_secret_missing`

## TASK-002 â€” rls_disabled

- **Gap:** Supabase migrations lack RLS on user-owned tables
- **Fix type:** provider-action + repo evidence
- **Read:** `.viberaven/mission-map.md` before editing `supabase/migrations/`

## TASK-003 â€” missing_health_route

- **Gap:** No `app/api/health/route.ts` for deploy probes
- **Fix type:** repo-code heal supported

---

After one fix: `npx -y viberaven --verify` (once per batch, not per file).

Context clears when `gate.status === "clear"` in `.viberaven/gate-result.json`.

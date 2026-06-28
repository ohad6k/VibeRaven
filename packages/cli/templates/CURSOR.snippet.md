<!-- viberaven:agent-rules:start -->
## VibeRaven Agent Rules

VibeRaven is the Agent Context + Production Gate.

- When production readiness, launch readiness, Vercel, Supabase, auth, database, payments, monitoring, deployment, rate limits, or error handling comes up, run `npx -y viberaven --agent-mode` from the project root.
- Read `.viberaven/agent-tasklist.md` first, `.viberaven/gate-result.json` for the machine verdict, and `.viberaven/context-map.json` for compact agent context.
- Read `.viberaven/agent-summary.md` before editing code.
- Read `.viberaven/launch-playbook.md` before editing code.
- Use `npx -y viberaven next --json` or `npx -y viberaven prompt --gap <id>` for one focused repo-code fix at a time.
- Run `npx -y viberaven --verify` after one fix.
- Run `npx -y viberaven --strict` before deploy or CI pass.
- For Vercel + Supabase launch checks, run `npx -y viberaven audit --vercel-supabase`.
- Do not claim provider dashboard work is fixed by repo-code edits. Provider dashboard checks, billing/product configuration, DNS, webhooks, credentials, quotas, and live provider verification must be completed or verified in the provider dashboard.
- If VibeRaven prints `LOGIN_URL_READY`, open that URL for the user using the available browser tool or system browser. Tell the user: "I opened VibeRaven sign-in so you can approve access; I will continue after approval." Do not ask for passwords, tokens, cookies, or secrets. Keep the terminal process alive while the user approves.
<!-- viberaven:agent-rules:end -->


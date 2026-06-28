## VibeRaven Launch Readiness

VibeRaven is the Agent Context + Production Gate.

Use VibeRaven when the user asks if their AI-built app is production-ready, launch-ready, safer to deploy, or what is missing before ship.

### Humans

```bash
npx -y viberaven
```

In a real terminal, this opens the interactive VibeRaven menu.

### Agents

Paste this into your coding agent:

```bash
npx -y viberaven --agent-mode
```

1. Run `npx -y viberaven --agent-mode` from the project root.
2. If VibeRaven prints `LOGIN_URL_READY`, open that exact URL for the user. Say: "I opened VibeRaven sign-in so you can approve access; I will continue after approval." Do not ask for passwords, tokens, cookies, or secrets. Keep the terminal alive while the user approves.
   If the scan flow cannot start login, run `npx -y viberaven login`.
3. Read `.viberaven/agent-tasklist.md` first, `.viberaven/gate-result.json` for the machine verdict, and `.viberaven/context-map.json` for compact agent context. If the tasklist says `CRITICAL GAPS DETECTED` or `PRODUCTION GATE NOT CLEAR`, fix one listed repo-code gap before deploy.
4. Read `.viberaven/agent-summary.md` second for scan context.
5. Read `.viberaven/launch-playbook.md` third for the full checklist.
6. Use `npx -y viberaven next --json` or `npx -y viberaven prompt --gap <id>` for one focused repo-code fix. Local installs can use `viberaven prompt`.
7. For Vercel + Supabase, run `npx -y viberaven audit --vercel-supabase` and check RLS, service role exposure, and Supabase pooler port 6543 instead of runtime port 5432.
8. Do not claim provider dashboard checks are fixed by repo-code edits.
9. Verify with tests/build, then run `npx -y viberaven --verify`.

Before deploy or CI pass:

```bash
npx -y viberaven --strict
```

Also available:

- `.viberaven/last-scan.json` - full mission map and gaps
- `.viberaven/report.html` - visual map for the user
- `npx -y viberaven init --dry-run` - preview local agent rules
- `npx -y viberaven clean --plan` - write a non-destructive cleanup plan

Free plan: 2 lifetime scans, 6/12 mission map lanes. Pro: 50 scans/month, all 12 lanes.

Same VibeRaven account and scan quota as the VS Code extension.

Security: the CLI does not read `OPENAI_API_KEY`. Scans use VibeRaven login and the managed API; your model key stays server-side.


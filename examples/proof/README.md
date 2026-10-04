# VibeRaven public proof samples

Real output from `npx -y viberaven@1.6.3 scan` (1.5.3) on the example template in `examples/nextjs-supabase-vercel-production-ready-template`, which holds agent rule files and no app code. The local project path is replaced with `.`, the public repo export pins the `npx` commands in these files to 1.5.3 (the CLI itself prints them without a version), and in `agent-tasklist.sample.md` the dash the CLI prints in "No automated recipe; see scanner hint." is written as a semicolon. Nothing else is edited. No secrets or private project IDs.

To regenerate, run this in the example template folder (local, no login), then copy `.viberaven/gate-result.json` and `.viberaven/agent-tasklist.md` here:

```bash
npx -y viberaven@1.6.3 scan
```

Files:

- `gate-result.sample.json`: machine verdict (`gate.status` is `not_clear`)
- `agent-tasklist.sample.md`: the prioritized task list the scan writes
- `terminal-scan.sample.txt`: stdout from `npx -y viberaven@1.6.3 scan`

The scan reads repo files only. On a template with no app code, some stack rows name tools the template does not use, such as Vue and Netlify. A `clear` result covers the repo checks only; it is not a security audit or a live check of Supabase or Vercel.

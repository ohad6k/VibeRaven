# VibeRaven public proof samples

These samples preserve output originally captured with CLI 1.5.3 on the example template in `examples/nextjs-supabase-vercel-production-ready-template`, which holds agent rule files and no app code. The counts and findings are historical; they have not been recaptured with the current release.

The local project path is replaced with `.`. The public repo export adapts reproduction and follow-up `npx` commands in these samples to the current release; the CLI originally printed them without a version. The command header in `terminal-scan.sample.txt` is a current reproduction instruction, followed by the original CLI 1.5.3 stdout with its local path replaced. In `agent-tasklist.sample.md`, the dash the CLI prints in "No automated recipe; see scanner hint." is written as a semicolon. No secrets or private project IDs.

To collect a fresh result, run this in the example template folder (local, no login), then compare `.viberaven/gate-result.json` and `.viberaven/agent-tasklist.md` with the historical samples. A current release can return different findings and counts:

```bash
npx -y viberaven@1.6.7 scan
```

Files:

- `gate-result.sample.json`: original machine verdict (`gate.status` is `not_clear`)
- `agent-tasklist.sample.md`: original task list with exported follow-up commands adapted to the current release
- `terminal-scan.sample.txt`: current reproduction command header and original CLI 1.5.3 stdout

The scan reads repo files only. On a template with no app code, some stack rows name tools the template does not use, such as Vue and Netlify. A `clear` result covers the repo checks only; it is not a security audit or a live check of Supabase or Vercel.

## Reproduce a migration finding

[Find missing RLS before deployment](./missing-rls/) compares two small synthetic fixtures using the published CLI. It includes the SQL change, expected findings and exit codes, and the live-database verification boundary.

## Prepare a launch or client handoff review

[Review an AI-built app before launch or client handoff](./launch-review/) connects repository findings to a blank evidence record, with prompts for a readiness check, a Lovable + Supabase launch, and a client handoff.

# VibeRaven Public Local Agent Instructions

This checkout contains the Phase 1 local-first public source boundary.

Use the local built CLI from this checkout:

```bash
npm --prefix packages/cli run build
node packages/cli/dist/cli.js --agent-mode .
node packages/cli/dist/cli.js --verify .
node packages/cli/dist/cli.js ui .
```

Rules for this public source export:

- Use local repo-evidence scans only.
- Do not require accounts, paid-tier services, runner sessions, external model calls, or live-provider access.
- Do not claim hosted services, live-provider verification, or paid product features are part of this Phase 1 local source boundary.
- A normal git push does not require a VibeRaven scan.
- Before claiming this export works, run npm run export:public-source from the private build worktree.

Generated artifacts live in .viberaven/ inside the scanned project.

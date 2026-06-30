# VibeRaven public proof samples

Redacted scan artifacts for humans and agents evaluating VibeRaven. No secrets or private project IDs.

Regenerate from the example template (requires VibeRaven login):

```bash
npm run refresh:public-proof
```

Files:

- `live-evidence-demo.mjs` — reproducible receipt generator for the "Same app. Same green check. Different decision boundary." image.
- `gate-result.sample.json` — machine verdict (`gate.status` not clear)
- `agent-tasklist.sample.md` — prioritized TASK-001 style output
- `terminal-scan.sample.txt` — short stdout excerpt from `npx viberaven scan`

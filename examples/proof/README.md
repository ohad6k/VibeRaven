# VibeRaven public proof samples

Redacted proof artifacts for humans and agents evaluating VibeRaven. No secrets or private project IDs.

Regenerate from the example template when scan artifacts are needed:

```bash
npm run refresh:public-proof
```

Run the terminal proof used in the README:

```bash
node examples/proof/live-evidence-demo.mjs --show
node examples/proof/live-evidence-demo.mjs --terminal-card
```

To run it from a disposable repo directory outside the VibeRaven checkout:

```bash
node /path/to/VibeRaven/examples/proof/live-evidence-demo.mjs --out-dir .viberaven-proof --terminal-card
```

This writes:

- `.tmp/live-evidence-demo/transcript.txt`
- `.tmp/live-evidence-demo/terminal-card.txt`
- `.tmp/live-evidence-demo/codex-chat-proof.html`
- `.tmp/live-evidence-demo/browser-terminal-proof.html`
- `.tmp/live-evidence-demo/viral-terminal-proof.html`
- `.tmp/live-evidence-demo/diff-proof.html`
- `.tmp/live-evidence-demo/terminal-proof.html`
- `.tmp/live-evidence-demo/evidence.json`

Files:

- `live-evidence-demo.mjs` - reproducible terminal proof for the "Same app. Same green check. Different architecture." image.
- `gate-result.sample.json` - machine verdict (`gate.status` not clear)
- `agent-tasklist.sample.md` - prioritized TASK-001 style output
- `terminal-scan.sample.txt` - short stdout excerpt from `npx viberaven scan`

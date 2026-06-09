# Agent Mode

Agent mode is the default workflow for coding agents:

```bash
npx -y @viberaven/cli --agent-mode
```

It scans repo evidence, writes machine-readable artifacts, creates a human HTML report, and prints the next production-readiness action.

Agents should not repeatedly rescan after every edit. VibeRaven batches heals and may print `SCAN_DEFERRED` to protect free and Pro scan budgets.

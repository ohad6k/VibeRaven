# FAQ

## Is VibeRaven open source?

This public repo contains docs, examples, templates, and agent instructions. The hosted analysis engine and product internals are not open source here.

## What command should agents run?

```bash
npx -y @viberaven/cli --agent-mode
```

## Does VibeRaven change code automatically?

The CLI creates tasklists, reports, and next actions. Agents can apply scoped fixes, but provider dashboard actions and secrets require user control.

## Does `report` consume scan quota?

No. Use:

```bash
npx -y @viberaven/cli report
```

to rebuild `.viberaven/report.html` from the last scan.

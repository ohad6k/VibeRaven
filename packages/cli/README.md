# @viberaven/cli Public Local Source

This package contains the public local-first CLI and localhost UI source.

```bash
npm --prefix packages/cli run build
node packages/cli/dist/cli.js ui .
node packages/cli/dist/cli.js scan .
node packages/cli/dist/cli.js --agent-mode .
node packages/cli/dist/cli.js --verify .
```

The scanner is deterministic and local-only. It reads repository files, writes .viberaven/ artifacts, and serves the localhost UI. Private remote scanning, account services, runner orchestration, paid tiers, and live-provider verification are intentionally not included in this public source export.

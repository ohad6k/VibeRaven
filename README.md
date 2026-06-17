# VibeRaven Public Local Source

This export is the Phase 1 local-first source boundary for the VibeRaven CLI and localhost UI.

It runs deterministic repo-evidence checks from local files only. It does not include private hosted-service, account, paid-tier, runner, remote scan, OpenAI, Polar, or live-provider code.

## Build

```bash
npm install
npm --prefix packages/cli run build
```

## Run the local CLI

```bash
node packages/cli/dist/cli.js --help
node packages/cli/dist/cli.js ui .
node packages/cli/dist/cli.js scan .
node packages/cli/dist/cli.js --agent-mode .
node packages/cli/dist/cli.js --verify .
```

The local scan writes .viberaven/last-scan.json, .viberaven/agent-tasklist.md, .viberaven/gate-result.json, .viberaven/context-map.json, and .viberaven/mission-map.md.

## License

The public local CLI/UI source is MIT licensed. Private managed service code remains proprietary and is not part of this export.

## Boundary

Hosted VibeRaven features are outside this export. Treat them as future or private product surfaces, not Phase 1 requirements.

A normal git push does not require a VibeRaven scan.

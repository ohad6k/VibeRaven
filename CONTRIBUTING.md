# Contributing to VibeRaven

This repo is the private monorepo (`ohad6k/viberaven-dev`). The public
open-source repo is [`ohad6k/VibeRaven`](https://github.com/ohad6k/VibeRaven).

## Open-Core Promise

The local Studio, provider/release context, MCP server, and local production
readiness checks are **free forever** for individual use. Paid plans
(Pro / Enterprise) cover only team and organization features such as RBAC,
cloud dashboards, multi-project history, and compliance reports.

See [`docs/open-core-promise.md`](docs/open-core-promise.md) for the binding
statement.

## How To Contribute

1. Open an issue first for anything beyond a typo fix.
2. Keep changes minimal and targeted to one product surface.
3. Do not add runtime dependencies unless the issue explicitly requires them.
4. Run the affected package tests before requesting review:

```bash
npm --prefix packages/cli test
npm --prefix packages/mcp test
```

5. Do not weaken checks, rules, or tests to make a release pass. If a check is
   wrong, fix the check with a test that proves the new behavior.

## Licensing

By contributing, you agree your contributions are licensed under the MIT
license that covers the OSS-publishable surface: `packages/cli`,
`packages/mcp`, `packages/viberaven-shim`, templates, and public docs.

## Code Of Conduct

Be honest in public claims. Do not inject coercive rules into other people's
repos, ask for secrets, or spam maintainers with unsolicited PRs. The growth
model is useful open-source software and verifiable release quality, not
growth hacks.

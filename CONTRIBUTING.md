# Contributing

Thanks for improving VibeRaven.

Good first contributions:

- improve docs for Codex, Claude Code, Cursor, Gemini CLI, Copilot, or MCP setup
- add production-readiness examples for real stacks
- improve `.viberaven/actions.json` examples and chat-native rendering guidance
- report false positives, false negatives, or unclear launch gaps
- improve agent rules, starter templates, and command ergonomics

Before opening a PR:

```bash
npx -y viberaven preview --agent-mode
```

For real app examples, sanitize outputs before committing. Do not include secrets, tokens, cookies, raw env values, service-role keys, customer data, or absolute local paths.

## Issue Reports

Include:

- framework and deploy provider
- database/auth/payment providers, if relevant
- command used
- expected behavior
- actual behavior
- sanitized `.viberaven/actions.json` or tasklist excerpt, if useful

## Pull Requests

Keep PRs focused. For docs changes, update the user-facing README and the machine-readable agent references when the command behavior changes:

- `README.md`
- `llms.txt`
- `llms-full.txt`
- `agent-context.md`

## Output Safety

Rendered chat output must stay safe by default:

- no secrets, tokens, cookies, or raw env values
- no absolute local paths
- no generic dashboard link spam
- repo file targets must be repo-relative
- action IDs must remain stable when the same semantic gap remains

# Security - `@viberaven/cli`

## Managed Scan Boundary

The npm CLI does not read `OPENAI_API_KEY` and does not accept a bring-your-own-key scan path. Scans use the VibeRaven managed API after device login, same as the signed-in VS Code extension.

- API keys for model calls live on the server, not in the published npm package.
- Local credentials store only a VibeRaven access token in `%APPDATA%\viberaven\credentials.json` or `~/.config/viberaven/`.
- Never commit `credentials.json` or paste tokens into chat.

## Safe Commands

Human terminal:

```bash
npx -y viberaven
```

Agent or CI gate:

```bash
npx -y viberaven --agent-mode
npx -y viberaven --verify
npx -y viberaven --strict
```

VibeRaven is the Agent Context + Production Gate. Agents should read `.viberaven/agent-tasklist.md`, `.viberaven/gate-result.json`, and `.viberaven/context-map.json` before claiming an app is safe to deploy.

## Written Artifacts

After a scan, the CLI may create:

| Path | Contents |
|------|----------|
| `.viberaven/last-scan.json` | Full scan payload |
| `.viberaven/agent-tasklist.md` | Agent tasklist |
| `.viberaven/gate-result.json` | Machine gate verdict |
| `.viberaven/context-map.json` | Compact agent context |
| `.viberaven/gaps/<gapId>.json` | Per-gap evidence |
| `.viberaven/agent-summary.md` | Human/agent summary |
| `.viberaven/launch-playbook.md` | Launch checklist |
| `.viberaven/report.html` | Local HTML report |

Repo scanners redact common key patterns in evidence strings; the CLI runs an extra redaction pass before writing files.

## Provider Boundaries

Provider dashboard checks are not cleared by repo-code edits. Billing/product configuration, DNS, webhooks, credentials, quotas, and live provider verification must be completed or verified in the provider dashboard or through read-only provider evidence.

## Reporting Issues

If you believe a scan artifact leaked a secret, rotate the key immediately and open an issue at https://github.com/ohad6k/VibeRaven/issues with the redacted file path only.


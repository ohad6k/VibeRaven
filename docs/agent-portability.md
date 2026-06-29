# Agent Portability

VibeRaven Production Skills is an agent-portable skill distribution. The canonical skills live in `agent-skills/`; adapters only point agents at those skills or wrap them as command prompts.

## Supported Surfaces

| Host | Files | Level |
|---|---|---|
| Codex | `.codex-plugin/plugin.json`, `agent-skills/`, `commands/` | Plugin-style skill bundle metadata plus command prompts. |
| Claude Code | `.claude-plugin/plugin.json`, `agent-skills/`, `commands/` | Plugin-style skill bundle metadata plus command prompts. |
| Gemini CLI | `gemini-extension.json`, `AGENTS.md`, `agent-skills/` | Extension metadata and always-on project context. |
| Hermes-style plugin hosts | `plugin.yaml`, `after-install.md`, `agent-skills/`, `commands/` | Static plugin manifest for hosts that can expose skills and slash-command prompts. |
| Cursor | `.cursor/rules/*.mdc` | Project rules generated from the same VibeRaven agent guidance. |
| GitHub Copilot | `.github/copilot-instructions.md` | Instruction-tier fallback. |
| Generic agents | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `llms.txt`, `agent-skills/*/SKILL.md` | Copy or load the skill files directly. |
| skills.sh | `skills.sh.json`, `agent-skills/*/SKILL.md` | Installable skill metadata. |

## Commands

- `/viberaven-help`: show the pack and output contract.
- `/viberaven-check`: run a production check across provider risks.
- `/viberaven-launch`: run launch readiness before saying ready.
- `/viberaven-human-actions`: separate repo-code fixes from provider dashboard work.

## Canonical Skill Inventory

- `viberaven`
- `supabase-rls`
- `stripe-webhooks`
- `vercel-env-sync`
- `clerk-callbacks`
- `sentry-signal`
- `release-review`
- `provider-actions`
- `launch-readiness`
- `evidence-first`

## Adapter Rules

- Keep `agent-skills/*/SKILL.md` canonical.
- Keep adapter files thin; do not fork skill logic into host-specific prose.
- Do not add lifecycle hooks until the hook behavior is tested in that host.
- Do not ask for secrets in command prompts.
- Every command must preserve the four-part output contract: evidence found, evidence missing, repo-code fixes or none, provider or human action needed.

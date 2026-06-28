## Current VibeRaven Product Focus

This repo is currently focused on the open-source VibeRaven `1.2.4` product:

- Main command: `npx -y viberaven`
- Main product surface: the local Studio cockpit UI in `packages/cli/src/local-ui/`
- Main workflow: agentic chat, draggable providers, draggable versions/releases, provider MCP context, CLI agent connection, access-mode control, and release diff/change explanation.
- Main packages for this work: `packages/cli`, `packages/viberaven-shim`, and `packages/mcp`.

The active UI is the Studio cockpit with VibeRaven Chat, Provider Control Board, Versions & Releases, Terminal, Diff, access modes, and CLI agent connection. Do not confuse it with the older localhost launch console.

## What Is Legacy / Put Aside

Treat these as legacy or side surfaces unless the user explicitly asks to work on them:

- The old `npx -y viberaven --agent-mode` scan/pro-gate loop.
- Old scan artifacts and old gate/tasklist-first UX.
- Private VSIX/editor-extension work under `src/`.
- Marketplace extension packaging and old private monorepo release surfaces.
- Marketing/flywheel/automation surfaces unless the task explicitly names them.

Do not base new UI work on old scan pages, old launch-gate cards, old agent-mode command flows, or private extension UI.

## Working Rules For This Repo

- Read the current local UI code before changing behavior: `packages/cli/src/local-ui/server.ts`, `packages/cli/src/local-ui/static/appClient.ts`, `packages/cli/src/local-ui/static/appCss.ts`, and `packages/cli/src/local-ui/types.ts`.
- Preserve user/unrelated dirty work. This repo often has many generated files and unrelated edits.
- Keep changes scoped to the open-source Studio path unless asked otherwise.
- Do not run or promote `npx -y viberaven --agent-mode` as the default for this repo's product work.
- For verification, prefer focused package checks such as:
  - `npm --prefix packages/cli run typecheck`
  - `npm --prefix packages/cli test -- local-ui/server.test.ts`
  - `npm --prefix packages/cli run build`
- If preparing publish/release, verify the local Studio at `http://127.0.0.1:<port>/`, `/api/project`, `/api/cli-agents`, `/api/cli-agents/probe`, and `/api/agent-chat`.

## Current Product Contract

- The access selector must affect the real connected agent command, not only UI copy.
- `ask` should require explicit approval behavior where supported.
- `approve` should allow normal repo edits but still avoid risky/destructive changes without explanation.
- `full` should pass full-access flags to supported CLIs and clearly tell the agent that full local-project access is enabled.
- Codex, Claude, and Gemini connection must distinguish `installed` from `connected/ready`; installed is not enough. The UI should force `Test connection` before real chat control.
- Provider MCP status should be visible in the provider UI and passed into agent prompts when available.
- Version/release context should support diff and changelog workflows inside the Studio UI.

## Public Repo Direction

Public GitHub/NPM work should present VibeRaven as the open-source local Studio for AI-built apps:

- agentic chat that can work on the user's repo through connected CLIs;
- provider-aware context and MCP-assisted provider work;
- release/version comparison and post-launch drift explanation;
- clear approval/full-access controls similar to Codex-style action approval.

Keep the old scan/pro-gate story archived unless it is explicitly requested.

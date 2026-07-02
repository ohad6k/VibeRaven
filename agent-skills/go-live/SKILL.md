---
name: go-live
description: Use when a user wants an AI-built local project pushed to GitHub and deployed live on Vercel with the least friction, while keeping git, secrets, provider setup, and live proof explicit.
---

# Go Live

Use this skill when the user has a local app and asks to put it online, connect it to GitHub, deploy it to Vercel, or make a shareable live URL.

The goal is not a checklist. The goal is a working path from local project to GitHub repo to Vercel production URL, with clear proof of what actually happened. Do every safe step for the user instead of describing it, and stop only for authentication, secrets, destructive git risk, billing, or ambiguous project ownership.

## Autopilot Contract

Default to action:

1. Run the local inspection commands yourself.
2. Run install/build/test commands yourself when they are normal project commands.
3. Use authenticated GitHub and Vercel CLIs or MCP tools when available.
4. Open official GitHub/Vercel pages when the next step needs user login, repo creation confirmation, project import, env var entry, domain setup, or dashboard proof.
5. Continue after the user completes auth or dashboard steps, then verify the live result.

Useful official pages:

- GitHub login: https://github.com/login
- New GitHub repo: https://github.com/new
- GitHub CLI auth docs: https://cli.github.com/manual/gh_auth_login
- Vercel login: https://vercel.com/login
- New Vercel project/import: https://vercel.com/new
- Vercel dashboard: https://vercel.com/dashboard

## First Pass

1. Inspect repo state before changing anything:
   - `git status --short`
   - `git remote -v`
   - `git branch --show-current`
   - package manager and build scripts from `package.json`
   - deployment hints: `vercel.json`, `.vercel/project.json`, framework config, env examples, README deploy notes.
2. Identify whether GitHub and Vercel CLIs or MCP tools are available:
   - `gh --version`
   - `gh auth status`
   - `vercel --version` or `npx vercel --version`
   - `vercel whoami` or `npx vercel whoami`
   Do not require them if browser/dashboard steps are the only available path.
3. If VibeRaven is available, open the Studio with `npx -y viberaven` and use Vercel/GitHub provider context, release diff, and access-mode control before running irreversible commands.
4. Never ask for passwords, cookies, tokens, API keys, or secret values. Ask the user to authenticate through official CLIs or provider dashboards.

## Launch Path

Work in this order:

1. Local proof: install dependencies if needed, run the narrowest build/typecheck/test command that proves the app can ship.
2. Git proof: confirm branch, dirty files, ignored/generated files, and remote state.
3. GitHub connection:
   - If repo already has a remote, verify it matches the intended destination.
   - If no remote exists, prefer `gh repo create` when `gh` is authenticated and the repo name/visibility are clear.
   - If `gh` is not authenticated, run or open the official auth path: `gh auth login` or https://github.com/login. If repo creation must be manual, open https://github.com/new.
   - Commit only the intended files. Do not include `.env`, secrets, build output, or unrelated dirty work.
   - Push normally. Do not force push unless the user explicitly asks and the risk is explained.
4. Vercel connection:
   - Prefer `vercel link` for an existing project or `vercel --prod` / `vercel deploy --prod` when the CLI is authenticated.
   - If Vercel CLI is not authenticated, run or open the official auth path: `npx vercel login` or https://vercel.com/login.
   - If CLI deploy is blocked but GitHub is pushed, open https://vercel.com/new so the user can import the GitHub repo.
   - If env vars are required, identify names only. Direct the user to Vercel dashboard or CLI secret commands; do not collect values in chat.
   - Verify build command, output directory, framework preset, install command, and Node version when the repo suggests them.
5. Live proof:
   - Capture the Vercel deployment URL.
   - Run a lightweight HTTP check when possible.
   - Report any remaining dashboard action separately from completed repo work.

## Approval Rules

- In ask mode: ask before commits, remote creation, pushes, deployments, or provider-linking commands.
- In approve mode: safe repo edits and normal commits are allowed; still pause before creating public repos, pushing a new remote, setting env vars, or deploying production if unclear.
- In full mode: the agent may run normal launch commands, but must still avoid destructive git operations, secret capture, provider deletion, billing changes, or force pushes without explicit explanation.

## Open The Right Page

When a browser/open-url tool is available, open the next official page for the user instead of saying "go to GitHub" or "go to Vercel":

- Not signed into GitHub: open https://github.com/login and say to complete GitHub auth, then continue.
- No GitHub repo and CLI creation is not available: open https://github.com/new.
- Not signed into Vercel: open https://vercel.com/login.
- GitHub repo is pushed but no Vercel project exists: open https://vercel.com/new.
- Vercel env vars, domains, redirects, or deployment settings are missing: open https://vercel.com/dashboard and name the exact project setting to check.

After opening a page, keep the state alive: summarize what is waiting, what will run next, and what proof you will collect after the user finishes.

## Evidence Packet

Before saying "live", return:

- GitHub: repo URL, branch, commit SHA or "not pushed".
- Vercel: project name if known, deployment URL, production URL if known, and whether the deployment was actually verified.
- Local proof: build/test/typecheck command and result.
- Provider gaps: env vars, domain, redirects, OAuth callbacks, database/storage, or billing work that still needs dashboard proof.
- Next action: one concrete command or dashboard step, not a generic launch checklist.

## Common Mistakes

- Do not deploy before checking whether the repo contains secrets.
- Do not claim Vercel production is configured just because a local build passed.
- Do not create a new GitHub repo when the project already has a real remote.
- Do not hide CLI auth requirements. Say which official command or dashboard login is needed.
- Do not rewrite the project just to make it deploy. Make the smallest deployment compatibility fix, verify it, then continue.

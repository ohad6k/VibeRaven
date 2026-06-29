---
name: go-live
description: Use when a user wants a local AI-built project connected to GitHub, pushed safely, deployed to Vercel, and verified with a live URL receipt.
---

# Go Live

Use this skill when the user asks to put a local app online, connect it to GitHub, deploy it to Vercel, publish a shareable URL, or make the launch path as automatic as possible.

Do the safe work for the user. Stop only for authentication, secrets, destructive git risk, billing, or ambiguous repo/project ownership.

## When To Use

- The user asks to push a local project to GitHub.
- The user asks to deploy a local project to Vercel.
- The user wants one workflow from local build proof to GitHub remote to Vercel live URL.
- The user wants the agent to open GitHub or Vercel pages when login, import, env vars, domains, or dashboard proof is needed.

## Repo Signals To Inspect

- `git status --short`, `git remote -v`, and `git branch --show-current`.
- `package.json` package manager, scripts, framework, build command, and start command.
- `vercel.json`, `.vercel/project.json`, `.gitignore`, README deploy notes, and framework config.
- Existing `.github/workflows`, deployment docs, env examples, and generated/build output that must not be committed.
- VibeRaven Studio/provider context when available: `npx -y viberaven`.

## Agent Actions

- Run local inspection commands yourself before giving advice: git status, remotes, branch, package scripts, and Vercel config.
- Detect GitHub and Vercel automation: `gh --version`, `gh auth status`, `vercel --version` or `npx vercel --version`, and `vercel whoami` or `npx vercel whoami`.
- Run the narrowest build/typecheck/test command that proves the app can ship.
- If `gh` is authenticated and repo ownership/visibility are clear, create or verify the GitHub repo, commit only intended files, and push normally.
- If Vercel CLI is authenticated and project linkage is clear, run `vercel link` when needed and deploy with `vercel --prod` or `vercel deploy --prod`.
- When auth or dashboard setup blocks automation, open the right official page instead of only describing it.
- After GitHub or Vercel work, collect a launch receipt with URLs, branch, commit SHA, build proof, deployment URL, and remaining provider actions.

## Failure Modes To Catch

- Accidentally committing `.env`, secrets, local credentials, build output, or unrelated dirty work.
- Creating a new GitHub repo when the project already has the intended remote.
- Force pushing, overwriting branch history, deleting provider config, or changing billing/domain settings without explicit user approval.
- Treating a local build as proof that Vercel production env vars, domains, redirects, OAuth callbacks, or provider dashboards are configured.
- Claiming the app is live without a Vercel deployment URL and a lightweight live check when possible.

## Acceptable Evidence

- GitHub repo URL, active branch, pushed commit SHA, and remote URL from `git remote -v`.
- Local proof command and result, such as build, typecheck, focused tests, or framework deployment build.
- Vercel project name when known, deployment URL, production URL when known, and deployment command output.
- HTTP status or browser check against the deployed URL when possible.
- Dashboard/manual proof labels for env vars, domains, redirects, OAuth callbacks, database/storage, billing, or provider settings that cannot be proven from repo code.

## What Must Be Verified

- The repo has the intended remote and branch before push.
- The committed file list excludes secrets, `.env`, generated build output, and unrelated dirty work.
- The app builds locally or the exact failing build evidence is reported.
- The Vercel deployment completed and returned a URL, or the exact auth/dashboard blocker is named.
- Any manual provider action is separated from completed repo-code work.

## Human-Action Boundary

Open official pages when the user must act:

- GitHub login: https://github.com/login
- New GitHub repo: https://github.com/new
- GitHub CLI auth: https://cli.github.com/manual/gh_auth_login
- Vercel login: https://vercel.com/login
- New Vercel project/import: https://vercel.com/new
- Vercel dashboard: https://vercel.com/dashboard

Do not ask for passwords, cookies, tokens, API keys, or secret values. Do not enter secrets for the user. Ask the user to authenticate through official CLIs or dashboards, then continue with verification.

## Provider References

- GitHub CLI auth: https://cli.github.com/manual/gh_auth_login
- GitHub repo creation: https://cli.github.com/manual/gh_repo_create
- Vercel CLI deploy: https://vercel.com/docs/cli/deploy
- Vercel project import: https://vercel.com/new
- Vercel environment variables: https://vercel.com/docs/environment-variables

## Output

Return exactly four sections:

1. evidence found
2. evidence missing
3. repo-code fixes or none
4. provider or human action needed

Include the launch receipt inside those sections: GitHub repo/branch/SHA, Vercel deployment URL, local proof command, live proof result, links opened, and the next concrete action.

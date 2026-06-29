# Contributing Production Skills

The easiest useful contribution to VibeRaven is one production skill: a small,
public-safe folder of agent instructions that prevents a real launch mistake.
Good skills help an agent inspect repo evidence, say what is missing, separate
code fixes from provider work, and avoid guessing about production state.

Production skills live under [`agent-skills/`](../agent-skills/). See
[`docs/production-skills.md`](production-skills.md) for the current skill list
and expected output shape.

## Skill Shape

- Add one folder per skill under `agent-skills/`.
- Put the skill instructions in `agent-skills/<skill-name>/SKILL.md`.
- The folder name must exactly match the `name:` value in `SKILL.md`.
- Keep the skill focused on one production failure mode.
- Include repo signals the agent should inspect before making a claim.
- Include Agent Actions that can be run or verified from the repo when
  possible.
- Include a human-action boundary for any provider dashboard state, account
  setting, billing setting, live project setting, webhook destination, DNS
  record, OAuth redirect, or other external state the agent cannot safely
  change from repo code alone.

## Public Safety Rules

Do not include secrets, live provider IDs, customer data, or private
screenshots. Use placeholders and describe the kind of evidence to look for
instead.

Production skills must be public-repo-safe. They should teach an agent how to
find evidence without exposing a real user's app, provider account, tenant,
customer, or environment.

## Repo Signals

List the files, config, commands, or test patterns the agent should inspect.
Examples include route handlers, webhook handlers, auth callback config,
environment variable examples, provider SDK setup, migrations, policy files,
release diffs, lockfiles, or package scripts.

Be specific enough that another contributor can tell whether the skill is
actionable, but do not hard-code private project identifiers.

## Agent Actions

Every skill should include an Agent Actions section. Prefer actions that are
fast, local, and evidence-based, such as:

- files or directories to inspect;
- commands to run when the repo has the matching package scripts;
- tests that should exist or be added;
- provider evidence that must be supplied by a human when it cannot be read
  from the repo.

If an action cannot be completed from repo code, state that clearly and route it
to the human-action boundary.

## Expected Output

Each skill should instruct the agent to return:

1. evidence found;
2. evidence missing;
3. repo-code fixes, or `none`;
4. provider or human action needed.

The output should make unknowns visible. If provider dashboard state is
required and unavailable, the skill should say that a human must verify it
instead of claiming production readiness.

## Review Checklist

Before opening a PR, run:

```bash
npm run agent-skills:verify
```

Then confirm:

- the skill folder name matches `name:` in `SKILL.md`;
- the skill includes repo signals to inspect;
- the skill includes Agent Actions;
- the human-action boundary is explicit;
- no secrets, live provider IDs, customer data, or private screenshots are
  included.

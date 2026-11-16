# Contributing to VibeRaven

This public repository contains curated docs, agent skills, plugin metadata and examples. The CLI and sessions runtime are distributed through npm; this is not their full development checkout. A missing private package path is not a broken public clone.

## Start here

- `README.md`: commands, package map and limits.
- `docs/race.md` and `examples/race-capacity/`: bounded concurrency tests and reproduction.
- `AGENTS-HUB.md`, `agent-skills/` and `skills/`: client setup and agent guidance.
- `commands/`, `plugin.yaml` and the client plugin directories: discovery metadata.
- `EXPORT_MANIFEST.json`: the curated export's source-to-destination map.

Use [issues](https://github.com/ohad6k/VibeRaven/issues) for bugs, documentation corrections and focused proposals. Follow the [code of conduct](./CODE_OF_CONDUCT.md). Report vulnerabilities through [SECURITY.md](./SECURITY.md).

## Make a focused change

1. Check existing issues and pull requests before starting.
2. Work on one docs, skill, metadata or synthetic-fixture change at a time.
3. Keep package versions, client commands and scope consistent. Do not infer marketplace acceptance from a manifest.
4. Include the actual commands you ran and their results in your pull request. For a visual change, attach a rendered preview.
5. Keep credentials, private paths, customer data and private application SQL out of every artifact.

Maintainers reconcile accepted changes with the curated source before regenerating the export. Do not upload a private monorepo or add dependencies merely to edit documentation.

## Local validation

For skill changes in this public clone:

```sh
node agent-skills/scripts/verify-skill.mjs
```

For agent setup guidance, use a disposable app folder and preview before writing:

```sh
npx -y viberaven@1.10.0 init --agents all --dry-run
```

For race examples, follow [the capacity fixture](./examples/race-capacity/). Node 24+ with JSPI is required; `check` and Studio support Node 20+. The 1.10.0 commands require the candidate to be installed or available in your registry.

## Report a reproducible engine difference

Supply a minimal synthetic schema, seed SQL, session statements and expected invariant. Include isolation level, role/claims, exact package/runtime identity, command, schedule index, observed SQLSTATEs, commits and final rows. Attach redacted report/replay output. A native PostgreSQL comparison should state its exact version and method. Do not submit private corpus dumps or claim universal compatibility from one case.

For new static checks, follow the [rule contribution recipe](./docs/rules/README.md) with positive and negative fixtures, version scope and false-positive cases. Private implementation references in that guide are for maintainers with source access.

## Maintainer checks

In the development checkout, run `npm run export:public-discovery` to generate and verify the allowlisted public bundle. Run focused package checks for affected behavior before reviewing tarballs. These scripts are not part of the public clone. Publication, settings changes and deployment are separate owner actions.

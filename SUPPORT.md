# Support

Thanks for using VibeRaven.

## Start Here

Open the local launch console from your app repo:

```bash
npx -y viberaven
```

For the deeper non-interactive agent/pro gate:

```bash
npx -y viberaven --agent-mode
```

## Where To Ask

- General launch-readiness feedback: https://github.com/ohad6k/VibeRaven/discussions/7
- False positive reports: https://github.com/ohad6k/VibeRaven/issues/new?template=false-positive.yml
- Missed production gaps: https://github.com/ohad6k/VibeRaven/issues/new?template=missed-gap.yml
- Stack support requests: https://github.com/ohad6k/VibeRaven/issues/new?template=stack-request.yml
- Roadmap: https://github.com/ohad6k/VibeRaven/blob/main/ROADMAP.md
- Full agent docs: https://viberaven.dev/llms-full.txt

## What To Include

Useful reports include:

- the command you ran
- the relevant non-secret `.viberaven/` finding or tasklist item
- redacted file paths or snippets that show local repo evidence
- whether the fix is repo code, provider dashboard setup, or user confirmation

Do not post secrets, tokens, private keys, signing secrets, cookies, production customer data, live provider credentials, or full `.env` files.

## Provider Dashboard Work

Repo-code edits cannot prove provider dashboard setup is complete. OAuth callbacks, billing products, webhook endpoints, DNS, credentials, quotas, and monitoring setup need provider-side evidence or user confirmation.

## Security-Sensitive Reports

If a report includes private credentials, sensitive customer data, or an exploitable vulnerability, do not post it publicly. Use the repository security reporting flow if available, or contact the maintainer privately through the public GitHub profile.

# Publishing `@viberaven/cli`

## Prerequisites

- npm account with access to the `@viberaven` scope (org must exist on npmjs.com)
- `npm login` on the publish machine
- `npm run build && npm run typecheck && npm test` passing

## Beta (canary)

```bash
cd packages/cli
npm version 0.1.0-beta.0   # or prerelease bump
npm run build
npm publish --tag beta --access public
```

Publish the unscoped shim so `npx viberaven` resolves (depends on `@viberaven/cli@beta`):

```bash
cd packages/viberaven-shim
npm version 0.1.0-beta.5   # keep in sync with @viberaven/cli
npm publish --tag beta --access public
```

Install for testers:

```bash
npx -y @viberaven/cli@beta login
npx -y @viberaven/cli@beta scan --open
npx -y viberaven@latest@beta connect --session <id> --token <token>
```

## Verify before / after publish

```bash
npm run verify:beta:smoke          # pack + local bin, no login
npm run verify:beta:live           # login + scan + artifacts (interactive)
```

With token:

```powershell
$env:VIBERAVEN_ACCESS_TOKEN = "<from login credentials.json>"
$env:VIBERAVEN_BETA_WORKDIR = "D:\VibeRice"
npm run verify:beta:live
```

## Production (`latest`)

After beta checklist passes:

```bash
npm version 0.1.0
npm publish --access public
```

Promote by publishing the same version without `@beta` tag, or `npm dist-tag add @viberaven/cli@0.1.0 latest`.

## API URL

The CLI defaults to the same managed API as the shipped extension:

`https://jaohiwzjhtwljyqligpu.supabase.co/functions/v1/viberice-api`

Override with `VIBERAVEN_API_URL` if needed.


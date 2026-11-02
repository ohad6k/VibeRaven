# Contributing a deterministic rule

Rules inspect local repository evidence. A finding must explain the supported pattern, its location, and a useful next step without claiming that a credential works or that a deployment is exposed. Never validate a key over the network, include its value in output, or add an automatic repair without separate review.

## RULE01: OpenAI browser credential wiring

Canonical finding: `openai_key_in_browser`. Audit group: `openai-browser-credential-boundary`. Added to the local, unpublished `1.7.0` candidate; this is not a claim about the published `1.6.12` package.

The rule uses the nearest recognized framework and the existing browser/server classifier. Supported evidence:

- Active `.env` definitions at the recognized app root under default `NEXT_PUBLIC_`, `VITE_`, `REACT_APP_`, or `EXPO_PUBLIC_` prefixes, containing an OpenAI-named credential-shaped literal or a direct reference to an OpenAI key variable. Custom Vite `root` or `envDir` definitions are not inferred.
- Static dot-property public env reads in recognized browser JS/TS code, with the accessor matching the framework (`import.meta.env` for Vite; `process.env` for the others). This proves wiring, not that the variable has a value.
- A credential-shaped literal passed directly as `apiKey` to a default-imported OpenAI SDK constructor in recognized browser JS/TS code, including an import alias.

Server-only files, tests, examples, env templates, comments, string/regex prose and ordinary placeholders are excluded. `dangerouslyAllowBrowser: true` alone is not evidence: user-provided keys, short-lived session credentials and proxy configurations require different analysis. Mismatched prefixes and customized Vite `envPrefix` are not inferred as exposure. Existing Supabase rule semantics remain separate.

Limits: no general data-flow or import-graph analysis, bracket/dynamic env access, named SDK imports, indirect key bindings, fetch authorization analysis, JSX expressions/markup, Vue/Svelte/HTML script parsing, custom bundler env configuration, Nuxt runtimeConfig, or SvelteKit public imports. A clean result means no supported pattern was found, not complete security coverage. A bounded or unreadable collection remains incomplete in the audit and existing station warning. Multiple locations share one canonical gap.

## Small positive and negative fixtures

Use a temporary Vite fixture with `package.json` containing `{"dependencies":{"vite":"^7","react":"^19"}}`. In `src/client.ts`, this is a positive wiring fixture without a key value:

```ts
const key = import.meta.env.VITE_OPENAI_API_KEY;
```

Run the locally built candidate from the fixture directory: `node /absolute/path/to/packages/cli/dist/cli.js check --json`. Expect `openai_key_in_browser`, critical severity, and `src/client.ts:1`; unrelated fixture findings may also appear. Keep the candidate version and command output with the test receipt.

For a negative fixture, remove the public read and keep application key access in a server-only file such as `server/chat.ts` using `process.env.OPENAI_API_KEY`. Run the same candidate again: this rule should disappear. An authenticated server endpoint is the intended application repair; the static fixture does not verify endpoint auth or a real provider call. Never put a working key in fixtures.

## Rule contribution recipe

1. Propose one canonical finding ID and a narrow supported pattern. Record the official source URL, date checked, relevant provider/framework or SDK versions, and what was actually verified. Separate current source guidance from a locally tested version.
2. Add synthetic positive fixtures and realistic negatives: server boundary, inert comments/examples/tests, placeholders, unsupported framework configuration, and the closest legitimate use that resembles the defect. A source match alone is insufficient evidence.
3. Reuse bounded collection and existing classifiers where their semantics fit. Add a collection signal only when needed, preserve incomplete-evidence reporting, and avoid runtime dependencies for a narrow check.
4. Test the actual collection → audit → station path, locations, redaction, and disappearance after a fixture repair. Check JSON, rendered output and copy prompts. Preserve S2 comparison/report behavior when a scan is incomplete.
5. Run focused tests plus CLI typecheck/build. Include false-positive risks and unsupported patterns in the review packet. A maintainer must review the evidence, severity, negative fixtures and user-facing wording before merge; adding a rule does not authorize publishing a release.

For this rule, the focused regression commands are:

```sh
npm --prefix packages/cli test -- openaiBrowserKey.test.ts audit.test.ts supabaseRls.test.ts localStation.test.ts checkChange.test.ts githubCi.test.ts githubPublisher.test.ts
npm --prefix packages/cli run typecheck
npm --prefix packages/cli run build
```

Implementation: `packages/cli/src/checks/openaiBrowserKey.ts`; fixtures and integration checks: `packages/cli/tests/openaiBrowserKey.test.ts`.

Official guidance reviewed for the S5 scope on 2026-10-26: [OpenAI key safety](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety), [OpenAI Node SDK browser support](https://github.com/openai/openai-node#requirements), [Next.js public env bundling](https://nextjs.org/docs/app/guides/environment-variables), and [Vite env exposure](https://vite.dev/guide/env-and-mode). Framework fixtures declare Next 15, Vite 7, Expo 54 and react-scripts 5 for classifier tests; they do not execute those frameworks or prove version-wide compatibility.

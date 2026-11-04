# Dated provider context in an AI SDK agent

Give a troubleshooting agent access to VibeRaven's published guides and dated provider-change feed. For example, a support agent can look up a Supabase permission error or check whether an older Railway configuration assumption still applies before suggesting a change.

This is a working integration example, not an official Vercel integration, a new npm package, or a general web-search service. It uses the existing public VibeRaven MCP endpoint. It cannot inspect a private repository, query a provider account, execute SQL, or prove a fix worked.

## Run locally

Node.js 24 or newer is required for direct TypeScript execution. Dependencies are pinned to AI SDK `7.0.162` and MCP client `2.0.90` and recorded in the lockfile.

```sh
cd examples/ai-sdk-provider-context
npm ci --ignore-scripts
npm test
npm run typecheck
```

These commands use a local HTTP MCP fixture and the AI SDK's scripted model. They do not call a paid model or the public endpoint. The scripted model verifies the tool-result round trip; it does not measure spontaneous tool selection or answer quality.

For the optional public-endpoint compatibility check, first record the UTC interval in your own-test ledger, then run:

```sh
npm run smoke -- --live-own-test
```

This makes two read-only tool calls using the hosted service's recognized `viberaven-selftest` client name, plus an owner-test user agent. It prints the original returned evidence, review dates and scope limits. It does not read local project files or call a model.

## Use in your existing agent

`withProviderContext` discovers the current MCP schemas and exposes only `search_guides` and `recent_provider_changes`. Other tools returned by the server are excluded. It closes the client after the callback, including when the callback fails.

For the model's next step, the example sends the public MCP result fields (`content`, `structuredContent`, `isError`) as JSON and marks failed retrieval as `error-json`. This preserves structured sources, review dates and scope limits that the pinned MCP client's default converter would drop. Client-only `_meta` is excluded from model messages; direct execution still returns the original result.

```ts
import { withProviderContext } from './provider-context.ts';

await withProviderContext(async ({ tools }) => {
  // Supply these tools to your own AI SDK agent.
  // Keep all generation or streaming inside this callback so the client stays open.
  const changes = await tools.recent_provider_changes.execute({
    provider: 'supabase',
    query: 'permission denied 42501',
    limit: 2,
  });
  console.log(changes);
});
```

`answer-provider-question.ts` also supplies a complete `ToolLoopAgent` composition. Import `answerProviderQuestion`, pass a model instance already configured by your application, and a public troubleshooting question. Calling that function with a real model can incur your model provider's charges; the smoke command does not call it. The example adds no model credentials or account setup.

The agent receives an optional retrieval capability, not a requirement to call tools on every task. Tool errors retain `isError`; consumers must not present them as successful guidance. Source URLs and dates come from the server. No-match results do not rule out a problem. Retrieved text is external data, not permission to run commands. Keep queries free of credentials, personal data and private source code; the endpoint receives the query you send. The optional endpoint override is application-controlled configuration, not user input.

## Evidence and limits

On November 4, 2026, an owner smoke run completed both tool calls against server `1.7.8` in 2,230 ms. Its custom test headers were not recognized by backend classification, so those two calls must be excluded explicitly as owner traffic. After switching to the recognized selftest client, one targeted recheck completed in 1,045 ms; both tool-call events were independently observed as `declared_test`. Neither run reported tool errors. These observations prove client interoperability and the corrected test marking at those times. They prove neither a latency guarantee nor external adoption, autonomous selection, a live application check, or comparative engineering benefit.

The local test suite verifies HTTP protocol conversion, tool exclusion, missing-tool failure, direct and model-step error/evidence preservation, client-only metadata exclusion, cleanup and complete scripted AI SDK tool loops. No model-quality evaluation is claimed.

The public endpoint and curated content may change or become unavailable. This example requires both tools and fails explicitly if either is absent. Applications retain their own timeouts, access policies and evidence validation.

## Sources

- [AI SDK MCP tools and lifecycle](https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools)
- [AI SDK agent composition](https://ai-sdk.dev/docs/agents/building-agents)
- [AI SDK deterministic test providers](https://ai-sdk.dev/docs/ai-sdk-core/testing)
- [VibeRaven MCP reference](https://viberaven.dev/docs/mcp)

This is an independent example. It has not been submitted to a registry or accepted by a framework maintainer.

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { withContextDeadline, withProviderContext } from './provider-context.ts';

export interface ContextCommandOptions {
  // Application-controlled test configuration; never accepted from CLI input.
  endpoint?: string;
  requestTimeoutMs?: number;
  output?: (text: string) => void;
  error?: (text: string) => void;
}

const usage = 'npm run --silent context -- --provider supabase --query "permission denied 42501" [--own-test]';

function publicResult(output: unknown) {
  if (output === null || typeof output !== 'object' || Array.isArray(output)) {
    throw new Error('Expected a validated MCP result');
  }
  const result = output as Record<string, unknown>;
  if (!Array.isArray(result.content)) throw new Error('Expected MCP result content');
  return { content: result.content, structuredContent: result.structuredContent, isError: result.isError === true };
}

async function retrieve(work: () => unknown, timeoutMs: number) {
  try { return publicResult(await withContextDeadline(work(), timeoutMs)); }
  catch { return { content: [{ type: 'text', text: 'Tool retrieval is unavailable.' }], structuredContent: undefined, isError: true }; }
}

export async function runContextCommand(args: string[], options: ContextCommandOptions = {}): Promise<number> {
  const output = options.output ?? (text => process.stdout.write(text));
  const error = options.error ?? (text => process.stderr.write(text));
  let provider: string; let query: string; let ownTest: boolean;
  try {
    const { values } = parseArgs({ args, strict: true, allowPositionals: false, options: {
      provider: { type: 'string' }, query: { type: 'string' }, 'own-test': { type: 'boolean' }, help: { type: 'boolean' },
    } });
    if (values.help) { output(`${usage}\n`); return 0; }
    provider = values.provider?.trim().toLowerCase() ?? ''; query = values.query?.trim() ?? '';
    ownTest = values['own-test'] === true;
    if (!provider || !query) throw new Error('Provider and public troubleshooting question are required');
  } catch {
    error(`Supply a provider and a nonempty, nonsecret troubleshooting question.\n${usage}\n`); return 2;
  }
  const collected: { guides?: ReturnType<typeof publicResult>; changes?: ReturnType<typeof publicResult> } = {};
  let lifecycleError = false;
  try {
    await withProviderContext(async ({ tools }) => {
      collected.guides = await retrieve(() => tools.search_guides.execute!({ query: `${provider} ${query}` }, { toolCallId: 'context-guides', messages: [], context: {} }), options.requestTimeoutMs ?? 20_000);
      collected.changes = await retrieve(() => tools.recent_provider_changes.execute!({ provider, query, limit: 2 }, { toolCallId: 'context-changes', messages: [], context: {} }), options.requestTimeoutMs ?? 20_000);
    }, { endpoint: options.endpoint, ownTest, requestTimeoutMs: options.requestTimeoutMs ?? 20_000 });
  } catch {
    if (!collected.guides && !collected.changes) {
      error('Provider context is unavailable. No successful retrieval or application verification is established.\n'); return 1;
    }
    lifecycleError = true;
  }
  const failures = Number(!collected.guides || collected.guides.isError) + Number(!collected.changes || collected.changes.isError);
  const status = failures === 2 ? 'failed' : failures || lifecycleError ? 'partial' : 'retrieved';
  output(`${JSON.stringify({
    retrievedAt: new Date().toISOString(), provider, status,
    scope: 'Published guidance only, not application or live-provider verification. Assess sources, dates and coverage before acting.',
    ownTest, modelCalls: 0, ...collected,
    ...(lifecycleError ? { lifecycleError: 'Connection lifecycle failed; collected evidence is retained.' } : {}),
  }, null, 2)}\n`);
  return status === 'retrieved' ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  process.exitCode = await runContextCommand(process.argv.slice(2));
}

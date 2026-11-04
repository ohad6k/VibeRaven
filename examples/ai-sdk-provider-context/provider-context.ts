import { createMCPClient } from '@ai-sdk/mcp';
import type { JSONValue } from 'ai';

const required = ['search_guides', 'recent_provider_changes'] as const;
type DiscoveredTools = Awaited<ReturnType<Awaited<ReturnType<typeof createMCPClient>>['tools']>>;
export type ProviderTools = Pick<DiscoveredTools, typeof required[number]>;

export async function withContextDeadline<T>(operation: PromiseLike<T> | T, timeoutMs?: number): Promise<T> {
  if (timeoutMs === undefined) return await operation;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error('MCP operation timed out')), timeoutMs); }),
    ]);
  } finally { if (timer) clearTimeout(timer); }
}

function providerModelOutput({ output }: { output: unknown }): { type: 'json' | 'error-json'; value: JSONValue } {
  if (output === null || typeof output !== 'object' || Array.isArray(output)) {
    throw new Error('Expected a validated MCP tool result');
  }
  const result = output as Record<string, unknown>;
  const value: Record<string, JSONValue> = {};
  // These fields were validated by the MCP client. _meta belongs to the client,
  // not the model; the default SDK converter drops structuredContent/isError.
  for (const field of ['content', 'structuredContent', 'isError']) {
    if (result[field] !== undefined) value[field] = result[field] as JSONValue;
  }
  return { type: result.isError === true ? 'error-json' : 'json', value };
}

export async function withProviderContext<T>(
  work: (context: { tools: ProviderTools }) => Promise<T>,
  options: { endpoint?: string; ownTest?: boolean; requestTimeoutMs?: number } = {},
): Promise<T> {
  if (options.requestTimeoutMs !== undefined && (!Number.isInteger(options.requestTimeoutMs) || options.requestTimeoutMs <= 0)) {
    throw new Error('requestTimeoutMs must be a positive integer');
  }
  const client = await createMCPClient({
    clientName: options.ownTest ? 'viberaven-selftest' : 'viberaven-ai-sdk-example',
    ...(options.requestTimeoutMs === undefined ? {} : { initializationOptions: { timeout: options.requestTimeoutMs } }),
    transport: {
      type: 'http',
      url: options.endpoint ?? 'https://viberaven.dev/mcp',
      ...(options.requestTimeoutMs === undefined ? {} : { fetch: (input, init) => fetch(input, {
        ...init,
        signal: AbortSignal.any([...(init?.signal ? [init.signal] : []), AbortSignal.timeout(options.requestTimeoutMs!)]),
      }) }),
      ...(options.ownTest ? { headers: { 'User-Agent': 'viberaven-own-test-ai-sdk', 'X-VibeRaven-Test': '1' } } : {}),
    },
  });
  try {
    // Aborting an SSE fetch alone does not reject a pending RPC in this SDK.
    // Bound the operation too, so timeout rejection reaches the cleanup below.
    const discovered = await withContextDeadline(client.tools(), options.requestTimeoutMs);
    for (const name of required) {
      if (!discovered[name]?.execute) throw new Error(`Required provider-context tool unavailable: ${name}`);
    }
    // Keep the original schemas, descriptions, execution output, and errors.
    // New tools offered by the server never enter the model's tool set implicitly.
    const tools: ProviderTools = {
      search_guides: { ...discovered.search_guides, toModelOutput: providerModelOutput },
      recent_provider_changes: { ...discovered.recent_provider_changes, toModelOutput: providerModelOutput },
    };
    return await work({ tools });
  } finally {
    await withContextDeadline(client.close(), options.requestTimeoutMs);
  }
}

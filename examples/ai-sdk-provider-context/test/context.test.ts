import { createServer } from 'node:http';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { withProviderContext } from '../provider-context.ts';
import { answerProviderQuestion } from '../answer-provider-question.ts';
import { MockLanguageModelV4 } from 'ai/test';

// A real HTTP MCP boundary, not a replacement for the AI SDK client.
async function fixture(options: { missing?: boolean; toolError?: boolean } = {}) {
  const calls: { name: string; arguments: unknown }[] = [];
  const clientNames: string[] = [];
  let closed = 0;
  const server = createServer(async (req, res) => {
    if (req.method === 'DELETE') { closed++; res.writeHead(200).end(); return; }
    if (req.method !== 'POST') { res.writeHead(405).end(); return; }
    let body = '';
    for await (const chunk of req) body += chunk;
    const rpc = JSON.parse(body);
    if (rpc.id === undefined) { res.writeHead(202).end(); return; }
    res.setHeader('Content-Type', 'application/json');
    let result;
    if (rpc.method === 'initialize') {
      clientNames.push(rpc.params.clientInfo.name);
      res.setHeader('mcp-session-id', 'local-fixture');
      result = { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'fixture', version: '1' } };
    } else if (rpc.method === 'tools/list') {
      const names = ['search_guides', ...(options.missing ? [] : ['recent_provider_changes']), 'delete_project'];
      result = { tools: names.map(name => ({ name, description: name, inputSchema: { type: 'object', properties: { query: { type: 'string' } } } })) };
    } else if (rpc.method === 'tools/call') {
      calls.push(rpc.params);
      result = options.toolError
        ? { isError: true, content: [{ type: 'text', text: 'invalid_input: query' }], structuredContent: { officialSource: 'https://official.example.invalid/fixture', reviewedAt: '2026-11-04', limits: 'Fixture only. Not a live check.' }, _meta: { clientOnly: 'not-for-model' } }
        : { content: [{ type: 'text', text: JSON.stringify({ results: [{ title: 'Fixture only', url: 'https://example.invalid/guide', answer: 'Not a live check.' }] }) }], structuredContent: { officialSource: 'https://official.example.invalid/fixture', reviewedAt: '2026-11-04', limits: 'Fixture only. Not a live check.' }, _meta: { clientOnly: 'not-for-model' } };
    } else {
      res.end(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, error: { code: -32601, message: 'Method not found' } })); return;
    }
    res.end(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, result }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address === 'object');
  return {
    endpoint: `http://127.0.0.1:${address.port}/mcp`, calls, clientNames,
    closed: () => closed,
    stop: () => new Promise<void>((resolve, reject) => { server.closeAllConnections(); server.close(error => error ? reject(error) : resolve()); }),
  };
}

test('converts HTTP MCP tools for AI SDK, excludes unrelated tools, preserves evidence, and closes', async () => {
  const f = await fixture();
  try {
    const result = await withProviderContext(async ({ tools }) => {
      assert.deepEqual(Object.keys(tools).sort(), ['recent_provider_changes', 'search_guides']);
      assert.equal('delete_project' in tools, false);
      return await tools.search_guides.execute!({ query: 'supabase grants' }, { toolCallId: 'fixture', messages: [], context: {} });
    }, { endpoint: f.endpoint });
    assert.match(JSON.stringify(result), /example.invalid\/guide/);
    assert.match(JSON.stringify(result), /Not a live check/);
    assert.deepEqual(f.calls.map(c => ({ name: c.name, arguments: c.arguments })), [{ name: 'search_guides', arguments: { query: 'supabase grants' } }]);
    assert.equal(f.closed(), 1);
  } finally { await f.stop(); }
});

test('owner smoke uses the exact selftest client recognized by the hosted usage contract', async () => {
  const f = await fixture();
  try {
    await withProviderContext(async () => {}, { endpoint: f.endpoint, ownTest: true });
    assert.deepEqual(f.clientNames, ['viberaven-selftest']);
  } finally { await f.stop(); }
});

test('closes the session when the consumer fails', async () => {
  const f = await fixture();
  try {
    await assert.rejects(withProviderContext(async () => { throw new Error('consumer failed'); }, { endpoint: f.endpoint }), /consumer failed/);
    assert.equal(f.closed(), 1);
  } finally { await f.stop(); }
});

test('a missing required tool fails explicitly and closes before handing tools to an agent', async () => {
  const f = await fixture({ missing: true });
  try {
    let invoked = false;
    await assert.rejects(withProviderContext(async () => { invoked = true; }, { endpoint: f.endpoint }), /recent_provider_changes/);
    assert.equal(invoked, false);
    assert.equal(f.closed(), 1);
  } finally { await f.stop(); }
});

test('MCP tool errors remain failures rather than successful guidance', async () => {
  const f = await fixture({ toolError: true });
  try {
    const result = await withProviderContext(async ({ tools }) => {
      return await tools.search_guides.execute!({ query: '' }, { toolCallId: 'invalid-fixture', messages: [], context: {} });
    }, { endpoint: f.endpoint });
    assert.equal((result as { isError?: boolean }).isError, true);
    assert.match(JSON.stringify(result), /invalid_input/);
    assert.equal(f.calls.length, 1);
    assert.equal(f.closed(), 1);
  } finally { await f.stop(); }
});

test('the AI SDK agent loop receives the actual HTTP tool result before its answer (scripted model)', async () => {
  const f = await fixture();
  try {
    const model = new MockLanguageModelV4({ doGenerate: async (request) => {
      const hasResult = request.prompt.some(message => message.role === 'tool');
      if (hasResult) {
        const prompt = JSON.stringify(request.prompt);
        assert.match(prompt, /example.invalid\/guide/);
        assert.match(prompt, /official.example.invalid\/fixture/);
        assert.match(prompt, /2026-11-04/);
        assert.doesNotMatch(prompt, /not-for-model/);
      }
      return {
        content: hasResult
          ? [{ type: 'text', text: 'Fixture only. Not a live check. https://example.invalid/guide' }]
          : [{ type: 'tool-call', toolCallId: 'scripted-1', toolName: 'search_guides', input: JSON.stringify({ query: 'supabase grants' }) }],
        finishReason: { unified: hasResult ? 'stop' : 'tool-calls', raw: undefined },
        usage: { inputTokens: { total: 0, noCache: 0, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 0, text: 0, reasoning: undefined } },
        warnings: [],
      };
    } });
    const result = await answerProviderQuestion(model, 'Why does a new table fail with permission denied?', { endpoint: f.endpoint });
    assert.match(result.text, /Not a live check/);
    assert.equal(model.doGenerateCalls.length, 2);
    assert.equal(f.calls.length, 1);
    assert.equal(f.closed(), 1);
  } finally { await f.stop(); }
});

test('the next model step retains MCP failure status and structured evidence but excludes client-only metadata', async () => {
  const f = await fixture({ toolError: true });
  try {
    const model = new MockLanguageModelV4({ doGenerate: async (request) => {
      const hasResult = request.prompt.some(message => message.role === 'tool');
      if (hasResult) {
        const prompt = JSON.stringify(request.prompt);
        assert.match(prompt, /"isError":true/);
        assert.match(prompt, /invalid_input/);
        assert.match(prompt, /official.example.invalid\/fixture/);
        assert.match(prompt, /2026-11-04/);
        assert.match(prompt, /Not a live check/);
        assert.doesNotMatch(prompt, /not-for-model/);
      }
      return {
        content: hasResult
          ? [{ type: 'text', text: 'Retrieval failed; this did not check the app.' }]
          : [{ type: 'tool-call', toolCallId: 'scripted-error', toolName: 'search_guides', input: JSON.stringify({ query: 'supabase grants' }) }],
        finishReason: { unified: hasResult ? 'stop' : 'tool-calls', raw: undefined },
        usage: { inputTokens: { total: 0, noCache: 0, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 0, text: 0, reasoning: undefined } },
        warnings: [],
      };
    } });
    const result = await answerProviderQuestion(model, 'Why did this retrieval fail?', { endpoint: f.endpoint });
    assert.match(result.text, /Retrieval failed/);
    assert.equal(model.doGenerateCalls.length, 2);
    assert.equal(f.calls.length, 1);
    assert.equal(f.closed(), 1);
  } finally { await f.stop(); }
});

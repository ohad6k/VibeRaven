import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { runContextCommand } from '../context.ts';

async function fixture(failGuides = false, hangList = false, failChangesRpc = false, openSse?: 'catalog' | 'guides') {
  const names: string[] = [];
  const calls: { name: string; arguments: Record<string, unknown> }[] = [];
  let closed = 0;
  const server = createServer(async (req, res) => {
    if (req.method === 'DELETE') { closed++; res.writeHead(200).end(); return; }
    if (req.method !== 'POST') { res.writeHead(405).end(); return; }
    let body = '';
    for await (const chunk of req) body += chunk;
    const rpc = JSON.parse(body);
    if (rpc.id === undefined) { res.writeHead(202).end(); return; }
    if ((openSse === 'catalog' && rpc.method === 'tools/list') || (openSse === 'guides' && rpc.method === 'tools/call' && rpc.params.name === 'search_guides')) {
      res.setHeader('Content-Type', 'text/event-stream'); res.writeHead(200); res.write(': waiting\n\n'); return;
    }
    res.setHeader('Content-Type', 'application/json');
    let result;
    if (rpc.method === 'initialize') {
      names.push(rpc.params.clientInfo.name);
      res.setHeader('mcp-session-id', 'context-command-fixture');
      result = { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'fixture', version: '1' } };
    } else if (rpc.method === 'tools/list') {
      if (hangList) return;
      result = { tools: ['search_guides', 'recent_provider_changes'].map(name => ({ name, inputSchema: { type: 'object', properties: {} } })) };
    } else if (rpc.method === 'tools/call') {
      calls.push(rpc.params);
      if (failChangesRpc && rpc.params.name === 'recent_provider_changes') {
        res.end(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, error: { code: -32603, message: 'fixture-private-error-detail' } })); return;
      }
      const failed = failGuides && rpc.params.name === 'search_guides';
      result = {
        content: [{ type: 'text', text: failed ? 'Retrieval unavailable' : 'Fixture guidance only' }],
        structuredContent: { source: 'https://official.example.invalid/context', reviewedAt: '2026-11-04', scope: 'Fixture only, not app verification' },
        isError: failed,
        _meta: { clientOnly: 'do-not-print-client-metadata' },
      };
    } else {
      res.end(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, error: { code: -32601, message: 'Method not found' } })); return;
    }
    res.end(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, result }));
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert(address && typeof address === 'object');
  return { endpoint: `http://127.0.0.1:${address.port}/mcp`, names, calls, closed: () => closed,
    stop: () => new Promise<void>((resolve, reject) => { server.closeAllConnections(); server.close(error => error ? reject(error) : resolve()); }) };
}

const question = ['--provider', 'supabase', '--query', 'permission denied 42501'];

test('a normal question returns dated context through actual HTTP without a model or selftest identity', async () => {
  const f = await fixture(); const output: string[] = []; const errors: string[] = [];
  try {
    const code = await runContextCommand(question, { endpoint: f.endpoint, output: s => output.push(s), error: s => errors.push(s) });
    assert.equal(code, 0); assert.deepEqual(errors, []);
    assert.deepEqual(f.names, ['viberaven-ai-sdk-example']);
    assert.deepEqual(f.calls, [
      { name: 'search_guides', arguments: { query: 'supabase permission denied 42501' } },
      { name: 'recent_provider_changes', arguments: { provider: 'supabase', query: 'permission denied 42501', limit: 2 } },
    ]);
    const text = output.join(''); const result = JSON.parse(text);
    assert.equal(result.status, 'retrieved'); assert.equal(result.modelCalls, 0);
    assert.match(text, /official.example.invalid\/context/); assert.match(text, /2026-11-04/);
    assert.match(result.scope, /not.*verif/i); assert.doesNotMatch(text, /do-not-print-client-metadata|_meta/);
    assert.equal(f.closed(), 1);
  } finally { await f.stop(); }
});

test('explicit owner verification uses the recognized selftest identity', async () => {
  const f = await fixture();
  try {
    assert.equal(await runContextCommand([...question, '--own-test'], { endpoint: f.endpoint, output: () => {}, error: () => {} }), 0);
    assert.deepEqual(f.names, ['viberaven-selftest']); assert.equal(f.closed(), 1);
  } finally { await f.stop(); }
});

test('a failed retrieval remains an error with evidence and nonzero exit rather than successful guidance', async () => {
  const f = await fixture(true); const output: string[] = [];
  try {
    assert.equal(await runContextCommand(question, { endpoint: f.endpoint, output: s => output.push(s), error: () => {} }), 1);
    const result = JSON.parse(output.join(''));
    assert.equal(result.status, 'partial'); assert.equal(result.guides.isError, true);
    assert.equal(result.changes.isError, false);
    assert.match(output.join(''), /Retrieval unavailable/); assert.doesNotMatch(output.join(''), /do-not-print-client-metadata/);
    assert.equal(f.closed(), 1);
  } finally { await f.stop(); }
});

test('help and malformed questions never connect to a server', async () => {
  const f = await fixture(); const errors: string[] = []; const output: string[] = [];
  try {
    const options = { endpoint: f.endpoint, output: (s: string) => output.push(s), error: (s: string) => errors.push(s) };
    assert.equal(await runContextCommand(['--help'], options), 0); assert.match(output.join(''), /--provider.*--query/s);
    for (const args of [[], ['--provider', 'supabase'], ['--provider', 'supabase', '--query', '  '], [...question, '--endpoint', 'http://example.invalid']]) {
      assert.equal(await runContextCommand(args, options), 2);
    }
    assert.equal(errors.length, 4); assert.deepEqual(f.names, []); assert.deepEqual(f.calls, []);
  } finally { await f.stop(); }
});

test('an unresponsive tool catalog times out and closes its initialized session', async () => {
  const f = await fixture(false, true); const errors: string[] = [];
  try {
    assert.equal(await runContextCommand(question, { endpoint: f.endpoint, requestTimeoutMs: 200, output: () => {}, error: s => errors.push(s) }), 1);
    assert.match(errors.join(''), /unavailable/i); assert.equal(f.closed(), 1); assert.deepEqual(f.calls, []);
  } finally { await f.stop(); }
});

test('later RPC failure preserves earlier structured error evidence without echoing transport details', async () => {
  const f = await fixture(true, false, true); const output: string[] = [];
  try {
    assert.equal(await runContextCommand(question, { endpoint: f.endpoint, output: s => output.push(s), error: () => {} }), 1);
    const text = output.join(''); const result = JSON.parse(text);
    assert.equal(result.status, 'failed'); assert.equal(result.guides.isError, true); assert.equal(result.changes.isError, true);
    assert.match(text, /official.example.invalid\/context/); assert.match(text, /2026-11-04/); assert.match(text, /Retrieval unavailable/);
    assert.doesNotMatch(text, /fixture-private-error-detail|do-not-print-client-metadata/); assert.equal(f.closed(), 1);
  } finally { await f.stop(); }
});

for (const mode of ['catalog', 'guides'] as const) {
  test(`an open SSE ${mode} response cannot leave the command waiting indefinitely`, async () => {
    const f = await fixture(false, false, false, mode); const output: string[] = []; const errors: string[] = [];
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        runContextCommand(question, { endpoint: f.endpoint, requestTimeoutMs: 100, output: s => output.push(s), error: s => errors.push(s) }),
        new Promise<string>(resolve => { timeout = setTimeout(() => resolve('still waiting'), 1200); }),
      ]);
      assert.equal(result, 1); assert.equal(f.closed(), 1);
      if (mode === 'catalog') assert.match(errors.join(''), /unavailable/i);
      else {
        const value = JSON.parse(output.join('')); assert.equal(value.status, 'partial');
        assert.equal(value.guides.isError, true); assert.equal(value.changes.isError, false);
        assert.match(output.join(''), /official.example.invalid\/context/);
      }
    } finally { if (timeout) clearTimeout(timeout); await f.stop(); }
  });
}

import { afterEach, describe, expect, it } from 'vitest';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  ALL_TOOLS,
  callTool,
  handleRequest,
  parseJsonObjectFromToolText,
  __setSpawnForTest,
  __resetSpawnForTest
} = require('../dist/tools/index.js');

const spawned = [];
let nextCloseCode = 0;
let nextStdout = 'ok';
let nextStderr = '';

afterEach(() => { spawned.length = 0; nextCloseCode = 0; nextStdout = 'ok'; nextStderr = ''; __resetSpawnForTest(); });

function fakeSpawn() {
  __setSpawnForTest((command, args, options) => {
    spawned.push({ command, args, options });
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    process.nextTick(() => {
      if (nextStdout) child.stdout.emit('data', Buffer.from(nextStdout));
      if (nextStderr) child.stderr.emit('data', Buffer.from(nextStderr));
      child.emit('close', nextCloseCode);
    });
    return child;
  });
}

function capturedCliArgs(call) {
  if (call.command === 'cmd.exe') {
    expect(call.args.slice(0, 4)).toEqual(['/d', '/s', '/c', 'npx']);
    return call.args.slice(4);
  }
  expect(call.command).toBe('npx');
  return call.args;
}

describe('@viberaven/mcp server contract', () => {
  it('exposes the canonical agent tools', () => {
    expect(ALL_TOOLS.map((t) => t.name)).toEqual([
      'viberaven_check_readiness', 'viberaven_verify', 'viberaven_audit',
      'viberaven_init_rules', 'viberaven_clean_plan', 'viberaven_strict_gate',
      'viberaven_gate_result', 'viberaven_context_map', 'viberaven_actions',
      'viberaven_verify_action', 'viberaven_heal_plan', 'viberaven_heal_prompt',
      'viberaven_heal_apply', 'viberaven_validate_npm_package',
    ]);
  });

  it('routes readiness to agent mode', async () => {
    fakeSpawn();
    await callTool('viberaven_check_readiness', { cwd: 'D:/app' });
    expect(spawned).toHaveLength(1);
    expect(capturedCliArgs(spawned[0])).toEqual(['-y', '@viberaven/cli', '--agent-mode']);
    expect(spawned[0].options.cwd).toBe('D:/app');
  });

  it('routes audit json exactly once', async () => {
    fakeSpawn();
    await callTool('viberaven_audit', { cwd: 'D:/app', json: true });
    expect(capturedCliArgs(spawned[0])).toEqual(['-y', '@viberaven/cli', 'audit', '--vercel-supabase', '--json']);
  });

  it('routes heal apply with yes', async () => {
    fakeSpawn();
    await callTool('viberaven_heal_apply', { cwd: 'D:/app', target: 'app/api/route.ts', yes: true });
    expect(capturedCliArgs(spawned[0])).toEqual(['-y', '@viberaven/cli', '--heal', '--apply', '--target', 'app/api/route.ts', '--yes']);
  });

  it('returns structured content when output contains JSON', async () => {
    fakeSpawn();
    nextStdout = '{"gate":{"status":"clear"}}';
    const result = await handleRequest('tools/call', { name: 'viberaven_gate_result', arguments: { cwd: 'D:/app' } });
    expect(result.structuredContent).toEqual({ gate: { status: 'clear' } });
  });

  it('parseJsonObjectFromToolText is exported and parses embedded JSON', () => {
    expect(parseJsonObjectFromToolText('exit 0\n{"gate":{"status":"clear"}}')).toEqual({ gate: { status: 'clear' } });
    expect(parseJsonObjectFromToolText('no json here')).toBeUndefined();
  });

  it('rejects unsafe heal targets before spawning', async () => {
    fakeSpawn();
    await expect(callTool('viberaven_heal_apply', { target: 'app & whoami' })).rejects.toThrow('Unsafe characters in target');
    expect(spawned).toHaveLength(0);
  });

  it('returns nonzero exit output as text', async () => {
    fakeSpawn();
    nextCloseCode = 1; nextStdout = 'scan failed';
    const text = await callTool('viberaven_check_readiness', {});
    expect(text).toContain('exit 1');
    expect(text).toContain('scan failed');
  });
});

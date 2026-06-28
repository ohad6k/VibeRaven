import { describe, expect, it, afterEach } from 'vitest';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { runVibeRaven, buildToolArgs, safeStringArg, __setSpawnForTest, __resetSpawnForTest } =
  require('../dist/lib/cli-runner.js');

const spawned = [];
afterEach(() => { spawned.length = 0; __resetSpawnForTest(); });

function fakeSpawn() {
  __setSpawnForTest((command, args, options) => {
    spawned.push({ command, args, options });
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    process.nextTick(() => {
      child.stdout.emit('data', Buffer.from('ok'));
      child.emit('close', 0);
    });
    return child;
  });
}

describe('cli-runner', () => {
  it('routes readiness to --agent-mode', () => {
    expect(buildToolArgs('viberaven_check_readiness', {})).toEqual(['--agent-mode']);
  });

  it('routes audit with json flag', () => {
    expect(buildToolArgs('viberaven_audit', { json: true })).toEqual(['audit', '--vercel-supabase', '--json']);
  });

  it('routes heal apply with yes', () => {
    expect(buildToolArgs('viberaven_heal_apply', { target: 'a.ts', yes: true }))
      .toEqual(['--heal', '--apply', '--target', 'a.ts', '--yes']);
  });

  it('spawns npx -y @viberaven/cli with the given cwd', async () => {
    fakeSpawn();
    await runVibeRaven(['--agent-mode'], 'D:/app');
    expect(spawned[0].args).toEqual(expect.arrayContaining(['-y', '@viberaven/cli', '--agent-mode']));
    expect(spawned[0].options.cwd).toBe('D:/app');
  });

  it('rejects unsafe target strings', () => {
    expect(() => safeStringArg('a & b', 'target')).toThrow('Unsafe characters in target');
  });
});

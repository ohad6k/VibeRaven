import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it } from 'vitest';
import {
  CLI_MCP_TOOLS,
  buildLocalCliArgs,
  callVibeRavenMcpTool,
  setMcpSpawnForTest
} from '../src/mcpServer';

const spawned: Array<{ command: string; args: string[]; options: { cwd?: string; shell?: boolean } }> = [];
let nextCloseCode: number | null = 0;
let nextStdout = 'ok';
let nextStderr = '';

afterEach(() => {
  spawned.length = 0;
  nextCloseCode = 0;
  nextStdout = 'ok';
  nextStderr = '';
  setMcpSpawnForTest();
});

function installSpawnStub(): void {
  setMcpSpawnForTest(((command: string, args: string[], options: { cwd?: string; shell?: boolean }) => {
    spawned.push({ command, args, options });
    const child = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
    };
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();

    process.nextTick(() => {
      if (nextStdout) child.stdout.emit('data', Buffer.from(nextStdout));
      if (nextStderr) child.stderr.emit('data', Buffer.from(nextStderr));
      child.emit('close', nextCloseCode);
    });

    return child;
  }) as never);
}

function tempCwd(): string {
  return mkdtempSync(join(tmpdir(), 'viberaven-cli-mcp-'));
}

function capturedVibeRavenArgs(call: { command: string; args: string[] }): string[] {
  expect(call.command).toBe(process.execPath);
  expect(call.args[0]).toMatch(/cli\.(js|ts)$/);
  return call.args.slice(1);
}

describe('CLI MCP server', () => {
  it('exposes the main-package MCP tools', () => {
    const names = CLI_MCP_TOOLS.map((tool) => tool.name);
    expect(names).toEqual([
      'viberaven_check_readiness',
      'viberaven_verify',
      'viberaven_audit',
      'viberaven_init_rules',
      'viberaven_clean_plan',
      'viberaven_strict_gate',
      'viberaven_gate_result',
      'viberaven_context_map',
      'viberaven_actions',
      'viberaven_verify_action',
      'viberaven_heal_plan',
      'viberaven_heal_prompt',
      'viberaven_heal_apply',
      'viberaven_provider_verify',
      'viberaven_validate_npm_package'
    ]);
    expect(names).toContain('viberaven_strict_gate');
    expect(names).toContain('viberaven_gate_result');
    expect(names).toContain('viberaven_context_map');
    expect(names).toContain('viberaven_actions');
    expect(names).toContain('viberaven_verify_action');
    expect(names).toContain('viberaven_heal_plan');
    expect(names).toContain('viberaven_heal_prompt');
    expect(names).toContain('viberaven_heal_apply');
  });

  it('builds local CLI args without relying on process.argv[1]', () => {
    const args = buildLocalCliArgs(['--verify']);

    expect(args[0]).toMatch(/cli\.(js|ts)$/);
    expect(args.slice(1)).toEqual(['--verify']);
  });

  it('routes readiness to agent mode instead of the interactive menu', async () => {
    installSpawnStub();
    const cwd = tempCwd();

    const text = await callVibeRavenMcpTool('viberaven_check_readiness', { cwd });

    expect(text).toBe('exit 0\nok');
    expect(spawned).toHaveLength(1);
    expect(capturedVibeRavenArgs(spawned[0])).toEqual(['--agent-mode']);
    expect(spawned[0].options.cwd).toBe(cwd);
    expect(spawned[0].options.shell).toBe(false);
  });

  it('routes verify to --verify on the local CLI', async () => {
    installSpawnStub();

    await callVibeRavenMcpTool('viberaven_verify', { cwd: tempCwd() });

    expect(spawned).toHaveLength(1);
    expect(capturedVibeRavenArgs(spawned[0])).toEqual(['--verify']);
  });

  it('routes verify forceScan to --verify --force-scan on the local CLI', async () => {
    installSpawnStub();

    await callVibeRavenMcpTool('viberaven_verify', { cwd: tempCwd(), forceScan: true });

    expect(spawned).toHaveLength(1);
    expect(capturedVibeRavenArgs(spawned[0])).toEqual(['--verify', '--force-scan']);
  });

  it('routes audit json to audit --vercel-supabase --json on the local CLI', async () => {
    installSpawnStub();

    await callVibeRavenMcpTool('viberaven_audit', { cwd: tempCwd(), json: true });

    expect(spawned).toHaveLength(1);
    expect(capturedVibeRavenArgs(spawned[0])).toEqual(['audit', '--vercel-supabase', '--json']);
  });

  it('routes strict gate to --agent-mode --strict --json', async () => {
    installSpawnStub();
    const cwd = tempCwd();

    const text = await callVibeRavenMcpTool('viberaven_strict_gate', { cwd });

    expect(capturedVibeRavenArgs(spawned[0])).toEqual(['--agent-mode', '--strict', '--json']);
    expect(text).toContain('exit 0');
  });

  it('routes context map to --condense', async () => {
    installSpawnStub();

    await callVibeRavenMcpTool('viberaven_context_map', { cwd: tempCwd() });

    expect(capturedVibeRavenArgs(spawned[0])).toEqual(['--condense']);
  });

  it('routes action tools to stable CLI action commands', async () => {
    installSpawnStub();
    const cwd = tempCwd();

    await callVibeRavenMcpTool('viberaven_actions', { cwd });
    await callVibeRavenMcpTool('viberaven_verify_action', { cwd, actionId: 'VR-A1' });

    expect(capturedVibeRavenArgs(spawned[0])).toEqual(['actions']);
    expect(capturedVibeRavenArgs(spawned[1])).toEqual(['--verify', '--action', 'VR-A1']);
  });

  it('routes heal tools with target and yes flag', async () => {
    installSpawnStub();
    const cwd = tempCwd();

    await callVibeRavenMcpTool('viberaven_heal_apply', { cwd, target: 'app/api/route.ts', yes: true });

    expect(capturedVibeRavenArgs(spawned[0])).toEqual(['--heal', '--apply', '--target', 'app/api/route.ts', '--yes']);
  });

  it('routes provider verify to provider-verify with provider, check, and plan', async () => {
    installSpawnStub();

    await callVibeRavenMcpTool('viberaven_provider_verify', {
      cwd: tempCwd(),
      provider: 'supabase',
      check: 'rls_profiles',
      plan: 'pro',
    });

    expect(capturedVibeRavenArgs(spawned[0])).toEqual([
      'provider-verify',
      '--provider',
      'supabase',
      '--check',
      'rls_profiles',
      '--plan',
      'pro',
    ]);
  });

  it('routes npm package validation to validate-npm-package --json', async () => {
    installSpawnStub();

    await callVibeRavenMcpTool('viberaven_validate_npm_package', {
      packageName: 'lodash',
      packageNames: ['react'],
    });

    expect(capturedVibeRavenArgs(spawned[0])).toEqual([
      'validate-npm-package',
      '--json',
      'lodash',
      'react',
    ]);
  });
});

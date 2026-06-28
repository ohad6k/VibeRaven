import { spawn } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { VERSION } from './version';

type SpawnLike = typeof spawn;

const cwdSchema = {
  type: 'object',
  properties: {
    cwd: { type: 'string', description: 'Project root. Defaults to the MCP server working directory.' }
  },
  additionalProperties: false
};

const verifySchema = {
  type: 'object',
  properties: {
    cwd: { type: 'string', description: 'Project root. Defaults to the MCP server working directory.' },
    forceScan: { type: 'boolean', description: 'Spend a scan even when the local heal batch is not full yet.' }
  },
  additionalProperties: false
};

const healSchema = {
  type: 'object',
  properties: {
    cwd: { type: 'string' },
    target: { type: 'string' },
    gap: { type: 'string' },
    yes: { type: 'boolean' }
  },
  additionalProperties: false
};

export const CLI_MCP_TOOLS = [
  {
    name: 'viberaven_check_readiness',
    description: 'Run the main VibeRaven production-readiness check from the current project.',
    inputSchema: cwdSchema
  },
  {
    name: 'viberaven_verify',
    description: 'Rescan and refresh VibeRaven production-readiness artifacts after a fix.',
    inputSchema: verifySchema
  },
  {
    name: 'viberaven_audit',
    description: 'Run local Vercel/Supabase production checks for RLS, service-role boundaries, and Vercel pooler usage.',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: 'Project root. Defaults to current working directory.' },
        json: { type: 'boolean', description: 'Return JSON output.' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'viberaven_init_rules',
    description: 'Install bounded VibeRaven rules into native AI instruction files.',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: 'Project root. Defaults to current working directory.' },
        agents: { type: 'string', description: 'Comma-separated agent targets, or all.' },
        dryRun: { type: 'boolean', description: 'Preview changes without writing files.' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'viberaven_clean_plan',
    description: 'Write a non-destructive context cleanup plan for generated artifacts and logs.',
    inputSchema: cwdSchema
  },
  {
    name: 'viberaven_strict_gate',
    description: 'Run VibeRaven agent-mode strict gate and return the machine verdict.',
    inputSchema: cwdSchema
  },
  {
    name: 'viberaven_gate_result',
    description: 'Run VibeRaven agent-mode JSON output and return gate-result.json content.',
    inputSchema: cwdSchema
  },
  {
    name: 'viberaven_context_map',
    description: 'Refresh .viberaven/context-map.json from the last scan.',
    inputSchema: cwdSchema
  },
  {
    name: 'viberaven_actions',
    description: 'Read the current VibeRaven chat-native action surface from .viberaven/actions.json.',
    inputSchema: cwdSchema
  },
  {
    name: 'viberaven_verify_action',
    description: 'Verify or explain the lifecycle state for a stable VibeRaven action ID.',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string' },
        actionId: { type: 'string' }
      },
      required: ['actionId'],
      additionalProperties: false
    }
  },
  {
    name: 'viberaven_heal_plan',
    description: 'Write a non-destructive VibeRaven heal plan for a target file or gap.',
    inputSchema: healSchema
  },
  {
    name: 'viberaven_heal_prompt',
    description: 'Write an agent-ready VibeRaven heal prompt for a target file or gap.',
    inputSchema: healSchema
  },
  {
    name: 'viberaven_heal_apply',
    description: 'Apply a guarded VibeRaven repo-code heal recipe when supported.',
    inputSchema: healSchema
  },
  {
    name: 'viberaven_provider_verify',
    description:
      'Verify that a provider-action gap has been resolved by querying the provider MCP (Supabase, Vercel). Pro plan only.',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string' },
        provider: { type: 'string', description: 'supabase | vercel' },
        check: { type: 'string', description: 'Gap check identifier, e.g. rls_profiles' },
        plan: { type: 'string', description: 'User plan: free | pro' }
      },
      required: ['provider', 'check'],
      additionalProperties: false
    }
  },
  {
    name: 'viberaven_validate_npm_package',
    description:
      'Check whether an npm package name exists and looks safe before install. Always run viberaven --agent-mode after adding dependencies.',
    inputSchema: {
      type: 'object',
      properties: {
        packageName: { type: 'string', description: 'Single npm package name to validate.' },
        packageNames: {
          type: 'array',
          items: { type: 'string' },
          description: 'Multiple npm package names to validate in one call.'
        }
      },
      additionalProperties: false
    }
  }
] as const;

let spawnChild: SpawnLike = spawn;
let buffer = Buffer.alloc(0);

export function setMcpSpawnForTest(spawnForTest?: SpawnLike): void {
  spawnChild = spawnForTest ?? spawn;
}

export function buildLocalCliArgs(args: string[]): string[] {
  const currentFile = __filename;
  const currentBase = basename(currentFile).toLowerCase();
  const cliEntry =
    currentBase === 'cli.js' || currentBase === 'cli.ts'
      ? currentFile
      : join(dirname(currentFile), currentBase.endsWith('.ts') ? 'cli.ts' : 'cli.js');

  return [cliEntry, ...args];
}

function resolveCwd(cwd: unknown): string {
  if (cwd === undefined || cwd === null) {
    return process.cwd();
  }

  if (typeof cwd !== 'string') {
    throw new Error('Invalid cwd: expected string');
  }

  if (!cwd.trim()) {
    throw new Error('Invalid cwd: expected non-empty string');
  }

  if (!existsSync(cwd)) {
    throw new Error(`Invalid cwd: directory does not exist: ${cwd}`);
  }

  if (!statSync(cwd).isDirectory()) {
    throw new Error(`Invalid cwd: not a directory: ${cwd}`);
  }

  return cwd;
}

function safeStringArg(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${label}: expected string`);
  }

  if (!value.trim()) {
    throw new Error(`Invalid ${label}: expected non-empty string`);
  }

  if (/[&|<>^%!"\r\n]/.test(value)) {
    throw new Error(`Unsafe characters in ${label}`);
  }

  return value;
}

function buildToolArgs(name: string, input: Record<string, unknown>): string[] {
  if (name === 'viberaven_check_readiness') {
    return ['--agent-mode'];
  }
  if (name === 'viberaven_verify') {
    return ['--verify', ...(input.forceScan === true ? ['--force-scan'] : [])];
  }
  if (name === 'viberaven_audit') {
    return ['audit', '--vercel-supabase', ...(input.json ? ['--json'] : [])];
  }
  if (name === 'viberaven_init_rules') {
    const args = ['init'];
    if (input.agents !== undefined) {
      args.push('--agents', safeStringArg(input.agents, 'agents'));
    }
    if (input.dryRun) {
      args.push('--dry-run');
    }
    return args;
  }
  if (name === 'viberaven_clean_plan') {
    return ['clean', '--plan'];
  }
  if (name === 'viberaven_strict_gate') {
    return ['--agent-mode', '--strict', '--json'];
  }
  if (name === 'viberaven_gate_result') {
    return ['--agent-mode', '--json'];
  }
  if (name === 'viberaven_context_map') {
    return ['--condense'];
  }
  if (name === 'viberaven_actions') {
    return ['actions'];
  }
  if (name === 'viberaven_verify_action') {
    return ['--verify', '--action', safeStringArg(input.actionId, 'actionId')];
  }
  if (name === 'viberaven_heal_plan') {
    const args = ['--heal', '--plan'];
    if (typeof input.target === 'string') args.push('--target', input.target);
    if (typeof input.gap === 'string') args.push('--gap', input.gap);
    return args;
  }
  if (name === 'viberaven_heal_prompt') {
    const args = ['--heal', '--prompt'];
    if (typeof input.target === 'string') args.push('--target', input.target);
    if (typeof input.gap === 'string') args.push('--gap', input.gap);
    return args;
  }
  if (name === 'viberaven_heal_apply') {
    const args = ['--heal', '--apply'];
    if (typeof input.target === 'string') args.push('--target', input.target);
    if (typeof input.gap === 'string') args.push('--gap', input.gap);
    if (input.yes === true) args.push('--yes');
    return args;
  }
  if (name === 'viberaven_provider_verify') {
    const args = [
      'provider-verify',
      '--provider',
      safeStringArg(input.provider, 'provider'),
      '--check',
      safeStringArg(input.check, 'check')
    ];
    if (typeof input.plan === 'string') {
      args.push('--plan', safeStringArg(input.plan, 'plan'));
    }
    return args;
  }
  if (name === 'viberaven_validate_npm_package') {
    const names: string[] = [];
    if (input.packageName !== undefined) {
      names.push(safeStringArg(input.packageName, 'packageName'));
    }
    if (Array.isArray(input.packageNames)) {
      for (const entry of input.packageNames) {
        names.push(safeStringArg(entry, 'packageName'));
      }
    }
    if (names.length === 0) {
      throw new Error('packageName or packageNames is required');
    }
    return ['validate-npm-package', '--json', ...names];
  }

  throw new Error(`Unknown VibeRaven MCP tool: ${name}`);
}

function spawnLocalCli(args: string[], cwd: string): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawnChild(process.execPath, buildLocalCliArgs(args), {
      cwd,
      env: process.env,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      resolve({ code: 1, stdout: '', stderr: `ERROR: ${error.message}` });
    });
    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

export function parseJsonObjectFromToolText(text: string): unknown | undefined {
  const jsonStart = text.indexOf('{');
  if (jsonStart === -1) return undefined;
  try {
    return JSON.parse(text.slice(jsonStart));
  } catch {
    return undefined;
  }
}

export async function callVibeRavenMcpTool(name: string, input: Record<string, unknown> = {}): Promise<string> {
  const cwd = resolveCwd(input.cwd);
  const result = await spawnLocalCli(buildToolArgs(name, input), cwd);
  const combined = `${result.stdout}${result.stderr}`.trim();
  return `exit ${result.code ?? 1}${combined ? `\n${combined}` : ''}`;
}

async function handleRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
  if (method === 'initialize') {
    return {
      protocolVersion: (params.protocolVersion as string | undefined) ?? '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: {
        name: 'viberaven-cli-mcp',
        version: VERSION,
        description: 'VibeRaven production-readiness scanner and autonomous production copilot. Run viberaven_check_readiness to get a prioritized fix list, then apply fixes via viberaven_heal_apply (no scan cost), then viberaven_verify once per batch.'
      }
    };
  }

  if (method === 'tools/list') {
    return { tools: CLI_MCP_TOOLS };
  }

  if (method === 'tools/call') {
    const name = String(params.name ?? '');
    const args = (params.arguments as Record<string, unknown> | undefined) ?? {};
    const text = await callVibeRavenMcpTool(name, args);
    const parsed = parseJsonObjectFromToolText(text);
    return {
      content: [{ type: 'text', text }],
      ...(parsed ? { structuredContent: parsed } : {})
    };
  }

  throw new Error(`Unsupported MCP method: ${method}`);
}

function send(message: unknown): void {
  const body = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n${body}`);
}

async function handleRawMessage(raw: string): Promise<void> {
  let message: { id?: unknown; method?: unknown; params?: Record<string, unknown> };
  try {
    message = JSON.parse(raw) as typeof message;
  } catch {
    return;
  }

  if (typeof message.method !== 'string' || message.id === undefined || message.id === null) {
    return;
  }

  try {
    const result = await handleRequest(message.method, message.params ?? {});
    send({ jsonrpc: '2.0', id: message.id, result });
  } catch (error) {
    send({
      jsonrpc: '2.0',
      id: message.id,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

function drainMessages(): void {
  while (true) {
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) return;

    const header = buffer.slice(0, headerEnd).toString('utf8');
    const match = header.match(/content-length:\s*(\d+)/i);
    if (!match) {
      buffer = buffer.slice(headerEnd + 4);
      continue;
    }

    const length = Number(match[1]);
    const messageStart = headerEnd + 4;
    const messageEnd = messageStart + length;
    if (buffer.length < messageEnd) return;

    const raw = buffer.slice(messageStart, messageEnd).toString('utf8');
    buffer = buffer.slice(messageEnd);
    void handleRawMessage(raw);
  }
}

export function runMcpServer(): void {
  process.stdin.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    drainMessages();
  });
}

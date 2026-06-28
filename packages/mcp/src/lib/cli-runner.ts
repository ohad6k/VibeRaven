import { spawn, type ChildProcess } from 'node:child_process';

const CLI_PACKAGE = '@viberaven/cli';

export type ToolArgs = Record<string, unknown>;

let spawnFn: typeof spawn = spawn;

export function __setSpawnForTest(fn: typeof spawn): void {
  spawnFn = fn;
}

export function __resetSpawnForTest(): void {
  spawnFn = spawn;
}

export function safeStringArg(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid ${label}: expected string`);
  if (!value.trim()) throw new Error(`Invalid ${label}: expected non-empty string`);
  if (/[&|<>^%!"\r\n]/.test(value)) throw new Error(`Unsafe characters in ${label}`);
  return value;
}

export function resolveCwd(cwd: unknown): string {
  if (cwd === undefined || cwd === null) return process.cwd();
  if (typeof cwd !== 'string') throw new Error('Invalid cwd: expected string');
  if (!cwd.trim()) throw new Error('Invalid cwd: expected non-empty string');
  return cwd;
}

export function buildNpxCommand(args: string[]): { command: string; args: string[]; shell: boolean } {
  if (process.platform === 'win32') {
    return { command: 'cmd.exe', args: ['/d', '/s', '/c', 'npx', ...args], shell: false };
  }
  return { command: 'npx', args, shell: false };
}

export function buildHealArgs(prefix: string[], args: ToolArgs): string[] {
  const cliArgs = [...prefix];
  if (args.target) cliArgs.push('--target', safeStringArg(args.target, 'target'));
  if (args.gap) cliArgs.push('--gap', safeStringArg(args.gap, 'gap'));
  return cliArgs;
}

export function buildToolArgs(name: string, args: ToolArgs): string[] {
  switch (name) {
    case 'viberaven_check_readiness': return ['--agent-mode'];
    case 'viberaven_verify': return ['--verify'];
    case 'viberaven_audit':
      return ['audit', '--vercel-supabase', ...(args.json ? ['--json'] : [])];
    case 'viberaven_init_rules': {
      const cliArgs = ['init'];
      if (args.agents) cliArgs.push('--agents', safeStringArg(args.agents, 'agents'));
      if (args.dryRun) cliArgs.push('--dry-run');
      return cliArgs;
    }
    case 'viberaven_clean_plan': return ['clean', '--plan'];
    case 'viberaven_strict_gate': return ['--agent-mode', '--strict', '--json'];
    case 'viberaven_gate_result': return ['--agent-mode', '--json'];
    case 'viberaven_context_map': return ['--condense'];
    case 'viberaven_actions': return ['actions'];
    case 'viberaven_verify_action':
      return ['--verify', '--action', safeStringArg(args.actionId, 'actionId')];
    case 'viberaven_heal_plan': return buildHealArgs(['--heal', '--plan'], args);
    case 'viberaven_heal_prompt': return buildHealArgs(['--heal', '--prompt'], args);
    case 'viberaven_heal_apply': {
      const cliArgs = buildHealArgs(['--heal', '--apply'], args);
      if (args.yes === true) cliArgs.push('--yes');
      return cliArgs;
    }
    case 'viberaven_validate_npm_package': {
      const names: string[] = [];
      if (args.packageName) names.push(safeStringArg(args.packageName, 'packageName'));
      if (Array.isArray(args.packageNames)) {
        for (const entry of args.packageNames) names.push(safeStringArg(entry, 'packageName'));
      }
      if (names.length === 0) throw new Error('packageName or packageNames is required');
      return ['validate-npm-package', '--json', ...names];
    }
    default:
      throw new Error(`Unknown VibeRaven tool: ${name}`);
  }
}

export function runVibeRaven(args: string[], cwd: unknown): Promise<string> {
  return new Promise((resolve) => {
    const built = buildNpxCommand(['-y', CLI_PACKAGE, ...args]);
    const child: ChildProcess = spawnFn(built.command, built.args, {
      cwd: resolveCwd(cwd),
      env: process.env,
      shell: built.shell,
      stdio: ['ignore', 'pipe', 'pipe']
    } as any);
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on('error', (error: Error) => resolve(`ERROR: ${error.message}`));
    child.on('close', (code: number | null) => {
      const combined = `${stdout}${stderr}`.trim();
      resolve(`exit ${code ?? 1}${combined ? `\n${combined}` : ''}`);
    });
  });
}

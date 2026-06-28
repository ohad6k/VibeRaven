import { spawn } from 'node:child_process';

export type ConsoleCommandRequest =
  | { type: 'actions-json' }
  | { type: 'verify-action'; actionId: string }
  | { type: 'verify-gate' }
  | { type: 'agent-mode' };

export type ConsoleCommandResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
};

const ACTION_ID_RE = /^VR-A[1-9][0-9]*$/;

function isPlainRequestObject(request: unknown): request is Record<string, unknown> {
  return typeof request === 'object' && request !== null && !Array.isArray(request);
}

function hasOnlyKeys(request: Record<string, unknown>, keys: string[]): boolean {
  const actualKeys = Object.keys(request);
  return actualKeys.length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(request, key));
}

export function resolveConsoleCommandArgs(request: unknown): string[] {
  if (!isPlainRequestObject(request) || typeof request.type !== 'string') {
    throw new Error('Unsupported console command.');
  }

  if (request.type === 'actions-json' && hasOnlyKeys(request, ['type'])) return ['actions', '--json'];
  if (request.type === 'verify-gate' && hasOnlyKeys(request, ['type'])) return ['--verify'];
  if (request.type === 'agent-mode' && hasOnlyKeys(request, ['type'])) return ['--agent-mode'];
  if (request.type === 'verify-action' && hasOnlyKeys(request, ['type', 'actionId'])) {
    if (typeof request.actionId !== 'string' || !ACTION_ID_RE.test(request.actionId)) {
      throw new Error('Invalid VibeRaven action ID.');
    }
    return ['verify', '--action', request.actionId];
  }
  throw new Error('Unsupported console command.');
}

export async function runAllowedConsoleCommand(input: {
  cliPath: string;
  cwd: string;
  request: unknown;
}): Promise<ConsoleCommandResult> {
  const args = resolveConsoleCommandArgs(input.request);
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      callback();
    };
    const child = spawn(process.execPath, [input.cliPath, ...args], {
      cwd: input.cwd,
      shell: false,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr?.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', (error) => {
      settle(() => reject(error));
    });
    child.on('close', (exitCode) => {
      settle(() => resolve({ exitCode, stdout, stderr }));
    });
  });
}

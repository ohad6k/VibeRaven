import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface OpenCommand {
  command: string;
  args: string[];
  shell: boolean;
}

export interface AppWindowOpenOptions {
  width?: number;
  height?: number;
}

export function createOpenCommand(
  target: string,
  platform: NodeJS.Platform = process.platform
): OpenCommand {
  if (platform === 'win32') {
    return {
      command: 'rundll32',
      args: ['url.dll,FileProtocolHandler', target],
      shell: false
    };
  }
  if (platform === 'darwin') {
    return { command: 'open', args: [target], shell: false };
  }
  return { command: 'xdg-open', args: [target], shell: false };
}

export function createAppWindowOpenCommands(
  target: string,
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
  options: AppWindowOpenOptions = {}
): OpenCommand[] {
  const width = Math.max(240, Math.round(options.width ?? 430));
  const height = Math.max(240, Math.round(options.height ?? 760));
  const args = [
    `--app=${target}`,
    `--window-size=${width},${height}`,
    '--disable-features=Translate',
    '--no-first-run'
  ];
  if (platform === 'win32') {
    const candidates = [
      env.LOCALAPPDATA ? join(env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
      env.PROGRAMFILES ? join(env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
      env['PROGRAMFILES(X86)'] ? join(env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
      env.LOCALAPPDATA ? join(env.LOCALAPPDATA, 'Microsoft', 'Edge', 'Application', 'msedge.exe') : '',
      env.PROGRAMFILES ? join(env.PROGRAMFILES, 'Microsoft', 'Edge', 'Application', 'msedge.exe') : '',
      env['PROGRAMFILES(X86)'] ? join(env['PROGRAMFILES(X86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe') : '',
      'chrome',
      'msedge'
    ].filter(Boolean);
    return candidates.map((command) => ({ command, args, shell: false }));
  }
  if (platform === 'darwin') {
    return [
      { command: 'open', args: ['-na', 'Google Chrome', '--args', ...args], shell: false },
      { command: 'open', args: ['-na', 'Microsoft Edge', '--args', ...args], shell: false },
      { command: 'open', args: ['-na', 'Chromium', '--args', ...args], shell: false }
    ];
  }
  return ['google-chrome', 'chromium', 'chromium-browser', 'microsoft-edge'].map((command) => ({
    command,
    args,
    shell: false
  }));
}

async function openWithSystemDefault(target: string): Promise<void> {
  const { command, args, shell } = createOpenCommand(target);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'ignore', shell });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Could not open browser (exit ${code ?? 'unknown'}). Open manually: ${target}`));
      }
    });
  });
}

async function spawnDetached(command: OpenCommand): Promise<void> {
  if (/^[A-Za-z]:[\\/]/.test(command.command) && !existsSync(command.command)) {
    throw new Error(`Browser not found: ${command.command}`);
  }
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command.command, command.args, {
      detached: true,
      stdio: 'ignore',
      shell: command.shell
    });
    child.once('spawn', () => {
      child.unref();
      resolve();
    });
    child.once('error', reject);
  });
}

export async function openUrlInAppWindow(url: string, options: AppWindowOpenOptions = {}): Promise<void> {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(`Not a valid http(s) URL: ${url}`);
  }
  const candidates = createAppWindowOpenCommands(trimmed, process.platform, process.env, options);
  const errors: string[] = [];
  for (const candidate of candidates) {
    try {
      await spawnDetached(candidate);
      return;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  throw new Error(`Could not open overlay app window. ${errors.join(' | ')}`);
}

export async function openPathInBrowser(filePath: string): Promise<void> {
  await openWithSystemDefault(filePath);
}

export async function openUrlInBrowser(url: string): Promise<void> {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(`Not a valid http(s) URL: ${url}`);
  }
  await openWithSystemDefault(trimmed);
}

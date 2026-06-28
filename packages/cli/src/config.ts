import { homedir } from 'node:os';
import { dirname, join, parse, resolve } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { access } from 'node:fs/promises';

/** Same default as the shipped VS Code extension (`getBackendBaseUrl`). */
export const DEFAULT_API_BASE_URL =
  'https://jaohiwzjhtwljyqligpu.supabase.co/functions/v1/viberice-api';

export interface CliCredentials {
  accessToken: string;
  apiBaseUrl: string;
  email?: string;
  plan?: string;
  runnerSessionId?: string;
  runnerAccessToken?: string;
}

export interface RunnerSessionCredentials {
  runnerSessionId: string;
  runnerAccessToken: string;
  apiBaseUrl: string;
}

export interface CliStackChoice {
  provider: string;
  selectedAt: string;
}

export interface CliStackChoicesFile {
  version: 1;
  choices: Record<string, CliStackChoice>;
}

export function getStackChoicesPath(cwd: string = process.cwd()): string {
  return join(getProjectArtifactsDir(cwd), 'stack.json');
}

export function getConfigDir(): string {
  const override = process.env.VIBERAVEN_CONFIG_DIR?.trim();
  if (override) {
    return override;
  }
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA?.trim();
    if (appData) {
      return join(appData, 'viberaven');
    }
  }
  return join(homedir(), '.config', 'viberaven');
}

export function getCredentialsPath(): string {
  return join(getConfigDir(), 'credentials.json');
}

export function getProjectArtifactsDir(cwd: string = process.cwd()): string {
  return join(cwd, '.viberaven');
}

const LAST_SCAN_FILE = 'last-scan.json';

/**
 * Walk up from `startDir` for `.viberaven/last-scan.json` (nearest ancestor wins).
 */
export async function findArtifactsWorkspace(startDir: string = process.cwd()): Promise<string | undefined> {
  let dir = resolve(startDir);
  const fsRoot = parse(dir).root;

  while (true) {
    try {
      await access(join(dir, '.viberaven', LAST_SCAN_FILE), constants.F_OK);
      return dir;
    } catch {
      // keep walking up
    }
    const parent = dirname(dir);
    if (parent === dir || dir === fsRoot) {
      return undefined;
    }
    dir = parent;
  }
}

/**
 * Best folder for scan/read artifacts: nearest `.viberaven` scan, else git root, else `startDir`.
 */
export async function resolveWorkspaceRoot(startDir: string = process.cwd()): Promise<string> {
  const withArtifacts = await findArtifactsWorkspace(startDir);
  if (withArtifacts) {
    return withArtifacts;
  }

  let dir = resolve(startDir);
  const fsRoot = parse(dir).root;

  while (true) {
    try {
      await access(join(dir, '.git'), constants.F_OK);
      return dir;
    } catch {
      // keep walking up
    }
    const parent = dirname(dir);
    if (parent === dir || dir === fsRoot) {
      return resolve(startDir);
    }
    dir = parent;
  }
}

export async function ensureConfigDir(): Promise<string> {
  const dir = getConfigDir();
  await mkdir(dir, { recursive: true });
  return dir;
}

async function readCredentialsFileRaw(): Promise<Partial<CliCredentials>> {
  try {
    const raw = await readFile(getCredentialsPath(), 'utf-8');
    return JSON.parse(raw) as Partial<CliCredentials>;
  } catch {
    return {};
  }
}

function normalizeApiBaseUrl(value: string | undefined): string {
  return (value?.trim() || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

function parseStoredCredentials(parsed: Partial<CliCredentials>): CliCredentials | undefined {
  if (typeof parsed.accessToken !== 'string' || !parsed.accessToken.trim()) {
    return undefined;
  }
  return {
    accessToken: parsed.accessToken.trim(),
    apiBaseUrl: normalizeApiBaseUrl(parsed.apiBaseUrl),
    email: typeof parsed.email === 'string' ? parsed.email : undefined,
    plan: typeof parsed.plan === 'string' ? parsed.plan : undefined,
    runnerSessionId:
      typeof parsed.runnerSessionId === 'string' && parsed.runnerSessionId.trim()
        ? parsed.runnerSessionId.trim()
        : undefined,
    runnerAccessToken:
      typeof parsed.runnerAccessToken === 'string' && parsed.runnerAccessToken.trim()
        ? parsed.runnerAccessToken.trim()
        : undefined
  };
}

export async function loadRunnerSessionCredentials(): Promise<RunnerSessionCredentials | undefined> {
  const parsed = await readCredentialsFileRaw();
  const runnerSessionId =
    typeof parsed.runnerSessionId === 'string' ? parsed.runnerSessionId.trim() : '';
  const runnerAccessToken =
    typeof parsed.runnerAccessToken === 'string' ? parsed.runnerAccessToken.trim() : '';
  if (!runnerSessionId || !runnerAccessToken) {
    return undefined;
  }
  return {
    runnerSessionId,
    runnerAccessToken,
    apiBaseUrl: normalizeApiBaseUrl(parsed.apiBaseUrl)
  };
}

export async function saveRunnerSessionCredentials(input: RunnerSessionCredentials): Promise<void> {
  await ensureConfigDir();
  const existing = await readCredentialsFileRaw();
  const merged: Partial<CliCredentials> = {
    ...existing,
    runnerSessionId: input.runnerSessionId,
    runnerAccessToken: input.runnerAccessToken,
    apiBaseUrl: normalizeApiBaseUrl(input.apiBaseUrl)
  };
  await writeFile(getCredentialsPath(), `${JSON.stringify(merged, null, 2)}\n`, {
    mode: constants.S_IRUSR | constants.S_IWUSR
  });
}

export async function loadCredentials(): Promise<CliCredentials | undefined> {
  const parsed = await readCredentialsFileRaw();
  const fromDisk = parseStoredCredentials(parsed);
  if (fromDisk) {
    return fromDisk;
  }

  const accessToken = process.env.VIBERAVEN_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    return undefined;
  }
  return {
    accessToken,
    apiBaseUrl: resolveApiBaseUrl()
  };
}

export async function saveCredentials(credentials: CliCredentials): Promise<void> {
  await ensureConfigDir();
  await writeFile(getCredentialsPath(), `${JSON.stringify(credentials, null, 2)}\n`, {
    mode: constants.S_IRUSR | constants.S_IWUSR
  });
}

export async function clearCredentials(): Promise<void> {
  try {
    await access(getCredentialsPath());
    await writeFile(getCredentialsPath(), '{}\n');
  } catch {
    // no credentials file
  }
}

export function resolveApiBaseUrl(flag?: string): string {
  const fromFlag = flag?.trim();
  if (fromFlag) {
    return fromFlag.replace(/\/+$/, '');
  }
  const fromEnv = process.env.VIBERAVEN_API_URL?.trim() || process.env.VRAVEN_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }
  return DEFAULT_API_BASE_URL;
}

export async function loadStackChoicesFile(cwd: string): Promise<CliStackChoicesFile> {
  try {
    const raw = await readFile(getStackChoicesPath(cwd), 'utf-8');
    const parsed = JSON.parse(raw) as Partial<CliStackChoicesFile>;
    if (parsed && parsed.version === 1 && parsed.choices && typeof parsed.choices === 'object') {
      return { version: 1, choices: parsed.choices };
    }
  } catch {
    // optional file
  }
  return { version: 1, choices: {} };
}

export async function saveStackChoicesFile(cwd: string, file: CliStackChoicesFile): Promise<void> {
  await mkdir(getProjectArtifactsDir(cwd), { recursive: true });
  await writeFile(getStackChoicesPath(cwd), `${JSON.stringify(file, null, 2)}\n`, 'utf-8');
}

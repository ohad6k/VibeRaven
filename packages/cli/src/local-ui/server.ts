import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import type { AddressInfo } from 'node:net';
import type { RunScanCommandResult } from '../cli';
import type { CliScanArtifact } from '../types';
import { buildContextCleanupPlan, collectCleanupFiles, writeCleanupPlan } from '../commands/cleanPlan';
import { buildVercelSupabaseAudit, collectVercelSupabaseAuditInput, renderVercelSupabaseAudit } from '../commands/audit';
import { runHealCommand } from '../commands/heal';
import { openUrlInAppWindow, openUrlInBrowser, type AppWindowOpenOptions } from '../openBrowser';
import { getBundledReportAssetsDir } from '../report/reportAssets';
import { buildMissionCards, emptyLocalUiState, mapArtifactToLocalUiState } from './artifactAdapter';
import { renderLocalUiHtml } from './static/appHtml';
import type { LocalUiProvider, LocalUiRelease, LocalUiState } from './types';

interface LocalCliAgentSetup {
  installCommand: string;
  signInCommand: string;
  verifyCommand: string;
  docsUrl: string;
}

interface LocalCliAgentStatus {
  id: 'codex' | 'claude' | 'gemini' | 'terminal';
  label: string;
  caption: string;
  tone: 'green' | 'purple' | 'blue' | 'orange';
  command: string;
  connected: boolean;
  installed: boolean;
  source: 'detected' | 'fallback' | 'simulated';
  models: string[];
  setup: LocalCliAgentSetup;
}

const CLI_AGENT_SETUP: Record<'codex' | 'claude' | 'gemini' | 'terminal', LocalCliAgentSetup> = {
  codex: {
    installCommand: 'npm install -g @openai/codex',
    signInCommand: 'codex login',
    verifyCommand: 'codex --version',
    docsUrl: 'https://github.com/openai/codex'
  },
  claude: {
    installCommand: 'npm install -g @anthropic-ai/claude-code',
    signInCommand: 'claude',
    verifyCommand: 'claude --version',
    docsUrl: 'https://docs.anthropic.com/en/docs/claude-code/overview'
  },
  gemini: {
    installCommand: 'npm install -g @google/gemini-cli',
    signInCommand: 'gemini',
    verifyCommand: 'gemini --version',
    docsUrl: 'https://github.com/google-gemini/gemini-cli'
  },
  terminal: {
    installCommand: '',
    signInCommand: '',
    verifyCommand: '',
    docsUrl: 'https://viberaven.dev'
  }
};

const MCP_CONFIG_PATHS = [
  '.mcp.json',
  'mcp.json',
  join('.cursor', 'mcp.json'),
  join('.vscode', 'mcp.json')
];

const MCP_PROVIDER_NEEDLES: Record<string, string[]> = {
  supabase: ['supabase', '@supabase/mcp', 'mcp-server-supabase'],
  vercel: ['vercel'],
  stripe: ['stripe'],
  github: ['github'],
  sentry: ['sentry'],
  posthog: ['posthog'],
  clerk: ['clerk'],
  authjs: ['authjs', 'next-auth', 'nextauth'],
  resend: ['resend'],
  upstash: ['upstash']
};

const MCP_CONNECT_COMMANDS: Record<string, string> = {
  supabase: 'Add the Supabase MCP server to your local MCP config, then drag Supabase into chat.',
  vercel: 'Add a Vercel MCP server entry to your local MCP config, then drag Vercel into chat.',
  stripe: 'Add a Stripe MCP server entry to your local MCP config, then drag Stripe into chat.',
  github: 'Add the GitHub MCP server to your local MCP config, then drag GitHub into chat.'
};

interface LocalAgentChatRequest {
  cliId: 'codex' | 'claude' | 'gemini';
  modelId?: string;
  reasoning?: string;
  context?: string;
  accessMode?: 'ask' | 'approve' | 'full';
  prompt: string;
  displayPrompt?: string;
  taskKind?: string;
  provider?: {
    id?: string;
    area?: string;
    name?: string;
  };
  release?: {
    id?: string;
    label?: string;
  };
}

interface LocalAgentRunResult {
  command: string;
  args: string[];
  exitCode: number | null;
  output: string;
  stderr: string;
  timedOut: boolean;
}

export type LocalUiScanRunner = (
  flags: Record<string, string | boolean>,
  positional: string[]
) => Promise<RunScanCommandResult>;

export interface StartLocalUiServerOptions {
  cwd: string;
  port?: number;
  openBrowser?: boolean;
  openMode?: 'browser' | 'app-window';
  appWindowSize?: AppWindowOpenOptions;
  initialPath?: string;
  scanRunner?: LocalUiScanRunner;
}

export interface LocalUiServerHandle {
  url: string;
  close(): Promise<void>;
}

async function defaultScanRunner(flags: Record<string, string | boolean>, positional: string[]): Promise<RunScanCommandResult> {
  const cli = await import('../cli');
  return cli.runScanCommand(flags, positional);
}

async function readPackageJson(cwd: string): Promise<Record<string, unknown>> {
  try {
    const raw = await readFile(join(cwd, 'package.json'), 'utf8');
    const parsed: unknown = JSON.parse(raw.replace(/^\uFEFF/, ''));
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function dependencyNames(packageJson: Record<string, unknown>): Set<string> {
  const names = new Set<string>();
  for (const key of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    const value = packageJson[key];
    if (!isRecord(value)) continue;
    Object.keys(value).forEach((name) => names.add(name.toLowerCase()));
  }
  return names;
}

async function listProjectFiles(cwd: string, maxFiles = 1800): Promise<string[]> {
  const skipped = new Set(['.git', 'node_modules', '.next', 'dist', 'build', 'coverage', '.turbo', '.viberaven']);
  const files: string[] = [];
  async function walk(dir: string, prefix = ''): Promise<void> {
    if (files.length >= maxFiles) return;
    let entries: Array<{ name: string; isDirectory(): boolean; isFile(): boolean }>;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (files.length >= maxFiles) return;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (!skipped.has(entry.name)) await walk(join(dir, entry.name), rel);
        continue;
      }
      if (entry.isFile()) files.push(rel.toLowerCase());
    }
  }
  await walk(cwd);
  return files;
}

function hasDependency(deps: Set<string>, needles: string[]): boolean {
  return needles.some((needle) => deps.has(needle) || Array.from(deps).some((dep) => dep.includes(needle)));
}

function hasFile(files: string[], needles: string[]): boolean {
  return needles.some((needle) => files.some((file) => file.includes(needle)));
}

function providerDetected(providerId: string, deps: Set<string>, files: string[]): boolean {
  switch (providerId) {
    case 'supabase':
      return hasDependency(deps, ['@supabase/supabase-js', 'supabase']) || hasFile(files, ['supabase/', 'supabase\\', 'supabase.ts']);
    case 'vercel':
      return hasFile(files, ['vercel.json', '.vercel/project.json']) || hasDependency(deps, ['@vercel/']);
    case 'stripe':
      return hasDependency(deps, ['stripe', '@stripe/stripe-js']) || hasFile(files, ['stripe', 'webhook']);
    case 'github':
      return hasFile(files, ['.github/workflows', '.github/dependabot.yml']) || files.includes('readme.md');
    case 'sentry':
      return hasDependency(deps, ['@sentry/']) || hasFile(files, ['sentry.', 'instrumentation.ts', 'instrumentation.js']);
    case 'posthog':
      return hasDependency(deps, ['posthog', 'posthog-js']) || hasFile(files, ['posthog']);
    case 'clerk':
      return hasDependency(deps, ['@clerk/']) || hasFile(files, ['clerk', 'middleware.ts', 'middleware.js']);
    case 'authjs':
      return hasDependency(deps, ['next-auth', '@auth/']) || hasFile(files, ['auth.ts', 'auth.js', 'nextauth']);
    case 'resend':
      return hasDependency(deps, ['resend']) || hasFile(files, ['resend', 'email', 'mail']);
    case 'upstash':
      return hasDependency(deps, ['@upstash/', 'upstash']) || hasFile(files, ['upstash', 'ratelimit', 'rate-limit', 'redis']);
    default:
      return false;
  }
}

function checksSummary(provider: LocalUiProvider, detected: boolean): string {
  const total = Math.max(1, provider.launchPath.length);
  if (!detected) return `0/${total}`;
  const ready = provider.launchPath.filter((item) => item.source === 'repo').length || 1;
  return `${Math.min(ready, total)}/${total}`;
}

function collapseAuthProviders(providers: LocalUiProvider[]): LocalUiProvider[] {
  const authProviders = providers.filter((provider) => provider.id === 'clerk' || provider.id === 'authjs');
  if (authProviders.length <= 1) return providers;
  const detectedAuth = authProviders.find((provider) => provider.state !== 'not_detected');
  const visibleAuth = detectedAuth ?? authProviders.find((provider) => provider.id === 'clerk') ?? authProviders[0];
  return providers.filter((provider) => provider.id !== 'clerk' && provider.id !== 'authjs').concat(visibleAuth);
}

function providerDetail(provider: LocalUiProvider, detected: boolean): string {
  if (detected) {
    return `${provider.area} evidence was found in this project. Drag this slot into chat to ask the connected CLI for the next production step.`;
  }
  return `${provider.area} is available as a production slot. Add it when this project depends on ${provider.name}.`;
}

function applyProviderDetection(state: LocalUiState, deps: Set<string>, files: string[]): LocalUiState {
  const providers = collapseAuthProviders(state.providers.map((provider) => {
    const detected = providerDetected(provider.id, deps, files);
    const providerState = detected ? provider.state === 'not_detected' ? 'repo_evidence_found' : provider.state : 'not_detected';
    return {
      ...provider,
      state: providerState,
      statusText: detected ? 'Detected in repo' : 'Missing',
      connectLabel: detected ? 'Open slot' : 'Add provider',
      launchPath: provider.launchPath.map((item, index) => ({
        ...item,
        state: detected && item.source === 'repo' && index < 2 ? 'ready' : 'not_checked',
        shortReason: detected ? 'Repo evidence detected' : 'No local evidence yet'
      })),
      selectedItemId: provider.launchPath[0]?.id,
      nextFix: provider.nextFix
        ? {
            ...provider.nextFix,
            title: detected ? `Review ${provider.name} production proof` : `Add ${provider.name} when needed`,
            whyItMatters: providerDetail(provider, detected),
            whatToChange: detected
              ? `Ask VibeRaven Chat to inspect ${provider.name} evidence and identify missing production proof.`
              : `Use Add Provider when this project starts using ${provider.name}.`,
            verifyInstruction: 'Use the connected CLI chat to inspect local evidence before claiming live provider proof.'
          }
        : provider.nextFix
    } satisfies LocalUiProvider;
  }));
  const firstDetected = providers.find((provider) => provider.state !== 'not_detected');
  return {
    ...state,
    providers,
    selectedProviderId: firstDetected?.id ?? providers[0]?.id ?? state.selectedProviderId
  };
}

function runGit(cwd: string, args: string[], timeoutMs = 1500): Promise<string> {
  return new Promise((resolveGit) => {
    const child = spawn('git', args, {
      cwd,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore']
    });
    let stdout = '';
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.once('error', () => {
      clearTimeout(timer);
      resolveGit('');
    });
    child.once('close', () => {
      clearTimeout(timer);
      resolveGit(stdout.trim());
    });
  });
}

async function detectReleases(cwd: string, version?: string): Promise<LocalUiRelease[]> {
  const branch = (await runGit(cwd, ['rev-parse', '--abbrev-ref', 'HEAD'])) || 'local';
  const tagsRaw = await runGit(cwd, ['tag', '--sort=-creatordate']);
  const tags = tagsRaw.split(/\r?\n/).map((tag) => tag.trim()).filter(Boolean).slice(0, 5);
  if (tags.length > 0) {
    return tags.map((tag, index) => ({
      id: tag,
      label: tag,
      meta: index === 0 ? 'latest tag' : 'git tag',
      branch,
      tone: index === 0 ? 'current' : 'prod',
      summary: index === 0 ? 'Latest git tag detected locally.' : 'Git tag detected locally.'
    }));
  }
  const shortSha = (await runGit(cwd, ['rev-parse', '--short', 'HEAD'])) || '';
  const current = version ? `v${version}` : shortSha ? `commit ${shortSha}` : 'Workspace';
  return [
    {
      id: current.toLowerCase().replace(/[^a-z0-9._-]+/g, '-'),
      label: current,
      meta: shortSha ? 'current commit' : 'not released',
      branch,
      tone: 'current',
      summary: shortSha ? 'Current git commit detected locally.' : 'No git release was detected yet.'
    }
  ];
}

function safeGitRef(ref: string | undefined): string | null {
  const trimmed = String(ref || '').trim();
  if (!trimmed || trimmed.length > 200) return null;
  if (!/^[A-Za-z0-9._/@^~:-]+$/.test(trimmed)) return null;
  return trimmed;
}

function parseGitShortstat(raw: string): { files: number; insertions: number; deletions: number } {
  const files = Number(raw.match(/(\d+)\s+files? changed/)?.[1] || 0);
  const insertions = Number(raw.match(/(\d+)\s+insertions?\(\+\)/)?.[1] || 0);
  const deletions = Number(raw.match(/(\d+)\s+deletions?\(-\)/)?.[1] || 0);
  return { files, insertions, deletions };
}

function runGitCommand(
  cwd: string,
  args: string[],
  timeoutMs = 5000
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolveCommand) => {
    const child = spawn('git', args, {
      cwd,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      resolveCommand({ code: 1, stdout, stderr: stderr || 'git command timed out' });
    }, timeoutMs);
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.once('error', () => {
      clearTimeout(timer);
      resolveCommand({ code: 1, stdout, stderr });
    });
    child.once('close', (code) => {
      clearTimeout(timer);
      resolveCommand({ code: code ?? 1, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

async function gitRefExists(cwd: string, ref: string): Promise<boolean> {
  const result = await runGitCommand(cwd, ['rev-parse', '--verify', ref], 2000);
  return result.code === 0;
}

async function compareReleaseRefs(
  cwd: string,
  fromRef: string,
  toRef: string
): Promise<{
  from: string;
  to: string;
  fromLabel: string;
  toLabel: string;
  diff: string;
  stats: { files: number; insertions: number; deletions: number };
}> {
  const fromLabel = fromRef;
  const toLabel = toRef;
  const fromShort = (await runGit(cwd, ['rev-parse', '--short', fromRef])) || fromRef;
  const toShort = (await runGit(cwd, ['rev-parse', '--short', toRef])) || toRef;
  const diff =
    (await runGit(cwd, ['diff', '--no-color', `${fromRef}..${toRef}`], 8000)) ||
    (await runGit(cwd, ['diff', '--no-color', fromRef, toRef], 8000));
  const statRaw = await runGit(cwd, ['diff', '--shortstat', `${fromRef}..${toRef}`], 4000);
  return {
    from: fromShort,
    to: toShort,
    fromLabel,
    toLabel,
    diff: diff || '(no file changes between these refs)',
    stats: parseGitShortstat(statRaw)
  };
}

async function releaseChangelogBetween(
  cwd: string,
  fromRef: string,
  toRef: string
): Promise<{
  from: string;
  to: string;
  fromLabel: string;
  toLabel: string;
  entries: Array<{ sha: string; short: string; subject: string; author: string; when: string }>;
}> {
  const logRaw = await runGit(
    cwd,
    ['log', '--no-color', '--pretty=format:%H%x09%h%x09%s%x09%an%x09%ar', `${fromRef}..${toRef}`],
    8000
  );
  const entries = logRaw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [sha = '', short = '', subject = '', author = '', when = ''] = line.split('\t');
      return { sha, short, subject, author, when };
    });
  return { from: fromRef, to: toRef, fromLabel: fromRef, toLabel: toRef, entries };
}

async function releaseDiffContextBlock(cwd: string, releaseId: string | undefined): Promise<string | undefined> {
  const ref = safeGitRef(releaseId);
  if (!ref || ref === 'workspace') return undefined;
  if (!(await gitRefExists(cwd, ref))) return undefined;
  const comparison = await compareReleaseRefs(cwd, ref, 'HEAD');
  const stats = comparison.stats;
  const diffPreview = comparison.diff.length > 6000
    ? comparison.diff.slice(0, 6000) + '\n[diff truncated]'
    : comparison.diff;
  return [
    `Attached release diff (${comparison.fromLabel} -> ${comparison.toLabel}):`,
    `Files changed: ${stats.files}; insertions: ${stats.insertions}; deletions: ${stats.deletions}`,
    diffPreview
  ].join('\n');
}

async function rollbackReleaseRef(
  cwd: string,
  targetRef: string
): Promise<{ ok: boolean; message: string; checkedOut: string }> {
  if (!(await gitRefExists(cwd, targetRef))) {
    return { ok: false, message: `Release ref "${targetRef}" was not found in this repo.`, checkedOut: '' };
  }
  const dirty = await runGit(cwd, ['status', '--porcelain']);
  if (dirty.trim()) {
    return {
      ok: false,
      message: 'Rollback blocked: commit or stash uncommitted changes before checking out a release.',
      checkedOut: ''
    };
  }
  const checkout = await runGitCommand(cwd, ['checkout', '--detach', targetRef], 8000);
  if (checkout.code !== 0) {
    return {
      ok: false,
      message: checkout.stderr || checkout.stdout || `Could not check out ${targetRef}.`,
      checkedOut: ''
    };
  }
  const checkedOut = (await runGit(cwd, ['rev-parse', '--short', 'HEAD'])) || targetRef;
  return {
    ok: true,
    message: `Checked out ${targetRef} locally (detached HEAD at ${checkedOut}).`,
    checkedOut
  };
}

function cliModelDefaults(id: LocalCliAgentStatus['id']): string[] {
  switch (id) {
    case 'claude':
      return ['Claude 3.5 Sonnet', 'Claude Opus', 'Claude Haiku'];
    case 'gemini':
      return ['Gemini 2.5 Pro', 'Gemini 2.5 Flash', 'Gemini CLI Fast'];
    case 'terminal':
      return ['Local shell', 'PowerShell', 'Node task runner'];
    case 'codex':
    default:
      return ['GPT-5.5', 'GPT-5.4', 'GPT-5.4-Mini', 'GPT-5.3-Codex-Spark'];
  }
}

function detectCommand(command: string, cwd: string): Promise<boolean> {
  return new Promise((resolveDetect) => {
    const child = spawn(process.platform === 'win32' ? 'where.exe' : 'sh', process.platform === 'win32' ? [command] : ['-lc', `command -v ${command}`], {
      cwd,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let settled = false;
    const done = (value: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolveDetect(value);
    };
    const timer = setTimeout(() => {
      child.kill();
    }, 1200);
    child.once('error', () => done(false));
    child.once('close', (code) => done(code === 0));
  });
}

const CLI_AUTH_PROBE: Record<'codex' | 'claude' | 'gemini', string> = {
  codex: 'codex login status',
  claude: 'claude auth status',
  gemini: 'gemini auth status',
};

function outputIndicatesSignedOut(text: string): boolean {
  const lower = text.toLowerCase();
  return /not logged in|not authenticated|login required|sign in|unauthorized|no credentials|not signed in|please (run|use).*login|authentication required|you are not logged in|run .* to log in|login with|must log in/.test(lower);
}

function commandMissingFromOutput(text: string): boolean {
  return /not recognized|not found|unknown command|no such file|command not found|is not recognized as an internal or external command/.test(text.toLowerCase());
}

async function probeCliAgent(
  agentId: 'codex' | 'claude' | 'gemini',
  cwd: string
): Promise<{ installed: boolean; ready: boolean; stage: 'missing' | 'installed' | 'verified'; output: string; message: string }> {
  const installed = await detectCommand(agentId, cwd);
  if (!installed) {
    return {
      installed: false,
      ready: false,
      stage: 'missing',
      output: '',
      message: `${agentId} was not detected locally. Run install in Studio terminal, then test again.`,
    };
  }

  const verifyCommand = CLI_AGENT_SETUP[agentId].verifyCommand;
  const verifyResult = await runShellCommand(verifyCommand, cwd, 15000);
  const verifyOutput = verifyResult.output;
  if (verifyResult.exitCode !== 0) {
    return {
      installed: true,
      ready: false,
      stage: 'installed',
      output: verifyOutput,
      message: `${agentId} is installed but did not respond to version check. Run sign in, then test again.`,
    };
  }

  const authCommand = CLI_AUTH_PROBE[agentId];
  const authResult = await runShellCommand(authCommand, cwd, 15000);
  const authOutput = authResult.output;
  const authCommandMissing = commandMissingFromOutput(authOutput);
  const authFailed = authCommandMissing || authResult.exitCode !== 0 || outputIndicatesSignedOut(authOutput);

  if (authFailed) {
    return {
      installed: true,
      ready: false,
      stage: 'installed',
      output: `${verifyOutput}\n${authOutput}`.trim(),
      message: authCommandMissing
        ? `${agentId} is installed. Run sign in in the Studio terminal, then test again.`
        : `${agentId} is installed but not signed in. Run sign in, then test again.`,
    };
  }

  return {
    installed: true,
    ready: true,
    stage: 'verified',
    output: `${verifyOutput}\n${authOutput}`.trim(),
    message: `${agentId} is installed and signed in. Ready for chat missions.`,
  };
}

function setupCommandFor(cliId: 'codex' | 'claude' | 'gemini', step: 'install' | 'sign-in'): string {
  const setup = CLI_AGENT_SETUP[cliId];
  return step === 'install' ? setup.installCommand : setup.signInCommand;
}

function runShellCommand(command: string, cwd: string, timeoutMs = 180000): Promise<{ exitCode: number | null; output: string }> {
  return new Promise((resolveRun) => {
    const useCmd = process.platform === 'win32';
    const child = spawn(useCmd ? (process.env.ComSpec || 'cmd.exe') : 'sh', useCmd ? ['/d', '/s', '/c', command] : ['-lc', command], {
      cwd,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
    }, timeoutMs);
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.once('error', () => {
      clearTimeout(timer);
      resolveRun({ exitCode: 1, output: 'Could not start the install command on this machine.' });
    });
    child.once('close', (code) => {
      clearTimeout(timer);
      const output = `${stdout}${stderr}`.trim() || (code === 0 ? 'Command finished successfully.' : 'Command finished with no output.');
      resolveRun({ exitCode: code, output: output.length > 6000 ? `${output.slice(0, 6000)}\n...output trimmed` : output });
    });
  });
}

function openSystemTerminal(command: string, cwd: string): Promise<{ ok: boolean; message: string }> {
  return new Promise((resolveOpen) => {
    const quotedCwd = process.platform === 'win32' ? `"${cwd.replace(/"/g, '""')}"` : JSON.stringify(cwd);
    const fullCommand = process.platform === 'win32'
      ? `cd /d ${quotedCwd} && ${command}`
      : `cd ${quotedCwd} && ${command}`;
    let child;
    if (process.platform === 'win32') {
      child = spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', fullCommand], {
        cwd,
        windowsHide: true,
        stdio: 'ignore',
        detached: true
      });
    } else if (process.platform === 'darwin') {
      const script = `tell application "Terminal" to do script "${fullCommand.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
      child = spawn('osascript', ['-e', script], { cwd, windowsHide: true, stdio: 'ignore', detached: true });
    } else {
      child = spawn('x-terminal-emulator', ['-e', `bash -lc ${JSON.stringify(fullCommand)}`], {
        cwd,
        windowsHide: true,
        stdio: 'ignore',
        detached: true
      });
    }
    child.once('error', () => resolveOpen({ ok: false, message: 'Could not open a local terminal window on this machine.' }));
    child.once('spawn', () => resolveOpen({ ok: true, message: 'Opened a local terminal window. Complete the step there, then return to VibeRaven and click Test connection.' }));
    child.unref?.();
  });
}

async function detectLocalCliAgents(
  cwd: string,
  options: { fresh?: boolean } = {}
): Promise<{ agents: LocalCliAgentStatus[]; selectedCliId: string; simulateFresh: boolean }> {
  const definitions: Array<Omit<LocalCliAgentStatus, 'connected' | 'installed' | 'source' | 'models' | 'setup'>> = [
    { id: 'codex', label: 'Codex CLI', caption: 'OpenAI agent', tone: 'green', command: 'codex' },
    { id: 'claude', label: 'Claude Code', caption: 'Anthropic agent', tone: 'purple', command: 'claude' },
    { id: 'gemini', label: 'Gemini CLI', caption: 'Google agent', tone: 'blue', command: 'gemini' },
    { id: 'terminal', label: 'Terminal', caption: 'Local shell', tone: 'orange', command: process.platform === 'win32' ? 'powershell' : 'sh' }
  ];
  const detected = await Promise.all(
    definitions.map(async (agent) => {
      const simulateDisconnected = options.fresh === true && agent.id !== 'terminal';
      const installed = agent.id === 'terminal' ? true : simulateDisconnected ? false : await detectCommand(agent.command, cwd);
      return {
        ...agent,
        installed,
        connected: agent.id === 'terminal',
        source: simulateDisconnected ? 'simulated' : installed ? 'detected' : 'fallback',
        models: cliModelDefaults(agent.id),
        setup: CLI_AGENT_SETUP[agent.id]
      } satisfies LocalCliAgentStatus;
    })
  );
  return {
    agents: detected,
    selectedCliId: detected.find((agent) => agent.id !== 'terminal' && agent.installed)?.id ?? 'codex',
    simulateFresh: options.fresh === true
  };
}

function isPlaceholderProjectName(value: string | undefined): boolean {
  if (!value) return true;
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return (
    normalized === '' ||
    normalized === 'project' ||
    normalized === 'npx-open-source-check' ||
    normalized.startsWith('viberaven-local-ui')
  );
}

async function readMcpEvidence(cwd: string): Promise<Array<{ source: string; text: string }>> {
  const candidates = MCP_CONFIG_PATHS.map((relativePath) => ({
    source: relativePath.replace(/\\/g, '/'),
    path: resolve(cwd, relativePath)
  }));
  const home = process.env.USERPROFILE || process.env.HOME;
  if (home) {
    candidates.push({
      source: '~/.codex/config.toml',
      path: resolve(home, '.codex', 'config.toml')
    });
  }
  const evidence: Array<{ source: string; text: string }> = [];
  for (const candidate of candidates) {
    try {
      const text = await readFile(candidate.path, 'utf8');
      if (/mcp/i.test(text)) evidence.push({ source: candidate.source, text });
    } catch {
      // Missing MCP config files are normal.
    }
  }
  return evidence;
}

function mcpForProvider(provider: LocalUiProvider, evidence: Array<{ source: string; text: string }>): LocalUiProvider['mcp'] {
  const needles = MCP_PROVIDER_NEEDLES[provider.id] ?? [provider.id];
  const match = evidence.find((item) => {
    const lower = item.text.toLowerCase();
    return needles.some((needle) => lower.includes(needle.toLowerCase()));
  });
  if (match) {
    return {
      status: 'connected',
      label: 'MCP connected',
      source: match.source,
      connectCommand: MCP_CONNECT_COMMANDS[provider.id],
      capabilities: ['repo context', provider.area, 'provider-aware chat']
    };
  }
  return {
    status: 'disconnected',
    label: 'Connect MCP',
    connectCommand: MCP_CONNECT_COMMANDS[provider.id] ?? `Add a ${provider.name} MCP server entry, then drag ${provider.name} into chat.`,
    capabilities: []
  };
}

async function applyMcpDetection(state: LocalUiState, cwd: string): Promise<LocalUiState> {
  const evidence = await readMcpEvidence(cwd);
  return {
    ...state,
    providers: state.providers.map((provider) => ({
      ...provider,
      mcp: mcpForProvider(provider, evidence)
    }))
  };
}

async function enrichProjectMetadata(state: LocalUiState, cwd: string): Promise<LocalUiState> {
  const packageJson = await readPackageJson(cwd);
  const metadata = {
    name: typeof packageJson.name === 'string' && packageJson.name.trim() ? packageJson.name.trim() : undefined,
    version: typeof packageJson.version === 'string' && packageJson.version.trim() ? packageJson.version.trim() : undefined
  };
  const files = await listProjectFiles(cwd);
  const deps = dependencyNames(packageJson);
  const detectedState = await applyMcpDetection(state.empty ? applyProviderDetection(state, deps, files) : state, cwd);
  const releases = await detectReleases(cwd, metadata.version);
  const missionCards = state.empty
    ? buildMissionCards(
        {
          version: 1,
          scannedAt: detectedState.project.scannedAt ?? new Date().toISOString(),
          workspacePath: cwd,
          score: detectedState.gate.score ?? 0,
          scoreLabel: 'Not scanned',
          summary: 'Run a scan to build provider launch paths.',
          archetype: detectedState.project.archetype ?? 'unknown',
          productionCorePercent: detectedState.gate.productionCorePercent ?? 0,
          gaps: [],
          missionGraph: { areas: [], byArea: {}, byProvider: {}, repositoryEvidence: { env: [], security: [] } },
          stackWiring: { items: [], byKey: {} },
          providerRegistry: {
            version: 1,
            source: 'bundled',
            generatedAt: new Date().toISOString(),
            status: 'fresh',
            staleAfterDays: 14,
            providers: []
          }
        },
        detectedState.providers
      )
    : detectedState.missionCards;
  return {
    ...detectedState,
    missionCards,
    releases,
    selectedProviderId: detectedState.providers.find((provider) => provider.id === detectedState.selectedProviderId)
      ? detectedState.selectedProviderId
      : detectedState.providers[0]?.id ?? detectedState.selectedProviderId,
    project: {
      ...detectedState.project,
      name: metadata.name && !isPlaceholderProjectName(metadata.name) ? metadata.name : detectedState.project.name,
      version: metadata.version ?? detectedState.project.version
    }
  };
}

async function readState(cwd: string): Promise<LocalUiState> {
  let state: LocalUiState;
  try {
    const raw = await readFile(join(cwd, '.viberaven', 'last-scan.json'), 'utf8');
    state = mapArtifactToLocalUiState(JSON.parse(raw) as CliScanArtifact);
  } catch {
    state = emptyLocalUiState(cwd);
  }
  return enrichProjectMetadata(state, cwd);
}

function sendJson(response: ServerResponse, value: unknown): void {
  response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
  response.end(`${JSON.stringify(value, null, 2)}\n`);
}

function sendJsonStatus(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(`${JSON.stringify(value, null, 2)}\n`);
}

function sendText(response: ServerResponse, status: number, text: string): void {
  response.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(text);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sendBinary(response: ServerResponse, status: number, contentType: string, body: Buffer): void {
  response.writeHead(status, { 'content-type': contentType });
  response.end(body);
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function flagsForVerifyIntent(value: unknown): Record<string, string | boolean> | null {
  if (!isRecord(value) || typeof value.intent !== 'string') return null;
  switch (value.intent) {
    case 'verify_action':
      return typeof value.actionId === 'string' && value.actionId.trim()
        ? { verify: true, action: value.actionId.trim() }
        : null;
    case 'verify_gate':
      return { verify: true };
    case 'strict_gate':
      return { strict: true };
    case 'agent_mode_scan':
      return { 'agent-mode': true };
    default:
      return null;
  }
}

function localActionIntent(value: unknown): string | null {
  if (!isRecord(value) || typeof value.intent !== 'string') return null;
  return ['audit_vercel_supabase', 'cleanup_plan', 'preview_rehearsal', 'heal_plan', 'heal_prompt', 'heal_apply'].includes(value.intent)
    ? value.intent
    : null;
}

function stringField(value: unknown, max = 2000): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function parseAgentChatRequest(value: unknown): LocalAgentChatRequest | { error: string } {
  if (!isRecord(value)) return { error: 'Invalid agent chat request' };
  const rawCliId = stringField(value.cliId, 40);
  if (rawCliId === 'terminal') return { error: 'Terminal chat execution is not supported. Use an explicit terminal command surface.' };
  if (rawCliId !== 'codex' && rawCliId !== 'claude' && rawCliId !== 'gemini') return { error: 'Unsupported coding CLI' };
  const prompt = stringField(value.prompt, 12000);
  if (!prompt) return { error: 'Agent chat prompt is required' };
  const provider = isRecord(value.provider)
    ? { id: stringField(value.provider.id, 80), area: stringField(value.provider.area, 120), name: stringField(value.provider.name, 120) }
    : undefined;
  const release = isRecord(value.release)
    ? { id: stringField(value.release.id, 200), label: stringField(value.release.label, 120) }
    : undefined;
  const requestedAccessMode = stringField(value.accessMode, 40);
  const accessMode =
    requestedAccessMode === 'ask' || requestedAccessMode === 'approve' || requestedAccessMode === 'full'
      ? requestedAccessMode
      : 'approve';
  return {
    cliId: rawCliId,
    modelId: stringField(value.modelId, 120),
    reasoning: stringField(value.reasoning, 80),
    context: stringField(value.context, 80),
    accessMode,
    prompt,
    displayPrompt: stringField(value.displayPrompt, 240),
    taskKind: stringField(value.taskKind, 40),
    provider,
    release
  };
}

function taskKindExecutionBlock(taskKind: string | undefined): string | undefined {
  switch (taskKind) {
    case 'analyze':
      return 'Execution mode: analyze launch readiness. Read repo files and .viberaven artifacts; return concise findings with paths. Do not dump CLI install manuals or numbered manual runbooks.';
    case 'plan':
      return 'Execution mode: build an ordered fix plan from repo evidence. If the top blocker is repo-code, apply that fix in the project before answering. Do not reply with only manual instructions when code edits are possible.';
    case 'fix':
      return 'Execution mode: apply one minimal scoped repo fix IN CODE NOW. Read existing files, edit the project, save changes, then summarize. Forbidden: telling the user what to do manually when you can patch the repo yourself.';
    case 'verify':
      return 'Execution mode: verify launch readiness. Prefer `npx -y viberaven --verify` or read .viberaven/gate-result.json and agent-tasklist.md.';
    case 'provider':
      return 'Execution mode: provider proof or connect mission. Edit repo wiring when missing; separate dashboard-only steps from code changes; never claim live connection without proof.';
    case 'diff':
      return 'Execution mode: review production diff and flag risky changes.';
    case 'explain':
      return 'Execution mode: explain recent changes and next verification steps.';
    default:
      return undefined;
  }
}

function missionCardsContextBlock(state: LocalUiState): string | undefined {
  const cards = state.missionCards;
  if (!cards) return undefined;
  const lines: string[] = ['Mission cards snapshot from latest scan:'];
  if (cards.summary) lines.push('Summary: ' + cards.summary);
  if (cards.blockerCount) lines.push('Blockers: ' + String(cards.blockerCount));
  cards.blockers.slice(0, 6).forEach((blocker, index) => {
    lines.push(String(index + 1) + '. [' + blocker.category + '] ' + blocker.title + (blocker.detail ? ' — ' + blocker.detail : ''));
  });
  cards.connectProviders.slice(0, 5).forEach((provider) => {
    lines.push('Connect: ' + provider.name + ' (' + provider.status + ')');
  });
  return lines.length > 1 ? lines.join('\n') : undefined;
}

async function buildAgentChatPrompt(request: LocalAgentChatRequest, cwd: string): Promise<string> {
  const state = await readState(cwd);
  const executionBlock = taskKindExecutionBlock(request.taskKind);
  const cardsBlock = missionCardsContextBlock(state);
  const providerState = request.provider?.id
    ? state.providers.find((provider) => provider.id === request.provider?.id)
    : state.providers.find((provider) => provider.name === request.provider?.name);
  const mcp = providerState?.mcp;
  const releaseDiffBlock = await releaseDiffContextBlock(cwd, request.release?.id);
  const lines = [
    'You are VibeRaven Studio, a production-readiness coding agent for an open-source local runner.',
    `Project folder: ${cwd}`,
    request.modelId ? `Selected model label: ${request.modelId}` : undefined,
    request.reasoning ? `Reasoning: ${request.reasoning}` : undefined,
    request.context ? `Context: ${request.context}` : undefined,
    `Access mode: ${request.accessMode ?? 'approve'}`,
    request.provider?.name ? `Provider context: ${request.provider.area ?? 'Provider'} / ${request.provider.name}` : undefined,
    mcp ? `Provider MCP: ${mcp.label}${mcp.source ? ` (${mcp.source})` : ''}` : undefined,
    request.release?.label ? `Release context: ${request.release.label}` : undefined,
    releaseDiffBlock,
    state.gate?.label ? `Project status: ${state.gate.label} (${state.gate.status ?? 'unknown'})` : undefined,
    state.missionControl?.mainBlocker ? `Main blocker: ${state.missionControl.mainBlocker}` : undefined,
    executionBlock,
    cardsBlock,
    '',
    'Safety rules:',
    '- Stay scoped to this project folder.',
    (request.accessMode ?? 'approve') === 'ask'
      ? '- Ask before editing files, using the internet, running destructive commands, or changing provider settings.'
      : (request.accessMode ?? 'approve') === 'full'
        ? '- Full access is enabled for this local project; still explain destructive changes before running them.'
        : '- Edit project files when needed, but explain risky or destructive changes before making them.',
    '- Do not claim provider dashboard setup is complete from repo edits alone.',
    '- Keep the answer focused on production readiness.',
    '- Return only the final user-facing answer. Do not echo this prompt, session metadata, logs, or command transcripts.',
    '- For fix/plan/provider repo gaps: edit files in this project before answering. Manual dashboard steps are only for gaps that cannot be solved in repo code.',
    '- Never paste long VibeRaven operator manuals, heal loops, or PowerShell command blocks unless the user explicitly asked how to run verify.',
    '',
    'Response format (markdown):',
    '1. **Findings** — bullets with file paths or artifact names',
    '2. **Changes made** — what you edited, or say none only if the blocker is dashboard-only',
    '3. **Files touched** — list paths (or "none")',
    '4. **Next step** — one verify action or one dashboard action (do not paste raw npx commands; the UI renders Verify buttons)',
    '',
    'User mission:',
    request.prompt
  ];
  return lines.filter((line): line is string => typeof line === 'string').join('\n');
}

function normalizeCliModelId(modelId: string | undefined): string | undefined {
  if (!modelId?.trim()) return undefined;
  return modelId.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9.-]/g, '');
}

function resolveCliReasoningEffort(cliId: LocalAgentChatRequest['cliId'], reasoning: string | undefined): string | undefined {
  if (!reasoning?.trim()) return undefined;
  const normalized = reasoning.trim().toLowerCase();
  if (normalized === 'extra high') return cliId === 'claude' ? 'xhigh' : 'high';
  return normalized;
}

function insertCodexExecOptions(codexArgs: string[], pairs: string[]): void {
  if (!pairs.length) return;
  const execIndex = codexArgs.indexOf('exec');
  const insertAt = execIndex >= 0 ? execIndex + 1 : codexArgs.length;
  codexArgs.splice(insertAt, 0, ...pairs);
}

function codexAccessFlags(accessMode: LocalAgentChatRequest['accessMode']): string[] {
  if (accessMode === 'ask') return ['--sandbox', 'workspace-write', '--ask-for-approval', 'on-request'];
  if (accessMode === 'full') return ['--sandbox', 'danger-full-access', '--ask-for-approval', 'never'];
  return ['--sandbox', 'workspace-write', '--ask-for-approval', 'on-failure'];
}

function commandForAgentChat(request: LocalAgentChatRequest, prompt: string, cwd: string, outputPath?: string): { command: string; args: string[]; stdin?: string } {
  const command = process.platform === 'win32' ? `${request.cliId}.cmd` : request.cliId;
  const promptArg = prompt.replace(/\s*\r?\n\s*/g, ' ');
  const model = normalizeCliModelId(request.modelId);
  const effort = resolveCliReasoningEffort(request.cliId, request.reasoning);
  if (request.cliId === 'gemini') {
    const geminiArgs = ['-p', promptArg, '--output-format', 'text'];
    if (request.accessMode !== 'ask') geminiArgs.push('--skip-trust');
    if (model) geminiArgs.splice(0, 0, '-m', model);
    return { command, args: geminiArgs };
  }
  if (request.cliId === 'claude') {
    const claudeArgs = ['-p', promptArg];
    if (model) claudeArgs.unshift('--model', model);
    if (effort) claudeArgs.unshift('--effort', effort);
    if (request.accessMode === 'full') {
      claudeArgs.push('--dangerously-skip-permissions');
    }
    return { command, args: claudeArgs };
  }
  const codexArgs = ['--cd', cwd, ...codexAccessFlags(request.accessMode), 'exec', '--color', 'never'];
  const codexExecOptions: string[] = [];
  if (model) codexExecOptions.push('-m', model);
  if (effort) codexExecOptions.push('-c', `model_reasoning_effort="${effort}"`);
  insertCodexExecOptions(codexArgs, codexExecOptions);
  if (outputPath) codexArgs.push('--output-last-message', outputPath);
  codexArgs.push('-');
  return {
    command,
    args: codexArgs,
    stdin: prompt
  };
}

function quoteWindowsCmdArg(value: string): string {
  if (/^[A-Za-z0-9._/@:=+-]+$/.test(value)) return value;
  return `"${value.replace(/%/g, '%%').replace(/"/g, '""')}"`;
}

async function resolveWindowsNodeShim(command: string, cwd: string): Promise<{ command: string; args: string[] } | undefined> {
  if (process.platform !== 'win32' || !command.endsWith('.cmd')) return undefined;
  const shimPath = await new Promise<string | undefined>((resolvePath) => {
    const child = spawn('where.exe', [command], {
      cwd,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore']
    });
    let stdout = '';
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.once('error', () => resolvePath(undefined));
    child.once('close', (code) => {
      if (code !== 0) {
        resolvePath(undefined);
        return;
      }
      resolvePath(stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean));
    });
  });
  if (!shimPath) return undefined;
  try {
    const content = await readFile(shimPath, 'utf8');
    const match = content.match(/"%dp0%\\([^"]+\.js)"/i);
    if (!match?.[1]) return undefined;
    return { command: process.execPath, args: [join(dirname(shimPath), match[1])] };
  } catch {
    return undefined;
  }
}

async function runAgentCommand(command: string, args: string[], cwd: string, stdin?: string): Promise<LocalAgentRunResult> {
  const nodeShim = await resolveWindowsNodeShim(command, cwd);
  const useCmdShim = process.platform === 'win32' && command.endsWith('.cmd') && !nodeShim;
  const spawnCommand = nodeShim?.command ?? (useCmdShim ? (process.env.ComSpec || 'cmd.exe') : command);
  const spawnArgs = nodeShim
    ? [...nodeShim.args, ...args]
    : useCmdShim
      ? ['/d', '/s', '/c', [command, ...args.map(quoteWindowsCmdArg)].join(' ')]
      : args;
  return new Promise((resolveRun) => {
    const child = spawn(spawnCommand, spawnArgs, {
      cwd,
      windowsHide: true,
      stdio: [stdin ? 'pipe' : 'ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const append = (current: string, chunk: Buffer): string => {
      const next = current + chunk.toString('utf8');
      return next.length > 48_000 ? next.slice(0, 48_000) : next;
    };
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, 120_000);
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout = append(stdout, chunk);
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr = append(stderr, chunk);
    });
    if (stdin && child.stdin) {
      child.stdin.end(stdin);
    }
    child.once('error', (error) => {
      clearTimeout(timer);
      resolveRun({
        command,
        args,
        exitCode: null,
        output: '',
        stderr: error.message,
        timedOut
      });
    });
    child.once('close', (code) => {
      clearTimeout(timer);
      resolveRun({
        command,
        args,
        exitCode: code,
        output: stdout.trim(),
        stderr: stderr.trim(),
        timedOut
      });
    });
  });
}

async function runAgentChat(cwd: string, request: LocalAgentChatRequest): Promise<LocalAgentRunResult> {
  const prompt = await buildAgentChatPrompt(request, cwd);
  const outputPath = request.cliId === 'codex' ? join(cwd, '.viberaven', `studio-agent-${Date.now()}-${Math.random().toString(36).slice(2)}.md`) : undefined;
  if (outputPath) await mkdir(dirname(outputPath), { recursive: true });
  const { command, args, stdin } = commandForAgentChat(request, prompt, cwd, outputPath);
  const result = await runAgentCommand(command, args, cwd, stdin);
  if (outputPath) {
    try {
      const finalMessage = (await readFile(outputPath, 'utf8')).trim();
      if (finalMessage) return { ...result, output: finalMessage };
    } catch {
      // Fall back to stdout/stderr below when older Codex versions do not create the file.
    }
  }
  return result;
}

function firstGapId(state: LocalUiState): string | undefined {
  if (state.empty) return undefined;
  return state.providers.find((provider) => provider.nextFix?.id)?.nextFix?.id;
}

async function runLocalAction(cwd: string, intent: string): Promise<{ title: string; summary: string; artifact?: string }> {
  const artifactDir = join(cwd, '.viberaven');
  await mkdir(artifactDir, { recursive: true });

  if (intent === 'preview_rehearsal') {
    const state = await readState(cwd);
    const topProvider = state.providers[0];
    const projectName = state.project.name || 'Project';
    const gateLabel = state.gate.label || 'Gate not checked';
    const blocker = state.missionControl.mainBlocker || topProvider?.statusText || 'Launch state is waiting for evidence.';
    const nextAction = topProvider?.nextFix?.whatToChange || state.missionControl.nextAction || 'Open the launch map and choose the next provider.';
    const proof = topProvider?.cockpit?.proof.summary || state.missionControl.proof.summary || 'Proof has not been loaded yet.';
    const providerLines = state.providers.slice(0, 6).map((provider, index) => {
      const marker = index === 0 ? 'Priority' : `Beat ${index + 1}`;
      return `- ${marker}: ${provider.name} - ${provider.statusText}`;
    });
    const markdown = [
      '# VibeRaven preview rehearsal',
      '',
      `Project: ${projectName}`,
      `Project status: ${gateLabel}`,
      `Blocker: ${blocker}`,
      '',
      '## Recording flow',
      '',
      '1. Start on the Launch Canvas with the active lifeline stage visible.',
      '2. Click the priority provider card and show Fix, Proof, and Gate.',
      '3. Open the focused action panel for the current status.',
      '4. Use the runway to show the stage sequence.',
      '5. End on the next action, provider proof, and Verify button.',
      '',
      '## Provider beats',
      '',
      ...(providerLines.length > 0 ? providerLines : ['- Waiting: run Scan or open Map to load launch providers.']),
      '',
      '## Next action',
      '',
      nextAction,
      '',
      '## Proof',
      '',
      proof,
      ''
    ].join('\n');
    await writeFile(join(artifactDir, 'preview-rehearsal.md'), markdown, 'utf8');
    return {
      title: 'Preview rehearsal ready',
      summary: `${projectName}: ${gateLabel} with ${state.providers.length} provider beat${state.providers.length === 1 ? '' : 's'}`,
      artifact: '/api/artifacts/preview'
    };
  }

  if (intent === 'audit_vercel_supabase') {
    const auditInput = await collectVercelSupabaseAuditInput(cwd);
    const result = buildVercelSupabaseAudit(auditInput);
    await writeFile(join(artifactDir, 'audit-vercel-supabase.txt'), `${renderVercelSupabaseAudit(result)}\n`, 'utf8');
    return {
      title: result.status === 'pass' ? 'Audit passed' : 'Audit needs work',
      summary: result.summary,
      artifact: '/api/artifacts/audit'
    };
  }

  if (intent === 'cleanup_plan') {
    const plan = buildContextCleanupPlan({ projectRoot: cwd, files: await collectCleanupFiles(cwd) });
    await writeCleanupPlan(cwd, plan);
    return {
      title: 'Cleanup plan written',
      summary: `${plan.items.length} review item${plan.items.length === 1 ? '' : 's'} found`,
      artifact: '/api/artifacts/cleanup'
    };
  }

  const state = await readState(cwd);
  const gapId = firstGapId(state);
  if (!gapId) {
    return {
      title: 'No heal gap ready',
      summary: 'Run Scan or open the next provider before writing a heal plan.'
    };
  }

  const mode = intent === 'heal_prompt' ? 'prompt' : intent === 'heal_apply' ? 'apply' : 'plan';
  const result = await runHealCommand({ cwd, mode, gapId, yes: mode === 'apply', noVerify: true });
  if (mode === 'apply') {
    await writeFile(join(artifactDir, 'heal-apply-result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  }
  return {
    title: mode === 'prompt' ? 'Heal prompt written' : mode === 'apply' ? 'Guarded heal applied' : 'Heal plan written',
    summary: `${result.status} for ${gapId}${result.changedFiles.length > 0 ? ` (${result.changedFiles.join(', ')})` : ''}`,
    artifact: mode === 'prompt' ? '/api/artifacts/heal-prompt' : mode === 'apply' ? '/api/artifacts/heal-apply' : '/api/artifacts/heal-plan'
  };
}

async function sendArtifact(
  cwd: string,
  rel: string,
  response: ServerResponse,
  contentType = 'text/plain; charset=utf-8'
): Promise<void> {
  const absolute = resolve(cwd, rel);
  const root = resolve(cwd);
  if (!absolute.startsWith(root)) {
    sendText(response, 403, 'Forbidden');
    return;
  }
  try {
    const text = await readFile(absolute, 'utf8');
    response.writeHead(200, { 'content-type': contentType });
    response.end(text);
  } catch {
    sendText(response, 404, 'Artifact not found');
  }
}

async function sendReportArtifact(cwd: string, response: ServerResponse): Promise<void> {
  try {
    const text = await readFile(join(cwd, '.viberaven', 'report.html'), 'utf8');
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(text);
    return;
  } catch {
    const state = await readState(cwd);
    const projectName = escapeHtml(state.project.name || 'Project');
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>VibeRaven report preview</title>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at 50% 0%, rgba(124, 58, 237, 0.28), transparent 34%),
          #020617;
        color: #f8fafc;
        font-family: Inter, "Segoe UI", ui-sans-serif, system-ui, sans-serif;
      }
      main {
        width: min(760px, calc(100vw - 32px));
        border: 1px solid rgba(139, 92, 246, 0.38);
        border-radius: 18px;
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.9));
        box-shadow: 0 0 80px rgba(124, 58, 237, 0.26);
        padding: 28px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 22px;
      }
      .brand img {
        width: 54px;
        height: 54px;
        object-fit: contain;
        filter: drop-shadow(0 0 22px rgba(168, 85, 247, 0.65));
      }
      h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1.08;
      }
      p {
        margin: 10px 0 0;
        color: #cbd5e1;
        line-height: 1.55;
      }
      .steps {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin: 24px 0;
      }
      .step {
        border: 1px solid rgba(120, 145, 190, 0.2);
        border-radius: 12px;
        background: rgba(7, 16, 33, 0.72);
        padding: 14px;
      }
      .step b {
        display: block;
        color: #c4b5fd;
        margin-bottom: 6px;
      }
      .actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      a {
        min-height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(168, 85, 247, 0.55);
        border-radius: 11px;
        color: #fff;
        background: rgba(124, 58, 237, 0.28);
        padding: 0 16px;
        text-decoration: none;
        font-weight: 760;
      }
      a.primary {
        border-color: rgba(34, 197, 94, 0.6);
        background: rgba(21, 128, 61, 0.68);
      }
      @media (max-width: 680px) {
        .steps { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="brand">
        <img src="/report/assets/viberaven-agent-icon.png" alt="" />
        <div>
          <h1>Report preview is ready</h1>
          <p>${projectName} does not have a generated report artifact yet. The launch screen still gives you the provider map, agent handoff, and verification preview.</p>
        </div>
      </div>
      <section class="steps" aria-label="Report next steps">
        <div class="step"><b>1. Manage providers</b><span>Use the Provider Control Board to review each slot and open the right dashboard.</span></div>
        <div class="step"><b>2. Start agent fix</b><span>Preview the handoff flow and keep the fix scoped to one launch gap.</span></div>
        <div class="step"><b>3. Verify</b><span>Use Verify Now in the launch screen when you are ready to check the flow.</span></div>
      </section>
      <div class="actions">
        <a class="primary" href="/">Back to VibeRaven</a>
        <a href="https://viberaven.dev" target="_blank" rel="noreferrer">Docs</a>
        <a href="https://github.com/ohad6k/VibeRaven" target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </main>
  </body>
</html>`);
  }
}

async function sendExtensionIcon(cwd: string, response: ServerResponse): Promise<void> {
  try {
    const body = await readFile(join(cwd, 'media', 'extension-icon.png'));
    sendBinary(response, 200, 'image/png', body);
  } catch {
    sendText(response, 404, 'Icon not found');
  }
}

function contentTypeForAsset(pathname: string): string {
  switch (extname(pathname).toLowerCase()) {
    case '.svg':
      return 'image/svg+xml; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

async function sendBundledReportAsset(pathname: string, response: ServerResponse): Promise<void> {
  const rel = decodeURIComponent(pathname.replace(/^\/report\//, ''));
  const assetRoot = resolve(getBundledReportAssetsDir());
  const absolute = resolve(assetRoot, rel);
  if (!absolute.startsWith(assetRoot)) {
    sendText(response, 403, 'Forbidden');
    return;
  }
  try {
    const body = await readFile(absolute);
    sendBinary(response, 200, contentTypeForAsset(absolute), body);
  } catch {
    sendText(response, 404, 'Asset not found');
  }
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: Required<Pick<StartLocalUiServerOptions, 'cwd' | 'scanRunner'>>
): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  if (request.method === 'GET' && url.pathname === '/') {
    const state = await readState(options.cwd);
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(renderLocalUiHtml(state));
    return;
  }
  if (request.method === 'GET' && (url.pathname === '/overlay' || url.pathname === '/pet')) {
    sendText(response, 404, 'This VibeRaven surface has been removed. Use the Launch Canvas at /.');
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/project') {
    sendJson(response, await readState(options.cwd));
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/releases/compare') {
    const fromRef = safeGitRef(url.searchParams.get('from') ?? undefined);
    const toRef = safeGitRef(url.searchParams.get('to') ?? undefined);
    if (!fromRef || !toRef) {
      sendJsonStatus(response, 400, { error: 'Both from and to git refs are required.' });
      return;
    }
    if (!(await gitRefExists(options.cwd, fromRef)) || !(await gitRefExists(options.cwd, toRef))) {
      sendJsonStatus(response, 400, { error: 'One or both release refs were not found in this repo.' });
      return;
    }
    sendJson(response, await compareReleaseRefs(options.cwd, fromRef, toRef));
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/releases/changelog') {
    const fromRef = safeGitRef(url.searchParams.get('from') ?? undefined);
    const toRef = safeGitRef(url.searchParams.get('to') ?? undefined);
    if (!fromRef || !toRef) {
      sendJsonStatus(response, 400, { error: 'Both from and to git refs are required.' });
      return;
    }
    if (!(await gitRefExists(options.cwd, fromRef)) || !(await gitRefExists(options.cwd, toRef))) {
      sendJsonStatus(response, 400, { error: 'One or both release refs were not found in this repo.' });
      return;
    }
    sendJson(response, await releaseChangelogBetween(options.cwd, fromRef, toRef));
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/releases/rollback') {
    let body: unknown;
    try {
      body = await readJsonBody(request);
    } catch {
      sendText(response, 400, 'Invalid JSON');
      return;
    }
    const targetRef = isRecord(body) ? safeGitRef(stringField(body.target, 200)) : null;
    if (!targetRef) {
      sendJsonStatus(response, 400, { error: 'A valid git release ref is required.' });
      return;
    }
    const rollback = await rollbackReleaseRef(options.cwd, targetRef);
    if (!rollback.ok) {
      sendJsonStatus(response, 400, { error: rollback.message });
      return;
    }
    sendJson(response, {
      ...(await readState(options.cwd)),
      rollback
    });
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/cli-agents') {
    const fresh = url.searchParams.get('fresh') === '1' || url.searchParams.get('fresh') === 'true';
    sendJson(response, await detectLocalCliAgents(options.cwd, { fresh }));
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/cli-agents/probe') {
    let body: unknown;
    try {
      body = await readJsonBody(request);
    } catch {
      sendText(response, 400, 'Invalid JSON');
      return;
    }
    const cliId = isRecord(body) ? stringField(body.cliId, 40) : undefined;
    if (cliId !== 'codex' && cliId !== 'claude' && cliId !== 'gemini') {
      sendText(response, 400, 'Unsupported coding CLI');
      return;
    }
    const probe = await probeCliAgent(cliId, options.cwd);
    sendJson(response, {
      cliId,
      installed: probe.installed,
      ready: probe.ready,
      connected: probe.ready,
      stage: probe.stage,
      output: probe.output,
      message: probe.message,
    });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/cli-agents/run-setup') {
    let body: unknown;
    try {
      body = await readJsonBody(request);
    } catch {
      sendText(response, 400, 'Invalid JSON');
      return;
    }
    const cliId = isRecord(body) ? stringField(body.cliId, 40) : undefined;
    const step = isRecord(body) ? stringField(body.step, 40) : undefined;
    if (cliId !== 'codex' && cliId !== 'claude' && cliId !== 'gemini') {
      sendText(response, 400, 'Unsupported coding CLI');
      return;
    }
    if (step !== 'install' && step !== 'sign-in') {
      sendText(response, 400, 'Supported steps: install, sign-in.');
      return;
    }
    const command = setupCommandFor(cliId, step);
    const timeoutMs = step === 'sign-in' ? 45000 : 180000;
    const result = await runShellCommand(command, options.cwd, timeoutMs);
    const interactiveNote = step === 'sign-in'
      ? 'Sign-in may need a browser or interactive prompt. If nothing happens, type the command in the Studio terminal or use Open OS terminal.'
      : undefined;
    sendJson(response, {
      cliId,
      step,
      command,
      exitCode: result.exitCode,
      output: result.output,
      interactiveNote,
      message: step === 'install'
        ? (result.exitCode === 0 ? `${cliId} install finished.` : `${cliId} install did not finish cleanly.`)
        : (result.exitCode === 0 ? `${cliId} sign-in command finished.` : `${cliId} sign-in may still be waiting for interactive login.`)
    });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/cli-agents/run-command') {
    let body: unknown;
    try {
      body = await readJsonBody(request);
    } catch {
      sendText(response, 400, 'Invalid JSON');
      return;
    }
    const command = isRecord(body) ? stringField(body.command, 400) : undefined;
    if (!command) {
      sendText(response, 400, 'Missing command');
      return;
    }
    const result = await runShellCommand(command, options.cwd, 120000);
    sendJson(response, {
      command,
      exitCode: result.exitCode,
      output: result.output,
      message: result.exitCode === 0 ? 'Command finished.' : 'Command finished with a non-zero exit code.'
    });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/cli-agents/open-terminal') {
    let body: unknown;
    try {
      body = await readJsonBody(request);
    } catch {
      sendText(response, 400, 'Invalid JSON');
      return;
    }
    const cliId = isRecord(body) ? stringField(body.cliId, 40) : undefined;
    const step = isRecord(body) ? stringField(body.step, 40) : undefined;
    if (cliId !== 'codex' && cliId !== 'claude' && cliId !== 'gemini') {
      sendText(response, 400, 'Unsupported coding CLI');
      return;
    }
    if (step !== 'sign-in') {
      sendText(response, 400, 'Only sign-in opens an interactive terminal window.');
      return;
    }
    const command = setupCommandFor(cliId, 'sign-in');
    const opened = await openSystemTerminal(command, options.cwd);
    sendJson(response, { cliId, step, command, ...opened });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/agent-chat') {
    let body: unknown;
    try {
      body = await readJsonBody(request);
    } catch {
      sendText(response, 400, 'Invalid JSON');
      return;
    }
    const parsed = parseAgentChatRequest(body);
    if ('error' in parsed) {
      sendText(response, 400, parsed.error);
      return;
    }
    const agentRun = await runAgentChat(options.cwd, parsed);
    const state = await readState(options.cwd);
    sendJson(response, { agentRun, missionCards: state.missionCards });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/shutdown') {
    sendJson(response, { ok: true });
    setTimeout(() => process.kill(process.pid, 'SIGINT'), 0);
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/artifacts/tasklist') {
    await sendArtifact(options.cwd, join('.viberaven', 'agent-tasklist.md'), response);
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/artifacts/playbook') {
    await sendArtifact(options.cwd, join('.viberaven', 'launch-playbook.md'), response);
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/artifacts/audit') {
    await sendArtifact(options.cwd, join('.viberaven', 'audit-vercel-supabase.txt'), response);
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/artifacts/cleanup') {
    await sendArtifact(options.cwd, join('.viberaven', 'context-cleanup.md'), response);
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/artifacts/preview') {
    await sendArtifact(options.cwd, join('.viberaven', 'preview-rehearsal.md'), response);
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/artifacts/heal-plan') {
    await sendArtifact(options.cwd, join('.viberaven', 'heal-plan.md'), response);
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/artifacts/heal-prompt') {
    await sendArtifact(options.cwd, join('.viberaven', 'heal-prompt.md'), response);
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/artifacts/heal-apply') {
    await sendArtifact(options.cwd, join('.viberaven', 'heal-apply-result.json'), response, 'application/json; charset=utf-8');
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/artifacts/report') {
    await sendReportArtifact(options.cwd, response);
    return;
  }
  if (request.method === 'GET' && url.pathname.startsWith('/api/artifacts/report/')) {
    const assetPath = `/report/${url.pathname.replace(/^\/api\/artifacts\/report\//, '')}`;
    await sendBundledReportAsset(assetPath, response);
    return;
  }
  if (request.method === 'GET' && url.pathname === '/assets/extension-icon.png') {
    await sendExtensionIcon(options.cwd, response);
    return;
  }
  if (request.method === 'GET' && url.pathname.startsWith('/report/')) {
    await sendBundledReportAsset(url.pathname, response);
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/scan') {
    await options.scanRunner({ 'agent-mode': true }, [options.cwd]);
    sendJson(response, await readState(options.cwd));
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/verify') {
    await options.scanRunner({ verify: true }, [options.cwd]);
    sendJson(response, await readState(options.cwd));
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/verify-intent') {
    let body: unknown;
    try {
      body = await readJsonBody(request);
    } catch {
      sendText(response, 400, 'Invalid JSON');
      return;
    }
    const flags = flagsForVerifyIntent(body);
    if (!flags) {
      sendText(response, 400, 'Unsupported verify intent');
      return;
    }
    await options.scanRunner(flags, [options.cwd]);
    sendJson(response, await readState(options.cwd));
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/local-action') {
    let body: unknown;
    try {
      body = await readJsonBody(request);
    } catch {
      sendText(response, 400, 'Invalid JSON');
      return;
    }
    const intent = localActionIntent(body);
    if (!intent) {
      sendText(response, 400, 'Unsupported local action');
      return;
    }
    const action = await runLocalAction(options.cwd, intent);
    sendJson(response, { ...(await readState(options.cwd)), localAction: action });
    return;
  }
  sendText(response, 404, 'Not found');
}

function listen(server: ReturnType<typeof createServer>, startPort: number): Promise<number> {
  return new Promise((resolveListen, reject) => {
    const tryPort = (port: number) => {
      const onError = (error: NodeJS.ErrnoException) => {
        server.off('listening', onListening);
        if (error.code === 'EADDRINUSE' && port !== 0) {
          tryPort(port + 1);
          return;
        }
        reject(error);
      };
      const onListening = () => {
        server.off('error', onError);
        const address = server.address() as AddressInfo;
        resolveListen(address.port);
      };
      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(port, '127.0.0.1');
    };
    tryPort(startPort);
  });
}

export async function startLocalUiServer(options: StartLocalUiServerOptions): Promise<LocalUiServerHandle> {
  const cwd = resolve(options.cwd);
  const scanRunner = options.scanRunner ?? defaultScanRunner;
  const server = createServer((request, response) => {
    handleRequest(request, response, { cwd, scanRunner }).catch((error) => {
      sendText(response, 500, error instanceof Error ? error.message : String(error));
    });
  });
  const port = await listen(server, options.port ?? 4177);
  const url = `http://127.0.0.1:${port}`;
  if (options.openBrowser !== false) {
    const target = `${url}${options.initialPath ?? ''}`;
    const open =
      options.openMode === 'app-window'
        ? openUrlInAppWindow(target, options.appWindowSize).catch(() => openUrlInBrowser(target))
        : openUrlInBrowser(target);
    await open.catch((error) => {
      console.warn(error instanceof Error ? error.message : String(error));
    });
  }
  return {
    url,
    close: () =>
      new Promise<void>((resolveClose, reject) => {
        server.close((error) => (error ? reject(error) : resolveClose()));
      })
  };
}

export async function waitForServerShutdown(): Promise<void> {
  await new Promise<void>((resolveWait) => {
    const done = () => resolveWait();
    process.once('SIGINT', done);
    process.once('SIGTERM', done);
  });
}

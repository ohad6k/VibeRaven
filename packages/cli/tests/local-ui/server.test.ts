import { execFile } from 'node:child_process';
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { delimiter, join } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import { startLocalUiServer } from '../../src/local-ui/server';
import { localUiClientJs } from '../../src/local-ui/static/appClient';

let cleanup: Array<() => Promise<void>> = [];
const execFileAsync = promisify(execFile);

async function execGit(cwd: string, ...args: string[]): Promise<void> {
  await execFileAsync('git', args, { cwd });
}

async function installFakeCli(binDir: string, name: 'codex' | 'claude' | 'gemini'): Promise<void> {
  const extension = process.platform === 'win32' ? '.cmd' : '';
  const file = join(binDir, `${name}${extension}`);
  const body = process.platform === 'win32'
    ? `@echo off\r\nnode "%~dp0fake-agent.js" ${name} %*\r\n`
    : `#!/usr/bin/env sh\nnode "$(dirname "$0")/fake-agent.js" ${name} "$@"\n`;
  await writeFile(file, body, 'utf8');
  if (process.platform !== 'win32') await chmod(file, 0o755);
}

async function installFakeCliSuite(cwd: string): Promise<{ binDir: string; capturePath: string; restorePath: string | undefined }> {
  const binDir = join(cwd, 'fake-bin');
  const capturePath = join(cwd, 'agent-capture.jsonl');
  await mkdir(binDir, { recursive: true });
  await writeFile(join(binDir, 'fake-agent.js'), `
const fs = require('fs');
const cli = process.argv[2];
const args = process.argv.slice(3);
let stdin = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { stdin += chunk; });
process.stdin.on('end', () => {
  const capturePath = process.env.VIBERAVEN_FAKE_AGENT_CAPTURE;
  if (capturePath) fs.appendFileSync(capturePath, JSON.stringify({ cli, args, stdin }) + '\\n');
  if (args.includes('--version')) {
    console.log(cli + ' 1.0.0');
    return;
  }
  if (args.join(' ') === 'login status' || args.join(' ') === 'auth status') {
    console.log(cli + ' authenticated');
    return;
  }
  const outputIndex = args.indexOf('--output-last-message');
  if (outputIndex >= 0 && args[outputIndex + 1]) {
    fs.mkdirSync(require('path').dirname(args[outputIndex + 1]), { recursive: true });
    fs.writeFileSync(args[outputIndex + 1], 'fake codex final answer');
  }
  console.log('fake ' + cli + ' answer');
});
`, 'utf8');
  await Promise.all(['codex', 'claude', 'gemini'].map((name) => installFakeCli(binDir, name as 'codex' | 'claude' | 'gemini')));
  const restorePath = process.env.PATH;
  process.env.PATH = `${binDir}${delimiter}${restorePath ?? ''}`;
  process.env.VIBERAVEN_FAKE_AGENT_CAPTURE = capturePath;
  cleanup.push(async () => {
    process.env.PATH = restorePath;
    delete process.env.VIBERAVEN_FAKE_AGENT_CAPTURE;
  });
  return { binDir, capturePath, restorePath };
}

afterEach(async () => {
  for (const fn of cleanup.splice(0)) {
    await fn();
  }
});

describe('local UI server', () => {
  it('serves the app shell and project state', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'viberaven-local-ui-'));
    cleanup.push(() => rm(cwd, { recursive: true, force: true }));

    const server = await startLocalUiServer({ cwd, port: 0, openBrowser: false });
    cleanup.push(() => server.close());

    const html = await fetch(server.url).then((response) => response.text());
    const project = await fetch(`${server.url}/api/project`).then((response) => response.json());

    expect(html).toContain('VibeRaven Chat');
    expect(html).toContain('From AI demo to production');
    expect(html).toContain('Provider Control Board');
    expect(html).toContain('Versions & Releases');
    expect(html).toContain('Drop provider or version here to add context');
    expect(html).toContain('data-action="toggle-access"');
    expect(html).toContain('Full access');
    expect(html).toContain('Connect MCP');
    expect(html).not.toContain("location.href='/api/artifacts/tasklist'");
    expect(project.command).toBe('npx -y viberaven');
    expect(project.project.name).toBe('Project');
    expect(project.providers.length).toBeGreaterThan(0);
    expect(project.providers.find((provider: { id: string; iconHtml: string }) => provider.id === 'supabase')?.iconHtml)
      .toContain('cdn.simpleicons.org/supabase');
    expect(project.providers.find((provider: { id: string; iconHtml: string }) => provider.id === 'vercel')?.iconHtml)
      .toContain('cdn.simpleicons.org/vercel');
    expect(project.providers.find((provider: { id: string; iconHtml: string }) => provider.id === 'resend')?.iconHtml)
      .toContain('cdn.simpleicons.org/resend');
    expect(project.providers.find((provider: { id: string; mcp?: { status?: string } }) => provider.id === 'supabase')?.mcp?.status)
      .toBeDefined();
  });

  it('renders the provider cockpit from selected provider state instead of a hardcoded provider', () => {
    expect(localUiClientJs).toContain('function ProviderCard(provider)');
    expect(localUiClientJs).toContain('function ProviderDetailPanel()');
    expect(localUiClientJs).toContain("provider.id === demo.selectedProviderId");
    expect(localUiClientJs).toContain('Provider Control Board');
    expect(localUiClientJs).not.toContain('<h1>Your launch path</h1>');
  });

  it('routes provider, version, and access context into the agent chat payload', () => {
    expect(localUiClientJs).toContain('application/x-viberaven-provider');
    expect(localUiClientJs).toContain('application/x-viberaven-release');
    expect(localUiClientJs).toContain("accessMode: chat.accessMode || 'approve'");
    expect(localUiClientJs).toContain('provider: { id: provider.id, area: provider.area, name: provider.name }');
    expect(localUiClientJs).toContain('release: release ? { id: release.id, label: release.label } : undefined');
    expect(localUiClientJs).toContain("runChatTask(chat.releaseId ? 'diff' : chat.providerId ? 'provider' : 'analyze', value)");
  });

  it('renders MCP status hooks for provider cards and modal connection guidance', () => {
    expect(localUiClientJs).toContain('function providerMcp(provider)');
    expect(localUiClientJs).toContain('function providerMcpChip(provider)');
    expect(localUiClientJs).toContain('function ProviderMcpPanel(provider)');
    expect(localUiClientJs).toContain('MCP connected');
    expect(localUiClientJs).toContain('Connect MCP');
    expect(localUiClientJs).toContain('data-provider-tone');
    expect(localUiClientJs).not.toContain('<span class="vr-provider-light"></span>');
  });

  it('connects Codex, Claude, and Gemini through probe and agent chat access modes', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'viberaven-local-ui-agents-'));
    cleanup.push(() => rm(cwd, { recursive: true, force: true }));
    const { capturePath } = await installFakeCliSuite(cwd);

    const server = await startLocalUiServer({ cwd, port: 0, openBrowser: false });
    cleanup.push(() => server.close());

    const agents = await fetch(`${server.url}/api/cli-agents`).then((response) => response.json());
    for (const cliId of ['codex', 'claude', 'gemini'] as const) {
      const agent = agents.agents.find((item: { id: string }) => item.id === cliId);
      expect(agent.installed).toBe(true);
      expect(agent.connected).toBe(false);
    }

    for (const cliId of ['codex', 'claude', 'gemini'] as const) {
      const probe = await fetch(`${server.url}/api/cli-agents/probe`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cliId })
      }).then((response) => response.json());
      expect(probe.ready).toBe(true);
    }

    await fetch(`${server.url}/api/agent-chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cliId: 'codex', accessMode: 'full', prompt: 'Touch repo code if needed', taskKind: 'fix' })
    });
    await fetch(`${server.url}/api/agent-chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cliId: 'claude', accessMode: 'full', prompt: 'Touch repo code if needed', taskKind: 'fix' })
    });
    await fetch(`${server.url}/api/agent-chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cliId: 'gemini', accessMode: 'approve', prompt: 'Touch repo code if needed', taskKind: 'fix' })
    });

    const captures = (await import('node:fs/promises'))
      .readFile(capturePath, 'utf8')
      .then((raw) => raw.trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)));
    const calls = await captures;
    const codexChat = calls.find((call) => call.cli === 'codex' && call.args.includes('exec'));
    const claudeChat = calls.find((call) => call.cli === 'claude' && call.args.includes('-p'));
    const geminiChat = calls.find((call) => call.cli === 'gemini' && call.args.includes('-p'));

    expect(codexChat.args).toEqual(expect.arrayContaining(['--sandbox', 'danger-full-access', '--ask-for-approval', 'never', 'exec']));
    expect(codexChat.stdin).toContain('Full access is enabled for this local project');
    expect(claudeChat.args).toContain('--dangerously-skip-permissions');
    expect(claudeChat.args.join(' ')).toContain('Full access is enabled for this local project');
    expect(geminiChat.args).toContain('--skip-trust');
    expect(geminiChat.args.join(' ')).toContain('Edit project files when needed');
  });

  it('keeps current cockpit copy out of old scan-console patterns', () => {
    expect(localUiClientJs).toContain('Test connection');
    expect(localUiClientJs).toContain('<strong>Fix plan</strong>');
    expect(localUiClientJs).not.toContain('I finished sign in');
    expect(localUiClientJs).not.toContain('<strong>Launch gate</strong>');
  });

  it('shows a startup step with project name and version suggested from package.json', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'viberaven-local-ui-'));
    cleanup.push(() => rm(cwd, { recursive: true, force: true }));
    await writeFile(
      join(cwd, 'package.json'),
      JSON.stringify({ name: 'launch-cabin', version: '2.4.1' }),
      'utf8'
    );

    const server = await startLocalUiServer({ cwd, port: 0, openBrowser: false });
    cleanup.push(() => server.close());

    const html = await fetch(server.url).then((response) => response.text());
    const project = await fetch(`${server.url}/api/project`).then((response) => response.json());

    expect(html).toContain('VibeRaven Chat');
    expect(project.project.name).toBe('launch-cabin');
    expect(project.project.version).toBe('2.4.1');
  });

  it('keeps generated smoke-test package names as the clean Project fallback', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'npx-open-source-check-'));
    cleanup.push(() => rm(cwd, { recursive: true, force: true }));
    await writeFile(
      join(cwd, 'package.json'),
      JSON.stringify({ name: 'npx-open-source-check', version: '1.0.0' }),
      'utf8'
    );

    const server = await startLocalUiServer({ cwd, port: 0, openBrowser: false });
    cleanup.push(() => server.close());

    const html = await fetch(server.url).then((response) => response.text());
    const project = await fetch(`${server.url}/api/project`).then((response) => response.json());

    expect(html).toContain('Project');
    expect(html).not.toContain('Npx open source check');
    expect(project.project.name).toBe('Project');
    expect(project.project.version).toBe('1.0.0');
  });

  it('runs verify through a structured allowlisted intent instead of browser shell text', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'viberaven-local-ui-'));
    cleanup.push(() => rm(cwd, { recursive: true, force: true }));
    const calls: Array<{ flags: Record<string, string | boolean>; positional: string[] }> = [];

    const server = await startLocalUiServer({
      cwd,
      port: 0,
      openBrowser: false,
      scanRunner: async (flags, positional) => {
        calls.push({ flags, positional });
        return { exitCode: 0 };
      }
    });
    cleanup.push(() => server.close());

    const response = await fetch(`${server.url}/api/verify-intent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ intent: 'verify_action', actionId: 'VR-A1' })
    });

    expect(response.status).toBe(200);
    expect(calls).toEqual([{ flags: { verify: true, action: 'VR-A1' }, positional: [cwd] }]);
  });

  it('rejects unknown verify intents', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'viberaven-local-ui-'));
    cleanup.push(() => rm(cwd, { recursive: true, force: true }));
    const calls: Array<{ flags: Record<string, string | boolean>; positional: string[] }> = [];

    const server = await startLocalUiServer({
      cwd,
      port: 0,
      openBrowser: false,
      scanRunner: async (flags, positional) => {
        calls.push({ flags, positional });
        return { exitCode: 0 };
      }
    });
    cleanup.push(() => server.close());

    const response = await fetch(`${server.url}/api/verify-intent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ intent: 'run_shell', command: 'npx -y viberaven --verify' })
    });

    expect(response.status).toBe(400);
    expect(calls).toEqual([]);
  });

  it('builds release diff context from explicit refs', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'viberaven-local-ui-git-'));
    cleanup.push(() => rm(cwd, { recursive: true, force: true }));
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ name: 'demo', version: '1.0.0' }), 'utf8');
    await execGit(cwd, 'init');
    await execGit(cwd, 'config', 'user.email', 'test@example.com');
    await execGit(cwd, 'config', 'user.name', 'Test User');
    await execGit(cwd, 'add', '.');
    await execGit(cwd, 'commit', '-m', 'initial');
    await execGit(cwd, 'tag', 'v1.2.3');
    await writeFile(join(cwd, 'vercel.json'), '{}\n', 'utf8');
    await execGit(cwd, 'add', '.');
    await execGit(cwd, 'commit', '-m', 'add deploy config');

    const server = await startLocalUiServer({ cwd, port: 0, openBrowser: false });
    cleanup.push(() => server.close());

    const response = await fetch(`${server.url}/api/releases/compare?from=v1.2.3&to=HEAD`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.fromLabel).toBe('v1.2.3');
    expect(body.toLabel).toBe('HEAD');
    expect(body.diff).toContain('vercel.json');
    expect(body.stats.files).toBeGreaterThan(0);
  });

  it('serves bundled provider logo assets used by the provider rail', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'viberaven-local-ui-'));
    cleanup.push(() => rm(cwd, { recursive: true, force: true }));

    const server = await startLocalUiServer({ cwd, port: 0, openBrowser: false });
    cleanup.push(() => server.close());

    const response = await fetch(`${server.url}/report/assets/provider-authjs.svg`);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('image/svg+xml');
    expect(body).toContain('<svg');
  });
});

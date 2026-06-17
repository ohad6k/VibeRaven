import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { randomBytes, timingSafeEqual } from 'node:crypto';

import { renderLocalUiHtml } from './local-ui/staticApp';

const VERSION = '1.1.9-public-localhost';

type GateStatus = 'clear' | 'not_clear';
type GapSeverity = 'critical' | 'warning' | 'info';
type Gap = { id: string; title: string; detail: string; severity: GapSeverity; category: string; primaryMapCategory: string };
type Artifact = {
  version: 1;
  scannedAt: string;
  workspacePath: string;
  score: number;
  scoreLabel: string;
  summary: string;
  archetype: string;
  gaps: Gap[];
  missionGraph: { areas: Array<{ key: string; label: string; readinessPercent: number }> };
  stackWiring: { detected: string[] };
  providerRegistry: { providers: Array<{ provider: string; label: string }> };
  verificationSummary: { status: GateStatus; checkedAt: string };
  productionCorePercent: number;
};

function send(res: ServerResponse, status: number, body: string, contentType: string): void {
  res.writeHead(status, {
    'content-type': contentType,
    'cache-control': 'no-store',
  });
  res.end(body);
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  send(res, status, JSON.stringify(body), 'application/json; charset=utf-8');
}

function workspaceFrom(input: string | undefined): string {
  return resolve(process.cwd(), input ?? '.');
}

async function readOptional(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return '';
  }
}

async function buildArtifact(workspacePath: string): Promise<Artifact> {
  const packageJson = await readOptional(join(workspacePath, 'package.json'));
  const envExample = await readOptional(join(workspacePath, '.env.example'));
  const vercelJson = await readOptional(join(workspacePath, 'vercel.json'));
  const hasTests = /"test"\s*:|vitest|jest|playwright/i.test(packageJson);
  const hasDeploy = Boolean(vercelJson) || /vercel|netlify|render|railway/i.test(packageJson);
  const hasSupabase = existsSync(join(workspacePath, 'supabase')) || /supabase/i.test(packageJson);
  const gaps: Gap[] = [];

  if (!packageJson) {
    gaps.push({ id: 'LOCAL-PACKAGE-001', title: 'Missing package manifest', detail: 'No package.json was found at the scan root.', severity: 'warning', category: 'appFlow', primaryMapCategory: 'appFlow' });
  }
  if (!envExample) {
    gaps.push({ id: 'LOCAL-ENV-001', title: 'Missing env example', detail: 'Add .env.example with non-secret placeholders for required variables.', severity: 'warning', category: 'security', primaryMapCategory: 'security' });
  }
  if (!hasTests) {
    gaps.push({ id: 'LOCAL-TEST-001', title: 'Missing test command evidence', detail: 'Add a package.json test script or test dependency so local verification has repo evidence.', severity: 'warning', category: 'testing', primaryMapCategory: 'testing' });
  }
  if (!hasDeploy) {
    gaps.push({ id: 'LOCAL-DEPLOY-001', title: 'Missing deployment evidence', detail: 'Add deployment configuration or package metadata showing the intended production target.', severity: 'info', category: 'deployment', primaryMapCategory: 'deployment' });
  }
  if (hasSupabase && !existsSync(join(workspacePath, 'supabase', 'migrations'))) {
    gaps.push({ id: 'LOCAL-SUPABASE-001', title: 'Missing Supabase migration evidence', detail: 'Supabase appears in the repo, but no supabase/migrations directory was found.', severity: 'warning', category: 'database', primaryMapCategory: 'database' });
  }

  const score = Math.max(0, 100 - gaps.length * 15);
  const status: GateStatus = gaps.some((gap) => gap.severity !== 'info') ? 'not_clear' : 'clear';
  return {
    version: 1,
    scannedAt: new Date().toISOString(),
    workspacePath,
    score,
    scoreLabel: status === 'clear' ? 'Local evidence clear' : 'Local evidence needs work',
    summary: status === 'clear' ? 'Local repo evidence is present for the checked surfaces.' : 'Local repo evidence gaps were found.',
    archetype: 'local-first-public-source',
    gaps,
    missionGraph: {
      areas: [
        { key: 'appFlow', label: 'App flow', readinessPercent: packageJson ? 100 : 50 },
        { key: 'security', label: 'Security', readinessPercent: envExample ? 100 : 50 },
        { key: 'testing', label: 'Testing', readinessPercent: hasTests ? 100 : 50 },
        { key: 'deployment', label: 'Deployment', readinessPercent: hasDeploy ? 100 : 50 },
        { key: 'database', label: 'Database', readinessPercent: hasSupabase ? (existsSync(join(workspacePath, 'supabase', 'migrations')) ? 100 : 50) : 100 },
      ],
    },
    stackWiring: { detected: [packageJson && 'package.json', envExample && '.env.example', hasDeploy && 'deployment-config', hasSupabase && 'supabase'].filter(Boolean) as string[] },
    providerRegistry: { providers: [{ provider: 'local-readiness', label: 'Local readiness' }, { provider: 'vercel', label: 'Vercel' }, { provider: 'supabase', label: 'Supabase' }] },
    verificationSummary: { status, checkedAt: new Date().toISOString() },
    productionCorePercent: score,
  };
}

function gateResult(artifact: Artifact) {
  return {
    gate: { status: artifact.verificationSummary.status, checkedAt: artifact.verificationSummary.checkedAt },
    summary: artifact.summary,
    gaps: artifact.gaps.map((gap) => ({ id: gap.id, title: gap.title, severity: gap.severity, status: 'open' })),
  };
}

function tasklist(artifact: Artifact): string {
  const lines = ['# VibeRaven Local Tasklist', '', 'Workspace: ' + artifact.workspacePath, 'Gate: ' + artifact.verificationSummary.status, ''];
  if (artifact.gaps.length === 0) {
    lines.push('No local repo-evidence gaps found.');
  } else {
    for (const gap of artifact.gaps) {
      lines.push('## ' + gap.id + ': ' + gap.title, '', gap.detail, '', 'Severity: ' + gap.severity, '');
    }
  }
  return lines.join('\n').trim() + '\n';
}

async function writeArtifacts(workspacePath: string, artifact: Artifact): Promise<void> {
  const out = join(workspacePath, '.viberaven');
  await mkdir(out, { recursive: true });
  await writeFile(join(out, 'last-scan.json'), JSON.stringify(artifact, null, 2) + '\n');
  await writeFile(join(out, 'gate-result.json'), JSON.stringify(gateResult(artifact), null, 2) + '\n');
  await writeFile(join(out, 'agent-tasklist.md'), tasklist(artifact));
  await writeFile(join(out, 'context-map.json'), JSON.stringify({ version: 1, generatedAt: artifact.scannedAt, workspacePath, gateStatus: artifact.verificationSummary.status, openGapIds: artifact.gaps.map((gap) => gap.id), detectedEvidence: artifact.stackWiring.detected }, null, 2) + '\n');
  await writeFile(join(out, 'mission-map.md'), '# VibeRaven Local Mission Map\n\n' + artifact.missionGraph.areas.map((area) => '- ' + area.label + ': ' + area.readinessPercent + '%').join('\n') + '\n');
  await writeFile(join(out, 'agent-summary.md'), '# VibeRaven Local Summary\n\n' + artifact.summary + '\n');
  await writeFile(join(out, 'launch-playbook.md'), '# VibeRaven Local Launch Playbook\n\nRun viberaven --verify after each repo-code fix.\n');
}

async function runLocalScan(workspacePath: string): Promise<Artifact> {
  const artifact = await buildArtifact(workspacePath);
  await writeArtifacts(workspacePath, artifact);
  return artifact;
}

async function loadArtifact(workspacePath: string): Promise<Artifact | undefined> {
  try {
    return JSON.parse(await readFile(join(workspacePath, '.viberaven', 'last-scan.json'), 'utf8')) as Artifact;
  } catch {
    return undefined;
  }
}

function localState(cwd = process.cwd(), artifact?: Artifact) {
  const firstGap = artifact?.gaps[0];
  const provider = {
    id: 'local-readiness',
    label: 'Local readiness',
    area: 'appFlow',
    state: firstGap ? 'needs_repo_fix' : artifact ? 'repo_evidence_found' : 'not_detected',
    iconHtml: '<span aria-hidden="true">VR</span>',
    launchPath: [
      {
        id: 'local-repo-evidence',
        title: firstGap?.title ?? 'Local repo evidence',
        whyItMatters: firstGap?.detail ?? 'The public CLI checks deterministic local repo evidence.',
        whatToChange: firstGap ? 'Fix the listed repo evidence gap, then run viberaven --verify.' : 'Keep local repo evidence current as the app changes.',
        verifyWith: 'Run viberaven --verify.',
        keywords: ['local', 'source', 'verify'],
        area: 'appFlow',
        state: firstGap ? 'needs_fix' : artifact ? 'ready' : 'not_checked',
      },
    ],
    nextFix: firstGap ? {
      gapId: firstGap.id,
      launchPathItemId: 'local-repo-evidence',
      launchPathTitle: firstGap.title,
      currentIssue: firstGap.detail,
      whyItMatters: firstGap.detail,
      whatToChange: 'Edit repo-controlled evidence for this local readiness gap.',
      verifyWith: 'Run viberaven --verify.',
      prompt: 'Fix VibeRaven local gap ' + firstGap.id + ': ' + firstGap.detail,
    } : undefined,
  };

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    project: {
      name: basename(cwd) || cwd,
      workspacePath: cwd,
      score: artifact?.score,
      scoreLabel: artifact?.scoreLabel,
      summary: artifact?.summary,
      gateStatus: artifact?.verificationSummary.status ?? 'not_checked',
    },
    providers: [provider],
    selectedProviderId: provider.id,
    command: 'viberaven --verify',
  };
}

async function route(req: IncomingMessage, res: ServerResponse, options: { cwd: string; token: string }): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1');
  if (req.method === 'GET' && url.pathname === '/') {
    send(res, 200, renderLocalUiHtml(), 'text/html; charset=utf-8');
    return;
  }
  if (url.pathname.startsWith('/api/') && !isLocalApiRequestAuthorized(req, url, options.token)) {
    sendJson(res, 401, { error: 'Unauthorized local UI request.' });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/project') {
    sendJson(res, 200, localState(options.cwd, await loadArtifact(options.cwd)));
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/providers') {
    const state = localState(options.cwd, await loadArtifact(options.cwd));
    sendJson(res, 200, { providers: state.providers, selectedProviderId: state.selectedProviderId });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/tasklist') {
    let artifact = await loadArtifact(options.cwd);
    if (!artifact) {
      artifact = await runLocalScan(options.cwd);
    }
    send(res, 200, tasklist(artifact), 'text/plain; charset=utf-8');
    return;
  }
  if (req.method === 'POST' && (url.pathname === '/api/scan' || url.pathname === '/api/verify')) {
    const artifact = await runLocalScan(options.cwd);
    sendJson(res, 200, { ...localState(options.cwd, artifact), exitCode: artifact.verificationSummary.status === 'clear' ? 0 : 1 });
    return;
  }
  sendJson(res, 404, { error: 'Not found' });
}

function tokenMatches(actual: string | null, expected: string): boolean {
  if (!actual) return false;
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function isLocalHostHeader(host: string | undefined, port: number | undefined): boolean {
  if (!host || !port) return false;
  const allowed = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
  return allowed.has(host.toLowerCase());
}

function isLocalOrigin(origin: string | undefined, port: number | undefined): boolean {
  if (!origin || !port) return true;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'http:' && (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') && parsed.port === String(port);
  } catch {
    return false;
  }
}

function isLocalApiRequestAuthorized(req: IncomingMessage, url: URL, token: string): boolean {
  const port = req.socket.localPort;
  if (!isLocalHostHeader(req.headers.host, port) || !isLocalOrigin(req.headers.origin, port)) {
    return false;
  }
  const provided = req.headers['x-viberaven-local-ui-token'];
  const headerToken = Array.isArray(provided) ? provided[0] : provided;
  return tokenMatches(headerToken ?? url.searchParams.get('vr_token'), token);
}

function printHelp(): void {
  console.log(`viberaven ${VERSION}

Usage:
  viberaven [path]
  viberaven ui [--port <port>]
  viberaven scan [path]
  viberaven --agent-mode [path]
  viberaven --verify [path]
  viberaven --help
  viberaven --version

This public source export runs deterministic local repo-evidence checks only.
`);
}

function parsePort(argv: string[]): number {
  const index = argv.indexOf('--port');
  if (index === -1) return 4177;
  const parsed = Number.parseInt(argv[index + 1] ?? '', 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 4177;
}

function firstPathArg(argv: string[]): string | undefined {
  const commands = new Set(['ui', 'scan', 'version']);
  const flagsWithValues = new Set(['--port']);
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (commands.has(arg)) {
      continue;
    }
    if (flagsWithValues.has(arg)) {
      index += 1;
      continue;
    }
    if (arg.startsWith('--')) {
      continue;
    }
    return arg;
  }
  return undefined;
}

async function startUi(port: number, cwd: string): Promise<void> {
  const token = randomBytes(18).toString('base64url');
  const server = createServer((req, res) => {
    route(req, res, { cwd, token }).catch((error) => {
      sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
    });
  });
  const actualPort = await new Promise<number>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const address = server.address();
      resolve(typeof address === 'object' && address ? address.port : port);
    });
  });
  console.log(`VibeRaven local UI: http://127.0.0.1:${actualPort}/?vr_token=${encodeURIComponent(token)}`);
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    return 0;
  }
  if (argv.includes('--version') || argv.includes('-v') || argv[0] === 'version') {
    console.log(VERSION);
    return 0;
  }
  if (argv[0] === 'scan' || argv.includes('--agent-mode') || argv.includes('--verify')) {
    const workspace = workspaceFrom(firstPathArg(argv));
    const artifact = await runLocalScan(workspace);
    console.log('VibeRaven local scan wrote ' + join(workspace, '.viberaven'));
    if (argv.includes('--agent-mode')) {
      console.log(tasklist(artifact).trimEnd());
    }
    return argv.includes('--verify') && artifact.verificationSummary.status !== 'clear' ? 1 : 0;
  }
  if (argv[0] === 'ui' || argv.length === 0 || firstPathArg(argv)) {
    const pathArg = firstPathArg(argv);
    if (argv[0] !== 'ui' && pathArg && !existsSync(workspaceFrom(pathArg))) {
      console.error(`Unknown command: ${argv[0]}`);
      printHelp();
      return 1;
    }
    await startUi(parsePort(argv), workspaceFrom(pathArg));
    return 0;
  }
  console.error(`Unknown command: ${argv[0]}`);
  printHelp();
  return 1;
}

if (require.main === module) {
  main().then((code) => {
    process.exitCode = code;
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

import { access, link, lstat, mkdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';

import type {
  DeploySession,
  ProofItem,
  RedactedLocalRepo,
  RunnerActionResult,
  RunnerCapability,
  RunnerHandshakeRequest,
  RunnerHandshakeResponse,
  RunnerJob,
  RunnerQueuedJobsResponse
} from '../../../shared/deploy';
import { loadCredentials, saveRunnerSessionCredentials } from './config';
import { runProjectScan, type RunScanResult } from './runScan';
import { sanitizeArtifactForDisk } from './sanitizeArtifact';
import type { CliScanArtifact } from './types';
import {
  isSafeFixJobKind,
  type RunnerSafeFixInput,
  validateSafeFixJobInput
} from '../../../shared/runnerSafeFix';

export type PackageManager = DeploySession['packageManager'];

export interface CommandResult {
  ok: boolean;
  stdout: string;
  stderr?: string;
}

export type CommandRunner = (command: string, args: string[], cwd: string) => Promise<CommandResult>;
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;
export type RunProjectScanFn = typeof runProjectScan;

export interface RunnerConnectArgs {
  launchSessionId: string;
  oneTimeToken: string;
  once: boolean;
}

export interface RunnerConnectOptions extends RunnerConnectArgs {
  apiBaseUrl: string;
  workspaceRoot: string;
  runnerVersion: string;
  commandRunner?: CommandRunner;
  fetchImpl?: FetchLike;
  runProjectScan?: RunProjectScanFn;
}

export interface RunnerWatchOptions {
  apiBaseUrl: string;
  workspaceRoot: string;
  runnerSessionId: string;
  runnerAccessToken: string;
  redactionSecrets?: string[];
  commandRunner?: CommandRunner;
  fetchImpl?: FetchLike;
  runProjectScan?: RunProjectScanFn;
  pollIntervalMs?: number;
  signal?: AbortSignal;
  onPollError?: (error: unknown) => void;
}

export const RUNNER_POLL_INTERVAL_MS = 3000;

export const RUNNER_CAPABILITIES: RunnerCapability[] = [
  'read_files',
  'run_build',
  'run_tests',
  'apply_patch',
  'open_url',
  'deep_station_scan'
];

export function parseRunnerConnectFlags(flags: Record<string, string | boolean>): RunnerConnectArgs {
  const launchSessionId = typeof flags.session === 'string' ? flags.session.trim() : '';
  const oneTimeToken = typeof flags.token === 'string' ? flags.token.trim() : '';

  if (!launchSessionId || !oneTimeToken) {
    throw new Error('Usage: viberaven connect --session <launchSessionId> --token <oneTimeToken>');
  }

  return { launchSessionId, oneTimeToken, once: flags.once === true };
}

export async function runRunnerConnect(options: RunnerConnectOptions): Promise<RunnerHandshakeResponse> {
  const localRepo = await collectLocalRepoMetadata(options.workspaceRoot, options.commandRunner);
  const payload = buildRunnerHandshakeRequest({
    launchSessionId: options.launchSessionId,
    oneTimeToken: options.oneTimeToken,
    runnerVersion: options.runnerVersion,
    localRepo
  });

  const handshake = await postRunnerHandshake(options.apiBaseUrl, payload, options.fetchImpl);
  await saveRunnerSessionCredentials({
    runnerSessionId: handshake.runnerSession.id,
    runnerAccessToken: handshake.runnerAccessToken,
    apiBaseUrl: options.apiBaseUrl
  });

  if (options.once) {
    await pollRunnerJobsOnce({
      apiBaseUrl: options.apiBaseUrl,
      workspaceRoot: options.workspaceRoot,
      runnerSessionId: handshake.runnerSession.id,
      runnerAccessToken: handshake.runnerAccessToken,
      redactionSecrets: [options.oneTimeToken],
      commandRunner: options.commandRunner ?? runCommand,
      fetchImpl: options.fetchImpl ?? fetch,
      runProjectScan: options.runProjectScan
    });
  }
  return handshake;
}

export function buildRunnerWatchOptions(input: {
  apiBaseUrl: string;
  workspaceRoot: string;
  handshake: RunnerHandshakeResponse;
  oneTimeToken?: string;
  commandRunner?: CommandRunner;
  fetchImpl?: FetchLike;
  runProjectScan?: RunProjectScanFn;
}): RunnerWatchOptions {
  return {
    apiBaseUrl: input.apiBaseUrl,
    workspaceRoot: input.workspaceRoot,
    runnerSessionId: input.handshake.runnerSession.id,
    runnerAccessToken: input.handshake.runnerAccessToken,
    redactionSecrets: input.oneTimeToken ? [input.oneTimeToken] : undefined,
    commandRunner: input.commandRunner,
    fetchImpl: input.fetchImpl,
    runProjectScan: input.runProjectScan
  };
}

export async function runRunnerWatchLoop(options: RunnerWatchOptions): Promise<void> {
  const pollIntervalMs = options.pollIntervalMs ?? RUNNER_POLL_INTERVAL_MS;
  const signal = options.signal;

  while (!signal?.aborted) {
    try {
      await pollRunnerJobsOnce(options);
    } catch (error) {
      if (options.onPollError) {
        options.onPollError(error);
      } else {
        throw error;
      }
    }

    try {
      await sleepForRunnerPoll(pollIntervalMs, signal);
    } catch {
      break;
    }
  }
}

function sleepForRunnerPoll(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(createRunnerWatchAbortError());
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      cleanup();
      reject(createRunnerWatchAbortError());
    };

    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function createRunnerWatchAbortError(): Error {
  return new Error('Runner watch stopped.');
}

export async function pollRunnerJobsOnce(options: {
  apiBaseUrl: string;
  workspaceRoot: string;
  runnerSessionId: string;
  runnerAccessToken: string;
  redactionSecrets?: string[];
  commandRunner?: CommandRunner;
  fetchImpl?: FetchLike;
  runProjectScan?: RunProjectScanFn;
}): Promise<RunnerJob[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchJson<RunnerQueuedJobsResponse>(
    `${normalizeBaseUrl(options.apiBaseUrl)}/v1/runner/sessions/${encodeURIComponent(options.runnerSessionId)}/jobs`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${options.runnerAccessToken}` }
    },
    fetchImpl,
    'Runner job poll failed'
  );

  const completed: RunnerJob[] = [];
  for (const job of response.jobs) {
    await fetchJson<unknown>(
      `${normalizeBaseUrl(options.apiBaseUrl)}/v1/runner/jobs/${encodeURIComponent(job.id)}/ack`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${options.runnerAccessToken}` }
      },
      fetchImpl,
      'Runner job acknowledgement failed'
    );
    const result = await executeRunnerJob(job, {
      workspaceRoot: options.workspaceRoot,
      apiBaseUrl: options.apiBaseUrl,
      commandRunner: options.commandRunner ?? runCommand,
      runProjectScan: options.runProjectScan,
      redactionSecrets: [options.runnerAccessToken, ...(options.redactionSecrets ?? [])]
    });
    await fetchJson<unknown>(
      `${normalizeBaseUrl(options.apiBaseUrl)}/v1/runner/jobs/${encodeURIComponent(job.id)}/result`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${options.runnerAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(result)
      },
      fetchImpl,
      'Runner job result upload failed'
    );
    completed.push(job);
  }
  return completed;
}

async function executeRunnerJob(
  job: RunnerJob,
  options: {
    workspaceRoot: string;
    apiBaseUrl: string;
    commandRunner: CommandRunner;
    runProjectScan?: RunProjectScanFn;
    redactionSecrets?: string[];
  }
): Promise<RunnerActionResult> {
  if (job.kind === 'run_build' || job.kind === 'run_tests') {
    const scriptName = job.kind === 'run_build' ? 'build' : 'test';
    return executePackageScriptJob(job, scriptName, options);
  }

  if (job.kind === 'deep_station_scan' || job.kind === 'rescan') {
    return executeStationScanJob(job, options);
  }

  if (job.kind === 'prepare_deploy') {
    return summarizeSafeNoopJob(job);
  }

  if (isSafeFixJobKind(job.kind)) {
    return executeSafeFixJob(job, options.workspaceRoot);
  }

  return {
    jobId: job.id,
    status: 'needs_user',
    redacted: true,
    outputSummary: [`Unsupported runner job kind: ${job.kind}`],
    proofItems: [
      proofItemForJob(job, 'runner_summary', 'Runner job skipped', `Unsupported runner job kind: ${job.kind}`, [])
    ]
  };
}

async function executeSafeFixJob(job: RunnerJob, workspaceRoot: string): Promise<RunnerActionResult> {
  const validation = validateSafeFixJobInput(job.kind, job.input);
  if (!validation.ok) {
    return safeFixNeedsUser(job, 'SAFE_FIX_VALIDATION_FAILED', validation.reason);
  }

  const input = validation.input;
  const target = await resolveSafeFixTarget(workspaceRoot, input.path);
  if (!target.ok) {
    return safeFixNeedsUser(job, 'SAFE_FIX_VALIDATION_FAILED', target.reason);
  }

  if (job.kind === 'create_file') {
    return createSafeFixFile(job, input, target.path);
  }
  return applySafeFixReplacement(job, input, target.path);
}

async function createSafeFixFile(
  job: RunnerJob,
  input: RunnerSafeFixInput,
  targetPath: string
): Promise<RunnerActionResult> {
  try {
    await access(targetPath);
    return safeFixNeedsUser(job, 'SAFE_FIX_TARGET_EXISTS', `Refusing to overwrite ${input.path}.`);
  } catch {
    // Missing target is required for create_file.
  }

  try {
    await mkdir(dirname(targetPath), { recursive: true });
    await writeNewFileAtomically(targetPath, input.content);
  } catch {
    return safeFixNeedsUser(job, 'SAFE_FIX_WRITE_FAILED', `Could not create ${input.path}.`);
  }
  return safeFixSucceeded(job, input, 'created file', 'delete created file');
}

async function applySafeFixReplacement(
  job: RunnerJob,
  input: RunnerSafeFixInput,
  targetPath: string
): Promise<RunnerActionResult> {
  let current: string;
  try {
    current = await readFile(targetPath, 'utf-8');
  } catch {
    return safeFixNeedsUser(job, 'SAFE_FIX_TARGET_MISSING', `Cannot update missing file ${input.path}.`);
  }
  if (current.includes('\0')) {
    return safeFixNeedsUser(job, 'SAFE_FIX_BINARY_FILE', `Refusing to update binary-looking file ${input.path}.`);
  }
  if (current !== input.expectedExistingContent) {
    return safeFixNeedsUser(
      job,
      'SAFE_FIX_EXPECTED_CONTENT_MISMATCH',
      `Current file content did not match expected content for ${input.path}.`
    );
  }

  try {
    await replaceFileAtomically(targetPath, input.content);
  } catch {
    return safeFixNeedsUser(job, 'SAFE_FIX_WRITE_FAILED', `Could not update ${input.path}.`);
  }
  return safeFixSucceeded(job, input, 'updated file', 'restore previous content captured locally');
}

function safeFixSucceeded(
  job: RunnerJob,
  input: RunnerSafeFixInput,
  operation: 'created file' | 'updated file',
  rollback: string
): RunnerActionResult {
  const summary = `${operation} ${input.path}`;
  const outputSummary = [
    summary,
    `rollback: ${rollback}`,
    ...(input.verificationCommand ? [`verification: ${input.verificationCommand}`] : [])
  ];
  return {
    jobId: job.id,
    status: 'succeeded',
    redacted: true,
    outputSummary,
    proofItems: [
      proofItemForJob(job, 'repo_evidence', 'Safe fix proof', summary, [
        `path: ${input.path}`,
        `operation: ${operation}`,
        `rollback: ${rollback}`,
        ...(input.verificationCommand ? [`verification: ${input.verificationCommand}`] : [])
      ])
    ]
  };
}

function safeFixNeedsUser(job: RunnerJob, code: string, message: string): RunnerActionResult {
  const summary = redactRunnerProofText(message);
  return {
    jobId: job.id,
    status: 'needs_user',
    redacted: true,
    outputSummary: [summary],
    error: {
      code,
      message: summary
    },
    proofItems: [proofItemForJob(job, 'runner_summary', 'Safe fix skipped', summary, [])]
  };
}

async function resolveSafeFixTarget(
  workspaceRoot: string,
  relativePath: string
): Promise<{ ok: true; path: string } | { ok: false; reason: string }> {
  const root = await realpath(workspaceRoot).catch(() => resolve(workspaceRoot));
  const target = resolve(root, relativePath);
  if (!isInsideRoot(root, target)) {
    return { ok: false, reason: 'Safe fix target escaped the workspace root.' };
  }

  const parent = dirname(target);
  const parentReal = await realpathNearestExisting(parent, root);
  if (!isInsideRoot(root, parentReal)) {
    return { ok: false, reason: 'Safe fix parent path escaped the workspace root.' };
  }

  const targetReal = await realpath(target).catch(() => null);
  if (targetReal && !isInsideRoot(root, targetReal)) {
    return { ok: false, reason: 'Safe fix target path escaped the workspace root.' };
  }

  return { ok: true, path: target };
}

async function realpathNearestExisting(path: string, root: string): Promise<string> {
  let candidate = path;
  while (isInsideRoot(root, candidate)) {
    try {
      await lstat(candidate);
      return realpath(candidate);
    } catch {
      const next = dirname(candidate);
      if (next === candidate) {
        break;
      }
      candidate = next;
    }
  }
  return root;
}

function isInsideRoot(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

async function writeNewFileAtomically(targetPath: string, content: string): Promise<void> {
  const tempPath = tempPathFor(targetPath);
  try {
    await writeFile(tempPath, content, { encoding: 'utf-8', flag: 'wx' });
    await link(tempPath, targetPath);
  } finally {
    await rm(tempPath, { force: true }).catch(() => undefined);
  }
}

async function replaceFileAtomically(targetPath: string, content: string): Promise<void> {
  const tempPath = tempPathFor(targetPath);
  try {
    await writeFile(tempPath, content, { encoding: 'utf-8', flag: 'wx' });
    await rename(tempPath, targetPath);
  } finally {
    await rm(tempPath, { force: true }).catch(() => undefined);
  }
}

function tempPathFor(targetPath: string): string {
  return join(dirname(targetPath), `.${basename(targetPath)}.${randomUUID()}.tmp`);
}

async function executePackageScriptJob(
  job: RunnerJob,
  scriptName: 'build' | 'test',
  options: { workspaceRoot: string; commandRunner: CommandRunner; redactionSecrets?: string[] }
): Promise<RunnerActionResult> {
  const packageJson = await readPackageJson(options.workspaceRoot);
  if (!packageJson.scripts?.[scriptName]) {
    return {
      jobId: job.id,
      status: 'needs_user',
      redacted: true,
      outputSummary: [`package.json has no ${scriptName} script`],
      proofItems: [
        proofItemForJob(job, 'runner_summary', `${scriptName} script missing`, `package.json has no ${scriptName} script`, [])
      ]
    };
  }

  const packageManager = await detectPackageManager(options.workspaceRoot);
  const command = packageManager === 'unknown' ? 'npm' : packageManager;
  const args = packageScriptArgs(command, scriptName);
  const result = await options.commandRunner(command, args, options.workspaceRoot);
  const outputSummary = summarizeCommandOutput(`${command} ${args.join(' ')}`, result, options.redactionSecrets ?? []);

  return {
    jobId: job.id,
    status: result.ok ? 'succeeded' : 'failed',
    redacted: true,
    outputSummary,
    error: result.ok
      ? undefined
      : {
          code: 'PACKAGE_SCRIPT_FAILED',
          message: `${scriptName} script failed`
        },
    proofItems: [
      proofItemForJob(
        job,
        'command_output',
        `${scriptName} script proof`,
        `${command} ${args.join(' ')} ${result.ok ? 'succeeded' : 'failed'}`,
        outputSummary,
        options.redactionSecrets ?? []
      )
    ]
  };
}

async function executeStationScanJob(
  job: RunnerJob,
  options: {
    workspaceRoot: string;
    apiBaseUrl: string;
    runProjectScan?: RunProjectScanFn;
    redactionSecrets?: string[];
  }
): Promise<RunnerActionResult> {
  const credentials = await loadCredentials();
  if (!credentials?.accessToken) {
    return stationScanNeedsUser(
      job,
      'SCAN_AUTH_REQUIRED',
      'Sign in with `viberaven login` before the runner can execute station scans.',
      options.redactionSecrets ?? []
    );
  }

  const scan = options.runProjectScan ?? runProjectScan;
  const scanResult = await scan({
    workspacePath: options.workspaceRoot,
    accessToken: credentials.accessToken,
    apiBaseUrl: options.apiBaseUrl || credentials.apiBaseUrl
  });

  if (!scanResult.ok) {
    return stationScanFailure(job, scanResult, options.redactionSecrets ?? []);
  }

  const artifact = sanitizeArtifactForDisk(scanResult.artifact);
  const proof = buildStationScanProof(job.kind, artifact);
  const redactionSecrets = options.redactionSecrets ?? [];
  const proofItem = proofItemForJob(
    job,
    'repo_evidence',
    stationScanProofLabel(job.kind),
    proof.summary,
    proof.evidence,
    redactionSecrets
  );

  return {
    jobId: job.id,
    status: 'succeeded',
    redacted: true,
    outputSummary: [proofItem.summary, ...proofItem.evidence.slice(0, 6)],
    proofItems: [proofItem]
  };
}

function stationScanProofLabel(kind: RunnerJob['kind']): string {
  return kind === 'rescan' ? 'Rescan proof' : 'Deep station scan proof';
}

function buildStationScanProof(
  kind: RunnerJob['kind'],
  artifact: CliScanArtifact
): { summary: string; evidence: string[] } {
  const actionLabel = kind === 'rescan' ? 'Rescan' : 'Deep station scan';
  const summary = `${actionLabel} completed: production core ${artifact.productionCorePercent}% · score ${artifact.score} (${artifact.scoreLabel})`;
  const evidence = [
    `scannedAt: ${artifact.scannedAt}`,
    `workspace: ${artifact.workspacePath}`,
    `productionCorePercent: ${artifact.productionCorePercent}`,
    `score: ${artifact.score} (${artifact.scoreLabel})`,
    `gaps: ${artifact.gaps.length}`,
    `summary: ${artifact.summary || 'No summary returned.'}`
  ];

  for (const gap of artifact.gaps.slice(0, 5)) {
    evidence.push(`gap: ${gap.title} (${gap.severity})`);
  }

  for (const area of (artifact.missionGraph.areas ?? []).slice(0, 6)) {
    for (const mission of area.providerMissions.slice(0, 1)) {
      evidence.push(`mission: ${area.label} · ${mission.providerLabel} · ${mission.readinessPercent}%`);
    }
  }

  return { summary, evidence };
}

function stationScanFailure(job: RunnerJob, result: Exclude<RunScanResult, { ok: true }>, redactionSecrets: string[]): RunnerActionResult {
  if (result.kind === 'scan_limit') {
    return stationScanNeedsUser(
      job,
      'SCAN_LIMIT_REACHED',
      `Scan limit reached. Upgrade at ${result.upgradeUrl}.`,
      redactionSecrets
    );
  }
  if (result.kind === 'auth_required' || result.kind === 'session_invalid') {
    return stationScanNeedsUser(job, 'SCAN_AUTH_REQUIRED', result.message, redactionSecrets);
  }
  return {
    jobId: job.id,
    status: 'failed',
    redacted: true,
    outputSummary: [redactRunnerProofText(result.message, redactionSecrets)],
    error: {
      code: 'STATION_SCAN_FAILED',
      message: redactRunnerProofText(result.message, redactionSecrets)
    },
    proofItems: [
      proofItemForJob(
        job,
        'runner_summary',
        'Station scan failed',
        result.message,
        [],
        redactionSecrets
      )
    ]
  };
}

function stationScanNeedsUser(
  job: RunnerJob,
  code: string,
  message: string,
  redactionSecrets: string[]
): RunnerActionResult {
  const summary = redactRunnerProofText(message, redactionSecrets);
  return {
    jobId: job.id,
    status: 'needs_user',
    redacted: true,
    outputSummary: [summary],
    error: {
      code,
      message: summary
    },
    proofItems: [proofItemForJob(job, 'runner_summary', 'Station scan skipped', summary, [], redactionSecrets)]
  };
}

function summarizeSafeNoopJob(job: RunnerJob): RunnerActionResult {
  const summary = 'Prepared deploy proof summary; no files were changed.';
  return {
    jobId: job.id,
    status: 'succeeded',
    redacted: true,
    outputSummary: [summary],
    proofItems: [proofItemForJob(job, 'runner_summary', 'Runner summary', summary, [])]
  };
}

function proofItemForJob(
  job: RunnerJob,
  kind: ProofItem['kind'],
  label: string,
  summary: string,
  evidence: string[],
  redactionSecrets: string[] = []
): Omit<ProofItem, 'id' | 'createdAt'> {
  return {
    deploySessionId: job.deploySessionId,
    runnerSessionId: job.runnerSessionId,
    jobId: job.id,
    kind,
    label,
    summary: redactRunnerProofText(summary, redactionSecrets),
    evidence: evidence.map((value) => redactRunnerProofText(value, redactionSecrets)),
    redacted: true
  };
}

async function readPackageJson(workspaceRoot: string): Promise<{ scripts?: Record<string, string> }> {
  try {
    const raw = await readFile(join(workspaceRoot, 'package.json'), 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    if (isRecord(parsed) && isRecord(parsed.scripts)) {
      return { scripts: Object.fromEntries(Object.entries(parsed.scripts).filter(([, value]) => typeof value === 'string')) as Record<string, string> };
    }
  } catch {
    // Missing or invalid package.json is reported as a missing script.
  }
  return {};
}

function packageScriptArgs(command: string, scriptName: 'build' | 'test'): string[] {
  if (command === 'yarn') {
    return [scriptName];
  }
  return ['run', scriptName];
}

function summarizeCommandOutput(label: string, result: CommandResult, redactionSecrets: string[] = []): string[] {
  const lines = `${result.stdout}\n${result.stderr ?? ''}`
    .split(/\r?\n/)
    .map((line) => redactRunnerProofText(line.trim(), redactionSecrets))
    .filter(Boolean)
    .slice(0, 8);
  return [`${label} ${result.ok ? 'succeeded' : 'failed'}`, ...lines];
}

function redactRunnerProofText(value: string, additionalSecrets: string[] = []): string {
  let out = redactAdditionalSecrets(value, additionalSecrets);
  out = out.replace(
    /\b([A-Za-z0-9_]*(?:DATABASE_URL|ACCESS_TOKEN|AUTHORIZATION|API_KEY|SECRET|SECRET_KEY|SERVICE_ROLE_KEY|TOKEN|PASSWORD|PRIVATE_KEY|CREDENTIALS?)[A-Za-z0-9_]*)\s*=\s*(?:"[^"]*"|'[^']*'|[^"'\s;,]+)/gi,
    '$1=[REDACTED]'
  );
  out = out.replace(/\b((?:postgres|postgresql|mysql|mongodb|redis):\/\/)([^:\s/@]+):([^@\s]+)@/gi, '$1[REDACTED]@');
  out = out.replace(
    /\b(ghp_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,}|sk-proj-[A-Za-z0-9_-]{16,}|sk-[A-Za-z0-9_-]{20,}|sk_(?:live|test)_[A-Za-z0-9]{12,}|rk_(?:live|test)_[A-Za-z0-9]{12,}|whsec_[A-Za-z0-9]{12,}|sb_secret_[A-Za-z0-9_-]{16,}|sbp_[A-Za-z0-9_-]{16,}|vercel_[A-Za-z0-9_-]{16,}|xox[baprs]-[A-Za-z0-9-]{20,}|xapp-[A-Za-z0-9-]{20,})\b/g,
    '[REDACTED_SECRET]'
  );
  out = out.replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, '[REDACTED_SECRET]');
  out = out.replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]');
  out = out.replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]');
  out = out.replace(/-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]');
  out = out.replace(/\bAuthorization\s*:\s*([A-Za-z][A-Za-z0-9._-]*)\s+[^\s;,]+/gi, 'Authorization: $1 [REDACTED]');
  return out.length > 500 ? `${out.slice(0, 497)}...` : out;
}

function redactAdditionalSecrets(value: string, additionalSecrets: string[]): string {
  let out = value;
  const normalized = [...new Set(additionalSecrets.map((secret) => secret.trim()).filter((secret) => secret.length >= 8))]
    .sort((a, b) => b.length - a.length);
  for (const secret of normalized) {
    out = out.replace(new RegExp(escapeRegExp(secret), 'g'), '[REDACTED_SECRET]');
  }
  return out;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function fetchJson<T>(
  url: string,
  init: RequestInit,
  fetchImpl: FetchLike,
  errorPrefix: string
): Promise<T> {
  let response: Response;
  try {
    response = await fetchImpl(url, init);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${errorPrefix}: ${detail}`);
  }

  const bodyText = await response.text();
  if (!response.ok) {
    const detail = formatErrorBody(bodyText, response.statusText);
    throw new Error(`${errorPrefix} (${response.status}): ${detail}`);
  }

  if (!bodyText.trim()) {
    return undefined as T;
  }

  try {
    return JSON.parse(bodyText) as T;
  } catch (error) {
    throw new Error(`${errorPrefix}: response was not valid JSON.`, { cause: error });
  }
}

export async function collectLocalRepoMetadata(
  workspaceRoot: string,
  commandRunner: CommandRunner = runCommand
): Promise<RedactedLocalRepo> {
  const [remoteResult, branchResult, headResult, statusResult, packageManager] = await Promise.all([
    commandRunner('git', ['remote', '-v'], workspaceRoot),
    commandRunner('git', ['branch', '--show-current'], workspaceRoot),
    commandRunner('git', ['rev-parse', 'HEAD'], workspaceRoot),
    commandRunner('git', ['status', '--porcelain'], workspaceRoot),
    detectPackageManager(workspaceRoot)
  ]);

  const branch = branchResult.ok ? emptyToNull(branchResult.stdout) : null;
  const headSha = headResult.ok ? normalizeSha(headResult.stdout) : null;
  const dirty = statusResult.ok ? statusResult.stdout.trim().length > 0 : undefined;

  return {
    rootName: basename(workspaceRoot) || 'workspace',
    remotes: remoteResult.ok ? parseGitRemotes(remoteResult.stdout) : [],
    branch,
    headSha,
    dirty,
    packageManager
  };
}

export async function detectPackageManager(workspaceRoot: string): Promise<PackageManager> {
  const checks: Array<[PackageManager, string]> = [
    ['pnpm', 'pnpm-lock.yaml'],
    ['yarn', 'yarn.lock'],
    ['bun', 'bun.lockb'],
    ['bun', 'bun.lock'],
    ['npm', 'package-lock.json']
  ];

  for (const [manager, file] of checks) {
    try {
      await access(join(workspaceRoot, file));
      return manager;
    } catch {
      // try next lockfile
    }
  }

  return 'unknown';
}

export function buildRunnerHandshakeRequest(input: {
  launchSessionId: string;
  oneTimeToken: string;
  runnerVersion: string;
  localRepo: RedactedLocalRepo;
}): RunnerHandshakeRequest {
  return {
    launchSessionId: input.launchSessionId,
    oneTimeToken: input.oneTimeToken,
    runnerKind: 'cli',
    runnerVersion: input.runnerVersion,
    capabilities: RUNNER_CAPABILITIES,
    localRepo: input.localRepo
  };
}

export async function postRunnerHandshake(
  apiBaseUrl: string,
  payload: RunnerHandshakeRequest,
  fetchImpl: FetchLike = fetch
): Promise<RunnerHandshakeResponse> {
  const url = `${normalizeBaseUrl(apiBaseUrl)}/v1/runner/handshake`;
  let response: Response;

  try {
    response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not reach VibeRaven API at ${url}: ${detail}`);
  }

  const bodyText = await response.text();
  if (!response.ok) {
    const detail = formatErrorBody(bodyText, response.statusText);
    if (response.status === 401) {
      throw new Error(
        'Runner handshake failed (401): This connect token is wrong, expired, or already used. In the VibeRaven dashboard click "Show connect command", copy the full command immediately, and run it once from your project folder.',
      );
    }
    throw new Error(`Runner handshake failed (${response.status}): ${detail}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText) as unknown;
  } catch (error) {
    throw new Error('Runner handshake response was not valid JSON.', { cause: error });
  }

  if (!isRunnerHandshakeResponse(parsed)) {
    throw new Error('Runner handshake response was invalid.');
  }

  return parsed;
}

export function formatRepoMatch(repoMatch: RunnerHandshakeResponse['repoMatch']): string {
  switch (repoMatch) {
    case 'matched':
      return 'matched';
    case 'remote_mismatch':
      return 'remote mismatch';
    case 'branch_mismatch':
      return 'branch mismatch';
    case 'unknown':
      return 'unknown';
    default:
      return repoMatch;
  }
}

async function runCommand(command: string, args: string[], cwd: string): Promise<CommandResult> {
  return new Promise((resolve) => {
    execFile(command, args, { cwd, windowsHide: true }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        stdout: String(stdout ?? ''),
        stderr: String(stderr ?? '')
      });
    });
  });
}

function parseGitRemotes(stdout: string): RedactedLocalRepo['remotes'] {
  const remotes = new Map<string, RedactedLocalRepo['remotes'][number]>();

  for (const line of stdout.split(/\r?\n/)) {
    const match = line.match(/^(\S+)\s+(\S+)(?:\s+\((fetch|push)\))?$/);
    if (!match) {
      continue;
    }

    const name = match[1].trim();
    const normalizedUrl = normalizeRemoteUrl(match[2]);
    if (!name || !normalizedUrl) {
      continue;
    }

    const key = `${name}\0${normalizedUrl}`;
    remotes.set(key, {
      name,
      normalizedUrl,
      provider: detectRemoteProvider(normalizedUrl)
    });
  }

  return [...remotes.values()];
}

function normalizeRemoteUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (isLocalRemotePath(trimmed)) {
    return null;
  }

  const scpLike = trimmed.match(/^(?:[^@]+@)?([^:]+):(.+)$/);
  if (scpLike && !trimmed.includes('://')) {
    return stripGitSuffix(`https://${scpLike[1]}/${scpLike[2]}`);
  }

  try {
    const parsed = new URL(trimmed);
    parsed.username = '';
    parsed.password = '';
    parsed.hash = '';
    parsed.search = '';
    if (parsed.protocol === 'file:') {
      return null;
    }
    if (parsed.protocol === 'ssh:') {
      parsed.protocol = 'https:';
    }
    return stripGitSuffix(parsed.toString().replace(/\/+$/, ''));
  } catch {
    return stripGitSuffix(trimmed.replace(/\/\/[^/@]+@/, '//'));
  }
}

function isLocalRemotePath(value: string): boolean {
  return (
    /^[A-Za-z]:[\\/]/.test(value) ||
    /^\/\/[^/]/.test(value) ||
    /^\/(?!\/)/.test(value) ||
    /^~[\\/]/.test(value) ||
    /^\.{1,2}[\\/]/.test(value) ||
    /^\\\\/.test(value) ||
    /^file:\/\//i.test(value)
  );
}

function stripGitSuffix(url: string): string {
  return url.replace(/\.git$/i, '').replace(/\/+$/, '');
}

function detectRemoteProvider(normalizedUrl: string): RedactedLocalRepo['remotes'][number]['provider'] {
  const hostname = getHostname(normalizedUrl);
  if (hostname.includes('github.com')) {
    return 'github';
  }
  if (hostname.includes('gitlab.com')) {
    return 'gitlab';
  }
  if (hostname.includes('bitbucket.org')) {
    return 'bitbucket';
  }
  return 'unknown';
}

function getHostname(value: string): string {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return value.toLowerCase();
  }
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSha(value: string): string | null {
  const trimmed = value.trim();
  return /^[0-9a-f]{7,64}$/i.test(trimmed) ? trimmed : null;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

function formatErrorBody(bodyText: string, statusText: string): string {
  const trimmed = bodyText.trim();
  if (!trimmed) {
    return statusText || 'Unknown error';
  }

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    if (typeof parsed.message === 'string') {
      return parsed.message;
    }
    if (typeof parsed.error === 'string') {
      return parsed.error;
    }
  } catch {
    // plain text body
  }

  return trimmed;
}

function isRunnerHandshakeResponse(value: unknown): value is RunnerHandshakeResponse {
  if (!isRecord(value) || !isRecord(value.runnerSession)) {
    return false;
  }

  return (
    typeof value.runnerAccessToken === 'string' &&
    isRepoMatch(value.repoMatch) &&
    Array.isArray(value.allowedJobKinds) &&
    typeof value.pollAfterMs === 'number' &&
    typeof value.runnerSession.id === 'string' &&
    typeof value.runnerSession.deploySessionId === 'string' &&
    isRepoMatch(value.runnerSession.repoMatch)
  );
}

function isRepoMatch(value: unknown): value is RunnerHandshakeResponse['repoMatch'] {
  return value === 'matched' || value === 'remote_mismatch' || value === 'branch_mismatch' || value === 'unknown';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

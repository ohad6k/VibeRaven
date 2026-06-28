import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import {

  clearCredentials,

  loadCredentials,
  loadRunnerSessionCredentials,

  loadStackChoicesFile,

  resolveApiBaseUrl,
  resolveWorkspaceRoot,
  saveStackChoicesFile

} from './config';

import { requireCredentials, runDeviceLogin } from './auth';

import {
  enrichArtifactWithAccount,
  fetchAccountMe,
  formatScanLimitMessage,
  formatUsageLine,
  syncCredentialsFromAccount
} from './account';

import { runProjectScan } from './runScan';

import { writeScanArtifacts, type WriteArtifactsResult } from './artifacts';
import type { GateResult } from './contracts/gateResult';
import { renderGateResultJson } from './output/json';
import { renderJsonlEvents } from './output/jsonl';
import { exitCodeForStrictGate } from './commands/strictGate';

import { refreshReportFromDisk } from './report/refreshReport';

import { openPathInBrowser } from './openBrowser';

import { copyToClipboard } from './clipboard';
import { printScanSummary } from './terminalSummary';
import { ERROR, formatAgentStatus, LOGIN_REQUIRED } from './statusLabels';
import { sanitizeArtifactForDisk } from './sanitizeArtifact';
import {
  buildRunnerWatchOptions,
  formatRepoMatch,
  parseRunnerConnectFlags,
  runRunnerConnect,
  runRunnerWatchLoop
} from './runnerConnect';

import { isScanNotFoundError, loadLastArtifact, pickGap } from './tui/menu';

import { runInteractiveSession } from './tui/runInteractive';

import { runGuideCommand } from './commands/guide';
import { runNextCommand } from './commands/next';
import { runOpenCommand } from './commands/open';
import { runCondenseCommand } from './commands/condense';
import { runHealCommand } from './commands/heal';
import { resolveNextAction } from './resolveNextAction';
import { PRODUCTION_MAP_CATEGORY_KEYS_ALL } from '../../../shared/planLimits';
import { recommendStack } from './stackRecommend';

import { PUBLIC_AGENT_MODE_COMMAND, PUBLIC_INIT_ALL_COMMAND } from './contracts/commands';
import { runInitCommand } from './commands/runInit';
import { runDoctorAgentsCommand } from './commands/runDoctor';
import { runValidateNpmPackageCommand } from './commands/runValidateNpmPackage';
import { runAuditCommand } from './commands/runAudit';
import { runActionsCommand } from './commands/actions';
import { runVerifyActionCommand } from './commands/verifyAction';
import { runPreviewCommand } from './commands/preview';
import { startLocalUiServer, waitForServerShutdown } from './local-ui/server';
import { VERSION } from './version';
import { loadLoopState, saveLoopState, resetBatch } from './loopState';
import {
  buildNextActionBlock,
  printNextActionBlock,
  printProviderActionBlock,
} from './output/nextActionBlock';
import { buildTaskList } from './buildTaskList';
import { verifyProviderGap } from './providerMcpBridge';
import { renderActionSurface } from './actions/render';
import type { VibeRavenActionsManifest } from './actions/types';



export function printHelp(): void {

  console.log(`viberaven ${VERSION} — launch readiness for AI-built apps



Usage:

  viberaven              Open the local launch console for human TTY use

  viberaven ui [path]    Open the local launch console

  viberaven tui          Same interactive menu

  viberaven login [--api-url <url>]

  viberaven logout

  viberaven status

  viberaven actions [--json] [path]
                       Print current chat-native production action surface

  viberaven preview [--agent-mode] [--json]
                       Local production rehearsal for videos and onboarding; no login or API spend

  viberaven connect --session <id> --token <token> [--once] [--api-url <url>]
                       Handshake, save runner session, then watch for jobs (Ctrl+C to stop)

  viberaven watch [--api-url <url>]
                       Poll runner jobs using saved session credentials until Ctrl+C

  viberaven scan [--open] [--json] [--api-url <url>] [path]

  viberaven --agent-mode [--json|--jsonl] [path]
                       Agent-first scan; writes tasklist, gate-result, context-map, and per-gap JSON

  viberaven --strict[=warning] [path]
                       Fail when production gate is not clear; warning mode also fails on warnings

  viberaven --condense [path]
                       Refresh .viberaven/context-map.json from the last scan

  viberaven report [--open] [path]
                       Rebuild report.html from last scan (no new API scan)

  viberaven prompt [--gap <id>] [--provider <key>] [--area <key>] [--no-copy]

  viberaven stack set <area> <provider>

  viberaven stack clear <area>

  viberaven stack list

  viberaven stack recommend
                       Suggest agent-default stack from package.json

  viberaven next [--json] [path]
                       Next action from last scan (repo fix, provider guide, or upgrade)

  viberaven guide <provider> [--step N] [--json]
                       Provider setup wizard (vercel, supabase, stripe, auth-supabase)

  viberaven open [provider|url]
                       Open dashboard URL from next action or playbook

  viberaven init [--agents all|codex,claude,...] [--dry-run] [path]
                       Install bounded VibeRaven agent rules (${PUBLIC_INIT_ALL_COMMAND})

  viberaven doctor --agents [path]
                       Verify agent instruction files and canonical commands

  viberaven audit --vercel-supabase [--json] [path]
                       Local Vercel/Supabase repo evidence audit (RLS, pooler, secrets)



Agent workflow (Claude Code / Codex):

  ${PUBLIC_AGENT_MODE_COMMAND}

  Read .viberaven/agent-tasklist.md first, .viberaven/gate-result.json for the machine verdict, then .viberaven/context-map.json

  viberaven next --json → guide/open → scan again



Humans: run \`viberaven\` for the local launch console or \`VIBERAVEN_TUI=1 viberaven\` for the older menu.

Agents: use \`${PUBLIC_AGENT_MODE_COMMAND}\` directly (no --open required).



Environment:

  VIBERAVEN_API_URL   Managed API base URL (same server as the VS Code extension)

Security:

  CLI scans use VibeRaven login — not OPENAI_API_KEY. See packages/cli/SECURITY.md.

`);

}



export function parseArgs(argv: string[]): {

  command: string;

  flags: Record<string, string | boolean>;

  positional: string[];

} {

  const flags: Record<string, string | boolean> = {};

  const positional: string[] = [];

  let command = '';



  for (let i = 0; i < argv.length; i += 1) {

    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {

      flags.help = true;

      continue;

    }

    if (arg === '--version' || arg === '-v') {

      flags.version = true;

      continue;

    }

    if (arg.startsWith('--')) {

      const equalsIndex = arg.indexOf('=');

      const key = equalsIndex === -1 ? arg.slice(2) : arg.slice(2, equalsIndex);

      if (equalsIndex !== -1) {

        flags[key] = arg.slice(equalsIndex + 1);

        continue;

      }

      const next = argv[i + 1];

      if (
        next &&
        !isBooleanFlag(command, key) &&
        (!next.startsWith('-') || shouldConsumeLeadingHyphenValue(command, key, next))
      ) {

        flags[key] = next;

        i += 1;

      } else {

        flags[key] = true;

      }

      continue;

    }

    if (!command) {

      command = arg;

    } else {

      positional.push(arg);

    }

  }



  return { command, flags, positional };

}

function isBooleanFlag(command: string, key: string): boolean {
  if ([
    'agent-mode',
    'json',
    'jsonl',
    'condense',
    'heal',
    'plan',
    'prompt',
    'apply',
    'yes',
    'no-verify',
    'force-scan',
  ].includes(key)) {
    return true;
  }
  if (key === 'strict') return true;
  if (key === 'open' && (command === '' || command === 'scan' || command === 'report')) return true;
  if (key === 'verify' && command === '') return true;
  if (key === 'vercel-supabase' && command === 'audit') return true;
  if (key === 'json' && command === 'validate-npm-package') return true;
  if (key === 'dry-run' && command === 'init') return true;
  if (key === 'agents' && command === 'doctor') return true;
  return false;
}

function shouldConsumeLeadingHyphenValue(command: string, key: string, value: string): boolean {

  return command === 'connect' && (key === 'session' || key === 'token') && !value.startsWith('--');

}

function hasFlag(flags: Record<string, string | boolean>, key: string): boolean {
  return flags[key] === true || typeof flags[key] === 'string';
}

async function guardEarlyVerifyScan(input: {
  flags: Record<string, string | boolean>;
  positional: string[];
  wantsStrict: boolean;
}): Promise<number | undefined> {
  if (input.flags['force-scan'] === true) {
    return undefined;
  }

  const verifyLike = input.flags.verify === true || input.wantsStrict;
  if (!verifyLike) {
    return undefined;
  }

  const workspacePath = input.positional[0]
    ? join(process.cwd(), input.positional[0])
    : await resolveWorkspaceRoot(process.cwd());
  const loopState = await loadLoopState(workspacePath);
  if (loopState.batchApplied <= 0) {
    return undefined;
  }

  let artifact;
  try {
    artifact = await loadLastArtifact(workspacePath);
  } catch {
    return undefined;
  }

  const plan = artifact.plan ?? (await loadCredentials())?.plan ?? 'free';
  const batchSize = plan === 'pro' ? 10 : 3;
  if (loopState.batchApplied >= batchSize) {
    return undefined;
  }

  const appliedGapIds = new Set(loopState.appliedGapIdsSinceScan ?? []);
  const remainingRepoCodeTasks = buildTaskList(artifact).filter(
    (task) =>
      task.fixType === 'repo-code' &&
      task.requiresUserAction === false &&
      !appliedGapIds.has(task.gapId)
  );

  if (remainingRepoCodeTasks.length === 0) {
    return undefined;
  }

  const nextTask = remainingRepoCodeTasks[0];
  console.error('SCAN_DEFERRED: Local heal batch is not full yet, so VibeRaven is protecting scan quota.');
  console.error(`Batch progress: ${loopState.batchApplied}/${batchSize} local heals applied since the last scan.`);
  console.error(`Next local heal: npx -y viberaven --heal --apply --gap ${nextTask.gapId} --yes`);
  console.error('Run verify again after the batch is full, or add --force-scan if the user explicitly wants to spend a scan now.');
  return 4;
}

export type DefaultEntrypointMode = 'local-ui' | 'interactive' | 'agent-scan';

export function resolveDefaultEntrypointMode(options: {
  stdinIsTTY: boolean;
  stdoutIsTTY: boolean;
  env: Record<string, string | undefined>;
}): DefaultEntrypointMode {
  if (options.env.VIBERAVEN_TUI === '1') return 'interactive';
  if (options.env.VIBERAVEN_AGENT === '1') return 'agent-scan';
  return 'local-ui';
}

export type RunScanCommandResult = {
  exitCode: number;
  artifacts?: WriteArtifactsResult;
};

export function formatScanJsonStdout(artifact: Parameters<typeof sanitizeArtifactForDisk>[0]): string {

  return JSON.stringify(sanitizeArtifactForDisk(artifact), null, 2);

}



async function cmdLogin(flags: Record<string, string | boolean>): Promise<void> {

  const apiBaseUrl = resolveApiBaseUrl(typeof flags['api-url'] === 'string' ? flags['api-url'] : undefined);

  await runDeviceLogin(apiBaseUrl);

}



async function cmdLogout(): Promise<void> {

  await clearCredentials();

  console.log('Signed out.');

}

async function cmdProviderVerify(
  flags: Record<string, string | boolean>,
  positional: string[]
): Promise<number> {
  const provider = typeof flags.provider === 'string' ? flags.provider : positional[0];
  const check = typeof flags.check === 'string' ? flags.check : positional[1];

  if (!provider || !check) {
    console.error('Usage: viberaven provider-verify --provider <supabase|vercel> --check <id> [--plan free|pro]');
    return 1;
  }

  let plan = typeof flags.plan === 'string' ? flags.plan : 'free';
  if (!flags.plan) {
    const creds = await loadCredentials();
    if (creds?.plan === 'pro' || creds?.plan === 'free') {
      plan = creds.plan;
    }
  }

  const result = await verifyProviderGap({
    provider,
    check,
    cwd: process.cwd(),
    plan,
  });

  console.log(JSON.stringify(result, null, 2));
  return result.verified ? 0 : 1;
}



async function cmdStatus(
  flags: Record<string, string | boolean>,
  positional: string[]
): Promise<number> {

  const creds = await loadCredentials();

  if (!creds?.accessToken) {

    console.log('Not signed in. Run: viberaven login');

    return 1;

  }

  const startDir = positional[0] ? join(process.cwd(), positional[0]) : process.cwd();
  let artifact: Awaited<ReturnType<typeof loadLastArtifact>> | undefined;
  try {
    artifact = await loadLastArtifact(startDir);
  } catch {
    artifact = undefined;
  }

  try {

    const synced = await syncCredentialsFromAccount(creds);
    const usage = synced.account.usage;
    const next = artifact ? resolveNextAction(artifact) : undefined;

    if (flags.json) {
      console.log(
        JSON.stringify(
          {
            email: synced.email ?? creds.email ?? null,
            plan: synced.plan ?? creds.plan ?? usage.plan,
            scansUsed: usage.used,
            scansLimit: usage.limit,
            period: usage.period,
            productionCorePercent: artifact?.productionCorePercent ?? null,
            score: artifact?.score ?? null,
            unlockedLanes: usage.unlockedMapCategoryKeys.length,
            totalLanes: PRODUCTION_MAP_CATEGORY_KEYS_ALL.length,
            next: next ?? null,
            apiBaseUrl: synced.apiBaseUrl
          },
          null,
          2
        )
      );
      return 0;
    }

    console.log(`Signed in: ${synced.email ?? '(email unknown)'}`);

    console.log(`Plan: ${synced.plan ?? 'unknown'}`);

    console.log(formatUsageLine(usage));

    if (artifact) {
      console.log(`Production core: ${artifact.productionCorePercent}% · Score ${artifact.score}`);
      console.log(
        `Lanes: ${usage.unlockedMapCategoryKeys.length}/${PRODUCTION_MAP_CATEGORY_KEYS_ALL.length} unlocked`
      );
      if (next) {
        console.log(`Next: ${next.title}`);
      }
    } else {
      console.log('No local scan yet. Run: viberaven scan');
    }

    console.log(`API: ${synced.apiBaseUrl}`);

    return 0;

  } catch (error) {

    console.log(`Signed in (cached): ${creds.email ?? '(email unknown)'}`);

    console.log(`Plan: ${creds.plan ?? 'unknown'}`);

    console.log(`API: ${creds.apiBaseUrl}`);

    console.warn(error instanceof Error ? error.message : String(error));

    return 1;

  }

}

function createRunnerWatchAbortController(): AbortController {
  const controller = new AbortController();
  const onSigint = () => {
    console.log('\nStopping runner watch...');
    controller.abort();
  };
  process.once('SIGINT', onSigint);
  controller.signal.addEventListener(
    'abort',
    () => {
      process.off('SIGINT', onSigint);
    },
    { once: true }
  );
  return controller;
}

async function cmdConnect(flags: Record<string, string | boolean>): Promise<number> {
  let connectArgs;

  try {
    connectArgs = parseRunnerConnectFlags(flags);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }

  const apiBaseUrl = resolveApiBaseUrl(typeof flags['api-url'] === 'string' ? flags['api-url'] : undefined);
  const workspaceRoot = await resolveWorkspaceRoot(process.cwd());

  try {
    console.log(`Connecting VibeRaven runner from ${workspaceRoot}...`);
    const result = await runRunnerConnect({
      ...connectArgs,
      apiBaseUrl,
      workspaceRoot,
      runnerVersion: VERSION
    });

    const repoMatch = formatRepoMatch(result.repoMatch);
    console.log(`Connected runner session: ${result.runnerSession.id}`);
    console.log(`Repo match: ${repoMatch}`);

    if (result.repoMatch !== 'matched') {
      console.log('The web cockpit remains the command center. Return there to review the repo mismatch before continuing.');
    }

    if (!connectArgs.once) {
      console.log('Watching for runner jobs. Press Ctrl+C to stop.');
      const watchController = createRunnerWatchAbortController();
      await runRunnerWatchLoop({
        ...buildRunnerWatchOptions({
          apiBaseUrl,
          workspaceRoot,
          handshake: result,
          oneTimeToken: connectArgs.oneTimeToken
        }),
        signal: watchController.signal,
        onPollError: (error) => {
          console.warn(error instanceof Error ? error.message : String(error));
        }
      });
    }

    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error('The web cockpit remains the command center. Return there to create a fresh runner command if needed.');
    return 1;
  }
}

async function cmdWatch(flags: Record<string, string | boolean>): Promise<number> {
  const savedRunner = await loadRunnerSessionCredentials();
  if (!savedRunner) {
    console.error('No saved runner session. Run: viberaven connect --session <id> --token <token>');
    return 1;
  }

  const apiBaseUrl = resolveApiBaseUrl(
    typeof flags['api-url'] === 'string' ? flags['api-url'] : savedRunner.apiBaseUrl
  );
  const workspaceRoot = await resolveWorkspaceRoot(process.cwd());
  const watchController = createRunnerWatchAbortController();

  try {
    console.log(`Watching runner jobs for session ${savedRunner.runnerSessionId} from ${workspaceRoot}...`);
    console.log('Press Ctrl+C to stop.');
    await runRunnerWatchLoop({
      apiBaseUrl,
      workspaceRoot,
      runnerSessionId: savedRunner.runnerSessionId,
      runnerAccessToken: savedRunner.runnerAccessToken,
      signal: watchController.signal,
      onPollError: (error) => {
        console.warn(error instanceof Error ? error.message : String(error));
      }
    });
    return 0;
  } catch (error) {
    if (watchController.signal.aborted) {
      return 0;
    }
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}



export async function runScanCommand(

  flags: Record<string, string | boolean>,

  positional: string[],

  options?: { deferMachineOutput?: boolean }

): Promise<RunScanCommandResult> {

  const workspacePath = positional[0]
    ? join(process.cwd(), positional[0])
    : await resolveWorkspaceRoot(process.cwd());

  const apiBaseUrl = resolveApiBaseUrl(typeof flags['api-url'] === 'string' ? flags['api-url'] : undefined);



  let accessToken: string;

  try {

    ({ accessToken } = await requireCredentials(apiBaseUrl));

  } catch (error) {

    const message = error instanceof Error ? error.message : String(error);

    if (message.startsWith(`${LOGIN_REQUIRED}:`)) {
      console.log('LOGIN_REQUIRED: Starting VibeRaven browser sign-in so this scan can continue.');
      console.log('AGENT_ACTION: Open the VibeRaven approval URL for the user if the browser does not open automatically.');
      await runDeviceLogin(apiBaseUrl);
      console.log('LOGIN_RESUME: Sign-in complete. Continuing the original scan.');
      try {
        ({ accessToken } = await requireCredentials(apiBaseUrl));
      } catch (retryError) {
        console.error(retryError instanceof Error ? retryError.message : String(retryError));
        return { exitCode: 1 };
      }
    } else {
      console.error(message);
      return { exitCode: 1 };
    }

  }



  if (!options?.deferMachineOutput) {
    console.log(`Scanning ${workspacePath}…`);
  }

  const result = await runProjectScan({ workspacePath, accessToken, apiBaseUrl });



  if (!result.ok) {

    if (result.kind === 'scan_limit') {

      console.error(formatScanLimitMessage(result.upgradeUrl));

      try {

        const account = await fetchAccountMe(apiBaseUrl, accessToken);

        console.error(formatUsageLine(account.usage));

      } catch {

        // usage refresh is best-effort when blocked

      }

      console.error('Tip: `viberaven report` rebuilds from last-scan.json without using a scan.');

      return { exitCode: 2 };

    }

    if (result.kind === 'auth_required' || result.kind === 'session_invalid') {
      console.error(formatAgentStatus(LOGIN_REQUIRED, result.message));
      return { exitCode: 1 };
    }

    console.error(formatAgentStatus(ERROR, result.message));

    return { exitCode: 1 };

  }



  const artifact = await enrichArtifactWithAccount(result.artifact, apiBaseUrl, accessToken);

  const paths = await writeScanArtifacts({ artifact, cwd: workspacePath });



  if (flags.json && !options?.deferMachineOutput) {

    console.log(formatScanJsonStdout(artifact));

    return { exitCode: 0, artifacts: paths };

  }

  if (!options?.deferMachineOutput) {
    printScanSummary(artifact, paths);
  }

  if (artifact.usage && !options?.deferMachineOutput) {

    console.log(formatUsageLine(artifact.usage));

  }

  if (flags['agent-mode'] && !options?.deferMachineOutput) {
    const loopState = await loadLoopState(workspacePath);
    const openGapCount = artifact.gaps.length;
    const updatedState = resetBatch(loopState, openGapCount);
    const tasks = buildTaskList(artifact);
    const plan = artifact.plan ?? 'free';
    const block = buildNextActionBlock(tasks, updatedState, plan);
    printNextActionBlock(block);
    printProviderActionBlock(tasks);
    try {
      const manifest = JSON.parse(await readFile(paths.actionsPath, 'utf8')) as VibeRavenActionsManifest;
      console.log(renderActionSurface(manifest, { limit: 5 }).trimEnd());
    } catch (error) {
      console.warn(error instanceof Error ? error.message : String(error));
    }
    await saveLoopState(workspacePath, updatedState);
  }

  if (flags.open) {

    try {

      await openPathInBrowser(paths.reportPath);

    } catch (error) {

      console.warn(error instanceof Error ? error.message : String(error));

    }

  }



  return { exitCode: 0, artifacts: paths };

}



async function cmdReport(
  flags: Record<string, string | boolean>,
  positional: string[]
): Promise<number> {
  const startDir = positional[0] ? join(process.cwd(), positional[0]) : process.cwd();

  try {
    const paths = await refreshReportFromDisk(startDir);
    console.log(`Report refreshed: ${paths.reportPath}`);

    if (flags.open) {
      try {
        await openPathInBrowser(paths.reportPath);
      } catch (error) {
        console.warn(error instanceof Error ? error.message : String(error));
      }
    }

    return 0;
  } catch (error) {
    if (isScanNotFoundError(error)) {
      console.error(error.message);
      return 1;
    }
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

async function cmdPrompt(

  flags: Record<string, string | boolean>,

  positional: string[]

): Promise<number> {

  const startDir = positional[0] ? join(process.cwd(), positional[0]) : process.cwd();

  let artifact;

  try {

    artifact = await loadLastArtifact(startDir);

  } catch (error) {

    console.error(error instanceof Error ? error.message : 'No scan found. Run: viberaven scan');

    return 1;

  }



  const gap = pickGap(artifact, {

    gapId: typeof flags.gap === 'string' ? flags.gap : undefined,

    provider: typeof flags.provider === 'string' ? flags.provider : undefined,

    area: typeof flags.area === 'string' ? flags.area : undefined

  });



  if (!gap) {

    console.error('No matching gap. Run `viberaven scan` or pass --gap <id>.');

    return 1;

  }



  const skipCopy = flags['no-copy'] === true;

  if (!skipCopy) {
    try {
      await copyToClipboard(gap.copyPrompt);
      console.log(`Copied to clipboard: ${gap.title}`);
      return 0;
    } catch (error) {
      console.warn(error instanceof Error ? error.message : String(error));
    }
  }

  console.log(gap.copyPrompt);

  return 0;

}



const STACK_AREAS = new Set(['database', 'auth', 'payments', 'deployment', 'monitoring', 'security']);



async function cmdStack(positional: string[]): Promise<number> {

  const cwd = process.cwd();

  const sub = positional[0];



  if (sub === 'recommend') {
    const rec = await recommendStack(cwd);
    console.log(JSON.stringify(rec, null, 2));
    return 0;
  }

  if (sub === 'list' || !sub) {

    const file = await loadStackChoicesFile(cwd);

    const entries = Object.entries(file.choices);

    if (entries.length === 0) {

      console.log('No provider overrides. Detection runs from repo evidence.');

      return 0;

    }

    for (const [area, choice] of entries) {

      console.log(`${area}: ${choice.provider}`);

    }

    return 0;

  }



  if (sub === 'set') {

    const area = positional[1];

    const provider = positional[2];

    if (!area || !provider) {

      console.error('Usage: viberaven stack set <area> <provider>');

      return 1;

    }

    if (!STACK_AREAS.has(area)) {

      console.error(`Unknown area "${area}". Valid: ${[...STACK_AREAS].join(', ')}`);

      return 1;

    }

    const file = await loadStackChoicesFile(cwd);

    file.choices[area] = { provider, selectedAt: new Date().toISOString() };

    await saveStackChoicesFile(cwd, file);

    console.log(`Set ${area} → ${provider}. Run \`viberaven scan\` to re-map.`);

    return 0;

  }



  if (sub === 'clear') {

    const area = positional[1];

    const file = await loadStackChoicesFile(cwd);

    if (area) {

      delete file.choices[area];

    } else {

      file.choices = {};

    }

    await saveStackChoicesFile(cwd, file);

    console.log(area ? `Cleared ${area}.` : 'Cleared all provider overrides.');

    return 0;

  }



  console.error(`Unknown stack subcommand "${sub}". Use set, clear, or list.`);

  return 1;

}



export async function main(): Promise<number> {

  const { command, flags, positional } = parseArgs(process.argv.slice(2));



  if (flags.help) {

    printHelp();

    return 0;

  }

  if (flags.version || command === 'version') {

    console.log(VERSION);

    return 0;

  }

  const isAgentMode = hasFlag(flags, 'agent-mode');
  const wantsJson = hasFlag(flags, 'json');
  const wantsJsonl = hasFlag(flags, 'jsonl');
  const wantsStrict = hasFlag(flags, 'strict');

  if (flags.condense) {
    const cwd = positional[0] ? join(process.cwd(), positional[0]) : process.cwd();
    const result = await runCondenseCommand({ cwd });
    console.log(`VibeRaven context map refreshed: ${result.contextMapPath}`);
    return 0;
  }

  if (flags.heal) {
    const mode = flags.apply ? 'apply' : flags.prompt ? 'prompt' : 'plan';
    const result = await runHealCommand({
      cwd: process.cwd(),
      mode,
      target: typeof flags.target === 'string' ? flags.target : undefined,
      gapId: typeof flags.gap === 'string' ? flags.gap : undefined,
      yes: flags.yes === true,
      noVerify: flags['no-verify'] === true,
    });
    console.log(JSON.stringify(result, null, 2));
    return result.status.startsWith('refused') || result.status === 'failed' ? 1 : 0;
  }

  if (!command && flags.verify === true && typeof flags.action === 'string') {
    return runVerifyActionCommand({
      cwd: positional[0] ? join(process.cwd(), positional[0]) : process.cwd(),
      actionId: flags.action,
    });
  }

  if (!command && (isAgentMode || flags.verify === true || wantsJson || wantsJsonl || wantsStrict)) {
    const guardedExitCode = await guardEarlyVerifyScan({ flags, positional, wantsStrict });
    if (guardedExitCode !== undefined) {
      return guardedExitCode;
    }

    const deferMachineOutput = wantsJson || wantsJsonl;
    const scanResult = await runScanCommand(flags, positional, { deferMachineOutput });

    if ((wantsJson || wantsJsonl) && !scanResult.artifacts) {
      console.error('VibeRaven could not produce machine output because scan artifacts were not written.');
      return 3;
    }

    const gateResult =
      scanResult.artifacts && (wantsJson || wantsJsonl || wantsStrict)
        ? (JSON.parse(await readFile(scanResult.artifacts.gateResultPath, 'utf8')) as GateResult)
        : undefined;
    const strictExitCode =
      wantsStrict && gateResult
        ? exitCodeForStrictGate(gateResult, { failOnWarnings: flags.strict === 'warning' })
        : scanResult.exitCode;

    if (wantsJson && gateResult) {
      process.stdout.write(renderGateResultJson(gateResult));
      return strictExitCode;
    }

    if (wantsJsonl && gateResult) {
      process.stdout.write(renderJsonlEvents(gateResult));
      return strictExitCode;
    }

    if (wantsStrict && gateResult) {
      return strictExitCode;
    }

    return scanResult.exitCode;
  }

  if (!command) {
    const mode = resolveDefaultEntrypointMode({
      stdinIsTTY: Boolean(process.stdin.isTTY),
      stdoutIsTTY: Boolean(process.stdout.isTTY),
      env: process.env
    });

    if (mode === 'local-ui') {
      const cwd = positional[0] ? join(process.cwd(), positional[0]) : process.cwd();
      const handle = await startLocalUiServer({ cwd });
      console.log(`VibeRaven local UI: ${handle.url}`);
      await waitForServerShutdown();
      await handle.close();
      return 0;
    }

    if (mode === 'interactive') {
      await runInteractiveSession();
      return 0;
    }

    const scanResult = await runScanCommand({ 'agent-mode': true }, positional);
    return scanResult.exitCode;
  }



  switch (command) {

    case 'tui':

    case 'interactive':

      await runInteractiveSession();

      return 0;

    case 'ui': {
      const cwd = positional[0] ? join(process.cwd(), positional[0]) : process.cwd();
      const handle = await startLocalUiServer({ cwd });
      console.log(`VibeRaven local UI: ${handle.url}`);
      await waitForServerShutdown();
      await handle.close();
      return 0;
    }

    case 'login':

      await cmdLogin(flags);

      return 0;

    case 'logout':

      await cmdLogout();

      return 0;

    case 'status':

      return cmdStatus(flags, positional);

    case 'actions':
      return runActionsCommand({
        cwd: positional[0] ? join(process.cwd(), positional[0]) : process.cwd(),
        json: Boolean(flags.json),
      });

    case 'preview':
      return runPreviewCommand({
        cwd: positional[0] ? join(process.cwd(), positional[0]) : process.cwd(),
        agentMode: flags['agent-mode'] === true,
        json: Boolean(flags.json),
      });

    case 'next':

      return runNextCommand({
        json: Boolean(flags.json),
        cwd: positional[0] ? join(process.cwd(), positional[0]) : process.cwd()
      });

    case 'guide': {
      const provider = positional[0];
      if (!provider) {
        console.error('Usage: viberaven guide <provider> [--step N] [--json]');
        return 1;
      }
      const stepRaw = flags.step;
      const step = typeof stepRaw === 'string' ? Number.parseInt(stepRaw, 10) : undefined;
      return runGuideCommand({
        provider,
        step: Number.isFinite(step) ? step : undefined,
        json: Boolean(flags.json)
      });
    }

    case 'open':
      return runOpenCommand({
        target: positional[0],
        cwd: process.cwd()
      });

    case 'connect':

      return cmdConnect(flags);

    case 'watch':

      return cmdWatch(flags);

    case 'scan': {

      const scanResult = await runScanCommand(flags, positional);
      return scanResult.exitCode;
    }

    case 'report':

      return cmdReport(flags, positional);

    case 'prompt':

      return cmdPrompt(flags, positional);

    case 'stack':

      return cmdStack(positional);

    case 'provider-verify':

      return cmdProviderVerify(flags, positional);

    case 'init': {
      const cwd = positional[0] ? join(process.cwd(), positional[0]) : process.cwd();
      const agents = typeof flags.agents === 'string' ? flags.agents : undefined;
      return runInitCommand({
        cwd,
        agents,
        dryRun: flags['dry-run'] === true,
      });
    }

    case 'doctor':
      if (flags.agents !== true) {
        console.error('Usage: viberaven doctor --agents [path]');
        return 1;
      }
      return runDoctorAgentsCommand({
        cwd: positional[0] ? join(process.cwd(), positional[0]) : process.cwd(),
      });

    case 'validate-npm-package':
      return runValidateNpmPackageCommand({
        names: positional,
        json: Boolean(flags.json),
      });

    case 'audit':
      if (flags['vercel-supabase'] !== true) {
        console.error('Usage: viberaven audit --vercel-supabase [--json] [path]');
        return 1;
      }
      return runAuditCommand({
        cwd: positional[0] ? join(process.cwd(), positional[0]) : process.cwd(),
        json: Boolean(flags.json),
      });

    default:

      console.error(`Unknown command: ${command}`);

      printHelp();

      return 1;

  }

}



if (require.main === module) {

  main()

    .then((code) => {

      if (code !== 0) {

        process.exitCode = code;

      }

    })

    .catch((error) => {

      console.error(error instanceof Error ? error.message : String(error));

      process.exitCode = 1;

    });

}

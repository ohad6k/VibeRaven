import { resolve } from 'node:path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
  clearCredentials,
  findArtifactsWorkspace,
  loadCredentials,
  resolveApiBaseUrl,
  resolveWorkspaceRoot
} from '../config';
import { requireCredentials, runDeviceLogin } from '../auth';
import {
  enrichArtifactWithAccount,
  fetchAccountMe,
  formatScanLimitMessage,
  formatUsageLine,
  syncCredentialsFromAccount
} from '../account';
import { runProjectScan } from '../runScan';
import { writeScanArtifacts } from '../artifacts';
import { openPathInBrowser } from '../openBrowser';
import { copyToClipboard } from '../clipboard';
import { buildAgentFixPrompt } from '../agentPrompt';
import { printScanSummary } from '../terminalSummary';
import { VERSION } from '../version';
import { refreshReportFromDisk } from '../report/refreshReport';
import { runGuideCommand } from '../commands/guide';
import {
  buildVercelSupabaseAudit,
  collectVercelSupabaseAuditInput,
  renderVercelSupabaseAudit
} from '../commands/audit';
import { initAgentRules } from '../commands/initRules';
import { runNextCommand } from '../commands/next';
import { runOpenCommand } from '../commands/open';
import {
  formatTopGapsList,
  isScanNotFoundError,
  loadLastArtifact,
  needsScanMessage,
  pickGap,
  type MenuAction
} from './menu';
import { listPlaybookProviders } from '../playbooks/loadPlaybook';

async function formatStatusLine(): Promise<string> {
  const creds = await loadCredentials();
  if (!creds?.accessToken) {
    return pc.dim('Not signed in');
  }
  try {
    const synced = await syncCredentialsFromAccount(creds);
    const plan = synced.plan ?? 'unknown';
    return pc.green(`Signed in: ${synced.email ?? '(email unknown)'} · ${plan}`);
  } catch {
    return pc.yellow(`Signed in: ${creds.email ?? '(email unknown)'} (offline)`);
  }
}

async function handleScan(cwd: string): Promise<void> {
  const apiBaseUrl = resolveApiBaseUrl();
  const spinner = p.spinner();
  spinner.start('Checking credentials…');

  let accessToken: string;
  try {
    ({ accessToken } = await requireCredentials(apiBaseUrl));
  } catch (error) {
    spinner.stop('Sign in required');
    p.log.error(error instanceof Error ? error.message : String(error));
    p.log.message(pc.dim('Choose "Sign in / Sign out" from the menu.'));
    return;
  }

  spinner.message(`Scanning ${cwd}…`);
  const result = await runProjectScan({ workspacePath: cwd, accessToken, apiBaseUrl });

  if (!result.ok) {
    spinner.stop('Scan failed');
    if (result.kind === 'scan_limit') {
      p.log.error(formatScanLimitMessage(result.upgradeUrl));
      try {
        const account = await fetchAccountMe(apiBaseUrl, accessToken);
        p.log.message(formatUsageLine(account.usage));
      } catch {
        // best-effort
      }
      return;
    }
    p.log.error(result.message);
    return;
  }

  const artifact = await enrichArtifactWithAccount(result.artifact, apiBaseUrl, accessToken);
  const paths = await writeScanArtifacts({ artifact, cwd });
  spinner.stop('Scan complete');
  printScanSummary(artifact, paths);
  if (artifact.usage) {
    p.log.message(formatUsageLine(artifact.usage));
  }
}

async function handleViewGaps(cwd: string): Promise<void> {
  try {
    const artifact = await loadLastArtifact(cwd);
    p.log.message(formatTopGapsList(artifact));
  } catch (error) {
    if (isScanNotFoundError(error)) {
      p.log.warn(error.message);
      return;
    }
    throw error;
  }
}

async function handlePrompt(cwd: string): Promise<void> {
  try {
    const artifact = await loadLastArtifact(cwd);
    const gap = pickGap(artifact);
    if (!gap) {
      p.log.warn('No gaps to fix. Run a scan or pick a different project.');
      return;
    }
    const prompt = buildAgentFixPrompt(artifact, gap);
    try {
      await copyToClipboard(prompt);
      p.log.success(pc.green(`Copied top prompt to clipboard — ${gap.title}`));
    } catch (error) {
      p.log.warn(error instanceof Error ? error.message : String(error));
      console.log('');
      console.log(prompt);
      console.log('');
      p.log.message(pc.dim('Copy the text above manually.'));
    }
  } catch (error) {
    if (isScanNotFoundError(error)) {
      p.log.warn(error.message);
      return;
    }
    throw error;
  }
}

async function handleOpenReport(cwd: string): Promise<void> {
  const spinner = p.spinner();
  spinner.start('Refreshing report from last scan…');
  try {
    const paths = await refreshReportFromDisk(cwd);
    spinner.stop('Report ready');
    await openPathInBrowser(paths.reportPath);
    p.log.success(`Opened ${paths.reportPath}`);
  } catch (error) {
    spinner.stop('Could not open report');
    if (isScanNotFoundError(error)) {
      p.log.warn(error.message);
      return;
    }
    p.log.warn(error instanceof Error ? error.message : String(error));
  }
}

async function handleAuth(): Promise<void> {
  const creds = await loadCredentials();
  if (creds?.accessToken) {
    await clearCredentials();
    p.log.success('Signed out.');
    return;
  }
  const apiBaseUrl = resolveApiBaseUrl();
  await runDeviceLogin(apiBaseUrl);
}

async function handleAgentRules(cwd: string): Promise<void> {
  const { results } = await initAgentRules({ cwd });
  for (const result of results) {
    const color = result.action === 'created' ? pc.green : result.action === 'updated' ? pc.yellow : pc.dim;
    p.log.message(color(`${result.action.toUpperCase()}: ${result.file}`));
  }
  p.log.success('VibeRaven agent rules are ready.');
}

async function handleAudit(cwd: string): Promise<void> {
  const spinner = p.spinner();
  spinner.start('Checking local Vercel/Supabase repo evidence...');
  const input = await collectVercelSupabaseAuditInput(cwd);
  const result = buildVercelSupabaseAudit(input);
  spinner.stop(result.status === 'pass' ? 'Audit passed' : 'Audit needs work');
  p.log.message(renderVercelSupabaseAudit(result));
}

async function handleNext(cwd: string): Promise<void> {
  const code = await runNextCommand({ cwd });
  if (code !== 0) {
    p.log.warn('Run a scan first to get a next action.');
  }
}

async function handleGuide(cwd: string): Promise<void> {
  try {
    await loadLastArtifact(cwd);
  } catch (error) {
    if (isScanNotFoundError(error)) {
      p.log.warn(error.message);
      return;
    }
    throw error;
  }

  const provider = await p.select({
    message: 'Which provider guide?',
    options: listPlaybookProviders().map((value) => ({ value, label: value }))
  });
  if (p.isCancel(provider)) {
    return;
  }

  const selectedProvider = String(provider);
  await runGuideCommand({ provider: selectedProvider, step: 1 });
  p.log.message(pc.dim(`Opening ${selectedProvider} because this provider guide starts in its dashboard.`));
  const openCode = await runOpenCommand({ target: selectedProvider, cwd });
  if (openCode !== 0) {
    p.log.warn(`Could not open ${selectedProvider}. Use: viberaven open ${selectedProvider}`);
  }
}

async function handleOpenDashboard(cwd: string): Promise<void> {
  const code = await runOpenCommand({ cwd });
  if (code !== 0) {
    p.log.warn('No dashboard URL for the current next action.');
    const provider = await p.select({
      message: 'Open which provider dashboard?',
      options: listPlaybookProviders().map((value) => ({ value, label: value }))
    });
    if (p.isCancel(provider)) {
      return;
    }
    const selectedProvider = String(provider);
    p.log.message(pc.dim(`Opening ${selectedProvider} so you can complete or verify provider-side setup.`));
    const fallbackCode = await runOpenCommand({ target: selectedProvider, cwd });
    if (fallbackCode !== 0) {
      p.log.warn(`Could not open ${selectedProvider}. Use: viberaven open ${selectedProvider}`);
    }
  }
}

function buildMenuOptions(isSignedIn: boolean): { value: MenuAction; label: string; hint?: string }[] {
  return [
    { value: 'next', label: "What's next?", hint: 'One action from last scan' },
    { value: 'scan', label: 'Scan project', hint: 'Map launch readiness' },
    { value: 'open-report', label: 'Open report in browser', hint: 'Rebuilds UI from last scan' },
    { value: 'guide', label: 'Provider guide', hint: 'Vercel, Supabase, Stripe steps' },
    { value: 'open-dashboard', label: 'Open dashboard', hint: 'Browser link for next step' },
    { value: 'gaps', label: 'View top gaps', hint: 'From last scan' },
    { value: 'prompt', label: 'Copy top prompt', hint: 'Agent-ready fix prompt' },
    { value: 'agent-rules', label: 'Install agent rules', hint: 'AGENTS.md, CLAUDE.md, Cursor' },
    { value: 'audit', label: 'Vercel/Supabase audit', hint: 'RLS, service-role, serverless pooler evidence' },
    {
      value: 'auth',
      label: isSignedIn ? 'Sign out' : 'Sign in',
      hint: isSignedIn ? 'Clear local credentials' : 'Device login flow'
    },
    { value: 'exit', label: 'Exit' }
  ];
}

export async function runInteractiveSession(startDir: string = process.cwd()): Promise<void> {
  p.intro(`${pc.bold('VibeRaven')} ${pc.dim(VERSION)}`);

  const cwd = await resolveWorkspaceRoot(startDir);
  const artifactsAt = await findArtifactsWorkspace(startDir);
  if (artifactsAt && resolve(artifactsAt) !== resolve(startDir)) {
    p.log.message(pc.dim(`Using scan from: ${artifactsAt}`));
  } else {
    p.log.message(pc.dim(`Project folder: ${cwd}`));
    if (!artifactsAt) {
      p.log.message(
        pc.dim(
          'No .viberaven/ here yet. Extension scans are separate — choose Scan project to write CLI artifacts.'
        )
      );
    }
  }

  let running = true;
  while (running) {
    const statusLine = await formatStatusLine();
    p.log.message(statusLine);

    const creds = await loadCredentials();
    const action = await p.select({
      message: 'What would you like to do?',
      options: buildMenuOptions(Boolean(creds?.accessToken))
    });

    if (p.isCancel(action)) {
      p.cancel('Goodbye.');
      return;
    }

    switch (action as MenuAction) {
      case 'next':
        await handleNext(cwd);
        break;
      case 'scan':
        await handleScan(cwd);
        break;
      case 'guide':
        await handleGuide(cwd);
        break;
      case 'open-dashboard':
        await handleOpenDashboard(cwd);
        break;
      case 'gaps':
        await handleViewGaps(cwd);
        break;
      case 'prompt':
        await handlePrompt(cwd);
        break;
      case 'agent-rules':
        await handleAgentRules(cwd);
        break;
      case 'audit':
        await handleAudit(cwd);
        break;
      case 'open-report':
        await handleOpenReport(cwd);
        break;
      case 'auth':
        await handleAuth();
        break;
      case 'exit':
        running = false;
        break;
      default:
        break;
    }
  }

  p.outro(pc.dim('Run viberaven anytime for the interactive menu.'));
}

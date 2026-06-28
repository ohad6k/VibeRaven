import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CliScanArtifact } from './types';
import { generateContextMap } from './contracts/contextMap';
import { generateGateResult } from './contracts/gateResult';
import { generateGapEvidenceFiles } from './contracts/gapEvidence';
import { generateAgentSummary } from './report/agentSummary';
import { buildTaskList, buildTaskListMarkdown } from './buildTaskList';
import { generateLaunchPlaybook } from './report/launchPlaybook';
import { generateReportHtml } from './report/reportHtml';
import { getBundledReportAssetsDir, REPORT_ASSET_FILES } from './report/reportAssets';
import { getProjectArtifactsDir } from './config';
import { sanitizeArtifactForDisk } from './sanitizeArtifact';
import { writeActionArtifacts } from './actions/artifacts';

export interface WriteArtifactsOptions {
  artifact: CliScanArtifact;
  cwd?: string;
}

export interface WriteArtifactsResult {
  dir: string;
  jsonPath: string;
  gateResultPath: string;
  contextMapPath: string;
  gapsDir: string;
  tasklistPath: string;
  summaryPath: string;
  playbookPath: string;
  reportPath: string;
  reportAssetsDir: string;
  actionsPath: string;
  actionRegistryPath: string;
}

async function copyReportAssets(reportAssetsDir: string): Promise<void> {
  const sourceDir = getBundledReportAssetsDir();
  await mkdir(join(reportAssetsDir, 'assets'), { recursive: true });

  for (const rel of REPORT_ASSET_FILES) {
    await copyFile(join(sourceDir, rel), join(reportAssetsDir, rel));
  }
}

export async function writeScanArtifacts(options: WriteArtifactsOptions): Promise<WriteArtifactsResult> {
  const cwd = options.cwd ?? options.artifact.workspacePath;
  const dir = getProjectArtifactsDir(cwd);
  await mkdir(dir, { recursive: true });

  const jsonPath = join(dir, 'last-scan.json');
  const gateResultPath = join(dir, 'gate-result.json');
  const contextMapPath = join(dir, 'context-map.json');
  const gapsDir = join(dir, 'gaps');
  const tasklistPath = join(dir, 'agent-tasklist.md');
  const summaryPath = join(dir, 'agent-summary.md');
  const playbookPath = join(dir, 'launch-playbook.md');
  const reportPath = join(dir, 'report.html');
  const reportAssetsDir = join(dir, 'report');

  await mkdir(gapsDir, { recursive: true });

  const safe = sanitizeArtifactForDisk(options.artifact);
  const json = `${JSON.stringify(safe, null, 2)}\n`;
  const summary = generateAgentSummary(safe);
  const playbook = generateLaunchPlaybook(safe);
  const html = generateReportHtml(safe);
  const tasks = buildTaskList(safe);
  const tasklist = buildTaskListMarkdown(tasks);
  const gateResult = `${JSON.stringify(generateGateResult(safe), null, 2)}\n`;
  const contextMap = `${JSON.stringify(generateContextMap(safe), null, 2)}\n`;
  const gapEvidenceFiles = generateGapEvidenceFiles(safe);

  await copyReportAssets(reportAssetsDir);
  await writeFile(gateResultPath, gateResult, 'utf-8');
  await writeFile(contextMapPath, contextMap, 'utf-8');
  for (const gap of gapEvidenceFiles) {
    await writeFile(join(dir, 'gaps', `${gap.content.id}.json`), `${JSON.stringify(gap.content, null, 2)}\n`, 'utf-8');
  }
  await writeFile(tasklistPath, tasklist, 'utf-8');
  await writeFile(jsonPath, json, 'utf-8');
  await writeFile(summaryPath, summary, 'utf-8');
  await writeFile(playbookPath, playbook, 'utf-8');
  await writeFile(reportPath, html, 'utf-8');
  const actionArtifacts = await writeActionArtifacts({
    cwd,
    artifact: safe,
    tasks,
    paths: { reportPath, playbookPath },
  });

  return {
    dir,
    jsonPath,
    gateResultPath,
    contextMapPath,
    gapsDir,
    tasklistPath,
    summaryPath,
    playbookPath,
    reportPath,
    reportAssetsDir,
    actionsPath: actionArtifacts.actionsPath,
    actionRegistryPath: actionArtifacts.actionRegistryPath,
  };
}

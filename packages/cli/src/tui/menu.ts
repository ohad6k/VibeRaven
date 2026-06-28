import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { findArtifactsWorkspace, getProjectArtifactsDir } from '../config';
import type { CliScanArtifact } from '../types';
import type { Gap } from '../../../../src/station/types';

export type PickGapOptions = {
  gapId?: string;
  provider?: string;
  area?: string;
};

export type MenuAction =
  | 'next'
  | 'scan'
  | 'gaps'
  | 'prompt'
  | 'guide'
  | 'open-dashboard'
  | 'open-report'
  | 'agent-rules'
  | 'audit'
  | 'auth'
  | 'exit';

const SEVERITY_RANK: Record<Gap['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2
};

export class ScanNotFoundError extends Error {
  constructor(message = 'No scan found. Run a scan first.') {
    super(message);
    this.name = 'ScanNotFoundError';
  }
}

export function isScanNotFoundError(error: unknown): error is ScanNotFoundError {
  return error instanceof ScanNotFoundError;
}

export function needsScanMessage(startDir?: string): string {
  const cwd = startDir ?? process.cwd();
  return [
    'No CLI scan found for this folder.',
    `Looking from: ${cwd}`,
    'Choose "Scan project", or run the menu from your repo root (where .viberaven/ lives).',
    'VS Code extension scans stay inside the editor — run a CLI scan once to create .viberaven/ on disk.'
  ].join('\n');
}

export function sortGapsByPriority(gaps: Gap[]): Gap[] {
  return [...gaps].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.title.localeCompare(b.title)
  );
}

export function pickGap(artifact: CliScanArtifact, options: PickGapOptions = {}): Gap | undefined {
  if (options.gapId) {
    return artifact.gaps.find((g) => g.id === options.gapId);
  }
  if (options.provider) {
    const key = options.provider.toLowerCase();
    return artifact.gaps.find(
      (g) =>
        g.primaryMapCategory === key ||
        g.title.toLowerCase().includes(key) ||
        g.id.toLowerCase().includes(key)
    );
  }
  if (options.area) {
    return artifact.gaps.find((g) => g.primaryMapCategory === options.area);
  }
  return sortGapsByPriority(artifact.gaps)[0];
}

export function formatTopGapsList(artifact: CliScanArtifact, limit = 10): string {
  const sorted = sortGapsByPriority(artifact.gaps);
  if (sorted.length === 0) {
    return 'No gaps found — production core looks solid.';
  }
  return sorted
    .slice(0, limit)
    .map((gap, index) => {
      const severity = gap.severity.toUpperCase().padEnd(8);
      const area = gap.primaryMapCategory.padEnd(12);
      return `${index + 1}. [${severity}] ${area} ${gap.title}`;
    })
    .join('\n');
}

export async function loadLastArtifact(startDir: string): Promise<CliScanArtifact> {
  const workspace = await findArtifactsWorkspace(startDir);
  if (!workspace) {
    throw new ScanNotFoundError(needsScanMessage(startDir));
  }
  const path = join(getProjectArtifactsDir(workspace), 'last-scan.json');
  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw) as CliScanArtifact;
  } catch {
    throw new ScanNotFoundError(needsScanMessage(startDir));
  }
}

export async function getReportPath(startDir: string): Promise<string | undefined> {
  const workspace = await findArtifactsWorkspace(startDir);
  if (!workspace) {
    return undefined;
  }
  return join(getProjectArtifactsDir(workspace), 'report.html');
}

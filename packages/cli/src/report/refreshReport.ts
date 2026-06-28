import { loadLastArtifact, ScanNotFoundError } from '../tui/menu';
import { writeScanArtifacts, type WriteArtifactsResult } from '../artifacts';
import { findArtifactsWorkspace } from '../config';

/** Rebuild `.viberaven/report.html` from existing `last-scan.json` (no API scan). */
export async function refreshReportFromDisk(startDir: string): Promise<WriteArtifactsResult> {
  const workspace = await findArtifactsWorkspace(startDir);
  if (!workspace) {
    throw new ScanNotFoundError();
  }
  const artifact = await loadLastArtifact(startDir);
  return writeScanArtifacts({ artifact, cwd: workspace });
}

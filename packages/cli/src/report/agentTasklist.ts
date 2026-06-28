import type { Gap } from '../../../../src/station/types';
import { PUBLIC_VERIFY_COMMAND, promptGapCommand } from '../contracts/commands';
import type { CliScanArtifact } from '../types';

const SEVERITY_ORDER: Record<Gap['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2
};

function sortGaps(gaps: Gap[]): Gap[] {
  return [...gaps].sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.title.localeCompare(b.title)
  );
}

function redactDetail(detail: string): string {
  return detail
    .replace(
      /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
      '<redacted>'
    )
    .replace(
      /\b([a-z][a-z0-9+.-]*:\/\/)([^:@\s/?#]+):([^@\s/?#]+)@([^\s)]+)/gi,
      '$1<redacted>@$4'
    )
    .replace(/\bAuthorization\s*:\s*([A-Za-z][A-Za-z0-9._-]*)\s+[^\s;,]+/gi, 'Authorization: $1 <redacted>')
    .replace(/\bghp_[A-Za-z0-9_]{20,}\b/g, '<redacted>')
    .replace(/\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, '<redacted>')
    .replace(/\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g, '<redacted>')
    .replace(/\bxapp-[A-Za-z0-9-]{20,}\b/g, '<redacted>')
    .replace(
      /\b([A-Za-z0-9_]*(?:ACCESS_TOKEN|AUTHORIZATION|API_KEY|SECRET|SECRET_KEY|SERVICE_ROLE_KEY|TOKEN|PASSWORD|PRIVATE_KEY|CREDENTIALS?)[A-Za-z0-9_]*)\s*=\s*["']?[^"'\s;,]+["']?/gi,
      '$1=<redacted>'
    )
    .replace(/\beyJ[A-Za-z0-9._-]*\b/g, '<redacted>')
    .replace(/\[REDACTED(?:_[A-Z_]+)?\]/g, '<redacted>');
}

function headingFor(gaps: Gap[]): string {
  if (gaps.some((gap) => gap.severity === 'critical')) {
    return '# VibeRaven Production Gate - CRITICAL GAPS DETECTED';
  }
  if (gaps.length > 0) {
    return '# VibeRaven Production Gate - GAPS DETECTED';
  }
  return '# VibeRaven Production Gate - NO REPO-CODE GAPS DETECTED';
}

export function generateAgentTasklist(artifact: CliScanArtifact): string {
  const lines: string[] = [];
  const gaps = sortGaps(artifact.gaps);
  const hasCritical = gaps.some((gap) => gap.severity === 'critical');

  lines.push(headingFor(gaps), '');
  lines.push(`Workspace: \`${artifact.workspacePath}\``);
  lines.push(`Scanned: ${artifact.scannedAt}`);
  lines.push(`Production core: **${artifact.productionCorePercent}%**`);
  lines.push('');

  if (hasCritical) {
    lines.push('PRODUCTION GATE NOT CLEAR', '');
  } else if (gaps.length > 0) {
    lines.push('Do not deploy until the listed production-readiness gaps are reviewed.', '');
  } else {
    lines.push('PRODUCTION GATE CLEAR FOR REPO-CODE GAPS');
    lines.push(
      'Provider dashboard checks still require dashboard or read-only MCP evidence before launch.'
    );
    lines.push('');
  }

  lines.push('## TOP REPO-CODE GAPS', '');
  if (gaps.length === 0) {
    lines.push('_No repo-code gaps were returned by this scan._', '');
  } else {
    for (const gap of gaps.slice(0, 10)) {
      const marker = gap.severity === 'critical' ? '[!]' : '[ ]';
      lines.push(`- ${marker} **${gap.title}**`);
      lines.push(`  - Gap ID: \`${gap.id}\``);
      lines.push(`  - Severity: ${gap.severity}`);
      lines.push(`  - Area: ${gap.primaryMapCategory}`);
      lines.push(`  - Detail: ${redactDetail(gap.detail)}`);
      lines.push(`  - Command: \`${promptGapCommand(gap.id)}\``);
    }
    lines.push('');
  }

  lines.push('## NEXT STEPS FOR THE AGENT', '');
  lines.push('1. Pick one repo-code gap from this tasklist and fix only that gap.');
  lines.push('2. Use `npx -y viberaven prompt --gap <id>` for focused guidance.');
  lines.push(`3. Run \`${PUBLIC_VERIFY_COMMAND}\` to rescan and refresh this tasklist.`);
  lines.push(
    '4. Do not claim provider dashboard checks are fixed by repo-code edits; verify those in the provider dashboard or through read-only provider MCP evidence.'
  );
  lines.push('');

  return `${lines.join('\n')}\n`;
}

import type { ContextualPromptSection } from './promptRouting';
import type { SifgLeak } from './sifgTypes';

export function buildSifgFixPromptSection(leak: SifgLeak): ContextualPromptSection {
  return {
    heading: 'SIFG leak context',
    lines: [
      `Leak ID: ${sanitizePromptValue(leak.id)}`,
      `Pipeline ID: ${sanitizePromptValue(leak.pipelineId)}`,
      `Severity: ${sanitizePromptValue(leak.severity)}`,
      `Summary: ${sanitizePromptValue(leak.summary)}`,
      `Evidence path: ${evidencePathLine(leak)}`,
      leak.missingGuard
        ? `Missing guard: ${sanitizePromptValue(leak.missingGuard.expectedNodeKind)} (${sanitizePromptValue(leak.missingGuard.expectedEvidence)})`
        : 'Missing guard: none',
      `Allowed files: ${sanitizeList(leak.repoFix.allowedFiles)}`,
      `Blocked files: ${sanitizeList(leak.repoFix.forbiddenFiles)}`,
      `Required outcome: ${sanitizePromptValue(leak.repoFix.requiredOutcome)}`,
      'Manual dashboard and MCP checks remain separate.',
      'Do not read, print, invent, or store real secret values.',
      'After editing, rescan VibeRaven so SIFG can verify the structural flow.'
    ]
  };
}

function evidencePathLine(leak: SifgLeak): string {
  if (leak.evidencePath.length === 0) {
    return 'none';
  }
  return leak.evidencePath
    .map((step) => `${sanitizePromptValue(step.role)} ${sanitizePromptValue(step.file)}:${step.range.startLine}-${step.range.endLine}`)
    .join(' -> ');
}

function sanitizeList(values: string[]): string {
  return values.map(sanitizePromptValue).join(', ');
}

function sanitizePromptValue(value: string): string {
  return value
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/\b(Authorization\s*:\s*Bearer)\s+[A-Za-z0-9._~+/=-]{8,}/gi, '$1 [redacted]')
    .replace(
      /\b(client_secret|secret|password|access_token|refresh_token|private_key)\s*([:=])\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
      (_match, key: string, separator: string) => `${key}${separator === ':' ? ': ' : '='}[redacted]`
    )
    .replace(/\b(apiKey|accessToken|refreshToken|serviceRoleKey)\s*:\s*(?:"[^"]+"|'[^']+'|[^\s,;]+)/g, '$1: [redacted]')
    .replace(/\b(apiKey|accessToken|refreshToken|serviceRoleKey)\s*=\s*(?:"[^"]+"|'[^']+'|[^\s,;]+)/g, '$1=[redacted]')
    .replace(
      /\b([A-Za-z_][A-Za-z0-9_.-]*(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY|SERVICE_ROLE_KEY|apiKey|ApiKey|apikey|api_key|accessToken|refreshToken|serviceRoleKey)[A-Za-z0-9_.-]*)\s*([:=])\s*(?:"[^"]+"|'[^']+'|[^\s,;]+)/g,
      '$1$2[redacted]'
    )
    .replace(/\b(?:whsec|github_pat|ghp|gho|ghu|ghs|ghr|gh_pat)_[A-Za-z0-9_]{8,}\b/g, '[redacted-secret]')
    .replace(/\b(?:sk|pk)_(?:live|test)_[a-zA-Z0-9_]+\b/g, '[redacted-secret]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]{2,}\b/g, '[redacted-secret]');
}

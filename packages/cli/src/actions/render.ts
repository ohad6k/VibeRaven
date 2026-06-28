import type { VibeRavenAction, VibeRavenActionsManifest, VibeRavenActionTarget } from './types';

function redact(text: string): string {
  return text
    .replace(
      /\b([A-Z0-9_]*(?:SECRET|TOKEN|KEY|PASSWORD|DATABASE_URL|POSTGRES_URL|SERVICE_ROLE)[A-Z0-9_]*)=([^,\s]+)/gi,
      '$1=<redacted>',
    )
    .replace(/\bpostgres(?:ql)?:\/\/[^@\s]+@/gi, 'postgresql://<redacted>@')
    .replace(/[A-Za-z]:\\[^\s`"]+/g, '<repo-relative-path>')
    .replace(/\b\/Users\/[^\s`"]+/g, '<repo-relative-path>')
    .replace(/\b\/home\/[^\s`"]+/g, '<repo-relative-path>')
    .replace(/\beyJ[A-Za-z0-9._-]*\b/g, '<redacted>');
}

function stringifyPayload(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).join('\n');
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value ?? '');
}

function fenceFor(format: string): string {
  if (format === 'bash' || format === 'sql' || format === 'json') {
    return format;
  }
  return 'txt';
}

function renderTarget(target: VibeRavenActionTarget | undefined): string[] {
  if (!target) {
    return [];
  }

  if (target.type === 'url') {
    return [`Open: ${redact(target.href || target.label)}`];
  }
  if (target.type === 'file') {
    return [`File: ${redact(target.path)}`];
  }
  if (target.type === 'command') {
    return ['Run:', '```bash', redact(target.command), '```'];
  }
  if (target.type === 'provider') {
    return [`Provider: ${redact(target.label)}`];
  }
  return ['Verify:', '```bash', redact(target.command), '```'];
}

function renderReadiness(action: VibeRavenAction): string | undefined {
  const readiness = action.readiness?.slice(0, 2).map(redact).filter(Boolean);
  if (!readiness || readiness.length === 0) {
    return undefined;
  }
  return `Ready: ${readiness.join(', ')}`;
}

function renderCopyPayload(action: VibeRavenAction): string[] {
  const payload = action.copyPayloads?.[0];
  if (!payload) {
    return [];
  }

  const raw = stringifyPayload(payload.value);
  if (raw.length > 500) {
    return [];
  }

  return [`Copy: ${redact(payload.label)}`, `\`\`\`${fenceFor(payload.format)}`, redact(raw), '```'];
}

function renderVerifyCommand(action: VibeRavenAction): string[] {
  if (!action.verifyCommand) {
    return [];
  }
  if (action.target?.type === 'verify' && action.target.command === action.verifyCommand) {
    return [];
  }
  return ['Verify:', '```bash', redact(action.verifyCommand), '```'];
}

function renderAction(action: VibeRavenAction): string[] {
  return [
    `[${action.id}] ${redact(action.title)}`,
    `Status: ${action.status}`,
    renderReadiness(action),
    ...renderTarget(action.target),
    ...renderCopyPayload(action),
    ...renderVerifyCommand(action),
    action.resumeInstruction ? `Resume: "${redact(action.resumeInstruction)}"` : undefined,
  ].filter((line): line is string => Boolean(line));
}

export function renderActionSurface(
  manifest: VibeRavenActionsManifest,
  options: { limit?: number } = {},
): string {
  const visibleActions =
    typeof options.limit === 'number' ? manifest.actions.slice(0, options.limit) : manifest.actions;

  const lines = [
    'VibeRaven Production Actions',
    `Gate: ${manifest.gateStatus}`,
    `Showing: ${visibleActions.length} of ${manifest.actions.length} current actions`,
    'Full state: .viberaven/actions.json',
    '',
  ];

  for (const action of visibleActions) {
    lines.push(...renderAction(action), '');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

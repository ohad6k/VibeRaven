import type {
  McpVerifierConfigStatus,
  McpVerifierRuntimeStatus,
  McpVerifierStateRecord,
  McpVerifierStateSnapshot,
  ProviderMcpTemplate,
  ProviderRegistryEntry,
  ProviderRegistrySnapshot,
  ProviderRegistrySource
} from './types';

export interface McpConfigDocument {
  path: string;
  json: unknown;
}

const EMPTY_SNAPSHOT: McpVerifierStateSnapshot = { version: 1, checkedAt: '', records: [] };
const RUNTIME_STATUS: McpVerifierRuntimeStatus = 'unknown-runtime';
const VALID_CONFIG_STATUS: Record<McpVerifierConfigStatus, true> = {
  configured: true,
  missing: true,
  unsupported: true,
  stale: true
};
const VALID_REGISTRY_SOURCE: Record<ProviderRegistrySource, true> = {
  bundled: true,
  'managed-backend': true
};

export function detectMcpVerifierRecords(
  registry: ProviderRegistrySnapshot,
  configs: McpConfigDocument[],
  checkedAt: string
): McpVerifierStateRecord[] {
  return registry.providers
    .filter((provider) => Boolean(provider.mcp))
    .map((provider) => recordForProvider(provider, registry, configs, checkedAt));
}

export function buildMcpVerifierStateSnapshot(
  registry: ProviderRegistrySnapshot,
  configs: McpConfigDocument[],
  checkedAt: string
): McpVerifierStateSnapshot {
  return {
    version: 1,
    checkedAt,
    records: detectMcpVerifierRecords(registry, configs, checkedAt)
  };
}

export function normalizeMcpVerifierStateSnapshot(value: unknown): McpVerifierStateSnapshot {
  if (!isObject(value) || value.version !== 1 || !isUtcIsoTimestamp(value.checkedAt) || !Array.isArray(value.records)) {
    return { ...EMPTY_SNAPSHOT, records: [] };
  }

  const records = value.records.flatMap((record) => {
    const normalized = normalizeRecord(record);
    return normalized ? [normalized] : [];
  });
  if (records.length === 0) {
    return { ...EMPTY_SNAPSHOT, records: [] };
  }

  return {
    version: 1,
    checkedAt: value.checkedAt,
    records
  };
}

function recordForProvider(
  provider: ProviderRegistryEntry,
  registry: ProviderRegistrySnapshot,
  configs: McpConfigDocument[],
  checkedAt: string
): McpVerifierStateRecord {
  const mcp = provider.mcp as ProviderMcpTemplate;
  const supportsReadOnly = provider.verification?.supportsReadOnly === true;
  const matches = configs.filter((config) => configMatchesProvider(config, mcp, supportsReadOnly));

  return {
    version: 1,
    provider: provider.provider,
    label: provider.label,
    status: statusForProvider(registry, matches.length > 0, supportsReadOnly),
    runtimeStatus: RUNTIME_STATUS,
    configuredIn: uniqueSorted(matches.flatMap((config) => {
      const path = normalizeText(config.path, 260);
      return path ? [path] : [];
    })),
    serverName: mcp.serverName,
    transport: transportForTemplate(mcp),
    supportsReadOnly,
    checkedAt,
    registryVersion: registry.version,
    registrySource: registry.source,
    registryGeneratedAt: registry.generatedAt
  };
}

function statusForProvider(
  registry: ProviderRegistrySnapshot,
  hasConfiguredServer: boolean,
  supportsReadOnly: boolean
): McpVerifierConfigStatus {
  if (registry.status === 'stale') {
    return 'stale';
  }
  if (!supportsReadOnly) {
    return 'unsupported';
  }
  if (hasConfiguredServer) {
    return 'configured';
  }
  return 'missing';
}

function configMatchesProvider(
  config: McpConfigDocument,
  mcp: ProviderMcpTemplate,
  supportsReadOnly: boolean
): boolean {
  const servers = serversObject(config.json);
  if (!servers) {
    return false;
  }

  const templateUrls = templateServerUrls(mcp);
  for (const [serverName, serverConfig] of Object.entries(servers)) {
    const configuredUrl = normalizedUrl(urlFromServerConfig(serverConfig));
    if (configuredUrl && templateUrls.has(configuredUrl)) {
      return true;
    }
    if (
      !configuredUrl &&
      serverName === mcp.serverName &&
      stdioConfigMatchesTemplate(serverConfig, mcp, supportsReadOnly)
    ) {
      return true;
    }
  }

  return false;
}

function serversObject(value: unknown): Record<string, unknown> | null {
  if (!isObject(value)) {
    return null;
  }

  const servers = isObject(value.servers) ? value.servers : {};
  const mcpServers = isObject(value.mcpServers) ? value.mcpServers : {};
  const merged = { ...servers, ...mcpServers };
  return Object.keys(merged).length > 0 ? merged : null;
}

function templateServerUrls(mcp: ProviderMcpTemplate): Set<string> {
  return new Set(
    [urlFromServerConfig(mcp.vscodeServer), urlFromServerConfig(mcp.cursorServer)]
      .map(normalizedUrl)
      .filter((url): url is string => Boolean(url))
  );
}

function stdioConfigMatchesTemplate(
  serverConfig: unknown,
  mcp: ProviderMcpTemplate,
  supportsReadOnly: boolean
): boolean {
  return [mcp.vscodeServer, mcp.cursorServer].some((template) =>
    stdioServerMatches(serverConfig, template, supportsReadOnly)
  );
}

function stdioServerMatches(serverConfig: unknown, template: unknown, supportsReadOnly: boolean): boolean {
  const configuredCommand = normalizedCommand(commandFromServerConfig(serverConfig));
  const templateCommand = normalizedCommand(commandFromServerConfig(template));
  if (!configuredCommand || !templateCommand || configuredCommand !== templateCommand) {
    return false;
  }

  const requiredArgs = significantStdioArgs(argsFromServerConfig(template), supportsReadOnly);
  if (requiredArgs.length === 0) {
    return false;
  }

  const configuredArgs = new Set(argsFromServerConfig(serverConfig).map((arg) => arg.toLowerCase()));
  return requiredArgs.every((arg) => configuredArgs.has(arg));
}

function commandFromServerConfig(value: unknown): string | null {
  if (!isObject(value) || typeof value.command !== 'string') {
    return null;
  }
  return value.command;
}

function argsFromServerConfig(value: unknown): string[] {
  if (!isObject(value) || !Array.isArray(value.args)) {
    return [];
  }
  return value.args.flatMap((arg) => typeof arg === 'string' ? [arg.trim()] : []).filter(Boolean);
}

function significantStdioArgs(args: string[], requireSafetySignals: boolean): string[] {
  return args.flatMap((arg) => {
    const normalized = arg.trim().toLowerCase();
    if (!normalized || normalized === '-y') {
      return [];
    }
    if (/[<>{}]|your_|api[_-]?key|token|secret|connectionstring|localhost/.test(normalized)) {
      return [];
    }
    if (normalized.includes('mcp')) {
      return [normalized];
    }
    if (
      requireSafetySignals &&
      (normalized.includes('readonly') ||
        normalized.includes('read-only') ||
        normalized.includes('non-destructive'))
    ) {
      return [normalized];
    }
    return [];
  });
}

function normalizedCommand(value: string | null): string | null {
  const normalized = normalizeText(value, 80);
  if (!normalized) {
    return null;
  }
  return normalized.toLowerCase().replace(/\.cmd$/i, '');
}

function urlFromServerConfig(value: unknown): string | null {
  if (!isObject(value) || typeof value.url !== 'string') {
    return null;
  }
  return value.url;
}

function normalizedUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase().replace(/\/+$/, '');
  return normalized.length > 0 ? normalized : null;
}

function transportForTemplate(mcp: ProviderMcpTemplate): string {
  const vscodeTransport = transportFromServer(mcp.vscodeServer);
  if (vscodeTransport) {
    return vscodeTransport;
  }
  const cursorTransport = transportFromServer(mcp.cursorServer);
  return cursorTransport ?? 'unknown';
}

function transportFromServer(value: unknown): string | null {
  if (!isObject(value)) {
    return null;
  }
  if (typeof value.type === 'string') {
    const type = normalizeTransport(value.type);
    if (type) {
      return type;
    }
  }
  if (typeof value.url === 'string') {
    return 'http';
  }
  if (typeof value.command === 'string') {
    return 'stdio';
  }
  return null;
}

function normalizeRecord(value: unknown): McpVerifierStateRecord | null {
  if (!isObject(value) || value.version !== 1) {
    return null;
  }

  const provider = normalizeText(value.provider, 80);
  const label = normalizeText(value.label, 120);
  const status = normalizeStatus(value.status);
  const configuredIn = normalizeConfiguredIn(value.configuredIn);
  const serverName = normalizeText(value.serverName, 120);
  const transport = normalizeTransport(value.transport);
  const checkedAt = typeof value.checkedAt === 'string' && isUtcIsoTimestamp(value.checkedAt) ? value.checkedAt : null;
  const registryVersion = value.registryVersion === 1 ? value.registryVersion : null;
  const registrySource = typeof value.registrySource === 'string' && VALID_REGISTRY_SOURCE[value.registrySource as ProviderRegistrySource]
    ? value.registrySource as ProviderRegistrySource
    : null;
  const registryGeneratedAt = typeof value.registryGeneratedAt === 'string' && isUtcIsoTimestamp(value.registryGeneratedAt)
    ? value.registryGeneratedAt
    : null;

  if (
    !provider ||
    !label ||
    !status ||
    value.runtimeStatus !== RUNTIME_STATUS ||
    !configuredIn ||
    !serverName ||
    !transport ||
    typeof value.supportsReadOnly !== 'boolean' ||
    !checkedAt ||
    !registryVersion ||
    !registrySource ||
    !registryGeneratedAt
  ) {
    return null;
  }

  return {
    version: 1,
    provider: provider as ProviderRegistryEntry['provider'],
    label,
    status,
    runtimeStatus: RUNTIME_STATUS,
    configuredIn,
    serverName,
    transport,
    supportsReadOnly: value.supportsReadOnly,
    checkedAt,
    registryVersion,
    registrySource,
    registryGeneratedAt
  };
}

function normalizeStatus(value: unknown): McpVerifierConfigStatus | null {
  return typeof value === 'string' && VALID_CONFIG_STATUS[value as McpVerifierConfigStatus]
    ? value as McpVerifierConfigStatus
    : null;
}

function normalizeConfiguredIn(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const paths = value.flatMap((path) => {
    const normalized = normalizeText(path, 260);
    return normalized ? [normalized] : [];
  });
  return paths.length === value.length ? uniqueSorted(paths) : null;
}

function normalizeTransport(value: unknown): string | null {
  const normalized = normalizeText(value, 40);
  if (!normalized) {
    return null;
  }
  return /^[a-z0-9._:-]+$/i.test(normalized) ? normalized.toLowerCase() : null;
}

function normalizeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value
    .replace(/\b(?:sk|pk)_(?:live|test)_[a-zA-Z0-9_]+\b/g, '[redacted]')
    .replace(/\b(api[_-]?key|access[_-]?token|refresh[_-]?token|secret)\s*[:=]\s*\S+/gi, '$1=[redacted]')
    .replace(/\bBearer\s+[a-zA-Z0-9._~+/=-]+\b/gi, 'Bearer [redacted]')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
  return normalized.length > 0 ? normalized : null;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function isUtcIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{3}))?Z$/.exec(value);
  if (!match) {
    return false;
  }
  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    return false;
  }
  return new Date(time).toISOString() === `${match[1]}.${match[2] ?? '000'}Z`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

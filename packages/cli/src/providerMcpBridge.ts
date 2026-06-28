import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export type ProviderVerifyResult = {
  verified: boolean;
  proof?: string;
  reason?: string;
  upgradeUrl?: string;
  mcpUnavailable?: boolean;
  fallbackCommand?: string;
};

export type ProviderMcpConfig = {
  command?: string;
  args?: string[];
  url?: string;
  source: string;
};

const UPGRADE_URL = 'https://viberaven.dev/pricing';
const FALLBACK_COMMAND = 'npx -y viberaven audit --vercel-supabase --json';
const SUPPORTED_PROVIDERS = new Set(['supabase', 'vercel']);

let configPathsOverride: string[] | undefined;

export function setMcpConfigPathsForTest(paths?: string[]): void {
  configPathsOverride = paths;
}

export function defaultMcpConfigPaths(): string[] {
  const home = homedir();
  return [
    join(home, '.config', 'claude', 'claude_desktop_config.json'),
    join(home, '.cursor', 'mcp.json'),
    join(home, '.gemini', 'antigravity', 'mcp_config.json'),
  ];
}

function resolveConfigPaths(): string[] {
  return configPathsOverride ?? defaultMcpConfigPaths();
}

function parseMcpServers(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }

  const obj = raw as Record<string, unknown>;
  if (obj.mcpServers && typeof obj.mcpServers === 'object') {
    return obj.mcpServers as Record<string, unknown>;
  }

  if (obj.servers && typeof obj.servers === 'object') {
    return obj.servers as Record<string, unknown>;
  }

  return undefined;
}

function findServerEntry(servers: Record<string, unknown>, provider: string): unknown {
  if (servers[provider]) {
    return servers[provider];
  }

  const key = Object.keys(servers).find((candidate) => candidate.toLowerCase() === provider);
  return key ? servers[key] : undefined;
}

export function findProviderMcpConfig(
  provider: string,
  configPaths?: string[]
): ProviderMcpConfig | undefined {
  const paths = configPaths ?? resolveConfigPaths();

  for (const path of paths) {
    if (!existsSync(path)) {
      continue;
    }

    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
      const servers = parseMcpServers(raw);
      if (!servers) {
        continue;
      }

      const entry = findServerEntry(servers, provider);
      if (!entry || typeof entry !== 'object') {
        continue;
      }

      const server = entry as Record<string, unknown>;
      return {
        command: typeof server.command === 'string' ? server.command : undefined,
        args: Array.isArray(server.args)
          ? server.args.filter((arg): arg is string => typeof arg === 'string')
          : undefined,
        url: typeof server.url === 'string' ? server.url : undefined,
        source: path,
      };
    } catch {
      continue;
    }
  }

  return undefined;
}

export async function verifyProviderGap(options: {
  provider: string;
  check: string;
  cwd: string;
  plan: string;
}): Promise<ProviderVerifyResult> {
  if (options.plan !== 'pro') {
    return {
      verified: false,
      reason: 'pro-required',
      upgradeUrl: UPGRADE_URL,
    };
  }

  const provider = options.provider.toLowerCase().trim();
  if (!SUPPORTED_PROVIDERS.has(provider)) {
    return {
      verified: false,
      reason: 'unsupported-provider',
    };
  }

  const mcpConfig = findProviderMcpConfig(provider);
  if (!mcpConfig) {
    return {
      verified: false,
      mcpUnavailable: true,
      fallbackCommand: FALLBACK_COMMAND,
    };
  }

  // V1: provider MCP child-process verification is deferred; config presence is not enough yet.
  return {
    verified: false,
    mcpUnavailable: true,
    fallbackCommand: FALLBACK_COMMAND,
  };
}

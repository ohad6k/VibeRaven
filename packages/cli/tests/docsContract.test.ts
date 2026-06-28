import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PUBLIC_AGENT_MODE_COMMAND,
  PUBLIC_AUDIT_COMMAND,
  PUBLIC_COMMAND,
  PUBLIC_STRICT_COMMAND,
  PUBLIC_VERIFY_COMMAND,
} from '../src/contracts/commands';

function findRepoRoot(start: string): string {
  let current = resolve(start);
  while (current !== dirname(current)) {
    if (existsSync(join(current, 'package.json')) && existsSync(join(current, 'packages', 'cli'))) {
      return current;
    }
    current = dirname(current);
  }
  throw new Error('Could not find VibeRaven repo root');
}

const repoRoot = findRepoRoot(process.cwd());

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(repoRoot, path), 'utf8')) as Record<string, unknown>;
}

describe('public 1.2.4 Studio docs contract', () => {
  it('uses the no-arg Studio command as the primary open-source surface', () => {
    expect(PUBLIC_COMMAND).toBe('npx -y viberaven');
    expect(PUBLIC_AGENT_MODE_COMMAND).toBe('npx -y viberaven --agent-mode');
    expect(PUBLIC_VERIFY_COMMAND).toBe('npx -y viberaven --verify');
    expect(PUBLIC_STRICT_COMMAND).toBe('npx -y viberaven --strict');
    expect(PUBLIC_AUDIT_COMMAND).toBe('npx -y viberaven audit --vercel-supabase');
  });

  it('keeps npm package metadata aligned for the 1.2.4 public release', () => {
    const cliPackage = readJson('packages/cli/package.json');
    const mcpPackage = readJson('packages/mcp/package.json');
    const shimPackage = readJson('packages/viberaven-shim/package.json');
    const rootPackage = readJson('package.json');
    const cliVersionSource = readFileSync(resolve(repoRoot, 'packages/cli/src/version.ts'), 'utf8');
    const mcpServerSource = readFileSync(resolve(repoRoot, 'packages/mcp/src/server.ts'), 'utf8');

    expect(cliPackage.version).toBe('1.2.4');
    expect(mcpPackage.version).toBe('1.2.4');
    expect(shimPackage.version).toBe('1.2.4');
    expect((shimPackage.dependencies as Record<string, string>)['@viberaven/cli']).toBe('1.2.4');
    expect(cliVersionSource).toContain("VERSION = '1.2.4'");
    expect(mcpServerSource).toContain("version: '1.2.4'");
    expect((cliPackage.publishConfig as Record<string, string>).tag).toBe('latest');
    expect((mcpPackage.publishConfig as Record<string, string>).tag).toBe('latest');
    expect(JSON.stringify(rootPackage.scripts)).not.toContain('publish:beta');
    expect(JSON.stringify(rootPackage.scripts)).not.toContain('--tag beta');
  });

  it('publishes Studio-first public agent docs without removing MCP and verification paths', () => {
    const skill = readFileSync(resolve(repoRoot, 'skills/viberaven/SKILL.md'), 'utf8');
    const llms = readFileSync(resolve(repoRoot, 'llms.txt'), 'utf8');
    const mcpReadme = readFileSync(resolve(repoRoot, 'packages/mcp/README.md'), 'utf8');
    const combined = `${skill}\n${llms}\n${mcpReadme}`;

    expect(combined).toContain('npx -y viberaven');
    expect(combined).toContain('npx -y viberaven --agent-mode');
    expect(combined).toContain('npx -y viberaven --verify');
    expect(combined).toContain('viberaven_check_readiness');
    expect(combined).toContain('VibeRaven Studio');
    expect(combined).toContain('provider dashboard checks');
    expect(combined).toContain('repo-code edits');
  });

  it('documents the current product focus where future agents will see it first', () => {
    const rootAgents = readFileSync(resolve(repoRoot, 'AGENTS.md'), 'utf8');
    const readme = readFileSync(resolve(repoRoot, 'README.md'), 'utf8');
    const content = `${rootAgents}\n${readme}`;

    for (const required of [
      'open-source',
      'agentic chat',
      'Provider Control Board',
      'Versions & Releases',
      'MCP',
      'Codex',
      'Claude',
      'Gemini',
    ]) {
      expect(content).toContain(required);
    }
  });

  it('ships the mascot/favicon asset and provider logo registry required by the Studio UI', () => {
    expect(existsSync(resolve(repoRoot, 'packages/cli/assets/report/assets/viberaven-favicon.png'))).toBe(true);
    expect(existsSync(resolve(repoRoot, 'packages/cli/assets/report/assets/viberaven-mascot.png'))).toBe(true);

    const reportAssets = readFileSync(resolve(repoRoot, 'packages/cli/src/report/reportAssets.ts'), 'utf8');
    const providerLogos = readFileSync(resolve(repoRoot, 'packages/cli/src/report/providerLogos.ts'), 'utf8');

    expect(reportAssets).toContain('viberaven-favicon.png');
    expect(reportAssets).toContain('viberaven-mascot.png');
    expect(providerLogos).toContain('cdn.simpleicons.org/github/FFFFFF');
    expect(providerLogos).toContain('cdn.simpleicons.org/vercel/FFFFFF');
    expect(providerLogos).toContain('cdn.simpleicons.org/resend/FFFFFF');
    expect(providerLogos).toContain('cdn.simpleicons.org/sentry/8B5CF6');
  });

  it('keeps open-core package trust metadata intact', () => {
    for (const path of ['LICENSE', 'packages/cli/LICENSE', 'packages/mcp/LICENSE', 'packages/viberaven-shim/LICENSE']) {
      expect(readFileSync(resolve(repoRoot, path), 'utf8')).toContain('MIT License');
    }

    expect((readJson('packages/cli/package.json').license)).toBe('MIT');
    expect((readJson('packages/mcp/package.json').license)).toBe('MIT');
    expect((readJson('packages/viberaven-shim/package.json').license)).toBe('MIT');
    expect(readFileSync(resolve(repoRoot, 'README.md'), 'utf8')).toContain('open-source');
    expect(readFileSync(resolve(repoRoot, 'CONTRIBUTING.md'), 'utf8').length).toBeGreaterThan(0);
  });
});

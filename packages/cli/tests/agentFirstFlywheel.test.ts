import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

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

describe('VibeRaven Studio public contract', () => {
  it('exposes the current open-source Studio entry in the public agent files', () => {
    const skillPath = resolve(repoRoot, 'skills/viberaven/SKILL.md');
    expect(existsSync(skillPath)).toBe(true);

    const skill = readFileSync(skillPath, 'utf8');
    const llms = readFileSync(resolve(repoRoot, 'llms.txt'), 'utf8');
    const combined = `${skill}\n${llms}`;

    expect(combined).toContain('npx -y viberaven');
    expect(combined).toContain('VibeRaven Studio');
    expect(combined).toContain('provider');
    expect(combined).toContain('MCP');
  });

  it('keeps the repo-level product map focused on the 1.2.4 Studio surface', () => {
    const agentsMd = readFileSync(resolve(repoRoot, 'AGENTS.md'), 'utf8');
    const readme = readFileSync(resolve(repoRoot, 'README.md'), 'utf8');
    const combined = `${agentsMd}\n${readme}`;

    expect(combined).toContain('open-source');
    expect(combined).toContain('agentic chat');
    expect(combined).toContain('MCP');
    expect(combined).toContain('Versions & Releases');
    expect(combined).toContain('Codex');
    expect(combined).toContain('Claude');
    expect(combined).toContain('Gemini');
  });

  it('keeps the packaged local UI artifacts wired to the current Studio shell', () => {
    const html = readFileSync(resolve(repoRoot, 'packages/cli/src/local-ui/static/appHtml.ts'), 'utf8');
    const client = readFileSync(resolve(repoRoot, 'packages/cli/src/local-ui/static/appClient.ts'), 'utf8');
    const css = readFileSync(resolve(repoRoot, 'packages/cli/src/local-ui/static/appCss.ts'), 'utf8');

    expect(html).toContain('/report/assets/viberaven-favicon.png');
    expect(html).toContain('/report/assets/viberaven-mascot.png');
    expect(client).toContain('/api/agent-chat');
    expect(client).toContain('VibeRaven Chat');
    expect(client).toContain('Provider Control Board');
    expect(client).toContain('Versions & Releases');
    expect(client).toContain('Full access');
    expect(client).toContain('test-cli-connection');
    expect(css).toContain('vr-provider-mcp-chip');
    expect(css).toContain('vr-bottom-github');
  });
});

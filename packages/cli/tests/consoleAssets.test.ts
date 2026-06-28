import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');

describe('console assets', () => {
  it('ships a static browser console', () => {
    const html = readFileSync(resolve(root, 'assets/console/index.html'), 'utf8');
    const css = readFileSync(resolve(root, 'assets/console/styles.css'), 'utf8');
    const js = readFileSync(resolve(root, 'assets/console/app.js'), 'utf8');

    expect(html).toContain('VibeRaven Console');
    expect(html).toContain('/api/actions');
    expect(css).toContain('.action-card');
    expect(js).toContain('copyPayload');
    expect(js).toContain('Copy failed');
    expect(js).toContain('Copy Resume');
    expect(js).toContain('EventSource');
    expect(js).toContain('/api/events');
    expect(js).toContain('/api/command');
    expect(js).toContain('verify-action');
    expect(js).toContain('Verify');
    expect(js).not.toContain('Copy Verify');
  });

  it('build script knows how to copy console assets', () => {
    const build = readFileSync(resolve(root, 'scripts/build.mjs'), 'utf8');
    expect(build).toContain("assets', 'console'");
    expect(build).toContain("dist', 'console'");
    expect(build).toContain('expectedConsoleAssetNames');
    expect(build).toContain("'index.html'");
    expect(build).toContain("'styles.css'");
    expect(build).toContain("'app.js'");
    expect(existsSync(resolve(root, 'assets/console/index.html'))).toBe(true);
  });

  it('does not resolve static console assets from the user project cwd', () => {
    const server = readFileSync(resolve(root, 'src/console/server.ts'), 'utf8');
    expect(server).not.toContain('process.cwd()');
  });
});

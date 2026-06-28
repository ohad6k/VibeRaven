import { describe, expect, it } from 'vitest';
import { resolveDefaultEntrypointMode } from '../../src/cli';

describe('default VibeRaven entrypoint', () => {
  it('opens the local UI for human TTY use', () => {
    expect(resolveDefaultEntrypointMode({ stdinIsTTY: true, stdoutIsTTY: true, env: {} })).toBe('local-ui');
  });

  it('opens the local UI by default even when launched from a non-TTY wrapper', () => {
    expect(resolveDefaultEntrypointMode({ stdinIsTTY: false, stdoutIsTTY: true, env: {} })).toBe('local-ui');
    expect(resolveDefaultEntrypointMode({ stdinIsTTY: false, stdoutIsTTY: false, env: {} })).toBe('local-ui');
  });

  it('lets users keep the old interactive menu with an env override', () => {
    expect(resolveDefaultEntrypointMode({ stdinIsTTY: true, stdoutIsTTY: true, env: { VIBERAVEN_TUI: '1' } })).toBe('interactive');
  });

  it('keeps agent scans explicit through an env override for automation', () => {
    expect(resolveDefaultEntrypointMode({ stdinIsTTY: false, stdoutIsTTY: false, env: { VIBERAVEN_AGENT: '1' } })).toBe('agent-scan');
  });
});

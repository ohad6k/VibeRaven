import { describe, expect, it } from 'vitest';
import { resolveDefaultEntrypointMode } from '../src/cli';

describe('resolveDefaultEntrypointMode', () => {
  it('opens the local UI by default regardless of TTY detection', () => {
    expect(resolveDefaultEntrypointMode({ stdinIsTTY: true, stdoutIsTTY: true, env: {} })).toBe('local-ui');
    expect(resolveDefaultEntrypointMode({ stdinIsTTY: false, stdoutIsTTY: true, env: {} })).toBe('local-ui');
    expect(resolveDefaultEntrypointMode({ stdinIsTTY: true, stdoutIsTTY: false, env: {} })).toBe('local-ui');
    expect(resolveDefaultEntrypointMode({ stdinIsTTY: false, stdoutIsTTY: false, env: {} })).toBe('local-ui');
  });

  it('lets explicit env flags override TTY detection', () => {
    expect(
      resolveDefaultEntrypointMode({
        stdinIsTTY: true,
        stdoutIsTTY: true,
        env: { VIBERAVEN_AGENT: '1' }
      })
    ).toBe('agent-scan');
    expect(
      resolveDefaultEntrypointMode({
        stdinIsTTY: false,
        stdoutIsTTY: false,
        env: { VIBERAVEN_TUI: '1' }
      })
    ).toBe('interactive');
  });
});

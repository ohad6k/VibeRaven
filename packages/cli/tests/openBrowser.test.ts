import { describe, expect, it } from 'vitest';
import { createOpenCommand } from '../src/openBrowser';

describe('open browser command', () => {
  it('opens VibeRaven device URLs on Windows without shell true', () => {
    const command = createOpenCommand(
      'https://viberaven.dev/connect?code=abc&device_code=abc',
      'win32'
    );

    expect(command.command).toBe('rundll32');
    expect(command.shell).toBe(false);
    expect(command.args).toEqual([
      'url.dll,FileProtocolHandler',
      'https://viberaven.dev/connect?code=abc&device_code=abc'
    ]);
  });
});

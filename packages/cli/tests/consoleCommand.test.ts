import { afterEach, describe, expect, it, vi } from 'vitest';
import { runConsoleCliCommand } from '../src/commands/console';
import { openUrlInBrowser } from '../src/openBrowser';

vi.mock('../src/openBrowser', () => ({
  openUrlInBrowser: vi.fn(),
}));

afterEach(() => {
  vi.mocked(openUrlInBrowser).mockReset();
  vi.restoreAllMocks();
});

describe('runConsoleCliCommand', () => {
  it('starts console server and prints local URL', async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const output: string[] = [];
    const start = vi.fn().mockResolvedValue({
      url: 'http://127.0.0.1:54321',
      token: 'abc',
      close,
    });
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      output.push(String(chunk));
      return true;
    });

    const code = await runConsoleCliCommand({
      cwd: 'D:/workspace',
      port: 0,
      open: false,
      once: true,
      start,
    });

    expect(code).toBe(0);
    expect(start).toHaveBeenCalledWith({ cwd: 'D:/workspace', port: 0, open: false });
    expect(output.join('')).toContain('http://127.0.0.1:54321');
    expect(output.join('')).toContain('Local only');
    expect(close).toHaveBeenCalled();
  });

  it('warns and still closes once when browser open fails', async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const errors: string[] = [];
    const start = vi.fn().mockResolvedValue({
      url: 'http://127.0.0.1:54321',
      token: 'abc',
      close,
    });
    vi.mocked(openUrlInBrowser).mockRejectedValue(new Error('no browser'));
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      errors.push(String(chunk));
      return true;
    });

    const code = await runConsoleCliCommand({
      cwd: 'D:/workspace',
      open: true,
      once: true,
      start,
    });

    expect(code).toBe(0);
    expect(openUrlInBrowser).toHaveBeenCalledWith('http://127.0.0.1:54321');
    expect(errors.join('')).toContain('Could not open browser');
    expect(errors.join('')).toContain('http://127.0.0.1:54321');
    expect(close).toHaveBeenCalled();
  });

  it('returns nonzero when once shutdown fails', async () => {
    const close = vi.fn().mockRejectedValue(new Error('close failed'));
    const errors: string[] = [];
    const start = vi.fn().mockResolvedValue({
      url: 'http://127.0.0.1:54321',
      token: 'abc',
      close,
    });
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      errors.push(String(chunk));
      return true;
    });

    const code = await runConsoleCliCommand({
      cwd: 'D:/workspace',
      once: true,
      start,
    });

    expect(code).toBe(1);
    expect(errors.join('')).toContain('Could not stop console server');
    expect(errors.join('')).toContain('close failed');
  });
});

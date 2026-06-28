import { spawn } from 'node:child_process';

/**
 * Copy text to the system clipboard (Windows clip, macOS pbcopy, Linux wl-copy/xclip).
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (!text) {
    throw new Error('Nothing to copy.');
  }

  if (process.platform === 'win32') {
    await pipeToCommand('clip', text);
    return;
  }

  if (process.platform === 'darwin') {
    await pipeToCommand('pbcopy', text);
    return;
  }

  try {
    await pipeToCommand('wl-copy', text);
    return;
  } catch {
    // fall through
  }

  try {
    await pipeToCommand('xclip', text, ['-selection', 'clipboard']);
    return;
  } catch {
    throw new Error('Clipboard unavailable. Install wl-clipboard or xclip, or copy from the terminal output.');
  }
}

function pipeToCommand(command: string, text: string, extraArgs: string[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, extraArgs, { stdio: ['pipe', 'ignore', 'ignore'] });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code ?? 'unknown'}`));
      }
    });
    child.stdin?.write(text, 'utf8', (error) => {
      if (error) {
        reject(error);
        return;
      }
      child.stdin?.end();
    });
  });
}

import { openUrlInBrowser } from '../openBrowser';
import { createConsoleServer, type ConsoleServerHandle } from '../console/server';

export async function runConsoleCliCommand(input: {
  cwd: string;
  port?: number;
  open?: boolean;
  once?: boolean;
  start?: typeof createConsoleServer;
}): Promise<number> {
  const closeServer = async (serverToClose: ConsoleServerHandle): Promise<number> => {
    try {
      await serverToClose.close();
      return 0;
    } catch (error) {
      process.stderr.write(
        `Could not stop console server: ${error instanceof Error ? error.message : String(error)}\n`
      );
      return 1;
    }
  };

  const start = input.start ?? createConsoleServer;
  const server: ConsoleServerHandle = await start({
    cwd: input.cwd,
    port: input.port,
    open: false,
  });
  process.stdout.write(`VibeRaven Console: ${server.url}\n`);
  process.stdout.write('Local only. Press Ctrl+C to stop.\n');

  if (input.open) {
    try {
      await openUrlInBrowser(server.url);
    } catch (error) {
      process.stderr.write(
        `Could not open browser: ${error instanceof Error ? error.message : String(error)}. Open manually: ${server.url}\n`
      );
    }
  }

  if (input.once) {
    return closeServer(server);
  }

  return new Promise<number>((resolve) => {
    const onSigint = () => {
      process.off('SIGINT', onSigint);
      void closeServer(server).then(resolve);
    };
    process.once('SIGINT', onSigint);
  });
}

import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { existsSync, watch, type FSWatcher } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { runAllowedConsoleCommand, type ConsoleCommandResult } from './commands';
import { loadConsoleActionState, redactConsoleValue } from './manifest';
import { createConsoleSessionToken, isAllowedConsoleOrigin, requireConsoleToken } from './security';

const PUBLIC_COMMAND_ERROR_MESSAGES = new Set(['Unsupported console command.', 'Invalid VibeRaven action ID.']);

export type ConsoleServerHandle = {
  url: string;
  token: string;
  close: () => Promise<void>;
};

type ConsoleServerInput = {
  cwd: string;
  port?: number;
  open?: boolean;
  cliPath?: string;
  runCommand?: typeof runAllowedConsoleCommand;
  watchDirectory?: typeof watch;
  onEventResponse?: (response: ServerResponse) => void;
};

const STATIC_ASSETS = new Map([
  ['/', { filename: 'index.html', contentType: 'text/html; charset=utf-8' }],
  ['/styles.css', { filename: 'styles.css', contentType: 'text/css; charset=utf-8' }],
  ['/app.js', { filename: 'app.js', contentType: 'application/javascript; charset=utf-8' }],
]);

const ACTION_EVENT_FILES = new Set(['actions.json', 'action-registry.json', 'gate-result.json']);

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
}

function sendText(response: ServerResponse, status: number, contentType: string, body: string): void {
  response.writeHead(status, { 'Content-Type': contentType });
  response.end(body);
}

function injectConsoleToken(html: string, token: string): string {
  const tokenScript = `<script>window.__VIBERAVEN_TOKEN__ = ${JSON.stringify(token)};</script>`;
  return html.includes('</head>') ? html.replace('</head>', `    ${tokenScript}\n  </head>`) : `${html}\n${tokenScript}`;
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString('utf8').trim();
  if (!body) return {};

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new Error('Invalid JSON body.');
  }
}

function getHeader(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function getServerPort(server: Server): number {
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Console server is not listening on a TCP port.');
  }
  return address.port;
}

function publicCommandErrorMessage(error: unknown): string {
  if (error instanceof Error && PUBLIC_COMMAND_ERROR_MESSAGES.has(error.message)) {
    return error.message;
  }

  return 'Console command failed.';
}

function sanitizeCommandOutput(output: string): string {
  return redactConsoleValue(output)
    .split(/\r?\n/)
    .filter((line) => !/^\s*(?:stack\b|at\s+)/i.test(line))
    .join('\n');
}

function sanitizeCommandResult(result: ConsoleCommandResult): ConsoleCommandResult {
  return {
    exitCode: result.exitCode,
    stdout: sanitizeCommandOutput(result.stdout),
    stderr: sanitizeCommandOutput(result.stderr),
  };
}

function resolveConsoleAsset(filename: string): string | undefined {
  const candidates = [
    join(__dirname, 'console', filename),
    join(__dirname, '..', '..', 'assets', 'console', filename),
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

type EventClient = {
  response: ServerResponse;
};

function removeEventClient(eventClients: Set<EventClient>, client: EventClient): void {
  eventClients.delete(client);
}

function destroyEventClient(eventClients: Set<EventClient>, client: EventClient): void {
  removeEventClient(eventClients, client);
  if (client.response.writableEnded || client.response.destroyed) return;

  if (typeof client.response.destroy === 'function') {
    client.response.destroy();
    return;
  }

  client.response.socket?.destroy();
}

function sendActionChangedEvent(eventClients: Set<EventClient>, client: EventClient): void {
  const { response } = client;
  if (response.writableEnded || response.destroyed) {
    removeEventClient(eventClients, client);
    return;
  }

  const didFlush = response.write('event: actions\ndata: {"type":"actions-changed"}\n\n');
  if (!didFlush) {
    destroyEventClient(eventClients, client);
  }
}

export async function createConsoleServer(input: ConsoleServerInput): Promise<ConsoleServerHandle> {
  const token = createConsoleSessionToken();
  const cliPath = input.cliPath ?? process.argv[1] ?? '';
  const runCommand = input.runCommand ?? runAllowedConsoleCommand;
  const watchDirectory = input.watchDirectory ?? watch;
  const eventClients = new Set<EventClient>();
  const viberavenDir = join(input.cwd, '.viberaven');
  let watcher: FSWatcher | undefined;

  function closeWatcher(): void {
    watcher?.close();
    watcher = undefined;
  }

  if (existsSync(viberavenDir)) {
    try {
      watcher = watchDirectory(viberavenDir, (_eventType, filename) => {
        const changedFile = typeof filename === 'string' ? filename : undefined;
        if (!changedFile || !ACTION_EVENT_FILES.has(changedFile)) return;

        for (const client of Array.from(eventClients)) {
          sendActionChangedEvent(eventClients, client);
        }
      });
      watcher.on('error', closeWatcher);
    } catch {
      closeWatcher();
    }
  }

  const server = createServer(async (request, response) => {
    const actualPort = getServerPort(server);
    const origin = getHeader(request, 'origin');
    const authorization = getHeader(request, 'authorization');
    const hasValidToken = requireConsoleToken(authorization, token);
    const hasAllowedOrigin = isAllowedConsoleOrigin(origin, actualPort);

    const url = new URL(request.url ?? '/', `http://127.0.0.1:${actualPort}`);
    const staticAsset = STATIC_ASSETS.get(url.pathname);

    if (request.method === 'GET' && staticAsset) {
      const assetPath = resolveConsoleAsset(staticAsset.filename);
      if (!assetPath) {
        sendJson(response, 404, { ok: false, error: 'Console asset not found.' });
        return;
      }

      const assetBody = await readFile(assetPath, 'utf8');
      sendText(
        response,
        200,
        staticAsset.contentType,
        staticAsset.filename === 'index.html' ? injectConsoleToken(assetBody, token) : assetBody,
      );
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/actions') {
      if (!hasValidToken && !hasAllowedOrigin) {
        sendJson(response, 403, { ok: false, error: 'Disallowed origin.' });
        return;
      }

      sendJson(response, 200, await loadConsoleActionState(input.cwd));
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/events') {
      if (!hasValidToken && !hasAllowedOrigin) {
        sendJson(response, 403, { ok: false, error: 'Disallowed origin.' });
        return;
      }

      response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      response.write(': connected\n\n');
      input.onEventResponse?.(response);
      const client: EventClient = { response };
      const removeClient = () => removeEventClient(eventClients, client);
      eventClients.add(client);
      request.on('close', removeClient);
      request.on('error', removeClient);
      response.on('close', removeClient);
      response.on('error', removeClient);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/command') {
      if (!hasAllowedOrigin) {
        sendJson(response, 403, { ok: false, error: 'Disallowed origin.' });
        return;
      }

      if (!hasValidToken) {
        sendJson(response, 401, { ok: false, error: 'Unauthorized.' });
        return;
      }

      let commandRequest: unknown;
      try {
        commandRequest = await readJsonBody(request);
      } catch {
        sendJson(response, 400, { ok: false, error: 'Invalid JSON body.' });
        return;
      }

      try {
        const result = await runCommand({ cliPath, cwd: input.cwd, request: commandRequest });
        sendJson(response, 200, { ok: true, result: sanitizeCommandResult(result) });
      } catch (error) {
        sendJson(response, 400, { ok: false, error: publicCommandErrorMessage(error) });
      }
      return;
    }

    sendJson(response, 404, { ok: false, error: 'Not found.' });
  });

  await new Promise<void>((resolve, reject) => {
    const handleListenError = (error: Error) => {
      closeWatcher();
      reject(error);
    };
    server.once('error', handleListenError);
    server.listen(input.port ?? 0, '127.0.0.1', () => {
      server.off('error', handleListenError);
      resolve();
    });
  });

  const actualPort = getServerPort(server);
  return {
    url: `http://127.0.0.1:${actualPort}`,
    token,
    close: () =>
      new Promise<void>((resolve, reject) => {
        closeWatcher();
        for (const client of eventClients) {
          client.response.end();
        }
        eventClients.clear();
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}

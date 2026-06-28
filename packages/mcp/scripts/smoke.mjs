import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { mkdtemp, writeFile, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, delimiter, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED_TOOLS = [
  'viberaven_check_readiness', 'viberaven_verify', 'viberaven_audit',
  'viberaven_init_rules', 'viberaven_clean_plan', 'viberaven_strict_gate',
  'viberaven_gate_result', 'viberaven_context_map', 'viberaven_actions',
  'viberaven_verify_action', 'viberaven_heal_plan', 'viberaven_heal_prompt',
  'viberaven_heal_apply', 'viberaven_validate_npm_package',
];

const isWin = process.platform === 'win32';

async function makeStubNpxDir() {
  const dir = await mkdtemp(join(tmpdir(), 'viberaven-smoke-npx-'));
  if (isWin) {
    const stub = '@echo {"gate":{"status":"clear"}}\r\n@exit 0\r\n';
    await writeFile(join(dir, 'npx.cmd'), stub);
    await writeFile(join(dir, 'npx.bat'), stub);
  } else {
    const stub = join(dir, 'npx');
    await writeFile(stub, "#!/bin/sh\necho '{\"gate\":{\"status\":\"clear\"}}'\n");
    await chmod(stub, 0o755);
  }
  return dir;
}

const stubDir = await makeStubNpxDir();
const childEnv = { ...process.env, PATH: `${stubDir}${delimiter}${process.env.PATH ?? ''}` };
const server = spawn(process.execPath, [join(root, 'dist', 'server.js')], {
  cwd: root,
  stdio: ['pipe', 'pipe', 'inherit'],
  env: childEnv
});

let buffer = '';
let phase = 'init';
let failed = null;
let done = false;

function cleanup(code) {
  if (done) return;
  done = true;
  server.kill();
  try { rmSync(stubDir, { recursive: true, force: true }); } catch {}
  if (failed) {
    console.error('MCP SMOKE FAILED:', failed);
    process.exit(1);
  }
  console.log('MCP SMOKE OK — initialize + tools/list (14) + tools/call structuredContent verified');
  process.exit(code ?? 0);
}

function send(msg) {
  server.stdin.write(JSON.stringify(msg) + '\n');
}

server.stdin.on('error', (e) => { if (!done) { failed = `stdin: ${e.message}`; cleanup(1); } });

server.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  let nl;
  while ((nl = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    handle(msg);
  }
});

function handle(msg) {
  if (failed) return;
  if (phase === 'init' && msg.id === 1) {
    if (msg.result?.serverInfo?.name !== 'viberaven-mcp') {
      failed = `serverInfo.name mismatch: ${msg.result?.serverInfo?.name}`;
      cleanup(1);
      return;
    }
    phase = 'list';
    send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    return;
  }
  if (phase === 'list' && msg.id === 2) {
    const names = (msg.result?.tools ?? []).map((t) => t.name);
    const missing = REQUIRED_TOOLS.filter((n) => !names.includes(n));
    if (missing.length) { failed = `missing tools: ${missing.join(', ')}`; cleanup(1); return; }
    phase = 'call';
    send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'viberaven_gate_result', arguments: { cwd: root } } });
    return;
  }
  if (phase === 'call' && msg.id === 3) {
    const sc = msg.result?.structuredContent;
    if (!sc || sc.gate?.status !== 'clear') {
      failed = `structuredContent not preserved over wire: ${JSON.stringify(msg.result)}`;
      cleanup(1);
      return;
    }
    cleanup(0);
    return;
  }
}

send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'smoke', version: '0' } } });

setTimeout(() => { if (!done) { failed = 'smoke timed out'; cleanup(1); } }, 15000);
server.on('exit', (code) => { if (!done) { failed = `server exited early code=${code}`; cleanup(1); } });

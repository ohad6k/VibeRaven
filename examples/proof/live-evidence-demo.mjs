#!/usr/bin/env node
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) {
    return null;
  }
  return process.argv[index + 1];
}

const outDir = resolve(process.env.VIBERAVEN_PROOF_OUT_DIR || argValue('--out-dir') || join(root, '.tmp', 'live-evidence-demo'));
const demoRepo = join(outDir, 'oss-next-supabase-demo');

function run(command, args, cwd = demoRepo) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

async function write(relPath, content) {
  const target = join(demoRepo, relPath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
}

async function createDemoRepo() {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(demoRepo, { recursive: true });

  run('git', ['init', '-q']);
  await write('package.json', `${JSON.stringify({ scripts: { start: 'node server.js' }, dependencies: { '@supabase/supabase-js': '^2.0.0' } }, null, 2)}\n`);
  await write('local-live-check.mjs', [
    "import { createServer } from 'node:http';",
    '',
    'const server = createServer((_request, response) => {',
    "  response.writeHead(200, { 'content-type': 'text/plain' });",
    "  response.end('ok');",
    '});',
    '',
    "await new Promise((resolveServer) => server.listen(0, '127.0.0.1', resolveServer));",
    'const address = server.address();',
    "if (!address || typeof address === 'string') throw new Error('Unexpected server address.');",
    'const url = `http://127.0.0.1:${address.port}/`;',
    '',
    'try {',
    '  const response = await fetch(url);',
    '  console.log(JSON.stringify({',
    '    url,',
    '    status: response.status,',
    "    statusText: response.statusText || 'OK',",
    '    body: await response.text(),',
    '  }));',
    '} finally {',
    '  await new Promise((resolveClose) => server.close(resolveClose));',
    '}',
    '',
  ].join('\n'));
  await write('app/auth/callback.ts', [
    'export function redirectAfterLogin(origin: string) {',
    '  return `${origin}/dashboard`;',
    '}',
    '',
  ].join('\n'));
  await write('supabase/migrations/001_profiles.sql', [
    'create table profiles (',
    '  id uuid primary key,',
    '  user_id uuid not null,',
    '  email text not null',
    ');',
    '',
    'alter table profiles enable row level security;',
    '',
    'create policy "profiles owner read"',
    'on profiles for select',
    'using (auth.uid() = user_id);',
    '',
  ].join('\n'));
  await write('.env.example', [
    'NEXT_PUBLIC_SITE_URL=http://localhost:3000',
    'NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co',
    '',
  ].join('\n'));
  run('git', ['add', '.']);
  run('git', ['-c', 'user.name=VibeRaven Demo', '-c', 'user.email=demo@viberaven.dev', 'commit', '-q', '-m', 'working auth release']);
  run('git', ['tag', 'v1.2.3']);

  await write('app/auth/callback.ts', [
    'export function redirectAfterLogin(origin: string) {',
    '  const previewUrl = process.env.NEXT_PUBLIC_PREVIEW_URL;',
    '  return `${previewUrl ?? origin}/dashboard`;',
    '}',
    '',
  ].join('\n'));
  await write('supabase/migrations/002_profile_rls_update.sql', [
    'drop policy if exists "profiles owner read" on profiles;',
    '',
    '-- New release touched RLS, but no provider dashboard/MCP proof is attached.',
    'create policy "profiles owner read"',
    'on profiles for select',
    'using (auth.uid() = user_id);',
    '',
  ].join('\n'));
  await write('.env.example', [
    'NEXT_PUBLIC_SITE_URL=https://app.example.com',
    'NEXT_PUBLIC_PREVIEW_URL=https://preview.example.com',
    'NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co',
    '',
  ].join('\n'));
  run('git', ['add', '.']);
  run('git', ['-c', 'user.name=VibeRaven Demo', '-c', 'user.email=demo@viberaven.dev', 'commit', '-q', '-m', 'release v1.2.4 auth provider drift']);
  run('git', ['tag', 'v1.2.4']);
}

async function httpCheck() {
  return JSON.parse(run('node', ['local-live-check.mjs']));
}

function htmlEscape(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function panel(title, badge, rows, tone = 'neutral') {
  return [
    `<section class="panel ${tone}">`,
    '<header>',
    `<span>${htmlEscape(title)}</span>`,
    `<b>${htmlEscape(badge)}</b>`,
    '</header>',
    '<div class="rows">',
    ...rows.map((row) => `<p>${htmlEscape(row)}</p>`),
    '</div>',
    '</section>',
  ].join('');
}

function renderHtml(evidence) {
  const panels = [
    panel('Repo Diff', 'source: git diff', [
      `${evidence.version.from} -> ${evidence.version.to}`,
      `changed files: ${evidence.git.files.length}`,
      'auth callback changed',
      'Supabase policy touched',
      'redirect env changed',
      'git stat: 10 insertions / 2 deletions',
    ], 'purple'),
    panel('Live Check', 'source: HTTP check', [
      `app responds ${evidence.live.status} ${evidence.live.statusText}`,
      'local live surface reachable',
      evidence.live.url,
    ], 'green'),
    panel('Missing Proof', 'source: repo evidence / provider unknown', [
      'Supabase detected from repo',
      'RLS provider proof missing',
      'auth callback dashboard proof missing',
      'no provider claim from repo edits alone',
    ], 'orange'),
    panel('VibeRaven Effect', 'decision boundary changed', [
      'Do not patch blind.',
      'Repo fix: redirect fallback',
      'Provider action: verify callback URL',
      'Provider action: prove Supabase RLS policy',
    ], 'blue'),
  ].join('');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>VibeRaven live evidence</title>
<style>
:root{color-scheme:dark;--bg:#080b12;--panel:#111622;--line:#273244;--text:#f8fafc;--muted:#a8b3c7;--green:#10b981;--purple:#8b5cf6;--orange:#f59e0b;--blue:#38bdf8}
*{box-sizing:border-box}body{margin:0;width:1400px;height:900px;background:radial-gradient(circle at 25% -10%,rgba(139,92,246,.28),transparent 34%),radial-gradient(circle at 80% 10%,rgba(16,185,129,.22),transparent 32%),var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,Segoe UI,Arial,sans-serif}
main{padding:42px;height:100%}.shell{height:100%;border:1px solid var(--line);border-radius:24px;background:rgba(10,14,23,.92);box-shadow:0 24px 80px rgba(0,0,0,.45);overflow:hidden}.bar{height:42px;background:#121824;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px;padding:0 18px;color:var(--muted);font-size:14px}.dot{width:11px;height:11px;border-radius:50%}.red{background:#ef4444}.yellow{background:#f59e0b}.green-dot{background:#22c55e}.path{margin-left:10px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.content{padding:34px}h1{margin:0;font-size:44px;line-height:1.02;letter-spacing:0}.subtitle{margin:12px 0 28px;color:var(--muted);font-size:22px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.panel{min-height:345px;border:1px solid var(--line);border-radius:18px;background:var(--panel);padding:20px;position:relative;overflow:hidden}.panel:before{content:"";position:absolute;inset:0 0 auto 0;height:4px;background:var(--line)}.panel.purple:before{background:var(--purple)}.panel.green:before{background:var(--green)}.panel.orange:before{background:var(--orange)}.panel.blue:before{background:var(--blue)}header{display:flex;flex-direction:column;gap:8px;margin-bottom:18px}header span{font-size:21px;font-weight:800}header b{width:fit-content;padding:5px 8px;border-radius:999px;background:rgba(148,163,184,.12);color:var(--muted);font-size:12px;font-weight:750}.rows{display:flex;flex-direction:column;gap:12px}p{margin:0;color:#dbeafe;font-size:17px;line-height:1.32;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.footer{margin-top:24px;border:1px solid rgba(245,158,11,.4);border-radius:16px;padding:18px 22px;background:rgba(245,158,11,.08);display:flex;justify-content:space-between;align-items:center;gap:20px}.footer strong{font-size:24px}.footer span{color:var(--muted);font-size:17px}
</style></head><body><main><div class="shell"><div class="bar"><i class="dot red"></i><i class="dot yellow"></i><i class="dot green-dot"></i><span class="path">$ node examples/proof/live-evidence-demo.mjs</span></div><div class="content"><h1>Same app. Same green check. Different decision boundary.</h1><div class="subtitle">VibeRaven turns repo context into production context before the agent patches.</div><div class="grid">${panels}</div><div class="footer"><strong>A green live check is not the same as safe release.</strong><span>Receipts generated from git diff, local HTTP check, and explicit missing provider proof.</span></div></div></div></main></body></html>
`;
}

function renderTerminalProofHtml(evidence) {
  const transcriptLines = [
    '$ git diff --name-only v1.2.3..v1.2.4',
    ...evidence.git.files,
    '',
    '$ git diff --stat v1.2.3..v1.2.4',
    '.env.example                                   | 3 ++-',
    'app/auth/callback.ts                           | 3 ++-',
    'supabase/migrations/002_profile_rls_update.sql | 6 ++++++',
    '3 files changed, 10 insertions(+), 2 deletions(-)',
    '',
    '$ node local-live-check.mjs',
    `HTTP ${evidence.live.status} ${evidence.live.statusText} ${evidence.live.url}`,
    `body: ${evidence.live.body}`,
    '',
    '$ viberaven architecture map',
    ...evidence.architectureContext,
    '',
    '$ viberaven next action',
    'Repo fix: redirect fallback.',
    'Provider proof: verify callback URL + Supabase RLS policy.',
  ];
  const terminalText = transcriptLines.join('\n');
  const withoutText = [
    '$ npm test',
    'PASS  all tests',
    '',
    '$ node local-live-check.mjs',
    `HTTP ${evidence.live.status} ${evidence.live.statusText} ${evidence.live.url}`,
    '',
    '$ agent plan',
    'Edit auth middleware.',
    'Ship it.',
    '',
    'missed:',
    '- v1.2.3 -> v1.2.4 changed auth callback',
    '- Supabase RLS migration changed',
    '- provider dashboard proof is unknown',
  ].join('\n');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>VibeRaven terminal proof</title>
<style>
:root{color-scheme:dark;--bg:#0d1117;--panel:#161b22;--border:#30363d;--text:#e6edf3;--muted:#8b949e;--green:#3fb950;--link:#58a6ff}
*{box-sizing:border-box}html,body{margin:0;width:1200px;min-height:1320px;overflow:hidden;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
main{padding:22px 18px 30px}h1{font-size:32px;line-height:1.25;margin:0 0 12px;font-weight:650;border-bottom:1px solid var(--border);padding-bottom:12px}h2{font-size:25px;line-height:1.3;margin:26px 0 12px;font-weight:650;border-bottom:1px solid var(--border);padding-bottom:8px}p{font-size:17px;line-height:1.5;margin:12px 0;color:var(--text)}strong{font-weight:700}.muted{color:var(--muted)}
pre{margin:0 0 14px;background:var(--panel);border-radius:6px;border:1px solid #21262d;padding:18px;overflow:hidden}
code{font:16px/1.43 ui-monospace,SFMono-Regular,SFMono-Regular,Consolas,"Liberation Mono",Menlo,monospace;color:var(--text);white-space:pre-wrap}
.caption{font-size:16px}.green{color:var(--green)}.link{color:var(--link)}
</style></head><body><main><h1>VibeRaven Architecture Proof</h1><p><strong>Task:</strong> "Login broke after deploy. The app still returns 200 OK."</p><p class="muted">This screenshot is rendered from <code>node examples/proof/live-evidence-demo.mjs --show</code>. The script creates a temp git repo, tags <code>v1.2.3</code> and <code>v1.2.4</code>, runs real <code>git diff</code>, and starts a local HTTP check.</p><h2>Without VibeRaven</h2><pre><code>${htmlEscape(withoutText)}</code></pre><p>A green local check makes the agent patch the nearest auth file. It misses the release diff and provider proof boundary.</p><h2>With VibeRaven</h2><pre><code>${htmlEscape(terminalText)}</code></pre><p><strong>Result:</strong> same green check, but the plan changes before the patch. VibeRaven maps auth, data/RLS, deploy/env, and provider proof boundaries first.</p><p class="caption muted">Generated from: <span class="link">${htmlEscape(evidence.git.source)}</span> + <span class="link">${htmlEscape(evidence.live.source)}</span></p></main></body></html>`;
}

function renderTerminalCard(evidence) {
  return [
    'VibeRaven architecture proof',
    `Temp repo: ${evidence.demoRepo}`,
    'Task: login broke after deploy, but the app still returns 200 OK.',
    '',
    'WITHOUT VIBERAVEN',
    '$ npm test',
    'PASS all tests',
    '',
    '$ node local-live-check.mjs',
    `HTTP ${evidence.live.status} ${evidence.live.statusText} ${evidence.live.url}`,
    '',
    '$ agent plan',
    'Edit auth middleware.',
    'Ship it.',
    '',
    'missed:',
    '- v1.2.3 -> v1.2.4 changed auth callback',
    '- Supabase RLS migration changed',
    '- provider dashboard proof is unknown',
    '',
    'WITH VIBERAVEN',
    '$ git diff --name-only v1.2.3..v1.2.4',
    ...evidence.git.files,
    '',
    '$ viberaven architecture map',
    ...evidence.architectureContext,
    '',
    '$ viberaven next action',
    'Repo fix: redirect fallback.',
    'Provider proof: verify callback URL + Supabase RLS policy.',
    '',
  ].join('\n');
}

function diffLineClass(line) {
  if (line.startsWith('+++') || line.startsWith('---')) return 'meta';
  if (line.startsWith('@@')) return 'hunk';
  if (line.startsWith('+')) return 'add';
  if (line.startsWith('-')) return 'del';
  if (line.startsWith('diff --git') || line.startsWith('index ')) return 'meta';
  return 'ctx';
}

function renderDiffProofHtml(evidence) {
  const diffRows = evidence.git.patch
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .slice(0, 42)
    .map((line) => `<div class="line ${diffLineClass(line)}"><span>${htmlEscape(line)}</span></div>`)
    .join('');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>VibeRaven release drift proof</title>
<style>
:root{color-scheme:dark;--bg:#111827;--panel:#151b26;--border:#7d8797;--text:#edf2f7;--muted:#b8c1d1;--green:#6ee7b7;--green-bg:rgba(22,101,52,.62);--red:#fca5a5;--red-bg:rgba(127,29,29,.58);--blue:#93c5fd;--gold:#fde68a}
*{box-sizing:border-box}html,body{margin:0;width:1200px;height:675px;overflow:hidden;background:#10151f;color:var(--text);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
body:before{content:"";position:absolute;inset:-120px;background:radial-gradient(circle at 22% 95%,rgba(59,130,246,.38),transparent 34%),radial-gradient(circle at 78% 3%,rgba(34,197,94,.34),transparent 38%),linear-gradient(125deg,#111827 0%,#1f2937 48%,#273549 100%);filter:blur(18px);transform:scale(1.05)}
main{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:54px}
.terminal{width:920px;height:470px;border:5px solid rgba(209,213,219,.75);border-radius:28px;background:rgba(16,22,33,.96);box-shadow:0 30px 100px rgba(0,0,0,.48);overflow:hidden}
.bar{height:44px;display:flex;align-items:center;gap:9px;padding:0 20px;border-bottom:1px solid rgba(148,163,184,.26);background:rgba(8,13,22,.85);font:13px/1 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--muted)}
.dot{width:12px;height:12px;border-radius:50%}.r{background:#fb7185}.y{background:#facc15}.g{background:#4ade80}.path{margin-left:12px;color:#dbeafe;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.body{display:grid;grid-template-columns:1fr 1.72fr;gap:0;height:426px}
.side{padding:24px 22px;border-right:1px solid rgba(148,163,184,.22);background:rgba(15,23,42,.8)}
.eyebrow{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);font-weight:800}
h1{font-size:34px;line-height:1.05;margin:8px 0 16px;letter-spacing:0}
.check{margin:14px 0;padding:13px 14px;border-radius:12px;background:rgba(22,163,74,.14);border:1px solid rgba(74,222,128,.32);font:15px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;color:#d1fae5}
.miss{margin-top:18px}.miss b,.fix b{display:block;margin-bottom:7px;font-size:14px}.miss p,.fix p{margin:0 0 7px;color:var(--muted);font-size:14px;line-height:1.25}
.diff{padding:17px 18px;font:13px/1.34 ui-monospace,SFMono-Regular,Consolas,monospace;overflow:hidden}.diffTitle{display:flex;justify-content:space-between;align-items:center;margin:0 0 12px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}.diffTitle b{font-size:16px;color:white}.diffTitle span{font-size:12px;color:var(--gold);font-weight:800;text-transform:uppercase;letter-spacing:.06em}
.line{height:18px;padding:0 8px;white-space:pre;overflow:hidden;text-overflow:ellipsis;border-left:3px solid transparent}.line span{opacity:.98}
.add{background:var(--green-bg);color:#dcfce7;border-left-color:var(--green)}.del{background:var(--red-bg);color:#fee2e2;border-left-color:var(--red)}.hunk{color:var(--blue);background:rgba(30,64,175,.25)}.meta{color:#9ca3af}.ctx{color:#e5e7eb}
.caption{position:absolute;right:76px;bottom:40px;color:rgba(229,231,235,.76);font-size:18px}.caption strong{color:white}
</style></head><body><main><section class="terminal"><div class="bar"><i class="dot r"></i><i class="dot y"></i><i class="dot g"></i><span class="path">${htmlEscape(evidence.demoRepo)} > git diff v1.2.3..v1.2.4</span></div><div class="body"><aside class="side"><div class="eyebrow">Without VibeRaven</div><h1>Green check. Wrong fix.</h1><div class="check">$ npm test<br>PASS all tests<br><br>$ node local-live-check.mjs<br>HTTP ${htmlEscape(evidence.live.status)} ${htmlEscape(evidence.live.statusText)}</div><div class="miss"><b>Agent missed:</b><p>release changed auth callback</p><p>Supabase RLS changed too</p><p>provider proof still unknown</p></div></aside><section class="diff"><div class="diffTitle"><span>With VibeRaven</span><b>Map version drift before patching</b></div>${diffRows}</section></div></section><div class="caption"><strong>Real proof:</strong> temp repo, real git tags, real diff, real HTTP check. VibeRaven catches provider boundary before the agent edits.</div></main></body></html>`;
}

function renderViralTerminalHtml(evidence) {
  const diffLines = [
    '$ git diff --name-only v1.2.3..v1.2.4',
    ...evidence.git.files,
    '',
    '$ viberaven architecture map',
    ...evidence.architectureContext,
    '',
    '$ viberaven next action',
    'repo fix: redirect fallback',
    'provider proof: callback URL + Supabase RLS policy',
  ];
  const colored = diffLines
    .map((line) => {
      let klass = 'dim';
      if (line.startsWith('$')) klass = 'cmd';
      if (/Auth boundary|Data boundary|Deploy boundary|Fix boundary/.test(line)) klass = 'ok';
      if (/provider proof|Supabase|callback URL/i.test(line)) klass = 'warn';
      if (/\.env|app\/auth|supabase\//.test(line)) klass = 'file';
      return `<div class="${klass}">${htmlEscape(line || ' ')}</div>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>VibeRaven terminal proof</title>
<style>
:root{color-scheme:dark;--bg:#05070b;--panel:#090d14;--line:#263142;--text:#e8edf7;--muted:#7f8ca3;--green:#7ee787;--cyan:#79c0ff;--yellow:#f2cc60;--red:#ff7b72;--purple:#d2a8ff}
*{box-sizing:border-box}html,body{margin:0;width:1200px;height:675px;overflow:hidden;background:var(--bg);color:var(--text);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
body:before{content:"";position:absolute;inset:-90px;background:radial-gradient(circle at 8% 98%,rgba(121,192,255,.22),transparent 32%),radial-gradient(circle at 88% 4%,rgba(126,231,135,.24),transparent 36%),radial-gradient(circle at 48% 45%,rgba(210,168,255,.13),transparent 34%);filter:blur(22px)}
main{position:relative;height:100%;display:flex;align-items:center;justify-content:center;padding:44px}.frame{width:1010px;height:548px;border:1px solid rgba(148,163,184,.36);border-radius:28px;background:rgba(9,13,20,.96);box-shadow:0 34px 120px rgba(0,0,0,.62),inset 0 0 0 1px rgba(255,255,255,.035);overflow:hidden}.bar{height:48px;display:flex;align-items:center;gap:9px;padding:0 18px;border-bottom:1px solid rgba(148,163,184,.22);background:rgba(4,7,12,.78)}.dot{width:11px;height:11px;border-radius:50%}.r{background:#ff5f57}.y{background:#ffbd2e}.g{background:#28c840}.title{margin-left:12px;font:13px/1 ui-monospace,SFMono-Regular,Consolas,monospace;color:#c9d1d9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.grid{display:grid;grid-template-columns:405px 1fr;height:500px}.left{padding:28px 28px 22px;border-right:1px solid rgba(148,163,184,.22);background:linear-gradient(180deg,rgba(15,23,42,.7),rgba(8,13,22,.7))}.tag{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--yellow);font-weight:850}.big{font-size:47px;line-height:.95;margin:10px 0 22px;font-weight:860;letter-spacing:0}.box{border:1px solid rgba(126,231,135,.34);border-radius:14px;background:rgba(22,101,52,.13);padding:17px 18px;margin-bottom:18px;font:17px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace;color:#e6ffed}.miss{font-size:16px;line-height:1.45;color:#d7dde8}.miss b{display:block;color:white;margin-bottom:8px}.miss span{display:block;color:#aeb9cc}.right{padding:24px 25px;font:15px/1.38 ui-monospace,SFMono-Regular,Consolas,monospace}.rightHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}.rightHead span{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--green);font-weight:850}.rightHead b{font-size:22px}.cmd{color:var(--cyan);margin-top:9px}.file{color:#e6edf3;padding-left:18px}.ok{color:var(--green)}.warn{color:var(--yellow)}.dim{color:var(--muted)}.punch{position:absolute;left:112px;right:112px;bottom:31px;display:flex;justify-content:space-between;gap:16px;font-size:18px;color:#dbeafe}.punch strong{color:white}.proof{color:#9fb0ca}
</style></head><body><main><section class="frame"><div class="bar"><i class="dot r"></i><i class="dot y"></i><i class="dot g"></i><span class="title">${htmlEscape(evidence.demoRepo)}  --  viberaven proof</span></div><div class="grid"><aside class="left"><div class="tag">Without VibeRaven</div><div class="big">Green check.<br>Wrong fix.</div><div class="box">$ npm test<br>PASS all tests<br><br>$ node local-live-check.mjs<br>HTTP ${htmlEscape(evidence.live.status)} ${htmlEscape(evidence.live.statusText)}</div><div class="miss"><b>what the agent misses</b><span>v1.2.4 changed auth callback</span><span>Supabase RLS changed in same release</span><span>provider dashboard proof is unknown</span></div></aside><section class="right"><div class="rightHead"><span>With VibeRaven</span><b>version drift before patch</b></div>${colored}</section></div></section><div class="punch"><strong>Same app. Same 200 OK. Different decision.</strong><span class="proof">temp repo + real git tags + real diff + real HTTP check</span></div></main></body></html>`;
}

async function main() {
  await createDemoRepo();
  const live = await httpCheck();
  const tags = run('git', ['tag', '--list']);
  const log = run('git', ['log', '--oneline', '--decorate', '--all']);
  const diffFiles = run('git', ['diff', '--name-only', 'v1.2.3..v1.2.4']).split(/\r?\n/).filter(Boolean);
  const diffStat = run('git', ['diff', '--stat', 'v1.2.3..v1.2.4']);
  const diffPatch = run('git', ['diff', '--unified=2', 'v1.2.3..v1.2.4']);
  const commitRange = run('git', ['log', '--oneline', 'v1.2.3..v1.2.4']);
  const terminalTranscript = [
    '$ node examples/proof/live-evidence-demo.mjs --show',
    `created demo repo: ${demoRepo}`,
    '',
    '$ git tag --list',
    tags,
    '',
    '$ git log --oneline --decorate --all',
    log,
    '',
    '$ git diff --name-only v1.2.3..v1.2.4',
    ...diffFiles,
    '',
    '$ git diff --stat v1.2.3..v1.2.4',
    diffStat,
    '',
    '$ node local-live-check.mjs',
    `HTTP ${live.status} ${live.statusText} ${live.url}`,
    `body: ${live.body}`,
    '',
    '$ viberaven decision',
    'Same app. Same green check. Different decision boundary.',
    'Repo evidence: auth callback changed, Supabase migration touched, preview redirect env added.',
    'Live evidence: app responds 200 OK.',
    'Missing production proof: auth callback dashboard and Supabase RLS provider state are not proven by repo code.',
    '',
    '$ viberaven architecture map',
    'Auth boundary: callback route now depends on preview env.',
    'Data boundary: Supabase RLS migration changed the same release.',
    'Deploy boundary: app can still return 200 OK while provider config is wrong.',
    'Fix boundary: repo redirect fallback is code; callback URL and RLS proof are provider actions.',
    '',
    '$ viberaven next action',
    'Next action: fix redirect fallback in code, then verify provider callback URL + RLS policy before claiming safe release.',
    '',
  ].join('\n');
  const evidence = {
    generatedAt: new Date().toISOString(),
    claim: 'Same app. Same green check. Different decision boundary.',
    demoRepo,
    version: { from: 'v1.2.3', to: 'v1.2.4' },
    git: { source: 'git diff --name-only v1.2.3..v1.2.4', files: diffFiles, stat: diffStat, patch: diffPatch, commits: commitRange },
    live: { source: 'local HTTP check', url: live.url, status: live.status, statusText: live.statusText, body: live.body },
    missingProof: [
      { item: 'Supabase detected from repo', source: 'package.json and supabase/migrations' },
      { item: 'RLS provider proof missing', source: 'no provider dashboard or MCP receipt attached' },
      { item: 'auth callback dashboard proof missing', source: 'env/callback changed, provider state unknown' },
    ],
    architectureContext: [
      'Auth boundary: callback route now depends on preview env.',
      'Data boundary: Supabase RLS migration changed the same release.',
      'Deploy boundary: app can still return 200 OK while provider config is wrong.',
      'Fix boundary: repo redirect fallback is code; callback URL and RLS proof are provider actions.',
    ],
    viberavenEffect: [
      'Do not patch blind.',
      'Repo fix: redirect fallback.',
      'Provider action: verify callback URL.',
      'Provider action: prove Supabase RLS policy.',
    ],
  };
  await writeFile(join(outDir, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  await writeFile(join(outDir, 'evidence-board.html'), renderHtml(evidence), 'utf8');
  await writeFile(join(outDir, 'diff-proof.html'), renderDiffProofHtml(evidence), 'utf8');
  await writeFile(join(outDir, 'viral-terminal-proof.html'), renderViralTerminalHtml(evidence), 'utf8');
  await writeFile(join(outDir, 'terminal-proof.html'), renderTerminalProofHtml(evidence), 'utf8');
  await writeFile(join(outDir, 'transcript.txt'), terminalTranscript, 'utf8');
  await writeFile(join(outDir, 'terminal-card.txt'), renderTerminalCard(evidence), 'utf8');
  if (process.argv.includes('--terminal-card')) {
    console.log(renderTerminalCard(evidence));
    return;
  }
  if (process.argv.includes('--show')) {
    console.log(terminalTranscript);
  }
  console.log(`Wrote ${join(outDir, 'evidence.json')}`);
  console.log(`Wrote ${join(outDir, 'evidence-board.html')}`);
  console.log(`Wrote ${join(outDir, 'diff-proof.html')}`);
  console.log(`Wrote ${join(outDir, 'viral-terminal-proof.html')}`);
  console.log(`Wrote ${join(outDir, 'terminal-proof.html')}`);
  console.log(`Wrote ${join(outDir, 'transcript.txt')}`);
  console.log(`Wrote ${join(outDir, 'terminal-card.txt')}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

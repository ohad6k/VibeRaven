#!/usr/bin/env node
import { createServer } from 'node:http';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const outDir = join(root, '.tmp', 'live-evidence-demo');
const demoRepo = join(outDir, 'repo');

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
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/plain' });
    response.end('ok');
  });
  await new Promise((resolveServer) => server.listen(0, '127.0.0.1', resolveServer));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Unexpected server address.');
  const url = `http://127.0.0.1:${address.port}/`;
  try {
    const response = await fetch(url);
    return { url, status: response.status, statusText: response.statusText || 'OK', body: await response.text() };
  } finally {
    await new Promise((resolveClose) => server.close(resolveClose));
  }
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

async function main() {
  await createDemoRepo();
  const live = await httpCheck();
  const diffFiles = run('git', ['diff', '--name-only', 'v1.2.3..v1.2.4']).split(/\r?\n/).filter(Boolean);
  const diffStat = run('git', ['diff', '--stat', 'v1.2.3..v1.2.4']);
  const commitRange = run('git', ['log', '--oneline', 'v1.2.3..v1.2.4']);
  const evidence = {
    generatedAt: new Date().toISOString(),
    claim: 'Same app. Same green check. Different decision boundary.',
    version: { from: 'v1.2.3', to: 'v1.2.4' },
    git: { source: 'git diff --name-only v1.2.3..v1.2.4', files: diffFiles, stat: diffStat, commits: commitRange },
    live: { source: 'local HTTP check', url: live.url, status: live.status, statusText: live.statusText, body: live.body },
    missingProof: [
      { item: 'Supabase detected from repo', source: 'package.json and supabase/migrations' },
      { item: 'RLS provider proof missing', source: 'no provider dashboard or MCP receipt attached' },
      { item: 'auth callback dashboard proof missing', source: 'env/callback changed, provider state unknown' },
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
  await writeFile(join(outDir, 'transcript.txt'), [
    '$ git diff --name-only v1.2.3..v1.2.4',
    ...diffFiles,
    '',
    '$ node local-live-check.js',
    `HTTP ${live.status} ${live.statusText} ${live.url}`,
    '',
    '$ viberaven decision',
    'Do not patch blind.',
    'Repo fix: redirect fallback.',
    'Provider action: verify callback URL + Supabase RLS policy.',
    '',
  ].join('\n'), 'utf8');
  console.log(`Wrote ${join(outDir, 'evidence.json')}`);
  console.log(`Wrote ${join(outDir, 'evidence-board.html')}`);
  console.log(`Wrote ${join(outDir, 'transcript.txt')}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

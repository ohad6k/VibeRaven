// Renders a sample launch report with bundled station.css (editorial skin).
// Usage: node scripts/demo-report.mjs [--open]
import * as esbuild from 'esbuild';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

import { spawnSync } from 'node:child_process';
spawnSync(process.execPath, ['scripts/sync-report-assets.mjs'], { cwd: root, stdio: 'inherit' });

const reportBundle = await esbuild.build({
  entryPoints: [join(root, 'src', 'report', 'reportHtml.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  target: 'node20'
});
const reportMod = await import(
  'data:text/javascript;base64,' + Buffer.from(reportBundle.outputFiles[0].text).toString('base64')
);

const assetsSource = join(root, 'assets', 'report');
const outDir = join(root, 'demo-report-out');
const reportAssetsDir = join(outDir, 'report');
await mkdir(join(reportAssetsDir, 'assets'), { recursive: true });

for (const rel of [
  'station.css',
  'report-cli.css',
  'assets/viberaven-logo.png',
  'assets/provider-authjs.svg',
  'assets/provider-aws.svg',
  'assets/provider-logrocket.svg'
]) {
  await copyFile(join(assetsSource, rel), join(reportAssetsDir, rel));
}

function mission(key, label, providerLabel, readiness, checks) {
  return {
    key,
    label,
    readinessPercent: readiness,
    criticalCount: checks.filter((c) => c.status !== 'passed').length,
    providerMissions: [
      {
        key,
        provider: providerLabel.toLowerCase(),
        providerLabel,
        area: key,
        promptSubject: providerLabel,
        readinessPercent: readiness,
        checks: checks.map((c, i) => ({
          id: `${key}-${i}`,
          label: c.label,
          providerKey: key,
          providerLabel,
          area: key,
          evidenceClass: 'missing-repo-fix',
          status: c.status,
          evidence: c.evidence ? [c.evidence] : [],
          promptHint: 'Fix this.'
        }))
      }
    ]
  };
}

const artifact = {
  version: 1,
  scannedAt: new Date().toISOString(),
  workspacePath: 'C:/demo/my-vibe-app',
  score: 62,
  scoreLabel: 'At risk',
  summary: 'Frontend and auth are wired, but monitoring and error handling need work before launch.',
  archetype: 'saas-mvp',
  productionCorePercent: 70,
  accountEmail: 'demo@viberaven.dev',
  plan: 'pro',
  usageLine: '6/50 scans this month',
  gaps: [
    {
      id: 'gap-auth-1',
      category: 'SECURITY & AUTH',
      severity: 'critical',
      title: 'Protect API routes with middleware',
      detail: 'Public API routes are not guarded by session middleware.',
      copyPrompt: 'Add auth middleware to protect API routes...',
      toolSuggestions: [],
      mcpSuggestion: null,
      primaryMapCategory: 'auth',
      affectedMapCategories: []
    }
  ],
  missionGraph: {
    areas: [
      mission('frontend', 'Frontend', 'React', 100, [{ label: 'Build config present', status: 'passed' }]),
      mission('auth', 'Auth', 'Auth.js', 55, [
        { label: 'Auth config present', status: 'passed', evidence: 'auth.config.ts' },
        { label: 'Protected routes', status: 'missing', evidence: 'No middleware guard found' }
      ]),
      mission('database', 'Database', 'Supabase', 50, [
        { label: 'Client configured', status: 'passed' },
        { label: 'RLS policies', status: 'needs-connection', evidence: 'Verify in dashboard' }
      ])
    ],
    byArea: {},
    byProvider: {},
    repositoryEvidence: { env: [], security: [] }
  },
  stackWiring: { items: [], byKey: {} },
  providerRegistry: {
    version: 'demo',
    source: 'bundled',
    generatedAt: new Date().toISOString(),
    status: 'fresh',
    providers: []
  },
  providerOptions: {
    auth: [
      { provider: 'authjs', label: 'Auth.js' },
      { provider: 'clerk', label: 'Clerk' }
    ]
  },
  selectedProviders: { auth: 'authjs' }
};

const html = reportMod.generateReportHtml(artifact);
const reportPath = join(outDir, 'report.html');
await writeFile(reportPath, html, 'utf-8');
console.log('Wrote', reportPath);
console.log('Open report.html — requires report/station.css beside it (editorial extension UI).');

if (process.argv.includes('--open')) {
  const cmd = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', reportPath] : [reportPath];
  spawn(cmd, args, { stdio: 'ignore', shell: process.platform === 'win32' });
}

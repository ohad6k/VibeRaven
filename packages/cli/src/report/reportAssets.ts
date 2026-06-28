import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** Directory containing station.css, report-cli.css, and assets/ for bundled CLI reports. */
export function getBundledReportAssetsDir(): string {
  const base = __dirname;
  const candidates = [
    join(base, 'report'),
    join(base, '..', 'assets', 'report'),
    join(base, '..', '..', 'assets', 'report'),
    join(process.cwd(), 'packages', 'cli', 'assets', 'report'),
    join(process.cwd(), 'assets', 'report')
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, 'station.css'))) {
      return dir;
    }
  }
  throw new Error('Report assets missing. Run `npm run sync-report-assets` and `npm run build` in packages/cli.');
}

export const REPORT_ASSET_FILES = [
  'station.css',
  'station.js',
  'report-cli.css',
  'assets/viberaven-logo.png',
  'assets/viberaven-favicon.png',
  'assets/viberaven-mascot.png',
  'assets/provider-authjs.svg',
  'assets/provider-aws.svg',
  'assets/provider-logrocket.svg'
] as const;

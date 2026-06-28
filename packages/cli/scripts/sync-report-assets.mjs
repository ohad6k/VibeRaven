/**
 * Copies Mission Map editorial assets from repo media/ into packages/cli/assets/report/
 * for static CLI launch reports (.viberaven/report.html).
 */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(cliRoot, '..', '..');
const outDir = join(cliRoot, 'assets', 'report');
const assetsOut = join(outDir, 'assets');

const sources = {
  stationCss: join(repoRoot, 'media', 'station.css'),
  stationJs: join(repoRoot, 'media', 'station.js'),
  packagedStationCss: join(outDir, 'station.css'),
  packagedStationJs: join(outDir, 'station.js'),
  brandLogoCandidates: [
    join(cliRoot, 'assets', 'report', 'assets', 'viberaven-logo.png'),
    join(repoRoot, 'media', 'viberaven-logo.png'),
    join(repoRoot, 'media', 'ravenlogo.png')
  ],
  providerAssetsDir: join(cliRoot, 'assets', 'report', 'assets')
};

await mkdir(assetsOut, { recursive: true });

const stationCssSource = existsSync(sources.stationCss) ? sources.stationCss : sources.packagedStationCss;
const stationJsSource = existsSync(sources.stationJs) ? sources.stationJs : sources.packagedStationJs;

let stationCss = await readFile(stationCssSource, 'utf-8');
stationCss = stationCss.replace(/url\("(?:viberaven-logo|ravenlogo)\.png"\)/g, 'url("assets/viberaven-logo.png")');
await writeFile(join(outDir, 'station.css'), stationCss, 'utf-8');
if (stationJsSource !== join(outDir, 'station.js')) {
  await copyFile(stationJsSource, join(outDir, 'station.js'));
}

const brandLogo = sources.brandLogoCandidates.find((candidate) => existsSync(candidate));
if (!brandLogo) {
  throw new Error('Missing VibeRaven report logo asset.');
}
const brandLogoOut = join(assetsOut, 'viberaven-logo.png');
if (brandLogo !== brandLogoOut) {
  await copyFile(brandLogo, brandLogoOut);
}
for (const file of ['viberaven-favicon.png', 'viberaven-mascot.png', 'provider-authjs.svg', 'provider-aws.svg', 'provider-logrocket.svg']) {
  const assetSource = join(sources.providerAssetsDir, file);
  const assetOut = join(assetsOut, file);

  if (assetSource !== assetOut) {
    await copyFile(assetSource, assetOut);
  }
}

console.log('Synced report assets to', outDir);

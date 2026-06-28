import type { LocalUiState } from '../types';
import { localUiClientJs } from './appClient';
import { localUiCss } from './appCss';

function escapeJsonForHtml(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function renderLocalUiHtml(state: LocalUiState): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#050816" />
    <title>VibeRaven</title>
    <link rel="icon" type="image/png" sizes="64x64" href="/report/assets/viberaven-favicon.png" />
    <link rel="shortcut icon" type="image/png" href="/report/assets/viberaven-favicon.png" />
    <link rel="apple-touch-icon" href="/report/assets/viberaven-mascot.png" />
    <style>${localUiCss}</style>
  </head>
  <body>
    <div id="vr-app" class="vr-app" aria-label="VibeRaven"></div>
    <script id="vr-state" type="application/json">${escapeJsonForHtml(state)}</script>
    <script>${localUiClientJs}</script>
  </body>
</html>`;
}

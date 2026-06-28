type StationBackgroundKind = 'landscape' | 'portrait' | 'legacy';

export type StationHtmlOptions = {
  /** `panel` = bottom panel (full width); default = sidebar width */
  surface?: 'panel' | 'sidebar';
  /** Visual skin used by the Station webview. */
  skin?: 'editorial' | 'classic';
  /** Optional logo image used in the Studio rail. */
  logoImageUri?: string;
  /** From `Webview.cspSource` - allows CSS/JS (see `resolveStationCspSource` fallback) */
  cspSource: string;
  /** Optional `asWebviewUri` to a mood image under `media/` */
  backgroundImageUri?: string;
  /** Tunes CSS (`landscape` for wide bottom panel art, `portrait` for vertical, `legacy` for old `station-bg.png`) */
  backgroundKind?: StationBackgroundKind;
};

function escapeHtmlAttrValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function buildCsp(nonce: string, cspSource: string): string {
  // Use webview.cspSource so bundled CSS/JS origins match; a single asWebviewUri string often fails the strict check.
  // fonts.googleapis.com / fonts.gstatic.com: match landing typography inside the webview.
  return `default-src 'none'; style-src ${cspSource} 'unsafe-inline' https://fonts.googleapis.com; script-src 'nonce-${nonce}' ${cspSource}; img-src ${cspSource} https: data:; font-src ${cspSource} https://fonts.gstatic.com https: data:; connect-src 'none';`;
}

/** Minimal HTML if `resolveWebviewView` throws - still styled so you see the error. */
export function getStationViewErrorHtml(message: string): string {
  const safe = String(message)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<!DOCTYPE html>
  <html lang="en"><head><meta charset="UTF-8" /><title>Station</title></head>
  <body style="margin:0;padding:14px 16px;font:14px/1.5 system-ui;background:#0a0a0a;color:#e8e4dc">
    <p style="margin:0 0 6px;font-weight:700;letter-spacing:0.04em;color:#d4af37">VibeRaven</p>
    <p style="margin:0;opacity:0.85">The panel could not load. Check the <strong>Extension Host</strong> output for details.</p>
    <pre style="margin:10px 0 0;white-space:pre-wrap;word-break:break-word;opacity:0.75;font-size:13px">${safe}</pre>
  </body></html>`;
}

export function getStationHtml(
  nonce: string,
  cssUri: string,
  jsUri: string,
  options: StationHtmlOptions
): string {
  const surface = options.surface ?? 'sidebar';
  const skin = options.skin ?? 'editorial';
  const csp = escapeHtmlAttrValue(buildCsp(nonce, options.cspSource));
  const logoHtml = options.logoImageUri
    ? `<img class="studio-top-rail__logo" src="${escapeHtmlAttrValue(options.logoImageUri)}" alt="" width="32" height="32" />`
    : '';
  const bgData = options.backgroundImageUri
    ? ` data-bg-uri="${escapeHtmlAttrValue(encodeURIComponent(options.backgroundImageUri))}"`
    : '';
  const bgKindData =
    options.backgroundImageUri && options.backgroundKind
      ? ` data-bg-kind="${options.backgroundKind}"`
      : '';
  return `<!DOCTYPE html>
  <html lang="en" data-surface="${surface}" data-skin="${skin}"${bgData}${bgKindData}>
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="Content-Security-Policy" content="${csp}">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&amp;family=JetBrains+Mono:wght@400;600&amp;display=swap"
      />
      <link rel="stylesheet" href="${cssUri}">
      <title>VibeRaven</title>
    </head>
    <body data-surface="${surface}">
      <div class="station-app">
        <!-- Session lives outside station-pre-mc so it stays visible during Mission Control takeover (scan/results). -->
        <div data-section="session" class="mc-session cockpit-session station-account-strip" aria-live="polite"></div>
        <div id="station-pre-mc" class="station-pre-mc" aria-label="Station setup and workspace scan">
        <div class="station-cockpit">
        <header class="cockpit-hero" role="banner">
          <div class="cockpit-hero__text">
            <p class="cockpit-hero__brand" id="station-brand">VIBERAVEN</p>
            <h1 class="cockpit-hero__title">Mission Map</h1>
            <p class="cockpit-hero__lead">
              <strong>Scan Project</strong> reads your workspace and opens a full-stack cockpit with stack choices, config previews, gap evidence, and verification steps.
            </p>
            <p class="cockpit-hero__whatsnew" role="note">
              <strong>VibeRaven</strong> turns each section into a guided setup flow: choose the stack, copy the config path, apply the prompt, then rescan for repo evidence.
            </p>
          </div>
        </header>

        <section class="command-deck" aria-label="Station scan">
          <h2 class="command-deck__label">Project scan</h2>
          <p class="command-deck__hint">Open the cockpit map, choose stack cards, preview config, and verify each section from repo evidence.</p>
          <p id="prompt-form-tip" class="sr-only">Submit runs a full VibeRaven scan on this workspace.</p>
          <form id="prompt-form" class="command-deck__form" aria-describedby="prompt-form-tip" title="Run VibeRaven scan on this workspace">
            <input type="hidden" id="prompt-input" name="prompt" value="" autocomplete="off" />
            <div class="command-deck__cta">
              <button type="submit" class="command-deck__run" title="Scan this workspace and open Mission Map">
                <span class="command-deck__run-text">Scan Project</span>
                <span class="command-deck__run-sub">Open cockpit map with stack controls</span>
                <span class="command-deck__run-glow" aria-hidden="true"></span>
              </button>
            </div>
          </form>
        </section>
        </div>
        </div>

        <div class="station-stage" role="region" aria-label="Station scan and Mission Control">
          <div id="mc-idle" class="mc-state mc-state--idle">
            <div class="mc-idle__hero">
              <p class="mc-idle__tagline">Ready to scan your project</p>
              <p class="mc-idle__sub">Station reads your repo and maps every gap between now and production.</p>
            </div>
          </div>

          <div id="mc-scanning" class="mc-state mc-state--scanning" role="status" aria-live="polite" hidden>
            <div class="mc-scan-loader" aria-hidden="true">
              <span class="mc-scan-loader__frame">
                <span class="mc-scan-loader__grid"></span>
                <span class="mc-scan-loader__sweep"></span>
                <span class="mc-scan-loader__spark mc-scan-loader__spark--a"></span>
                <span class="mc-scan-loader__spark mc-scan-loader__spark--b"></span>
              </span>
              <span class="mc-scan-loader__rows">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
            <div class="mc-scan__readout">
              <p id="mc-scan-label" class="mc-scan__label">Reading your files...</p>
              <div class="mc-bar-track">
                <div id="mc-bar-fill" class="mc-bar-fill" role="progressbar" aria-label="Scan progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" style="width:0%"></div>
              </div>
            </div>
          </div>

          <div id="mc-results" class="mc-state mc-state--results" hidden role="region" aria-labelledby="mc-results-title">
            <h2 id="mc-results-title" class="sr-only">Mission Control results</h2>
            <div id="mc-error" class="mc-error" hidden role="alert" aria-live="assertive"></div>
            <div class="studio-shell" aria-label="VibeRaven Studio cockpit">
              <header class="studio-top-rail" aria-label="Studio status">
                ${logoHtml}
                <div class="studio-top-rail__brand">
                  <span class="studio-top-rail__wordmark">VIBERAVEN</span>
                  <span class="studio-top-rail__label">MISSION MAP</span>
                </div>
              </header>

              <div class="studio-workspace">
                <nav class="studio-nav-rail" aria-label="Studio areas">
                  <span class="studio-nav-rail__item studio-nav-rail__item--active" aria-label="Architecture">ARCH</span>
                  <span class="studio-nav-rail__item" aria-label="Flow">FLOW</span>
                  <span class="studio-nav-rail__item" aria-label="Terminal">TERM</span>
                  <span class="studio-nav-rail__item" aria-label="Security">SEC</span>
                </nav>

                <main id="studio-map-canvas" class="studio-map-canvas" aria-label="Interactive full-stack system map">
                  <div class="mc-score-row mc-score-row--v3 studio-score-row">
                    <div class="mc-score-headline" aria-live="polite">
                      <span class="mc-score-strip__title">Production readiness</span>
                      <span id="mc-score-pct" class="mc-score-pct mc3-score-pct">-</span>
                      <span id="mc-score-label" class="mc-score-label mc3-score-label">production-ready</span>
                    </div>
                  </div>
                  <div class="mc-bar-track mc-bar-track--results mc3-results-track studio-readiness-track">
                    <div id="mc-results-bar" class="mc-bar-fill mc3-results-fill" role="progressbar" aria-label="Production readiness score" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" style="width:0%"></div>
                  </div>
                  <div class="mc-status-bundle studio-status-bundle">
                    <p class="mc-status-line__eyebrow">Scan summary</p>
                    <p id="mc-status-line" class="mc-status-line mc-status-line--v3"></p>
                  </div>
                  <div id="mc-plan-pills" class="mc3-plan-pills" hidden aria-label="Selected implementation paths"></div>
                  <p id="mc-score-hint" class="mc-score-hint sr-only"></p>
                  <div id="mc-announce" class="sr-only" aria-live="polite" aria-relevant="additions text"></div>
                  <div id="mc-production-map" class="mc-production-map studio-production-map" hidden aria-label="Production readiness map"></div>
                  <div id="mc-scan-insights" class="mc-scan-insights" hidden aria-label="Scanner-driven suggestions"></div>
                  <div id="mc-groups" class="mc-groups" role="group" aria-label="Production gaps and actions"></div>
                  <ul id="mc-quick-wins" class="mc-quick-wins" hidden></ul>
                </main>

                <aside id="studio-setup-panel" class="studio-setup-panel" aria-label="Selected section setup">
                  <div class="studio-setup-panel__empty">
                    <p class="studio-setup-panel__eyebrow">No section selected</p>
                    <p class="studio-setup-panel__title">Choose a node on the map</p>
                  </div>
                </aside>
              </div>
              <div id="mcp-helper-modal" class="mcp-helper-modal" hidden></div>

              <details class="mc-spec-notes" id="mc-spec-notes">
                <summary class="mc-spec-notes__toggle">SPEC / doc follow-ups from this scan</summary>
                <p class="mc-spec-notes__intro">
                  <strong>What this is:</strong> a separate list from the gaps above. Each line is something Station thinks should be <strong>reflected in your written spec</strong>.
                </p>
                <div data-section="spec-update" class="mc-spec-notes__body"></div>
              </details>
              <p id="mc-last-scanned" class="mc-last-scanned mc-last-scanned--footer" aria-live="polite"></p>
            </div>
          </div>
        </div>

        <div id="mc3-prompt-modal" class="mc3-prompt-modal" hidden>
          <div class="mc3-prompt-modal__backdrop" data-station-action="mc3-close-prompt-modal" aria-hidden="true"></div>
          <div
            class="mc3-prompt-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mc3-prompt-modal-title"
            tabindex="-1"
          >
            <div class="mc3-prompt-modal__head">
              <h2 id="mc3-prompt-modal-title" class="mc3-prompt-modal__title">Agent prompt</h2>
              <button type="button" class="mc3-prompt-modal__close" data-station-action="mc3-close-prompt-modal" aria-label="Close">
                ×
              </button>
            </div>
            <pre id="mc3-prompt-modal-body" class="mc3-prompt-modal__pre"></pre>
            <div class="mc3-prompt-modal__foot">
              <button
                type="button"
                class="mc3-prompt-modal__copy"
                data-station-action="mc3-modal-copy-prompt"
                data-prompt=""
              >
                Copy prompt
              </button>
            </div>
          </div>
        </div>
      </div>
      <script nonce="${nonce}" src="${jsUri}"></script>
    </body>
  </html>`;
}

export function renderLocalUiHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VibeRaven Local UI</title>
  <style>
    :root {
      --canvas: #fbfbfa;
      --surface: #ffffff;
      --surface-soft: #f7f8f8;
      --ink: #111417;
      --muted: #667085;
      --muted-strong: #475467;
      --line: #e4e7ec;
      --line-strong: #d0d5dd;
      --orange: #ff7a00;
      --orange-soft: #fff2e5;
      --green: #24b26b;
      --green-soft: #e9f8f1;
      --red: #e11d1d;
      --red-soft: #fdecec;
      --black-button: #071018;
      --radius: 8px;
      color-scheme: light;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    html, body { min-height: 100%; }
    body {
      margin: 0;
      background: var(--canvas);
      color: var(--ink);
      min-height: 100dvh;
      letter-spacing: 0;
    }
    button, input, textarea {
      font: inherit;
      letter-spacing: 0;
    }
    button {
      border: 1px solid var(--line);
      background: var(--surface);
      color: var(--ink);
      border-radius: var(--radius);
      padding: 9px 12px;
      cursor: pointer;
      transition: background 140ms ease, border-color 140ms ease, transform 120ms ease;
    }
    button:hover { background: var(--surface-soft); border-color: var(--line-strong); }
    button:active { transform: translateY(1px); }
    button.primary {
      background: var(--black-button);
      border-color: var(--black-button);
      color: #ffffff;
      font-weight: 650;
    }
    button.primary:hover { background: #111a22; }
    .topbar {
      height: 58px;
      border-bottom: 1px solid var(--line);
      background: rgba(251, 251, 250, 0.96);
      display: grid;
      grid-template-columns: minmax(260px, 1fr) minmax(220px, 300px) auto;
      gap: 18px;
      align-items: center;
      padding: 0 20px;
      position: sticky;
      top: 0;
    }
    .brand-lockup {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }
    .brand-lockup strong {
      font-size: 20px;
      line-height: 1;
      white-space: nowrap;
    }
    .raven-mark {
      width: 36px;
      height: 30px;
      display: inline-block;
      border-radius: 65% 35% 50% 45%;
      background: var(--black-button);
      position: relative;
      transform: skewX(-18deg) rotate(-8deg);
    }
    .raven-mark::after {
      content: "";
      position: absolute;
      right: -7px;
      bottom: 4px;
      width: 18px;
      height: 5px;
      border-radius: 999px;
      background: var(--orange);
      transform: rotate(-28deg);
    }
    .tagline {
      border: 1px solid var(--line);
      border-radius: 7px;
      padding: 8px 12px;
      color: var(--ink);
      font-size: 13px;
      font-weight: 650;
      white-space: nowrap;
      background: var(--surface);
    }
    .project-picker {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-width: 0;
      width: 100%;
      font-weight: 650;
      border: 1px solid var(--line);
      background: var(--surface);
      color: var(--ink);
      border-radius: var(--radius);
      padding: 9px 12px;
    }
    .project-picker::before {
      content: "";
      width: 15px;
      height: 12px;
      border: 1.6px solid currentColor;
      border-radius: 2px;
      display: inline-block;
      box-shadow: inset 0 4px 0 rgba(17, 20, 23, 0.06);
    }
    .project-picker::after {
      content: "";
      width: 7px;
      height: 7px;
      border-right: 1.5px solid currentColor;
      border-bottom: 1.5px solid currentColor;
      transform: rotate(45deg) translateY(-2px);
      opacity: 0.7;
    }
    .project-picker span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      text-align: left;
    }
    .top-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: flex-end;
    }
    .status-button {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      white-space: nowrap;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: var(--muted);
      display: inline-block;
    }
    .dot.ok { background: var(--green); }
    .dot.warn { background: var(--orange); }
    .dot.bad { background: var(--red); }
    .icon-button {
      width: 38px;
      height: 38px;
      padding: 0;
      display: grid;
      place-items: center;
      color: var(--muted-strong);
    }
    .icon-button::before {
      content: "";
      width: 17px;
      height: 17px;
      border: 2px solid currentColor;
      border-radius: 999px;
      box-shadow: 0 -8px 0 -6px currentColor, 0 8px 0 -6px currentColor, -8px 0 0 -6px currentColor, 8px 0 0 -6px currentColor;
    }
    .verify-button {
      min-width: 132px;
      font-size: 15px;
    }
    .shell {
      display: grid;
      grid-template-columns: 296px minmax(560px, 1fr) 360px;
      min-height: calc(100dvh - 96px);
    }
    .rail {
      border-right: 1px solid var(--line);
      padding: 18px 18px 26px;
      background: var(--canvas);
      overflow: auto;
    }
    .rail-title {
      margin: 0 0 10px;
      color: var(--muted-strong);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .search-box {
      height: 38px;
      border: 1px solid var(--line);
      background: var(--surface);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 0 10px;
      margin-bottom: 12px;
    }
    .search-box:focus-within {
      border-color: var(--orange);
      box-shadow: 0 0 0 3px rgba(255, 122, 0, 0.16);
    }
    .search-box span {
      width: 14px;
      height: 14px;
      border: 1.6px solid var(--muted);
      border-radius: 999px;
      position: relative;
      flex: 0 0 auto;
    }
    .search-box span::after {
      content: "";
      position: absolute;
      right: -5px;
      bottom: -4px;
      width: 6px;
      height: 1.6px;
      background: var(--muted);
      transform: rotate(45deg);
      border-radius: 999px;
    }
    .search-box input {
      border: 0;
      outline: 0;
      min-width: 0;
      width: 100%;
      color: var(--ink);
      background: transparent;
      font-size: 13px;
    }
    .provider-list {
      display: grid;
      gap: 8px;
    }
    .provider-button {
      width: 100%;
      min-height: 58px;
      display: grid;
      grid-template-columns: 34px minmax(0, 1fr) 8px 12px;
      gap: 10px;
      align-items: center;
      text-align: left;
      padding: 10px 10px;
      background: var(--surface);
      border-color: var(--line);
    }
    .provider-button.is-selected {
      border-color: var(--orange);
      box-shadow: inset 0 0 0 1px rgba(255, 122, 0, 0.08);
    }
    .provider-button::after {
      content: "";
      width: 7px;
      height: 7px;
      border-right: 1.5px solid var(--muted-strong);
      border-bottom: 1.5px solid var(--muted-strong);
      transform: rotate(-45deg);
    }
    .provider-icon {
      width: 32px;
      height: 32px;
      display: grid;
      place-items: center;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--surface);
      color: var(--ink);
      overflow: hidden;
    }
    .provider-icon svg, .provider-icon img {
      width: 22px;
      height: 22px;
      display: block;
    }
    .provider-name { min-width: 0; }
    .provider-name strong {
      display: block;
      font-size: 13px;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .state {
      display: inline-flex;
      margin-top: 5px;
      font-size: 12px;
      line-height: 1;
      color: var(--muted);
      font-weight: 650;
    }
    .provider-dot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: var(--muted);
    }
    .state[data-state="needs_repo_fix"], .state[data-state="connect_live"], .path-state[data-state="needs_fix"], .path-state[data-state="needs_connect"] { color: var(--orange); }
    .state[data-state="repo_evidence_found"], .state[data-state="live_verified"], .path-state[data-state="ready"] { color: var(--green); }
    .state[data-state="blocked"], .state[data-state="error"], .path-state[data-state="blocked"] { color: var(--red); }
    .provider-dot[data-state="needs_repo_fix"], .provider-dot[data-state="connect_live"] { background: var(--orange); }
    .provider-dot[data-state="repo_evidence_found"], .provider-dot[data-state="live_verified"] { background: var(--green); }
    .provider-dot[data-state="blocked"], .provider-dot[data-state="error"] { background: var(--red); }
    .run-local-card {
      margin-top: 14px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--surface);
      padding: 14px;
    }
    .run-local-card h2 {
      margin: 0 0 6px;
      font-size: 13px;
    }
    .run-local-card p {
      margin: 0 0 12px;
      color: var(--muted-strong);
      font-size: 13px;
      line-height: 1.35;
    }
    .command-pill {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      background: var(--black-button);
      color: #ffffff;
      border-radius: 7px;
      padding: 11px 12px;
      font: 13px/1.2 ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
      overflow: hidden;
    }
    .command-pill span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .main {
      padding: 26px 28px 34px;
      overflow: auto;
      background: var(--canvas);
    }
    .provider-header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 18px;
      align-items: center;
      margin-bottom: 18px;
    }
    .provider-heading {
      display: flex;
      gap: 16px;
      align-items: center;
      min-width: 0;
    }
    .provider-heading .provider-icon {
      width: 44px;
      height: 44px;
      border: 0;
      background: transparent;
    }
    .provider-heading h1 {
      margin: 0;
      font-size: 22px;
      line-height: 1.15;
      font-weight: 750;
    }
    .provider-heading p {
      margin: 5px 0 0;
      color: var(--muted-strong);
      font-size: 13px;
      line-height: 1.35;
    }
    .secondary-action {
      font-weight: 650;
      white-space: nowrap;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--surface);
      color: var(--muted-strong);
      padding: 9px 12px;
      font-size: 13px;
    }
    .path-list {
      display: grid;
      gap: 0;
      position: relative;
      padding-left: 34px;
    }
    .path-list::before {
      content: "";
      position: absolute;
      left: 14px;
      top: 26px;
      bottom: 26px;
      width: 1px;
      background: var(--line-strong);
    }
    .path-row {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      padding: 13px 16px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 14px;
      position: relative;
      margin-bottom: 10px;
    }
    .path-row::before {
      content: "";
      position: absolute;
      left: -31px;
      top: 18px;
      width: 22px;
      height: 22px;
      border: 1px solid var(--line-strong);
      border-radius: 999px;
      background: var(--surface);
    }
    .path-row::after {
      content: "";
      position: absolute;
      left: -23px;
      top: 26px;
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: var(--muted);
    }
    .path-row.is-focused {
      border-color: var(--line-strong);
      box-shadow: 0 10px 22px rgba(17, 20, 23, 0.04);
    }
    .path-row.is-focused::before {
      border-color: var(--orange);
      background: var(--orange-soft);
    }
    .path-row.is-focused::after { background: var(--orange); }
    .path-row strong {
      font-size: 14px;
      line-height: 1.25;
    }
    .path-row p {
      margin: 5px 0 0;
      color: var(--muted-strong);
      font-size: 13px;
      line-height: 1.4;
    }
    .path-state {
      align-self: start;
      border: 1px solid currentColor;
      border-radius: 999px;
      padding: 5px 10px;
      font-size: 12px;
      line-height: 1;
      color: var(--muted);
      white-space: nowrap;
      background: var(--surface);
    }
    .path-state[data-state="ready"] { background: var(--green-soft); }
    .path-state[data-state="needs_fix"], .path-state[data-state="needs_connect"] { background: var(--orange-soft); }
    .path-state[data-state="blocked"] { background: var(--red-soft); }
    .next-fix {
      margin: 8px 0 0 34px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--surface);
      padding: 16px;
    }
    .next-fix h2 {
      margin: 0 0 14px;
      font-size: 14px;
      line-height: 1.2;
    }
    .fix-grid {
      display: grid;
      gap: 0;
    }
    .fix-section {
      display: grid;
      grid-template-columns: 34px minmax(0, 1fr);
      gap: 12px;
      padding: 13px 0;
      border-top: 1px solid var(--line);
    }
    .fix-section:first-child { border-top: 0; padding-top: 0; }
    .fix-section:last-child { padding-bottom: 0; }
    .fix-symbol {
      width: 26px;
      height: 26px;
      border-radius: 999px;
      border: 1px solid var(--line);
      display: grid;
      place-items: center;
      color: var(--muted-strong);
      background: var(--surface-soft);
      font-size: 12px;
      font-weight: 800;
    }
    .fix-section h3 {
      margin: 0 0 6px;
      font-size: 13px;
      line-height: 1.2;
    }
    .fix-section p {
      margin: 0;
      color: var(--muted-strong);
      font-size: 13px;
      line-height: 1.45;
    }
    .drawer {
      border-left: 1px solid var(--line);
      padding: 24px 18px;
      background: var(--surface);
      overflow: auto;
    }
    .drawer h2 {
      margin: 0;
      font-size: 17px;
      line-height: 1.2;
    }
    .drawer p {
      margin: 8px 0 16px;
      color: var(--muted-strong);
      font-size: 13px;
      line-height: 1.4;
    }
    .prompt-box {
      width: 100%;
      min-height: 330px;
      resize: vertical;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 14px;
      background: var(--surface);
      color: var(--muted-strong);
      font: 13px/1.7 ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
    }
    .drawer-actions {
      display: grid;
      gap: 9px;
      margin-top: 12px;
    }
    .drawer-actions button {
      min-height: 42px;
      font-weight: 650;
    }
    .tip {
      margin-top: 16px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 12px;
      color: var(--muted-strong);
      font-size: 13px;
      line-height: 1.4;
      background: var(--surface);
    }
    .empty {
      color: var(--muted);
      border: 1px dashed var(--line-strong);
      border-radius: var(--radius);
      padding: 14px;
      background: var(--surface);
      font-size: 13px;
      line-height: 1.45;
    }
    .status-footer {
      min-height: 38px;
      border-top: 1px solid var(--line);
      background: var(--surface);
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 16px;
      padding: 7px 20px;
      color: var(--muted-strong);
      font-size: 13px;
    }
    .footer-left, .footer-right {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }
    .footer-command {
      border: 1px solid var(--line);
      border-radius: 7px;
      padding: 7px 12px;
      background: var(--surface);
      color: var(--ink);
      font: 13px/1 ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 360px;
    }
    .gate-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--red);
      font-weight: 650;
      white-space: nowrap;
    }
    .gate-status[data-status="clear"] { color: var(--green); }
    @media (max-width: 1240px) {
      .topbar { grid-template-columns: minmax(220px, 1fr) auto; }
      .project-picker { display: none; }
      .shell { grid-template-columns: 260px minmax(0, 1fr); }
      .drawer { grid-column: 1 / -1; border-left: 0; border-top: 1px solid var(--line); }
    }
    @media (max-width: 820px) {
      .topbar {
        height: auto;
        min-height: 58px;
        grid-template-columns: 1fr;
        padding: 12px;
        gap: 10px;
      }
      .brand-lockup { flex-wrap: wrap; }
      .top-actions {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 38px 1fr;
      }
      .shell { grid-template-columns: 1fr; min-height: auto; }
      .rail { border-right: 0; border-bottom: 1px solid var(--line); max-height: 330px; }
      .main { padding: 20px 14px 28px; }
      .provider-header { grid-template-columns: 1fr; }
      .path-row { grid-template-columns: 1fr; }
      .next-fix { margin-left: 34px; }
      .status-footer { grid-template-columns: 1fr; align-items: start; }
      .footer-left, .footer-right { flex-wrap: wrap; }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="brand-lockup" aria-label="VibeRaven">
      <span class="raven-mark" aria-hidden="true"></span>
      <strong>VibeRaven</strong>
      <span class="tagline">From AI demo to production</span>
    </div>
    <div id="project-picker" class="project-picker" aria-label="Current project"><span>Loading project...</span></div>
    <div class="top-actions">
      <button id="scan" class="status-button" type="button"><span class="dot ok" aria-hidden="true"></span>Local scan</button>
      <span id="settings" class="icon-button" title="Settings unavailable locally" aria-label="Settings unavailable locally" aria-disabled="true"></span>
      <button id="verify" class="primary verify-button" type="button">Verify</button>
    </div>
  </header>
  <div class="shell">
    <aside class="rail" aria-label="Providers">
      <p class="rail-title">Providers</p>
      <label class="search-box"><span aria-hidden="true"></span><input id="provider-search" placeholder="Search providers..." aria-label="Search providers" /></label>
      <div id="providers" class="provider-list"></div>
      <section class="run-local-card" aria-label="Run VibeRaven locally">
        <h2>Run VibeRaven locally</h2>
        <p>Verify your project from the terminal.</p>
        <div class="command-pill"><span>$ node packages/cli/dist/cli.js</span></div>
      </section>
    </aside>
    <main class="main" aria-label="Launch path">
      <section id="provider-header" class="provider-header"></section>
      <section id="path"></section>
      <section class="next-fix">
        <h2>Next fix</h2>
        <div id="next-fix"></div>
      </section>
    </main>
    <aside class="drawer" aria-label="Agent prompt">
      <h2>Agent prompt</h2>
      <p>Use this prompt with your coding agent.</p>
      <textarea id="prompt" class="prompt-box" readonly></textarea>
      <div class="drawer-actions">
        <button id="copy" class="primary" type="button">Copy prompt</button>
        <button id="tasklist" type="button">Open tasklist</button>
        <button id="drawer-verify" type="button">Run verify</button>
      </div>
      <div class="tip">Tip: re-run Verify after applying a fix to confirm the gate state.</div>
    </aside>
  </div>
  <footer class="status-footer">
    <div class="footer-left">
      <strong>VibeRaven CLI</strong>
      <span id="footer-project">Local project</span>
      <span id="footer-command" class="footer-command">node packages/cli/dist/cli.js</span>
    </div>
    <div class="footer-right">
      <span id="footer-gate" class="gate-status" data-status="not_clear"><span class="dot bad" aria-hidden="true"></span>Gate not clear</span>
    </div>
  </footer>
  <script>
    const state = { data: null, selectedProviderId: null, providerQuery: '' };
    const localToken = new URLSearchParams(window.location.search).get('vr_token') || '';
    const labels = {
      not_detected: 'Not detected',
      repo_evidence_found: 'Ready',
      needs_repo_fix: 'Needs fix',
      connect_live: 'Needs connect',
      live_verified: 'Ready',
      requires_user_action: 'Needs action',
      blocked: 'Blocked',
      error: 'Error',
      ready: 'Ready',
      needs_fix: 'Needs fix',
      needs_connect: 'Connect live',
      not_checked: 'Not checked'
    };
    function text(value) { return value == null ? '' : String(value); }
    function selectedProvider() {
      return state.data.providers.find((provider) => provider.id === state.selectedProviderId) || state.data.providers[0];
    }
    function gateLabel(status) {
      return status === 'clear' ? 'Gate clear' : 'Gate not clear';
    }
    function dotState(provider) {
      if (provider.state === 'repo_evidence_found' || provider.state === 'live_verified') return 'repo_evidence_found';
      if (provider.state === 'blocked' || provider.state === 'error') return provider.state;
      if (provider.state === 'needs_repo_fix' || provider.state === 'connect_live' || provider.state === 'requires_user_action') return 'needs_repo_fix';
      return provider.state;
    }
    function setPrompt(provider) {
      document.getElementById('prompt').value = provider.nextFix ? provider.nextFix.prompt : '';
    }
    function renderProviders() {
      const container = document.getElementById('providers');
      container.textContent = '';
      const query = state.providerQuery.trim();
      const providers = query
        ? state.data.providers.filter((provider) => provider.label.toLowerCase().includes(query))
        : state.data.providers;
      if (providers.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'No providers match this search.';
        container.append(empty);
        return;
      }
      for (const provider of providers) {
        const button = document.createElement('button');
        button.className = 'provider-button' + (provider.id === state.selectedProviderId ? ' is-selected' : '');
        button.type = 'button';
        button.addEventListener('click', () => {
          state.selectedProviderId = provider.id;
          render();
        });
        const icon = document.createElement('span');
        icon.className = 'provider-icon';
        icon.innerHTML = provider.iconHtml;
        const name = document.createElement('span');
        name.className = 'provider-name';
        const strong = document.createElement('strong');
        strong.textContent = provider.label;
        const status = document.createElement('span');
        status.className = 'state';
        status.dataset.state = provider.state;
        status.textContent = labels[provider.state] || provider.state;
        const dot = document.createElement('span');
        dot.className = 'provider-dot';
        dot.dataset.state = dotState(provider);
        name.append(strong, status);
        button.append(icon, name, dot);
        container.append(button);
      }
    }
    function renderProviderHeader(provider) {
      const header = document.getElementById('provider-header');
      header.textContent = '';
      const heading = document.createElement('div');
      heading.className = 'provider-heading';
      const icon = document.createElement('span');
      icon.className = 'provider-icon';
      icon.innerHTML = provider.iconHtml;
      const copy = document.createElement('div');
      const title = document.createElement('h1');
      title.textContent = provider.label + ' launch path';
      const meta = document.createElement('p');
      meta.textContent = 'What must be true before this app can ship.';
      copy.append(title, meta);
      heading.append(icon, copy);
      const guide = document.createElement('span');
      guide.className = 'secondary-action';
      guide.setAttribute('aria-disabled', 'true');
      guide.textContent = 'Provider guide unavailable locally';
      header.append(heading, guide);
    }
    function renderPath(provider) {
      const path = document.getElementById('path');
      path.textContent = '';
      const list = document.createElement('div');
      list.className = 'path-list';
      for (const item of provider.launchPath) {
        const row = document.createElement('article');
        row.className = 'path-row' + (provider.nextFix && provider.nextFix.launchPathItemId === item.id ? ' is-focused' : '');
        const body = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = item.title;
        const copy = document.createElement('p');
        copy.textContent = item.whyItMatters;
        body.append(title, copy);
        const status = document.createElement('span');
        status.className = 'path-state';
        status.dataset.state = item.state;
        status.textContent = labels[item.state] || item.state;
        row.append(body, status);
        list.append(row);
      }
      path.append(list);
    }
    function renderNextFix(provider) {
      const container = document.getElementById('next-fix');
      container.textContent = '';
      if (!provider.nextFix) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'No repo-code gap is focused for this provider. Run scan or verify to refresh VibeRaven evidence.';
        container.append(empty);
        setPrompt(provider);
        return;
      }
      const grid = document.createElement('div');
      grid.className = 'fix-grid';
      const sections = [
        ['1', 'Why it matters', provider.nextFix.whyItMatters],
        ['2', 'What to change', provider.nextFix.whatToChange],
        ['3', 'Verify with VibeRaven', provider.nextFix.verifyWith]
      ];
      for (const [symbol, heading, copy] of sections) {
        const section = document.createElement('article');
        section.className = 'fix-section';
        const marker = document.createElement('span');
        marker.className = 'fix-symbol';
        marker.textContent = symbol;
        const body = document.createElement('div');
        const h = document.createElement('h3');
        h.textContent = heading;
        const p = document.createElement('p');
        p.textContent = copy;
        body.append(h, p);
        section.append(marker, body);
        grid.append(section);
      }
      container.append(grid);
      setPrompt(provider);
    }
    function renderChrome() {
      const projectName = state.data.project.name;
      const command = state.data.command || 'node packages/cli/dist/cli.js';
      document.querySelector('#project-picker span').textContent = projectName;
      document.getElementById('footer-project').textContent = projectName;
      document.getElementById('footer-command').textContent = command;
      const gate = document.getElementById('footer-gate');
      gate.dataset.status = state.data.project.gateStatus;
      gate.textContent = '';
      const dot = document.createElement('span');
      dot.className = 'dot ' + (state.data.project.gateStatus === 'clear' ? 'ok' : 'bad');
      dot.setAttribute('aria-hidden', 'true');
      gate.append(dot, document.createTextNode(gateLabel(state.data.project.gateStatus)));
    }
    function render() {
      if (!state.data) return;
      const provider = selectedProvider();
      renderChrome();
      renderProviders();
      renderProviderHeader(provider);
      renderPath(provider);
      renderNextFix(provider);
    }
    async function refresh() {
      const response = await fetch('/api/project', { headers: { 'x-viberaven-local-ui-token': localToken } });
      if (!response.ok) throw new Error('VibeRaven local UI could not refresh project state.');
      state.data = await response.json();
      state.selectedProviderId = state.selectedProviderId || state.data.selectedProviderId;
      render();
    }
    async function postAndRefresh(path) {
      const response = await fetch(path, { method: 'POST', headers: { 'x-viberaven-local-ui-token': localToken } });
      const payload = await response.json();
      if (!response.ok) {
        state.data = payload.state || state.data;
        if (state.data) render();
        const tip = document.querySelector('.tip');
        tip.textContent = payload.error || 'VibeRaven command failed.';
        return;
      }
      state.data = payload.state || payload;
      state.selectedProviderId = state.data.selectedProviderId;
      render();
    }
    document.getElementById('provider-search').addEventListener('input', (event) => {
      state.providerQuery = event.target.value.toLowerCase();
      renderProviders();
    });
    document.getElementById('scan').addEventListener('click', () => postAndRefresh('/api/scan'));
    document.getElementById('verify').addEventListener('click', () => postAndRefresh('/api/verify'));
    document.getElementById('drawer-verify').addEventListener('click', () => postAndRefresh('/api/verify'));
    document.getElementById('tasklist').addEventListener('click', () => window.open('/api/tasklist?vr_token=' + encodeURIComponent(localToken), '_blank', 'noopener,noreferrer'));
    document.getElementById('copy').addEventListener('click', async () => {
      const prompt = document.getElementById('prompt').value;
      if (!prompt) return;
      await navigator.clipboard.writeText(prompt);
    });
    refresh().catch((error) => {
      const tip = document.querySelector('.tip');
      tip.textContent = error instanceof Error ? error.message : String(error);
    });
  </script>
</body>
</html>`;
}

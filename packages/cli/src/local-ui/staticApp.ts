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
      --purple: #7c3aed;
      --purple-soft: #f3edff;
      --purple-line: #ddd0ff;
      --mint-panel: #f6fffb;
      --green: #24b26b;
      --green-soft: #e9f8f1;
      --red: #e11d1d;
      --red-soft: #fdecec;
      --black-button: #071018;
      --radius: 8px;
      color-scheme: light;
      --mono: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", monospace;
      font-family: "Geist", "Satoshi", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    html, body { min-height: 100%; }
    body {
      margin: 0;
      background: var(--canvas);
      color: var(--ink);
      height: 100dvh;
      letter-spacing: 0;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      overflow: hidden;
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
      height: 68px;
      border-bottom: 1px solid var(--line);
      background: rgba(251, 251, 250, 0.96);
      display: grid;
      grid-template-columns: minmax(340px, 1fr) minmax(240px, 310px) auto;
      gap: 18px;
      align-items: center;
      padding: 0 26px;
      position: sticky;
      top: 0;
      z-index: 2;
      box-shadow: 0 1px 0 rgba(17, 20, 23, 0.02);
    }
    .brand-lockup {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }
    .brand-lockup strong {
      font-size: 28px;
      line-height: 1;
      white-space: nowrap;
    }
    .raven-mark {
      width: 58px;
      height: 46px;
      display: inline-grid;
      place-items: center;
      flex: 0 0 auto;
      overflow: visible;
    }
    .raven-mark img {
      width: 54px;
      height: 54px;
      object-fit: contain;
      display: block;
      transform: translateY(1px);
    }
    .tagline {
      border: 1px solid #eef0f4;
      border-radius: 10px;
      padding: 9px 18px;
      color: var(--muted-strong);
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      background: #f4f6f8;
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
      gap: 12px;
      justify-content: flex-end;
    }
    .top-divider {
      width: 1px;
      height: 30px;
      background: var(--line);
      margin: 0 4px 0 6px;
      flex: 0 0 auto;
    }
    .status-button {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      white-space: nowrap;
      min-height: 44px;
      padding-inline: 16px;
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
      width: 44px;
      height: 44px;
      padding: 0;
      display: grid;
      place-items: center;
      color: #344054;
      border: 1px solid var(--line);
      background: var(--surface);
      border-radius: 999px;
    }
    .icon-button:hover { background: var(--surface-soft); }
    .icon-button::before {
      content: none;
    }
    .icon-button svg {
      width: 22px;
      height: 22px;
      display: block;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.9;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .verify-button {
      min-width: 128px;
      height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-size: 15px;
      border-radius: 9px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 8px 18px rgba(7, 16, 24, 0.12);
    }
    .verify-button svg {
      width: 19px;
      height: 19px;
      display: block;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .shell {
      display: grid;
      grid-template-columns: 360px minmax(600px, 1fr) 520px;
      min-height: 0;
      height: 100%;
      overflow: hidden;
    }
    .rail {
      border-right: 1px solid var(--line);
      padding: 36px 28px 28px;
      background: var(--canvas);
      overflow: auto;
      min-height: 0;
    }
    .rail-title {
      margin: 0 0 16px;
      color: var(--ink);
      font-size: 16px;
      font-weight: 750;
      text-transform: none;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .rail-title::before {
      content: "";
      width: 17px;
      height: 15px;
      display: inline-block;
      background:
        linear-gradient(var(--muted) 0 0) 8px 2px / 9px 1.5px no-repeat,
        linear-gradient(var(--muted) 0 0) 8px 7px / 9px 1.5px no-repeat,
        linear-gradient(var(--muted) 0 0) 8px 12px / 9px 1.5px no-repeat,
        radial-gradient(circle, var(--muted) 1.7px, transparent 2px) 0 0 / 7px 5px repeat-y;
    }
    .search-box {
      height: 44px;
      border: 1px solid var(--line);
      background: var(--surface);
      border-radius: 9px;
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 0 10px;
      margin-bottom: 18px;
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
      gap: 10px;
    }
    .provider-button {
      width: 100%;
      min-height: 64px;
      display: grid;
      grid-template-columns: 42px minmax(0, 1fr) 8px;
      gap: 14px;
      align-items: center;
      text-align: left;
      padding: 11px 14px;
      background: var(--surface);
      border-color: var(--line);
      border-radius: 10px;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.02);
    }
    .provider-button.is-selected {
      border-color: var(--orange);
      background: #fffaf5;
      box-shadow: 0 8px 22px rgba(255, 122, 0, 0.08);
    }
    .provider-icon {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border: 1px solid var(--line);
      border-radius: 9px;
      background: var(--surface);
      color: var(--ink);
      overflow: hidden;
    }
    .provider-icon svg, .provider-icon img {
      width: 30px;
      height: 30px;
      display: block;
    }
    .provider-name { min-width: 0; }
    .provider-name strong {
      display: block;
      font-size: 14px;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .state {
      display: inline-flex;
      margin-top: 6px;
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
      margin-top: 20px;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: var(--surface);
      padding: 18px;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.02);
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
      font: 13px/1.2 var(--mono);
      overflow: hidden;
    }
    .command-pill span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .main {
      padding: 42px 48px 40px;
      overflow: auto;
      background: var(--canvas);
      min-height: 0;
    }
    .provider-header {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 18px;
      align-items: center;
      margin-bottom: 26px;
    }
    .provider-heading {
      display: flex;
      gap: 20px;
      align-items: center;
      min-width: 0;
    }
    .provider-heading .provider-icon {
      width: 58px;
      height: 58px;
      border: 0;
      background: transparent;
    }
    .provider-heading h1 {
      margin: 0;
      font-size: 34px;
      line-height: 1.15;
      font-weight: 780;
    }
    .provider-heading p {
      margin: 8px 0 0;
      color: var(--muted-strong);
      font-size: 16px;
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
      gap: 14px;
      position: relative;
      padding-left: 72px;
    }
    .path-list::before {
      content: "";
      position: absolute;
      left: 27px;
      top: -16px;
      bottom: 30px;
      width: 1px;
      background: repeating-linear-gradient(to bottom, #f5b16b 0 9px, transparent 9px 18px);
    }
    .path-row {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: var(--surface);
      padding: 22px 24px;
      display: grid;
      grid-template-columns: 48px minmax(0, 1fr) auto 18px;
      gap: 18px;
      align-items: center;
      text-align: left;
      position: relative;
      margin-bottom: 0;
      min-height: 90px;
      box-shadow: 0 12px 28px rgba(16, 24, 40, 0.035);
    }
    .path-row::before {
      content: attr(data-step);
      position: absolute;
      left: -72px;
      top: 22px;
      width: 40px;
      height: 40px;
      border: 1px solid var(--line-strong);
      border-radius: 999px;
      background: var(--surface);
      display: grid;
      place-items: center;
      color: #344054;
      font-size: 15px;
      font-weight: 800;
    }
    .path-row.is-focused {
      border-color: #ffb36b;
      box-shadow: 0 14px 30px rgba(255, 122, 0, 0.09);
    }
    .path-row.is-focused::before {
      border-color: var(--orange);
      background: var(--orange-soft);
      color: var(--orange);
    }
    .path-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: var(--surface-soft);
      color: #344054;
      display: grid;
      place-items: center;
    }
    .path-row.is-focused .path-icon {
      color: var(--orange);
      background: var(--orange-soft);
    }
    .path-icon svg {
      width: 23px;
      height: 23px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .path-row strong {
      font-size: 15px;
      line-height: 1.25;
    }
    .path-row p {
      margin: 6px 0 0;
      color: var(--muted-strong);
      font-size: 14px;
      line-height: 1.4;
    }
    .path-state {
      align-self: center;
      border: 0;
      border-radius: 999px;
      padding: 7px 13px;
      font-size: 12px;
      line-height: 1;
      color: var(--muted);
      white-space: nowrap;
      background: var(--surface-soft);
    }
    .path-arrow {
      color: var(--muted);
      display: grid;
      place-items: center;
    }
    .path-arrow svg {
      width: 18px;
      height: 18px;
      stroke: currentColor;
      stroke-width: 2;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .path-state[data-state="ready"] { background: var(--green-soft); }
    .path-state[data-state="needs_fix"], .path-state[data-state="needs_connect"] { background: var(--orange-soft); }
    .path-state[data-state="blocked"] { background: var(--red-soft); }
    .next-fix {
      margin: 36px 0 0 0;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--surface);
      padding: 28px;
      box-shadow: 0 12px 30px rgba(16, 24, 40, 0.035);
    }
    .next-fix h2 {
      margin: 0 0 4px;
      font-size: 18px;
      line-height: 1.2;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .next-fix h2::before {
      content: "";
      width: 18px;
      height: 18px;
      display: inline-block;
      background: var(--green);
      clip-path: polygon(45% 0, 82% 0, 62% 38%, 94% 38%, 32% 100%, 45% 56%, 10% 56%);
    }
    .next-fix-subtitle {
      margin: 0 0 22px;
      color: var(--muted-strong);
      font-size: 14px;
    }
    .next-action-row {
      display: grid;
      grid-template-columns: 44px minmax(0, 1fr) auto;
      gap: 16px;
      align-items: center;
      border: 1px solid var(--purple-line);
      border-radius: 10px;
      padding: 18px;
      background: linear-gradient(100deg, #fbf8ff 0%, #ffffff 58%, #f9f7ff 100%);
    }
    .next-action-icon {
      width: 40px;
      height: 40px;
      border-radius: 9px;
      display: grid;
      place-items: center;
      color: var(--purple);
      background: var(--purple-soft);
    }
    .next-action-icon svg {
      width: 22px;
      height: 22px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .next-action-row h3 {
      margin: 0 0 6px;
      font-size: 14px;
      line-height: 1.2;
    }
    .next-action-row p {
      margin: 0;
      color: var(--muted-strong);
      font-size: 13px;
      line-height: 1.45;
    }
    .open-guide-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 0;
      background: var(--purple);
      color: #ffffff;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 750;
      white-space: nowrap;
    }
    .drawer {
      border-left: 1px solid var(--line);
      padding: 30px 38px 28px 30px;
      background: var(--canvas);
      overflow: auto;
      min-height: 0;
      display: grid;
      align-content: start;
      gap: 24px;
    }
    .prompt-panel, .quick-panel {
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--surface);
      padding: 20px 24px;
      box-shadow: 0 12px 30px rgba(16, 24, 40, 0.04);
    }
    .panel-heading {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
    }
    .panel-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .panel-glyph {
      color: var(--purple);
      display: grid;
      place-items: center;
      width: 26px;
      height: 26px;
    }
    .panel-glyph svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
    .copy-small {
      min-height: 36px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 9px;
      padding: 8px 12px;
      color: var(--muted-strong);
      font-weight: 650;
    }
    .drawer h2 {
      margin: 0;
      font-size: 18px;
      line-height: 1.2;
    }
    .drawer p {
      margin: 8px 0 0;
      color: var(--muted-strong);
      font-size: 14px;
      line-height: 1.4;
    }
    .prompt-box {
      position: absolute;
      opacity: 0;
      pointer-events: none;
      width: 1px;
      height: 1px;
    }
    .prompt-card {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 22px;
      background: linear-gradient(135deg, var(--mint-panel), #ffffff 74%);
      color: #1f2937;
      font: 13px/1.55 var(--mono);
      min-height: 220px;
      white-space: pre-wrap;
    }
    .prompt-line {
      display: grid;
      grid-template-columns: 20px minmax(0, 1fr);
      gap: 10px;
      margin: 7px 0;
    }
    .prompt-check {
      color: var(--green);
      display: grid;
      place-items: start center;
      padding-top: 3px;
    }
    .prompt-check svg {
      width: 14px;
      height: 14px;
    }
    .drawer-actions {
      display: grid;
      gap: 10px;
      margin-top: 18px;
    }
    .drawer-actions button {
      min-height: 42px;
      font-weight: 650;
      position: relative;
      display: grid;
      grid-template-columns: 24px minmax(0, 1fr) 14px;
      gap: 10px;
      align-items: center;
      text-align: left;
      border-radius: 9px;
      padding: 10px 12px;
    }
    .drawer-actions button::after {
      content: "";
      width: 8px;
      height: 8px;
      justify-self: end;
      border-right: 1.5px solid var(--muted);
      border-bottom: 1.5px solid var(--muted);
      transform: rotate(-45deg);
    }
    .action-icon {
      width: 24px;
      height: 24px;
      color: var(--muted-strong);
      display: grid;
      place-items: center;
    }
    .action-icon svg {
      width: 19px;
      height: 19px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
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
    .tip {
      margin-top: 14px;
      border: 1px solid var(--line);
      border-radius: 9px;
      padding: 12px;
      color: var(--muted-strong);
      background: var(--surface-soft);
      font-size: 13px;
      line-height: 1.4;
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
      font: 13px/1 var(--mono);
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
      body {
        height: auto;
        min-height: 100dvh;
        overflow: auto;
        display: block;
      }
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
        grid-template-columns: minmax(118px, 1fr) auto 42px minmax(118px, 1fr);
      }
      .verify-button { min-width: 118px; }
      .shell { grid-template-columns: 1fr; min-height: auto; height: auto; overflow: visible; }
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
      <span class="raven-mark" aria-hidden="true">
        <img src="/assets/extension-icon.png" alt="" />
      </span>
      <strong>VibeRaven</strong>
      <span class="tagline">From AI demo to production</span>
    </div>
    <div id="project-picker" class="project-picker" aria-label="Current project"><span>Loading project...</span></div>
    <div class="top-actions">
      <button id="scan" class="status-button" type="button"><span class="dot ok" aria-hidden="true"></span>Local scan</button>
      <span class="top-divider" aria-hidden="true"></span>
      <span id="settings" class="icon-button" title="Settings unavailable locally" aria-label="Settings unavailable locally" aria-disabled="true">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z"/>
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.05.05a2 2 0 0 1-2.83 2.83l-.05-.05a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 0 1-4 0v-.08a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.87.34l-.05.05a2 2 0 0 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 0 1 0-4h.08A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.05-.05a2 2 0 0 1 2.83-2.83l.05.05a1.7 1.7 0 0 0 1.87.34A1.7 1.7 0 0 0 10 3.08V3a2 2 0 0 1 4 0v.08a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.05-.05a2 2 0 0 1 2.83 2.83l-.05.05A1.7 1.7 0 0 0 19.4 8.9a1.7 1.7 0 0 0 1.56 1.04H21a2 2 0 0 1 0 4h-.08A1.7 1.7 0 0 0 19.4 15Z"/>
        </svg>
      </span>
      <button id="verify" class="primary verify-button" type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.2 19 6v5.3c0 4.4-2.7 7.4-7 9.5-4.3-2.1-7-5.1-7-9.5V6Z"/>
          <path d="m9.2 12.1 2 2 4-4.3"/>
        </svg>
        <span>Verify now</span>
      </button>
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
        <div class="command-pill"><span>$ npx -y viberaven</span></div>
      </section>
    </aside>
    <main class="main" aria-label="Launch path">
      <section id="provider-header" class="provider-header"></section>
      <section id="path"></section>
      <section class="next-fix">
        <h2>Next action</h2>
        <div id="next-fix"></div>
      </section>
    </main>
    <aside class="drawer" aria-label="Agent prompt and quick actions">
      <section class="prompt-panel" aria-label="Agent prompt">
        <div class="panel-heading">
          <div class="panel-title">
            <span class="panel-glyph" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z"/><path d="m19 15 .8 2.8L22 18.6l-2.2.8L19 22l-.8-2.6-2.2-.8 2.2-.8L19 15Z"/></svg>
            </span>
            <div>
              <h2>Agent prompt</h2>
              <p>Run this with your coding agent.</p>
            </div>
          </div>
          <button id="copy" class="copy-small" type="button" aria-label="Copy prompt">
            <span class="action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>
            Copy
          </button>
        </div>
        <div id="prompt-preview" class="prompt-card"></div>
        <textarea id="prompt" class="prompt-box" readonly></textarea>
      </section>
      <section class="quick-panel" aria-label="Quick actions">
        <div class="panel-title">
          <span class="action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z"/></svg></span>
          <h2>Quick actions</h2>
        </div>
        <div class="drawer-actions">
          <button id="tasklist" type="button"><span class="action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg></span><span>Open tasklist</span></button>
          <button id="drawer-verify" type="button" aria-label="Run verify"><span class="action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/></svg></span><span>Run local verify</span></button>
          <button id="last-report" type="button"><span class="action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M8 13h8"/><path d="M8 17h5"/></svg></span><span>View last report</span></button>
        </div>
        <div class="tip" hidden></div>
      </section>
    </aside>
  </div>
  <footer class="status-footer">
    <div class="footer-left">
      <strong>VibeRaven CLI</strong>
      <span id="footer-project">Local project</span>
      <span id="footer-command" class="footer-command">npx -y viberaven</span>
    </div>
    <div class="footer-right">
      <span>Need help?</span>
      <span id="footer-gate" class="gate-status" data-status="not_clear"><span class="dot bad" aria-hidden="true"></span>Gate not clear</span>
    </div>
  </footer>
  <script>
    const state = { data: null, selectedProviderId: null, selectedPathItemId: null, providerQuery: '', busyAction: '' };
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
    function selectedPathItem(provider) {
      return provider.launchPath.find((item) => item.id === state.selectedPathItemId)
        || (provider.nextFix && provider.launchPath.find((item) => item.id === provider.nextFix.launchPathItemId))
        || provider.launchPath[0];
    }
    function providerPrompt(provider, item) {
      const nextFix = provider.nextFix;
      if (nextFix && item.id === nextFix.launchPathItemId) return nextFix.prompt;
      return [
        'Work on the ' + provider.label + ' launch path for ' + (state.data.project.name || 'this project') + '.',
        '',
        'Focused check: ' + item.title,
        '',
        'Requirements:',
        '- Understand why it matters: ' + item.whyItMatters,
        '- Make the repo-owned change: ' + item.whatToChange,
        '- Keep changes local/repo-only and do not add secret values.',
        '- Re-run npx -y viberaven --verify when done.',
        '',
        'Return the exact files changed and the verification result.'
      ].join('\\n');
    }
    function providerGuideUrl(providerId, item) {
      const urls = {
        supabase: item && item.id === 'rls-policies' ? 'https://supabase.com/docs/guides/database/postgres/row-level-security' : 'https://supabase.com/docs',
        vercel: 'https://vercel.com/docs',
        stripe: 'https://docs.stripe.com',
        github: 'https://docs.github.com/actions',
        sentry: 'https://docs.sentry.io',
        clerk: 'https://clerk.com/docs',
        posthog: 'https://posthog.com/docs'
      };
      return urls[providerId] || '';
    }
    function setTip(message, kind) {
      const tip = document.querySelector('.tip');
      tip.hidden = !message;
      tip.textContent = message || '';
      tip.dataset.kind = kind || 'info';
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
    function pathIconHtml(index) {
      const icons = [
        '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5"/><path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
        '<svg viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m4 7.5 8 4.5 8-4.5"/><path d="M12 12v9"/></svg>',
        '<svg viewBox="0 0 24 24"><path d="m14 10-4 4"/><path d="M16.5 7.5a3.5 3.5 0 0 1 0 5l-1.5 1.5a3.5 3.5 0 0 1-5 0"/><path d="M7.5 16.5a3.5 3.5 0 0 1 0-5L9 10a3.5 3.5 0 0 1 5 0"/></svg>',
        '<svg viewBox="0 0 24 24"><path d="m12 3 8 4-8 4-8-4Z"/><path d="m4 12 8 4 8-4"/><path d="m4 17 8 4 8-4"/></svg>'
      ];
      return icons[index % icons.length];
    }
    function renderPromptPreview(prompt) {
      const preview = document.getElementById('prompt-preview');
      preview.textContent = '';
      const lines = prompt ? prompt.split('\\n') : [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          preview.append(document.createTextNode('\\n'));
          continue;
        }
        if (trimmed.startsWith('- ')) {
          const row = document.createElement('div');
          row.className = 'prompt-line';
          const check = document.createElement('span');
          check.className = 'prompt-check';
          check.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 2.5 2.5 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          const copy = document.createElement('span');
          copy.textContent = trimmed.slice(2);
          row.append(check, copy);
          preview.append(row);
          continue;
        }
        const block = document.createElement('div');
        block.textContent = line;
        preview.append(block);
      }
    }
    function setPrompt(provider, item) {
      const prompt = item ? providerPrompt(provider, item) : (provider.nextFix ? provider.nextFix.prompt : '');
      document.getElementById('prompt').value = prompt;
      renderPromptPreview(prompt);
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
          state.selectedPathItemId = null;
          setTip('');
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
      title.textContent = 'Your launch path';
      const meta = document.createElement('p');
      meta.textContent = "We'll guide you through what matters most.";
      copy.append(title, meta);
      heading.append(icon, copy);
      header.append(heading);
    }
    function renderPath(provider) {
      const path = document.getElementById('path');
      path.textContent = '';
      const list = document.createElement('div');
      list.className = 'path-list';
      provider.launchPath.forEach((item, index) => {
        const row = document.createElement('button');
        const isFocused = selectedPathItem(provider).id === item.id;
        row.className = 'path-row' + (isFocused ? ' is-focused' : '');
        row.type = 'button';
        row.dataset.step = String(index + 1);
        row.setAttribute('aria-label', 'Open ' + item.title + ' guidance');
        row.addEventListener('click', () => {
          state.selectedPathItemId = item.id;
          setTip('Opened guidance for ' + item.title + '. Copy the prompt or use Open guide for the focused steps.');
          render();
        });
        const icon = document.createElement('span');
        icon.className = 'path-icon';
        icon.innerHTML = pathIconHtml(index);
        const body = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = item.title;
        const copy = document.createElement('p');
        copy.textContent = item.whatToChange || item.whyItMatters;
        body.append(title, copy);
        const status = document.createElement('span');
        status.className = 'path-state';
        status.dataset.state = item.state;
        status.textContent = item.state === 'not_checked' ? 'Pending' : (labels[item.state] || item.state);
        const arrow = document.createElement('span');
        arrow.className = 'path-arrow';
        arrow.innerHTML = '<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>';
        row.append(icon, body, status, arrow);
        list.append(row);
      });
      path.append(list);
    }
    function renderNextFix(provider) {
      const container = document.getElementById('next-fix');
      container.textContent = '';
      const item = selectedPathItem(provider);
      if (!item) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'No launch-path guidance is available for this provider yet. Run scan or verify to refresh VibeRaven evidence.';
        container.append(empty);
        setPrompt(provider, item);
        return;
      }
      const subtitle = document.createElement('p');
      subtitle.className = 'next-fix-subtitle';
      subtitle.textContent = provider.nextFix && item.id === provider.nextFix.launchPathItemId ? 'Start here to move forward.' : 'Manual guidance for the selected launch check.';
      const row = document.createElement('article');
      row.className = 'next-action-row';
      const icon = document.createElement('span');
      icon.className = 'next-action-icon';
      icon.innerHTML = pathIconHtml(Math.max(0, provider.launchPath.findIndex((candidate) => candidate.id === item.id)));
      const body = document.createElement('div');
      const h = document.createElement('h3');
      h.textContent = 'Fix ' + item.title.toLowerCase();
      const p = document.createElement('p');
      p.textContent = item.whatToChange;
      body.append(h, p);
      const guide = document.createElement('button');
      guide.className = 'open-guide-button';
      guide.type = 'button';
      guide.textContent = 'Open guide';
      guide.addEventListener('click', () => {
        setTip(item.title + ': ' + item.whyItMatters + ' Next: ' + item.whatToChange + ' Then: ' + item.verifyWith);
        const url = providerGuideUrl(provider.id, item);
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
      });
      row.append(icon, body, guide);
      container.append(subtitle, row);
      setPrompt(provider, item);
    }
    function renderChrome() {
      const projectName = state.data.project.name;
      const command = state.data.command || 'npx -y viberaven';
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
      state.selectedPathItemId = null;
      setTip(path === '/api/verify' ? 'Verify finished. The launch map has been refreshed.' : 'Local scan finished. The launch map has been refreshed.');
      render();
    }
    document.getElementById('provider-search').addEventListener('input', (event) => {
      state.providerQuery = event.target.value.toLowerCase();
      renderProviders();
    });
    document.getElementById('scan').addEventListener('click', () => {
      setTip('Running local scan...');
      postAndRefresh('/api/scan');
    });
    document.getElementById('verify').addEventListener('click', () => {
      setTip('Running local verify...');
      postAndRefresh('/api/verify');
    });
    document.getElementById('drawer-verify').addEventListener('click', () => {
      setTip('Running local verify...');
      postAndRefresh('/api/verify');
    });
    document.getElementById('tasklist').addEventListener('click', () => {
      setTip('Opening the local tasklist artifact.');
      window.open('/api/tasklist?vr_token=' + encodeURIComponent(localToken), '_blank', 'noopener,noreferrer');
    });
    document.getElementById('last-report').addEventListener('click', () => {
      setTip('Opening the latest local report data.');
      window.open('/api/report?vr_token=' + encodeURIComponent(localToken), '_blank', 'noopener,noreferrer');
    });
    document.getElementById('copy').addEventListener('click', async () => {
      const prompt = document.getElementById('prompt').value;
      if (!prompt) return;
      await navigator.clipboard.writeText(prompt);
      setTip('Prompt copied. Paste it into your coding agent for the selected launch check.');
    });
    refresh().catch((error) => {
      const tip = document.querySelector('.tip');
      tip.textContent = error instanceof Error ? error.message : String(error);
    });
  </script>
</body>
</html>`;
}

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
      background: var(--purple);
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
    .open-guide-button:hover {
      background: #6d28d9;
      color: #ffffff;
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
      color: #344054;
      display: grid;
      place-items: center;
      width: 26px;
      height: 26px;
    }
    .panel-glyph svg {
      width: 24px;
      height: 24px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.9;
      stroke-linecap: round;
      stroke-linejoin: round;
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
    .action-panel-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9;
      background: rgba(17, 20, 23, 0.28);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      align-items: stretch;
      justify-content: flex-end;
      transition: opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), visibility 180ms ease;
    }
    .action-panel-backdrop.is-open {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }
    .action-panel {
      width: min(620px, 100%);
      height: 100%;
      background: var(--canvas);
      border-left: 1px solid var(--line);
      box-shadow: -24px 0 60px rgba(16, 24, 40, 0.16);
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      transform: translateX(28px);
      opacity: 0.98;
      transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease;
    }
    .action-panel-backdrop.is-open .action-panel {
      transform: translateX(0);
      opacity: 1;
    }
    .action-panel-header {
      padding: 24px 28px;
      border-bottom: 1px solid var(--line);
      background: var(--surface);
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 16px;
      align-items: start;
    }
    .action-panel-header h2 {
      margin: 0;
      font-size: 23px;
      line-height: 1.15;
    }
    .action-panel-header p {
      margin: 8px 0 0;
      color: var(--muted-strong);
      line-height: 1.45;
    }
    .panel-close {
      width: 38px;
      height: 38px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      padding: 0;
    }
    .panel-close::before,
    .panel-close::after {
      content: "";
      width: 15px;
      height: 1.8px;
      background: currentColor;
      grid-area: 1 / 1;
      border-radius: 999px;
    }
    .panel-close::before { transform: rotate(45deg); }
    .panel-close::after { transform: rotate(-45deg); }
    .action-panel-body {
      overflow: auto;
      padding: 24px 28px 30px;
      display: grid;
      gap: 14px;
      align-content: start;
    }
    .guide-card {
      border: 1px solid var(--line);
      border-radius: 12px;
      background: var(--surface);
      padding: 18px;
      box-shadow: 0 10px 22px rgba(16, 24, 40, 0.035);
      animation: panelCardIn 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--panel-index, 0) * 38ms);
    }
    .guide-card h3 {
      margin: 0 0 8px;
      font-size: 15px;
    }
    .guide-card p {
      margin: 0;
      color: var(--muted-strong);
      line-height: 1.5;
    }
    .guide-card code {
      display: inline-flex;
      max-width: 100%;
      margin-top: 10px;
      border: 1px solid var(--line);
      border-radius: 7px;
      padding: 8px 10px;
      background: var(--surface-soft);
      color: var(--ink);
      font: 12px/1.35 var(--mono);
      white-space: pre-wrap;
    }
    .guide-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 14px;
    }
    .guide-actions button {
      min-height: 38px;
      font-weight: 700;
    }
    .guide-actions .primary-action {
      border-color: var(--black-button);
      background: var(--black-button);
      color: #ffffff;
    }
    .guide-actions .primary-action:hover {
      background: #111a22;
      color: #ffffff;
    }
    .guide-actions .verify-action {
      border-color: var(--purple);
      background: var(--purple);
      color: #ffffff;
    }
    .guide-actions .verify-action:hover {
      background: #6d28d9;
      color: #ffffff;
    }
    .task-card {
      display: grid;
      grid-template-columns: 34px minmax(0, 1fr);
      gap: 14px;
    }
    .task-number {
      width: 34px;
      height: 34px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      color: var(--orange);
      background: var(--orange-soft);
      font-weight: 800;
      font-size: 13px;
    }
    .provider-pill-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .provider-pill {
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--surface-soft);
      padding: 7px 10px;
      color: var(--muted-strong);
      font-size: 12px;
      font-weight: 700;
    }
    .report-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .report-metric {
      border: 1px solid var(--line);
      border-radius: 10px;
      background: var(--surface);
      padding: 14px;
    }
    .report-metric span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 6px;
    }
    .report-metric strong {
      font-size: 18px;
    }
    .panel-pre {
      margin: 0;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: #fff;
      padding: 16px;
      color: #1f2937;
      white-space: pre-wrap;
      font: 13px/1.55 var(--mono);
    }
    @keyframes panelCardIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
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
      <button id="scan" class="status-button" type="button"><span class="dot ok" aria-hidden="true"></span>Scan</button>
      <span class="top-divider" aria-hidden="true"></span>
      <button id="settings" class="icon-button" title="Settings" aria-label="Settings" type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z"/>
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.05.05a2 2 0 0 1-2.83 2.83l-.05-.05a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 0 1-4 0v-.08a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.87.34l-.05.05a2 2 0 0 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 0 1 0-4h.08A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.05-.05a2 2 0 0 1 2.83-2.83l.05.05a1.7 1.7 0 0 0 1.87.34A1.7 1.7 0 0 0 10 3.08V3a2 2 0 0 1 4 0v.08a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.05-.05a2 2 0 0 1 2.83 2.83l-.05.05A1.7 1.7 0 0 0 19.4 8.9a1.7 1.7 0 0 0 1.56 1.04H21a2 2 0 0 1 0 4h-.08A1.7 1.7 0 0 0 19.4 15Z"/>
        </svg>
      </button>
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
      <section class="run-local-card" aria-label="Run VibeRaven">
        <h2>Run VibeRaven</h2>
        <p>Check your project from the terminal.</p>
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
              <svg viewBox="0 0 24 24"><path d="M4 6h16"/><path d="M4 12h10"/><path d="M4 18h7"/><path d="M17 12l3 3-3 3"/><path d="M14 15h6"/></svg>
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
          <button id="drawer-verify" type="button" aria-label="Run verify"><span class="action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/></svg></span><span>Run verify</span></button>
        </div>
        <div class="tip" hidden></div>
      </section>
    </aside>
  </div>
  <footer class="status-footer">
    <div class="footer-left">
      <strong>VibeRaven CLI</strong>
    </div>
    <div class="footer-right">
      <span>Need help?</span>
      <span id="footer-gate" class="gate-status" data-status="not_clear"><span class="dot bad" aria-hidden="true"></span>Gate not clear</span>
    </div>
  </footer>
  <div id="action-panel-backdrop" class="action-panel-backdrop" aria-hidden="true">
    <section class="action-panel" role="dialog" aria-modal="true" aria-labelledby="action-panel-title">
      <header class="action-panel-header">
        <div>
          <h2 id="action-panel-title">Guide</h2>
          <p id="action-panel-subtitle"></p>
        </div>
        <button id="action-panel-close" class="panel-close" type="button" aria-label="Close panel"></button>
      </header>
      <div id="action-panel-body" class="action-panel-body"></div>
    </section>
  </div>
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
    function setTip(message, kind) {
      const tip = document.querySelector('.tip');
      tip.hidden = !message;
      tip.textContent = message || '';
      tip.dataset.kind = kind || 'info';
    }
    function escapeHtml(value) {
      return String(value == null ? '' : value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }
    function openPanel(title, subtitle, html) {
      document.getElementById('action-panel-title').textContent = title;
      document.getElementById('action-panel-subtitle').textContent = subtitle || '';
      document.getElementById('action-panel-body').innerHTML = html;
      const backdrop = document.getElementById('action-panel-backdrop');
      backdrop.classList.add('is-open');
      backdrop.setAttribute('aria-hidden', 'false');
    }
    function closePanel() {
      const backdrop = document.getElementById('action-panel-backdrop');
      backdrop.classList.remove('is-open');
      backdrop.setAttribute('aria-hidden', 'true');
    }
    function guideSteps(provider, item) {
      if (provider.id === 'supabase' && item.id === 'rls-policies') {
        return [
          { title: 'Open Supabase policies', body: 'In Supabase, open Authentication and Database policies for the project tables that store user data.', code: 'https://supabase.com/dashboard/project/_/auth/policies', openUrl: 'https://supabase.com/dashboard/project/_/auth/policies' },
          { title: 'Enable RLS in a migration', body: 'Keep proof in the repo. Add SQL that enables row level security for each public table.', code: 'alter table public.your_table enable row level security;' },
          { title: 'Scope rows to the owner', body: 'Add policies that only allow authenticated users to read or write their own records. Avoid permissive USING (true) policies.', code: "create policy \\"Users manage own rows\\" on public.your_table\\nfor all to authenticated\\nusing (auth.uid() = user_id)\\nwith check (auth.uid() = user_id);" },
          { title: 'Run verify', body: 'Refresh the evidence map after the repo change. VibeRaven does not need secret values.', code: 'npx -y viberaven --verify', verify: true }
        ];
      }
      if (provider.id === 'supabase' && item.id === 'production-env') {
        return [
          { title: 'Open .env.example', body: 'Add names only. Never paste real Supabase keys into repo files.', code: 'NEXT_PUBLIC_SUPABASE_URL=\\nNEXT_PUBLIC_SUPABASE_ANON_KEY=\\nSERVER_ONLY_SUPABASE_ADMIN_KEY=<server-only, never expose to browser>', file: '.env.example' },
          { title: 'Document the boundary', body: 'Make it obvious which key can be public and which must stay server-only.', code: 'The server-only Supabase admin key must not be used in client components.' },
          { title: 'Run verify', body: 'Refresh evidence after the placeholders are committed.', code: 'npx -y viberaven --verify', verify: true }
        ];
      }
      if (provider.id === 'stripe') {
        return [
          { title: 'Open env example', body: 'Add payment env names only. Keep server keys out of client code.', code: 'STRIPE_SERVER_KEY=<server-only>\\nSTRIPE_WEBHOOK_SIGNING_SECRET=<server-only>\\nNEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=', file: '.env.example' },
          { title: 'Copy webhook target', body: 'Use a stable production webhook route and verify signatures before changing subscription state.', code: '/api/stripe/webhook' },
          { title: 'Run verify', body: 'VibeRaven checks repo evidence and does not need live secret values.', code: 'npx -y viberaven --verify', verify: true }
        ];
      }
      if (provider.id === 'vercel') {
        return [
          { title: 'Open env example', body: 'Document the env names your app expects in production without values.', code: '.env.example', file: '.env.example' },
          { title: 'Confirm deploy command', body: 'Make package scripts and deployment config agree on build and test commands.', code: 'npm run build' },
          { title: 'Run verify', body: 'Refresh the launch map after repo evidence changes.', code: 'npx -y viberaven --verify', verify: true }
        ];
      }
      return [
        { title: item.title, body: item.whyItMatters, code: item.whatToChange },
        { title: 'Keep the proof in the repo', body: 'Provider setup can still require manual work, but VibeRaven needs safe local evidence for the coding agent.', code: item.verifyWith },
        { title: 'Run verify', body: 'Run verify after the repo-owned fix. No production secrets are required.', code: 'npx -y viberaven --verify', verify: true }
      ];
    }
    function renderGuideHtml(provider, item) {
      const cards = guideSteps(provider, item).map((step, index) => {
        const actions = [
          step.code ? '<button type="button" data-copy="' + escapeHtml(step.code) + '">Copy</button>' : '',
          step.file ? '<button type="button" data-open-file="' + escapeHtml(step.file) + '">Open file</button>' : '',
          step.openUrl ? '<button type="button" data-open-url="' + escapeHtml(step.openUrl) + '">Open</button>' : '',
          step.verify ? '<button class="verify-action" type="button" data-run-verify="true">Run verify</button>' : ''
        ].filter(Boolean).join('');
        return '<article class="guide-card task-card" style="--panel-index:' + index + '"><span class="task-number">' + (index + 1) + '</span><div><h3>' + escapeHtml(step.title) + '</h3><p>' + escapeHtml(step.body) + '</p>' + (step.code ? '<code>' + escapeHtml(step.code) + '</code>' : '') + '<div class="guide-actions">' + actions + '</div></div></article>';
      }).join('');
      return cards + '<article class="guide-card" style="--panel-index:8"><h3>Use with your coding agent</h3><p>The prompt on the right is scoped to this provider check. Copy it after selecting the row you want to fix.</p><div class="guide-actions"><button class="primary-action" type="button" data-copy-prompt="true">Copy focused prompt</button><button class="verify-action" type="button" data-run-verify="true">Run verify</button></div></article>';
    }
    function renderTasklistHtml() {
      const provider = selectedProvider();
      const item = selectedPathItem(provider);
      const cards = guideSteps(provider, item).slice(0, 3).map((step, index) => {
        const actions = [
          step.code ? '<button type="button" data-copy="' + escapeHtml(step.code) + '">Copy</button>' : '',
          step.file ? '<button type="button" data-open-file="' + escapeHtml(step.file) + '">Open file</button>' : '',
          step.verify ? '<button class="verify-action" type="button" data-run-verify="true">Run verify</button>' : ''
        ].filter(Boolean).join('');
        return '<article class="guide-card task-card" style="--panel-index:' + index + '"><span class="task-number">' + (index + 1) + '</span><div><h3>' + escapeHtml(step.title) + '</h3><p>' + escapeHtml(step.body) + '</p>' + (step.code ? '<code>' + escapeHtml(step.code) + '</code>' : '') + '<div class="guide-actions">' + actions + '</div></div></article>';
      }).join('');
      const providerPills = state.data.providers.map((candidate) => '<span class="provider-pill">' + escapeHtml(candidate.label) + ': ' + escapeHtml(labels[candidate.state] || candidate.state) + '</span>').join('');
      return '<article class="guide-card" style="--panel-index:0"><h3>Current focus</h3><p>' + escapeHtml(provider.label + ' - ' + item.title) + '</p><div class="provider-pill-row">' + providerPills + '</div></article>' + cards;
    }
    async function openTasklistPanel() {
      setTip('Loading tasklist...');
      await fetch('/api/tasklist?vr_token=' + encodeURIComponent(localToken));
      openPanel('Tasklist', 'Focused steps from repo evidence. No secrets are needed.', renderTasklistHtml());
      setTip('Tasklist loaded inside VibeRaven.');
    }
    function openSettingsPanel() {
      const project = state.data.project;
      openPanel('Settings', 'This console reads repo evidence only.', '<article class="guide-card"><h3>Project folder</h3><p>' + escapeHtml(project.workspacePath) + '</p></article><article class="guide-card"><h3>Privacy boundary</h3><p>Scan and verify inspect package metadata, env examples, deployment config, tests, and provider-related source hints. They do not read real secret values and do not use your private OpenAI API key.</p></article><article class="guide-card"><h3>Commands</h3><code>npx -y viberaven\\nnpx -y viberaven --verify\\nnpx -y viberaven --agent-mode</code></article>');
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
        openPanel(provider.label + ' guide', item.title + ' guidance for this project.', renderGuideHtml(provider, item));
        setTip('Opened in-app guide for ' + item.title + '.');
      });
      row.append(icon, body, guide);
      container.append(subtitle, row);
      setPrompt(provider, item);
    }
    function renderChrome() {
      const projectName = state.data.project.name;
      document.querySelector('#project-picker span').textContent = projectName;
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
      setTip(path === '/api/verify' ? 'Verify finished. The launch map has been refreshed.' : 'Scan finished. The launch map has been refreshed.');
      render();
    }
    document.getElementById('provider-search').addEventListener('input', (event) => {
      state.providerQuery = event.target.value.toLowerCase();
      renderProviders();
    });
    document.getElementById('scan').addEventListener('click', () => {
      setTip('Running scan...');
      postAndRefresh('/api/scan');
    });
    document.getElementById('verify').addEventListener('click', () => {
      setTip('Running verify...');
      postAndRefresh('/api/verify');
    });
    document.getElementById('drawer-verify').addEventListener('click', () => {
      setTip('Running verify...');
      postAndRefresh('/api/verify');
    });
    document.getElementById('tasklist').addEventListener('click', () => {
      openTasklistPanel().catch((error) => setTip(error instanceof Error ? error.message : String(error), 'error'));
    });
    document.getElementById('settings').addEventListener('click', openSettingsPanel);
    document.getElementById('action-panel-close').addEventListener('click', closePanel);
    document.getElementById('action-panel-backdrop').addEventListener('click', (event) => {
      if (event.target.id === 'action-panel-backdrop') closePanel();
    });
    document.getElementById('action-panel-body').addEventListener('click', async (event) => {
      const target = event.target.closest('button');
      if (!target) return;
      if (target.dataset.copy) {
        await navigator.clipboard.writeText(target.dataset.copy);
        setTip('Copied guide snippet.');
      }
      if (target.dataset.openUrl) {
        window.open(target.dataset.openUrl, '_blank', 'noopener,noreferrer');
        setTip('Opened provider page.');
      }
      if (target.dataset.openFile) {
        const base = state.data.project.workspacePath.replaceAll('\\\\', '/').replace(/\\/$/, '');
        const rel = target.dataset.openFile.replace(/^[/\\\\]+/, '');
        window.open('vscode://file/' + encodeURI(base + '/' + rel), '_blank', 'noopener,noreferrer');
        setTip('Opened ' + rel + ' in your editor if the editor protocol is enabled.');
      }
      if (target.dataset.copyPrompt) {
        await navigator.clipboard.writeText(document.getElementById('prompt').value || '');
        setTip('Copied focused prompt.');
      }
      if (target.dataset.runVerify) {
        setTip('Running verify...');
        postAndRefresh('/api/verify');
      }
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

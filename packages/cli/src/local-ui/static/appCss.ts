export const localUiCss = `
:root {
  --vr-bg: #0c0d10;
  --vr-bg-2: #12151a;
  --vr-panel: rgba(20, 23, 29, 0.88);
  --vr-panel-2: rgba(27, 31, 39, 0.78);
  --vr-border: rgba(226, 232, 240, 0.105);
  --vr-border-strong: rgba(168, 85, 247, 0.34);
  --vr-text: #f4f4f5;
  --vr-muted: #9ca3af;
  --vr-purple: #7c3aed;
  --vr-purple-2: #a855f7;
  --vr-blue: #38bdf8;
  --vr-green: #22c55e;
  --vr-red: #ef4444;
  --vr-orange: #f97316;
  --vr-glow-purple: 0 0 18px rgba(124, 58, 237, 0.42), 0 0 40px rgba(124, 58, 237, 0.18);
  --vr-glow-green: 0 0 18px rgba(34, 197, 94, 0.28);
}

* { box-sizing: border-box; }
html, body { width: 100%; height: 100%; }
body {
  margin: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 48% -18%, rgba(124, 58, 237, 0.12), transparent 34%),
    radial-gradient(circle at 88% 18%, rgba(56, 189, 248, 0.045), transparent 26%),
    var(--vr-bg);
  color: var(--vr-text);
  font-family: Geist, Inter, "Segoe UI", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
}
button, input { font: inherit; }
button { cursor: pointer; }
button:focus-visible,
a:focus-visible {
  outline: 2px solid rgba(196, 181, 253, 0.92);
  outline-offset: 3px;
  box-shadow: 0 0 0 6px rgba(124, 58, 237, 0.18);
}
i[data-icon] {
  width: 16px;
  height: 16px;
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  font-style: normal;
  color: inherit;
}
i[data-icon] svg {
  width: 100%;
  height: 100%;
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
i[data-icon] svg path,
i[data-icon] svg circle,
i[data-icon] svg rect,
i[data-icon] svg line,
i[data-icon] svg polyline,
i[data-icon] svg ellipse {
  fill: none;
  stroke: inherit;
}
button i[data-icon],
a i[data-icon] {
  width: 14px;
  height: 14px;
  color: inherit;
}
.vr-context-icon-chip {
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
  color: #c4b5fd;
}
.vr-context-icon-chip.is-input {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
}
.vr-context-icon-chip i[data-icon] {
  width: 14px;
  height: 14px;
}
.vr-context-icon-chip.is-input i[data-icon] {
  width: 14px;
  height: 14px;
}

.vr-app {
  width: 100vw;
  height: 100dvh;
  min-height: 760px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  color: var(--vr-text);
}

.vr-sidebar,
.vr-composed-shell,
.vr-project-header,
.vr-providers-panel,
.vr-releases-panel,
.vr-agent-panel,
.vr-bottom-tip-bar {
  border: 1px solid var(--vr-border);
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.68), rgba(2, 6, 23, 0.7)),
    var(--vr-panel);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
}

.vr-sidebar {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 12px;
  margin: 14px 0 14px 14px;
  border-radius: 16px;
  padding: 12px 10px;
}

.vr-sidebar-brand {
  display: grid;
  grid-template-columns: 48px;
  justify-content: center;
  align-items: center;
  min-width: 0;
}
.vr-sidebar-brand > div,
.vr-open-source-card,
.vr-workspace-switcher {
  display: none;
}

.vr-brand-mascot {
  position: relative;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: end center;
  overflow: hidden;
  border: 1px solid rgba(168, 85, 247, 0.5);
  border-radius: 14px;
  background:
    radial-gradient(circle at 42% 26%, rgba(34, 197, 94, 0.16), transparent 36%),
    radial-gradient(circle at 68% 76%, rgba(124, 58, 237, 0.5), transparent 54%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.8));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 0 28px rgba(124, 58, 237, 0.28);
}
.vr-brand-mascot::after {
  content: "";
  position: absolute;
  inset: -1px;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.16), transparent 40%, rgba(34, 197, 94, 0.12));
}
.vr-brand-mascot img {
  position: relative;
  z-index: 1;
  width: 50px;
  height: 50px;
  object-fit: contain;
  object-position: bottom;
  transform: translateY(4px) scale(1.08);
  filter: saturate(1.18) drop-shadow(0 0 18px rgba(168, 85, 247, 0.55));
  animation: vrMascotIdle 3600ms cubic-bezier(0.23, 1, 0.32, 1) infinite;
}

.vr-sidebar-brand strong {
  display: block;
  font-size: 25px;
  line-height: 1;
  font-weight: 850;
}

.vr-sidebar-brand span {
  display: block;
  margin-top: 5px;
  color: var(--vr-muted);
  font-size: 12px;
}

.vr-sidebar-nav {
  display: grid;
  gap: 8px;
  margin-top: 6px;
}

.vr-sidebar-nav button,
.vr-workspace-switcher,
.vr-open-source-card .vr-github-cta,
.vr-report-button,
.vr-branch-selector,
.vr-header-icon,
.vr-user-menu,
.vr-add-provider,
.vr-release-actions button,
.vr-provider-detail-panel button,
.vr-provider-dashboard,
.vr-quick-action {
  border: 1px solid var(--vr-border);
  background: rgba(7, 16, 33, 0.62);
  color: var(--vr-text);
  text-decoration: none;
  transition:
    transform 180ms cubic-bezier(0.23, 1, 0.32, 1),
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
}

.vr-sidebar-nav button {
  min-height: 42px;
  display: grid;
  grid-template-columns: 1fr;
  justify-items: center;
  align-items: center;
  border-radius: 10px;
  padding: 0;
  text-align: center;
  font-weight: 720;
}
.vr-sidebar-nav button span {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.vr-sidebar-nav button i,
.vr-header-icon i,
.vr-quick-action i,
.vr-report-button i,
.vr-branch-selector i,
.vr-add-provider i,
.vr-provider-dashboard i,
.vr-current-star i {
  width: 22px;
  height: 22px;
  display: inline-grid;
  place-items: center;
  border: 1px solid rgba(196, 181, 253, 0.28);
  border-radius: 7px;
  background:
    radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.14), transparent 34%),
    rgba(124, 58, 237, 0.1);
  color: #d8b4fe;
}

.vr-sidebar-nav button svg,
.vr-header-icon svg,
.vr-quick-action svg,
.vr-report-button svg,
.vr-branch-selector svg,
.vr-add-provider svg,
.vr-provider-dashboard svg,
.vr-current-star svg,
.vr-modal-card svg {
  width: 15px;
  height: 15px;
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.vr-sidebar-nav button.is-active {
  border-color: rgba(168, 85, 247, 0.72);
  background:
    radial-gradient(circle at 18% 50%, rgba(168, 85, 247, 0.26), transparent 38%),
    linear-gradient(90deg, rgba(124, 58, 237, 0.58), rgba(76, 29, 149, 0.18));
  box-shadow: var(--vr-glow-purple);
}

.vr-sidebar-nav button:hover,
.vr-report-button:hover,
.vr-header-icon:hover,
.vr-user-menu:hover,
.vr-release-actions button:hover,
.vr-provider-detail-panel button:hover,
.vr-provider-dashboard:hover,
.vr-quick-action:hover {
  border-color: rgba(168, 85, 247, 0.56);
  transform: translateY(-1px);
  box-shadow: 0 0 24px rgba(124, 58, 237, 0.18);
}

.vr-sidebar-nav button:active,
.vr-report-button:active,
.vr-header-icon:active,
.vr-user-menu:active,
.vr-provider-card:active,
.vr-release-card:active,
.vr-quick-action:active,
.vr-glow-button:active,
.vr-modal-action-grid button:active,
.vr-modal-button-row button:active {
  transform: scale(0.975);
}

.vr-open-source-card {
  align-self: end;
  display: grid;
  gap: 10px;
  border: 1px solid var(--vr-border);
  border-radius: 14px;
  background: rgba(8, 17, 34, 0.66);
  padding: 14px;
}

.vr-open-source-card strong { font-size: 13px; }
.vr-open-source-card p,
.vr-open-source-card small {
  margin: 0;
  color: var(--vr-muted);
  font-size: 12px;
}

.vr-open-source-card .vr-github-cta {
  width: fit-content;
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 9px;
  padding: 0 12px;
}

.vr-inline-brand-mark {
  width: 22px;
  height: 22px;
  display: inline-grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(196, 181, 253, 0.26);
  border-radius: 7px;
  background:
    radial-gradient(circle at 34% 20%, rgba(255, 255, 255, 0.16), transparent 34%),
    rgba(15, 23, 42, 0.78);
}

.vr-inline-brand-mark img {
  width: 17px;
  height: 17px;
  object-fit: contain;
  filter: drop-shadow(0 0 8px rgba(124, 58, 237, 0.32));
}

.vr-workspace-switcher > span {
  width: 28px;
  height: 28px;
  border: 2px solid rgba(2, 6, 23, 0.9);
  border-radius: 999px;
  background:
    radial-gradient(circle at 35% 28%, #f8fafc, transparent 10%),
    linear-gradient(135deg, #10b981, #7c3aed 60%, #f97316);
}

.vr-github-stat-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  color: inherit;
  text-decoration: none;
  transition:
    transform 180ms cubic-bezier(0.23, 1, 0.32, 1),
    filter 180ms ease;
}

.vr-github-stat-row:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
}

.vr-github-stat-row span {
  min-width: 0;
  border: 1px solid rgba(120, 145, 190, 0.18);
  border-radius: 9px;
  background:
    linear-gradient(180deg, rgba(124, 58, 237, 0.08), rgba(14, 165, 233, 0.04)),
    rgba(2, 6, 23, 0.34);
  padding: 7px 8px;
}

.vr-github-stat-row b,
.vr-github-stat-row em {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vr-github-stat-row b {
  color: var(--vr-text);
  font-size: 13px;
  line-height: 1.2;
}

.vr-github-stat-row em {
  color: var(--vr-muted);
  font-size: 10px;
  font-style: normal;
  line-height: 1.25;
  text-transform: uppercase;
}

.vr-github-stat-row.is-loading span {
  animation: vrSoftPulse 1.4s ease-in-out infinite;
  opacity: 0.72;
}

.vr-workspace-switcher {
  min-height: 56px;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  padding: 8px 10px;
  text-align: left;
}

.vr-workspace-switcher strong,
.vr-workspace-switcher em {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vr-workspace-switcher em {
  color: var(--vr-muted);
  font-size: 11px;
  font-style: normal;
}

.vr-report-button b,
.vr-user-menu b,
.vr-provider-detail-panel button i,
.vr-quick-action b,
.vr-glow-button i {
  width: 8px;
  height: 8px;
  border-right: 1.7px solid currentColor;
  border-bottom: 1.7px solid currentColor;
  opacity: 0.72;
  transform: rotate(45deg);
}

.vr-composed-shell {
  position: relative;
  min-width: 0;
  height: calc(100dvh - 20px);
  min-height: 760px;
  display: grid;
  grid-template-rows: 52px minmax(460px, 1fr) clamp(220px, 27dvh, 290px) 34px;
  margin: 10px 12px;
  border-radius: 16px;
  overflow: hidden;
  background:
    radial-gradient(circle at 45% 9%, rgba(124, 58, 237, 0.08), transparent 30%),
    rgba(12, 13, 16, 0.92);
}

.vr-app.is-dragging-provider .vr-composed-shell::before,
.vr-app.is-dragging-release .vr-composed-shell::before,
.vr-app.is-dragging-chat .vr-composed-shell::before {
  content: "Drop into chat";
  position: absolute;
  left: 50%;
  top: 96px;
  z-index: 60;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(196, 181, 253, 0.5);
  border-radius: 999px;
  background:
    radial-gradient(circle at 18px 50%, rgba(34, 197, 94, 0.24), transparent 22px),
    rgba(23, 25, 31, 0.98);
  color: #f8fafc;
  box-shadow:
    0 18px 48px rgba(0, 0, 0, 0.42),
    0 0 0 1px rgba(255, 255, 255, 0.04),
    0 0 30px rgba(124, 58, 237, 0.36);
  padding: 9px 14px;
  font-size: 12px;
  font-weight: 780;
  line-height: 1;
  transform: translate(-50%, -50%);
}

.vr-app.is-dragging-provider .vr-composed-shell::before {
  content: "Drop provider into chat";
}

.vr-app.is-dragging-release .vr-composed-shell::before {
  content: "Drop version into chat";
}

.vr-app.is-dragging-chat .vr-composed-shell::before {
  content: "Drop chat to split";
}

.vr-app.is-dragging-provider .vr-composed-shell::after,
.vr-app.is-dragging-release .vr-composed-shell::after,
.vr-app.is-dragging-chat .vr-composed-shell::after {
  content: "";
  position: absolute;
  left: clamp(410px, 30vw, 680px);
  top: clamp(500px, 57vh, 600px);
  z-index: 27;
  pointer-events: none;
  width: clamp(250px, 20vw, 390px);
  height: clamp(84px, 12vh, 150px);
  border-left: 2px dashed rgba(168, 85, 247, 0.64);
  border-top: 2px dashed rgba(168, 85, 247, 0.64);
  border-radius: 120px 0 0 0;
  filter: drop-shadow(0 0 10px rgba(124, 58, 237, 0.42));
  transform: skewX(-28deg) rotate(-10deg);
  animation: vrDragRoute 1500ms linear infinite;
}

.vr-studio-topbar {
  display: grid;
  grid-template-columns: auto auto minmax(150px, 190px) minmax(130px, 170px) minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  border-width: 0 0 1px;
  border-radius: 0;
  padding: 0 14px;
  background: rgba(2, 6, 23, 0.52);
}
.vr-topbar-brand {
  display: inline-grid;
  grid-auto-flow: column;
  align-items: center;
  gap: 10px;
  color: #f8fafc;
  text-decoration: none;
}
.vr-topbar-brand span {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: end center;
  overflow: hidden;
  border-radius: 12px;
  background:
    radial-gradient(circle at 42% 20%, rgba(34, 197, 94, 0.16), transparent 38%),
    radial-gradient(circle at 64% 72%, rgba(124, 58, 237, 0.36), transparent 48%),
    rgba(8, 17, 34, 0.82);
}
.vr-topbar-brand img {
  width: 38px;
  height: 38px;
  object-fit: contain;
  transform: translateY(4px);
}
.vr-topbar-brand strong {
  font-size: 18px;
  letter-spacing: 0;
}
.vr-topbar-select-wrap {
  position: relative;
  min-width: 0;
}
.vr-topbar-select {
  width: 100%;
  min-height: 34px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: 8px;
  border: 1px solid rgba(226, 232, 240, 0.12);
  border-radius: 9px;
  background: rgba(7, 16, 33, 0.56);
  color: #f8fafc;
  padding: 6px 10px;
  text-align: left;
}
.vr-topbar-select span {
  grid-column: 1;
  color: var(--vr-muted);
  font-size: 10px;
}
.vr-topbar-select strong {
  grid-column: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.vr-topbar-select strong i {
  width: 14px;
  height: 14px;
}
.vr-topbar-select strong svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.vr-topbar-select b {
  grid-column: 2;
  grid-row: 1 / span 2;
  width: 7px;
  height: 7px;
  border: solid #94a3b8;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg) translateY(-2px);
}
.vr-topbar-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 35;
  width: min(260px, 88vw);
  display: grid;
  gap: 2px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: rgba(39, 40, 41, 0.98);
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.48);
  padding: 8px;
  animation: vrMenuIn 130ms cubic-bezier(0.23, 1, 0.32, 1) both;
}
.vr-topbar-menu button {
  min-height: 34px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 16px;
  align-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #f5f5f4;
  padding: 0 9px;
  text-align: left;
}
.vr-topbar-menu button:hover {
  background: rgba(255, 255, 255, 0.08);
}
.vr-topbar-menu button span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vr-topbar-menu button b {
  width: 8px;
  height: 14px;
  justify-self: center;
  border: solid #f5f5f4;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.vr-top-stage-strip {
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  align-items: center;
  justify-self: center;
  width: min(720px, 100%);
  border: 1px solid rgba(226, 232, 240, 0.1);
  border-radius: 11px;
  background: rgba(7, 12, 24, 0.45);
  overflow: hidden;
}
.vr-top-stage-strip button {
  position: relative;
  min-width: 0;
  min-height: 38px;
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-items: center;
  gap: 0 8px;
  border: 0;
  border-right: 1px solid rgba(226, 232, 240, 0.08);
  background: transparent;
  color: #e5e7eb;
  padding: 6px 12px;
  text-align: left;
}
.vr-top-stage-strip button:last-child {
  border-right: 0;
}
.vr-top-stage-strip button:hover {
  background: rgba(255, 255, 255, 0.035);
}
.vr-top-stage-strip button.is-active {
  background:
    radial-gradient(circle at 50% 120%, rgba(124, 58, 237, 0.34), transparent 42%),
    linear-gradient(180deg, rgba(124, 58, 237, 0.22), rgba(14, 16, 24, 0.12));
  box-shadow:
    inset 0 0 0 1px rgba(168, 85, 247, 0.42),
    0 0 26px rgba(124, 58, 237, 0.24);
}
.vr-top-stage-strip span {
  grid-row: 1 / span 2;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 999px;
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 760;
}
.vr-top-stage-strip button.is-active span {
  border-color: rgba(168, 85, 247, 0.78);
  background: rgba(124, 58, 237, 0.22);
  color: #f5f3ff;
  box-shadow: 0 0 18px rgba(124, 58, 237, 0.48);
}
.vr-top-stage-strip strong,
.vr-top-stage-strip em {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vr-top-stage-strip strong {
  color: #f8fafc;
  font-size: 12px;
  font-weight: 760;
}
.vr-top-stage-strip em {
  color: #93c5fd;
  font-size: 11px;
  font-style: normal;
}
.vr-top-stage-strip button.is-active em {
  color: #c4b5fd;
}
.vr-top-stage-strip b {
  position: absolute;
  right: -5px;
  top: 50%;
  width: 10px;
  height: 10px;
  border-top: 1px solid rgba(226, 232, 240, 0.1);
  border-right: 1px solid rgba(226, 232, 240, 0.1);
  background: rgba(7, 12, 24, 0.45);
  transform: translateY(-50%) rotate(45deg);
}
.vr-top-stage-strip button:last-child b {
  display: none;
}
.vr-topbar-spacer {
  min-width: 0;
  display: flex;
  justify-content: end;
  color: #64748b;
  font-size: 12px;
  font-weight: 760;
}
.vr-top-command-strip {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}
.vr-top-command-strip::-webkit-scrollbar {
  display: none;
}
.vr-top-command-strip button,
.vr-topbar-report {
  min-height: 36px;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(226, 232, 240, 0.12);
  border-radius: 9px;
  background: rgba(10, 16, 30, 0.72);
  color: #f8fafc;
  padding: 0 12px;
  text-decoration: none;
  font-size: 12px;
  font-weight: 780;
  transition:
    transform 180ms cubic-bezier(0.23, 1, 0.32, 1),
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}
.vr-top-command-strip button:hover,
.vr-topbar-report:hover {
  border-color: rgba(168, 85, 247, 0.42);
  background: rgba(30, 24, 50, 0.84);
  transform: translateY(-1px);
}
.vr-top-command-strip button i,
.vr-topbar-report i {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(168, 85, 247, 0.26);
  border-radius: 7px;
  background: rgba(124, 58, 237, 0.14);
  color: #c4b5fd;
}
.vr-top-command-strip button svg,
.vr-topbar-report svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.vr-top-command-strip button[data-action="add-context"] {
  border-color: rgba(168, 85, 247, 0.28);
}
.vr-topbar-report {
  justify-self: end;
}
.vr-user-menu.is-compact {
  width: 42px;
  min-width: 42px;
  grid-template-columns: 1fr;
  justify-items: center;
  padding: 0;
}
.vr-user-menu.is-compact strong {
  font-size: 13px;
}

.vr-project-header {
  display: grid;
  grid-template-columns: 300px auto auto minmax(360px, 1fr);
  align-items: center;
  gap: 16px;
  border-width: 0 0 1px;
  border-radius: 0;
  padding: 0 28px;
  background: rgba(2, 6, 23, 0.5);
}

.vr-project-id {
  min-width: 0;
  width: 260px;
  max-width: 260px;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  grid-template-rows: auto auto;
  justify-content: stretch;
  gap: 2px 10px;
  align-items: center;
  border: 0;
  background: transparent;
  color: var(--vr-text);
  text-align: left;
}

.vr-project-id::before {
  content: "";
  grid-row: 1 / span 2;
  width: 16px;
  height: 14px;
  border: 1.4px solid #93c5fd;
  border-radius: 4px;
  background: rgba(147, 197, 253, 0.08);
}

.vr-project-id span {
  grid-column: 2;
  color: var(--vr-muted);
  font-size: 11px;
}

.vr-project-id strong {
  grid-column: 2;
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}
.vr-status-badge {
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
  color: var(--vr-muted);
  padding: 0 10px;
  font-size: 12px;
  font-weight: 760;
}
.vr-status-badge[data-tone="green"] {
  border-color: rgba(34, 197, 94, 0.36);
  background: rgba(34, 197, 94, 0.13);
  color: #4ade80;
}
.vr-status-badge[data-tone="red"] {
  border-color: rgba(239, 68, 68, 0.36);
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
}
.vr-status-badge[data-tone="orange"] {
  border-color: rgba(249, 115, 22, 0.4);
  background: rgba(249, 115, 22, 0.14);
  color: #fdba74;
}
.vr-status-badge[data-tone="purple"] {
  border-color: rgba(168, 85, 247, 0.46);
  background: rgba(124, 58, 237, 0.16);
  color: #c4b5fd;
}
.vr-status-badge[data-tone="blue"] {
  border-color: rgba(56, 189, 248, 0.32);
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
}

.vr-branch-selector,
.vr-report-button {
  min-height: 40px;
  display: inline-grid;
  grid-auto-flow: column;
  align-items: center;
  gap: 9px;
  border-radius: 10px;
  padding: 0 14px;
  white-space: nowrap;
}

.vr-header-actions {
  justify-self: end;
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.vr-header-icon,
.vr-user-menu {
  width: 40px;
  height: 40px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  position: relative;
}
.vr-header-icon.has-dot::after {
  content: "";
  position: absolute;
  right: 8px;
  top: 8px;
  width: 7px;
  height: 7px;
  border: 2px solid var(--vr-bg);
  border-radius: 999px;
  background: var(--vr-red);
}
.vr-user-menu {
  width: 132px;
  grid-template-columns: 38px minmax(0, 1fr) 22px 7px;
  gap: 7px;
  padding: 0 9px 0 5px;
  border-color: rgba(168, 85, 247, 0.34);
  background:
    radial-gradient(circle at 30% 22%, rgba(34, 197, 94, 0.13), transparent 34%),
    radial-gradient(circle at 76% 50%, rgba(124, 58, 237, 0.24), transparent 38%),
    rgba(7, 16, 33, 0.72);
}
.vr-user-menu span {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: end center;
  overflow: hidden;
  border: 1px solid rgba(168, 85, 247, 0.46);
  border-radius: 999px;
  background:
    radial-gradient(circle at 42% 20%, rgba(34, 197, 94, 0.18), transparent 38%),
    radial-gradient(circle at 65% 72%, rgba(124, 58, 237, 0.4), transparent 48%),
    rgba(8, 17, 34, 0.88);
  box-shadow: 0 0 18px rgba(124, 58, 237, 0.24);
}
.vr-user-menu strong {
  display: block;
  min-width: 0;
  overflow: hidden;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 850;
  line-height: 1;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vr-user-menu em {
  min-width: 22px;
  min-height: 18px;
  display: inline-grid;
  place-items: center;
  border: 1px solid rgba(168, 85, 247, 0.42);
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.18);
  color: #d8b4fe;
  font-size: 10px;
  font-style: normal;
  font-weight: 850;
}
.vr-user-menu span img {
  width: 42px;
  height: 42px;
  object-fit: contain;
  object-position: bottom;
  transform: translateY(4px);
  filter: saturate(1.2) drop-shadow(0 0 10px rgba(34, 197, 94, 0.32));
  animation: vrMascotIdle 3400ms cubic-bezier(0.23, 1, 0.32, 1) infinite;
}

.vr-composition-body {
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-columns: minmax(292px, 320px) minmax(0, 1fr) minmax(388px, 428px);
  gap: 12px;
  align-items: stretch;
  overflow: hidden;
  padding: 14px 18px 8px;
}

.vr-recent-rail {
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 10px;
  border: 1px solid rgba(226, 232, 240, 0.105);
  border-radius: 12px;
  background: rgba(19, 23, 29, 0.84);
  box-shadow: none;
  padding: 10px;
  overflow: hidden;
}
.vr-new-chat-button,
.vr-view-all-chats,
.vr-recent-chat {
  border: 1px solid rgba(148, 163, 184, 0.15);
  background: rgba(24, 24, 27, 0.62);
  color: #f8fafc;
  transition:
    transform 180ms cubic-bezier(0.23, 1, 0.32, 1),
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}
.vr-recent-chat[draggable="true"],
.vr-provider-card[draggable="true"],
.vr-release-card[draggable="true"],
.vr-release-row[draggable="true"] {
  position: relative;
  cursor: grab;
  user-select: none;
  -webkit-user-drag: element;
  touch-action: none;
}
.vr-recent-chat[draggable="true"]:active,
.vr-provider-card[draggable="true"]:active,
.vr-release-card[draggable="true"]:active,
.vr-release-row[draggable="true"]:active {
  cursor: grabbing;
}
.vr-recent-chat.is-being-dragged,
.vr-provider-card.is-being-dragged,
.vr-release-card.is-being-dragged,
.vr-release-row.is-being-dragged {
  opacity: 0.94;
  transform: scale(1.018) translateY(-4px);
  border-color: rgba(216, 180, 254, 0.82);
  background:
    radial-gradient(circle at 88% 18%, rgba(34, 197, 94, 0.16), transparent 28px),
    rgba(30, 32, 38, 0.98);
  box-shadow:
    0 0 0 1px rgba(216, 180, 254, 0.3),
    0 18px 46px rgba(0, 0, 0, 0.36),
    0 0 36px rgba(124, 58, 237, 0.34);
}
.vr-provider-card.is-being-dragged::before,
.vr-release-card.is-being-dragged::before,
.vr-release-row.is-being-dragged::before,
.vr-recent-chat.is-being-dragged::before {
  content: "Dragging to chat";
  position: absolute;
  right: 12px;
  top: -34px;
  z-index: 18;
  pointer-events: none;
  border: 1px solid rgba(216, 180, 254, 0.52);
  border-radius: 999px;
  background: rgba(25, 27, 32, 0.96);
  color: #f4f4f5;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.38), 0 0 24px rgba(124, 58, 237, 0.32);
  padding: 8px 11px;
  font-size: 11px;
  font-weight: 760;
  white-space: nowrap;
}
.vr-release-card.is-being-dragged::before,
.vr-release-row.is-being-dragged::before {
  content: "Dragging version";
}
.vr-recent-chat.is-being-dragged::before {
  content: "Dragging chat";
}
.vr-app.is-dragging .vr-provider-grid .vr-provider-card:not(.is-being-dragged),
.vr-app.is-dragging .vr-release-composition button:not(.is-being-dragged),
.vr-app.is-dragging .vr-recent-chat-list .vr-recent-chat:not(.is-being-dragged) {
  opacity: 0.45;
  filter: saturate(0.75);
}
.vr-app.is-dragging,
.vr-app.is-dragging * {
  cursor: grabbing !important;
}
html:has(.vr-app.is-dragging),
body:has(.vr-app.is-dragging) {
  cursor: grabbing !important;
}
.vr-app.is-dragging [data-chat-drop],
.vr-app.is-dragging [data-action="new-chat"] {
  cursor: copy !important;
}
.vr-drag-chip {
  position: fixed;
  left: -9999px;
  top: -9999px;
  z-index: 9999;
  min-width: 176px;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  border: 1px solid rgba(226, 232, 240, 0.22);
  border-radius: 10px;
  background: rgba(31, 32, 36, 0.98);
  color: #f8fafc;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.38);
  padding: 8px 10px;
  pointer-events: none;
}
.vr-drag-chip-mark {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(226, 232, 240, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
}
.vr-drag-chip-mark img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}
.vr-drag-chip-mark > i {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  background: rgba(148, 163, 184, 0.22);
}
.vr-drag-chip-mark .vr-version-token {
  width: 26px;
  height: 26px;
  border: 0;
  background: transparent;
}
.vr-drag-chip > div strong,
.vr-drag-chip > div span {
  display: block;
}
.vr-drag-chip > div strong {
  font-size: 12px;
  font-weight: 760;
}
.vr-drag-chip > div span {
  margin-top: 2px;
  color: #a8b3c7;
  font-size: 11px;
}
.vr-new-chat-button {
  min-height: 40px;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  border-color: rgba(168, 85, 247, 0.34);
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.86), rgba(91, 33, 182, 0.9));
  padding: 0 10px;
  text-align: left;
  font-weight: 830;
}
.vr-new-chat-button svg,
.vr-view-all-chats svg,
.vr-recent-chat svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.vr-new-chat-button kbd {
  border: 1px solid rgba(226, 232, 240, 0.12);
  border-radius: 6px;
  background: rgba(2, 6, 23, 0.5);
  color: #cbd5e1;
  padding: 2px 6px;
  font: 10px/1.2 "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
}
.vr-recent-rail h2 {
  margin: 0;
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.vr-recent-chat-list {
  min-height: 0;
  display: grid;
  align-content: start;
  gap: 6px;
  overflow: auto;
  scrollbar-width: thin;
}
.vr-recent-empty {
  margin: 0;
  border: 1px dashed rgba(148, 163, 184, 0.18);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.025);
  color: #94a3b8;
  padding: 12px;
  font-size: 12px;
  line-height: 1.45;
}
.vr-recent-chat {
  min-width: 0;
  min-height: 60px;
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  border-radius: 9px;
  padding: 8px;
  text-align: left;
}
.vr-recent-chat > i {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: rgba(124, 58, 237, 0.13);
  color: #c4b5fd;
}
.vr-recent-chat strong,
.vr-recent-chat em {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vr-recent-chat strong {
  font-size: 12px;
  font-weight: 820;
}
.vr-recent-chat em,
.vr-recent-chat small {
  color: #8b98ad;
  font-style: normal;
  font-size: 11px;
}
.vr-recent-chat small {
  align-self: start;
  padding-top: 2px;
  white-space: nowrap;
}
.vr-recent-chat:hover,
.vr-recent-chat.is-active,
.vr-new-chat-button:hover,
.vr-view-all-chats:hover {
  border-color: rgba(226, 232, 240, 0.18);
  background: rgba(35, 39, 46, 0.76);
  transform: translateY(-1px);
}
.vr-recent-chat.is-active {
  border-color: rgba(168, 85, 247, 0.46);
  box-shadow: inset 2px 0 0 rgba(168, 85, 247, 0.72);
}
.vr-view-all-chats {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 9px;
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 780;
}
.vr-view-all-chats b {
  width: 7px;
  height: 7px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(-45deg);
}

.vr-main-canvas {
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  align-content: stretch;
  gap: 10px;
}

.vr-page-title h1,
.vr-panel-head h2,
.vr-agent-hero h2,
.vr-agent-will h3,
.vr-quick-actions h3 {
  margin: 0;
}

.vr-page-title h1 {
  font-size: 23px;
  line-height: 1.1;
}
.vr-page-title p,
.vr-panel-head p {
  margin: 4px 0 0;
  color: var(--vr-muted);
}

.vr-studio-dock {
  position: relative;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.11);
  border-radius: 13px;
  background:
    radial-gradient(circle at 14% 0%, rgba(255, 255, 255, 0.035), transparent 34%),
    linear-gradient(180deg, rgba(22, 25, 31, 0.9), rgba(16, 18, 22, 0.94));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  padding: 12px;
}
.vr-studio-dock.is-running {
  border-color: rgba(249, 115, 22, 0.55);
  box-shadow: 0 0 40px rgba(249, 115, 22, 0.18);
}
.vr-studio-dock.is-verified {
  border-color: rgba(34, 197, 94, 0.46);
  box-shadow: 0 0 38px rgba(34, 197, 94, 0.15);
}
.vr-studio-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}
.vr-studio-head p,
.vr-studio-head h2 {
  margin: 0;
}
.vr-studio-head p {
  color: #d4d4d8;
  font-size: 11px;
  font-weight: 680;
}
.vr-studio-head p span {
  display: inline-grid;
  place-items: center;
  min-width: 22px;
  min-height: 18px;
  margin-left: 5px;
  border: 1px solid rgba(168, 85, 247, 0.38);
  border-radius: 999px;
  color: #c4b5fd;
  font-size: 10px;
}
.vr-studio-head h2 {
  font-size: 18px;
  line-height: 1.08;
  font-weight: 720;
}
.vr-studio-head span,
.vr-cli-strip em,
.vr-studio-terminal span,
.vr-studio-diff span {
  color: var(--vr-muted);
  font-style: normal;
}
.vr-studio-head > div:first-child > span {
  display: block;
  max-width: 620px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}
.vr-studio-tabs {
  display: inline-grid;
  grid-auto-flow: column;
  gap: 6px;
  border: 1px solid rgba(226, 232, 240, 0.1);
  border-radius: 10px;
  background: rgba(10, 10, 12, 0.36);
  padding: 3px;
}
.vr-studio-head-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.vr-studio-add-chat {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(226, 232, 240, 0.12);
  border-radius: 10px;
  background: rgba(31, 34, 40, 0.7);
  color: #f8fafc;
  padding: 0 12px 0 10px;
  font-size: 12px;
  font-weight: 760;
}
.vr-studio-add-chat:hover {
  border-color: rgba(226, 232, 240, 0.22);
  background: rgba(39, 42, 48, 0.86);
}
.vr-studio-add-chat svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.vr-studio-tabs button {
  min-height: 28px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #d4d4d8;
  padding: 0 12px;
  font-weight: 650;
}
.vr-studio-tabs button.is-active {
  border-color: rgba(226, 232, 240, 0.24);
  background: rgba(244, 244, 245, 0.1);
  color: #fff;
  box-shadow: none;
}
.vr-studio-actions {
  display: inline-grid;
  grid-auto-flow: column;
  align-items: center;
  gap: 8px;
}
.vr-studio-actions > button:not(.vr-glow-button) {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(226, 232, 240, 0.12);
  border-radius: 10px;
  background: rgba(31, 34, 40, 0.76);
  color: #f4f4f5;
  padding: 0 12px;
  font-weight: 690;
}
.vr-studio-actions svg {
  width: 16px;
  height: 16px;
}
.vr-studio-actions > button:not(.vr-glow-button) i,
.vr-chat-inline-actions i,
.vr-quick-action i {
  width: 16px;
  height: 16px;
  display: inline-grid;
  place-items: center;
  color: currentColor;
  flex: 0 0 auto;
}
.vr-studio-actions > button:not(.vr-glow-button) svg,
.vr-chat-inline-actions svg,
.vr-quick-action svg {
  width: 15px;
  height: 15px;
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.vr-cli-connect {
  display: block;
  border: 1px solid rgba(226, 232, 240, 0.14);
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(23, 25, 30, 0.78), rgba(13, 14, 17, 0.72));
  padding: 6px;
}
.vr-cli-connect-head {
  display: grid;
  gap: 2px;
  padding: 8px 10px 4px;
}
.vr-cli-connect-head strong {
  font-size: 12px;
  color: var(--vr-text);
}
.vr-cli-connect-head span {
  font-size: 11px;
  color: var(--vr-muted);
  line-height: 1.35;
}
.vr-cli-setup-steps {
  display: grid;
  gap: 10px;
}
.vr-cli-setup-step {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 10px 12px;
  border: 1px solid rgba(226, 232, 240, 0.12);
  border-radius: 12px;
  background: rgba(15, 17, 22, 0.72);
}
.vr-cli-setup-step > span {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  color: #cbd5e1;
  background: rgba(148, 163, 184, 0.14);
}
.vr-cli-setup-step pre {
  margin: 8px 0 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.72);
  overflow: auto;
}
.vr-cli-setup-step pre code {
  font-size: 11px;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-break: break-word;
}
.vr-cli-setup-step button {
  margin-top: 8px;
}
.vr-cli-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(130px, 1fr));
  gap: 6px;
}
.vr-cli-strip button {
  min-width: 0;
  min-height: 34px;
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr) minmax(58px, auto);
  grid-template-rows: auto;
  align-items: center;
  gap: 0 7px;
  border: 1px solid rgba(226, 232, 240, 0.14);
  border-radius: 10px;
  background: rgba(25, 27, 31, 0.68);
  color: var(--vr-text);
  padding: 6px 8px;
  text-align: left;
}
.vr-cli-strip button[data-connected="false"] {
  opacity: 0.68;
}
.vr-cli-strip button[data-connected="false"] > span {
  background: #64748b;
  box-shadow: none;
}
.vr-cli-strip button:hover,
.vr-cli-strip button.is-selected {
  border-color: rgba(248, 250, 252, 0.28);
  transform: translateY(-1px);
  background: rgba(31, 34, 39, 0.86);
}
.vr-cli-strip button > span {
  grid-row: 1;
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.7);
}
.vr-cli-strip button[data-tone="purple"] > span { background: #a855f7; box-shadow: 0 0 12px rgba(168, 85, 247, 0.7); }
.vr-cli-strip button[data-tone="blue"] > span { background: #38bdf8; box-shadow: 0 0 12px rgba(56, 189, 248, 0.7); }
.vr-cli-strip button[data-tone="orange"] > span { background: #f97316; box-shadow: 0 0 12px rgba(249, 115, 22, 0.7); }
.vr-cli-strip strong,
.vr-cli-strip em,
.vr-cli-strip b {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vr-cli-strip em {
  display: none;
}
.vr-cli-strip b {
  grid-column: 3;
  grid-row: 1;
  align-self: center;
  justify-self: end;
  min-width: 50px;
  border: 1px solid rgba(120, 145, 190, 0.2);
  border-radius: 999px;
  color: #c4b5fd;
  padding: 3px 7px;
  font-size: 10px;
  font-weight: 850;
  text-align: center;
}
.vr-cli-strip button.is-selected b {
  border-color: rgba(34, 197, 94, 0.44);
  background: rgba(34, 197, 94, 0.1);
  color: #86efac;
}
.vr-cli-strip button[data-connected="false"] b {
  color: #cbd5e1;
}
.vr-studio-body {
  height: 100%;
  min-height: 0;
}
.vr-studio-chat,
.vr-studio-terminal,
.vr-studio-diff {
  height: 100%;
  min-height: 150px;
  display: grid;
  border: 1px solid rgba(226, 232, 240, 0.105);
  border-radius: 12px;
  background: rgba(18, 20, 24, 0.78);
  overflow: hidden;
}
.vr-studio-chat {
  grid-template-rows: minmax(0, 1fr);
  gap: 10px;
  padding: 12px;
}
.vr-studio-terminal footer button,
.vr-studio-diff footer button {
  min-height: 32px;
  border: 1px solid rgba(168, 85, 247, 0.52);
  border-radius: 9px;
  background: rgba(124, 58, 237, 0.24);
  color: #fff;
  font-weight: 800;
}
.vr-studio-terminal,
.vr-studio-diff {
  grid-template-rows: auto minmax(0, 1fr) auto;
}
.vr-studio-terminal {
  grid-template-rows: auto minmax(0, 1fr);
  gap: 0;
  padding-bottom: 12px;
}
.vr-terminal-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 0;
  padding: 12px 12px 8px;
}
.vr-terminal-head-copy {
  display: grid;
  gap: 2px;
}
.vr-terminal-head-copy strong {
  font-size: 14px;
  color: #f8fafc;
}
.vr-terminal-head-copy span {
  color: #94a3b8;
  font-size: 11px;
}
.vr-terminal-screen {
  display: flex;
  flex-direction: column;
  min-height: 280px;
  margin: 0 12px;
  border-radius: 12px;
  background: #070b12;
  border: 1px solid rgba(148, 163, 184, 0.14);
  overflow: hidden;
}
.vr-terminal-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px 16px 10px;
}
.vr-terminal-line {
  color: #cbd5e1;
  font: 13px/1.55 "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  white-space: pre-wrap;
  word-break: break-word;
}
.vr-terminal-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(0, 0, 0, 0.28);
}
.vr-terminal-prompt {
  color: #c4b5fd;
  font: 700 13px/1 "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  user-select: none;
}
.vr-terminal-cursor-input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: #f8fafc;
  font: 13px/1.45 "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  outline: none;
  caret-color: #c4b5fd;
}
.vr-terminal-toolbar {
  padding: 10px 12px 0;
}
.vr-terminal-toolbar .vr-cli-connect-expand-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.vr-terminal-toolbar .vr-cli-action-button {
  min-width: 118px;
  white-space: nowrap;
}
.vr-terminal-toolbar .vr-cli-setup-hint {
  margin-top: 8px;
}
.vr-cli-strip button.is-needs-signin b {
  color: #fbbf24;
}
.vr-terminal-cli-chip.is-signin span {
  background: #fbbf24;
}
.vr-terminal-cli-chip.is-ready span {
  background: #22c55e;
}
.vr-studio-terminal header,
.vr-studio-diff header,
.vr-studio-terminal footer,
.vr-studio-diff footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid rgba(96, 122, 177, 0.18);
  padding: 10px 12px;
}
.vr-studio-terminal footer,
.vr-studio-diff footer {
  justify-content: end;
  border-top: 1px solid rgba(96, 122, 177, 0.18);
  border-bottom: 0;
}
.vr-studio-terminal pre,
.vr-studio-diff pre {
  margin: 0;
  overflow: auto;
  padding: 12px;
  color: #bfdbfe;
  font: 13px/1.55 "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
}
.vr-terminal-compose {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 10px;
  border-top: 1px solid rgba(96, 122, 177, 0.18);
  padding: 10px 12px;
}
.vr-terminal-compose textarea {
  min-height: 44px;
  resize: none;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.035);
  color: #e5e7eb;
  padding: 9px 10px;
  font: 13px/1.4 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  outline: none;
}
.vr-terminal-compose textarea:focus {
  border-color: rgba(168, 85, 247, 0.45);
}
.vr-terminal-compose button {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(168, 85, 247, 0.45);
  border-radius: 10px;
  background: rgba(124, 58, 237, 0.2);
  color: #fff;
  padding: 0 12px;
  font-weight: 800;
}
.vr-terminal-compose svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}
.vr-studio-diff .add { color: #86efac; }
.vr-studio-diff .del { color: #fca5a5; }

.vr-studio-chat {
  padding: 0;
}
.vr-chat-lanes {
  position: relative;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: minmax(0, 1fr);
  align-items: stretch;
  align-content: stretch;
  gap: 10px;
  justify-items: stretch;
  padding: 12px 14px;
}
.vr-app.is-dragging .vr-chat-lanes::before,
.vr-studio-chat.is-drop-preview .vr-chat-lanes::before {
  content: "";
  position: absolute;
  inset: 10px 12px;
  z-index: 4;
  pointer-events: none;
  border: 1px dashed rgba(216, 180, 254, 0.72);
  border-radius: 12px;
  background:
    radial-gradient(circle at 62% 72%, rgba(124, 58, 237, 0.14), transparent 28%),
    rgba(124, 58, 237, 0.035);
  box-shadow:
    inset 0 0 0 1px rgba(196, 181, 253, 0.12),
    inset 0 0 36px rgba(124, 58, 237, 0.1),
    0 0 44px rgba(124, 58, 237, 0.22);
  animation: vrDropPulse 1200ms ease-in-out infinite;
}
.vr-app.is-dragging .vr-chat-lanes::after,
.vr-studio-chat.is-drop-preview .vr-chat-lanes::after {
  content: "Drop into chat";
  position: absolute;
  left: 50%;
  bottom: 104px;
  z-index: 16;
  pointer-events: none;
  transform: translateX(-50%);
  border: 1px solid rgba(216, 180, 254, 0.52);
  border-radius: 999px;
  background: rgba(27, 29, 35, 0.96);
  color: #f8fafc;
  padding: 8px 13px;
  font-size: 12px;
  font-weight: 780;
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.4), 0 0 24px rgba(124, 58, 237, 0.24);
}
.vr-app.is-dragging-provider .vr-chat-lanes::after {
  content: "Drop provider to add context";
}
.vr-app.is-dragging-release .vr-chat-lanes::after {
  content: "Drop version to compare";
}
.vr-app.is-dragging-chat .vr-chat-lanes::after {
  content: "Drop chat to split workspace";
}
.vr-studio-chat.is-drop-preview .vr-chat-lanes::after {
  content: "Drop provider or version here";
}
.vr-app.is-dragging-provider .vr-studio-dock::after,
.vr-app.is-dragging-release .vr-studio-dock::after,
.vr-app.is-dragging-chat .vr-studio-dock::after {
  content: "";
  position: absolute;
  left: 31%;
  right: 23%;
  bottom: 118px;
  z-index: 3;
  pointer-events: none;
  height: 72px;
  border-left: 2px dashed rgba(168, 85, 247, 0.55);
  border-bottom: 2px dashed rgba(168, 85, 247, 0.55);
  border-radius: 0 0 0 68px;
  opacity: 0.75;
  transform: skewX(-18deg);
  filter: drop-shadow(0 0 12px rgba(124, 58, 237, 0.46));
}
.vr-studio-chat.is-split .vr-chat-lanes {
  grid-auto-flow: column;
  grid-auto-columns: minmax(420px, 1fr);
  grid-template-columns: none;
  gap: 14px;
  justify-items: stretch;
  overflow-x: auto;
  scrollbar-width: thin;
}
.vr-chat-lane {
  position: relative;
  min-width: 0;
  width: 100%;
  height: 100%;
  min-height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  border: 0;
  border-radius: 0;
  background: transparent;
  overflow: hidden;
}
.vr-studio-chat.is-split .vr-chat-lane {
  width: auto;
  border: 1px solid rgba(226, 232, 240, 0.13);
  border-radius: 12px;
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.035), transparent 34%),
    rgba(17, 19, 23, 0.74);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.035),
    0 0 0 1px rgba(0, 0, 0, 0.16);
}
.vr-studio-chat.is-split .vr-chat-lane.is-secondary::before {
  content: "";
  position: absolute;
  left: -8px;
  top: 14px;
  bottom: 14px;
  width: 1px;
  background: linear-gradient(180deg, transparent, rgba(226, 232, 240, 0.32), transparent);
  pointer-events: none;
}
.vr-studio-chat.is-split .vr-chat-transcript {
  gap: 10px;
  padding: 16px 18px 8px;
}
.vr-studio-chat.is-split .vr-chat-message > p,
.vr-studio-chat.is-split .vr-chat-copy,
.vr-studio-chat.is-split .vr-chat-mission-summary {
  padding-left: 0;
}
.vr-studio-chat.is-split .vr-chat-message p {
  font-size: 13px;
}
.vr-studio-chat.is-split .vr-chat-mission-summary section,
.vr-studio-chat.is-split .vr-chat-card {
  padding: 11px 12px;
}
.vr-studio-chat.is-split .vr-chat-mission-summary section:not(.vr-chat-plan-card):not(.vr-chat-connect-card) > span,
.vr-studio-chat.is-split .vr-chat-card-list span {
  grid-template-columns: 18px minmax(0, 1fr);
}
.vr-studio-chat.is-split .vr-chat-mission-summary b,
.vr-studio-chat.is-split .vr-chat-card-list b {
  grid-column: 2;
  justify-self: start;
}
.vr-studio-chat.is-split .vr-chat-plan-list li {
  display: block;
  grid-template-columns: none;
}
.vr-studio-chat.is-split .vr-chat-plan-list li button {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
}
.vr-studio-chat.is-split .vr-chat-inline-actions {
  flex-wrap: wrap;
  max-height: none;
  overflow: visible;
}
.vr-studio-chat.is-split .vr-chat-inline-actions button {
  flex: 0 1 auto;
  min-height: 30px;
  padding: 0 10px;
}
.vr-studio-chat.is-split .vr-chat-command-bar > .vr-chat-composer {
  grid-template-columns: minmax(0, 1fr) 38px;
}
.vr-studio-chat.is-split .vr-chat-input {
  grid-column: 1;
}
.vr-studio-chat.is-split .vr-model-picker {
  grid-column: 1 / -1;
  justify-self: start;
}
.vr-studio-chat.is-split .vr-chat-command-bar > .vr-chat-composer > button {
  grid-column: auto;
}
.vr-studio-chat.is-split .vr-chat-command-bar > .vr-chat-composer > .vr-chat-send {
  grid-column: 2;
}
.vr-chat-lane.is-primary {
  box-shadow: none;
}
.vr-studio-chat:not(.is-split) .vr-chat-lane {
  max-width: none;
}
.vr-studio-chat:not(.is-split) .vr-chat-transcript {
  padding: 18px 18px 32px;
}
.vr-studio-chat:not(.is-split) .vr-chat-message,
.vr-studio-chat:not(.is-split) .vr-chat-mission-summary {
  max-width: 760px;
}
.vr-studio-chat:not(.is-split) .vr-chat-message.is-agent {
  max-width: 720px;
}
.vr-studio-chat:not(.is-split) .vr-chat-message.is-user {
  max-width: min(620px, 74%);
  justify-self: end;
}
.vr-studio-chat:not(.is-split) .vr-chat-message.is-user > p {
  max-width: 560px;
}
.vr-studio-chat:not(.is-split) .vr-chat-message p {
  font-size: 13.5px;
  line-height: 1.45;
}
.vr-studio-chat:not(.is-split) .vr-chat-mission-summary section {
  gap: 6px;
  padding: 13px 18px;
}
.vr-studio-chat:not(.is-split) .vr-chat-mission-summary section header {
  margin-bottom: 6px;
}
.vr-studio-chat:not(.is-split) .vr-chat-mission-summary section:not(.vr-chat-plan-card):not(.vr-chat-connect-card) > span {
  min-height: 22px;
  grid-template-columns: 22px minmax(0, 1fr) auto;
}
.vr-studio-chat:not(.is-split) .vr-chat-mission-summary section:not(.vr-chat-plan-card):not(.vr-chat-connect-card) > span + span {
  margin-top: 4px;
}
.vr-studio-chat:not(.is-split) .vr-chat-mission-summary em {
  font-size: 12.5px;
}
.vr-studio-chat:not(.is-split) .vr-chat-mission-summary small {
  display: none;
}
.vr-studio-chat:not(.is-split) .vr-chat-inline-actions {
  margin-top: 0;
}
.vr-studio-chat:not(.is-split) .vr-chat-inline-actions button {
  min-height: 32px;
  padding: 0 12px;
}
.vr-studio-chat:not(.is-split) .vr-chat-command-bar {
  padding: 6px 0 0;
  align-self: end;
}
.vr-studio-chat:not(.is-split) .vr-chat-command-bar > .vr-chat-composer {
  min-height: 92px;
  border-color: rgba(226, 232, 240, 0.16);
  border-radius: 14px;
  background: #202124;
  color: #f4f4f5;
  padding: 10px 14px;
}
.vr-studio-chat:not(.is-split) .vr-provider-drop-zone > .vr-provider-drop-label {
  border-color: rgba(226, 232, 240, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: #94a3b8;
}

@media (min-width: 1800px) {
  .vr-studio-chat:not(.is-split) .vr-chat-transcript {
    position: relative;
    padding-top: 18px;
  }
  .vr-studio-chat:not(.is-split) .vr-chat-message.is-user {
    position: relative;
    top: auto;
    right: auto;
    z-index: auto;
  }
  .vr-studio-chat:not(.is-split) .vr-chat-message.is-agent,
  .vr-studio-chat:not(.is-split) .vr-chat-mission-summary {
    max-width: 760px;
  }
}
.vr-chat-transcript > header {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.13);
  background: rgba(13, 15, 19, 0.58);
  padding: 8px 12px;
}
.vr-chat-transcript > header > span {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: end center;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.18);
  border-radius: 12px;
  background: rgba(24, 24, 27, 0.9);
}
.vr-chat-transcript > header img {
  width: 39px;
  height: 39px;
  object-fit: contain;
  transform: translateY(4px);
  filter: drop-shadow(0 0 10px rgba(15, 23, 42, 0.75));
}
.vr-chat-transcript > header strong,
.vr-chat-transcript > header em {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vr-chat-transcript > header strong {
  color: #f1f5f9;
  font-size: 13px;
  font-weight: 790;
}
.vr-chat-transcript > header em {
  margin-top: 2px;
  color: var(--vr-muted);
  font-style: normal;
  font-size: 12px;
}
.vr-chat-transcript > header b {
  border: 1px solid rgba(34, 197, 94, 0.36);
  border-radius: 999px;
  color: #86efac;
  background: rgba(34, 197, 94, 0.08);
  padding: 4px 9px;
  font-size: 11px;
  text-transform: uppercase;
}
.vr-chat-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 8;
  width: 26px;
  height: 26px;
  display: inline-grid;
  place-items: center;
  border: 1px solid rgba(226, 232, 240, 0.14);
  border-radius: 8px;
  background: rgba(24, 24, 27, 0.88);
  color: #cbd5e1;
  margin-left: 0;
  transition: border-color 160ms ease, background 160ms ease, color 160ms ease, transform 160ms ease;
}
.vr-chat-close:hover {
  border-color: rgba(226, 232, 240, 0.28);
  background: rgba(39, 39, 42, 0.96);
  color: #fff;
  transform: translateY(-1px);
}
.vr-chat-close svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.vr-chat-lane > .vr-cli-connect {
  grid-row: 1;
  min-height: 0;
}
.vr-chat-lane > .vr-chat-transcript {
  grid-row: 2;
  min-height: 0;
}
.vr-chat-lane > .vr-chat-command-bar {
  grid-row: 3;
  min-height: 0;
}
.vr-chat-transcript {
  position: relative;
  min-height: 0;
  max-height: 100%;
  display: grid;
  align-content: start;
  gap: 14px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
  padding: 20px 24px 28px;
  scroll-padding-bottom: 24px;
}
.vr-chat-message {
  max-width: 760px;
  display: grid;
  gap: 5px;
}
.vr-chat-message.is-user {
  max-width: 560px;
  justify-self: end;
  justify-items: end;
  margin-top: 4px;
}
.vr-chat-message.is-user > p {
  width: fit-content;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 13px 13px 4px 13px;
  background: #f8fafc;
  color: #111827;
  padding: 9px 12px;
  text-align: left;
}
.vr-chat-message.is-user > p {
  padding-left: 12px;
}
.vr-sent-context {
  max-width: 560px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;
}
/* Agent answer layout: never apply row flex to .vr-agent-answer-body or .vr-agent-sections. */
.vr-chat-message > div:first-child {
  display: flex;
  align-items: center;
  gap: 8px;
}
.vr-chat-message > div:first-child > span {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: end center;
  overflow: hidden;
  border-radius: 9px;
  background: rgba(124, 58, 237, 0.12);
}
.vr-chat-message img {
  width: 34px;
  height: 34px;
  object-fit: contain;
  transform: translateY(4px);
}
.vr-chat-message p {
  margin: 0;
  color: #e7e7e9;
  font-size: 14px;
  line-height: 1.55;
}
.vr-chat-message > p {
  padding-left: 48px;
}
.vr-chat-message strong,
.vr-chat-message b,
.vr-chat-message em {
  display: inline;
  margin-right: 6px;
}
.vr-chat-message strong {
  color: #f4f4f5;
  font-weight: 720;
}
.vr-chat-message b {
  border: 1px solid rgba(168, 85, 247, 0.26);
  border-radius: 999px;
  background: rgba(168, 85, 247, 0.12);
  color: #c4b5fd;
  padding: 1px 5px;
  font-size: 10px;
}
.vr-chat-message em,
.vr-chat-copy {
  color: #aeb9ca;
  font-style: normal;
}
.vr-chat-message > .vr-sent-context,
.vr-chat-message > .vr-agent-response-meta,
.vr-chat-message > .vr-agent-context-line {
  width: auto;
  height: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  overflow: visible;
}
.vr-chat-message > .vr-agent-response-meta > span {
  width: auto;
  height: auto;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  place-items: initial;
  overflow: hidden;
  border-radius: 10px;
}
.vr-chat-message > .vr-agent-response-meta img,
.vr-chat-message > .vr-agent-response-meta i {
  transform: none;
}
.vr-chat-message > .vr-agent-response-meta b {
  border: 0;
  background: transparent;
  color: #94a3b8;
  padding: 0;
  font-size: 10px;
  font-weight: 720;
  text-transform: uppercase;
}
.vr-chat-message > .vr-agent-response-meta em {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
  color: #f8fafc;
  font-size: 12px;
  font-style: normal;
  font-weight: 720;
}
.vr-chat-copy {
  max-width: 720px;
  margin: 0;
  padding-left: 36px;
  font-size: 12px;
  line-height: 1.35;
}
.vr-chat-bubble {
  max-width: 560px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  background: #1d1e22;
  padding: 5px 10px;
  box-shadow: none;
}
.vr-chat-bubble.is-agent {
  max-width: 560px;
}
.vr-chat-bubble span {
  display: block;
  color: #dbe4f0;
  font-size: 11px;
  font-weight: 760;
}
.vr-chat-bubble p,
.vr-chat-bubble ul {
  margin: 3px 0 0;
  color: #f8fafc;
  line-height: 1.35;
  font-size: 13px;
}
.vr-chat-bubble ul {
  display: grid;
  gap: 5px;
  padding-left: 17px;
}
.vr-chat-bubble.is-system {
  max-width: 58%;
  border-color: rgba(226, 232, 240, 0.16);
  background: #18181b;
}
.vr-chat-note {
  max-width: 720px;
  margin: 0;
  color: #c7d2e1;
  font-size: 11px;
  line-height: 1.2;
}
.vr-chat-mission-summary {
  width: min(860px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  padding-left: 48px;
}
.vr-chat-mission-summary section {
  min-width: 0;
  display: grid;
  gap: 7px;
  border: 1px solid rgba(226, 232, 240, 0.13);
  border-radius: 12px;
  background: rgba(27, 30, 36, 0.78);
  padding: 14px 22px;
}
.vr-chat-mission-summary section header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.vr-chat-mission-summary strong {
  color: #f4f4f5;
  font-size: 14px;
  font-weight: 680;
}
.vr-chat-mission-summary section:not(.vr-chat-plan-card):not(.vr-chat-connect-card) > span,
.vr-chat-mission-summary .vr-chat-card-list > span {
  min-width: 0;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  align-items: start;
  gap: 9px;
  color: #e4e4e7;
  font-size: 12.5px;
  line-height: 1.35;
}
.vr-chat-mission-summary em,
.vr-chat-mission-summary small {
  display: block;
  min-width: 0;
  overflow: hidden;
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vr-chat-mission-summary small {
  margin-top: 2px;
  color: #aeb8c8;
  font-size: 12px;
}
.vr-chat-mission-summary i {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  font-style: normal;
  font-size: 11px;
  font-weight: 860;
}
.vr-chat-mission-summary i[data-tone="danger"] {
  border: 1px solid rgba(248, 113, 113, 0.78);
  color: #fecaca;
}
.vr-chat-mission-summary i[data-tone="danger"]::before {
  content: "×";
}
.vr-chat-mission-summary i[data-tone="step"] {
  border: 1px solid rgba(148, 163, 184, 0.28);
  color: #cbd5e1;
}
.vr-chat-mission-summary i[data-tone="warn"] {
  border: 1px solid rgba(251, 191, 36, 0.7);
  color: #fde68a;
}
.vr-chat-mission-summary i[data-tone="warn"]::before {
  content: "!";
  line-height: 1;
}
.vr-chat-mission-summary i[data-tone="danger"]::before {
  content: "x";
  line-height: 1;
}
.vr-chat-mission-summary b {
  justify-self: end;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #a78bfa;
  padding: 0;
  font-size: 12px;
  font-weight: 620;
}
.vr-chat-mission-summary > p {
  margin: 0;
  color: #e5e7eb;
  font-size: 13px;
  line-height: 1.5;
}
.vr-chat-empty-state {
  width: min(620px, calc(100% - 48px));
  display: grid;
  gap: 5px;
  margin-left: 48px;
  border: 1px dashed rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  background:
    radial-gradient(circle at 0% 0%, rgba(124, 58, 237, 0.1), transparent 34%),
    rgba(24, 27, 32, 0.48);
  color: #e5e7eb;
  padding: 14px 16px;
}
.vr-chat-empty-state strong {
  color: #f4f4f5;
  font-size: 13px;
  font-weight: 720;
}
.vr-chat-empty-state span {
  color: #aeb8c8;
  font-size: 12px;
  line-height: 1.4;
}
.vr-chat-first-connect {
  gap: 10px;
}
.vr-chat-first-connect .vr-cli-strip.is-inline {
  margin-top: 2px;
}
.vr-chat-first-connect-steps {
  display: grid;
  gap: 8px;
}
.vr-chat-first-connect-note {
  margin: 0;
  color: #cbd5e1;
  font-size: 11px;
  line-height: 1.4;
}
.vr-cli-connect-expand {
  display: grid;
  gap: 8px;
  margin-top: 8px;
  padding: 10px 12px;
  border-top: 1px solid rgba(226, 232, 240, 0.1);
}
.vr-cli-connect-expand p {
  margin: 0;
  color: #e5e7eb;
  font-size: 12px;
}
.vr-cli-connect-expand pre {
  margin: 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.72);
  overflow: auto;
}
.vr-cli-connect-expand pre code {
  font-size: 11px;
  color: #e2e8f0;
}
.vr-cli-connect-expand-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.vr-cli-action-button,
.vr-chat-first-connect .vr-cli-setup-step .vr-cli-action-button {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(226, 232, 240, 0.14);
  border-radius: 8px;
  background: rgba(24, 27, 32, 0.88);
  color: #f4f4f5;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 650;
}
.vr-cli-action-button svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex: 0 0 auto;
}
.vr-cli-action-button.is-primary,
.vr-chat-first-connect .vr-cli-setup-step .vr-glow-button {
  border-color: rgba(168, 85, 247, 0.44);
  background: rgba(124, 58, 237, 0.92);
  color: #fff;
}
.vr-cli-strip button.is-connect-target {
  border-color: rgba(248, 250, 252, 0.34);
  box-shadow: inset 0 0 0 1px rgba(248, 250, 252, 0.08);
}
.vr-cli-connect-expand em {
  color: #94a3b8;
  font-size: 11px;
  font-style: normal;
}
.vr-cli-setup-hint {
  margin: 8px 0 0;
  color: #94a3b8;
  font-size: 11px;
  line-height: 1.45;
}
.vr-cli-setup-hint code {
  color: #dbeafe;
  font-size: 11px;
}
.vr-studio-terminal-log {
  min-height: 220px;
  max-height: 360px;
  overflow: auto;
  margin: 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(2, 6, 23, 0.82);
  border: 1px solid rgba(226, 232, 240, 0.1);
}
.vr-studio-terminal-log code {
  white-space: pre-wrap;
  color: #e2e8f0;
  font-size: 12px;
  line-height: 1.45;
}
.vr-terminal-connect-actions {
  margin-top: 12px;
}
.vr-terminal-cli-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 12px;
}
.vr-terminal-cli-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(226, 232, 240, 0.14);
  background: rgba(15, 23, 42, 0.72);
  color: #e2e8f0;
  font-size: 12px;
  cursor: pointer;
}
.vr-terminal-cli-chip span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.55);
}
.vr-terminal-cli-chip.is-active {
  border-color: rgba(196, 181, 253, 0.55);
  background: rgba(88, 28, 135, 0.28);
}
.vr-terminal-cli-chip.is-active span {
  background: #c4b5fd;
}
.vr-terminal-shell textarea {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.vr-cli-os-fallback {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #94a3b8;
  font-size: 11px;
  cursor: pointer;
  text-decoration: underline;
}
.vr-cli-os-fallback svg {
  width: 12px;
  height: 12px;
}
.vr-cli-strip.is-inline {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.vr-chat-plan-row {
  width: min(860px, 100%);
  min-height: 42px;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto 18px;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(226, 232, 240, 0.12);
  border-radius: 12px;
  background: rgba(28, 31, 37, 0.7);
  color: #f8fafc;
  padding: 0 16px;
  text-align: left;
}
.vr-chat-plan-row > i {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.12);
  color: #cbd5e1;
}
.vr-chat-plan-row svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.vr-chat-plan-row strong,
.vr-chat-plan-row em {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vr-chat-plan-row strong {
  font-size: 13px;
  font-weight: 650;
}
.vr-chat-plan-row em {
  color: #c4b5fd;
  font-size: 11px;
  font-style: normal;
}
.vr-chat-plan-row b {
  width: 8px;
  height: 8px;
  border-right: 1.7px solid rgba(196, 181, 253, 0.8);
  border-bottom: 1.7px solid rgba(196, 181, 253, 0.8);
  transform: rotate(-45deg);
}
.vr-chat-card-row {
  width: min(860px, 100%);
  display: grid;
  grid-template-columns: repeat(2, minmax(230px, 1fr));
  gap: 8px;
}
.vr-chat-card-row .vr-chat-card {
  width: auto;
}
.vr-chat-card {
  width: min(610px, 72%);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(28, 29, 33, 0.88), rgba(20, 21, 25, 0.9));
  padding: 6px 10px;
}
.vr-chat-agent-task {
  position: relative;
  width: min(520px, calc(100% - 48px));
  display: grid;
  gap: 8px;
  margin-left: 48px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.13);
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(31, 34, 40, 0.86), rgba(22, 24, 29, 0.9));
  padding: 10px 12px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.035),
    0 14px 34px rgba(0, 0, 0, 0.2);
  animation: vrTaskEnter 260ms cubic-bezier(0.2, 0, 0, 1) both;
}
.vr-chat-agent-task::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(100deg, transparent 0%, rgba(255, 255, 255, 0.055) 46%, transparent 68%);
  transform: translateX(-70%);
}
.vr-chat-agent-task.is-working::before {
  animation: vrTaskSweep 1450ms cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
.vr-chat-agent-task.is-complete {
  border-color: rgba(34, 197, 94, 0.24);
  background:
    linear-gradient(180deg, rgba(24, 31, 31, 0.92), rgba(18, 22, 25, 0.94));
}
.vr-chat-agent-task header {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 18px auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}
.vr-task-glyph {
  position: relative;
  width: 14px;
  height: 14px;
  display: grid;
  place-items: center;
  color: #fb923c;
}
.vr-task-glyph::before,
.vr-task-glyph::after {
  content: "";
  position: absolute;
  inset: 6px 0;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 12px rgba(251, 146, 60, 0.58);
}
.vr-task-glyph::before {
  transform: rotate(90deg);
}
.vr-chat-agent-task.is-working .vr-task-glyph {
  animation: vrTaskGlyph 900ms ease-in-out infinite;
}
.vr-chat-agent-task.is-complete .vr-task-glyph {
  color: #22c55e;
}
.vr-chat-agent-task header strong,
.vr-chat-agent-task header em {
  display: inline;
}
.vr-chat-agent-task header strong {
  color: #fb923c;
  font-size: 15px;
  font-weight: 760;
}
.vr-chat-agent-task.is-complete header strong {
  color: #86efac;
}
.vr-chat-agent-task header em {
  margin-left: 4px;
  overflow: hidden;
  color: #9ca3af;
  font-size: 14px;
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vr-chat-agent-task header b {
  justify-self: end;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #aeb9ca;
  padding: 0;
  font-size: 11px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vr-chat-agent-task.is-complete header b {
  color: #86efac;
}
.vr-task-rail {
  position: relative;
  z-index: 1;
  height: 1px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
}
.vr-task-rail span {
  position: absolute;
  inset: 0;
  width: 36%;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, #fb923c, rgba(168, 85, 247, 0.9), transparent);
  filter: drop-shadow(0 0 10px rgba(251, 146, 60, 0.38));
  animation: vrTaskRail 1200ms cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
.vr-chat-agent-task.is-complete .vr-task-rail span {
  width: 100%;
  background: linear-gradient(90deg, #22c55e, rgba(34, 197, 94, 0.38));
  animation: none;
}
.vr-chat-agent-task > p {
  position: relative;
  z-index: 1;
  margin: 0;
  color: #aeb9ca;
  font-size: 12px;
  line-height: 1.35;
}
.vr-chat-command-bar > .vr-chat-agent-task {
  width: 100%;
  margin: 0;
  padding: 8px 10px;
  gap: 0;
  box-shadow: none;
  animation: none;
}
.vr-chat-command-bar > .vr-chat-agent-task.is-compact > p,
.vr-chat-command-bar > .vr-chat-agent-task.is-compact .vr-task-rail {
  display: none;
}
.vr-chat-command-bar > .vr-chat-agent-task.is-compact header {
  grid-template-columns: 14px minmax(0, 1fr) auto;
}
.vr-chat-command-bar > .vr-chat-agent-task.is-compact header em {
  display: inline;
  margin-left: 4px;
}
.vr-chat-agent-response {
  max-width: min(920px, 82%);
  display: grid;
  gap: 7px;
  animation: vrTaskEnter 220ms cubic-bezier(0.2, 0, 0, 1) both;
}
.vr-agent-response-meta {
  margin-left: 48px;
  max-width: min(640px, calc(100% - 48px));
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.vr-agent-thinking-label {
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(245, 158, 11, 0.16);
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.055);
  color: #f6b35c;
  padding: 3px 9px;
  font-size: 11px;
  font-weight: 680;
}
.vr-agent-thinking-label::before {
  content: "";
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: #f97316;
  box-shadow: 0 0 12px rgba(249, 115, 22, 0.4);
}
.vr-agent-context-line {
  margin-left: 48px;
  max-width: min(640px, calc(100% - 48px));
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.vr-agent-answer-text {
  max-width: min(860px, calc(100% - 48px));
  overflow: visible;
  white-space: pre-wrap;
  color: #e5e7eb;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 13.5px;
  line-height: 1.58;
}
.vr-agent-response-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-width: 0;
}
.vr-agent-response-stack .vr-chat-card {
  width: 100%;
  max-width: min(610px, 100%);
}
.vr-chat-message.is-agent .vr-agent-answer-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-width: 0;
}
.vr-agent-answer-body {
  margin-left: 48px;
  max-width: min(860px, calc(100% - 48px));
  color: #e5e7eb;
  font-size: 13.5px;
  line-height: 1.58;
}
.vr-agent-answer-structured {
  width: 100%;
  max-width: min(920px, calc(100% - 48px));
}
.vr-agent-sections {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  width: 100%;
}
.vr-agent-gate-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  background:
    radial-gradient(circle at 0% 0%, rgba(124, 58, 237, 0.1), transparent 42%),
    rgba(15, 23, 42, 0.62);
  padding: 10px 12px;
  min-width: 0;
}
.vr-agent-gate-strip svg {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  color: #c4b5fd;
}
.vr-agent-gate-strip span {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.vr-agent-gate-strip strong {
  color: #f8fafc;
  font-size: 11px;
  font-weight: 780;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.vr-agent-gate-strip em {
  color: #cbd5e1;
  font-style: normal;
  font-size: 13px;
  line-height: 1.45;
}
.vr-agent-gate-strip[data-tone="clear"] {
  border-color: rgba(34, 197, 94, 0.28);
  background:
    radial-gradient(circle at 0% 0%, rgba(34, 197, 94, 0.12), transparent 42%),
    rgba(15, 23, 42, 0.62);
}
.vr-agent-gate-strip[data-tone="clear"] svg {
  color: #86efac;
}
.vr-agent-gate-strip[data-tone="blocked"] {
  border-color: rgba(248, 113, 113, 0.28);
  background:
    radial-gradient(circle at 0% 0%, rgba(248, 113, 113, 0.1), transparent 42%),
    rgba(15, 23, 42, 0.62);
}
.vr-agent-gate-strip[data-tone="blocked"] svg {
  color: #fca5a5;
}
.vr-agent-section {
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 12px;
  background:
    radial-gradient(circle at 0% 0%, rgba(124, 58, 237, 0.08), transparent 42%),
    rgba(15, 23, 42, 0.55);
  padding: 12px 14px;
  display: grid;
  gap: 8px;
}
.vr-agent-section .vr-agent-heading {
  margin: 0;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 780;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.vr-agent-section-actions,
.vr-agent-inline-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.vr-agent-section-actions {
  margin-top: 2px;
}
.vr-agent-inline-action {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  color: #f8fafc;
  padding: 0 12px;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}
.vr-agent-inline-action.is-primary {
  border-color: rgba(168, 85, 247, 0.44);
  background: rgba(124, 58, 237, 0.24);
  color: #f5f3ff;
}
.vr-agent-inline-action i[data-icon] {
  width: 14px;
  height: 14px;
  color: currentColor;
}
.vr-agent-inline-action svg {
  width: 14px;
  height: 14px;
}
.vr-agent-muted {
  color: #94a3b8;
  font-size: 12px;
}
.vr-agent-answer-body p {
  margin: 0;
  color: #e2e8f0;
}
.vr-agent-answer-body .vr-agent-empty {
  color: #94a3b8;
}
.vr-agent-heading {
  margin: 4px 0 0;
  color: #f8fafc;
  font-size: 13px;
  font-weight: 760;
  letter-spacing: 0.01em;
}
.vr-agent-list {
  margin: 0;
  padding-left: 1.15rem;
  display: grid;
  gap: 6px;
}
.vr-agent-list li {
  color: #dbe4f0;
}
.vr-agent-list li strong,
.vr-agent-answer-body strong {
  color: #f8fafc;
  font-weight: 720;
}
.vr-agent-answer-body code {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.72);
  padding: 1px 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  color: #c4b5fd;
}
.vr-agent-code {
  margin: 0;
  max-height: 220px;
  overflow: auto;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  background: rgba(8, 15, 30, 0.92);
  padding: 10px 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.45;
  color: #dbeafe;
}
.vr-agent-followups {
  margin-left: 48px;
  max-width: min(860px, calc(100% - 48px));
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  min-width: 0;
  padding-top: 2px;
}
.vr-agent-followups button {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: #f8fafc;
  padding: 0 11px;
  font-size: 11px;
  font-weight: 700;
}
.vr-agent-followups button.is-primary {
  border-color: rgba(168, 85, 247, 0.42);
  background: rgba(124, 58, 237, 0.22);
  color: #f5f3ff;
}
.vr-agent-followups button i[data-icon] {
  width: 14px;
  height: 14px;
  color: inherit;
}
.vr-agent-followups button svg,
.vr-agent-followups button svg * {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.vr-agent-inline-action svg,
.vr-agent-inline-action svg * {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.vr-chat-agent-response.is-error .vr-agent-answer-body {
  border-left: 3px solid rgba(248, 113, 113, 0.72);
  padding-left: 12px;
}
.vr-chat-response-actions {
  padding-left: 48px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.vr-chat-response-actions button {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.035);
  color: #f8fafc;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 740;
}
.vr-chat-response-actions button:hover {
  border-color: rgba(168, 85, 247, 0.34);
  background: rgba(168, 85, 247, 0.12);
}
.vr-chat-response-actions svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.vr-chat-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}
.vr-chat-card header strong {
  color: #f1f5f9;
  font-size: 12px;
}
.vr-chat-card header b,
.vr-chat-card-list b {
  border: 1px solid rgba(168, 85, 247, 0.22);
  border-radius: 999px;
  background: rgba(168, 85, 247, 0.12);
  color: #c4b5fd;
  padding: 1px 6px;
  font-size: 9px;
  font-weight: 820;
}
.vr-chat-card-list,
.vr-chat-plan-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.vr-chat-card-list span {
  min-height: 16px;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}
.vr-chat-plan-list li {
  list-style: none;
  margin: 0;
  padding: 0;
  display: block;
}
.vr-chat-plan-list li button,
.vr-plan-step {
  width: 100%;
  min-height: 52px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 10px 12px;
  border: 1px solid rgba(226, 232, 240, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.vr-chat-plan-list li button:hover,
.vr-plan-step:hover {
  background: rgba(124, 58, 237, 0.14);
  border-color: rgba(168, 85, 247, 0.38);
}
.vr-plan-step-num {
  width: 10px;
  height: 10px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border: 1px solid rgba(168, 85, 247, 0.5);
  border-radius: 999px;
  background: rgba(168, 85, 247, 0.28);
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.22);
}
.vr-plan-step-body {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.vr-plan-step-title {
  flex: 1 1 auto;
  min-width: 0;
  color: #f8fafc;
  font-size: 13px;
  font-weight: 680;
  line-height: 1.45;
  white-space: normal;
  word-break: normal;
}
.vr-plan-step-tag {
  flex: 0 0 auto;
  border: 1px solid rgba(168, 85, 247, 0.22);
  border-radius: 999px;
  background: rgba(168, 85, 247, 0.12);
  color: #c4b5fd;
  padding: 2px 8px;
  font-size: 10px;
  font-style: normal;
  font-weight: 760;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.vr-plan-step-go {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  color: #c4b5fd;
  opacity: 1;
}
.vr-plan-step-go i[data-icon] {
  width: 16px;
  height: 16px;
  color: #c4b5fd;
}
.vr-plan-step-go svg,
.vr-plan-step-go svg * {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.vr-chat-card-list i {
  position: relative;
  width: 11px;
  height: 11px;
  border: 1px solid #f87171;
  border-radius: 999px;
}
.vr-chat-card-list i::before,
.vr-chat-card-list i::after {
  content: "";
  position: absolute;
  left: 2.5px;
  top: 5px;
  width: 5px;
  height: 1px;
  border-radius: 999px;
  background: #f87171;
}
.vr-chat-card-list i::before { transform: rotate(45deg); }
.vr-chat-card-list i::after { transform: rotate(-45deg); }
.vr-chat-card-list span[data-tone="warn"] i {
  border: 0;
  background: conic-gradient(from 30deg, transparent 0 12%, #fbbf24 0 88%, transparent 0);
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
  border-radius: 0;
}
.vr-chat-card-list span[data-tone="warn"] i::before,
.vr-chat-card-list span[data-tone="warn"] i::after {
  display: none;
}
.vr-chat-card-list em {
  min-width: 0;
  overflow: hidden;
  color: #e5e7eb;
  font-style: normal;
  font-size: 11px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vr-chat-mission-summary .vr-chat-plan-list span {
  display: revert;
  min-width: 0;
  grid-template-columns: none;
  gap: 0;
}
.vr-chat-mission-summary .vr-plan-step-num {
  display: grid;
  place-items: center;
}
.vr-chat-mission-summary .vr-plan-step-body {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.vr-chat-mission-summary .vr-plan-step-title {
  display: inline;
  flex: 1 1 12rem;
  min-width: 0;
}
.vr-chat-mission-summary .vr-plan-step-tag {
  display: inline-flex;
  width: auto;
  flex: 0 0 auto;
  align-self: center;
}
.vr-chat-mission-summary .vr-plan-step-go {
  display: grid;
  place-items: center;
}
.vr-chat-plan-list {
  counter-reset: none;
}
.vr-chat-inline-actions {
  width: auto;
  display: flex;
  flex-wrap: nowrap;
  gap: 7px;
  margin-top: 0;
  padding: 6px 0 12px;
  overflow-x: auto;
  scrollbar-width: thin;
}
.vr-chat-inline-actions button {
  flex: 0 0 auto;
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(226, 232, 240, 0.13);
  border-radius: 8px;
  background: rgba(24, 27, 32, 0.72);
  color: #f4f4f5;
  padding: 0 13px;
  font-size: 12px;
  font-weight: 710;
}
.vr-chat-inline-actions button.is-primary {
  border-color: rgba(168, 85, 247, 0.44);
  background: #7c3aed;
  color: #fff;
}
.vr-chat-inline-actions button.is-muted {
  opacity: 0.72;
  font-weight: 650;
}
.vr-chat-inline-actions button span {
  white-space: nowrap;
  max-width: 9.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vr-chat-inline-actions button:first-child:not(.is-primary) {
  border-color: rgba(226, 232, 240, 0.13);
  background: rgba(24, 27, 32, 0.72);
  color: #f4f4f5;
}
.vr-chat-bubble.is-user {
  justify-self: end;
  border-color: rgba(248, 250, 252, 0.62);
  background: #f8fafc;
}
.vr-chat-bubble.is-user span {
  color: #334155;
}
.vr-chat-bubble.is-user p {
  color: #020617;
}
.vr-chat-result {
  display: inline-grid;
  grid-template-columns: 16px auto auto;
  align-items: center;
  gap: 8px;
  width: fit-content;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.86);
  color: #e2e8f0;
  padding: 7px 12px;
}
.vr-chat-result span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #94a3b8;
  box-shadow: 0 0 10px rgba(148, 163, 184, 0.45);
}
.vr-chat-result em {
  color: var(--vr-muted);
  font-style: normal;
}
.vr-chat-result.is-done {
  border-color: rgba(34, 197, 94, 0.42);
  background: rgba(34, 197, 94, 0.1);
}
.vr-chat-result.is-done span {
  background: #22c55e;
  box-shadow: 0 0 14px rgba(34, 197, 94, 0.8);
}
.vr-chat-command-bar {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 6px;
  align-items: center;
  border-top: 1px dashed rgba(148, 163, 184, 0.13);
  background: linear-gradient(180deg, rgba(18, 20, 24, 0), rgba(18, 20, 24, 0.92) 18%);
  padding: 8px 10px 10px;
}
.vr-chat-command-bar > button,
.vr-chat-command-bar > div {
  min-height: 34px;
  border: 1px solid rgba(226, 232, 240, 0.12);
  border-radius: 10px;
  background: rgba(31, 34, 40, 0.72);
  color: #f8fafc;
  font-weight: 650;
}
.vr-chat-command-bar > button:hover {
  border-color: rgba(248, 250, 252, 0.32);
  background: rgba(39, 39, 42, 0.96);
}
.vr-chat-command-bar > .vr-chat-composer {
  grid-column: 1 / -1;
  min-height: 104px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 38px;
  grid-template-rows: minmax(38px, 1fr) auto;
  gap: 10px;
  align-items: end;
  border-color: rgba(148, 163, 184, 0.22);
  border-radius: 12px;
  background:
    radial-gradient(circle at 18% 0%, rgba(148, 163, 184, 0.055), transparent 34%),
    #1f2024;
  color: #f8fafc;
  padding: 12px 14px;
}
.vr-chat-input {
  grid-column: 1 / 3;
  grid-row: 1;
  align-self: stretch;
  width: 100%;
  min-width: 0;
  min-height: 38px;
  border: 0;
  outline: 0;
  resize: none;
  background: transparent;
  color: #f8fafc;
  padding: 0;
  font: inherit;
  font-size: 13.5px;
  font-weight: 520;
  line-height: 1.45;
  caret-color: #f8fafc;
}
.vr-chat-input::placeholder {
  color: #a1a8b3;
}
.vr-chat-input:focus {
  outline: 0;
}
.vr-chat-command-bar > .vr-chat-composer > span {
  align-self: start;
  overflow: hidden;
  color: #a1a8b3;
  font-size: 13px;
  font-weight: 520;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vr-provider-drop-zone {
  grid-column: 1;
  min-width: 0;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  color: #8b98ad;
  font-size: 11px;
}
.vr-provider-drop-zone > .vr-provider-drop-label {
  border: 1px dashed rgba(148, 163, 184, 0.22);
  border-radius: 999px;
  background: rgba(2, 6, 23, 0.2);
  padding: 5px 10px;
}
.vr-provider-drop-zone.is-active > .vr-provider-drop-label {
  border-color: rgba(34, 197, 94, 0.62);
  background: rgba(34, 197, 94, 0.1);
  color: #86efac;
  box-shadow: 0 0 18px rgba(34, 197, 94, 0.18);
}
.vr-app.is-dragging .vr-chat-command-bar > .vr-chat-composer,
.vr-studio-chat.is-drop-preview .vr-chat-command-bar > .vr-chat-composer {
  border-color: rgba(216, 180, 254, 0.72);
  box-shadow:
    inset 0 0 0 1px rgba(168, 85, 247, 0.18),
    0 0 0 1px rgba(216, 180, 254, 0.08),
    0 0 42px rgba(124, 58, 237, 0.28);
}
.vr-studio-chat.is-drop-preview .vr-chat-command-bar::before {
  content: "Database\\A PostgreSQL";
  position: absolute;
  right: 150px;
  top: 36px;
  z-index: 6;
  width: 154px;
  min-height: 54px;
  display: grid;
  align-content: center;
  border: 1px solid rgba(226, 232, 240, 0.22);
  border-radius: 10px;
  background:
    radial-gradient(circle at 18px 20px, rgba(34, 197, 94, 0.26), transparent 20px),
    rgba(27, 30, 36, 0.98);
  color: #f8fafc;
  padding: 8px 12px 8px 50px;
  white-space: pre;
  font-size: 12px;
  font-weight: 760;
  line-height: 1.35;
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.42), 0 0 26px rgba(124, 58, 237, 0.18);
}
.vr-studio-chat.is-drop-preview .vr-chat-command-bar::after {
  content: "";
  position: absolute;
  right: 246px;
  top: 16px;
  z-index: 5;
  width: 180px;
  height: 84px;
  border-left: 2px dashed rgba(168, 85, 247, 0.58);
  border-bottom: 2px dashed rgba(168, 85, 247, 0.58);
  border-radius: 0 0 0 76px;
  transform: skewX(-24deg);
  pointer-events: none;
  filter: drop-shadow(0 0 10px rgba(124, 58, 237, 0.4));
}
.vr-app.is-dragging .vr-provider-drop-zone > .vr-provider-drop-label,
.vr-studio-chat.is-drop-preview .vr-provider-drop-zone > .vr-provider-drop-label {
  border-color: rgba(168, 85, 247, 0.54);
  background: rgba(124, 58, 237, 0.12);
  color: #d8b4fe;
}
.is-drop-active .vr-provider-drop-zone > .vr-provider-drop-label,
.vr-provider-drop-zone.is-drop-active > .vr-provider-drop-label {
  border-color: rgba(34, 197, 94, 0.62);
  background: rgba(34, 197, 94, 0.1);
  color: #86efac;
  box-shadow: 0 0 18px rgba(34, 197, 94, 0.18);
}
.vr-provider-drop-zone.has-provider > .vr-provider-drop-label {
  display: none;
}
.vr-context-chip {
  min-width: 0;
  max-width: min(300px, 100%);
  height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  background: rgba(36, 37, 41, 0.92);
  color: #f8fafc;
  padding: 0 4px 0 6px;
}
.vr-context-chip.is-readonly {
  padding: 0 8px 0 6px;
}
.vr-sent-context .vr-context-chip,
.vr-agent-context-line .vr-context-chip {
  max-width: min(360px, 100%);
}
.vr-sent-context .vr-context-chip-icon img,
.vr-agent-context-line .vr-context-chip-icon img {
  transform: none;
}
.vr-context-chip-icon {
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  overflow: hidden;
}
.vr-context-chip-icon img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}
.vr-context-chip-icon .vr-context-icon-chip {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}
.vr-context-chip-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}
.vr-context-chip-label .muted {
  color: #94a3b8;
  font-weight: 500;
}
.vr-context-chip-remove {
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #8f98a8;
  padding: 0;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
.vr-context-chip-remove:hover {
  background: rgba(255, 255, 255, 0.075);
  color: #f8fafc;
}
.vr-version-token {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  color: #c4b5fd;
}
.vr-version-token svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.vr-chat-command-bar > .vr-chat-composer > button {
  grid-row: 1 / span 2;
  align-self: center;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: #f8fafc;
  color: #020617;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.28);
}
.vr-chat-command-bar > .vr-chat-composer > .vr-chat-send {
  grid-column: 3;
}
.vr-chat-command-bar > .vr-chat-composer > .vr-chat-send.is-stop {
  background: #f8fafc;
  color: #020617;
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow: 0 0 0 4px rgba(248, 250, 252, 0.08), 0 10px 26px rgba(0, 0, 0, 0.34);
}
.vr-chat-command-bar > .vr-chat-composer > button svg {
  width: 17px;
  height: 17px;
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.vr-chat-command-bar > .vr-chat-composer > .vr-chat-send.is-stop i[data-icon] {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.vr-chat-command-bar > .vr-chat-composer > .vr-chat-send.is-stop svg {
  width: 14px;
  height: 14px;
  display: block;
  fill: currentColor;
  stroke: none;
}
.vr-chat-command-bar > .vr-chat-composer > .vr-chat-send.is-stop svg * {
  fill: currentColor;
  stroke: none;
}
.vr-chat-command-bar > button[data-action="start-agent-fix"],
.vr-chat-command-bar > button[data-action="verify-now"] {
  border-color: rgba(168, 85, 247, 0.38);
  background: rgba(124, 58, 237, 0.18);
  color: #ede9fe;
}
.vr-chat-command-bar > button[data-action="start-agent-fix"]:hover,
.vr-chat-command-bar > button[data-action="verify-now"]:hover {
  border-color: rgba(168, 85, 247, 0.58);
  background: rgba(124, 58, 237, 0.28);
}
.vr-model-picker {
  position: relative;
  display: inline-grid;
  grid-auto-flow: column;
  gap: 6px;
  align-items: center;
  grid-column: 2;
  grid-row: 2;
}
.vr-model-picker > button {
  min-height: 28px;
  display: grid;
  grid-template-columns: minmax(0, auto) auto 8px;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 8px;
  background: rgba(39, 40, 44, 0.92);
  color: #f8fafc;
  padding: 0 9px;
  font-weight: 640;
  box-shadow: none;
}
.vr-model-picker > button span {
  color: #8f98a8;
  font-size: 10px;
  font-weight: 620;
}
.vr-model-picker > button strong {
  max-width: 112px;
  color: #f4f4f5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 720;
}
.vr-model-picker > button i {
  width: 7px;
  height: 7px;
  border: solid #a7b0c0;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg) translateY(-2px);
}
.vr-model-picker > button:hover {
  border-color: rgba(226, 232, 240, 0.22);
  background: rgba(47, 48, 52, 0.96);
}
.vr-model-menu {
  position: absolute;
  right: 0;
  bottom: calc(100% + 8px);
  z-index: 30;
  min-width: 250px;
  max-height: 320px;
  overflow: auto;
  display: grid;
  gap: 2px;
  border: 1px solid rgba(226, 232, 240, 0.14);
  border-radius: 10px;
  background: #242528;
  color: #f5f5f4;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.36);
  padding: 6px;
  color-scheme: dark;
}
.vr-model-menu.is-reasoning {
  left: 0;
  right: auto;
}
.vr-model-menu.is-models {
  left: 96px;
  right: auto;
}
.vr-model-menu.is-context {
  right: 0;
}
.vr-model-menu.is-access {
  right: 0;
  min-width: 270px;
}
.vr-studio-chat.is-split .vr-model-menu {
  bottom: calc(100% + 10px);
  min-width: min(245px, calc(100vw - 32px));
}
.vr-studio-chat.is-split .vr-model-menu.is-reasoning {
  left: 0;
  right: auto;
}
.vr-studio-chat.is-split .vr-model-menu.is-models {
  left: 86px;
  right: auto;
}
.vr-studio-chat.is-split .vr-model-menu.is-context {
  left: auto;
  right: 0;
}
.vr-studio-chat.is-split .vr-model-menu.is-access {
  left: auto;
  right: 0;
}
.vr-model-menu p {
  margin: 2px 4px 6px;
  color: #a8a29e;
  font-size: 12px;
}
.vr-model-menu button {
  min-height: 30px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 14px;
  align-items: center;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #f5f5f4;
  padding: 0 8px;
  text-align: left;
  font-family: inherit;
}
.vr-model-menu button span,
.vr-model-menu button strong,
.vr-model-menu button em {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vr-model-menu button strong {
  color: #f5f5f4;
  font-size: 13px;
  font-weight: 650;
}
.vr-model-menu button em {
  margin-top: 1px;
  color: #a8a29e;
  font-size: 11px;
  font-style: normal;
}
.vr-model-menu button:hover {
  background: rgba(255, 255, 255, 0.075);
}
.vr-model-menu button b {
  width: 8px;
  height: 14px;
  border: solid #f5f5f4;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.vr-providers-panel,
.vr-releases-panel {
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  border: 1px solid rgba(226, 232, 240, 0.095);
  border-radius: 12px;
  padding: 10px;
  background: rgba(18, 22, 28, 0.74);
}
.vr-providers-panel {
  border-color: rgba(34, 197, 94, 0.28);
  background:
    radial-gradient(circle at 8% 12%, rgba(34, 197, 94, 0.075), transparent 28%),
    linear-gradient(180deg, rgba(18, 23, 29, 0.8), rgba(15, 18, 23, 0.76));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.025),
    0 0 0 1px rgba(34, 197, 94, 0.08),
    0 0 46px rgba(34, 197, 94, 0.11);
}
.vr-releases-panel {
  border-color: rgba(168, 85, 247, 0.3);
  background:
    radial-gradient(circle at 8% 8%, rgba(124, 58, 237, 0.11), transparent 26%),
    linear-gradient(180deg, rgba(18, 22, 30, 0.8), rgba(14, 17, 24, 0.76));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.025),
    0 0 0 1px rgba(168, 85, 247, 0.08),
    0 0 52px rgba(124, 58, 237, 0.14);
}
.vr-bottom-inventory {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(360px, 0.95fr);
  gap: 10px;
  align-items: stretch;
  overflow: visible;
  margin-top: 0;
  padding: 0 18px 8px;
}
.vr-bottom-inventory .vr-panel-head {
  align-items: center;
  margin-bottom: 6px;
}
.vr-add-provider-inline {
  flex: 0 0 auto;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(34, 197, 94, 0.24);
  border-radius: 9px;
  background: rgba(22, 163, 74, 0.075);
  color: #d1fae5;
  padding: 0 11px;
  font-size: 12px;
  font-weight: 690;
}
.vr-add-provider-inline:hover {
  border-color: rgba(34, 197, 94, 0.42);
  background: rgba(22, 163, 74, 0.13);
}
.vr-add-provider-inline svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.vr-bottom-inventory .vr-panel-head h2 {
  font-size: 17px;
  font-weight: 760;
}
.vr-bottom-inventory .vr-panel-head p {
  font-size: 11px;
}
.vr-bottom-inventory .vr-provider-composition {
  grid-template-columns: 1fr;
  min-height: 0;
  height: 100%;
}
.vr-bottom-inventory .vr-provider-detail-panel {
  display: none;
}
.vr-bottom-inventory .vr-provider-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px 8px;
  grid-auto-rows: minmax(48px, 1fr);
  min-height: 0;
  height: 100%;
}
.vr-bottom-inventory .vr-provider-card {
  min-height: 48px;
  grid-template-columns: 34px minmax(0, 1fr) 18px 22px;
  grid-template-rows: 1fr;
  align-items: center;
  gap: 8px;
  border-color: rgba(226, 232, 240, 0.085);
  background: rgba(25, 29, 35, 0.62);
  padding: 6px 9px;
}
.vr-bottom-inventory .vr-provider-card:hover,
.vr-bottom-inventory .vr-provider-card.is-selected {
  border-color: rgba(226, 232, 240, 0.15);
  background: rgba(30, 34, 41, 0.68);
  box-shadow: none;
}
.vr-bottom-inventory .vr-provider-card div {
  padding-right: 0;
}
.vr-bottom-inventory .vr-provider-token {
  width: 30px;
  height: 30px;
}
.vr-bottom-inventory .vr-provider-token img {
  width: 24px;
  height: 24px;
}
.vr-bottom-inventory .vr-provider-proof-chip {
  position: static;
  grid-column: 4;
  justify-self: end;
  width: 20px;
  height: 24px;
  min-height: 24px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  padding: 0;
  transform: none;
}
.vr-bottom-inventory .vr-provider-proof-chip span {
  display: none;
}
.vr-bottom-inventory .vr-provider-proof-chip i {
  display: grid;
  place-items: center;
  color: inherit;
}
.vr-bottom-inventory .vr-provider-proof-chip svg {
  width: 15px;
  height: 15px;
  stroke: currentColor;
  stroke-width: 2.35;
}
.vr-bottom-inventory .vr-provider-proof-chip svg * {
  fill: none !important;
  stroke: currentColor !important;
}
.vr-bottom-inventory .vr-provider-card .vr-status-badge {
  grid-column: 3;
  min-height: 18px;
  padding: 2px 7px;
  font-size: 10px;
}
.vr-bottom-inventory .vr-provider-card:hover .vr-provider-proof-chip,
.vr-bottom-inventory .vr-provider-card.is-selected .vr-provider-proof-chip {
  color: #e2e8f0;
}
.vr-bottom-inventory .vr-release-track {
  display: none;
}
.vr-bottom-inventory .vr-release-card {
  min-height: 52px;
  border-color: rgba(226, 232, 240, 0.105);
  background: rgba(29, 33, 40, 0.72);
  padding: 8px 10px;
}
.vr-release-composition {
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-columns: minmax(180px, 0.92fr) minmax(210px, 1.08fr);
  gap: 10px;
}
.vr-release-current {
  min-height: 100%;
  align-content: center;
  border-color: rgba(168, 85, 247, 0.28);
}
.vr-release-current span {
  margin-top: 8px;
  color: #22c55e;
  font-size: 12px;
}
.vr-release-list {
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: auto repeat(3, minmax(34px, 1fr));
  gap: 0;
  border: 1px solid rgba(226, 232, 240, 0.085);
  border-radius: 10px;
  background: rgba(25, 29, 35, 0.42);
  padding: 7px 10px;
}
.vr-release-list header,
.vr-release-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
}
.vr-release-list header {
  min-height: 24px;
  color: #f4f4f5;
}
.vr-release-list header strong {
  font-size: 12px;
  font-weight: 650;
}
.vr-release-list header button {
  border: 0;
  background: transparent;
  color: #a78bfa;
  font-size: 11px;
}
.vr-release-row {
  min-height: 38px;
  border: 0;
  border-top: 1px solid rgba(226, 232, 240, 0.065);
  background: transparent;
  color: #f4f4f5;
  padding: 5px 0;
  text-align: left;
}
.vr-release-row strong,
.vr-release-row em,
.vr-release-row small {
  display: block;
}
.vr-release-row strong {
  font-size: 13px;
  font-weight: 620;
}
.vr-release-row em {
  color: #22c55e;
  font-size: 11px;
  font-style: normal;
}
.vr-release-row small {
  color: var(--vr-muted);
  font-size: 11px;
}
.vr-bottom-inventory .vr-release-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}
.vr-bottom-inventory .vr-release-actions button {
  min-width: 0;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(226, 232, 240, 0.105);
  border-radius: 8px;
  background: rgba(31, 34, 40, 0.58);
  color: #e4e4e7;
  font-size: 12px;
  font-weight: 560;
}
.vr-bottom-inventory .vr-release-actions button:last-child {
  color: #f87171;
}
.vr-bottom-inventory .vr-release-actions svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.vr-bottom-inventory .vr-timeline-rail {
  display: none;
}

.vr-panel-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 6px;
}
.vr-panel-head h2 { font-size: 21px; }

.vr-add-provider {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  border-radius: 999px;
  padding: 0 14px 0 10px;
  font-weight: 780;
}
.vr-add-provider > span,
.vr-provider-add-card > span {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(196, 181, 253, 0.36);
  border-radius: 999px;
}
.vr-add-provider > span::before,
.vr-add-provider > span::after {
  content: "";
  grid-area: 1 / 1;
  width: 9px;
  height: 1.8px;
  border-radius: 999px;
  background: #d8b4fe;
}
.vr-add-provider > span::after {
  transform: rotate(90deg);
}
.vr-provider-picker {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  margin: -2px 0 12px;
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 12px;
  background:
    radial-gradient(circle at 10% 20%, rgba(124, 58, 237, 0.24), transparent 42%),
    rgba(7, 16, 33, 0.78);
  padding: 10px 12px;
}
.vr-provider-picker strong,
.vr-provider-picker span {
  display: block;
}
.vr-provider-picker span {
  color: var(--vr-muted);
  font-size: 12px;
}
.vr-provider-picker-list {
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: 7px;
}
.vr-provider-picker-list button {
  position: relative;
  min-width: 0;
  min-height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(120, 145, 190, 0.18);
  border-radius: 10px;
  background: rgba(2, 6, 23, 0.44);
  color: var(--vr-text);
  transition:
    transform 180ms cubic-bezier(0.23, 1, 0.32, 1),
    border-color 180ms ease,
    box-shadow 180ms ease;
}
.vr-provider-picker-list button:hover {
  border-color: rgba(168, 85, 247, 0.56);
  transform: translateY(-2px);
  box-shadow: 0 0 18px rgba(124, 58, 237, 0.24);
}
.vr-provider-picker-list button > span:not(.vr-provider-token) {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.vr-provider-composition {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 272px;
  gap: 10px;
}
.vr-provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(168px, 1fr));
  gap: 8px;
}

.vr-provider-card {
  position: relative;
  min-height: 92px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  grid-template-rows: 1fr auto;
  gap: 8px 10px;
  border: 1px solid rgba(226, 232, 240, 0.13);
  border-radius: 9px;
  background:
    linear-gradient(180deg, rgba(25, 28, 34, 0.78), rgba(17, 19, 24, 0.82));
  color: var(--vr-text);
  padding: 10px;
  text-align: left;
  transition:
    transform 180ms cubic-bezier(0.23, 1, 0.32, 1),
    border-color 180ms ease,
    background 180ms ease;
}
.vr-provider-card:hover,
.vr-provider-card.is-selected {
  border-color: rgba(148, 163, 184, 0.28);
  background:
    linear-gradient(180deg, rgba(30, 33, 39, 0.9), rgba(20, 22, 27, 0.9));
  box-shadow: none;
  transform: translateY(-1px);
}
.vr-provider-token {
  position: relative;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.11);
  border-radius: 11px;
  background: rgba(36, 38, 43, 0.76);
  box-shadow: none;
}
.vr-provider-token::after {
  display: none;
}
.vr-provider-token img {
  position: relative;
  z-index: 1;
  width: 26px;
  height: 26px;
  object-fit: contain;
  filter: saturate(1.04) contrast(1.02);
  transition: transform 180ms cubic-bezier(0.23, 1, 0.32, 1);
}
.vr-provider-token .provider-logo__img {
  filter: saturate(1.22) contrast(1.14);
}
.vr-provider-token .provider-logo__img[data-provider-logo-key="github"],
.vr-provider-token .provider-logo__img[data-provider-logo-key="vercel"],
.vr-provider-token .provider-logo__img[data-provider-logo-key="resend"] {
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.18));
}
.vr-provider-token .provider-logo__img[data-provider-logo-key="sentry"] {
  filter: saturate(1.34) contrast(1.16) drop-shadow(0 0 9px rgba(139, 92, 246, 0.26));
}
.vr-provider-token svg {
  position: relative;
  z-index: 1;
  width: 26px;
  height: 26px;
  display: block;
}
.vr-provider-token .vr-provider-logo,
.vr-provider-token .vr-provider-logo img {
  width: 26px;
  height: 26px;
  display: block;
  object-fit: contain;
}
.vr-provider-card:hover .vr-provider-token img,
.vr-provider-card.is-selected .vr-provider-token img,
.vr-provider-card:hover .vr-provider-token svg,
.vr-provider-card.is-selected .vr-provider-token svg {
  transform: scale(1.08);
}
.vr-provider-token.is-picker {
  width: 32px;
  height: 32px;
  border-radius: 10px;
}
.vr-provider-token.is-picker img {
  width: 21px;
  height: 21px;
}
.vr-provider-token.is-large {
  width: 54px;
  height: 54px;
  border-radius: 14px;
}
.vr-provider-token.is-large img {
  width: 34px;
  height: 34px;
}
.vr-provider-token.is-large svg,
.vr-provider-token.is-large .vr-provider-logo,
.vr-provider-token.is-large .vr-provider-logo img {
  width: 34px;
  height: 34px;
}
.vr-provider-card small,
.vr-provider-card strong,
.vr-provider-card em,
.vr-provider-proof-chip {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vr-provider-card small {
  color: #f4f4f5;
  font-size: 11px;
  font-weight: 650;
  line-height: 1.18;
  white-space: nowrap;
}
.vr-provider-card strong {
  margin-top: 2px;
  font-size: 12px;
  font-weight: 520;
  color: #c7cdd6;
}
.vr-provider-card em {
  color: #22c55e;
  font-style: normal;
  font-size: 11px;
  font-weight: 520;
}
.vr-provider-card[data-provider-tone="orange"] em {
  color: #fbbf24;
}
.vr-provider-card[data-provider-tone="red"] em {
  color: #fb7185;
}
.vr-provider-card[data-provider-tone="neutral"] em {
  color: #aeb7c6;
}
.vr-provider-proof-chip {
  grid-column: 1 / -1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  place-items: center;
  justify-self: stretch;
  min-height: 26px;
  border: 1px solid rgba(226, 232, 240, 0.13);
  border-radius: 8px;
  background: rgba(10, 10, 12, 0.62);
  color: #e5e7eb;
  font-size: 11px;
  font-weight: 760;
}
.vr-provider-proof-chip span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vr-provider-card:hover .vr-provider-proof-chip,
.vr-provider-card.is-selected .vr-provider-proof-chip {
  border-color: rgba(248, 250, 252, 0.22);
  background: rgba(2, 6, 23, 0.72);
}
.vr-provider-proof-chip svg {
  width: 13px;
  height: 13px;
  stroke: currentColor;
}
.vr-provider-mcp-chip {
  grid-column: 2;
  grid-row: 2;
  justify-self: end;
  min-width: 0;
  width: 8px;
  height: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  border: 0;
  border-radius: 999px;
  padding: 0;
  color: #fbbf24;
  font-size: 10px;
  font-weight: 720;
  line-height: 1;
  background: transparent;
}
.vr-provider-mcp-chip i {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.36);
  animation: vrStatusPulse 2.7s ease-in-out infinite;
}
.vr-provider-mcp-chip span {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.vr-provider-mcp-chip.is-connected {
  border-color: transparent;
  background: transparent;
  color: #bbf7d0;
}
.vr-provider-mcp-chip.is-connected i {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.42);
}
@keyframes vrStatusPulse {
  0%, 100% {
    opacity: 0.72;
    transform: scale(0.92);
  }
  50% {
    opacity: 1;
    transform: scale(1.08);
  }
}
.vr-provider-mcp-panel {
  display: grid;
  gap: 10px;
  border: 1px solid rgba(148, 163, 184, 0.13);
  border-radius: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.035);
}
.vr-provider-mcp-panel header {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}
.vr-provider-mcp-panel header > span {
  width: 30px;
  height: 30px;
  display: inline-grid;
  place-items: center;
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.11);
  color: #fbbf24;
}
.vr-provider-mcp-panel strong,
.vr-provider-mcp-panel em {
  display: block;
  min-width: 0;
}
.vr-provider-mcp-panel strong {
  color: #f8fafc;
  font-size: 13px;
}
.vr-provider-mcp-panel em {
  margin-top: 2px;
  color: #98a2b3;
  font-size: 11px;
  font-style: normal;
}
.vr-provider-mcp-panel > div {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.vr-provider-mcp-panel small {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.13);
  padding: 4px 7px;
  color: #b9c2cf;
  font-size: 10px;
  font-weight: 680;
}
.vr-provider-mcp-panel.is-connected {
  border-color: rgba(34, 197, 94, 0.24);
  background: rgba(34, 197, 94, 0.055);
}
.vr-provider-mcp-panel.is-connected header > span {
  background: rgba(34, 197, 94, 0.12);
  color: #86efac;
}
.vr-bottom-inventory .vr-provider-mcp-chip {
  grid-column: 3;
  grid-row: 1;
  justify-self: end;
  min-width: 0;
  width: 8px;
  height: 8px;
  padding: 0;
  font-size: 0;
}
.vr-bottom-inventory .vr-provider-proof-chip {
  grid-column: 4;
  justify-self: end;
  width: 20px;
  height: 24px;
  min-height: 24px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  padding: 0;
  transform: none;
}
.vr-bottom-inventory .vr-provider-proof-chip span {
  display: none;
}
.vr-bottom-inventory .vr-provider-proof-chip svg {
  width: 15px;
  height: 15px;
  stroke-width: 2.35;
}
.vr-bottom-inventory .vr-provider-card:hover .vr-provider-proof-chip,
.vr-bottom-inventory .vr-provider-card.is-selected .vr-provider-proof-chip {
  background: transparent;
  color: #e2e8f0;
}
.vr-provider-add-card {
  position: relative;
  min-height: 64px;
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  border: 1px dashed rgba(226, 232, 240, 0.16);
  border-radius: 9px;
  background: rgba(29, 33, 40, 0.46);
  color: var(--vr-muted);
  padding: 9px 12px;
  text-align: left;
  transition:
    transform 180ms cubic-bezier(0.23, 1, 0.32, 1),
    border-color 180ms ease,
    background 180ms ease;
}
.vr-provider-add-card:hover {
  border-color: rgba(226, 232, 240, 0.28);
  background: rgba(35, 39, 46, 0.72);
  transform: translateY(-1px);
}
.vr-provider-add-card > span:first-child {
  position: relative;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(226, 232, 240, 0.12);
  border-radius: 11px;
  background: rgba(36, 38, 43, 0.62);
}
.vr-provider-add-card > span:first-child::before,
.vr-provider-add-card > span:first-child::after {
  content: "";
  grid-area: 1 / 1;
  width: 18px;
  height: 1.5px;
  border-radius: 999px;
  background: #a1a1aa;
}
.vr-provider-add-card > span:first-child::after {
  transform: rotate(90deg);
}
.vr-provider-add-card small,
.vr-provider-add-card strong,
.vr-provider-add-card em {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vr-provider-add-card small {
  color: #f4f4f5;
  font-size: 11px;
  font-weight: 650;
}
.vr-provider-add-card strong {
  margin-top: 2px;
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 540;
}
.vr-provider-add-card em {
  color: #94a3b8;
  font-size: 11px;
  font-style: normal;
}

.vr-provider-detail-panel {
  display: grid;
  align-content: start;
  gap: 8px;
  border: 1px solid rgba(56, 189, 248, 0.26);
  border-radius: 14px;
  background:
    radial-gradient(circle at 20% 20%, rgba(124, 58, 237, 0.22), transparent 36%),
    rgba(7, 16, 33, 0.84);
  padding: 12px;
}
.vr-detail-head {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}
.vr-detail-head span,
.vr-provider-detail-panel p {
  color: var(--vr-muted);
}
.vr-detail-head strong {
  display: block;
  font-size: 18px;
}
.vr-provider-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.vr-provider-stats span {
  border: 1px solid var(--vr-border);
  border-radius: 10px;
  padding: 8px;
}
.vr-provider-stats b,
.vr-provider-stats em {
  display: block;
  font-style: normal;
}
.vr-provider-stats b {
  color: var(--vr-muted);
  font-size: 10px;
  text-transform: uppercase;
}
.vr-provider-detail-panel button,
.vr-provider-dashboard {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 10px;
}
.vr-provider-detail-panel button i,
.vr-provider-dashboard i {
  border: 0;
  background: transparent;
  transform: none;
}

.vr-releases-panel {
  min-height: 0;
}
.vr-release-actions {
  display: inline-flex;
  gap: 8px;
}
.vr-release-actions button {
  min-height: 30px;
  border-radius: 9px;
  padding: 0 12px;
}
.vr-release-track {
  display: grid;
  grid-template-columns: repeat(6, minmax(120px, 1fr));
  gap: 8px;
  align-items: stretch;
}
.vr-release-card {
  position: relative;
  min-height: 54px;
  display: grid;
  align-content: center;
  gap: 3px;
  border: 1px solid rgba(120, 145, 190, 0.15);
  border-radius: 9px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.64), rgba(8, 13, 24, 0.7));
  color: var(--vr-text);
  padding: 8px 10px;
  text-align: left;
}
.vr-release-card:hover,
.vr-release-card.is-selected {
  border-color: rgba(168, 85, 247, 0.48);
  box-shadow: inset 0 0 0 1px rgba(168, 85, 247, 0.08);
  transform: translateY(-1px);
}
.vr-release-card small { color: #a78bfa; font-size: 10px; font-weight: 680; }
.vr-release-card strong { font-size: 15px; font-weight: 720; }
.vr-release-card em {
  color: var(--vr-muted);
  font-style: normal;
}
.vr-current-star {
  position: absolute;
  right: -10px;
  top: -10px;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  box-shadow: var(--vr-glow-purple);
}
.vr-current-star i {
  width: 28px;
  height: 28px;
  border: 0;
  background: transparent;
  color: #fff;
}
.vr-view-all {
  align-content: center;
  justify-items: center;
  text-align: center;
}
.vr-timeline-rail {
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  margin: 4px 50px 0;
}
.vr-timeline-rail::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  background: linear-gradient(90deg, #7c3aed, #38bdf8, rgba(148, 163, 184, 0.4));
}
.vr-timeline-rail span {
  z-index: 1;
  width: 12px;
  height: 12px;
  justify-self: center;
  border: 2px solid #94a3b8;
  border-radius: 999px;
  background: var(--vr-bg);
}
.vr-timeline-rail span.is-selected {
  border-color: #a855f7;
  background: #a855f7;
  box-shadow: var(--vr-glow-purple);
}
.vr-release-detail {
  display: none;
  margin: 6px 0 0;
  color: var(--vr-muted);
  font-size: 12px;
}

.vr-agent-panel {
  min-width: 0;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  gap: 10px;
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
}
.vr-agent-control {
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 8px;
  border: 1px solid rgba(148, 163, 184, 0.13);
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(22, 27, 35, 0.72), rgba(13, 17, 24, 0.82));
  padding: 10px;
  overflow: hidden;
}
.vr-agent-hero {
  position: relative;
  min-height: 136px;
  overflow: hidden;
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 10px;
  background:
    radial-gradient(circle at 78% 40%, rgba(34, 197, 94, 0.18), transparent 34%),
    radial-gradient(circle at 82% 22%, rgba(96, 165, 250, 0.18), transparent 31%),
    rgba(8, 17, 34, 0.82);
  padding: 16px;
}
.vr-agent-hero div {
  position: relative;
  z-index: 2;
  max-width: 168px;
}
.vr-agent-hero p {
  margin: 0 0 10px;
  color: #cbd5e1;
  font-weight: 760;
}
.vr-agent-hero p span {
  border: 1px solid rgba(168, 85, 247, 0.5);
  border-radius: 999px;
  padding: 2px 7px;
}
.vr-agent-hero h2 {
  max-width: 155px;
  font-size: 21px;
  line-height: 1.12;
}
.vr-agent-hero em {
  display: block;
  margin-top: 8px;
  color: #cbd5e1;
  font-style: normal;
  line-height: 1.35;
}
.vr-agent-hero img {
  position: absolute;
  right: -2px;
  bottom: -12px;
  z-index: 1;
  width: 116px;
  border-radius: 0;
  opacity: 1;
  filter: saturate(1.16) drop-shadow(0 0 30px rgba(168, 85, 247, 0.48));
  animation: vrMascotIdle 3200ms cubic-bezier(0.23, 1, 0.32, 1) infinite;
}
.vr-agent-hero.is-fixing img {
  filter: saturate(1.25) drop-shadow(0 0 34px rgba(249, 115, 22, 0.72));
}
.vr-agent-hero.is-verified img {
  filter: saturate(1.25) drop-shadow(0 0 34px rgba(34, 197, 94, 0.66));
}
.vr-agent-hero .vr-glow-button {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 18px;
  z-index: 3;
}

.vr-glow-button {
  position: relative;
  min-height: 46px;
  display: inline-grid;
  grid-template-columns: minmax(0, 1fr) 18px;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  border: 1px solid rgba(168, 85, 247, 0.72);
  border-radius: 10px;
  background: linear-gradient(135deg, #7c3aed, #6d28d9 52%, #2563eb);
  color: #fff;
  padding: 0 16px;
  font-weight: 820;
  text-align: center;
  box-shadow: var(--vr-glow-purple);
}
.vr-glow-button[data-tone="green"] {
  border-color: rgba(34, 197, 94, 0.76);
  background: linear-gradient(135deg, rgba(21, 128, 61, 0.96), rgba(16, 185, 129, 0.72));
  box-shadow: var(--vr-glow-green);
}
.vr-glow-button::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 0 30%, rgba(255, 255, 255, 0.22) 42%, transparent 56%);
  transform: translateX(-80%);
  animation: vrButtonShimmer 2600ms cubic-bezier(0.23, 1, 0.32, 1) infinite;
}
.vr-glow-button span,
.vr-glow-button i {
  position: relative;
  z-index: 1;
}
.vr-glow-button i { transform: rotate(-45deg); justify-self: end; }

.vr-agent-will,
.vr-quick-actions,
.vr-agent-community {
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 10px;
  background: rgba(17, 21, 28, 0.5);
  padding: 10px;
}
.vr-agent-will h3 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.vr-agent-will h3 a {
  color: #8fb3d9;
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
}
.vr-agent-will {
  min-height: 0;
  display: grid;
  align-content: start;
  gap: 8px;
  overflow: hidden;
}
.vr-agent-will span {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  color: #cbd5e1;
  font-size: 11px;
}
.vr-agent-will span i {
  position: relative;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(52, 211, 153, 0.72);
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.22), transparent 46%),
    rgba(15, 23, 42, 0.78);
  box-shadow: 0 0 14px rgba(34, 197, 94, 0.2);
}
.vr-agent-will span i::before {
  content: "";
  width: 7px;
  height: 11px;
  border-right: 2px solid #86efac;
  border-bottom: 2px solid #86efac;
  transform: rotate(42deg) translateY(-1px);
  color: #86efac;
  font-size: 10px;
  font-style: normal;
  font-weight: 850;
  line-height: 1;
}
.vr-agent-will span.is-done i {
  border-color: #4ade80;
  background:
    radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.34), transparent 52%),
    rgba(5, 46, 22, 0.82);
  box-shadow: var(--vr-glow-green);
}
.vr-agent-will span.is-done i::before {
  content: "";
  width: 7px;
  height: 11px;
  border-right: 2px solid #86efac;
  border-bottom: 2px solid #86efac;
  transform: rotate(42deg) translateY(-1px);
}
.vr-agent-will span.is-done {
  color: #86efac;
}
.vr-agent-will span em {
  color: var(--vr-muted);
  font-size: 11px;
  font-style: normal;
}
.vr-quick-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: start;
  gap: 8px;
}
.vr-quick-actions h3 {
  grid-column: 1 / -1;
}
.vr-quick-action {
  min-height: 44px;
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  padding: 0 10px;
  text-align: left;
}
.vr-quick-action strong,
.vr-quick-action em {
  display: block;
}
.vr-quick-action em {
  color: var(--vr-muted);
  font-style: normal;
  font-size: 11px;
}
.vr-quick-actions .vr-glow-button {
  margin-top: 4px;
}
.vr-agent-panel > .vr-glow-button {
  min-height: 50px;
}
.vr-agent-control > .vr-glow-button {
  min-height: 50px;
}
.vr-agent-panel > .vr-releases-panel {
  min-height: 0;
  overflow: hidden;
}
.vr-agent-panel > .vr-releases-panel .vr-panel-head {
  margin-bottom: 8px;
}
.vr-agent-panel > .vr-releases-panel .vr-panel-head h2 {
  font-size: 15px;
}
.vr-agent-panel > .vr-releases-panel .vr-panel-head p {
  display: none;
}
.vr-agent-panel > .vr-releases-panel .vr-release-actions {
  display: none;
}
.vr-agent-panel > .vr-releases-panel .vr-release-track {
  display: grid;
  grid-template-columns: 1fr;
  gap: 7px;
  overflow: auto;
}
.vr-agent-panel > .vr-releases-panel .vr-release-card {
  min-height: 58px;
  border-radius: 9px;
  background:
    linear-gradient(180deg, rgba(26, 30, 38, 0.68), rgba(18, 22, 29, 0.72));
  padding: 10px 12px;
}
.vr-agent-panel > .vr-releases-panel .vr-view-all {
  min-height: 46px;
}
.vr-agent-panel > .vr-releases-panel .vr-timeline-rail,
.vr-agent-panel > .vr-releases-panel .vr-release-detail {
  display: none;
}
.vr-agent-community {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: stretch;
  gap: 10px;
}
.vr-agent-community strong,
.vr-agent-community span {
  display: block;
}
.vr-agent-community span {
  color: var(--vr-muted);
  font-size: 12px;
}
.vr-agent-community .vr-github-stat-row {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.vr-agent-community .vr-github-stat-row span {
  background: rgba(24, 24, 27, 0.82);
}
.vr-agent-community small {
  color: var(--vr-muted);
  font-size: 11px;
}
.vr-agent-community-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.vr-agent-community a {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid rgba(120, 145, 190, 0.2);
  border-radius: 9px;
  background: rgba(2, 6, 23, 0.38);
  color: #dbeafe;
  padding: 0 10px;
  text-decoration: none;
  font-weight: 760;
}
.vr-agent-community a {
  color: #c4b5fd;
  text-decoration: none;
}

.vr-bottom-tip-bar {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  height: 34px;
  min-height: 34px;
  overflow: hidden;
  border-width: 1px 0 0;
  border-radius: 0;
  background:
    radial-gradient(circle at 20% 0%, rgba(124, 58, 237, 0.28), transparent 28%),
    rgba(8, 17, 34, 0.82);
  padding: 0 18px;
}
.vr-bottom-tip-bar nav .vr-bottom-github {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.vr-bottom-tip-bar .vr-inline-brand-mark {
  width: 18px;
  height: 18px;
}
.vr-bottom-tip-bar .vr-inline-brand-mark.is-github {
  display: inline-grid;
  place-items: center;
  color: #f8fafc;
}
.vr-bottom-tip-bar .vr-inline-brand-mark.is-github svg {
  width: 17px;
  height: 17px;
  display: block;
  fill: currentColor;
}
.vr-tip-mascot {
  width: 34px;
  height: 34px;
  align-self: stretch;
  position: relative;
  display: grid;
  place-items: end center;
  overflow: hidden;
  border-right: 1px solid rgba(148, 163, 184, 0.16);
}
.vr-tip-mascot::before {
  content: "";
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 2px;
  height: 10px;
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.24);
  filter: blur(8px);
}
.vr-tip-mascot img {
  position: relative;
  z-index: 1;
  align-self: end;
  width: 32px;
  height: 32px;
  object-fit: contain;
  object-position: bottom;
  transform: translateY(3px);
  filter: saturate(1.16) drop-shadow(0 0 12px rgba(168, 85, 247, 0.46));
}
.vr-bottom-tip-bar span {
  color: #cbd5e1;
}
.vr-bottom-tip-bar b {
  color: #fde68a;
}
.vr-bottom-tip-bar nav {
  display: inline-flex;
  gap: 14px;
}
.vr-bottom-tip-bar a {
  color: #cbd5e1;
  text-decoration: none;
}
.vr-bottom-tip-bar a:hover {
  color: #fff;
}

.vr-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 24px;
  background:
    radial-gradient(circle at 50% 42%, rgba(124, 58, 237, 0.24), transparent 34%),
    radial-gradient(circle at 72% 16%, rgba(34, 197, 94, 0.12), transparent 24%),
    linear-gradient(rgba(148, 163, 184, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.03) 1px, transparent 1px),
    rgba(1, 4, 13, 0.78);
  background-size: auto, auto, 42px 42px, 42px 42px, auto;
  backdrop-filter: blur(18px);
  animation: vrModalFade 180ms ease-out both;
}

.vr-modal-card {
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  width: min(920px, calc(100vw - 48px));
  max-width: 100%;
  max-height: calc(100vh - 56px);
  overflow-x: hidden;
  overflow-y: auto;
  border: 1px solid rgba(168, 85, 247, 0.72);
  border-radius: 24px;
  background:
    radial-gradient(circle at 80% 15%, rgba(124, 58, 237, 0.42), transparent 27%),
    radial-gradient(circle at 19% 8%, rgba(56, 189, 248, 0.12), transparent 24%),
    radial-gradient(circle at 74% 70%, rgba(34, 197, 94, 0.08), transparent 28%),
    linear-gradient(180deg, rgba(13, 20, 43, 0.98), rgba(2, 6, 23, 0.995));
  box-shadow:
    0 0 0 1px rgba(196, 181, 253, 0.12),
    0 0 70px rgba(124, 58, 237, 0.48),
    0 30px 110px rgba(0, 0, 0, 0.68);
  padding: 28px;
  animation: vrModalPop 260ms cubic-bezier(0.23, 1, 0.32, 1) both;
}

.vr-modal-card *,
.vr-modal-card *::before,
.vr-modal-card *::after {
  box-sizing: border-box;
  max-width: 100%;
}

.vr-modal-card::-webkit-scrollbar {
  width: 10px;
}

.vr-modal-card::-webkit-scrollbar-thumb {
  border: 3px solid rgba(2, 6, 23, 0.92);
  border-radius: 999px;
  background: rgba(168, 85, 247, 0.7);
}

.vr-modal-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  border-radius: inherit;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent 28%),
    radial-gradient(circle at 84% 22%, rgba(34, 197, 94, 0.12), transparent 30%);
}

.vr-modal-card::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  border-radius: inherit;
  background:
    linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.46), rgba(56, 189, 248, 0.18), transparent);
  opacity: 0.34;
  transform: translateX(-44%);
  animation: vrModalEdgeSweep 5200ms cubic-bezier(0.23, 1, 0.32, 1) infinite;
}

.vr-modal-close {
  position: absolute;
  right: 18px;
  top: 18px;
  z-index: 4;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(168, 85, 247, 0.38);
  border-radius: 11px;
  background: rgba(124, 58, 237, 0.18);
  color: #c4b5fd;
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), border-color 160ms ease, box-shadow 160ms ease;
}

.vr-modal-close:hover {
  border-color: rgba(196, 181, 253, 0.82);
  box-shadow: var(--vr-glow-purple);
  transform: translateY(-1px);
}

.vr-modal-card h2,
.vr-modal-card h3,
.vr-modal-card p {
  margin: 0;
}

.vr-modal-provider-head,
.vr-modal-release-head,
.vr-modal-add-head,
.vr-modal-agent-head,
.vr-modal-health,
.vr-modal-progress,
.vr-modal-checks,
.vr-modal-tasklist,
.vr-modal-notes,
.vr-modal-two-col section {
  position: relative;
  z-index: 2;
}

.vr-modal-provider-head,
.vr-modal-release-head {
  position: relative;
  min-height: 210px;
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) 250px;
  align-items: center;
  gap: 26px;
  border: 1px solid rgba(96, 122, 177, 0.24);
  border-radius: 18px;
  background:
    linear-gradient(90deg, rgba(124, 58, 237, 0.1), rgba(8, 17, 34, 0.48) 46%, rgba(15, 23, 42, 0.08)),
    radial-gradient(circle at 86% 42%, rgba(124, 58, 237, 0.24), transparent 32%);
  padding: 22px 34px 22px 22px;
  padding-right: 34px;
  overflow: hidden;
}

.vr-modal-provider-head::before,
.vr-modal-release-head::before,
.vr-modal-agent-head::before,
.vr-modal-guide-head::before,
.vr-modal-prompt-head::before {
  content: "";
  position: absolute;
  inset: 12px;
  z-index: -1;
  pointer-events: none;
  border-radius: inherit;
  background:
    radial-gradient(circle at 72% 38%, rgba(168, 85, 247, 0.24), transparent 24%),
    linear-gradient(120deg, transparent 0 44%, rgba(168, 85, 247, 0.18) 45%, transparent 46% 100%);
  opacity: 0.82;
}

.vr-modal-add-provider {
  width: min(760px, calc(100vw - 48px));
  max-width: 100%;
  border-color: rgba(226, 232, 240, 0.16);
  border-radius: 18px;
  background:
    radial-gradient(circle at 84% 4%, rgba(124, 58, 237, 0.22), transparent 28%),
    linear-gradient(180deg, rgba(24, 27, 34, 0.98), rgba(14, 16, 21, 0.99));
  box-shadow: 0 30px 100px rgba(0, 0, 0, 0.7);
}
.vr-modal-add-head {
  min-height: 132px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132px;
  align-items: center;
  gap: 18px;
  border: 1px solid rgba(226, 232, 240, 0.11);
  border-radius: 14px;
  background: rgba(29, 33, 40, 0.56);
  padding: 18px;
  overflow: hidden;
}
.vr-modal-add-head p {
  color: #a78bfa;
  font-size: 12px;
  font-weight: 760;
}
.vr-modal-add-head h2 {
  margin-top: 5px;
  font-size: 30px;
  line-height: 1.05;
}
.vr-modal-add-head em {
  display: block;
  margin-top: 9px;
  color: #aeb9ca;
  font-style: normal;
}
.vr-modal-add-head .vr-modal-agent-avatar {
  width: 132px;
  height: 132px;
  object-fit: contain;
  justify-self: end;
}
.vr-modal-provider-options {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}
.vr-modal-provider-options button {
  min-width: 0;
  min-height: 92px;
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(226, 232, 240, 0.11);
  border-radius: 12px;
  background: rgba(29, 33, 40, 0.58);
  color: #f4f4f5;
  padding: 13px;
  text-align: left;
  transition:
    transform 180ms cubic-bezier(0.23, 1, 0.32, 1),
    border-color 180ms ease,
    background 180ms ease;
}
.vr-modal-provider-options button:hover {
  border-color: rgba(168, 85, 247, 0.38);
  background: rgba(35, 39, 46, 0.78);
  transform: translateY(-1px);
}
.vr-modal-provider-options small,
.vr-modal-provider-options strong,
.vr-modal-provider-options em {
  display: block;
}
.vr-modal-provider-options small {
  color: #a78bfa;
  font-size: 11px;
  font-weight: 760;
}
.vr-modal-provider-options strong {
  margin-top: 3px;
  font-size: 15px;
}
.vr-modal-provider-options em {
  margin-top: 3px;
  color: #aeb9ca;
  font-size: 12px;
  font-style: normal;
  line-height: 1.3;
}
.vr-modal-provider-options b {
  border: 1px solid rgba(226, 232, 240, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: #e5e7eb;
  padding: 6px 10px;
  font-size: 12px;
}
.vr-modal-connect-note {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 10px;
  margin-top: 14px;
  border: 1px solid rgba(34, 197, 94, 0.18);
  border-radius: 12px;
  background: rgba(34, 197, 94, 0.06);
  color: #aeb9ca;
  padding: 12px 14px;
}
.vr-modal-connect-note svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: #22c55e;
  stroke-width: 1.9;
}

.vr-modal-provider-logo {
  width: 126px;
  height: 126px;
  object-fit: contain;
  border: 2px solid rgba(168, 85, 247, 0.7);
  border-radius: 24px;
  background:
    radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.2), transparent 34%),
    linear-gradient(135deg, rgba(16, 185, 129, 0.38), rgba(124, 58, 237, 0.32));
  padding: 24px;
  box-shadow: var(--vr-glow-purple);
  transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 200ms ease;
}
.vr-modal-provider-logo.is-logo-html {
  display: grid;
  place-items: center;
}
.vr-modal-provider-logo.is-logo-html img,
.vr-modal-provider-logo.is-logo-html svg,
.vr-modal-provider-logo.is-logo-html .vr-provider-logo {
  width: 74px;
  height: 74px;
  display: block;
  object-fit: contain;
}

.vr-modal-provider-logo:hover {
  transform: translateY(-3px) rotate(-2deg);
  box-shadow: 0 0 36px rgba(124, 58, 237, 0.82), 0 0 82px rgba(34, 197, 94, 0.2);
}

.vr-modal-provider-head h2,
.vr-modal-release-head h2,
.vr-modal-agent-head h2 {
  margin: 0 0 10px;
  font-size: 38px;
  line-height: 1;
}

.vr-modal-provider-head p,
.vr-modal-release-head p,
.vr-modal-agent-head p {
  color: #a78bfa;
  font-weight: 850;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.vr-modal-provider-head > div > p {
  margin-top: 20px;
  color: #c4b5fd;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}

.vr-modal-mascot {
  width: 268px;
  max-height: 238px;
  object-fit: contain;
  justify-self: end;
  filter: saturate(1.3) contrast(1.04) drop-shadow(0 0 42px rgba(124, 58, 237, 0.82));
  animation: vrMascotIdle 3400ms cubic-bezier(0.23, 1, 0.32, 1) infinite;
}

.vr-modal-health,
.vr-modal-progress {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  border: 1px solid rgba(34, 197, 94, 0.34);
  border-radius: 16px;
  background:
    radial-gradient(circle at 8% 50%, rgba(34, 197, 94, 0.18), transparent 24%),
    rgba(8, 17, 34, 0.92);
  padding: 16px 20px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.vr-modal-health.is-orange,
.vr-modal-progress.is-orange {
  border-color: rgba(251, 146, 60, 0.42);
  background:
    radial-gradient(circle at 8% 50%, rgba(251, 146, 60, 0.16), transparent 24%),
    rgba(8, 17, 34, 0.92);
}

.vr-modal-health.is-orange > span,
.vr-modal-progress.is-orange > i:first-child {
  border-color: rgba(251, 146, 60, 0.64);
  background: rgba(251, 146, 60, 0.12);
  color: #fb923c;
  box-shadow: 0 0 18px rgba(251, 146, 60, 0.24);
}

.vr-modal-health.is-orange strong,
.vr-modal-progress.is-orange strong {
  color: #fb923c;
}

.vr-modal-health.is-red,
.vr-modal-progress.is-red {
  border-color: rgba(248, 113, 113, 0.42);
  background:
    radial-gradient(circle at 8% 50%, rgba(248, 113, 113, 0.16), transparent 24%),
    rgba(8, 17, 34, 0.92);
}

.vr-modal-health.is-red > span,
.vr-modal-progress.is-red > i:first-child {
  border-color: rgba(248, 113, 113, 0.64);
  background: rgba(248, 113, 113, 0.12);
  color: #f87171;
  box-shadow: 0 0 18px rgba(248, 113, 113, 0.24);
}

.vr-modal-health.is-red strong,
.vr-modal-progress.is-red strong {
  color: #f87171;
}

.vr-modal-checks li.pending > span,
.vr-modal-tasklist li.pending > span {
  border-color: rgba(96, 122, 177, 0.7);
  background: rgba(15, 23, 42, 0.5);
  box-shadow: none;
}

.vr-modal-checks li.pending b,
.vr-modal-tasklist li.pending b {
  color: #94a3b8;
}

.vr-modal-health > span,
.vr-modal-progress > i:first-child {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border: 2px solid rgba(34, 197, 94, 0.64);
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.12);
  color: #4ade80;
  box-shadow: var(--vr-glow-green);
}

.vr-modal-health strong,
.vr-modal-progress strong {
  display: block;
  color: #4ade80;
  font-size: 21px;
}

.vr-modal-health em,
.vr-modal-progress p,
.vr-modal-tasklist em,
.vr-modal-checks em,
.vr-modal-safe,
.vr-modal-foot {
  color: #aeb9d4;
  font-style: normal;
}

.vr-modal-health b {
  color: #4ade80;
  font-size: 22px;
}

.vr-modal-action-grid,
.vr-modal-button-row {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.vr-modal-action-grid button,
.vr-modal-action-grid a,
.vr-modal-button-row button,
.vr-modal-button-row a {
  min-height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid rgba(168, 85, 247, 0.56);
  border-radius: 12px;
  background: rgba(7, 16, 33, 0.92);
  color: #d8b4fe;
  text-decoration: none;
  font-size: 16px;
  font-weight: 760;
  transition: transform 170ms cubic-bezier(0.23, 1, 0.32, 1), border-color 170ms ease, background 170ms ease, box-shadow 170ms ease;
}

.vr-modal-action-grid button:hover,
.vr-modal-action-grid a:hover,
.vr-modal-button-row button:hover,
.vr-modal-button-row a:hover {
  border-color: rgba(196, 181, 253, 0.82);
  background:
    radial-gradient(circle at 50% 0%, rgba(124, 58, 237, 0.28), transparent 58%),
    rgba(12, 20, 42, 0.96);
  box-shadow: 0 0 22px rgba(124, 58, 237, 0.3);
  transform: translateY(-2px);
}

.vr-modal-checks,
.vr-modal-tasklist,
.vr-modal-notes,
.vr-modal-two-col section {
  margin-top: 20px;
  border: 1px solid rgba(96, 122, 177, 0.28);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.86), rgba(7, 16, 33, 0.94));
  padding: 18px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.vr-modal-checks h3,
.vr-modal-tasklist h3,
.vr-modal-notes h3,
.vr-modal-two-col h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #c084fc;
  font-size: 18px;
}

.vr-modal-checks ul,
.vr-modal-tasklist ul {
  display: grid;
  gap: 0;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.vr-modal-checks li,
.vr-modal-tasklist li {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  min-height: 58px;
  border-top: 1px solid rgba(96, 122, 177, 0.18);
  transition: background 160ms ease, transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}

.vr-modal-checks li:hover,
.vr-modal-tasklist li:hover {
  background: rgba(124, 58, 237, 0.08);
  transform: translateX(2px);
}

.vr-modal-checks li:first-child,
.vr-modal-tasklist li:first-child {
  border-top: 0;
}

.vr-modal-checks li > span,
.vr-modal-tasklist li > span {
  position: relative;
  width: 28px;
  height: 28px;
  border: 2px solid rgba(96, 122, 177, 0.7);
  border-radius: 999px;
}

.vr-modal-checks li.done > span,
.vr-modal-tasklist li.done > span {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
  box-shadow: var(--vr-glow-green);
}

.vr-modal-checks li.done > span::after,
.vr-modal-tasklist li.done > span::after {
  content: "";
  position: absolute;
  left: 7px;
  top: 5px;
  width: 9px;
  height: 14px;
  border-right: 3px solid #22c55e;
  border-bottom: 3px solid #22c55e;
  transform: rotate(42deg);
}

.vr-modal-checks li.active,
.vr-modal-tasklist li.active,
.vr-modal-checks li.running,
.vr-modal-tasklist li.running {
  margin: 0 -18px;
  border: 1px solid rgba(124, 58, 237, 0.7);
  border-radius: 10px;
  background: rgba(124, 58, 237, 0.18);
  padding: 0 18px;
  box-shadow: inset 0 0 24px rgba(124, 58, 237, 0.18);
}

.vr-modal-checks li.active > span,
.vr-modal-tasklist li.active > span,
.vr-modal-checks li.running > span,
.vr-modal-tasklist li.running > span {
  border-color: #a855f7;
  box-shadow: var(--vr-glow-purple);
}

.vr-modal-checks strong,
.vr-modal-tasklist strong {
  display: block;
  font-size: 17px;
}

.vr-modal-checks b,
.vr-modal-tasklist b {
  color: #4ade80;
  font-size: 14px;
  font-weight: 760;
}

.vr-modal-checks li.active b,
.vr-modal-tasklist li.active b,
.vr-modal-checks li.running b,
.vr-modal-tasklist li.running b {
  color: #c084fc;
}

.vr-modal-foot,
.vr-modal-safe {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}

.vr-modal-foot a {
  color: #c084fc;
  text-decoration: none;
}

.vr-modal-release-head {
  grid-template-columns: minmax(0, 1fr) 270px;
  min-height: 230px;
}

.vr-modal-release-head span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-right: 10px;
  border: 1px solid rgba(124, 58, 237, 0.42);
  border-radius: 9px;
  background: rgba(124, 58, 237, 0.14);
  color: #c4b5fd;
  padding: 8px 14px;
}

.vr-modal-compare {
  position: relative;
  z-index: 1;
  min-height: 56px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(168, 85, 247, 0.7);
  border-radius: 12px;
  background: rgba(124, 58, 237, 0.12);
  color: #c084fc;
  padding: 0 24px;
  font-size: 17px;
  font-weight: 780;
}

.vr-modal-two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.vr-modal-two-col p,
.vr-modal-notes p {
  margin-top: 12px;
  color: #cbd5e1;
  line-height: 1.45;
}

.vr-modal-two-col dl {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px 22px;
  margin: 16px 0 0;
}

.vr-modal-two-col dt {
  color: #aeb9d4;
}

.vr-modal-two-col dd {
  margin: 0;
  color: #f8fafc;
}

.vr-changelog-list {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.vr-changelog-list li {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.18);
  color: #e2e8f0;
  line-height: 1.45;
}

.vr-changelog-list em {
  display: block;
  margin-top: 4px;
  color: #94a3b8;
  font-style: normal;
  font-size: 12px;
}

.vr-release-error {
  color: #fca5a5;
}

.vr-modal-agent-head {
  position: relative;
  min-height: 210px;
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) 240px;
  align-items: center;
  gap: 28px;
  border: 1px solid rgba(96, 122, 177, 0.24);
  border-radius: 18px;
  background:
    radial-gradient(circle at 16% 38%, rgba(124, 58, 237, 0.26), transparent 28%),
    linear-gradient(90deg, rgba(8, 17, 34, 0.82), rgba(13, 20, 43, 0.42));
  padding: 18px;
  overflow: hidden;
}

.vr-modal-guide-head,
.vr-modal-prompt-head {
  position: relative;
  min-height: 190px;
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr) 240px;
  align-items: center;
  gap: 28px;
  border: 1px solid rgba(96, 122, 177, 0.24);
  border-radius: 18px;
  background:
    radial-gradient(circle at 14% 40%, rgba(124, 58, 237, 0.2), transparent 30%),
    linear-gradient(90deg, rgba(8, 17, 34, 0.82), rgba(13, 20, 43, 0.42));
  padding: 18px;
  overflow: hidden;
}

.vr-modal-agent-avatar {
  width: 198px;
  height: 198px;
  object-fit: contain;
  filter: saturate(1.32) contrast(1.04) drop-shadow(0 0 38px rgba(124, 58, 237, 0.78));
  animation: vrMascotIdle 3200ms cubic-bezier(0.23, 1, 0.32, 1) infinite;
}

.vr-modal-agent-head em {
  color: #dbeafe;
  font-size: 18px;
  font-style: normal;
  line-height: 1.45;
}

.vr-modal-guide-head em,
.vr-modal-prompt-head em {
  color: #dbeafe;
  font-size: 18px;
  font-style: normal;
  line-height: 1.45;
}

.vr-modal-agent-head aside,
.vr-modal-guide-head aside,
.vr-modal-prompt-head aside {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 10px 14px;
  border: 1px solid rgba(124, 58, 237, 0.48);
  border-radius: 14px;
  background: rgba(124, 58, 237, 0.12);
  padding: 18px;
}

.vr-modal-agent-head aside > i,
.vr-modal-guide-head aside > i,
.vr-modal-prompt-head aside > i {
  grid-row: 1 / span 2;
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: rgba(124, 58, 237, 0.24);
  color: #a855f7;
}

.vr-modal-agent-head aside > span,
.vr-modal-guide-head aside > span,
.vr-modal-prompt-head aside > span {
  color: #c084fc;
  font-weight: 780;
  text-transform: uppercase;
}

.vr-modal-agent-head aside > strong,
.vr-modal-guide-head aside > strong,
.vr-modal-prompt-head aside > strong {
  font-size: 22px;
}

.vr-modal-guide-head p,
.vr-modal-prompt-head p {
  color: #a78bfa;
  font-weight: 850;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.vr-modal-guide-head h2,
.vr-modal-prompt-head h2 {
  margin: 0 0 10px;
  font-size: 38px;
  line-height: 1;
}

.vr-modal-flow-list,
.vr-modal-signal-list {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 10px;
  border: 1px solid rgba(96, 122, 177, 0.28);
  border-radius: 14px;
  background: rgba(7, 16, 33, 0.92);
  padding: 14px;
}

.vr-modal-flow-list button {
  min-height: 78px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 24px;
  align-items: center;
  gap: 14px;
  border: 1px solid rgba(124, 58, 237, 0.32);
  border-radius: 12px;
  background:
    radial-gradient(circle at 0% 50%, rgba(124, 58, 237, 0.18), transparent 36%),
    rgba(2, 6, 23, 0.5);
  color: var(--vr-text);
  padding: 0 16px;
  text-align: left;
  transition: transform 180ms cubic-bezier(0.23, 1, 0.32, 1), border-color 180ms ease, box-shadow 180ms ease;
}

.vr-modal-flow-list button:hover {
  border-color: rgba(168, 85, 247, 0.7);
  box-shadow: var(--vr-glow-purple);
  transform: translateY(-2px);
}

.vr-modal-flow-list button > span {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 2px solid rgba(168, 85, 247, 0.74);
  border-radius: 999px;
  color: #d8b4fe;
  font-weight: 850;
}

.vr-modal-flow-list strong,
.vr-modal-flow-list em {
  display: block;
}

.vr-modal-flow-list em {
  margin-top: 4px;
  color: #aeb9d4;
  font-style: normal;
}

.vr-modal-prompt-card {
  position: relative;
  z-index: 2;
  border: 1px solid rgba(96, 122, 177, 0.28);
  border-radius: 14px;
  background:
    radial-gradient(circle at 86% 0%, rgba(124, 58, 237, 0.18), transparent 34%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.96));
  padding: 18px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.vr-modal-prompt-card pre {
  max-height: 270px;
  overflow: auto;
  margin: 0;
  color: #dbeafe;
  font: 12px/1.65 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  white-space: pre-wrap;
}

.vr-modal-signal-list {
  padding: 18px;
}

.vr-modal-signal-list li {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  min-height: 56px;
  border-top: 1px solid rgba(96, 122, 177, 0.18);
}

.vr-modal-signal-list li:first-child {
  border-top: 0;
}

.vr-modal-signal-list li > span {
  position: relative;
  width: 28px;
  height: 28px;
  border: 2px solid rgba(96, 122, 177, 0.7);
  border-radius: 999px;
}

.vr-modal-signal-list li.done > span {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
  box-shadow: var(--vr-glow-green);
}

.vr-modal-signal-list li.active > span {
  border-color: #a855f7;
  box-shadow: var(--vr-glow-purple);
}

.vr-modal-signal-list li.done > span::after {
  content: "";
  position: absolute;
  left: 7px;
  top: 5px;
  width: 9px;
  height: 14px;
  border-right: 3px solid #22c55e;
  border-bottom: 3px solid #22c55e;
  transform: rotate(42deg);
}

.vr-modal-signal-list strong,
.vr-modal-signal-list em {
  display: block;
}

.vr-modal-signal-list em {
  color: #aeb9d4;
  font-style: normal;
}

.vr-modal-progress {
  margin-top: 20px;
  border-color: rgba(34, 197, 94, 0.42);
  background: rgba(5, 46, 22, 0.68);
}

.vr-modal-progress.is-ready {
  border-color: rgba(168, 85, 247, 0.42);
  background:
    radial-gradient(circle at 8% 50%, rgba(124, 58, 237, 0.18), transparent 24%),
    rgba(18, 18, 54, 0.74);
}

.vr-modal-progress > i:last-child {
  justify-self: end;
  color: #86efac;
}

.vr-modal-safe {
  grid-template-columns: 24px auto;
  justify-content: center;
  text-align: center;
}

@keyframes vrBeamSweep {
  0% { transform: translateX(-20%); opacity: 0; }
  12% { opacity: 0.86; }
  100% { transform: translateX(980%); opacity: 0; }
}

@keyframes vrMascotIdle {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-7px) rotate(1deg); }
}

@keyframes vrButtonShimmer {
  0%, 42% { transform: translateX(-90%); opacity: 0; }
  54% { opacity: 0.7; }
  100% { transform: translateX(95%); opacity: 0; }
}

@keyframes vrSoftPulse {
  0%, 100% { transform: translateY(0); opacity: 0.64; }
  50% { transform: translateY(-1px); opacity: 0.92; }
}

@keyframes vrDropPulse {
  0%, 100% { opacity: 0.78; }
  50% { opacity: 1; }
}

@keyframes vrDragRoute {
  0% { opacity: 0.46; filter: drop-shadow(0 0 6px rgba(124, 58, 237, 0.28)); }
  42% { opacity: 0.96; filter: drop-shadow(0 0 12px rgba(124, 58, 237, 0.48)); }
  100% { opacity: 0.46; filter: drop-shadow(0 0 6px rgba(124, 58, 237, 0.28)); }
}

@keyframes vrTaskEnter {
  from { opacity: 0; transform: translateY(8px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes vrTaskSweep {
  0% { transform: translateX(-72%); }
  100% { transform: translateX(72%); }
}

@keyframes vrTaskGlyph {
  0%, 100% { opacity: 0.58; transform: rotate(0deg) scale(0.92); }
  50% { opacity: 1; transform: rotate(45deg) scale(1.05); }
}

@keyframes vrTaskRail {
  0% { transform: translateX(-110%); opacity: 0.32; }
  18% { opacity: 1; }
  100% { transform: translateX(285%); opacity: 0.32; }
}

@keyframes vrMenuIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes vrModalFade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes vrModalPop {
  from { opacity: 0; transform: translateY(18px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes vrModalEdgeSweep {
  0%, 38% { transform: translateX(-58%); opacity: 0; }
  48% { opacity: 0.38; }
  100% { transform: translateX(58%); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 80ms !important;
  }
  .vr-glow-button::before {
    display: none;
  }
  .vr-agent-hero img,
  .vr-modal-mascot,
  .vr-modal-agent-avatar {
    animation: none !important;
  }
}

.vr-sidebar {
  width: 58px;
  overflow: hidden;
  justify-items: center;
}
.vr-sidebar-brand {
  width: 44px;
}
.vr-sidebar-brand > div,
.vr-open-source-card,
.vr-workspace-switcher {
  display: none !important;
}
.vr-brand-mascot {
  width: 42px;
  height: 42px;
  border-radius: 12px;
}
.vr-brand-mascot img {
  width: 44px;
  height: 44px;
  transform: translateY(3px) scale(1.03);
}
.vr-sidebar-nav {
  width: 42px;
}
.vr-sidebar-nav button {
  width: 42px;
  min-height: 42px;
}
.vr-sidebar-nav button span {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  overflow: hidden !important;
  clip: rect(0 0 0 0) !important;
}
.vr-composition-body {
  padding-left: 16px;
}
.vr-agent-panel {
  gap: 10px;
}
.vr-agent-hero {
  min-height: 150px;
}
.vr-quick-action {
  min-height: 50px;
}
.vr-agent-will,
.vr-quick-actions,
.vr-agent-community {
  padding: 12px;
}

@media (max-width: 1320px) {
  .vr-app {
    overflow: auto;
    height: auto;
    min-height: 100vh;
    grid-template-columns: 1fr;
  }
  body { overflow: auto; }
  .vr-sidebar {
    display: none;
  }
  .vr-composed-shell {
    margin: 12px;
  }
  .vr-composition-body {
    padding-left: 16px;
  }
  .vr-composition-body {
    grid-template-columns: 1fr;
    overflow: visible;
  }
  .vr-recent-rail {
    display: none;
  }
  .vr-agent-panel {
    max-width: none;
  }
  .vr-provider-composition {
    grid-template-columns: 1fr;
  }
}

@media (max-height: 760px) and (min-width: 900px) {
  .vr-bottom-tip-bar {
    display: none;
  }
  .vr-composed-shell {
    grid-template-rows: 52px minmax(0, 1fr);
  }
}

@media (max-width: 1100px) {
  .vr-composed-shell {
    grid-template-rows: auto minmax(0, 1fr) auto;
  }
  .vr-studio-topbar {
    grid-template-columns: auto auto minmax(0, 1fr);
    row-gap: 8px;
  }
  .vr-topbar-report {
    display: none;
  }
  .vr-top-command-strip {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
  .vr-top-stage-strip {
    grid-column: 1 / -1;
    justify-self: stretch;
    width: 100%;
  }
  .vr-topbar-spacer {
    display: none;
  }
  .vr-studio-head {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
  .vr-studio-tabs,
  .vr-studio-actions {
    justify-self: start;
  }
  .vr-studio-dock {
    height: auto;
    min-height: 420px;
  }
  .vr-bottom-inventory .vr-provider-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .vr-bottom-inventory {
    grid-template-columns: 1fr;
  }
  .vr-bottom-inventory .vr-release-track {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .vr-modal-backdrop {
    padding: 12px;
  }
  .vr-modal-card {
    width: 100%;
    max-height: calc(100vh - 24px);
    padding: 20px;
  }
  .vr-modal-provider-head,
  .vr-modal-release-head,
  .vr-modal-agent-head,
  .vr-modal-two-col,
  .vr-modal-action-grid,
  .vr-modal-button-row {
    grid-template-columns: 1fr;
  }
  .vr-modal-mascot,
  .vr-modal-agent-avatar {
    justify-self: center;
    max-width: 220px;
  }
  .vr-modal-provider-logo {
    width: 96px;
    height: 96px;
  }
  .vr-modal-provider-head h2,
  .vr-modal-release-head h2,
  .vr-modal-agent-head h2 {
    font-size: 32px;
  }
}

@media (max-width: 820px) {
  html,
  body,
  .vr-app,
  .vr-composed-shell,
  .vr-composition-body,
  .vr-main-canvas,
  .vr-studio-dock,
  .vr-studio-body,
  .vr-studio-chat,
  .vr-chat-lanes,
  .vr-chat-transcript,
  .vr-chat-lane {
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
  }
  .vr-project-header,
  .vr-provider-grid,
  .vr-release-track,
  .vr-bottom-tip-bar {
    grid-template-columns: 1fr;
  }
  .vr-studio-topbar {
    grid-template-columns: minmax(0, 1fr);
    padding: 8px 10px;
    overflow: hidden;
  }
  .vr-studio-topbar .vr-status-badge {
    width: auto;
    justify-self: start;
  }
  .vr-topbar-select-wrap {
    display: none;
  }
  .vr-top-stage-strip {
    grid-column: 1 / -1;
    grid-template-columns: repeat(4, minmax(96px, 1fr));
    overflow-x: auto;
    scrollbar-width: none;
  }
  .vr-top-stage-strip::-webkit-scrollbar {
    display: none;
  }
  .vr-top-stage-strip button {
    min-width: 112px;
  }
  .vr-topbar-brand {
    width: auto;
    max-width: 100%;
    min-width: 0;
    justify-self: start;
  }
  .vr-topbar-brand strong,
  .vr-topbar-brand span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .vr-top-command-strip {
    display: none;
  }
  .vr-composed-shell {
    min-height: 100vh;
    margin: 0;
    border-radius: 0;
    border-left: 0;
    border-right: 0;
  }
  .vr-composition-body {
    padding: 8px;
    width: 100%;
    max-width: 100vw;
    min-width: 0;
    overflow-x: hidden;
  }
  .vr-main-canvas {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    height: min(72vh, 720px);
    min-height: 420px;
    grid-template-rows: minmax(0, 1fr);
    align-content: stretch;
  }
  .vr-studio-dock {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    height: min(72vh, 720px);
    min-height: 420px;
    padding: 10px;
    overflow: hidden;
    box-sizing: border-box;
  }
  .vr-studio-body,
  .vr-studio-chat {
    height: 100%;
    min-height: 0;
    overflow: hidden;
    box-sizing: border-box;
  }
  .vr-chat-lane {
    height: 100%;
    min-height: 0;
    overflow: hidden;
    box-sizing: border-box;
  }
  .vr-chat-transcript {
    overflow-x: hidden;
    overflow-y: auto;
    min-height: 0;
    box-sizing: border-box;
  }
  .vr-chat-command-bar,
  .vr-chat-command-bar > .vr-chat-composer {
    overflow: visible;
    box-sizing: border-box;
  }
  .vr-studio-head {
    grid-template-columns: 1fr;
    min-width: 0;
    overflow: hidden;
  }
  .vr-studio-head > div:first-child,
  .vr-studio-head h2 {
    min-width: 0;
    max-width: 100%;
  }
  .vr-studio-tabs,
  .vr-studio-actions {
    max-width: 100%;
    min-width: 0;
    justify-self: start;
  }
  .vr-studio-tabs {
    overflow-x: auto;
    scrollbar-width: thin;
  }
  .vr-cli-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .vr-studio-actions {
    display: flex;
    flex-wrap: wrap;
  }
  .vr-chat-lanes {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    padding: 0;
    overflow: hidden;
  }
  .vr-chat-transcript {
    padding: 16px 14px 32px !important;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  .vr-studio-chat:not(.is-split) .vr-chat-transcript {
    padding: 18px 16px 12px;
  }
  .vr-studio-chat:not(.is-split) .vr-chat-message,
  .vr-studio-chat:not(.is-split) .vr-chat-mission-summary {
    min-width: 0;
    max-width: 100%;
  }
  .vr-chat-message,
  .vr-chat-message > div:first-child,
  .vr-chat-message > p {
    min-width: 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  .vr-chat-message > div:first-child {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr);
    align-items: center;
    column-gap: 10px;
  }
  .vr-chat-message.is-agent .vr-agent-response-stack,
  .vr-chat-message.is-agent .vr-agent-answer-body,
  .vr-chat-message.is-agent .vr-agent-followups {
    min-width: 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  .vr-chat-message.is-user {
    position: static !important;
    top: auto;
    right: auto;
    width: 100% !important;
    max-width: 100% !important;
    justify-self: stretch !important;
    justify-items: end;
    padding-left: 0;
    padding-right: 0;
  }
  .vr-chat-message.is-user > div {
    width: auto;
    max-width: calc(100% - 8px);
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    justify-self: end !important;
  }
  .vr-chat-message.is-user > p {
    width: auto;
    max-width: min(58vw, 210px);
    white-space: normal;
    overflow-wrap: anywhere;
    justify-self: end !important;
  }
  .vr-chat-message > div:first-child > p {
    width: auto;
    min-width: 0;
  }
  .vr-chat-message > div:first-child > p strong,
  .vr-chat-message > div:first-child > p em {
    display: inline;
  }
  .vr-studio-chat:not(.is-split) .vr-chat-mission-summary section {
    padding: 18px;
  }
  .vr-studio-chat:not(.is-split) .vr-chat-mission-summary section:not(.vr-chat-plan-card):not(.vr-chat-connect-card) > span {
    min-height: 0;
  }
  .vr-chat-inline-actions {
    max-width: 100%;
    min-width: 0;
    flex-wrap: wrap;
    overflow-x: hidden;
    padding-bottom: 2px;
  }
  .vr-chat-inline-actions button {
    flex: 1 1 120px;
    justify-content: center;
  }
  .vr-chat-bubble,
  .vr-chat-bubble.is-agent,
  .vr-chat-bubble.is-system,
  .vr-chat-card,
  .vr-chat-mission-summary {
    max-width: 100%;
    width: 100%;
    box-sizing: border-box;
  }
  .vr-chat-mission-summary section,
  .vr-chat-plan-row {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  .vr-chat-message > p,
  .vr-chat-mission-summary {
    padding-left: 0;
  }
  .vr-chat-mission-summary section {
    padding: 20px;
  }
  .vr-chat-mission-summary section header b {
    display: none;
  }
  .vr-chat-mission-summary section:not(.vr-chat-plan-card):not(.vr-chat-connect-card) > span,
  .vr-chat-mission-summary .vr-chat-card-list > span {
    grid-template-columns: 22px minmax(0, 1fr);
  }
  .vr-chat-message p,
  .vr-chat-copy,
  .vr-chat-mission-summary em,
  .vr-chat-mission-summary small,
  .vr-studio-head > div:first-child > span {
    min-width: 0;
    width: 100%;
    max-width: 100%;
    overflow: visible;
    text-overflow: clip;
    white-space: normal;
    overflow-wrap: break-word;
    word-break: normal;
  }
  .vr-chat-message p,
  .vr-chat-copy {
    display: block;
  }
  .vr-chat-transcript,
  .vr-chat-command-bar,
  .vr-chat-command-bar > .vr-chat-composer {
    overflow-x: hidden;
  }
  .vr-chat-mission-summary b {
    grid-column: 2;
    justify-self: start;
    font-size: 11px;
  }
  .vr-chat-plan-row {
    grid-template-columns: 28px minmax(0, 1fr) auto;
  }
  .vr-chat-plan-row b {
    display: none;
  }
  .vr-topbar-select {
    display: none;
  }
  .vr-bottom-inventory,
  .vr-providers-panel,
  .vr-releases-panel,
  .vr-agent-panel,
  .vr-bottom-tip-bar {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: hidden;
  }
  .vr-chat-card-row,
  .vr-chat-mission-summary,
  .vr-bottom-inventory .vr-provider-grid,
  .vr-bottom-inventory .vr-release-track {
    grid-template-columns: 1fr;
  }
  .vr-bottom-inventory .vr-provider-card,
  .vr-provider-add-card {
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }
  .vr-release-composition,
  .vr-release-list,
  .vr-release-actions {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    grid-template-columns: 1fr;
  }
  .vr-release-row {
    width: 100%;
    max-width: 100%;
  }
  .vr-chat-mission-summary,
  .vr-chat-message > p,
  .vr-chat-copy {
    padding-left: 0;
  }
  .vr-chat-command-bar > .vr-chat-composer {
    grid-template-columns: minmax(0, 1fr) 38px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    min-height: 92px;
  }
  .vr-chat-input {
    grid-column: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .vr-chat-command-bar > .vr-chat-composer > span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .vr-model-picker {
    grid-column: 1 / -1;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
    justify-self: start;
    scrollbar-width: thin;
  }
  .vr-model-picker > button {
    max-width: 180px;
    min-width: 0;
  }
  .vr-model-picker > button strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .vr-chat-command-bar > .vr-chat-composer > button {
    grid-column: auto;
  }
  .vr-chat-command-bar > .vr-chat-composer > .vr-chat-send {
    grid-column: 2;
  }
  .vr-timeline-rail {
    display: none;
  }
}
`;

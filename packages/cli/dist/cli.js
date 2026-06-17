#!/usr/bin/env node
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/cli.ts
var cli_exports = {};
__export(cli_exports, {
  main: () => main,
  startLocalUiServer: () => startLocalUiServer
});
module.exports = __toCommonJS(cli_exports);
var import_node_http = require("node:http");
var import_node_fs = require("node:fs");
var import_promises = require("node:fs/promises");
var import_node_path = require("node:path");
var import_node_crypto = require("node:crypto");

// src/local-ui/staticApp.ts
function renderLocalUiHtml() {
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
      height: 38px;
      display: inline-grid;
      place-items: center;
      flex: 0 0 auto;
    }
    .raven-mark svg {
      width: 58px;
      height: 38px;
      display: block;
    }
    .tagline {
      border: 1px solid var(--line);
      border-radius: 7px;
      padding: 9px 16px;
      color: var(--ink);
      font-size: 14px;
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
      grid-template-columns: 340px minmax(600px, 1fr) 410px;
      min-height: 0;
      height: 100%;
      overflow: hidden;
    }
    .rail {
      border-right: 1px solid var(--line);
      padding: 24px 26px 28px;
      background: var(--canvas);
      overflow: auto;
      min-height: 0;
    }
    .rail-title {
      margin: 0 0 14px;
      color: var(--muted-strong);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
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
      min-height: 68px;
      display: grid;
      grid-template-columns: 44px minmax(0, 1fr) 8px 12px;
      gap: 13px;
      align-items: center;
      text-align: left;
      padding: 12px;
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
      border-radius: var(--radius);
      background: var(--surface);
      padding: 18px;
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
      padding: 38px 48px 40px;
      overflow: auto;
      background: var(--canvas);
      min-height: 0;
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
      font-size: 28px;
      line-height: 1.15;
      font-weight: 750;
    }
    .provider-heading p {
      margin: 5px 0 0;
      color: var(--muted-strong);
      font-size: 15px;
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
      padding-left: 42px;
    }
    .path-list::before {
      content: "";
      position: absolute;
      left: 18px;
      top: 26px;
      bottom: 26px;
      width: 1px;
      background: var(--line-strong);
    }
    .path-row {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      padding: 16px 20px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 14px;
      position: relative;
      margin-bottom: 12px;
    }
    .path-row::before {
      content: "";
      position: absolute;
      left: -35px;
      top: 18px;
      width: 26px;
      height: 26px;
      border: 1px solid var(--line-strong);
      border-radius: 999px;
      background: var(--surface);
    }
    .path-row::after {
      content: "";
      position: absolute;
      left: -25px;
      top: 28px;
      width: 7px;
      height: 7px;
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
      margin: 10px 0 0 42px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--surface);
      padding: 22px;
    }
    .next-fix h2 {
      margin: 0 0 14px;
      font-size: 15px;
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
      padding: 16px 0;
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
      font-size: 14px;
      line-height: 1.2;
    }
    .fix-section p {
      margin: 0;
      color: var(--muted-strong);
      font-size: 14px;
      line-height: 1.45;
    }
    .drawer {
      border-left: 1px solid var(--line);
      padding: 34px 24px;
      background: var(--surface);
      overflow: auto;
      min-height: 0;
    }
    .drawer h2 {
      margin: 0;
      font-size: 20px;
      line-height: 1.2;
    }
    .drawer p {
      margin: 8px 0 16px;
      color: var(--muted-strong);
      font-size: 14px;
      line-height: 1.4;
    }
    .prompt-box {
      width: 100%;
      min-height: 410px;
      resize: vertical;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 14px;
      background: var(--surface);
      color: var(--muted-strong);
      font: 14px/1.75 var(--mono);
    }
    .drawer-actions {
      display: grid;
      gap: 9px;
      margin-top: 12px;
    }
    .drawer-actions button {
      min-height: 42px;
      font-weight: 650;
      position: relative;
    }
    #copy::before, #tasklist::before, #drawer-verify::before, #verify::before {
      content: "";
      display: inline-block;
      width: 15px;
      height: 15px;
      margin-right: 8px;
      vertical-align: -2px;
      border: 1.7px solid currentColor;
      border-radius: 3px;
    }
    #tasklist::before {
      border-left: 0;
      border-right: 0;
      border-radius: 0;
      box-shadow: 0 5px 0 -3px currentColor, 0 -5px 0 -3px currentColor;
    }
    #drawer-verify::before, #verify::before {
      border-radius: 999px 999px 999px 2px;
      transform: rotate(45deg);
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
        grid-template-columns: 1fr 38px 1fr;
      }
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
        <svg viewBox="0 0 116 76" role="img" aria-label="VibeRaven mark">
          <path fill="#071018" d="M5 45c17-1 31-8 43-21C60 11 74 5 91 5c-7 4-12 9-16 15 12-4 24-3 36 3-13 2-23 7-31 15 9 0 18 2 27 7-23 7-43 9-60 6-15-3-29-5-42-6Z"/>
          <path fill="#18222c" d="M16 56c16-4 29-11 41-22 10-10 22-15 37-16-9 8-14 17-17 26-16 11-36 15-61 12Z"/>
          <path fill="#ffffff" d="M36 29c12-6 25-10 38-12-8 5-15 11-22 18-6-3-11-5-16-6Z"/>
          <path fill="#ff7a00" d="M69 50c14-4 28-4 42 1-13 5-25 11-35 20 1-8-1-15-7-21Z"/>
          <path fill="#ff7a00" d="M85 30c9 2 17 5 25 10-10-1-18 0-26 3-1-4-1-8 1-13Z"/>
          <circle cx="83" cy="18" r="3" fill="#ffffff"/>
        </svg>
      </span>
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
        <div class="command-pill"><span>$ npx -y viberaven</span></div>
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
      <span id="footer-command" class="footer-command">npx -y viberaven</span>
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

// src/version.ts
var VERSION = "1.1.10-public-localhost";

// src/cli.ts
function brandSvg(title, fill, path) {
  return `<svg viewBox="0 0 24 24" role="img" aria-label="${title} logo" fill="${fill}"><title>${title}</title><path d="${path}"/></svg>`;
}
var PUBLIC_PROVIDER_CATALOG = [
  {
    id: "supabase",
    label: "Supabase",
    area: "database",
    stateWhenDetected: "needs_repo_fix",
    aliases: ["supabase", "rls", "row level security", "row-level security", "migration", "database"],
    iconHtml: brandSvg("Supabase", "#3FCF8E", "M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.014.985 1.259 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.642z"),
    rows: [
      { id: "schema-migrations", title: "Schema and migrations", whyItMatters: "Production data shape needs repo-owned evidence before real users write to it.", whatToChange: "Add or update migration files that prove the production schema and indexes.", verifyWith: "Run npx -y viberaven --verify.", keywords: ["schema", "migration", "database"] },
      { id: "rls-policies", title: "RLS policies", whyItMatters: "User data must be protected by row ownership rules before launch.", whatToChange: "Add policy SQL that enables RLS and restricts reads and writes to the authenticated owner.", verifyWith: "Run npx -y viberaven --verify.", keywords: ["rls", "policy", "row"] },
      { id: "auth-callbacks", title: "Auth callbacks", whyItMatters: "Authentication breaks when production callback URLs are missing or local-only.", whatToChange: "Document production site URL and redirect URL evidence without secrets.", verifyWith: "Run npx -y viberaven --verify.", keywords: ["auth", "callback", "redirect"] },
      { id: "production-env", title: "Production env", whyItMatters: "Production database URLs and keys must be explicit and safely scoped.", whatToChange: "Add safe env placeholders for URL, anon key, and server-only service-role boundaries.", verifyWith: "Run npx -y viberaven --verify.", keywords: ["env", "secret", "url"] }
    ]
  },
  {
    id: "vercel",
    label: "Vercel",
    area: "deployment",
    stateWhenDetected: "repo_evidence_found",
    aliases: ["vercel", "deployment", "deploy", "hosting", "preview"],
    iconHtml: brandSvg("Vercel", "#000000", "m12 1.608 12 20.784H0Z"),
    rows: [
      { id: "preview-gate", title: "Preview deployment gate", whyItMatters: "Every production change should have a reproducible preview path.", whatToChange: "Add repo evidence for preview deploys, build command, and required checks.", verifyWith: "Run npx -y viberaven --verify.", keywords: ["preview", "deploy", "ci"] },
      { id: "production-env", title: "Production env", whyItMatters: "Production runtime variables must be named without leaking values.", whatToChange: "Document required production env names in repo evidence.", verifyWith: "Run npx -y viberaven --verify.", keywords: ["env", "secret"] },
      { id: "domain-routing", title: "Domain and routing", whyItMatters: "The launch URL needs canonical HTTPS and predictable routes.", whatToChange: "Add evidence for the production domain, redirects, and framework routing assumptions.", verifyWith: "Run npx -y viberaven --verify.", keywords: ["domain", "route"] }
    ]
  },
  {
    id: "stripe",
    label: "Stripe",
    area: "payments",
    stateWhenDetected: "connect_live",
    aliases: ["stripe", "payment", "checkout", "subscription", "webhook"],
    iconHtml: brandSvg("Stripe", "#635BFF", "M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"),
    rows: [
      { id: "checkout-route", title: "Checkout route", whyItMatters: "Money movement needs a trusted server-side path.", whatToChange: "Add checkout or subscription route evidence with stable price env names.", verifyWith: "Run npx -y viberaven --verify.", keywords: ["checkout", "price"] },
      { id: "webhook-authenticity", title: "Webhook authenticity", whyItMatters: "Payment state must be reconciled from trusted server events.", whatToChange: "Add webhook route evidence with authenticity checks and idempotency.", verifyWith: "Run npx -y viberaven --verify.", keywords: ["webhook", "authenticity"] },
      { id: "customer-portal", title: "Customer portal", whyItMatters: "Users need a way to manage subscription state without support.", whatToChange: "Add repo evidence for customer portal or account payment routes.", verifyWith: "Run npx -y viberaven --verify.", keywords: ["portal", "customer"] }
    ]
  },
  {
    id: "github",
    label: "GitHub",
    area: "testing",
    stateWhenDetected: "repo_evidence_found",
    aliases: ["github", "actions", "workflow", "pull request", "ci"],
    iconHtml: brandSvg("GitHub", "#181717", "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"),
    rows: [
      { id: "required-checks", title: "Required checks", whyItMatters: "Unsafe changes should not merge without automated proof.", whatToChange: "Add workflow evidence for tests, typecheck, build, or public export verification.", verifyWith: "Run npx -y viberaven --verify.", keywords: ["actions", "workflow", "ci"] },
      { id: "branch-protection", title: "Branch protection", whyItMatters: "CI is advisory unless merge rules require it.", whatToChange: "Document required checks or owner review expectations in repo evidence.", verifyWith: "Run npx -y viberaven --verify.", keywords: ["branch", "review"] }
    ]
  },
  {
    id: "sentry",
    label: "Sentry",
    area: "monitoring",
    stateWhenDetected: "blocked",
    aliases: ["sentry", "error", "monitoring", "trace", "dsn"],
    iconHtml: brandSvg("Sentry", "#362D59", "M13.91 2.505c-.873-1.448-2.972-1.448-3.844 0L6.904 7.92a15.478 15.478 0 0 1 8.53 12.811h-2.221A13.301 13.301 0 0 0 5.784 9.814l-2.926 5.06a7.65 7.65 0 0 1 4.435 5.848H2.194a.365.365 0 0 1-.298-.534l1.413-2.402a5.16 5.16 0 0 0-1.614-.913L.296 19.275a2.182 2.182 0 0 0 .812 2.999 2.24 2.24 0 0 0 1.086.288h6.983a9.322 9.322 0 0 0-3.845-8.318l1.11-1.922a11.47 11.47 0 0 1 4.95 10.24h5.915a17.242 17.242 0 0 0-7.885-15.28l2.244-3.845a.37.37 0 0 1 .504-.13c.255.14 9.75 16.708 9.928 16.9a.365.365 0 0 1-.327.543h-2.287c.029.612.029 1.223 0 1.831h2.297a2.206 2.206 0 0 0 1.922-3.31z"),
    rows: [
      { id: "runtime-capture", title: "Runtime capture", whyItMatters: "Production errors need a destination before users report them.", whatToChange: "Add Sentry DSN env evidence and runtime initialization proof.", verifyWith: "Run npx -y viberaven --verify.", keywords: ["dsn", "error"] },
      { id: "release-context", title: "Release context", whyItMatters: "Errors need commit and release metadata to be actionable.", whatToChange: "Add release, environment, or source-map evidence.", verifyWith: "Run npx -y viberaven --verify.", keywords: ["release", "source map"] }
    ]
  },
  {
    id: "clerk",
    label: "Clerk",
    area: "auth",
    stateWhenDetected: "connect_live",
    aliases: ["clerk", "auth", "session", "middleware"],
    iconHtml: brandSvg("Clerk", "#6C47FF", "m21.47 20.829-2.881-2.881a.572.572 0 0 0-.7-.084 6.854 6.854 0 0 1-7.081 0 .576.576 0 0 0-.7.084l-2.881 2.881a.576.576 0 0 0-.103.69.57.57 0 0 0 .166.186 12 12 0 0 0 14.113 0 .58.58 0 0 0 .239-.423.576.576 0 0 0-.172-.453Zm.002-17.668-2.88 2.88a.569.569 0 0 1-.701.084A6.857 6.857 0 0 0 8.724 8.08a6.862 6.862 0 0 0-1.222 3.692 6.86 6.86 0 0 0 .978 3.764.573.573 0 0 1-.083.699l-2.881 2.88a.567.567 0 0 1-.864-.063A11.993 11.993 0 0 1 6.771 2.7a11.99 11.99 0 0 1 14.637-.405.566.566 0 0 1 .232.418.57.57 0 0 1-.168.448Zm-7.118 12.261a3.427 3.427 0 1 0 0-6.854 3.427 3.427 0 0 0 0 6.854Z"),
    rows: [
      { id: "session-boundary", title: "Session boundary", whyItMatters: "Protected routes need server-side identity checks.", whatToChange: "Add evidence for session middleware and protected API boundaries.", verifyWith: "Run npx -y viberaven --verify.", keywords: ["session", "middleware"] },
      { id: "callback-urls", title: "Callback URLs", whyItMatters: "Auth flows fail when production redirects are missing.", whatToChange: "Document production callback and redirect env names.", verifyWith: "Run npx -y viberaven --verify.", keywords: ["callback", "redirect"] }
    ]
  },
  {
    id: "posthog",
    label: "PostHog",
    area: "analytics",
    stateWhenDetected: "connect_live",
    aliases: ["posthog", "analytics", "event", "funnel"],
    iconHtml: brandSvg("PostHog", "#000000", "M9.854 14.5 5 9.647.854 5.5A.5.5 0 0 0 0 5.854V8.44a.5.5 0 0 0 .146.353L5 13.647l.147.146L9.854 18.5l.146.147v-.049c.065.03.134.049.207.049h2.586a.5.5 0 0 0 .353-.854L9.854 14.5zm0-5-4-4a.487.487 0 0 0-.409-.144.515.515 0 0 0-.356.21.493.493 0 0 0-.089.288V8.44a.5.5 0 0 0 .147.353l9 9a.5.5 0 0 0 .853-.354v-2.585a.5.5 0 0 0-.146-.354l-5-5zm1-4a.5.5 0 0 0-.854.354V8.44a.5.5 0 0 0 .147.353l4 4a.5.5 0 0 0 .853-.354V9.854a.5.5 0 0 0-.146-.354l-4-4zm12.647 11.515a3.863 3.863 0 0 1-2.232-1.1l-4.708-4.707a.5.5 0 0 0-.854.354v6.585a.5.5 0 0 0 .5.5H23.5a.5.5 0 0 0 .5-.5v-.6c0-.276-.225-.497-.499-.532zm-5.394.032a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6zM.854 15.5a.5.5 0 0 0-.854.354v2.293a.5.5 0 0 0 .5.5h2.293c.222 0 .39-.135.462-.309a.493.493 0 0 0-.109-.545L.854 15.5zM5 14.647.854 10.5a.5.5 0 0 0-.854.353v2.586a.5.5 0 0 0 .146.353L4.854 18.5l.146.147h2.793a.5.5 0 0 0 .353-.854L5 14.647z"),
    rows: [
      { id: "event-taxonomy", title: "Event taxonomy", whyItMatters: "Analytics should answer launch questions, not just count views.", whatToChange: "Add named events for account creation, activation, and conversion points.", verifyWith: "Run npx -y viberaven --verify.", keywords: ["event", "taxonomy"] },
      { id: "privacy-boundary", title: "Capture boundary", whyItMatters: "Session capture can expose sensitive fields if unchecked.", whatToChange: "Add masking, opt-out, or capture-boundary evidence.", verifyWith: "Run npx -y viberaven --verify.", keywords: ["privacy", "capture"] }
    ]
  }
];
function haystack(value) {
  return JSON.stringify(value ?? {}).toLowerCase();
}
function gapMatchesProvider(gap, provider) {
  const text = [gap.id, gap.title, gap.detail, gap.category, gap.primaryMapCategory].join(" ").toLowerCase();
  return provider.aliases.some((alias) => text.includes(alias));
}
function artifactHasEvidenceForProvider(artifact, provider) {
  if (!artifact) return false;
  const text = haystack({
    stackWiring: artifact.stackWiring,
    providerRegistry: artifact.providerRegistry,
    missionGraph: artifact.missionGraph
  });
  return provider.aliases.some((alias) => text.includes(alias));
}
function gapForProvider(artifact, provider) {
  return artifact?.gaps.find((gap) => gapMatchesProvider(gap, provider));
}
function pathState(providerState, rowId, focusedRowId) {
  if (focusedRowId === rowId) {
    if (providerState === "blocked") return "blocked";
    if (providerState === "connect_live") return "needs_connect";
    return "needs_fix";
  }
  if (providerState === "repo_evidence_found") return "ready";
  return "not_checked";
}
function rowForGap(provider, gap) {
  if (!gap) return provider.id === "supabase" ? provider.rows[1] ?? provider.rows[0] : provider.rows[0];
  const text = [gap.id, gap.title, gap.detail, gap.category, gap.primaryMapCategory].join(" ").toLowerCase();
  const scored = provider.rows.map((row) => ({
    row,
    score: row.keywords.reduce((total, keyword) => text.includes(keyword.toLowerCase()) ? total + keyword.length : total, 0)
  })).sort((left, right) => right.score - left.score);
  return scored[0]?.score ? scored[0].row : provider.rows[0];
}
function send(res, status, body, contentType) {
  res.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store"
  });
  res.end(body);
}
function sendJson(res, status, body) {
  send(res, status, JSON.stringify(body), "application/json; charset=utf-8");
}
function workspaceFrom(input) {
  return (0, import_node_path.resolve)(process.cwd(), input ?? ".");
}
async function readOptional(path) {
  try {
    return await (0, import_promises.readFile)(path, "utf8");
  } catch {
    return "";
  }
}
async function buildArtifact(workspacePath) {
  const packageJson = await readOptional((0, import_node_path.join)(workspacePath, "package.json"));
  const envExample = await readOptional((0, import_node_path.join)(workspacePath, ".env.example"));
  const vercelJson = await readOptional((0, import_node_path.join)(workspacePath, "vercel.json"));
  const hasTests = /"test"\s*:|vitest|jest|playwright/i.test(packageJson);
  const hasDeploy = Boolean(vercelJson) || /vercel|netlify|render|railway/i.test(packageJson);
  const hasSupabase = (0, import_node_fs.existsSync)((0, import_node_path.join)(workspacePath, "supabase")) || /supabase/i.test(packageJson);
  const gaps = [];
  if (!packageJson) {
    gaps.push({
      id: "LOCAL-PACKAGE-001",
      title: "Missing package manifest",
      detail: "No package.json was found at the scan root.",
      severity: "warning",
      category: "appFlow",
      primaryMapCategory: "appFlow"
    });
  }
  if (!envExample) {
    gaps.push({
      id: "LOCAL-ENV-001",
      title: "Missing env example",
      detail: "Add .env.example with non-secret placeholders for required variables.",
      severity: "warning",
      category: "security",
      primaryMapCategory: "security"
    });
  }
  if (!hasTests) {
    gaps.push({
      id: "LOCAL-TEST-001",
      title: "Missing test command evidence",
      detail: "Add a package.json test script or test dependency so local verification has repo evidence.",
      severity: "warning",
      category: "testing",
      primaryMapCategory: "testing"
    });
  }
  if (!hasDeploy) {
    gaps.push({
      id: "LOCAL-DEPLOY-001",
      title: "Missing deployment evidence",
      detail: "Add deployment configuration or package metadata showing the intended production target.",
      severity: "info",
      category: "deployment",
      primaryMapCategory: "deployment"
    });
  }
  if (hasSupabase && !(0, import_node_fs.existsSync)((0, import_node_path.join)(workspacePath, "supabase", "migrations"))) {
    gaps.push({
      id: "LOCAL-SUPABASE-001",
      title: "Missing Supabase migration evidence",
      detail: "Supabase appears in the repo, but no supabase/migrations directory was found.",
      severity: "warning",
      category: "database",
      primaryMapCategory: "database"
    });
  }
  const score = Math.max(0, 100 - gaps.length * 15);
  const status = gaps.some((gap) => gap.severity !== "info") ? "not_clear" : "clear";
  return {
    version: 1,
    scannedAt: (/* @__PURE__ */ new Date()).toISOString(),
    workspacePath,
    score,
    scoreLabel: status === "clear" ? "Local evidence clear" : "Local evidence needs work",
    summary: status === "clear" ? "Local repo evidence is present for the checked surfaces." : "Local repo evidence gaps were found.",
    archetype: "local-first-public-cli",
    gaps,
    missionGraph: {
      areas: [
        { key: "appFlow", label: "App flow", readinessPercent: packageJson ? 100 : 50 },
        { key: "security", label: "Security", readinessPercent: envExample ? 100 : 50 },
        { key: "testing", label: "Testing", readinessPercent: hasTests ? 100 : 50 },
        { key: "deployment", label: "Deployment", readinessPercent: hasDeploy ? 100 : 50 },
        {
          key: "database",
          label: "Database",
          readinessPercent: hasSupabase ? (0, import_node_fs.existsSync)((0, import_node_path.join)(workspacePath, "supabase", "migrations")) ? 100 : 50 : 100
        }
      ]
    },
    stackWiring: {
      detected: [packageJson && "package.json", envExample && ".env.example", hasDeploy && "deployment-config", hasSupabase && "supabase"].filter(Boolean)
    },
    providerRegistry: {
      providers: [
        { provider: "local-readiness", label: "Local readiness" },
        { provider: "vercel", label: "Vercel" },
        { provider: "supabase", label: "Supabase" }
      ]
    },
    verificationSummary: { status, checkedAt: (/* @__PURE__ */ new Date()).toISOString() },
    productionCorePercent: score
  };
}
function gateResult(artifact) {
  return {
    gate: { status: artifact.verificationSummary.status, checkedAt: artifact.verificationSummary.checkedAt },
    summary: artifact.summary,
    gaps: artifact.gaps.map((gap) => ({ id: gap.id, title: gap.title, severity: gap.severity, status: "open" }))
  };
}
function tasklist(artifact) {
  const lines = ["# VibeRaven Local Tasklist", "", `Workspace: ${artifact.workspacePath}`, `Gate: ${artifact.verificationSummary.status}`, ""];
  if (artifact.gaps.length === 0) {
    lines.push("No local repo-evidence gaps found.");
  } else {
    for (const gap of artifact.gaps) {
      lines.push(`## ${gap.id}: ${gap.title}`, "", gap.detail, "", `Severity: ${gap.severity}`, "");
    }
  }
  return `${lines.join("\n").trim()}
`;
}
async function writeArtifacts(workspacePath, artifact) {
  const out = (0, import_node_path.join)(workspacePath, ".viberaven");
  await (0, import_promises.mkdir)(out, { recursive: true });
  await (0, import_promises.writeFile)((0, import_node_path.join)(out, "last-scan.json"), `${JSON.stringify(artifact, null, 2)}
`);
  await (0, import_promises.writeFile)((0, import_node_path.join)(out, "gate-result.json"), `${JSON.stringify(gateResult(artifact), null, 2)}
`);
  await (0, import_promises.writeFile)((0, import_node_path.join)(out, "agent-tasklist.md"), tasklist(artifact));
  await (0, import_promises.writeFile)(
    (0, import_node_path.join)(out, "context-map.json"),
    `${JSON.stringify(
      {
        version: 1,
        generatedAt: artifact.scannedAt,
        workspacePath,
        gateStatus: artifact.verificationSummary.status,
        openGapIds: artifact.gaps.map((gap) => gap.id),
        detectedEvidence: artifact.stackWiring.detected
      },
      null,
      2
    )}
`
  );
  await (0, import_promises.writeFile)((0, import_node_path.join)(out, "mission-map.md"), `# VibeRaven Local Mission Map

${artifact.missionGraph.areas.map((area) => `- ${area.label}: ${area.readinessPercent}%`).join("\n")}
`);
  await (0, import_promises.writeFile)((0, import_node_path.join)(out, "agent-summary.md"), `# VibeRaven Local Summary

${artifact.summary}
`);
  await (0, import_promises.writeFile)((0, import_node_path.join)(out, "launch-playbook.md"), "# VibeRaven Local Launch Playbook\n\nRun viberaven --verify after each repo-code fix.\n");
}
async function runLocalScan(workspacePath) {
  const artifact = await buildArtifact(workspacePath);
  await writeArtifacts(workspacePath, artifact);
  return artifact;
}
async function loadArtifact(workspacePath) {
  try {
    return JSON.parse(await (0, import_promises.readFile)((0, import_node_path.join)(workspacePath, ".viberaven", "last-scan.json"), "utf8"));
  } catch {
    return void 0;
  }
}
function localState(cwd, artifact) {
  const firstGap = artifact?.gaps[0];
  const providers = PUBLIC_PROVIDER_CATALOG.map((seed) => {
    const assignedGap = gapForProvider(artifact, seed);
    const focusedGap = assignedGap ?? (seed.id === "supabase" ? firstGap : void 0);
    const focusedRow = rowForGap(seed, focusedGap);
    const hasEvidence = artifactHasEvidenceForProvider(artifact, seed);
    const providerState = focusedGap ? seed.id === "sentry" ? "blocked" : "needs_repo_fix" : hasEvidence ? "repo_evidence_found" : artifact ? seed.stateWhenDetected : seed.stateWhenDetected;
    const launchPath = seed.rows.map((row) => ({
      id: row.id,
      title: row.title,
      whyItMatters: row.whyItMatters,
      whatToChange: row.whatToChange,
      verifyWith: row.verifyWith,
      keywords: row.keywords,
      area: seed.area,
      state: pathState(providerState, row.id, focusedGap ? focusedRow.id : void 0)
    }));
    const defaultNextFix = !artifact && seed.id === "supabase" ? {
      gapId: "LOCAL-SCAN-001",
      launchPathItemId: focusedRow.id,
      launchPathTitle: focusedRow.title,
      currentIssue: "VibeRaven has not scanned this project yet.",
      whyItMatters: "The launch console needs local repo evidence before it can focus the correct provider risk.",
      whatToChange: "Run Local scan or Verify so VibeRaven can map package, env, deployment, test, and provider evidence.",
      verifyWith: "Click Verify or run npx -y viberaven --verify.",
      prompt: [
        `Run VibeRaven local evidence discovery for ${(0, import_node_path.basename)(cwd) || cwd}.`,
        "",
        "Requirements:",
        "- Inspect package, env example, deployment, test, auth, data, payment, and monitoring evidence.",
        "- Identify the first repo-owned launch gap.",
        "- Keep all findings local and do not add secret values.",
        "- Re-run npx -y viberaven --verify after the first repo-code fix.",
        "",
        "Return the first concrete fix to make this app safer to ship."
      ].join("\n")
    } : void 0;
    if (defaultNextFix) {
      const focused = launchPath.find((item) => item.id === defaultNextFix.launchPathItemId);
      if (focused) focused.state = "needs_fix";
    }
    const provider = {
      id: seed.id,
      label: seed.label,
      area: seed.area,
      state: providerState,
      iconHtml: seed.iconHtml,
      launchPath,
      nextFix: focusedGap ? {
        gapId: focusedGap.id,
        launchPathItemId: focusedRow.id,
        launchPathTitle: focusedRow.title,
        currentIssue: focusedGap.detail,
        whyItMatters: focusedRow.whyItMatters,
        whatToChange: focusedRow.whatToChange,
        verifyWith: focusedRow.verifyWith,
        prompt: [
          `Fix the ${seed.label} launch path for ${(0, import_node_path.basename)(cwd) || cwd}.`,
          "",
          `Current VibeRaven gap: ${focusedGap.id} - ${focusedGap.detail}`,
          "",
          "Requirements:",
          `- Address ${focusedRow.title}.`,
          `- ${focusedRow.whatToChange}`,
          "- Keep changes repo-only and do not add secret values.",
          "- Re-run npx -y viberaven --verify when done.",
          "",
          "Return a concise summary of what changed."
        ].join("\n")
      } : defaultNextFix
    };
    return provider;
  });
  const selectedProvider = providers.find((provider) => provider.nextFix) ?? providers.find((provider) => provider.id === "supabase") ?? providers[0];
  return {
    version: 1,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    project: {
      name: (0, import_node_path.basename)(cwd) || cwd,
      workspacePath: cwd,
      score: artifact?.score,
      scoreLabel: artifact?.scoreLabel,
      summary: artifact?.summary,
      gateStatus: artifact?.verificationSummary.status ?? "not_checked"
    },
    providers,
    selectedProviderId: selectedProvider.id,
    command: "npx -y viberaven"
  };
}
async function route(req, res, options) {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  if (req.method === "GET" && url.pathname === "/") {
    send(res, 200, renderLocalUiHtml(), "text/html; charset=utf-8");
    return;
  }
  if (url.pathname.startsWith("/api/") && !isLocalApiRequestAuthorized(req, url, options.token)) {
    sendJson(res, 401, { error: "Unauthorized local UI request." });
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/project") {
    sendJson(res, 200, localState(options.cwd, await loadArtifact(options.cwd)));
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/providers") {
    const state = localState(options.cwd, await loadArtifact(options.cwd));
    sendJson(res, 200, { providers: state.providers, selectedProviderId: state.selectedProviderId });
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/tasklist") {
    let artifact = await loadArtifact(options.cwd);
    if (!artifact) {
      artifact = await runLocalScan(options.cwd);
    }
    send(res, 200, tasklist(artifact), "text/plain; charset=utf-8");
    return;
  }
  if (req.method === "POST" && (url.pathname === "/api/scan" || url.pathname === "/api/verify")) {
    const artifact = await runLocalScan(options.cwd);
    sendJson(res, 200, { ...localState(options.cwd, artifact), exitCode: artifact.verificationSummary.status === "clear" ? 0 : 1 });
    return;
  }
  sendJson(res, 404, { error: "Not found" });
}
function tokenMatches(actual, expected) {
  if (!actual) return false;
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && (0, import_node_crypto.timingSafeEqual)(actualBuffer, expectedBuffer);
}
function isLocalHostHeader(host, port) {
  if (!host || !port) return false;
  const allowed = /* @__PURE__ */ new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
  return allowed.has(host.toLowerCase());
}
function isLocalOrigin(origin, port) {
  if (!origin || !port) return true;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === "http:" && (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") && parsed.port === String(port);
  } catch {
    return false;
  }
}
function isLocalApiRequestAuthorized(req, url, token) {
  const port = req.socket.localPort;
  if (!isLocalHostHeader(req.headers.host, port) || !isLocalOrigin(req.headers.origin, port)) {
    return false;
  }
  const provided = req.headers["x-viberaven-local-ui-token"];
  const headerToken = Array.isArray(provided) ? provided[0] : provided;
  return tokenMatches(headerToken ?? url.searchParams.get("vr_token"), token);
}
function printHelp() {
  console.log(`viberaven ${VERSION}

Usage:
  viberaven [path]
  viberaven ui [path] [--port <port>]
                       Local launch console
  viberaven scan [path]
  viberaven --agent-mode [path]
  viberaven --verify [path]
  viberaven --help
  viberaven --version

This npm package runs deterministic local repo-evidence checks and the localhost UI.
`);
}
function parsePort(argv) {
  const index = argv.indexOf("--port");
  if (index === -1) return 4177;
  const parsed = Number.parseInt(argv[index + 1] ?? "", 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 4177;
}
function firstPathArg(argv) {
  const commands = /* @__PURE__ */ new Set(["ui", "scan", "version"]);
  const flagsWithValues = /* @__PURE__ */ new Set(["--port"]);
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (commands.has(arg)) {
      continue;
    }
    if (flagsWithValues.has(arg)) {
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      continue;
    }
    return arg;
  }
  return void 0;
}
function listen(server, port) {
  return new Promise((resolveListen, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      const address = server.address();
      resolveListen(typeof address === "object" && address ? address.port : port);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, "127.0.0.1");
  });
}
async function startLocalUiServer(port, cwd) {
  const token = (0, import_node_crypto.randomBytes)(18).toString("base64url");
  const server = (0, import_node_http.createServer)((req, res) => {
    route(req, res, { cwd, token }).catch((error) => {
      sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
    });
  });
  const actualPort = await listen(server, port);
  const origin = `http://127.0.0.1:${actualPort}`;
  const url = `${origin}/?vr_token=${encodeURIComponent(token)}`;
  const close = async () => {
    await new Promise((resolveClose, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolveClose();
      });
    });
  };
  return { url, origin, port: actualPort, close };
}
async function main(argv = process.argv.slice(2)) {
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return 0;
  }
  if (argv.includes("--version") || argv.includes("-v") || argv[0] === "version") {
    console.log(VERSION);
    return 0;
  }
  if (argv[0] === "scan" || argv.includes("--agent-mode") || argv.includes("--verify")) {
    const workspace = workspaceFrom(firstPathArg(argv));
    const artifact = await runLocalScan(workspace);
    console.log(`VibeRaven local scan wrote ${(0, import_node_path.join)(workspace, ".viberaven")}`);
    if (argv.includes("--agent-mode")) {
      console.log(tasklist(artifact).trimEnd());
    }
    return argv.includes("--verify") && artifact.verificationSummary.status !== "clear" ? 1 : 0;
  }
  if (argv[0] === "ui" || argv.length === 0 || firstPathArg(argv)) {
    const pathArg = firstPathArg(argv);
    if (argv[0] !== "ui" && pathArg && !(0, import_node_fs.existsSync)(workspaceFrom(pathArg))) {
      console.error(`Unknown command or missing path: ${argv[0]}`);
      printHelp();
      return 1;
    }
    const handle = await startLocalUiServer(parsePort(argv), workspaceFrom(pathArg));
    console.log(`VibeRaven local UI: ${handle.url}`);
    return 0;
  }
  console.error(`Unknown command: ${argv[0]}`);
  printHelp();
  return 1;
}
if (require.main === module) {
  main().then((code) => {
    process.exitCode = code;
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  main,
  startLocalUiServer
});
//# sourceMappingURL=cli.js.map

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

// src/lib/cli-runner.ts
var cli_runner_exports = {};
__export(cli_runner_exports, {
  __resetSpawnForTest: () => __resetSpawnForTest,
  __setSpawnForTest: () => __setSpawnForTest,
  buildHealArgs: () => buildHealArgs,
  buildNpxCommand: () => buildNpxCommand,
  buildToolArgs: () => buildToolArgs,
  resolveCwd: () => resolveCwd,
  runVibeRaven: () => runVibeRaven,
  safeStringArg: () => safeStringArg
});
module.exports = __toCommonJS(cli_runner_exports);
var import_node_child_process = require("node:child_process");
var CLI_PACKAGE = "@viberaven/cli";
var spawnFn = import_node_child_process.spawn;
function __setSpawnForTest(fn) {
  spawnFn = fn;
}
function __resetSpawnForTest() {
  spawnFn = import_node_child_process.spawn;
}
function safeStringArg(value, label) {
  if (typeof value !== "string") throw new Error(`Invalid ${label}: expected string`);
  if (!value.trim()) throw new Error(`Invalid ${label}: expected non-empty string`);
  if (/[&|<>^%!"\r\n]/.test(value)) throw new Error(`Unsafe characters in ${label}`);
  return value;
}
function resolveCwd(cwd) {
  if (cwd === void 0 || cwd === null) return process.cwd();
  if (typeof cwd !== "string") throw new Error("Invalid cwd: expected string");
  if (!cwd.trim()) throw new Error("Invalid cwd: expected non-empty string");
  return cwd;
}
function buildNpxCommand(args) {
  if (process.platform === "win32") {
    return { command: "cmd.exe", args: ["/d", "/s", "/c", "npx", ...args], shell: false };
  }
  return { command: "npx", args, shell: false };
}
function buildHealArgs(prefix, args) {
  const cliArgs = [...prefix];
  if (args.target) cliArgs.push("--target", safeStringArg(args.target, "target"));
  if (args.gap) cliArgs.push("--gap", safeStringArg(args.gap, "gap"));
  return cliArgs;
}
function buildToolArgs(name, args) {
  switch (name) {
    case "viberaven_check_readiness":
      return ["--agent-mode"];
    case "viberaven_verify":
      return ["--verify"];
    case "viberaven_audit":
      return ["audit", "--vercel-supabase", ...args.json ? ["--json"] : []];
    case "viberaven_init_rules": {
      const cliArgs = ["init"];
      if (args.agents) cliArgs.push("--agents", safeStringArg(args.agents, "agents"));
      if (args.dryRun) cliArgs.push("--dry-run");
      return cliArgs;
    }
    case "viberaven_clean_plan":
      return ["clean", "--plan"];
    case "viberaven_strict_gate":
      return ["--agent-mode", "--strict", "--json"];
    case "viberaven_gate_result":
      return ["--agent-mode", "--json"];
    case "viberaven_context_map":
      return ["--condense"];
    case "viberaven_actions":
      return ["actions"];
    case "viberaven_verify_action":
      return ["--verify", "--action", safeStringArg(args.actionId, "actionId")];
    case "viberaven_heal_plan":
      return buildHealArgs(["--heal", "--plan"], args);
    case "viberaven_heal_prompt":
      return buildHealArgs(["--heal", "--prompt"], args);
    case "viberaven_heal_apply": {
      const cliArgs = buildHealArgs(["--heal", "--apply"], args);
      if (args.yes === true) cliArgs.push("--yes");
      return cliArgs;
    }
    case "viberaven_validate_npm_package": {
      const names = [];
      if (args.packageName) names.push(safeStringArg(args.packageName, "packageName"));
      if (Array.isArray(args.packageNames)) {
        for (const entry of args.packageNames) names.push(safeStringArg(entry, "packageName"));
      }
      if (names.length === 0) throw new Error("packageName or packageNames is required");
      return ["validate-npm-package", "--json", ...names];
    }
    default:
      throw new Error(`Unknown VibeRaven tool: ${name}`);
  }
}
function runVibeRaven(args, cwd) {
  return new Promise((resolve) => {
    const built = buildNpxCommand(["-y", CLI_PACKAGE, ...args]);
    const child = spawnFn(built.command, built.args, {
      cwd: resolveCwd(cwd),
      env: process.env,
      shell: built.shell,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => resolve(`ERROR: ${error.message}`));
    child.on("close", (code) => {
      const combined = `${stdout}${stderr}`.trim();
      resolve(`exit ${code ?? 1}${combined ? `
${combined}` : ""}`);
    });
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  __resetSpawnForTest,
  __setSpawnForTest,
  buildHealArgs,
  buildNpxCommand,
  buildToolArgs,
  resolveCwd,
  runVibeRaven,
  safeStringArg
});

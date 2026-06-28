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

// src/server.ts
var server_exports = {};
__export(server_exports, {
  ALL_TOOLS: () => ALL_TOOLS,
  SERVER_INFO: () => SERVER_INFO
});
module.exports = __toCommonJS(server_exports);
var import_server = require("@modelcontextprotocol/sdk/server/index.js");
var import_stdio = require("@modelcontextprotocol/sdk/server/stdio.js");
var import_types = require("@modelcontextprotocol/sdk/types.js");

// src/tools/readiness.ts
var cwdSchema = {
  type: "object",
  properties: { cwd: { type: "string", description: "Project root. Defaults to the MCP server cwd." } },
  additionalProperties: false
};
var readinessTools = [
  {
    name: "viberaven_check_readiness",
    description: "Run BEFORE deploying, shipping to real users, or touching auth, database/RLS, billing, webhooks, or environment variables. Scans the repo for launch blockers (missing RLS, leaked secrets, unbounded queries, unsigned webhooks) and writes a prioritized task list to .viberaven/agent-tasklist.md plus a machine verdict to .viberaven/gate-result.json. Returns the gate status and the single next fix. Calling this first avoids wasted code-generation re-runs by surfacing production risks before you write code.",
    inputSchema: cwdSchema
  },
  {
    name: "viberaven_verify",
    description: "Re-scan and refresh VibeRaven readiness artifacts after you apply one fix. Call this once per batch of fixes (not after every edit) to update .viberaven/gate-result.json and confirm whether the gate moved toward clear.",
    inputSchema: cwdSchema
  },
  {
    name: "viberaven_strict_gate",
    description: 'Run the strict production gate and return the machine verdict. Call this right before a deploy or CI pass to confirm gate.status === "clear". Returns JSON suitable for blocking a pipeline.',
    inputSchema: cwdSchema
  },
  {
    name: "viberaven_gate_result",
    description: "Return the current contents of .viberaven/gate-result.json without re-scanning. Use this to read the last machine verdict before deciding whether to deploy.",
    inputSchema: cwdSchema
  },
  {
    name: "viberaven_context_map",
    description: "Refresh and return .viberaven/context-map.json \u2014 a compact summary of the last scan for the next agent step. Use this to load minimal context before acting on a gap.",
    inputSchema: cwdSchema
  }
];

// src/tools/audit.ts
var auditTools = [
  {
    name: "viberaven_audit",
    description: "Run local Vercel + Supabase production checks: table RLS presence, policy quality, view/function boundaries, service-role boundaries, and Vercel pooler usage. Call this when the project uses Supabase or Vercel and you need a focused infra audit beyond the general readiness gate. Pass json: true for machine-readable output.",
    inputSchema: {
      type: "object",
      properties: {
        cwd: { type: "string", description: "Project root. Defaults to current working directory." },
        json: { type: "boolean", description: "Return JSON output." }
      },
      additionalProperties: false
    }
  }
];

// src/tools/heal.ts
var healSchema = {
  type: "object",
  properties: {
    cwd: { type: "string" },
    target: { type: "string", description: "Target file path for the heal." },
    gap: { type: "string", description: "Gap ID from .viberaven/agent-tasklist.md." },
    yes: { type: "boolean", description: "Skip confirmation for apply." }
  },
  additionalProperties: false
};
var healTools = [
  {
    name: "viberaven_heal_plan",
    description: "Write a non-destructive heal plan for a specific gap or target file. Call this BEFORE viberaven_heal_apply to preview the exact repo-code change. Does not modify files.",
    inputSchema: healSchema
  },
  {
    name: "viberaven_heal_prompt",
    description: "Return an agent-ready prompt that fixes a specific gap. Use this when you want a coding agent to apply the fix itself rather than using the guarded recipe.",
    inputSchema: healSchema
  },
  {
    name: "viberaven_heal_apply",
    description: "Apply a guarded, low-risk repo-code heal recipe for a supported gap. Only call this after viberaven_heal_plan. Pass yes: true to skip confirmation. Returns the applied change summary.",
    inputSchema: healSchema
  }
];

// src/tools/rules.ts
var rulesTools = [
  {
    name: "viberaven_init_rules",
    description: "Install bounded VibeRaven agent-instruction rules into native AI instruction files (CLAUDE.md / AGENTS.md / .cursor/rules). Call this once per project so coding agents pull VibeRaven into the deploy/auth/RLS workflow. Use dryRun: true to preview first.",
    inputSchema: {
      type: "object",
      properties: {
        cwd: { type: "string", description: "Project root. Defaults to current working directory." },
        agents: { type: "string", description: "Comma-separated agent targets, or all." },
        dryRun: { type: "boolean", description: "Preview changes without writing files." }
      },
      additionalProperties: false
    }
  },
  {
    name: "viberaven_clean_plan",
    description: "Write a non-destructive cleanup plan for generated .viberaven artifacts and logs. Call this when the .viberaven directory has grown stale. Does not delete anything \u2014 it only produces a reviewable plan.",
    inputSchema: {
      type: "object",
      properties: { cwd: { type: "string", description: "Project root. Defaults to current working directory." } },
      additionalProperties: false
    }
  }
];

// src/tools/actions.ts
var actionTools = [
  {
    name: "viberaven_actions",
    description: "Read the current chat-native action surface from .viberaven/actions.json. Use this to list stable, referenceable action IDs the user can verify or refer to by name.",
    inputSchema: {
      type: "object",
      properties: { cwd: { type: "string", description: "Project root. Defaults to current working directory." } },
      additionalProperties: false
    }
  },
  {
    name: "viberaven_verify_action",
    description: "Verify or explain the lifecycle state of a stable VibeRaven action ID (format VR-A<number>). Use this when the user references a specific action and you need its current state.",
    inputSchema: {
      type: "object",
      properties: { cwd: { type: "string" }, actionId: { type: "string", description: "Action ID like VR-A1." } },
      required: ["actionId"],
      additionalProperties: false
    }
  }
];

// src/tools/npm.ts
var npmTools = [
  {
    name: "viberaven_validate_npm_package",
    description: "Check whether an npm package name exists and looks safe before installing it. Call this BEFORE adding any new dependency. After installing, run viberaven_check_readiness to re-gate the change.",
    inputSchema: {
      type: "object",
      properties: {
        packageName: { type: "string", description: "Single npm package name to validate." },
        packageNames: { type: "array", items: { type: "string" }, description: "Multiple package names to validate in one call." }
      },
      additionalProperties: false
    }
  }
];

// src/lib/cli-runner.ts
var import_node_child_process = require("node:child_process");
var CLI_PACKAGE = "@viberaven/cli";
var spawnFn = import_node_child_process.spawn;
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

// src/tools/index.ts
var [checkReadiness, verify, strictGate, gateResult, contextMap] = readinessTools;
var ALL_TOOLS = [
  checkReadiness,
  verify,
  ...auditTools,
  ...rulesTools,
  strictGate,
  gateResult,
  contextMap,
  ...actionTools,
  ...healTools,
  ...npmTools
];
function parseJsonObjectFromToolText(text) {
  const start = text.indexOf("{");
  if (start === -1) return void 0;
  try {
    return JSON.parse(text.slice(start));
  } catch {
    return void 0;
  }
}
async function callTool(name, args) {
  return runVibeRaven(buildToolArgs(name, args || {}), args?.cwd);
}
async function handleRequest(method, params) {
  if (method === "tools/list") return { tools: ALL_TOOLS };
  if (method === "tools/call") {
    const text = await callTool(params.name, params.arguments || {});
    const parsed = parseJsonObjectFromToolText(text);
    return {
      content: [{ type: "text", text }],
      ...parsed ? { structuredContent: parsed } : {}
    };
  }
  throw new Error(`Unsupported MCP method: ${method}`);
}

// src/server.ts
var SERVER_INFO = { name: "viberaven-mcp", version: "1.2.4" };
var server = new import_server.Server(SERVER_INFO, { capabilities: { tools: {} } });
server.setRequestHandler(
  import_types.ListToolsRequestSchema,
  async (request) => handleRequest("tools/list", request.params)
);
server.setRequestHandler(
  import_types.CallToolRequestSchema,
  async (request) => handleRequest("tools/call", request.params)
);
async function main() {
  const transport = new import_stdio.StdioServerTransport();
  await server.connect(transport);
}
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ALL_TOOLS,
  SERVER_INFO
});

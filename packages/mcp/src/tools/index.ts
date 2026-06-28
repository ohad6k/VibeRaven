import type { Tool } from '../types.js';
import { readinessTools } from './readiness.js';
import { auditTools } from './audit.js';
import { healTools } from './heal.js';
import { rulesTools } from './rules.js';
import { actionTools } from './actions.js';
import { npmTools } from './npm.js';
import { runVibeRaven, buildToolArgs } from '../lib/cli-runner.js';

export { __setSpawnForTest, __resetSpawnForTest } from '../lib/cli-runner.js';

// readinessTools order is intentional — must match canonical ALL_TOOLS order in descriptions.test.mjs / server.test.mjs.
const [checkReadiness, verify, strictGate, gateResult, contextMap] = readinessTools;

export const ALL_TOOLS: Tool[] = [
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

export function parseJsonObjectFromToolText(text: string): unknown | undefined {
  const start = text.indexOf('{');
  if (start === -1) return undefined;
  try { return JSON.parse(text.slice(start)); } catch { return undefined; }
}

export async function callTool(name: string, args: Record<string, unknown>): Promise<string> {
  return runVibeRaven(buildToolArgs(name, args || {}), args?.cwd);
}

export async function handleRequest(method: string, params: any): Promise<any> {
  if (method === 'tools/list') return { tools: ALL_TOOLS };
  if (method === 'tools/call') {
    const text = await callTool(params.name, params.arguments || {});
    const parsed = parseJsonObjectFromToolText(text);
    return {
      content: [{ type: 'text', text }],
      ...(parsed ? { structuredContent: parsed } : {})
    };
  }
  throw new Error(`Unsupported MCP method: ${method}`);
}

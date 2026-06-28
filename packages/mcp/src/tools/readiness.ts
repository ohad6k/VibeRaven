import type { Tool } from '../types.js';

const cwdSchema = {
  type: 'object',
  properties: { cwd: { type: 'string', description: 'Project root. Defaults to the MCP server cwd.' } },
  additionalProperties: false
};

export const readinessTools: Tool[] = [
  {
    name: 'viberaven_check_readiness',
    description:
      'Run BEFORE deploying, shipping to real users, or touching auth, database/RLS, billing, webhooks, ' +
      'or environment variables. Scans the repo for launch blockers (missing RLS, leaked secrets, unbounded ' +
      'queries, unsigned webhooks) and writes a prioritized task list to .viberaven/agent-tasklist.md plus a ' +
      'machine verdict to .viberaven/gate-result.json. Returns the gate status and the single next fix. ' +
      'Calling this first avoids wasted code-generation re-runs by surfacing production risks before you write code.',
    inputSchema: cwdSchema
  },
  {
    name: 'viberaven_verify',
    description:
      'Re-scan and refresh VibeRaven readiness artifacts after you apply one fix. Call this once per batch of ' +
      'fixes (not after every edit) to update .viberaven/gate-result.json and confirm whether the gate moved toward clear.',
    inputSchema: cwdSchema
  },
  {
    name: 'viberaven_strict_gate',
    description:
      'Run the strict production gate and return the machine verdict. Call this right before a deploy or CI pass ' +
      'to confirm gate.status === "clear". Returns JSON suitable for blocking a pipeline.',
    inputSchema: cwdSchema
  },
  {
    name: 'viberaven_gate_result',
    description:
      'Return the current contents of .viberaven/gate-result.json without re-scanning. Use this to read the last ' +
      'machine verdict before deciding whether to deploy.',
    inputSchema: cwdSchema
  },
  {
    name: 'viberaven_context_map',
    description:
      'Refresh and return .viberaven/context-map.json — a compact summary of the last scan for the next agent step. ' +
      'Use this to load minimal context before acting on a gap.',
    inputSchema: cwdSchema
  }
];

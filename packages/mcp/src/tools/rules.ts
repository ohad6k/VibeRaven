import type { Tool } from '../types.js';

export const rulesTools: Tool[] = [
  {
    name: 'viberaven_init_rules',
    description:
      'Install bounded VibeRaven agent-instruction rules into native AI instruction files ' +
      '(CLAUDE.md / AGENTS.md / .cursor/rules). Call this once per project so coding agents pull VibeRaven ' +
      'into the deploy/auth/RLS workflow. Use dryRun: true to preview first.',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: 'Project root. Defaults to current working directory.' },
        agents: { type: 'string', description: 'Comma-separated agent targets, or all.' },
        dryRun: { type: 'boolean', description: 'Preview changes without writing files.' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'viberaven_clean_plan',
    description:
      'Write a non-destructive cleanup plan for generated .viberaven artifacts and logs. Call this when the ' +
      '.viberaven directory has grown stale. Does not delete anything — it only produces a reviewable plan.',
    inputSchema: {
      type: 'object',
      properties: { cwd: { type: 'string', description: 'Project root. Defaults to current working directory.' } },
      additionalProperties: false
    }
  }
];

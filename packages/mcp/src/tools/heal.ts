import type { Tool } from '../types.js';

const healSchema = {
  type: 'object',
  properties: {
    cwd: { type: 'string' },
    target: { type: 'string', description: 'Target file path for the heal.' },
    gap: { type: 'string', description: 'Gap ID from .viberaven/agent-tasklist.md.' },
    yes: { type: 'boolean', description: 'Skip confirmation for apply.' }
  },
  additionalProperties: false
};

export const healTools: Tool[] = [
  {
    name: 'viberaven_heal_plan',
    description:
      'Write a non-destructive heal plan for a specific gap or target file. Call this BEFORE viberaven_heal_apply ' +
      'to preview the exact repo-code change. Does not modify files.',
    inputSchema: healSchema
  },
  {
    name: 'viberaven_heal_prompt',
    description:
      'Return an agent-ready prompt that fixes a specific gap. Use this when you want a coding agent to apply the ' +
      'fix itself rather than using the guarded recipe.',
    inputSchema: healSchema
  },
  {
    name: 'viberaven_heal_apply',
    description:
      'Apply a guarded, low-risk repo-code heal recipe for a supported gap. Only call this after viberaven_heal_plan. ' +
      'Pass yes: true to skip confirmation. Returns the applied change summary.',
    inputSchema: healSchema
  }
];

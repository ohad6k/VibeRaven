import type { Tool } from '../types.js';

export const actionTools: Tool[] = [
  {
    name: 'viberaven_actions',
    description:
      'Read the current chat-native action surface from .viberaven/actions.json. Use this to list stable, ' +
      'referenceable action IDs the user can verify or refer to by name.',
    inputSchema: {
      type: 'object',
      properties: { cwd: { type: 'string', description: 'Project root. Defaults to current working directory.' } },
      additionalProperties: false
    }
  },
  {
    name: 'viberaven_verify_action',
    description:
      'Verify or explain the lifecycle state of a stable VibeRaven action ID (format VR-A<number>). Use this when ' +
      'the user references a specific action and you need its current state.',
    inputSchema: {
      type: 'object',
      properties: { cwd: { type: 'string' }, actionId: { type: 'string', description: 'Action ID like VR-A1.' } },
      required: ['actionId'],
      additionalProperties: false
    }
  }
];

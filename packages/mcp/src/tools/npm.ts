import type { Tool } from '../types.js';

export const npmTools: Tool[] = [
  {
    name: 'viberaven_validate_npm_package',
    description:
      'Check whether an npm package name exists and looks safe before installing it. Call this BEFORE adding any ' +
      'new dependency. After installing, run viberaven_check_readiness to re-gate the change.',
    inputSchema: {
      type: 'object',
      properties: {
        packageName: { type: 'string', description: 'Single npm package name to validate.' },
        packageNames: { type: 'array', items: { type: 'string' }, description: 'Multiple package names to validate in one call.' }
      },
      additionalProperties: false
    }
  }
];

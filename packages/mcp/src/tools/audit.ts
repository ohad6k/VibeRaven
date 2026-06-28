import type { Tool } from '../types.js';

export const auditTools: Tool[] = [
  {
    name: 'viberaven_audit',
    description:
      'Run local Vercel + Supabase production checks: table RLS presence, policy quality, view/function boundaries, ' +
      'service-role boundaries, and Vercel pooler usage. Call this when the project uses Supabase or Vercel and you ' +
      'need a focused infra audit beyond the general readiness gate. Pass json: true for machine-readable output.',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: 'Project root. Defaults to current working directory.' },
        json: { type: 'boolean', description: 'Return JSON output.' }
      },
      additionalProperties: false
    }
  }
];

import {
  buildVercelSupabaseAudit,
  collectVercelSupabaseAuditInput,
  renderVercelSupabaseAudit,
} from './audit';

export async function runAuditCommand(input: {
  cwd: string;
  json?: boolean;
}): Promise<number> {
  const auditInput = await collectVercelSupabaseAuditInput(input.cwd);
  const result = buildVercelSupabaseAudit(auditInput);

  if (input.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(`${renderVercelSupabaseAudit(result)}\n`);
  }

  return result.status === 'pass' ? 0 : 1;
}

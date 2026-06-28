import { describe, expect, it } from 'vitest';
import { buildVercelSupabaseAudit, type VercelSupabaseAuditInput } from '../src/commands/audit';
import { runAuditCommand } from '../src/commands/runAudit';
import { parseArgs } from '../src/cli';

function input(files: VercelSupabaseAuditInput['files']): VercelSupabaseAuditInput {
  return { projectRoot: 'D:\\app', files };
}

describe('buildVercelSupabaseAudit', () => {
  it('flags missing RLS proof and direct 5432 database port usage as needs_work without leaking secrets', () => {
    const result = buildVercelSupabaseAudit(
      input([
        {
          path: '.env.local',
          content: 'DATABASE_URL=postgresql://postgres:secret@db.example.supabase.co:5432/postgres\n'
        }
      ])
    );

    expect(result.status).toBe('needs_work');
    const serialized = JSON.stringify(result);
    expect(serialized).toContain('supabase-rls-policy-proof');
    expect(serialized).toContain('DATABASE_URL=<redacted> (:5432)');
    expect(serialized).not.toContain('secret');
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'supabase-rls-policy-proof',
          status: 'needs_work'
        }),
        expect.objectContaining({
          id: 'vercel-supabase-pooler-port',
          status: 'needs_work'
        })
      ])
    );
  });

  it('passes when RLS, policy SQL, and transaction pooler port 6543 evidence exists without leaking passwords', () => {
    const result = buildVercelSupabaseAudit(
      input([
        {
          path: 'supabase/migrations/001_profiles.sql',
          content: [
            'alter table public.profiles enable row level security;',
            'create policy "profiles select own rows" on public.profiles for select using (auth.uid() = id);'
          ].join('\n')
        },
        {
          path: '.env.example',
          content: 'DATABASE_URL=postgresql://postgres:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres\n'
        }
      ])
    );

    expect(result.status).toBe('pass');
    const serialized = JSON.stringify(result);
    expect(serialized).toContain('DATABASE_URL=<redacted> (:6543)');
    expect(serialized).not.toContain('secret');
    expect(result.checks.every((check) => check.status === 'pass')).toBe(true);
  });

  it('flags browser-exposed service role shaped environment evidence', () => {
    const result = buildVercelSupabaseAudit(
      input([
        {
          path: 'supabase/migrations/001_profiles.sql',
          content: [
            'alter table public.profiles enable row level security;',
            'create policy "profiles select own rows" on public.profiles for select using (true);'
          ].join('\n')
        },
        {
          path: '.env.local',
          content: [
            'POSTGRES_URL=postgresql://postgres:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
            'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service-role-shaped'
          ].join('\n')
        }
      ])
    );

    expect(result.status).toBe('needs_work');
    const serialized = JSON.stringify(result);
    expect(serialized).toContain('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=<redacted>');
    expect(serialized).not.toContain('eyJhbGci');
    expect(serialized).not.toContain('service-role-shaped');
    expect(result.checks).toContainEqual(
      expect.objectContaining({
        id: 'supabase-service-role-boundary',
        status: 'needs_work'
      })
    );
  });
});

describe('runAuditCommand', () => {
  it('returns non-zero when local RLS evidence is missing', async () => {
    const code = await runAuditCommand({
      cwd: process.cwd(),
      json: true,
    });

    expect(code).toBe(1);
  });
});

describe('audit CLI args', () => {
  it('parses audit --vercel-supabase with optional json flag', () => {
    expect(parseArgs(['audit', '--vercel-supabase', '--json'])).toEqual({
      command: 'audit',
      flags: { 'vercel-supabase': true, json: true },
      positional: [],
    });
  });
});

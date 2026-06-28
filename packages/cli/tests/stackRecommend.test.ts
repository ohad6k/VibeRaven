import { describe, expect, it } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { recommendStack } from '../src/stackRecommend';

describe('recommendStack', () => {
  it('returns defaults when package.json is missing', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vr-stack-'));
    const rec = await recommendStack(dir);
    expect(rec.frontend).toBe('react');
    expect(rec.deploy).toBe('vercel');
    expect(rec.detected).toBe(false);
  });

  it('detects next and supabase from package.json', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vr-stack-'));
    await writeFile(
      join(dir, 'package.json'),
      JSON.stringify({
        dependencies: {
          next: '15.0.0',
          '@supabase/supabase-js': '2.0.0',
          tailwindcss: '4.0.0'
        }
      }),
      'utf-8'
    );
    const rec = await recommendStack(dir);
    expect(rec.frontend).toContain('next');
    expect(rec.database).toBe('supabase');
    expect(rec.detected).toBe(true);
  });
});

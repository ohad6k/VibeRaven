import { mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildContextCleanupPlan, writeCleanupPlan } from '../src/commands/cleanPlan';

describe('context cleanup plan', () => {
  it('returns reviewable suggestions without cleanup-plan destructive wording', () => {
    const plan = buildContextCleanupPlan({
      projectRoot: 'D:/app',
      files: [
        { path: 'D:/app/tmp-vite-landing-mobile.out.log', sizeBytes: 9000 },
        { path: 'D:/app/.viberaven/report.html', sizeBytes: 1000 },
        { path: 'D:/app/.next/cache/webpack/client.pack.gz', sizeBytes: 1000 },
        { path: 'D:/app/src/app.ts', sizeBytes: 500 }
      ]
    });

    expect(plan.title).toBe('VibeRaven context cleanup plan');
    expect(plan.items).toContainEqual(
      expect.objectContaining({
        category: 'large-log',
        action: 'review-ignore-or-exclude-manually'
      })
    );
    expect(plan.items).toContainEqual(
      expect.objectContaining({
        category: 'generated-artifact',
        action: 'review-ignore-or-exclude-manually'
      })
    );
    expect(plan.items).toContainEqual(
      expect.objectContaining({
        category: 'cache-directory',
        action: 'review-ignore-or-exclude-manually'
      })
    );
    expect(JSON.stringify(plan)).not.toMatch(/delete|remove|rm|unlink/i);
  });

  it('writes a reviewable markdown plan without deleting input files', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'viberaven-clean-plan-'));
    const inputPath = join(projectRoot, 'tmp-vite-test.out.log');
    await writeFile(inputPath, 'agent log noise\n'.repeat(700), 'utf8');

    const plan = buildContextCleanupPlan({
      projectRoot,
      files: [{ path: inputPath, sizeBytes: (await stat(inputPath)).size }]
    });
    const outputPath = await writeCleanupPlan(projectRoot, plan);

    expect(outputPath).toBe(join(projectRoot, '.viberaven', 'context-cleanup.md'));
    await expect(readFile(inputPath, 'utf8')).resolves.toContain('agent log noise');
    const renderedPlan = await readFile(outputPath, 'utf8');
    expect(renderedPlan).toContain('VibeRaven context cleanup plan');
    expect(renderedPlan).not.toMatch(/delete|remove|rm|unlink/i);
  });
});

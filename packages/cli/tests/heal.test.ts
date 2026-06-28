import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { assertSafeHealTarget } from '../src/heal/pathSafety';
import { runHealCommand } from '../src/commands/heal';
import { loadLoopState } from '../src/loopState';

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
  tempDir = undefined;
});

describe('guarded heal', () => {
  it('rejects targets outside the workspace', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'viberaven-heal-'));
    expect(() => assertSafeHealTarget(tempDir!, '../outside.ts')).toThrow('Heal target must stay inside the workspace');
  });

  it('rejects node_modules and .git targets', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'viberaven-heal-'));
    expect(() => assertSafeHealTarget(tempDir!, 'node_modules/pkg/index.js')).toThrow('Heal target is inside a blocked directory');
    expect(() => assertSafeHealTarget(tempDir!, '.git/config')).toThrow('Heal target is inside a blocked directory');
  });

  it('writes a heal plan without editing source', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'viberaven-heal-'));
    const target = join(tempDir, 'app/api/route.ts');
    await mkdir(join(tempDir, 'app/api'), { recursive: true });
    await writeFile(target, 'try {\n  doWork();\n} catch (error) {\n}\n', 'utf8');

    const result = await runHealCommand({ cwd: tempDir, mode: 'plan', target: 'app/api/route.ts' });

    expect(result.status).toBe('planned');
    expect(existsSync(join(tempDir, '.viberaven', 'heal-plan.md'))).toBe(true);
    expect(await readFile(target, 'utf8')).toContain('catch (error) {\n}');
  });

  it('writes a heal prompt without editing source', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'viberaven-heal-'));
    await mkdir(join(tempDir, 'app/api'), { recursive: true });
    await writeFile(join(tempDir, 'app/api/route.ts'), 'try {\n  doWork();\n} catch (error) {\n}\n', 'utf8');

    const result = await runHealCommand({ cwd: tempDir, mode: 'prompt', target: 'app/api/route.ts' });

    expect(result.status).toBe('prompt_written');
    const prompt = await readFile(join(tempDir, '.viberaven', 'heal-prompt.md'), 'utf8');
    expect(prompt).toContain('app/api/route.ts');
    expect(prompt).toContain('npx -y viberaven --verify');
  });

  it('applies the empty catch recipe and writes result artifacts', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'viberaven-heal-'));
    await mkdir(join(tempDir, 'app/api'), { recursive: true });
    const target = join(tempDir, 'app/api/route.ts');
    await writeFile(target, [
      'export async function GET() {',
      '  try {',
      '    doWork();',
      '  } catch (error) {',
      '  }',
      '  return Response.json({ ok: true });',
      '}',
      ''
    ].join('\n'), 'utf8');

    const result = await runHealCommand({ cwd: tempDir, mode: 'apply', target: 'app/api/route.ts', yes: true, noVerify: true });

    expect(result.status).toBe('applied_verify_not_run');
    expect(result.changedFiles).toEqual(['app/api/route.ts']);
    const updated = await readFile(target, 'utf8');
    expect(updated).toContain('console.error');
    expect(existsSync(join(tempDir, '.viberaven', 'heal', result.healId, 'patch.diff'))).toBe(true);
    expect(existsSync(join(tempDir, '.viberaven', 'heal', result.healId, 'result.json'))).toBe(true);
  });

  it('increments loop-state batchApplied after a successful gap heal', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'viberaven-heal-'));

    const result = await runHealCommand({
      cwd: tempDir,
      mode: 'apply',
      gapId: 'auth_secret_missing',
      yes: true,
      noVerify: true,
    });

    expect(result.status).toBe('applied_verify_not_run');
    const loopState = await loadLoopState(tempDir);
    expect(loopState.batchApplied).toBe(1);
    expect(loopState.appliedGapIdsSinceScan).toEqual(['auth_secret_missing']);
  });

  it('refuses apply without --yes in non-interactive mode', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'viberaven-heal-'));
    await mkdir(join(tempDir, 'app/api'), { recursive: true });
    await writeFile(join(tempDir, 'app/api/route.ts'), 'try {\n  doWork();\n} catch (error) {\n}\n', 'utf8');

    const result = await runHealCommand({ cwd: tempDir, mode: 'apply', target: 'app/api/route.ts' });

    expect(result.status).toBe('refused_dangerous');
    expect(result.rollback.instructions).toContain('--yes');
  });
});

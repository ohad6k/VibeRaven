/**
 * Tests for W3 heal recipes.
 *
 * Each recipe is tested in isolation (pure function) and via the dispatcher
 * (dispatchRecipeByGapId) which is the integration path used by apply.ts.
 */

import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';

// Individual recipe functions
import { applyAuthSecretRecipe } from '../src/heal/recipes/envAuthSecret';
import { applyNodeEnvRecipe } from '../src/heal/recipes/envNodeEnv';
import { applyDatabaseUrlRecipe } from '../src/heal/recipes/envDatabaseUrl';
import { applyErrorBoundaryRecipe } from '../src/heal/recipes/nextjsErrorBoundary';
import { applyHealthRouteRecipe } from '../src/heal/recipes/nextjsHealthRoute';
import { applyLoadingStateRecipe } from '../src/heal/recipes/nextjsLoadingState';
import { applyNotFoundRecipe } from '../src/heal/recipes/nextjsNotFound';
import { applyRlsRecipe } from '../src/heal/recipes/supabaseRls';
import { applyCspHeaderRecipe } from '../src/heal/recipes/nextjsCspHeader';
import { applyRateLimitRecipe } from '../src/heal/recipes/nextjsRateLimit';
import {
  applyEslintRestrictedImportsRecipe,
  detectEslintConfigFile,
  RESTRICTED_IMPORTS_MESSAGE,
  VIBERAVEN_ESLINT_MARKER,
} from '../src/heal/recipes/eslintRestrictedImports';

// Dispatcher (integration layer)
import { dispatchRecipeByGapId, gapHasRecipe } from '../src/heal/recipes/index';

// Full apply (end-to-end)
import { applyHeal } from '../src/heal/apply';

// ---------------------------------------------------------------------------
// Temp dir lifecycle
// ---------------------------------------------------------------------------

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
  tempDir = undefined;
});

// ---------------------------------------------------------------------------
// 1. auth_secret_missing
// ---------------------------------------------------------------------------

describe('auth_secret_missing recipe', () => {
  it('adds NEXTAUTH_SECRET when absent', () => {
    const result = applyAuthSecretRecipe('NEXT_PUBLIC_URL=https://example.com\n');
    expect(result.changed).toBe(true);
    expect(result.output).toContain('NEXTAUTH_SECRET=');
    expect(result.output).toContain('openssl rand -base64 32');
  });

  it('does not add NEXTAUTH_SECRET when already present', () => {
    const source = 'NEXTAUTH_SECRET=abc123\n';
    const result = applyAuthSecretRecipe(source);
    expect(result.changed).toBe(false);
    expect(result.output).toBe(source);
  });

  it('works on empty .env.local', () => {
    const result = applyAuthSecretRecipe('');
    expect(result.changed).toBe(true);
    expect(result.output.trim()).toContain('NEXTAUTH_SECRET=');
  });
});

// ---------------------------------------------------------------------------
// 2. node_env_not_set
// ---------------------------------------------------------------------------

describe('node_env_not_set recipe', () => {
  it('adds NODE_ENV=production when absent', () => {
    const result = applyNodeEnvRecipe('NEXT_PUBLIC_URL=https://example.com\n');
    expect(result.changed).toBe(true);
    expect(result.output).toContain('NODE_ENV=production');
  });

  it('does not overwrite existing NODE_ENV', () => {
    const source = 'NODE_ENV=development\n';
    const result = applyNodeEnvRecipe(source);
    expect(result.changed).toBe(false);
    expect(result.output).toBe(source);
  });

  it('works on empty env file', () => {
    const result = applyNodeEnvRecipe('');
    expect(result.changed).toBe(true);
    expect(result.output).toBe('NODE_ENV=production\n');
  });
});

// ---------------------------------------------------------------------------
// 3. database_url_missing
// ---------------------------------------------------------------------------

describe('database_url_missing recipe', () => {
  it('adds DATABASE_URL with comment when absent', () => {
    const result = applyDatabaseUrlRecipe('');
    expect(result.changed).toBe(true);
    expect(result.output).toContain('DATABASE_URL=<your-supabase-postgres-url>');
    expect(result.output).toContain('supabase.com');
  });

  it('does not overwrite existing DATABASE_URL', () => {
    const source = 'DATABASE_URL=postgresql://user:pass@host/db\n';
    const result = applyDatabaseUrlRecipe(source);
    expect(result.changed).toBe(false);
    expect(result.output).toBe(source);
  });
});

// ---------------------------------------------------------------------------
// 4. missing_error_boundary
// ---------------------------------------------------------------------------

describe('missing_error_boundary recipe', () => {
  it('creates error boundary content when file is empty', () => {
    const result = applyErrorBoundaryRecipe('');
    expect(result.changed).toBe(true);
    expect(result.output).toContain("'use client'");
    expect(result.output).toContain('reset');
    expect(result.output).toContain('ErrorBoundary');
    expect(result.targetFile).toBe('app/error.tsx');
  });

  it('does not overwrite existing file', () => {
    const source = 'export default function ErrorBoundary() {}';
    const result = applyErrorBoundaryRecipe(source);
    expect(result.changed).toBe(false);
    expect(result.output).toBe(source);
  });
});

// ---------------------------------------------------------------------------
// 5. missing_health_route
// ---------------------------------------------------------------------------

describe('missing_health_route recipe', () => {
  it('creates health route with { status: ok, ts: Date.now() }', () => {
    const result = applyHealthRouteRecipe('');
    expect(result.changed).toBe(true);
    expect(result.output).toContain("status: 'ok'");
    expect(result.output).toContain('Date.now()');
    expect(result.output).toContain('GET');
    expect(result.targetFile).toBe('app/api/health/route.ts');
  });

  it('does not overwrite existing health route', () => {
    const source = 'export function GET() { return Response.json({ ok: true }); }';
    const result = applyHealthRouteRecipe(source);
    expect(result.changed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. missing_loading_state
// ---------------------------------------------------------------------------

describe('missing_loading_state recipe', () => {
  it('creates loading skeleton when file is empty', () => {
    const result = applyLoadingStateRecipe('');
    expect(result.changed).toBe(true);
    expect(result.output).toContain('Loading');
    expect(result.output).toContain('animate-pulse');
    expect(result.targetFile).toBe('app/loading.tsx');
  });

  it('does not overwrite existing loading file', () => {
    const source = 'export default function Loading() { return <div>Loading...</div>; }';
    const result = applyLoadingStateRecipe(source);
    expect(result.changed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 7. missing_404_page
// ---------------------------------------------------------------------------

describe('missing_404_page recipe', () => {
  it('creates 404 page when file is empty', () => {
    const result = applyNotFoundRecipe('');
    expect(result.changed).toBe(true);
    expect(result.output).toContain('404');
    expect(result.output).toContain('NotFound');
    expect(result.targetFile).toBe('app/not-found.tsx');
  });

  it('does not overwrite existing not-found file', () => {
    const source = 'export default function NotFound() { return <div>404</div>; }';
    const result = applyNotFoundRecipe(source);
    expect(result.changed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 8. rls_disabled — provider-action, canAutoApply=false
// ---------------------------------------------------------------------------

describe('rls_disabled recipe', () => {
  it('returns canAutoApply=false', () => {
    const result = applyRlsRecipe('');
    expect(result.canAutoApply).toBe(false);
    expect(result.changed).toBe(false);
    expect(result.reason).toBe('dashboard-only');
    expect(result.providerAction.provider).toBe('supabase');
    expect(result.providerAction.dashboardUrl).toContain('supabase.com');
  });
});

// ---------------------------------------------------------------------------
// 9. missing_csp_header
// ---------------------------------------------------------------------------

describe('missing_csp_header recipe', () => {
  it('injects headers() into plain next.config.js object', () => {
    const source = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
`;
    const result = applyCspHeaderRecipe(source);
    expect(result.changed).toBe(true);
    expect(result.canAutoApply).toBe(true);
    expect(result.output).toContain('Content-Security-Policy');
    expect(result.output).toContain("default-src 'self'");
  });

  it('returns canAutoApply=false when config exports a function', () => {
    const source = `module.exports = async function(phase, { defaultConfig }) {
  return { reactStrictMode: true };
};
`;
    const result = applyCspHeaderRecipe(source);
    expect(result.changed).toBe(false);
    expect(result.canAutoApply).toBe(false);
    expect(result.reason).toBe('config-exports-function');
  });

  it('returns changed=false when CSP already present', () => {
    const source = `const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: [{ key: 'Content-Security-Policy', value: "default-src 'self'" }] }];
  },
};
module.exports = nextConfig;
`;
    const result = applyCspHeaderRecipe(source);
    expect(result.changed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 10. missing_rate_limit
// ---------------------------------------------------------------------------

describe('missing_rate_limit recipe', () => {
  it('generates in-memory rate limiter when no upstash', () => {
    const result = applyRateLimitRecipe('', false);
    expect(result.changed).toBe(true);
    expect(result.usedUpstash).toBe(false);
    expect(result.output).toContain('ipMap');
    expect(result.output).toContain('429');
    expect(result.output).toContain('middleware');
  });

  it('generates upstash rate limiter when upstash is available', () => {
    const result = applyRateLimitRecipe('', true);
    expect(result.changed).toBe(true);
    expect(result.usedUpstash).toBe(true);
    expect(result.output).toContain('@upstash/ratelimit');
    expect(result.output).toContain('Ratelimit');
    expect(result.dependencyHint).toBeDefined();
    expect(result.dependencyHint).toContain('@upstash/ratelimit');
  });

  it('does not overwrite existing rate-limiting logic', () => {
    const source = '// existing rate limit logic using ipMap\nconst ipMap = new Map();\n';
    const result = applyRateLimitRecipe(source, false);
    expect(result.changed).toBe(false);
    expect(result.output).toBe(source);
  });
});

// ---------------------------------------------------------------------------
// 11. eslint_restricted_imports
// ---------------------------------------------------------------------------

describe('eslint_restricted_imports recipe', () => {
  it('injects no-restricted-imports into .eslintrc.json', () => {
    const source = JSON.stringify({ extends: ['next/core-web-vitals'] }, null, 2);
    const result = applyEslintRestrictedImportsRecipe(source, '.eslintrc.json');

    expect(result.changed).toBe(true);
    expect(result.canAutoApply).toBe(true);
    expect(result.output).toContain('no-restricted-imports');
    expect(result.output).toContain('@supabase/auth-helpers-nextjs');
    expect(result.output).toContain(RESTRICTED_IMPORTS_MESSAGE);
  });

  it('is idempotent for .eslintrc.json', () => {
    const source = JSON.stringify({ extends: ['next/core-web-vitals'] }, null, 2);
    const first = applyEslintRestrictedImportsRecipe(source, '.eslintrc.json');
    const second = applyEslintRestrictedImportsRecipe(first.output, '.eslintrc.json');

    expect(second.changed).toBe(false);
    expect(second.output).toBe(first.output);
  });

  it('injects into flat eslint.config.js arrays', () => {
    const source = `export default [\n  { rules: { semi: ['error', 'always'] } },\n];\n`;
    const result = applyEslintRestrictedImportsRecipe(source, 'eslint.config.js');

    expect(result.changed).toBe(true);
    expect(result.output).toContain(VIBERAVEN_ESLINT_MARKER);
    expect(result.output).toContain('no-restricted-imports');
    expect(result.output).toContain('@supabase/auth-helpers-nextjs');
  });

  it('detects eslint config files in priority order', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-eslint-detect-'));
    await writeFile(join(tempDir!, '.eslintrc.json'), '{}\n', 'utf8');

    expect(detectEslintConfigFile(tempDir!)).toBe('.eslintrc.json');

    await writeFile(join(tempDir!, 'eslint.config.js'), 'export default [];\n', 'utf8');
    expect(detectEslintConfigFile(tempDir!)).toBe('eslint.config.js');
  });
});

// ---------------------------------------------------------------------------
// Dispatcher: gapHasRecipe
// ---------------------------------------------------------------------------

describe('gapHasRecipe', () => {
  it('returns true for all known gapIds', () => {
    const knownGapIds = [
      'auth_secret_missing',
      'node_env_not_set',
      'database_url_missing',
      'missing_error_boundary',
      'missing_health_route',
      'missing_loading_state',
      'missing_404_page',
      'rls_disabled',
      'missing_csp_header',
      'missing_rate_limit',
      'eslint_restricted_imports',
    ];
    for (const gapId of knownGapIds) {
      expect(gapHasRecipe(gapId), `expected recipe for gapId=${gapId}`).toBe(true);
    }
  });

  it('returns false for unknown gapIds', () => {
    expect(gapHasRecipe('unknown_gap_xyz')).toBe(false);
    expect(gapHasRecipe('empty-catch')).toBe(false); // emptyCatch is not in dispatcher
  });
});

// ---------------------------------------------------------------------------
// Dispatcher: dispatchRecipeByGapId (integration)
// ---------------------------------------------------------------------------

describe('dispatchRecipeByGapId', () => {
  it('returns null for unknown gapId', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-recipe-'));
    const result = await dispatchRecipeByGapId('unknown_gap_xyz', tempDir!);
    expect(result).toBeNull();
  });

  it('adds NEXTAUTH_SECRET to .env.local', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-recipe-'));
    await writeFile(join(tempDir!, '.env.local'), 'NEXT_PUBLIC_URL=x\n', 'utf8');

    const result = await dispatchRecipeByGapId('auth_secret_missing', tempDir!);
    expect(result).not.toBeNull();
    expect(result!.changed).toBe(true);
    expect(result!.targetFile).toBe('.env.local');
    expect(result!.output).toContain('NEXTAUTH_SECRET=');
  });

  it('creates app/api/health/route.ts', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-recipe-'));

    const result = await dispatchRecipeByGapId('missing_health_route', tempDir!);
    expect(result).not.toBeNull();
    expect(result!.changed).toBe(true);
    expect(result!.targetFile).toBe('app/api/health/route.ts');
    expect(result!.output).toContain("status: 'ok'");
  });

  it('returns canAutoApply=false for rls_disabled', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-recipe-'));

    const result = await dispatchRecipeByGapId('rls_disabled', tempDir!);
    expect(result).not.toBeNull();
    expect(result!.canAutoApply).toBe(false);
    expect(result!.changed).toBe(false);
    expect(result!.reason).toBe('dashboard-only');
  });

  it('uses next.config.mjs if next.config.js does not exist', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-recipe-'));
    const mjsContent = `const nextConfig = { reactStrictMode: true };\nexport default nextConfig;\n`;
    await writeFile(join(tempDir!, 'next.config.mjs'), mjsContent, 'utf8');

    const result = await dispatchRecipeByGapId('missing_csp_header', tempDir!);
    expect(result).not.toBeNull();
    expect(result!.targetFile).toBe('next.config.mjs');
    expect(result!.output).toContain('Content-Security-Policy');
  });

  it('patches eslint config via eslint_restricted_imports', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-recipe-eslint-'));
    await writeFile(
      join(tempDir!, '.eslintrc.json'),
      `${JSON.stringify({ extends: ['next/core-web-vitals'] }, null, 2)}\n`,
      'utf8'
    );

    const result = await dispatchRecipeByGapId('eslint_restricted_imports', tempDir!);
    expect(result).not.toBeNull();
    expect(result!.changed).toBe(true);
    expect(result!.targetFile).toBe('.eslintrc.json');
    expect(result!.output).toContain('no-restricted-imports');
    expect(result!.output).toContain(RESTRICTED_IMPORTS_MESSAGE);
  });

  it('returns canAutoApply=false when no eslint config exists', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-recipe-eslint-missing-'));

    const result = await dispatchRecipeByGapId('eslint_restricted_imports', tempDir!);
    expect(result).not.toBeNull();
    expect(result!.canAutoApply).toBe(false);
    expect(result!.reason).toBe('no-eslint-config');
  });
});

// ---------------------------------------------------------------------------
// End-to-end: applyHeal with gapId (uses full apply.ts + dispatcher + file writes)
// ---------------------------------------------------------------------------

describe('applyHeal with gapId (end-to-end)', () => {
  it('creates app/api/health/route.ts via missing_health_route', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-e2e-'));

    const result = await applyHeal({
      cwd: tempDir!,
      mode: 'apply',
      gapId: 'missing_health_route',
      yes: true,
      noVerify: true,
    });

    expect(result.status).toBe('applied_verify_not_run');
    expect(result.gapId).toBe('missing_health_route');
    expect(result.changedFiles).toContain('app/api/health/route.ts');
    expect(existsSync(join(tempDir!, 'app/api/health/route.ts'))).toBe(true);

    const content = await readFile(join(tempDir!, 'app/api/health/route.ts'), 'utf8');
    expect(content).toContain("status: 'ok'");
    expect(content).toContain('Date.now()');
  });

  it('adds NEXTAUTH_SECRET to .env.local via auth_secret_missing', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-e2e-'));
    await writeFile(join(tempDir!, '.env.local'), 'NEXT_PUBLIC_URL=x\n', 'utf8');

    const result = await applyHeal({
      cwd: tempDir!,
      mode: 'apply',
      gapId: 'auth_secret_missing',
      yes: true,
      noVerify: true,
    });

    expect(result.status).toBe('applied_verify_not_run');
    expect(result.changedFiles).toContain('.env.local');

    const content = await readFile(join(tempDir!, '.env.local'), 'utf8');
    expect(content).toContain('NEXTAUTH_SECRET=');
  });

  it('returns refused_unsupported for rls_disabled (provider-action)', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-e2e-'));

    const result = await applyHeal({
      cwd: tempDir!,
      mode: 'apply',
      gapId: 'rls_disabled',
      yes: true,
      noVerify: true,
    });

    expect(result.status).toBe('refused_unsupported');
    expect(result.changedFiles).toHaveLength(0);
  });

  it('creates app/error.tsx via missing_error_boundary', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-e2e-'));

    const result = await applyHeal({
      cwd: tempDir!,
      mode: 'apply',
      gapId: 'missing_error_boundary',
      yes: true,
      noVerify: true,
    });

    expect(result.status).toBe('applied_verify_not_run');
    expect(existsSync(join(tempDir!, 'app/error.tsx'))).toBe(true);
    const content = await readFile(join(tempDir!, 'app/error.tsx'), 'utf8');
    expect(content).toContain("'use client'");
    expect(content).toContain('reset');
  });

  it('creates app/loading.tsx via missing_loading_state', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-e2e-'));

    const result = await applyHeal({
      cwd: tempDir!,
      mode: 'apply',
      gapId: 'missing_loading_state',
      yes: true,
      noVerify: true,
    });

    expect(result.status).toBe('applied_verify_not_run');
    expect(existsSync(join(tempDir!, 'app/loading.tsx'))).toBe(true);
    const content = await readFile(join(tempDir!, 'app/loading.tsx'), 'utf8');
    expect(content).toContain('animate-pulse');
  });

  it('creates app/not-found.tsx via missing_404_page', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-e2e-'));

    const result = await applyHeal({
      cwd: tempDir!,
      mode: 'apply',
      gapId: 'missing_404_page',
      yes: true,
      noVerify: true,
    });

    expect(result.status).toBe('applied_verify_not_run');
    expect(existsSync(join(tempDir!, 'app/not-found.tsx'))).toBe(true);
    const content = await readFile(join(tempDir!, 'app/not-found.tsx'), 'utf8');
    expect(content).toContain('404');
  });

  it('returns refused_dangerous without --yes flag', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-e2e-'));

    const result = await applyHeal({
      cwd: tempDir!,
      mode: 'apply',
      gapId: 'auth_secret_missing',
      // yes is omitted / false
      noVerify: true,
    });

    expect(result.status).toBe('refused_dangerous');
    expect(result.changedFiles).toHaveLength(0);
  });

  it('patches eslint config via applyHeal end-to-end', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-e2e-eslint-'));
    await writeFile(
      join(tempDir!, '.eslintrc.json'),
      `${JSON.stringify({ extends: ['next/core-web-vitals'] }, null, 2)}\n`,
      'utf8'
    );

    const result = await applyHeal({
      cwd: tempDir!,
      mode: 'apply',
      gapId: 'eslint_restricted_imports',
      yes: true,
      noVerify: true,
    });

    expect(result.status).toBe('applied_verify_not_run');
    expect(result.changedFiles).toContain('.eslintrc.json');
    const content = await readFile(join(tempDir!, '.eslintrc.json'), 'utf8');
    expect(content).toContain('no-restricted-imports');
    expect(content).toContain(RESTRICTED_IMPORTS_MESSAGE);
  });

  it('legacy emptyCatch path still works with target + no gapId', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-e2e-'));
    await mkdir(join(tempDir!, 'app/api'), { recursive: true });
    const target = join(tempDir!, 'app/api/route.ts');
    await writeFile(target, 'try {\n  doWork();\n} catch (error) {\n}\n', 'utf8');

    const result = await applyHeal({
      cwd: tempDir!,
      mode: 'apply',
      target: 'app/api/route.ts',
      yes: true,
      noVerify: true,
    });

    expect(result.status).toBe('applied_verify_not_run');
    expect(result.recipe).toBe('empty-catch-safe-response');
    const content = await readFile(target, 'utf8');
    expect(content).toContain('console.error');
  });
});

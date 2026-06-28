/**
 * Recipe dispatcher for gap-based heal apply.
 *
 * This module routes `gapId` to the appropriate recipe function.
 * It is imported by apply.ts alongside the existing emptyCatch recipe.
 *
 * IMPORTANT: This does NOT modify apply.ts logic — it provides a standalone
 * dispatch function that apply.ts can call when gapId is present.
 */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { applyAuthSecretRecipe } from './envAuthSecret';
import { applyNodeEnvRecipe } from './envNodeEnv';
import { applyDatabaseUrlRecipe } from './envDatabaseUrl';
import { applyErrorBoundaryRecipe } from './nextjsErrorBoundary';
import { applyHealthRouteRecipe } from './nextjsHealthRoute';
import { applyLoadingStateRecipe } from './nextjsLoadingState';
import { applyNotFoundRecipe } from './nextjsNotFound';
import { applyRlsRecipe } from './supabaseRls';
import { applyCspHeaderRecipe } from './nextjsCspHeader';
import { applyRateLimitRecipe } from './nextjsRateLimit';
import {
  applyEslintRestrictedImportsRecipe,
  detectEslintConfigFile,
} from './eslintRestrictedImports';

export interface DispatchResult {
  /** Whether the recipe made a change */
  changed: boolean;
  /** The output content to write */
  output: string;
  /** The relative file path to write (relative to workspace root) */
  targetFile: string;
  /** Whether the recipe can be auto-applied (false = provider-action only) */
  canAutoApply: boolean;
  /** Human-readable reason if canAutoApply=false */
  reason?: string;
  /** Hint to install a dependency */
  dependencyHint?: string;
  /** Recipe name for the HealResult.recipe field */
  recipeName: string;
}

// ---------------------------------------------------------------------------
// Helper: determine default target file for a gapId
// ---------------------------------------------------------------------------

function defaultTargetFile(gapId: string): string | undefined {
  const map: Record<string, string> = {
    auth_secret_missing: '.env.local',
    node_env_not_set: '.env.local',
    database_url_missing: '.env.local',
    missing_error_boundary: 'app/error.tsx',
    missing_health_route: 'app/api/health/route.ts',
    missing_loading_state: 'app/loading.tsx',
    missing_404_page: 'app/not-found.tsx',
    rls_disabled: '',               // no file — provider-action
    missing_csp_header: 'next.config.js',
    missing_rate_limit: 'middleware.ts',
    eslint_restricted_imports: '',
  };
  return map[gapId];
}

// ---------------------------------------------------------------------------
// Helper: read existing file content or return '' if not found
// ---------------------------------------------------------------------------

async function readSourceOrEmpty(absolutePath: string): Promise<string> {
  if (!existsSync(absolutePath)) return '';
  return readFile(absolutePath, 'utf8');
}

// ---------------------------------------------------------------------------
// Helper: detect @upstash/ratelimit in the workspace package.json
// ---------------------------------------------------------------------------

async function detectUpstash(cwd: string): Promise<boolean> {
  try {
    const pkgPath = join(cwd, 'package.json');
    if (!existsSync(pkgPath)) return false;
    const raw = await readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(raw) as Record<string, unknown>;
    const deps = {
      ...(pkg['dependencies'] as Record<string, string> | undefined ?? {}),
      ...(pkg['devDependencies'] as Record<string, string> | undefined ?? {}),
    };
    return '@upstash/ratelimit' in deps;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main dispatch function
// ---------------------------------------------------------------------------

/**
 * Dispatches a heal recipe by gapId.
 * Returns null if no recipe exists for this gapId (caller should fall back to emptyCatch).
 */
export async function dispatchRecipeByGapId(
  gapId: string,
  cwd: string,
  explicitTarget?: string
): Promise<DispatchResult | null> {
  const targetFile = explicitTarget ?? defaultTargetFile(gapId);
  if (targetFile === undefined) return null; // unknown gapId

  // ---- env-add recipes ----
  if (
    gapId === 'auth_secret_missing' ||
    gapId === 'node_env_not_set' ||
    gapId === 'database_url_missing'
  ) {
    const absolutePath = join(cwd, targetFile);
    const source = await readSourceOrEmpty(absolutePath);
    let result: { changed: boolean; output: string };
    if (gapId === 'auth_secret_missing') result = applyAuthSecretRecipe(source);
    else if (gapId === 'node_env_not_set') result = applyNodeEnvRecipe(source);
    else result = applyDatabaseUrlRecipe(source);

    return {
      ...result,
      targetFile,
      canAutoApply: true,
      recipeName: gapId,
    };
  }

  // ---- file-create recipes ----
  if (gapId === 'missing_error_boundary') {
    const absolutePath = join(cwd, 'app/error.tsx');
    const source = await readSourceOrEmpty(absolutePath);
    const result = applyErrorBoundaryRecipe(source);
    return { ...result, canAutoApply: true, recipeName: gapId };
  }

  if (gapId === 'missing_health_route') {
    const absolutePath = join(cwd, 'app/api/health/route.ts');
    const source = await readSourceOrEmpty(absolutePath);
    const result = applyHealthRouteRecipe(source);
    return { ...result, canAutoApply: true, recipeName: gapId };
  }

  if (gapId === 'missing_loading_state') {
    const absolutePath = join(cwd, 'app/loading.tsx');
    const source = await readSourceOrEmpty(absolutePath);
    const result = applyLoadingStateRecipe(source);
    return { ...result, canAutoApply: true, recipeName: gapId };
  }

  if (gapId === 'missing_404_page') {
    const absolutePath = join(cwd, 'app/not-found.tsx');
    const source = await readSourceOrEmpty(absolutePath);
    const result = applyNotFoundRecipe(source);
    return { ...result, canAutoApply: true, recipeName: gapId };
  }

  // ---- provider-action only (no auto-apply) ----
  if (gapId === 'rls_disabled') {
    const result = applyRlsRecipe('');
    return {
      changed: false,
      output: '',
      targetFile: '',
      canAutoApply: false,
      reason: result.reason,
      recipeName: gapId,
    };
  }

  // ---- file-patch recipes ----
  if (gapId === 'missing_csp_header') {
    // Try next.config.js first, then next.config.mjs
    let configFile = 'next.config.js';
    let absolutePath = join(cwd, configFile);
    if (!existsSync(absolutePath)) {
      configFile = 'next.config.mjs';
      absolutePath = join(cwd, configFile);
    }
    const source = await readSourceOrEmpty(absolutePath);
    const result = applyCspHeaderRecipe(source);
    return {
      ...result,
      targetFile: configFile,
      recipeName: gapId,
    };
  }

  if (gapId === 'missing_rate_limit') {
    const hasUpstash = await detectUpstash(cwd);
    const middlewarePath = join(cwd, 'middleware.ts');
    const source = await readSourceOrEmpty(middlewarePath);
    const result = applyRateLimitRecipe(source, hasUpstash);
    return {
      ...result,
      targetFile: 'middleware.ts',
      canAutoApply: true,
      recipeName: gapId,
    };
  }

  if (gapId === 'eslint_restricted_imports') {
    const configFile = detectEslintConfigFile(cwd);
    if (!configFile) {
      return {
        changed: false,
        output: '',
        targetFile: '',
        canAutoApply: false,
        reason: 'no-eslint-config',
        recipeName: gapId,
      };
    }

    const absolutePath = join(cwd, configFile);
    const source = await readSourceOrEmpty(absolutePath);
    const result = applyEslintRestrictedImportsRecipe(source, configFile);
    return {
      changed: result.changed,
      output: result.output,
      targetFile: configFile,
      canAutoApply: result.canAutoApply,
      reason: result.reason,
      recipeName: gapId,
    };
  }

  return null; // no recipe for this gapId
}

/**
 * Returns true if a gap-based recipe exists for the given gapId.
 */
export function gapHasRecipe(gapId: string): boolean {
  return defaultTargetFile(gapId) !== undefined;
}

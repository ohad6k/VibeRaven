// Heal recipe: missing_health_route
// Creates app/api/health/route.ts for Next.js App Router if it does not exist.
// Only creates the file — never overwrites.

export const RECIPE_GAP_ID = 'missing_health_route';

const HEALTH_ROUTE_CONTENT = `import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Simple health-check endpoint — returns { status: 'ok', ts: <timestamp> }.
 * Created by VibeRaven heal recipe (missing_health_route).
 */
export function GET(): NextResponse {
  return NextResponse.json({ status: 'ok', ts: Date.now() });
}
`;

export interface FileCreateResult {
  changed: boolean;
  output: string;
  targetFile: string;
  canAutoApply: true;
}

/**
 * Returns the content to write.
 * `source` is the existing file content (empty string if file does not exist).
 */
export function applyHealthRouteRecipe(source: string): FileCreateResult {
  if (source.trim().length > 0) {
    // File already exists — do not overwrite
    return {
      changed: false,
      output: source,
      targetFile: 'app/api/health/route.ts',
      canAutoApply: true,
    };
  }

  return {
    changed: true,
    output: HEALTH_ROUTE_CONTENT,
    targetFile: 'app/api/health/route.ts',
    canAutoApply: true,
  };
}

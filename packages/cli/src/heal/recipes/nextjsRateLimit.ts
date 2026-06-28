// Heal recipe: missing_rate_limit
// Adds per-IP rate limiting to middleware.ts.
//
// Strategy:
// - If @upstash/ratelimit is in package.json: generate Upstash-based rate limiter
// - Otherwise: generate simple in-memory Map-based rate limiter
// - Creates middleware.ts if it does not exist
// - If middleware.ts exists and already has rate-limit logic, returns changed=false

export const RECIPE_GAP_ID = 'missing_rate_limit';

export const DEPENDENCY_HINT =
  'If you see @upstash/ratelimit references in this file, run: npm install @upstash/ratelimit @upstash/redis';

// ---------------------------------------------------------------------------
// Upstash-based middleware content (used when @upstash/ratelimit is available)
// ---------------------------------------------------------------------------
const UPSTASH_MIDDLEWARE = `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// VibeRaven heal: missing_rate_limit (Upstash)
// Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute per IP
  analytics: false,
});

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
`;

// ---------------------------------------------------------------------------
// In-memory fallback middleware (no external dependencies)
// ---------------------------------------------------------------------------
const INMEMORY_MIDDLEWARE = `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// VibeRaven heal: missing_rate_limit (in-memory fallback — resets on cold start)
// For production, replace with @upstash/ratelimit + Redis.
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60;   // per IP per window

const ipMap = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    ipMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

export function middleware(request: NextRequest): NextResponse {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

  if (isRateLimited(ip)) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
`;

export interface RateLimitRecipeResult {
  changed: boolean;
  output: string;
  canAutoApply: true;
  usedUpstash: boolean;
  dependencyHint?: string;
}

/**
 * Generates middleware.ts with rate-limiting logic.
 *
 * @param source - Existing middleware.ts content (empty string if file does not exist)
 * @param hasUpstash - Whether @upstash/ratelimit is in package.json
 */
export function applyRateLimitRecipe(
  source: string,
  hasUpstash: boolean
): RateLimitRecipeResult {
  // If the file already has rate-limit logic, do not overwrite
  if (/ratelimit|rate.limit|ipMap/i.test(source) || /429/.test(source)) {
    return {
      changed: false,
      output: source,
      canAutoApply: true,
      usedUpstash: false,
    };
  }

  if (hasUpstash) {
    return {
      changed: true,
      output: UPSTASH_MIDDLEWARE,
      canAutoApply: true,
      usedUpstash: true,
      dependencyHint: DEPENDENCY_HINT,
    };
  }

  return {
    changed: true,
    output: INMEMORY_MIDDLEWARE,
    canAutoApply: true,
    usedUpstash: false,
  };
}

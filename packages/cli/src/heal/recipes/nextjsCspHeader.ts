// Heal recipe: missing_csp_header
// Adds Content-Security-Policy header to next.config.js or next.config.mjs.
//
// PREFLIGHT: If the config exports a *function* (not a plain object/module),
// this recipe returns canAutoApply=false — fragile configs must not be patched.

export const RECIPE_GAP_ID = 'missing_csp_header';

const CSP_HEADER_VALUE = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
].join('; ');

/**
 * The headers() snippet to inject into next.config headers array.
 * We inject this only when there is NO existing headers() function.
 */
const HEADERS_BLOCK = `
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: \`${CSP_HEADER_VALUE}\`,
          },
        ],
      },
    ];
  },`;

export interface CspRecipeResult {
  changed: boolean;
  output: string;
  canAutoApply: boolean;
  reason?: string;
}

/**
 * Patches the next.config source to add a Content-Security-Policy header.
 *
 * Safety rules:
 * - If the source already has a CSP header, return changed=false.
 * - If the source exports a function (module.exports = async function / export default function),
 *   return canAutoApply=false — the config is dynamic and must not be patched.
 * - Otherwise, inject the headers() function before the closing brace/parenthesis of the
 *   nextConfig object literal.
 */
export function applyCspHeaderRecipe(source: string): CspRecipeResult {
  // If CSP already present, nothing to do
  if (/Content-Security-Policy/i.test(source)) {
    return { changed: false, output: source, canAutoApply: true };
  }

  // Fragile config detection: exports a function
  const exportsFn =
    /module\.exports\s*=\s*(async\s+)?function/.test(source) ||
    /export\s+default\s+(async\s+)?function/.test(source) ||
    /module\.exports\s*=\s*\(/.test(source);

  if (exportsFn) {
    return {
      changed: false,
      output: source,
      canAutoApply: false,
      reason: 'config-exports-function',
    };
  }

  // If there is already a headers() key, do not attempt a second injection
  if (/\bheaders\s*\(/.test(source)) {
    return {
      changed: false,
      output: source,
      canAutoApply: false,
      reason: 'headers-already-defined',
    };
  }

  // Prefer injecting into `const nextConfig = { ... }` / `module.exports = { ... }` object literals.
  const inlineConfigMatch = /(?:const|let|var)\s+nextConfig\s*=\s*\{[\s\S]*?\}(?=\s*;)/.exec(source);
  if (inlineConfigMatch) {
    const closingBrace = inlineConfigMatch.index + inlineConfigMatch[0].lastIndexOf('}');
    const output =
      source.slice(0, closingBrace) + ',' + HEADERS_BLOCK + source.slice(closingBrace);
    return { changed: true, output, canAutoApply: true };
  }

  const moduleExportsMatch = /module\.exports\s*=\s*\{[\s\S]*?\}(?=\s*;?)/.exec(source);
  if (moduleExportsMatch) {
    const closingBrace = moduleExportsMatch.index + moduleExportsMatch[0].lastIndexOf('}');
    const output =
      source.slice(0, closingBrace) + ',' + HEADERS_BLOCK + source.slice(closingBrace);
    return { changed: true, output, canAutoApply: true };
  }

  // Fallback: insert before the last newline-prefixed closing brace (multiline object configs).
  const lastBrace = source.lastIndexOf('\n}');
  if (lastBrace === -1) {
    return {
      changed: false,
      output: source,
      canAutoApply: false,
      reason: 'cannot-locate-config-closing-brace',
    };
  }

  const output =
    source.slice(0, lastBrace) + ',' + HEADERS_BLOCK + source.slice(lastBrace);

  return { changed: true, output, canAutoApply: true };
}

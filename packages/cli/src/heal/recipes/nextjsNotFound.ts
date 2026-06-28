// Heal recipe: missing_404_page
// Creates app/not-found.tsx for Next.js App Router if it does not exist.
// Only creates the file — never overwrites.

export const RECIPE_GAP_ID = 'missing_404_page';

const NOT_FOUND_CONTENT = `import Link from 'next/link';

/**
 * Next.js App Router 404 not-found page.
 * Created by VibeRaven heal recipe (missing_404_page).
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
      <p className="text-gray-500 mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Go home
      </Link>
    </main>
  );
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
export function applyNotFoundRecipe(source: string): FileCreateResult {
  if (source.trim().length > 0) {
    // File already exists — do not overwrite
    return {
      changed: false,
      output: source,
      targetFile: 'app/not-found.tsx',
      canAutoApply: true,
    };
  }

  return {
    changed: true,
    output: NOT_FOUND_CONTENT,
    targetFile: 'app/not-found.tsx',
    canAutoApply: true,
  };
}

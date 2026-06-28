// Heal recipe: missing_error_boundary
// Creates app/error.tsx for Next.js App Router if it does not exist.
// Only creates the file — never overwrites.

export const RECIPE_GAP_ID = 'missing_error_boundary';

const ERROR_BOUNDARY_CONTENT = `'use client';

import { useEffect } from 'react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log to an error reporting service
    console.error('[VibeRaven] Unhandled error:', error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
      {error.digest && (
        <p className="text-sm text-gray-500 mb-4">Error ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Try again
      </button>
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
 * Returns the content to write. The caller (applyHeal) is responsible for
 * checking if the file already exists and writing it.
 * `source` is the existing file content (empty string if file does not exist).
 */
export function applyErrorBoundaryRecipe(source: string): FileCreateResult {
  if (source.trim().length > 0) {
    // File already exists — do not overwrite
    return {
      changed: false,
      output: source,
      targetFile: 'app/error.tsx',
      canAutoApply: true,
    };
  }

  return {
    changed: true,
    output: ERROR_BOUNDARY_CONTENT,
    targetFile: 'app/error.tsx',
    canAutoApply: true,
  };
}

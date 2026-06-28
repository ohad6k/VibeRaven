// Heal recipe: missing_loading_state
// Creates app/loading.tsx for Next.js App Router if it does not exist.
// Only creates the file — never overwrites.

export const RECIPE_GAP_ID = 'missing_loading_state';

const LOADING_CONTENT = `/**
 * Next.js App Router loading skeleton.
 * Created by VibeRaven heal recipe (missing_loading_state).
 */
export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="animate-pulse space-y-4 w-full max-w-md">
        <div className="h-8 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
        <div className="h-10 bg-gray-200 rounded w-1/3" />
      </div>
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
export function applyLoadingStateRecipe(source: string): FileCreateResult {
  if (source.trim().length > 0) {
    // File already exists — do not overwrite
    return {
      changed: false,
      output: source,
      targetFile: 'app/loading.tsx',
      canAutoApply: true,
    };
  }

  return {
    changed: true,
    output: LOADING_CONTENT,
    targetFile: 'app/loading.tsx',
    canAutoApply: true,
  };
}

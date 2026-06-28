export function applyEmptyCatchRecipe(source: string): { changed: boolean; output: string } {
  const output = source.replace(
    /catch\s*\(([^)]+)\)\s*\{\s*\}/g,
    (_match, errorName: string) => `catch (${errorName}) {\n    console.error('VibeRaven heal: caught error', ${errorName});\n  }`
  );
  return { changed: output !== source, output };
}

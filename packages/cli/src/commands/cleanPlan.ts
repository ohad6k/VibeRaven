import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

export type CleanupFile = {
  path: string;
  sizeBytes: number;
  kind?: 'file' | 'directory';
};

export type CleanupItem = {
  path: string;
  category: 'generated-artifact' | 'large-log' | 'cache-directory';
  action: 'review-ignore-or-exclude-manually';
  reason: string;
};

export type CleanupPlan = {
  title: 'VibeRaven context cleanup plan';
  warning: string;
  items: CleanupItem[];
};

const MAX_WALK_DEPTH = 5;
const LARGE_LOG_BYTES = 8192;
const SKIP_DIRECTORIES = new Set(['.git', 'node_modules']);

export function buildContextCleanupPlan(input: {
  projectRoot: string;
  files: CleanupFile[];
}): CleanupPlan {
  const items: CleanupItem[] = [];
  const seen = new Set<string>();

  for (const file of input.files) {
    const path = normalizePath(relative(input.projectRoot, file.path) || file.path);
    const fullPath = normalizePath(file.path);
    const category = categorizeCleanupFile(path, fullPath, file);

    if (!category || seen.has(path)) {
      continue;
    }

    seen.add(path);
    items.push({
      path,
      category,
      action: 'review-ignore-or-exclude-manually',
      reason: reasonForCategory(category)
    });
  }

  return {
    title: 'VibeRaven context cleanup plan',
    warning: 'VibeRaven only writes this review plan. Review each item manually before changing ignore rules or excluding artifacts from agent context.',
    items
  };
}

export async function collectCleanupFiles(projectRoot: string): Promise<CleanupFile[]> {
  const files: CleanupFile[] = [];
  await walkCleanupFiles(projectRoot, projectRoot, files, 0);
  return files;
}

export async function writeCleanupPlan(projectRoot: string, plan: CleanupPlan): Promise<string> {
  const outputDir = join(projectRoot, '.viberaven');
  const outputPath = join(outputDir, 'context-cleanup.md');
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, renderCleanupPlan(plan), 'utf8');
  return outputPath;
}

function categorizeCleanupFile(
  relativePath: string,
  fullPath: string,
  file: CleanupFile
): CleanupItem['category'] | undefined {
  if (relativePath.startsWith('.viberaven/') || fullPath.includes('/.viberaven/')) {
    return 'generated-artifact';
  }

  if (isCachePath(relativePath)) {
    return 'cache-directory';
  }

  if (relativePath.endsWith('.log') && file.sizeBytes >= LARGE_LOG_BYTES) {
    return 'large-log';
  }

  return undefined;
}

function isCachePath(path: string): boolean {
  return (
    path === '.next/cache' ||
    path.startsWith('.next/cache/') ||
    path === '.turbo' ||
    path.startsWith('.turbo/') ||
    path === '.vite' ||
    path.startsWith('.vite/') ||
    path.includes('/node_modules/.cache/') ||
    path.endsWith('/node_modules/.cache')
  );
}

function reasonForCategory(category: CleanupItem['category']): string {
  switch (category) {
    case 'generated-artifact':
      return 'Generated VibeRaven artifact. Keep current scan outputs, but avoid loading old reports into agent context.';
    case 'large-log':
      return 'Large log file that can add token noise. Review it before changing ignore rules or excluding it from agent context.';
    case 'cache-directory':
      return 'Build cache evidence. Do not load it into agent context unless debugging build internals.';
  }
}

function renderCleanupPlan(plan: CleanupPlan): string {
  const lines = ['# VibeRaven context cleanup plan', '', plan.warning, ''];

  if (plan.items.length === 0) {
    lines.push('No noisy generated artifacts, large logs, or cache directories were found by the conservative scanner.');
  }

  for (const item of plan.items) {
    lines.push(`- ${item.path}`);
    lines.push(`  - Category: ${item.category}`);
    lines.push(`  - Action: ${item.action}`);
    lines.push(`  - Reason: ${item.reason}`);
  }

  return `${lines.join('\n')}\n`;
}

async function walkCleanupFiles(root: string, dir: string, result: CleanupFile[], depth: number): Promise<void> {
  if (depth > MAX_WALK_DEPTH) {
    return;
  }

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (SKIP_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const absolute = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (isCachePath(normalizePath(relative(root, absolute)))) {
        result.push({ path: absolute, sizeBytes: 0, kind: 'directory' });
        continue;
      }
      await walkCleanupFiles(root, absolute, result, depth + 1);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    try {
      const fileStat = await stat(absolute);
      result.push({ path: absolute, sizeBytes: fileStat.size, kind: 'file' });
    } catch {
      continue;
    }
  }
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

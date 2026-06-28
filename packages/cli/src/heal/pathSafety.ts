import { resolve, relative } from 'node:path';

const BLOCKED_SEGMENTS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.viberaven']);

export function assertSafeHealTarget(cwd: string, target: string): string {
  const root = resolve(cwd);
  const absolute = resolve(root, target);
  const rel = relative(root, absolute);

  if (rel.startsWith('..') || rel === '' || /^[A-Za-z]:/.test(rel)) {
    throw new Error('Heal target must stay inside the workspace');
  }

  const segments = rel.split(/[\\/]+/);
  if (segments.some((segment) => BLOCKED_SEGMENTS.has(segment))) {
    throw new Error('Heal target is inside a blocked directory');
  }

  return absolute;
}

import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function playbooksRoot(): string {
  const candidates = [join(__dirname, 'playbooks'), join(__dirname, '..', '..', 'playbooks')];
  for (const dir of candidates) {
    if (existsSync(join(dir, 'vercel.json'))) {
      return dir;
    }
  }
  throw new Error('VibeRaven playbooks directory not found (expected vercel.json)');
}

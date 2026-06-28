import { readFileSync } from 'node:fs';
import { readFile as readFileAsync } from 'node:fs/promises';
import { join } from 'node:path';
import { playbooksRoot } from './playbooksRoot';
import { PLAYBOOK_PROVIDERS, type Playbook, type PlaybookProvider } from './types';
import { parsePlaybook } from './validate';

export function normalizePlaybookProvider(input: string): PlaybookProvider | undefined {
  const key = input.trim().toLowerCase();
  if (key === 'auth' || key === 'supabase-auth') {
    return 'auth-supabase';
  }
  return PLAYBOOK_PROVIDERS.find((provider) => provider === key);
}

export function listPlaybookProviders(): PlaybookProvider[] {
  return [...PLAYBOOK_PROVIDERS];
}

export async function loadPlaybook(provider: string): Promise<Playbook> {
  const normalized = normalizePlaybookProvider(provider);
  if (!normalized) {
    throw new Error(
      `Unknown provider "${provider}". Available: ${PLAYBOOK_PROVIDERS.join(', ')}`
    );
  }
  const path = join(playbooksRoot(), `${normalized}.json`);
  const raw = JSON.parse(await readFileAsync(path, 'utf-8')) as unknown;
  const playbook = parsePlaybook(raw);
  if (playbook.provider !== normalized) {
    throw new Error(`Playbook file ${normalized}.json has mismatched provider field`);
  }
  return playbook;
}

export function loadPlaybookSync(provider: string): Playbook {
  const normalized = normalizePlaybookProvider(provider);
  if (!normalized) {
    throw new Error(
      `Unknown provider "${provider}". Available: ${PLAYBOOK_PROVIDERS.join(', ')}`
    );
  }
  const path = join(playbooksRoot(), `${normalized}.json`);
  const raw = JSON.parse(readFileSync(path, 'utf-8')) as unknown;
  const playbook = parsePlaybook(raw);
  if (playbook.provider !== normalized) {
    throw new Error(`Playbook file ${normalized}.json has mismatched provider field`);
  }
  return playbook;
}

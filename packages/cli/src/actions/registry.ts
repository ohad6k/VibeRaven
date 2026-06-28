import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getProjectArtifactsDir } from '../config';
import { actionFingerprint } from './canonical';
import type { VibeRavenAction, VibeRavenActionRegistry, VibeRavenRegistryRecord } from './types';

export function emptyActionRegistry(): VibeRavenActionRegistry {
  return { version: 1, nextId: 1, actions: {} };
}

export function actionRegistryPath(cwd: string): string {
  return join(getProjectArtifactsDir(cwd), 'action-registry.json');
}

export async function loadActionRegistry(cwd: string): Promise<VibeRavenActionRegistry> {
  try {
    const parsed = JSON.parse(await readFile(actionRegistryPath(cwd), 'utf8')) as VibeRavenActionRegistry;
    if (parsed.version === 1 && Number.isInteger(parsed.nextId) && parsed.actions) {
      return parsed;
    }
  } catch {
    // Missing or invalid registry starts fresh.
  }

  return emptyActionRegistry();
}

export async function saveActionRegistry(cwd: string, registry: VibeRavenActionRegistry): Promise<void> {
  const dir = getProjectArtifactsDir(cwd);
  await mkdir(dir, { recursive: true });
  await writeFile(actionRegistryPath(cwd), `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
}

function nextActionId(registry: VibeRavenActionRegistry): string {
  const id = `VR-A${registry.nextId}`;
  registry.nextId += 1;
  return id;
}

function currentFingerprint(action: VibeRavenAction): string {
  return actionFingerprint({
    kind: action.kind,
    title: action.title,
    provider: action.provider,
    readiness: action.readiness ?? [],
    target: action.target,
    copyPayloads: action.copyPayloads ?? [],
    fileTargets: action.fileTargets ?? [],
    verifyCommand: action.verifyCommand,
    resumeInstruction: action.resumeInstruction,
  });
}

function replaceActionHandle(value: string | undefined, id: string): string | undefined {
  return value?.replace(/pending|VR-A\d+/g, id);
}

function replaceActionTarget(action: VibeRavenAction, id: string): VibeRavenAction['target'] {
  const { target } = action;
  if (!target) {
    return undefined;
  }

  if (target.type === 'url') {
    return { ...target, href: replaceActionHandle(target.href, id) ?? target.href };
  }

  if (target.type === 'command' || target.type === 'verify') {
    return { ...target, command: replaceActionHandle(target.command, id) ?? target.command };
  }

  return target;
}

export async function assignActionIds(input: {
  cwd: string;
  actions: VibeRavenAction[];
  currentGapIds?: Set<string>;
  now?: string;
}): Promise<{ actions: VibeRavenAction[]; registry: VibeRavenActionRegistry }> {
  const now = input.now ?? new Date().toISOString();
  const registry = await loadActionRegistry(input.cwd);
  const seen = new Set<string>();

  const actions = input.actions.map((action) => {
    seen.add(action.actionKey);
    const fingerprint = currentFingerprint(action);
    let entry = registry.actions[action.actionKey];

    if (!entry) {
      entry = {
        id: nextActionId(registry),
        actionKey: action.actionKey,
        status: 'active',
        createdAt: now,
        lastSeenAt: now,
        revision: 1,
        fingerprint,
        title: action.title,
        gapId: action.gapId,
        kind: action.kind,
        provider: action.provider,
      };
    } else {
      entry.status = 'active';
      entry.lastSeenAt = now;
      entry.title = action.title;
      entry.gapId = action.gapId;
      entry.kind = action.kind;
      entry.provider = action.provider;
      if (entry.fingerprint !== fingerprint) {
        entry.revision += 1;
        entry.fingerprint = fingerprint;
      }
    }

    registry.actions[action.actionKey] = entry;
    return {
      ...action,
      id: entry.id,
      revision: entry.revision,
      verifyCommand: replaceActionHandle(action.verifyCommand, entry.id),
      resumeInstruction: replaceActionHandle(action.resumeInstruction, entry.id),
      target: replaceActionTarget(action, entry.id),
    };
  });

  for (const entry of Object.values(registry.actions)) {
    if (entry.status === 'active' && !seen.has(entry.actionKey)) {
      entry.status = entry.gapId && input.currentGapIds && !input.currentGapIds.has(entry.gapId) ? 'resolved' : 'stale';
    }
  }

  await saveActionRegistry(input.cwd, registry);
  return { actions, registry };
}

export async function resolveActionById(cwd: string, id: string): Promise<VibeRavenRegistryRecord | undefined> {
  const registry = await loadActionRegistry(cwd);
  return Object.values(registry.actions).find((entry) => entry.id === id);
}

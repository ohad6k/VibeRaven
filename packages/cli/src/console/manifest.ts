import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { VibeRavenAction, VibeRavenActionsManifest, VibeRavenActionTarget } from '../actions/types';
import { getProjectArtifactsDir } from '../config';
import { redactString as redactArtifactString } from '../sanitizeArtifact';
import type {
  ConsoleActionState,
  ConsoleActionViewModel,
  ConsoleCopyPayloadView,
  ConsolePrimaryControl,
} from './types';

const ACTIONS_ARTIFACT_PATH = '.viberaven/actions.json';
const REPO_PATH_PLACEHOLDER = '<repo-relative-path>';
const REDACTED_PLACEHOLDER = '<redacted>';

function isSensitiveKey(key: string): boolean {
  return /secret|token|key|password|database_url|postgres_url|service_role/i.test(key);
}

function isAbsoluteLocalPath(value: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(value) || /^\/(?:Users|home|tmp|workspace|workspaces|var)\//.test(value);
}

function redactConsoleSecrets(text: string): string {
  return redactArtifactString(text).replace(/\[REDACTED(?:_(?:SECRET|PRIVATE_KEY))?\]/g, REDACTED_PLACEHOLDER);
}

export function redactConsoleValue(text: string): string {
  return redactConsoleSecrets(text)
    .replace(
      /\b([A-Z0-9_]*(?:SECRET|TOKEN|KEY|PASSWORD|DATABASE_URL|POSTGRES_URL|SERVICE_ROLE)[A-Z0-9_]*)=([^,\s]+)/gi,
      `$1=${REDACTED_PLACEHOLDER}`,
    )
    .replace(/\bpostgres(?:ql)?:\/\/[^@\s]+@/gi, `postgresql://${REDACTED_PLACEHOLDER}@`)
    .replace(/(["'`])([A-Za-z]:[\\/][\s\S]*?)\1/g, `$1${REPO_PATH_PLACEHOLDER}$1`)
    .replace(/(["'`])(\/(?:Users|home|tmp|workspace|workspaces|var)\/[\s\S]*?)\1/g, `$1${REPO_PATH_PLACEHOLDER}$1`)
    .replace(/[A-Za-z]:[\\/][^"'`,;\n|]+[\\/][^"'`,;\n|]*/g, REPO_PATH_PLACEHOLDER)
    .replace(/(^|[\s"'=])\/(?:Users|home|tmp|workspace|workspaces|var)\/[^"'`,;\n|]+\/[^"'`,;\n|]*/g, `$1${REPO_PATH_PLACEHOLDER}`)
    .replace(/[A-Za-z]:[\\/][^\s`"]+/g, REPO_PATH_PLACEHOLDER)
    .replace(/(^|[\s"'=])\/(?:Users|home|tmp|workspace|workspaces|var)\/[^\s`"]+/g, `$1${REPO_PATH_PLACEHOLDER}`)
    .replace(/\beyJ[A-Za-z0-9._-]*\b/g, REDACTED_PLACEHOLDER);
}

function redactPayloadValue(value: string | string[] | Record<string, unknown>): string | string[] | Record<string, unknown> {
  if (typeof value === 'string') {
    return redactConsoleValue(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => redactConsoleValue(entry));
  }

  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, redactUnknown(entry, key)]));
}

function redactUnknown(value: unknown, key?: string): unknown {
  if (key && isSensitiveKey(key)) {
    return REDACTED_PLACEHOLDER;
  }
  if (typeof value === 'string') {
    return redactConsoleValue(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => redactUnknown(entry));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([entryKey, entry]) => [entryKey, redactUnknown(entry, entryKey)]));
  }
  return value;
}

function primaryControlFor(action: VibeRavenAction): ConsolePrimaryControl {
  if (!action.target) {
    return action.verifyCommand ? 'verify' : 'none';
  }

  if (action.target.type === 'provider') return 'provider';
  if (action.target.type === 'file') return 'file';
  if (action.target.type === 'command') return 'run';
  if (action.target.type === 'verify') return 'verify';
  if (action.target.type === 'url') return 'open';
  return 'none';
}

function targetValue(target: VibeRavenActionTarget | undefined): string | undefined {
  if (!target) return undefined;
  if (target.type === 'url') return target.href;
  if (target.type === 'file') return target.path;
  if (target.type === 'command' || target.type === 'verify') return target.command;
  return target.provider;
}

function targetView(target: VibeRavenActionTarget | undefined): ConsoleActionViewModel['target'] {
  if (!target) {
    return { type: 'none', label: '' };
  }

  const value = targetValue(target);
  const redactedValue =
    target.type === 'file' && value && isAbsoluteLocalPath(value) ? REPO_PATH_PLACEHOLDER : value ? redactConsoleValue(value) : undefined;
  return {
    type: target.type,
    label: redactConsoleValue(target.label),
    ...(redactedValue ? { value: redactedValue } : {}),
  };
}

function copyPayloadView(payload: NonNullable<VibeRavenAction['copyPayloads']>[number]): ConsoleCopyPayloadView {
  return {
    label: redactConsoleValue(payload.label),
    format: payload.format,
    value: redactPayloadValue(payload.value),
  };
}

export function toConsoleActionViewModel(action: VibeRavenAction): ConsoleActionViewModel {
  const verifyCommand = action.verifyCommand ?? `npx -y viberaven verify --action ${action.id}`;

  return {
    id: action.id,
    title: redactConsoleValue(action.title),
    kind: action.kind,
    status: action.status,
    provider: action.provider ? redactConsoleValue(action.provider) : undefined,
    readiness: (action.readiness ?? []).map(redactConsoleValue),
    primaryControl: primaryControlFor(action),
    target: targetView(action.target),
    copyPayloads: (action.copyPayloads ?? []).map(copyPayloadView),
    verify: {
      actionId: action.id,
      command: redactConsoleValue(verifyCommand),
      fallbackCommand: action.fallbackCommand ? redactConsoleValue(action.fallbackCommand) : undefined,
    },
    resumeInstruction: redactConsoleValue(action.resumeInstruction ?? ''),
    lifecycle: {
      replacedBy: action.replacedBy,
      supersedes: action.supersedes ?? [],
    },
  };
}

function isV1ActionsManifest(value: unknown): value is VibeRavenActionsManifest {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<VibeRavenActionsManifest>;
  return candidate.version === 1 && Array.isArray(candidate.actions);
}

export async function loadConsoleActionState(cwd: string): Promise<ConsoleActionState> {
  const actionsPath = join(getProjectArtifactsDir(cwd), 'actions.json');

  try {
    const manifest = JSON.parse(await readFile(actionsPath, 'utf8')) as unknown;
    if (!isV1ActionsManifest(manifest)) {
      return {
        ok: false,
        reason: 'invalid',
        message: 'Invalid VibeRaven actions manifest. Run npx -y viberaven --agent-mode.',
        artifactPath: ACTIONS_ARTIFACT_PATH,
      };
    }

    return {
      ok: true,
      generatedAt: String(manifest.generatedAt ?? ''),
      gateStatus: String(manifest.gateStatus ?? ''),
      artifactPath: ACTIONS_ARTIFACT_PATH,
      actions: manifest.actions.map(toConsoleActionViewModel),
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return {
        ok: false,
        reason: 'missing',
        message: 'No VibeRaven actions found. Run npx -y viberaven --agent-mode.',
        artifactPath: ACTIONS_ARTIFACT_PATH,
      };
    }

    return {
      ok: false,
      reason: 'invalid',
      message: 'Unable to read VibeRaven actions manifest. Run npx -y viberaven --agent-mode.',
      artifactPath: ACTIONS_ARTIFACT_PATH,
    };
  }
}

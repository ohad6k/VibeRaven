import type { Playbook, PlaybookStep } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertStep(step: unknown, index: number): PlaybookStep {
  if (!isRecord(step)) {
    throw new Error(`Playbook step ${index + 1} must be an object`);
  }
  if (typeof step.id !== 'string' || !step.id.trim()) {
    throw new Error(`Playbook step ${index + 1} missing id`);
  }
  if (typeof step.title !== 'string' || !step.title.trim()) {
    throw new Error(`Playbook step ${index + 1} missing title`);
  }
  if (typeof step.instruction !== 'string' || !step.instruction.trim()) {
    throw new Error(`Playbook step ${index + 1} missing instruction`);
  }
  const parsed: PlaybookStep = {
    id: step.id,
    title: step.title,
    instruction: step.instruction
  };
  if (step.openUrl !== undefined) {
    if (typeof step.openUrl !== 'string') {
      throw new Error(`Playbook step ${step.id} openUrl must be a string`);
    }
    parsed.openUrl = step.openUrl;
  }
  if (step.copyValues !== undefined) {
    if (!Array.isArray(step.copyValues) || step.copyValues.some((v) => typeof v !== 'string')) {
      throw new Error(`Playbook step ${step.id} copyValues must be string[]`);
    }
    parsed.copyValues = step.copyValues;
  }
  if (step.events !== undefined) {
    if (!Array.isArray(step.events) || step.events.some((v) => typeof v !== 'string')) {
      throw new Error(`Playbook step ${step.id} events must be string[]`);
    }
    parsed.events = step.events;
  }
  if (step.pasteTarget !== undefined) {
    if (!isRecord(step.pasteTarget)) {
      throw new Error(`Playbook step ${step.id} pasteTarget must be an object`);
    }
    const file = step.pasteTarget.file;
    const keys = step.pasteTarget.keys;
    if (typeof file !== 'string' || !Array.isArray(keys) || keys.some((k) => typeof k !== 'string')) {
      throw new Error(`Playbook step ${step.id} pasteTarget invalid`);
    }
    parsed.pasteTarget = { file, keys };
  }
  return parsed;
}

export function parsePlaybook(raw: unknown): Playbook {
  if (!isRecord(raw)) {
    throw new Error('Playbook must be an object');
  }
  if (typeof raw.id !== 'string' || typeof raw.provider !== 'string' || typeof raw.title !== 'string') {
    throw new Error('Playbook missing id, provider, or title');
  }
  if (!Array.isArray(raw.steps) || raw.steps.length === 0) {
    throw new Error(`Playbook ${raw.id} must have at least one step`);
  }
  return {
    id: raw.id,
    provider: raw.provider,
    title: raw.title,
    steps: raw.steps.map((step, index) => assertStep(step, index))
  };
}

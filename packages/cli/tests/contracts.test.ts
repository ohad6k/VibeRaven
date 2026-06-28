import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(__dirname, '..', '..', '..');

function readSchema(path: string) {
  return JSON.parse(readFileSync(resolve(repoRoot, path), 'utf8'));
}

describe('VibeRaven 1.0 public schemas', () => {
  it('ships every machine contract schema', () => {
    for (const path of [
      'schemas/gate-result.schema.json',
      'schemas/context-map.schema.json',
      'schemas/gap.schema.json',
      'schemas/heal-result.schema.json',
    ]) {
      expect(existsSync(resolve(repoRoot, path))).toBe(true);
    }
  });

  it('gate-result schema requires stable run and gate fields', () => {
    const schema = readSchema('schemas/gate-result.schema.json');
    expect(schema.$id).toBe('https://viberaven.dev/schemas/gate-result.schema.json');
    expect(schema.required).toEqual([
      '$schema',
      'schemaVersion',
      'runId',
      'mode',
      'generatedAt',
      'workspace',
      'gate',
      'capabilities',
      'topGapIds',
      'artifacts',
      'commands',
      'redaction',
    ]);
    expect(schema.properties.gate.properties.status.enum).toEqual([
      'clear',
      'not_clear',
      'warning',
      'unknown',
      'error',
    ]);
  });

  it('context-map schema references gate result and capability graph', () => {
    const schema = readSchema('schemas/context-map.schema.json');
    expect(schema.$id).toBe('https://viberaven.dev/schemas/context-map.schema.json');
    expect(schema.properties.agentContract.required).toContain('machineResult');
    expect(schema.properties).toHaveProperty('capabilityGraph');
  });

  it('gap schema supports one-gap agent commands', () => {
    const schema = readSchema('schemas/gap.schema.json');
    expect(schema.$id).toBe('https://viberaven.dev/schemas/gap.schema.json');
    expect(schema.properties.commands.required).toEqual(['prompt', 'healPlan', 'verify']);
  });

  it('heal result schema records diff, verify, and rollback metadata', () => {
    const schema = readSchema('schemas/heal-result.schema.json');
    expect(schema.$id).toBe('https://viberaven.dev/schemas/heal-result.schema.json');
    expect(schema.properties.status.enum).toContain('applied_verify_passed');
    expect(schema.properties.status.enum).toContain('refused_dangerous');
    expect(schema.required).toContain('rollback');
  });
});

import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { writeActionArtifacts } from '../../src/actions/artifacts';
import type { TaskItem } from '../../src/contracts/taskItem';
import type { CliScanArtifact } from '../../src/types';

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

const artifact = {
  version: 1,
  workspacePath: '',
  scannedAt: '2026-06-15T16:00:00.000Z',
  productionCorePercent: 54,
  score: 60,
  scoreLabel: 'Needs Hardening',
  summary: 'Needs hardening',
  archetype: 'saas',
  gaps: [],
  missionGraph: { areas: [] },
  stackWiring: {},
  providerRegistry: {},
  selectedProviders: {},
  plan: 'pro',
} as unknown as CliScanArtifact;

describe('writeActionArtifacts', () => {
  it('writes actions.json and action-registry.json with stable IDs without leaking workspacePath', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vr-action-artifacts-'));
    const task: TaskItem = {
      id: 'TASK-001',
      gapId: 'payments-stack-canonicalization',
      severity: 'warning',
      fixType: 'provider-action',
      title: 'Payments evidence is split across provider signals',
      verifyCommand: 'npx -y viberaven --verify',
      requiresUserAction: true,
      providerAction: {
        provider: 'stripe',
        dashboardUrl: 'https://dashboard.stripe.com/',
        exactStep: 'Open Stripe. For development, turn Test mode ON.',
        doneSignal: 'Stripe dashboard step completed',
        verifyCommand: 'npx -y viberaven --verify',
      },
    };

    const first = await writeActionArtifacts({
      cwd: tempDir,
      artifact: { ...artifact, workspacePath: tempDir },
      tasks: [task],
      paths: {
        reportPath: join(tempDir, '.viberaven', 'report.html'),
        playbookPath: join(tempDir, '.viberaven', 'launch-playbook.md'),
      },
    });

    expect(existsSync(first.actionsPath)).toBe(true);
    expect(existsSync(first.actionRegistryPath)).toBe(true);

    const manifestText = await readFile(first.actionsPath, 'utf8');
    const manifest = JSON.parse(manifestText);
    expect(manifest.workspaceRoot).toBe('.');
    expect(manifest.workspacePath).toBeUndefined();
    expect(manifestText).not.toContain(tempDir);
    expect(manifest.actions.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(manifest)).not.toContain('dashboard.stripe.com');
    expect(manifest.actions[0].id).toBe('VR-A1');

    const second = await writeActionArtifacts({
      cwd: tempDir,
      artifact: { ...artifact, workspacePath: tempDir },
      tasks: [task],
      paths: {
        reportPath: join(tempDir, '.viberaven', 'report.html'),
        playbookPath: join(tempDir, '.viberaven', 'launch-playbook.md'),
      },
    });
    const secondManifest = JSON.parse(await readFile(second.actionsPath, 'utf8'));
    expect(secondManifest.actions[0].id).toBe('VR-A1');
  });
});

import { describe, expect, it } from 'vitest';
import { deriveCurrentActions } from '../../src/actions/derive';
import type { TaskItem } from '../../src/contracts/taskItem';
import type { CliScanArtifact } from '../../src/types';

const artifact = {
  version: 1,
  workspacePath: 'D:\\VibeRice',
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

function task(input: Partial<TaskItem> & { gapId: string; title: string; fixType: TaskItem['fixType'] }): TaskItem {
  return {
    id: 'TASK-001',
    gapId: input.gapId,
    severity: input.severity ?? 'critical',
    fixType: input.fixType,
    title: input.title,
    verifyCommand: input.verifyCommand ?? 'npx -y viberaven --verify',
    requiresUserAction: input.requiresUserAction ?? input.fixType === 'provider-action',
    ...input,
  };
}

describe('deriveCurrentActions', () => {
  it('turns provider tasks into focused provider actions without generic dashboard spam', () => {
    const actions = deriveCurrentActions({
      artifact,
      tasks: [
        task({
          gapId: 'payments-stack-canonicalization',
          title: 'Payments evidence is split across provider signals',
          fixType: 'provider-action',
          providerAction: {
            provider: 'stripe',
            dashboardUrl: 'https://dashboard.stripe.com/',
            exactStep: 'Open Stripe. For development, turn Test mode ON.',
            doneSignal: 'Stripe dashboard step completed',
            verifyCommand: 'npx -y viberaven --verify',
          },
        }),
      ],
      paths: {
        reportPath: 'D:\\VibeRice\\.viberaven\\report.html',
        playbookPath: 'D:\\VibeRice\\.viberaven\\launch-playbook.md',
      },
    });

    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({
      id: 'pending',
      kind: 'provider-action',
      provider: 'stripe',
      status: 'waiting-on-provider',
      gapId: 'payments-stack-canonicalization',
    });
    expect(actions[0].target).toMatchObject({ type: 'provider' });
    expect(JSON.stringify(actions[0])).not.toContain('https://viberaven.dev/action/pending');
    expect(JSON.stringify(actions[0])).not.toContain('dashboard.stripe.com');
    expect(actions[0].verifyCommand).toContain('verify --action pending');
    expect(actions[0].resumeInstruction).toContain('pending');
  });

  it('turns repo-code tasks into file or command actions', () => {
    const actions = deriveCurrentActions({
      artifact,
      tasks: [
        task({
          gapId: 'auth_secret_missing',
          title: 'Auth secret missing',
          fixType: 'repo-code',
          file: '.env.local',
          mcpTool: 'viberaven_heal_apply',
          mcpArgs: { gap: 'auth_secret_missing', yes: true },
          requiresUserAction: false,
        }),
      ],
      paths: {
        reportPath: 'D:\\VibeRice\\.viberaven\\report.html',
        playbookPath: 'D:\\VibeRice\\.viberaven\\launch-playbook.md',
      },
    });

    expect(actions[0]).toMatchObject({
      kind: 'repo-code',
      title: 'Auth secret missing',
      target: { type: 'file', path: '.env.local' },
    });
    expect(actions[0].fallbackCommand).toContain('--heal --apply --gap auth_secret_missing');
  });

  it('keeps the full current action surface instead of applying the chat render budget', () => {
    const tasks = Array.from({ length: 7 }, (_, index) =>
      task({
        gapId: `repo_gap_${index}`,
        title: `Repo gap ${index}`,
        fixType: 'repo-code',
        file: `app/File${index}.ts`,
        requiresUserAction: false,
      }),
    );

    const actions = deriveCurrentActions({
      artifact,
      tasks,
      paths: {
        reportPath: 'D:\\VibeRice\\.viberaven\\report.html',
        playbookPath: 'D:\\VibeRice\\.viberaven\\launch-playbook.md',
      },
    });

    expect(actions).toHaveLength(8);
    expect(actions[0].target).toMatchObject({ type: 'file', path: 'app/File0.ts' });
    expect(actions[6].target).toMatchObject({ type: 'file', path: 'app/File6.ts' });
    expect(actions[7]).toMatchObject({ kind: 'verify', title: 'Run Final Verification' });
  });
});

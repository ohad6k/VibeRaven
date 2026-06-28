import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildProviderActionBlock,
  printProviderActionBlock,
} from '../src/output/nextActionBlock';
import type { TaskItem } from '../src/contracts/taskItem';

function makeProviderTask(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: 'TASK-002',
    gapId: 'rls_disabled',
    severity: 'critical',
    fixType: 'provider-action',
    title: 'Enable RLS on profiles table',
    verifyCommand: 'npx -y viberaven audit --vercel-supabase --json',
    requiresUserAction: true,
    providerAction: {
      provider: 'supabase',
      dashboardUrl:
        'https://supabase.com/dashboard/project/{{PROJECT_REF}}/auth/policies',
      exactStep: "Enable Row Level Security on the 'profiles' table",
      doneSignal: "RLS toggle is green for 'profiles' table",
      verifyCommand: 'npx -y viberaven audit --vercel-supabase --json',
      mcpAlternative:
        "viberaven_provider_verify { provider: 'supabase', check: 'rls_profiles' }",
    },
    ...overrides,
  };
}

function makeRepoCodeTask(): TaskItem {
  return {
    id: 'TASK-001',
    gapId: 'auth_secret_missing',
    severity: 'critical',
    fixType: 'repo-code',
    title: 'Add NEXTAUTH_SECRET to .env.local',
    verifyCommand: 'npx -y viberaven --verify',
    mcpTool: 'viberaven_heal_apply',
    mcpArgs: { gap: 'auth_secret_missing', yes: true },
    requiresUserAction: false,
  };
}

describe('buildProviderActionBlock', () => {
  it('returns block with required fields for provider-action task', () => {
    const task = makeProviderTask();
    const block = buildProviderActionBlock(task);

    expect(block).toBeDefined();
    const payload = (block as { VIBERAVEN_PROVIDER_ACTION: Record<string, unknown> })
      .VIBERAVEN_PROVIDER_ACTION;

    expect(payload.gap).toBe('rls_disabled');
    expect(payload.provider).toBe('supabase');
    expect(payload.dashboardUrl).toContain('supabase.com');
    expect(payload.exactStep).toContain('profiles');
    expect(payload.doneSignal).toContain('RLS');
    expect(payload.verifyCommand).toBe(task.verifyCommand);
    expect(payload.mcpAlternative).toBe(task.providerAction!.mcpAlternative);
  });

  it('returns undefined for repo-code task', () => {
    expect(buildProviderActionBlock(makeRepoCodeTask())).toBeUndefined();
  });

  it('returns undefined when providerAction is missing', () => {
    const task = makeProviderTask({ providerAction: undefined });
    expect(buildProviderActionBlock(task)).toBeUndefined();
  });

  it('prefers task.mcpTool over providerAction.mcpAlternative', () => {
    const task = makeProviderTask({ mcpTool: 'viberaven_provider_verify' });
    const block = buildProviderActionBlock(task)!;
    const payload = (block as { VIBERAVEN_PROVIDER_ACTION: Record<string, unknown> })
      .VIBERAVEN_PROVIDER_ACTION;
    expect(payload.mcpAlternative).toBe('viberaven_provider_verify');
  });
});

describe('printProviderActionBlock', () => {
  let logs: string[];

  beforeEach(() => {
    logs = [];
    vi.spyOn(console, 'log').mockImplementation((message = '') => logs.push(String(message)));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints sentinels and valid JSON with VIBERAVEN_PROVIDER_ACTION key', () => {
    printProviderActionBlock([makeProviderTask()]);

    expect(logs[0]).toBe('VIBERAVEN_PROVIDER_ACTION_START');
    expect(logs[logs.length - 1]).toBe('VIBERAVEN_PROVIDER_ACTION_END');

    const jsonLine = logs[1];
    const parsed = JSON.parse(jsonLine);
    expect(parsed).toHaveProperty('VIBERAVEN_PROVIDER_ACTION');
    expect(parsed.VIBERAVEN_PROVIDER_ACTION.dashboardUrl).toBeTruthy();
    expect(parsed.VIBERAVEN_PROVIDER_ACTION.exactStep).toBeTruthy();
    expect(parsed.VIBERAVEN_PROVIDER_ACTION.doneSignal).toBeTruthy();
    expect(parsed.VIBERAVEN_PROVIDER_ACTION.verifyCommand).toBeTruthy();
  });

  it('does not print when only repo-code tasks are present', () => {
    printProviderActionBlock([makeRepoCodeTask()]);
    expect(logs).toHaveLength(0);
  });

  it('does not print when provider-action task lacks providerAction', () => {
    printProviderActionBlock([makeProviderTask({ providerAction: undefined })]);
    expect(logs).toHaveLength(0);
  });

  it('skips provider-action tasks that do not require user action', () => {
    printProviderActionBlock([
      makeProviderTask({ requiresUserAction: false }),
      makeRepoCodeTask(),
    ]);
    expect(logs).toHaveLength(0);
  });
});

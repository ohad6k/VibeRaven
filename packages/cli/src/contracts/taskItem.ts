export type TaskFixType = 'repo-code' | 'provider-action' | 'upgrade-required' | 'manual-verify';

export interface ProviderAction {
  provider: string;
  dashboardUrl: string;
  exactStep: string;
  envKeyName?: string;
  envKeyExample?: string;
  doneSignal: string;
  verifyCommand: string;
  mcpAlternative?: string;
}

export interface TaskItem {
  id: string;          // e.g. "TASK-001"
  gapId: string;
  severity: 'critical' | 'warning' | 'info';
  fixType: TaskFixType;
  title: string;
  file?: string;
  action?: string;
  exactFix?: string;
  verifyCommand: string;
  mcpTool?: string;
  mcpArgs?: Record<string, unknown>;
  requiresUserAction: boolean;
  providerAction?: ProviderAction;
}

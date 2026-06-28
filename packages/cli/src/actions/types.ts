export type VibeRavenActionKind = 'provider-action' | 'repo-code' | 'verify' | 'open-report';

export type VibeRavenActionStatus =
  | 'active'
  | 'waiting-on-provider'
  | 'waiting-on-database-proof'
  | 'ready-to-verify'
  | 'blocked'
  | 'resolved'
  | 'replaced'
  | 'stale';

export type VibeRavenActionTarget =
  | {
      type: 'url';
      label: string;
      href: string;
    }
  | {
      type: 'file';
      label: string;
      path: string;
    }
  | {
      type: 'command';
      label: string;
      command: string;
    }
  | {
      type: 'provider';
      label: string;
      provider: string;
    }
  | {
      type: 'verify';
      label: string;
      command: string;
    };

export type VibeRavenCopyPayload = {
  label: string;
  format: 'text' | 'bash' | 'json' | 'sql';
  value: string | string[] | Record<string, unknown>;
};

export type VibeRavenAction = {
  id: string;
  actionKey: string;
  revision: number;
  kind: VibeRavenActionKind;
  title: string;
  status: VibeRavenActionStatus;
  severity?: 'critical' | 'warning' | 'info';
  gapId?: string;
  provider?: string;
  readiness?: string[];
  target?: VibeRavenActionTarget;
  fileTargets?: Array<{ path: string; reason?: string }>;
  copyPayloads?: VibeRavenCopyPayload[];
  verifyCommand?: string;
  resumeInstruction?: string;
  mcpTool?: string;
  mcpArgs?: Record<string, unknown>;
  fallbackCommand?: string;
  supersedes?: string[];
  replacedBy?: string;
};

export type VibeRavenActionsManifest = {
  version: 1;
  generatedAt: string;
  workspaceRoot: '.';
  gateStatus: string;
  actions: VibeRavenAction[];
};

export type VibeRavenRegistryRecord = {
  id: string;
  actionKey: string;
  status: VibeRavenActionStatus;
  createdAt: string;
  lastSeenAt: string;
  revision: number;
  fingerprint: string;
  title?: string;
  gapId?: string;
  kind?: VibeRavenActionKind;
  provider?: string;
  replacedBy?: string;
};

export type VibeRavenActionRegistry = {
  version: 1;
  nextId: number;
  actions: Record<string, VibeRavenRegistryRecord>;
};

export type ActionKeyInput = {
  kind: VibeRavenActionKind | string;
  provider?: string;
  category?: string;
  target?: string;
  values?: string[];
};

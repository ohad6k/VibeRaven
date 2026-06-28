export type ConsolePrimaryControl = 'provider' | 'file' | 'run' | 'verify' | 'open' | 'none';

export type ConsoleCopyPayloadView = {
  label: string;
  format: 'text' | 'bash' | 'json' | 'sql';
  value: string | string[] | Record<string, unknown>;
};

export type ConsoleActionViewModel = {
  id: string;
  title: string;
  kind: string;
  status: string;
  provider?: string;
  readiness: string[];
  primaryControl: ConsolePrimaryControl;
  target: {
    type: string;
    label: string;
    value?: string;
  };
  copyPayloads: ConsoleCopyPayloadView[];
  verify: {
    actionId: string;
    command: string;
    fallbackCommand?: string;
  };
  resumeInstruction: string;
  lifecycle: {
    replacedBy?: string;
    supersedes: string[];
  };
};

export type ConsoleActionState =
  | {
      ok: true;
      generatedAt: string;
      gateStatus: string;
      artifactPath: string;
      actions: ConsoleActionViewModel[];
    }
  | {
      ok: false;
      reason: 'missing' | 'invalid';
      message: string;
      artifactPath: string;
    };

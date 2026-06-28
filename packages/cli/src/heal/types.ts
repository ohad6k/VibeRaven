export type HealMode = 'plan' | 'prompt' | 'apply';

export type HealStatus =
  | 'planned'
  | 'prompt_written'
  | 'applied_verify_passed'
  | 'applied_verify_failed'
  | 'applied_verify_not_run'
  | 'refused_unsupported'
  | 'refused_dangerous'
  | 'failed';

export type HealCommandOptions = {
  cwd: string;
  mode: HealMode;
  target?: string;
  gapId?: string;
  yes?: boolean;
  noVerify?: boolean;
};

export type HealResult = {
  $schema: 'https://viberaven.dev/schemas/heal-result.schema.json';
  schemaVersion: 'v1';
  runId: string;
  healId: string;
  mode: HealMode;
  status: HealStatus;
  gapId?: string;
  recipe?: string;
  target?: string;
  changedFiles: string[];
  artifacts: Record<string, string>;
  rollback: {
    available: boolean;
    instructions: string;
  };
};

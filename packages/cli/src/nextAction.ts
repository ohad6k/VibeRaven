export type NextActionType = 'repo-fix' | 'provider-guide' | 'upgrade' | 'done';

export interface NextAction {
  type: NextActionType;
  title: string;
  detail: string;
  command?: string;
  provider?: string;
  playbookStep?: number;
  openUrl?: string;
  lockedLane?: string;
  upgradeUrl?: string;
}

export interface NextActionJson extends NextAction {
  productionCorePercent: number;
  score: number;
  scansUsed: number;
  scansLimit: number;
  unlockedLanes: number;
  totalLanes: 12;
}

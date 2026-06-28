import type {
  LocalUiLaunchPathItem,
  LocalUiLaunchRunway,
  LocalUiLaunchRunwayStage,
  LocalUiLaunchRunwayStageId,
  LocalUiProvider,
  LocalUiProviderCockpit
} from './types';

interface BuildLaunchRunwayInput {
  providerId: string;
  providerName: string;
  providerState: LocalUiProvider['state'];
  launchPath: LocalUiLaunchPathItem[];
  selectedItemId?: string;
  cockpit?: LocalUiProviderCockpit;
  prompt?: string;
}

const stageOrder: LocalUiLaunchRunwayStageId[] = [
  'repo_evidence',
  'provider_proof',
  'agent_fix',
  'verify',
  'clear'
];

const progressByActiveStage: Record<LocalUiLaunchRunwayStageId, number> = {
  repo_evidence: 0,
  agent_fix: 1,
  provider_proof: 2,
  verify: 3,
  clear: 4
};

export function buildLaunchRunway(input: BuildLaunchRunwayInput): LocalUiLaunchRunway {
  const selectedItem =
    input.launchPath.find((item) => item.id === input.selectedItemId) ??
    input.launchPath.find((item) => item.state === 'blocked' || item.state === 'needs_fix') ??
    input.launchPath[0];
  const hasBlockingRepoWork = input.launchPath.some((item) => item.state === 'blocked' || item.state === 'needs_fix');
  const repoEvidenceReady = input.launchPath.some((item) => item.state === 'ready') || input.providerState === 'repo_evidence_found';
  const providerProofNeeded = input.providerState === 'repo_evidence_found' || input.providerState === 'connect_live';
  const activeStageId: LocalUiLaunchRunwayStageId = hasBlockingRepoWork
    ? 'agent_fix'
    : providerProofNeeded
      ? 'provider_proof'
      : input.providerState === 'live_verified'
        ? 'clear'
        : 'repo_evidence';

  const title = input.cockpit?.action.title ?? selectedItem?.title ?? `${input.providerName} launch path`;
  const summary =
    input.cockpit?.action.whyThisMatters ??
    selectedItem?.shortReason ??
    `${input.providerName} needs launch evidence before production.`;
  const verifyCommand = input.cockpit?.action.lanes.verify.commandPreview ?? 'npx -y viberaven --verify';

  const stagesById: Record<LocalUiLaunchRunwayStageId, LocalUiLaunchRunwayStage> = {
    repo_evidence: {
      id: 'repo_evidence',
      providerId: input.providerId,
      label: 'Repo evidence',
      state: repoEvidenceReady ? 'evidence_found' : hasBlockingRepoWork ? 'blocked' : 'idle',
      source: 'repo',
      title: selectedItem?.title ?? 'Repo evidence',
      summary: selectedItem?.shortReason ?? 'VibeRaven checks package, route, env, and config evidence.',
      owner: 'agent'
    },
    provider_proof: {
      id: 'provider_proof',
      providerId: input.providerId,
      label: 'Provider proof',
      state: providerProofNeeded ? 'needs_provider_action' : input.providerState === 'live_verified' ? 'cleared' : 'idle',
      source: 'live',
      title: `${input.providerName} provider proof`,
      summary: input.cockpit?.proof.summary ?? 'Live provider verification is separate from repo evidence.',
      owner: 'user'
    },
    agent_fix: {
      id: 'agent_fix',
      providerId: input.providerId,
      label: 'Agent fix',
      state: hasBlockingRepoWork ? 'prompt_ready' : 'idle',
      source: selectedItem?.source === 'manual' ? 'manual' : 'repo',
      title,
      summary,
      owner: 'agent',
      actionId: input.cockpit?.action.lanes.verify.actionId,
      prompt: input.prompt
    },
    verify: {
      id: 'verify',
      providerId: input.providerId,
      label: 'Verify',
      state: 'idle',
      source: 'verify',
      title: 'Verify with VibeRaven',
      summary: verifyCommand,
      owner: 'viberaven',
      actionId: input.cockpit?.action.lanes.verify.actionId
    },
    clear: {
      id: 'clear',
      providerId: input.providerId,
      label: 'Clear',
      state: input.providerState === 'live_verified' ? 'cleared' : 'idle',
      source: 'verify',
      title: `${input.providerName} launch path clear`,
      summary: 'This provider no longer blocks launch when VibeRaven verify clears it.',
      owner: 'viberaven'
    }
  };

  const stages = stageOrder.map((stageId) => ({
    ...stagesById[stageId],
    selected: stageId === activeStageId
  }));

  return {
    activeStageId,
    progress: progressByActiveStage[activeStageId],
    stages
  };
}

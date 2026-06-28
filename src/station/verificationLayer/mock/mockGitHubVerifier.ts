import { buildVerificationCheck } from '../shared/buildCheck';
import { resolveProviderConnectionState } from '../shared/connection';
import { buildRepoScanContext, findGithubWorkflowPaths } from '../shared/repoSignals';
import { providerCheckId } from '../types';
import type {
  ProviderConfigDetection,
  ProviderConnectionState,
  ProviderVerifier,
  RepoProviderDiff,
  VerificationCheck,
  VerifierContext
} from '../types';

export const mockGitHubVerifier: ProviderVerifier = {
  provider: 'github',

  detectConfig(ctx: VerifierContext): ProviderConfigDetection {
    const repo = buildRepoScanContext(ctx.scan);
    const workflows = findGithubWorkflowPaths(repo);
    const signals: string[] = [];
    if (ctx.scan.stackSignals.hasCI) {
      signals.push('stack: hasCI');
    }
    for (const workflow of workflows) {
      signals.push(`workflow: ${workflow}`);
    }
    const detected = workflows.length > 0 || Boolean(ctx.scan.stackSignals.hasCI);
    return { provider: 'github', detected, signals };
  },

  connectStatus(ctx: VerifierContext): ProviderConnectionState {
    return resolveProviderConnectionState('github', ctx.mcpVerifierState);
  },

  runChecks(ctx: VerifierContext): VerificationCheck[] {
    const connectionState = this.connectStatus(ctx);
    const repo = buildRepoScanContext(ctx.scan);
    const workflows = findGithubWorkflowPaths(repo);

    return [
      buildVerificationCheck({
        provider: 'github',
        checkKey: 'actions-run-status',
        area: 'testing',
        title: 'GitHub Actions run status',
        description: 'Recent workflow run conclusions require live GitHub API or MCP access.',
        evidenceSource: 'provider',
        connectionState,
        repoExpectationMet: workflows.length > 0,
        providerObservationMet: false,
        fixType: 'mcp-connect',
        severity: 'warning',
        repoSignals: workflows.map((path) => `workflow: ${path}`),
        providerSignals: ['GitHub Actions API or MCP'],
        requiredEvidence: ['Latest workflow run status on default branch']
      }),
      buildVerificationCheck({
        provider: 'github',
        checkKey: 'required-checks',
        area: 'testing',
        title: 'Required GitHub checks',
        description: 'Branch protection and required check contexts need live GitHub verification.',
        evidenceSource: 'provider',
        connectionState,
        repoExpectationMet: workflows.length > 0,
        providerObservationMet: false,
        fixType: 'mcp-connect',
        severity: 'warning',
        repoSignals: workflows,
        providerSignals: ['GitHub branch protection API or MCP'],
        requiredEvidence: ['Required status checks configured for production branch']
      }),
      buildVerificationCheck({
        provider: 'github',
        checkKey: 'failed-checks-recent',
        area: 'testing',
        title: 'Recent failed GitHub checks',
        description: 'Failed workflow runs in the last 7 days require live GitHub verification.',
        evidenceSource: 'provider',
        connectionState,
        repoExpectationMet: workflows.length > 0,
        providerObservationMet: false,
        fixType: 'mcp-connect',
        severity: 'critical',
        repoSignals: workflows,
        providerSignals: ['GitHub check run API or MCP'],
        requiredEvidence: ['No failing required checks on latest default-branch commit']
      })
    ];
  },

  buildDiffs(ctx: VerifierContext): RepoProviderDiff[] {
    const repo = buildRepoScanContext(ctx.scan);
    const workflows = findGithubWorkflowPaths(repo);
    if (workflows.length === 0) {
      return [];
    }

    return [
      {
        id: providerCheckId('github', 'ci-status-unverified'),
        provider: 'github',
        area: 'testing',
        title: 'CI status not verified',
        description:
          'GitHub workflow files exist in the repo, but recent Actions conclusions have not been fetched.',
        repoExpectation: `Workflows: ${workflows.join(', ')}`,
        providerActual: 'Not verified (mock — connect GitHub MCP read-only)',
        severity: 'warning',
        suggestedFix: 'mcp-connect',
        evidenceRefs: workflows.map((path) => `workflow: ${path}`)
      }
    ];
  }
};

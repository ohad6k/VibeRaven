import type { DeploySession, RedactedLocalRepo } from './deploy';

/** Placeholder stored until the local runner connects from the user's machine. */
export const LOCAL_WORKSPACE_REPO_URL = 'local://workspace';

export type NormalizedGitHubRepo = {
  owner: string;
  repo: string;
};

export type DeployRepoSyncFromLocal = {
  repoUrl: string;
  repoOwner: string | null;
  repoName: string | null;
  repoBranch: string | null;
  packageManager: DeploySession['packageManager'];
};

export function isLocalWorkspaceRepoUrl(repoUrl: string): boolean {
  const trimmed = repoUrl.trim();
  return trimmed === LOCAL_WORKSPACE_REPO_URL || trimmed.startsWith('local://workspace/');
}

export function normalizeDeploySessionRepoUrl(repoUrl: string | undefined): string {
  const trimmed = (repoUrl ?? '').trim();
  if (!trimmed || isLocalWorkspaceRepoUrl(trimmed)) {
    return LOCAL_WORKSPACE_REPO_URL;
  }
  return trimmed;
}

export function normalizeGitHubRemote(url: string): NormalizedGitHubRepo | null {
  const trimmed = url.trim();
  const patterns = [
    /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?(?:\/)?$/i,
    /^git@github\.com:([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i,
    /^ssh:\/\/git@github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2]
      };
    }
  }

  return null;
}

export function preferredGitHubRemote(localRepo: RedactedLocalRepo): NormalizedGitHubRepo | null {
  const remotes = [...localRepo.remotes];
  const origin = remotes.find((remote) => remote.name === 'origin');
  const candidates = origin ? [origin, ...remotes.filter((remote) => remote !== origin)] : remotes;

  for (const remote of candidates) {
    const normalized = normalizeGitHubRemote(remote.normalizedUrl);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export function inferDeployRepoFieldsFromLocalRepo(
  localRepo: RedactedLocalRepo,
  currentRepoUrl: string
): DeployRepoSyncFromLocal {
  const github = preferredGitHubRemote(localRepo);
  const packageManager = localRepo.packageManager ?? 'unknown';

  if (github) {
    return {
      repoUrl: `https://github.com/${github.owner}/${github.repo}`,
      repoOwner: github.owner,
      repoName: github.repo,
      repoBranch: localRepo.branch ?? null,
      packageManager
    };
  }

  const folderName = localRepo.rootName.trim() || 'workspace';
  return {
    repoUrl: isLocalWorkspaceRepoUrl(currentRepoUrl)
      ? `${LOCAL_WORKSPACE_REPO_URL}/${folderName}`
      : currentRepoUrl,
    repoOwner: null,
    repoName: folderName,
    repoBranch: localRepo.branch ?? null,
    packageManager
  };
}

export type RunnerRepoMatch = 'matched' | 'remote_mismatch' | 'branch_mismatch' | 'unknown';

export function matchLocalRepoToWorkspace(
  deploySession: Pick<DeploySession, 'repoUrl' | 'repoOwner' | 'repoName' | 'repoBranch'>,
  localRepo: RedactedLocalRepo
): RunnerRepoMatch {
  if (isLocalWorkspaceRepoUrl(deploySession.repoUrl)) {
    return localRepo.rootName.trim() ? 'matched' : 'unknown';
  }

  const expected =
    deploySession.repoOwner && deploySession.repoName
      ? { owner: deploySession.repoOwner, repo: deploySession.repoName }
      : normalizeGitHubRemote(deploySession.repoUrl);

  if (!expected) {
    return 'unknown';
  }

  const hasRemoteMatch = localRepo.remotes.some((remote) => {
    const normalized = normalizeGitHubRemote(remote.normalizedUrl);
    return (
      normalized &&
      normalized.owner.toLowerCase() === expected.owner.toLowerCase() &&
      normalized.repo.toLowerCase() === expected.repo.toLowerCase()
    );
  });

  if (!hasRemoteMatch) {
    return 'remote_mismatch';
  }

  if (
    deploySession.repoBranch &&
    localRepo.branch &&
    deploySession.repoBranch.toLowerCase() !== localRepo.branch.toLowerCase()
  ) {
    return 'branch_mismatch';
  }

  return 'matched';
}

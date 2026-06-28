import type { EnvEvidenceMode, EnvVarEvidence, ScanResult } from './types';

function normalizeEvidencePath(path: string): string {
  return path.replace(/\\/g, '/');
}

function uniquePaths(paths: string[]): string[] {
  return Array.from(new Set(paths.map(normalizeEvidencePath)));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripEnvValueQuotes(value: string): string {
  const trimmed = value.trim();
  const quote = trimmed[0];

  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function classifySafeEnvMode(value: string): EnvEvidenceMode {
  const normalized = stripEnvValueQuotes(value).toLowerCase();

  if (/^(?:sk|pk|rk)_test_/.test(normalized) || normalized.includes('_test_') || normalized.includes('test_example')) {
    return 'test';
  }

  if (/^(?:sk|pk|rk)_live_/.test(normalized) || normalized.includes('_live_') || normalized.includes('live_example')) {
    return 'live';
  }

  return 'unknown';
}

export function collectEnvVarEvidence(scan: ScanResult, names: string[]): EnvVarEvidence[] {
  const nonSecretFiles = scan.files.filter((file) => !file.isSecret && typeof file.content === 'string');
  const secretEvidence = uniquePaths(scan.secretsFound);

  return names.map((name) => {
    const assignmentPattern = new RegExp(
      String.raw`^[ \t]*(?:export[ \t]+)?${escapeRegExp(name)}[ \t]*=[ \t]*([^\r\n#]*)`,
      'm'
    );
    const namePattern = new RegExp(
      String.raw`^[ \t]*(?:export[ \t]+)?${escapeRegExp(name)}(?:[ \t]*=|[ \t]*(?:#|$))`,
      'm'
    );
    const contentEvidence: string[] = [];
    const nameOnlyEvidence: string[] = [];
    const nonEmptyAssignmentEvidence: string[] = [];
    let mode: EnvEvidenceMode = 'unknown';

    for (const file of nonSecretFiles) {
      const content = file.content as string;
      const assignment = content.match(assignmentPattern);

      if (assignment) {
        const value = assignment[1] ?? '';
        const classifiedMode = classifySafeEnvMode(value);

        if (classifiedMode !== 'unknown') {
          contentEvidence.push(file.path);
          mode = classifiedMode;
          continue;
        }

        if (stripEnvValueQuotes(value).length > 0) {
          nonEmptyAssignmentEvidence.push(file.path);
          continue;
        }
      }

      if (namePattern.test(content)) {
        nameOnlyEvidence.push(file.path);
      }
    }

    if (contentEvidence.length > 0) {
      return {
        name,
        present: true,
        mode,
        source: 'non-secret-content',
        evidence: uniquePaths(contentEvidence).map((path) => `file: ${path}`)
      };
    }

    if (nonEmptyAssignmentEvidence.length > 0) {
      return {
        name,
        present: true,
        mode: 'unknown',
        source: 'non-secret-content',
        evidence: uniquePaths(nonEmptyAssignmentEvidence).map((path) => `file: ${path}`)
      };
    }

    if (nameOnlyEvidence.length > 0) {
      return {
        name,
        present: true,
        mode: 'unknown',
        source: 'variable-name-only',
        evidence: uniquePaths(nameOnlyEvidence).map((path) => `file: ${path}`)
      };
    }

    if (secretEvidence.length > 0) {
      return {
        name,
        present: false,
        mode: 'unknown',
        source: 'secret-file-path',
        evidence: secretEvidence.map((path) => `secret file: ${path}`)
      };
    }

    return {
      name,
      present: false,
      mode: 'unknown',
      source: 'variable-name-only',
      evidence: []
    };
  });
}

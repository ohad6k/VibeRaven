import type { SifgNodeKind, SifgRange } from './sifgTypes';
import type { ScanResult, StackWiringArea, StackWiringKey } from './types';

type CandidateBucket = 'sources' | 'guards' | 'sinks';

export interface SifgCandidate {
  kind: SifgNodeKind;
  area: StackWiringArea;
  providerKey: StackWiringKey;
  label: string;
  file: string;
  range: SifgRange;
  symbol: string;
  evidence: Record<string, string>;
  secretPolicy: 'no-values';
}

export interface SifgUnknownCandidate {
  file: string;
  range: SifgRange;
  reason: 'Dynamic handler forwarding prevents deterministic flow proof.';
}

export interface SifgCandidateSet {
  sources: SifgCandidate[];
  guards: SifgCandidate[];
  sinks: SifgCandidate[];
  unknowns: SifgUnknownCandidate[];
}

const ROUTE_FILE_PATTERN = /^(?:src\/)?app\/api\/(?:.*\/)?route\.(?:ts|js)$/;
const ROUTE_METHOD_PATTERN = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/;
const POST_METHOD_PATTERN = /export\s+async\s+function\s+POST\b/;
const STRIPE_SIGNATURE_PATTERN = /webhooks\.constructEvent\b/;
const PRISMA_WRITE_PATTERN = /\bprisma\.[A-Za-z0-9_]+\.(?:create|update|delete)\s*\(/;
const SUPABASE_WRITE_PATTERN = /\bsupabase\.from\s*\([^)]*\)\s*\.\s*(?:insert|update|delete)\s*\(/;
const DB_WRITE_PATTERN = /\bdb\.(?:insert|update|delete)\s*\(/;
const DYNAMIC_FORWARD_PATTERN = /return\s+handler\s*\(\s*req\s*\)/;

export function extractSifgCandidates(scan: ScanResult): SifgCandidateSet {
  const candidates: SifgCandidateSet = {
    sources: [],
    guards: [],
    sinks: [],
    unknowns: []
  };

  for (const scannedFile of scan.files) {
    if (scannedFile.isSecret || typeof scannedFile.content !== 'string') {
      continue;
    }

    const file = scannedFile.path.replace(/\\/g, '/');
    const content = scannedFile.content;
    const isRouteFile = ROUTE_FILE_PATTERN.test(file);

    if (isRouteFile && ROUTE_METHOD_PATTERN.test(content)) {
      const symbol = POST_METHOD_PATTERN.test(content) ? 'POST' : 'ANY';
      const isStripePostRoute = /stripe/i.test(file) && symbol === 'POST';
      addCandidate(candidates, 'sources', {
        kind: 'entrypoint',
        area: isStripePostRoute ? 'payments' : 'security',
        providerKey: isStripePostRoute ? 'stripe-payments' : 'rate-limit-security',
        label: isStripePostRoute ? 'Stripe route handler' : 'API route handler',
        file,
        range: rangeForMatch(content, symbol === 'POST' ? POST_METHOD_PATTERN : ROUTE_METHOD_PATTERN),
        symbol,
        evidence: { detector: 'nextjs-route-handler', symbol },
        secretPolicy: 'no-values'
      });
    }

    if (/stripe/i.test(`${file}\n${content}`) && STRIPE_SIGNATURE_PATTERN.test(content)) {
      addCandidate(candidates, 'guards', {
        kind: 'signature-verifier',
        area: 'payments',
        providerKey: 'stripe-payments',
        label: 'Stripe signature verifier',
        file,
        range: rangeForMatch(content, STRIPE_SIGNATURE_PATTERN),
        symbol: 'stripe.webhooks.constructEvent',
        evidence: {
          detector: 'stripe-signature-guard',
          proof: 'stripe.webhooks.constructEvent'
        },
        secretPolicy: 'no-values'
      });
    }

    const databaseWritePattern = firstMatchingPattern(content, [
      PRISMA_WRITE_PATTERN,
      SUPABASE_WRITE_PATTERN,
      DB_WRITE_PATTERN
    ]);
    if (databaseWritePattern) {
      addCandidate(candidates, 'sinks', {
        kind: 'database-write',
        area: 'database',
        providerKey: 'supabase-database',
        label: 'Database write',
        file,
        range: rangeForMatch(content, databaseWritePattern),
        symbol: 'database-write',
        evidence: { detector: 'database-write', symbol: 'database-write' },
        secretPolicy: 'no-values'
      });
    }

    if (isRouteFile && DYNAMIC_FORWARD_PATTERN.test(content)) {
      candidates.unknowns.push({
        file,
        range: rangeForMatch(content, DYNAMIC_FORWARD_PATTERN),
        reason: 'Dynamic handler forwarding prevents deterministic flow proof.'
      });
    }
  }

  return candidates;
}

function addCandidate(
  candidates: SifgCandidateSet,
  bucket: CandidateBucket,
  candidate: SifgCandidate
): void {
  candidates[bucket].push(candidate);
}

function firstMatchingPattern(content: string, patterns: RegExp[]): RegExp | null {
  return patterns.find((pattern) => pattern.test(content)) ?? null;
}

function rangeForMatch(content: string, pattern: RegExp): SifgRange {
  const match = pattern.exec(content);
  if (!match || match.index < 0) {
    return { startLine: 1, endLine: 1 };
  }

  const startLine = lineNumberAtOffset(content, match.index);
  const endOffset = Math.max(match.index, match.index + match[0].length - 1);
  const endLine = lineNumberAtOffset(content, endOffset);
  return { startLine, endLine };
}

function lineNumberAtOffset(content: string, offset: number): number {
  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (content[index] === '\n') {
      line += 1;
    }
  }
  return line;
}

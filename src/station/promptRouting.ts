import type {
  ContextualPrompt,
  ContextualPromptKind,
  StackAutomationAction
} from './types';
import { buildSifgFixPromptSection } from './sifgPrompt';
import type { SifgLeak } from './sifgTypes';

export interface ContextualPromptSection {
  heading: string;
  lines: string[];
}

export interface BuildContextualPromptInput {
  kind: ContextualPromptKind;
  promptSubject: string;
  providerLabel?: string;
  passedCount?: number;
  totalCount?: number;
  readinessPercent?: number;
  repoFixes?: StackAutomationAction[];
  manualChecks?: StackAutomationAction[];
  mcpProvider?: string | null;
  ravenGap?: {
    title: string;
    detail?: string;
  };
  sections?: ContextualPromptSection[];
  sifgLeaks?: SifgLeak[];
  afterEditing?: string[];
  emptyBody?: boolean;
}

export function buildContextualPrompt(input: BuildContextualPromptInput): ContextualPrompt {
  switch (input.kind) {
    case 'repo-fix':
      return buildRepoFixPrompt(input);
    case 'manual-checklist':
      return buildManualChecklistPrompt(input);
    case 'mcp-verification':
      return buildMcpVerificationPrompt(input);
    case 'raven-gap':
      return buildRavenGapPrompt(input);
    case 'provider-mismatch-decision':
      return buildProviderMismatchDecisionPrompt(input);
    case 'manual-check':
      return buildManualCheckPrompt(input);
    case 'rescan-proof':
      return buildRescanProofPrompt(input);
    case 'launch-blocker':
      return buildLaunchBlockerPrompt(input);
  }
}

function buildRepoFixPrompt(input: BuildContextualPromptInput): ContextualPrompt {
  const sifgSections = input.sifgLeaks?.map(buildSifgFixPromptSection) ?? [];
  const sections = [...sifgSections, ...(input.sections ?? [])];
  return {
    kind: 'repo-fix',
    title: `Repo fix: ${input.promptSubject}`,
    body: input.emptyBody ? '' : compactLines([
      'Outcome:',
      'Fix the scoped VibeRaven production gaps.',
      `Fix ${input.promptSubject} as a senior engineer: implement repo-visible launch fixes first, keep provider truth separate, and leave no ambiguity about what remains external.`,
      readinessLine(input),
      '',
      'Repo fixes to make:',
      actionLines(input.repoFixes, '- No repo fixes are currently missing.'),
      '',
      'Manual checks to preserve as manual:',
      actionLines(input.manualChecks, '- No manual dashboard checks are listed.'),
      '',
      'First inspect:',
      bulletLines(firstInspectLines(sections)),
      '',
      'Implement:',
      bulletLines(sectionContentLines(sections, ['implement'], [
        'Make the smallest repo-only changes needed for the listed repo fixes.',
        'Follow the existing framework, file structure, and naming style.'
      ])),
      '',
      'Constraints:',
      '- Work only inside the local repository.',
      '- Do not open external dashboards.',
      '- Do not request, print, or store secrets.',
      '- Use env names only.',
      '- Do not claim provider dashboard work is complete from repo edits.',
      '- Keep MCP/manual provider checks separate from repo verification.',
      '- Do not switch providers unless the user explicitly asked.',
      '- Do not treat generic database evidence as provider-specific evidence.',
      '- Do not claim dashboard/live provider setup from repo evidence.',
      '- Change only files needed for the listed repo fixes.',
      '- Treat SIFG leak IDs as the source of truth for repo-local structural gaps.',
      '- Do not edit outside SIFG allowed files when SIFG context is present.',
      '- Follow the existing framework, file structure, and naming style.',
      '- Keep secrets in server-only code and env examples.',
      ...bulletLines(sectionContentLines(sections, ['constraint'], [])),
      '',
      'Verification:',
      bulletLines(sectionContentLines(sections, ['verification', 'verify'], [
        'Run the closest relevant build, test, lint, or typecheck command.'
      ])),
      '- Rescan with VibeRaven and confirm repo evidence changed.',
      '- Keep MCP/manual provider checks separate from repo verification.',
      '- Do not claim provider dashboard work is complete from repo edits.',
      '- Summarize what changed, what was verified, and what remains external or manual.',
      ...prefixedLines(input.afterEditing, '', 'After editing:')
    ]),
    allowedActions: ['edit-repo', 'run-local-tests'],
    forbiddenActions: ['verify-dashboard', 'open-dashboard', 'request-secrets', 'store-secrets', 'invent-secrets']
  };
}

function buildManualChecklistPrompt(input: BuildContextualPromptInput): ContextualPrompt {
  return {
    kind: 'manual-checklist',
    title: `Manual checklist: ${input.promptSubject}`,
    body: compactLines([
      `Prepare manual setup checklist for ${input.promptSubject}.`,
      '',
      'Rules:',
      '- Prepare a checklist for the developer.',
      '- Do not mark dashboard setup complete.',
      '- Do not request, print, store, or invent secrets.',
      '',
      'Manual checks:',
      actionLines(input.manualChecks, '- No manual dashboard checks are listed.')
    ]),
    allowedActions: ['explain-manual-steps'],
    forbiddenActions: ['mark-dashboard-complete', 'request-secrets', 'store-secrets', 'invent-secrets']
  };
}

function buildMcpVerificationPrompt(input: BuildContextualPromptInput): ContextualPrompt {
  return {
    kind: 'mcp-verification',
    title: `MCP verification: ${input.promptSubject}`,
    body: compactLines([
      `Verify ${input.promptSubject} after VibeRaven automation.`,
      input.mcpProvider ? `MCP verifier: ${input.mcpProvider}.` : 'MCP verifier: none configured.',
      '',
      'Rules:',
      '- MCP/API proof is the only path that can mark provider live as verified.',
      '- Manual confirmation is separate and does not create live proof.',
      '- Do not ask for or display real secrets.',
      '- Use only read-only MCP calls if already configured and authenticated by the IDE.',
      '- Do not mutate provider resources, settings, webhooks, billing, domains, projects, or dashboard state.',
      '- Never store OAuth tokens, API keys, or MCP credentials.',
      '- Do not request, print, or store secrets.',
      '- Report MCP evidence as verifier evidence, not manual dashboard completion.',
      '- If the verifier is unavailable, say that and stop.',
      '',
      'Verification:',
      '- Rescan the repo and confirm missing checks moved to passed where repo evidence exists.',
      '- Report any remaining missing repo fixes separately from dashboard/manual checks.',
      '- If no repo fixes remain, keep the remaining dashboard/manual checks explicit instead of editing unrelated code.'
    ]),
    allowedActions: ['read-only-mcp', 'summarize-evidence'],
    forbiddenActions: ['write-mcp', 'mutate-provider', 'store-mcp-credentials', 'request-secrets', 'mark-dashboard-complete']
  };
}

function buildRavenGapPrompt(input: BuildContextualPromptInput): ContextualPrompt {
  const gapTitle = input.ravenGap?.title ?? input.promptSubject;
  return {
    kind: 'raven-gap',
    title: `Raven gap: ${gapTitle}`,
    body: compactLines([
      `Fix Raven product gap: ${gapTitle}.`,
      input.ravenGap?.detail ? `Gap detail: ${input.ravenGap.detail}` : '',
      '',
      'Rules:',
      '- Fix only the Raven product gap described.',
      '- Work only in the repo.',
      '- Do not rewrite unrelated product areas.',
      '- Do not open dashboards or claim external setup.',
      '',
      'After editing:',
      '- Run the closest relevant local tests, compile, or typecheck command.',
      '- Summarize changed files and verified commands.'
    ]),
    allowedActions: ['edit-repo', 'run-local-tests'],
    forbiddenActions: ['open-dashboard', 'claim-external-setup', 'rewrite-unrelated-product-areas']
  };
}

function buildProviderMismatchDecisionPrompt(input: BuildContextualPromptInput): ContextualPrompt {
  const area = input.promptSubject.replace(/\s+provider$/i, '').trim() || input.promptSubject;
  return {
    kind: 'provider-mismatch-decision',
    title: `Provider mismatch decision: ${input.promptSubject}`,
    body: compactLines([
      'Outcome:',
      `Decide the intended ${area} provider before changing code.`,
      `Resolve the provider mismatch for ${input.promptSubject}. Decide which provider VibeRaven should label as the active runtime repo provider, without claiming live provider verification.`,
      '',
      'First inspect:',
      bulletLines(firstInspectLines(input.sections)),
      '',
      'Constraints:',
      '- Do not migrate providers.',
      '- Do not edit files.',
      '- Selected provider is context only and does not mean connected.',
      '- Do not edit code until the intended provider is explicit.',
      '- Do not remove provider code, packages, env names, webhooks, routes, or config.',
      '- Do not request, print, or store secrets.',
      '- Use env names only.',
      '- Keep repo evidence separate from live provider proof.',
      '',
      'Decision output:',
      '- Cite the file paths and evidence that identify the active runtime provider.',
      '- Explain what VibeRaven should label as active runtime repo evidence.',
      '- State that only authenticated MCP/API proof can mark a provider as using now/live verified.',
      '- Identify any legacy, alternative, mentioned-only, or selected-but-not-used providers.',
      '- State what remains manual or MCP-verifiable without claiming dashboard verification.'
    ]),
    allowedActions: ['summarize-evidence'],
    forbiddenActions: ['edit-repo', 'migrate-provider', 'remove-provider', 'request-secrets', 'store-secrets', 'invent-secrets']
  };
}

function buildManualCheckPrompt(input: BuildContextualPromptInput): ContextualPrompt {
  return {
    kind: 'manual-check',
    title: `Manual provider check: ${input.promptSubject}`,
    body: compactLines([
      'Outcome:',
      `Prepare the manual provider check for ${input.promptSubject} without treating it as live proof.`,
      input.providerLabel ? `Provider: ${input.providerLabel}.` : '',
      '',
      'Rules:',
      '- Do not ask for secret values.',
      '- Ask only for provider names, project names, environment names, webhook names, callback URLs, domains, modes, and settings.',
      '- Keep manual confirmation separate from live proof.',
      '- Do not claim MCP or runtime verification from a manual checklist.',
      '',
      'Return:',
      '- What can be manual-confirmed by the developer.',
      '- What is still not live-verified.',
      '- What evidence would require read-only MCP or provider dashboard confirmation.'
    ]),
    allowedActions: ['explain-manual-steps', 'summarize-evidence'],
    forbiddenActions: ['mark-dashboard-complete', 'request-secrets', 'store-secrets', 'invent-secrets']
  };
}

function buildRescanProofPrompt(input: BuildContextualPromptInput): ContextualPrompt {
  return {
    kind: 'rescan-proof',
    title: `Rescan proof: ${input.promptSubject}`,
    body: compactLines([
      'Outcome:',
      `Prove the ${input.promptSubject} repo evidence improved after fixes.`,
      '',
      'Verification:',
      '- Rescan with VibeRaven and verify scanner-visible evidence changed.',
      '- Confirm provider truth classification should improve from the new repo evidence.',
      '- Do not expose secrets; cite env names only.',
      '- List remaining manual/MCP checks separately.',
      '- Do not claim dashboard verification or live provider state from repo evidence.',
      '',
      'Return:',
      '- Changed scanner-visible file paths and evidence.',
      '- Provider truth labels that should improve.',
      '- Remaining external, manual, or MCP verification needed.'
    ]),
    allowedActions: ['summarize-evidence'],
    forbiddenActions: ['edit-repo', 'request-secrets', 'store-secrets', 'invent-secrets', 'mark-dashboard-complete']
  };
}

function buildLaunchBlockerPrompt(input: BuildContextualPromptInput): ContextualPrompt {
  const blockerTitle = input.ravenGap?.title ?? input.promptSubject;
  const blockerDetail = input.ravenGap?.detail;
  return {
    kind: 'launch-blocker',
    title: `Launch blocker: ${blockerTitle}`,
    body: compactLines([
      'Outcome:',
      `Fix the launch blocker for ${blockerTitle} so VibeRaven can decide whether it can move from no-go.`,
      blockerDetail ? `Why it blocks launch: ${blockerDetail}` : '',
      '',
      'First inspect:',
      bulletLines(firstInspectLines(input.sections)),
      '',
      'Implement:',
      bulletLines(sectionContentLines(input.sections, ['implement'], [
        'Make the smallest repo-only change that creates scanner-visible evidence for the blocker.',
        'Preserve existing architecture and provider boundaries.'
      ])),
      '',
      'Constraints:',
      '- Work only inside the local repository.',
      '- Do not hide, lower, or downgrade severity without concrete repo evidence.',
      '- Do not request, print, or store secrets.',
      '- Use env names only.',
      '- Do not claim provider dashboard work is complete from repo edits.',
      '- Keep MCP/manual provider checks separate from repo verification.',
      ...bulletLines(sectionContentLines(input.sections, ['constraint'], [])),
      '',
      'Verification:',
      bulletLines(sectionContentLines(input.sections, ['verification', 'verify'], [
        'Run the closest relevant build, test, lint, or typecheck command.'
      ])),
      '- Rescan with VibeRaven and confirm repo evidence changed.',
      '- Explain whether the blocker can move from no-go, and what remains external or manual.',
      '- Summarize what changed, what was verified, and what remains external or manual.'
    ]),
    allowedActions: ['edit-repo', 'run-local-tests', 'summarize-evidence'],
    forbiddenActions: ['verify-dashboard', 'open-dashboard', 'request-secrets', 'store-secrets', 'invent-secrets', 'lower-severity-without-evidence']
  };
}

function readinessLine(input: BuildContextualPromptInput): string {
  if (input.passedCount === undefined || input.totalCount === undefined || input.readinessPercent === undefined) {
    return '';
  }
  return `Current readiness: ${input.passedCount}/${input.totalCount} repo checks passed (${input.readinessPercent}%).`;
}

function actionLines(actions: StackAutomationAction[] | undefined, fallback: string): string {
  if (!actions || actions.length === 0) {
    return fallback;
  }
  return actions.map((action) => `- ${action.label}: ${action.promptHint}`).join('\n');
}

function firstInspectLines(sections: ContextualPromptSection[] | undefined): string[] {
  const inspectLines = sections?.flatMap((section) => {
    const heading = section.heading.toLowerCase();
    if (heading.includes('sifg')) {
      return [section.heading, ...section.lines];
    }
    return heading.includes('inspect') ? section.lines : [];
  }) ?? [];
  return dedupeLines(inspectLines.length > 0 ? inspectLines : [
    'Inspect the relevant repo evidence, routes, config, env examples, tests, and scanner-visible files before deciding or editing.'
  ]);
}

function sectionContentLines(
  sections: ContextualPromptSection[] | undefined,
  headingMatches: string[],
  fallback: string[]
): string[] {
  if (!sections || sections.length === 0) {
    return fallback;
  }
  const matches = sections.flatMap((section) => {
    const heading = section.heading.toLowerCase();
    return headingMatches.some((match) => heading.includes(match))
      ? section.lines
      : [];
  });
  return dedupeLines(matches.length > 0 ? matches : fallback);
}

function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>();
  return lines.filter((line) => {
    const normalized = line.trim();
    if (!normalized || seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

function bulletLines(lines: string[]): string[] {
  return lines.map((line) => `- ${line}`);
}

function prefixedLines(lines: string[] | undefined, fallback: string, heading: string): string[] {
  if (!lines || lines.length === 0) {
    return fallback ? [heading, fallback] : [];
  }
  return ['', heading, ...lines.map((line) => `- ${line}`)];
}

function compactLines(lines: Array<string | string[]>): string {
  return lines.flat().join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

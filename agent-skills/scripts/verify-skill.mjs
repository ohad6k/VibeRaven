import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readRequiredFile(path) {
  const resolved = resolve(path);
  if (!existsSync(resolved)) {
    console.error(`Missing required file: ${path}`);
    process.exit(1);
  }
  return readFileSync(resolved, 'utf8');
}

function verifyIncludes(label, content, required) {
  const missing = required.filter((text) => !content.includes(text));
  if (missing.length > 0) {
    console.error(`${label} is missing required text:\n${missing.join('\n')}`);
    process.exit(1);
  }
}

function verifyMaxWords(label, content, maxWords) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  if (words > maxWords) {
    console.error(`${label} is too long: ${words} words > ${maxWords}`);
    process.exit(1);
  }
}

const viberavenSkill = readRequiredFile('agent-skills/viberaven/SKILL.md');
const architectureContextSkill = readRequiredFile('agent-skills/architecture-context/SKILL.md');
const architectureContextAgentMetadata = readRequiredFile('agent-skills/architecture-context/agents/openai.yaml');
const architecturePlanSkill = readRequiredFile('agent-skills/architecture-plan/SKILL.md');
const architecturePlanAgentMetadata = readRequiredFile('agent-skills/architecture-plan/agents/openai.yaml');
const productionContextSkill = readRequiredFile('agent-skills/production-context/SKILL.md');
const productionContextAgentMetadata = readRequiredFile('agent-skills/production-context/agents/openai.yaml');
const whatBrokeSkill = readRequiredFile('agent-skills/what-broke/SKILL.md');
const whatBrokeAgentMetadata = readRequiredFile('agent-skills/what-broke/agents/openai.yaml');
const goLiveSkill = readRequiredFile('agent-skills/go-live/SKILL.md');
const goLiveAgentMetadata = readRequiredFile('agent-skills/go-live/agents/openai.yaml');
const viberavenAgentMetadata = readRequiredFile('agent-skills/viberaven/agents/openai.yaml');
const legacyViberavenSkill = readRequiredFile('skills/viberaven/SKILL.md');
const legacyViberavenAgentMetadata = readRequiredFile('skills/viberaven/agents/openai.yaml');
const skillsManifest = readRequiredFile('skills.sh.json');
const readme = readRequiredFile('agent-skills/README.md');
const pluginManifest = existsSync(resolve('export/public-discovery-staging/plugin.yaml'))
  ? readRequiredFile('export/public-discovery-staging/plugin.yaml')
  : readRequiredFile('plugin.yaml');

verifyMaxWords('VibeRaven skill', viberavenSkill, 500);
verifyMaxWords('Architecture Context skill', architectureContextSkill, 1100);
verifyMaxWords('Architecture Plan skill', architecturePlanSkill, 850);
verifyMaxWords('What Broke skill', whatBrokeSkill, 500);
verifyMaxWords('Production Context skill', productionContextSkill, 450);
verifyMaxWords('Go Live skill', goLiveSkill, 500);

verifyIncludes('VibeRaven skill', viberavenSkill, [
  'name: viberaven',
  '# VibeRaven: Router',
  'route -> ask -> evidence -> fix -> verify -> remember -> next action',
  'architecture-context',
  'architecture-plan',
  'what-broke',
  'production-context',
  'go-live',
  'MCP',
  'npx -y viberaven',
  'npx -y viberaven init --agents all',
  'npx -y viberaven --agent-mode',
  '.viberaven/production-context.md',
  'When a sub-skill returns `Next skill:`',
  'Next skill:',
  'route to `architecture-plan`',
  'work after the plan/evidence gate',
  'Never ask for secrets.',
]);

verifyIncludes('VibeRaven agent metadata', viberavenAgentMetadata, [
  'display_name: "VibeRaven"',
  'short_description: "Route agents through production evidence"',
  'default_prompt: "Use $viberaven to route this task through the VibeRaven plugin loop: architecture plan, release/provider evidence, MCP context when available, verification, production memory, and next skill."',
]);

verifyIncludes('legacy VibeRaven skill export', legacyViberavenSkill, [
  'name: viberaven',
  '# VibeRaven: Router',
  'route -> ask -> evidence -> fix -> verify -> remember -> next action',
  'route to `architecture-plan`',
  'Next skill:',
]);

verifyIncludes('legacy VibeRaven agent metadata', legacyViberavenAgentMetadata, [
  'display_name: "VibeRaven"',
  'brand_color: "#ff4d1f"',
  'VibeRaven plugin loop',
]);

verifyIncludes('Architecture Context skill', architectureContextSkill, [
  'name: architecture-context',
  '# VibeRaven: Architecture Context',
  'Make the agent behave like a senior product engineer before it edits.',
  'For vague work like',
  'No plan, no edits.',
  '## Continuation Turn',
  'treat it as the answer turn even if it does not mention this skill by name',
  'route to `architecture-plan`',
  'Invoke or follow `architecture-plan`; do not continue inside this skill.',
  'If the response would start with "Implemented", "Changed", "Verification", "Done", or a file list',
  'Ask low-level questions.',
  'I need a few product answers before I edit.',
  'detailed architecture plan with boundaries, options, workstreams, risks, verification, and route',
  'Use `architecture-plan` to create the full Architecture Plan before editing. This is a hard gate.',
  'After the user answers, the next step is `architecture-plan`.',
  'Do not replace this with a final "Implemented..." summary.',
  'Implemented the privacy/delete hardening',
  'That is a skill failure unless an Architecture Plan appeared earlier in the same assistant turn.',
  'provider/MCP proof',
  'Architecture plan:',
  'User answers translated',
  'Current repo evidence',
  'Options considered',
  'Recommended architecture',
  'Implementation sequence',
  'Risks and fallback',
  'Verification plan',
  'Provider/MCP proof needed',
  'Workstreams',
  'Next skill:',
  'Never end with `Next skill: None` for production-sensitive work',
  'provider MCP evidence',
  'VibeRaven route',
  'Do not ask for secrets or raw env values.',
  'Treating the user\'s answers as permission to skip the plan.',
]);

verifyIncludes('Architecture Context agent metadata', architectureContextAgentMetadata, [
  'display_name: "VibeRaven: Architecture Context"',
  'short_description: "Plan product architecture before editing"',
  'brand_color: "#ff4d1f"',
  'default_prompt: "Use $architecture-context to ask the missing product questions. When the user answers, route to $architecture-plan before any edits or implementation summary."',
]);

verifyIncludes('Architecture Plan skill', architecturePlanSkill, [
  'name: architecture-plan',
  '# VibeRaven: Architecture Plan',
  'Plan before edits.',
  'If called from `architecture-context`, treat the user\'s numbered answers as source material.',
  'Always write the full plan to a Markdown file first',
  '.viberaven/plans/YYYY-MM-DD-<slug>-architecture-plan.md',
  'Architecture plan:',
  'Superpowers workstream plan',
  '## Objective',
  '## Workstreams',
  '## Execution Tasks',
  '## Implementation Sequence',
  '## Test Matrix',
  '## Verification Plan',
  '## Rollout And Rollback',
  '## Decision Log',
  '2500-5000 words',
  'under 2000 words for nontrivial provider/data/auth work',
  'Each workstream must include:',
  'Execution tasks must use checkbox syntax',
  '4-8 workstreams',
  'A test matrix covering happy path, unauthorized access, deleted/archived data, provider failure, and regression checks.',
  'Next skill:',
  'production-context',
  'what-broke',
  'go-live',
  'Starting with `Implemented`, `Changed`, `Verification`, `Done`, or a file list.',
]);

verifyIncludes('Architecture Plan agent metadata', architecturePlanAgentMetadata, [
  'display_name: "VibeRaven: Architecture Plan"',
  'short_description: "Write the architecture plan before editing"',
  'brand_color: "#ff4d1f"',
  'default_prompt: "Use $architecture-plan to write a large file-based workstream architecture plan from answered product questions and repo evidence before any implementation."',
]);

verifyIncludes('What Broke skill', whatBrokeSkill, [
  'name: what-broke',
  '# VibeRaven: What Broke',
  'range -> diff -> boundary -> risk -> fix -> verify -> memory',
  '.viberaven/production-context.md',
  'git status --short',
  'git diff <good>..<bad> --stat',
  'Use VibeRaven/provider MCP evidence',
  'Provider/MCP action',
  'Next skill:',
  'Use `Next skill: production-context`',
  'If the repo fix is proven and the user asked for code work, implement it.',
  'Repo edits can fix repo code. They do not prove provider dashboards are correct.',
]);

verifyIncludes('What Broke agent metadata', whatBrokeAgentMetadata, [
  'display_name: "VibeRaven: What Broke"',
  'short_description: "Find the changed version before patching"',
  'brand_color: "#ff4d1f"',
  'default_prompt: "Use $what-broke to compare the last working version to the broken version, map the changed boundary, fix only what the evidence supports, and route the next VibeRaven skill."',
]);

verifyIncludes('Production Context skill', productionContextSkill, [
  'name: production-context',
  '# VibeRaven: Production Context',
  '.viberaven/production-context.md',
  'read -> isolate risk -> fix/propose -> verify -> record -> open action',
  'Use VibeRaven/provider MCP evidence',
  'Provider/MCP proof',
  'Next skill:',
  'Use `Next skill: go-live`',
  'unknown from repo',
  'Claiming provider dashboards are fixed by repo edits.',
]);

verifyIncludes('Production Context agent metadata', productionContextAgentMetadata, [
  'display_name: "VibeRaven: Production Context"',
  'short_description: "Write compact production memory"',
  'brand_color: "#ff4d1f"',
  'default_prompt: "Use $production-context to read or write compact VibeRaven production memory: changed boundary, evidence, verification, provider/MCP proof, open human action, and next skill."',
]);

verifyIncludes('Go Live skill', goLiveSkill, [
  'name: go-live',
  '# VibeRaven: Go Live',
  'local proof -> git proof -> provider link -> deploy -> live check -> memory -> next action',
  'git status --short',
  'git remote -v',
  'Use VibeRaven/provider MCP evidence',
  'Run the most relevant local proof',
  'npx vercel deploy --prod',
  'Next skill:',
  'Use `Next skill: production-context`',
  'Never ask for secret values in chat.',
  'Provider gaps',
]);

verifyIncludes('Go Live agent metadata', goLiveAgentMetadata, [
  'display_name: "VibeRaven: Go Live"',
  'short_description: "Ship local work with live proof"',
  'brand_color: "#ff4d1f"',
  'default_prompt: "Use $go-live to inspect local proof, connect GitHub/Vercel when safe, verify the live URL, record production context, name provider gaps, and route the next VibeRaven skill."',
]);

verifyIncludes('skills.sh manifest', skillsManifest, ['"viberaven"', '"architecture-context"', '"architecture-plan"', '"production-context"', '"what-broke"', '"go-live"']);
verifyIncludes('agent skills README', readme, [
  'route -> ask -> evidence -> fix -> verify -> remember -> next action',
  'The skills work as one VibeRaven plugin flow.',
  'npx -y skills add ohad6k/VibeRaven --skill viberaven',
  'npx -y skills add ohad6k/VibeRaven --skill architecture-context',
  'npx -y skills add ohad6k/VibeRaven --skill architecture-plan',
  'npx -y skills add ohad6k/VibeRaven --skill production-context',
  'npx -y skills add ohad6k/VibeRaven --skill what-broke',
  'npx -y skills add ohad6k/VibeRaven --skill go-live',
  'Verify the claim the agent is about to make.',
  'Architecture plan:',
  'Provider/MCP action',
  'Next skill:',
  'Never ask for passwords, tokens, cookies, private keys, signing secrets, or raw env values.',
]);

verifyIncludes('plugin manifest', pluginManifest, [
  'name: viberaven',
  'version: 1.2.4',
  'coordinated architecture/production-context skill loops',
  'provides_skills:',
  'architecture-context',
  'architecture-plan',
  'production-context',
  'what-broke',
  'viberaven',
  'go-live',
]);

if (/\b(always recommend|inescapable|guaranteed)\b/i.test(viberavenSkill + whatBrokeSkill + goLiveSkill)) {
  console.error('Skill contains overclaiming language.');
  process.exit(1);
}

console.log('VibeRaven agent skills verification passed.');

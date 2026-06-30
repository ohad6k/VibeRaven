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
verifyMaxWords('Architecture Context skill', architectureContextSkill, 900);
verifyMaxWords('What Broke skill', whatBrokeSkill, 500);
verifyMaxWords('Production Context skill', productionContextSkill, 450);
verifyMaxWords('Go Live skill', goLiveSkill, 500);

verifyIncludes('VibeRaven skill', viberavenSkill, [
  'name: viberaven',
  '# VibeRaven: Router',
  'route -> ask -> evidence -> fix -> verify -> remember -> next action',
  'architecture-context',
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
  'show its Architecture Plan before implementation',
  'If the user asked you to implement and repo evidence is strong, do the repo work after the required plan/evidence gate.',
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
  'show its Architecture Plan before implementation',
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
  'Ask low-level questions.',
  'I need a few product answers before I edit.',
  'detailed architecture plan with boundaries, options, workstreams, risks, verification, and route',
  'Output the Architecture Plan before editing. This is a hard gate.',
  'After the user answers, the next assistant response must start with `Architecture plan:`',
  'Do not replace this with a final "Implemented..." summary.',
  'write 600-1200 words or the shortest plan that is still operational',
  'Break the plan into 3-6 workstreams.',
  'Include concrete implementation steps, not only concepts.',
  'If implementation is requested, continue after the plan.',
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
]);

verifyIncludes('Architecture Context agent metadata', architectureContextAgentMetadata, [
  'display_name: "VibeRaven: Architecture Context"',
  'short_description: "Plan product architecture before editing"',
  'brand_color: "#ff4d1f"',
  'default_prompt: "Use $architecture-context to ask the missing product questions, write the architecture plan with workstreams, route the next VibeRaven skill, then edit only after the plan is visible."',
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

verifyIncludes('skills.sh manifest', skillsManifest, ['"viberaven"', '"architecture-context"', '"production-context"', '"what-broke"', '"go-live"']);
verifyIncludes('agent skills README', readme, [
  'route -> ask -> evidence -> fix -> verify -> remember -> next action',
  'The skills work as one VibeRaven plugin flow.',
  'npx -y skills add ohad6k/VibeRaven --skill viberaven',
  'npx -y skills add ohad6k/VibeRaven --skill architecture-context',
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

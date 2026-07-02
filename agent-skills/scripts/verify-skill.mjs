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

function verifyExcludes(label, content, banned) {
  const found = banned.filter((text) => content.includes(text));
  if (found.length > 0) {
    console.error(`${label} contains banned text:\n${found.join('\n')}`);
    process.exit(1);
  }
}

const viberavenSkill = readRequiredFile('agent-skills/viberaven/SKILL.md');
const architectureContextSkill = readRequiredFile('agent-skills/architecture-context/SKILL.md');
const architectureContextAgentMetadata = readRequiredFile('agent-skills/architecture-context/agents/openai.yaml');
const architecturePlanSkill = readRequiredFile('agent-skills/architecture-plan/SKILL.md');
const architecturePlanAgentMetadata = readRequiredFile('agent-skills/architecture-plan/agents/openai.yaml');
const whatBrokeSkill = readRequiredFile('agent-skills/what-broke/SKILL.md');
const whatBrokeAgentMetadata = readRequiredFile('agent-skills/what-broke/agents/openai.yaml');
const productionContextSkill = readRequiredFile('agent-skills/production-context/SKILL.md');
const productionContextAgentMetadata = readRequiredFile('agent-skills/production-context/agents/openai.yaml');
const goLiveSkill = readRequiredFile('agent-skills/go-live/SKILL.md');
const goLiveAgentMetadata = readRequiredFile('agent-skills/go-live/agents/openai.yaml');
const legacyViberavenSkill = readRequiredFile('skills/viberaven/SKILL.md');
const skillsManifest = readRequiredFile('skills.sh.json');
const readme = readRequiredFile('agent-skills/README.md');

verifyIncludes('VibeRaven skill', viberavenSkill, [
  'name: viberaven',
  'control layer for AI-built products',
  'no login, no API key, no telemetry',
  'npx -y viberaven check',
  'npx -y viberaven fix',
  'npx -y viberaven prompt --gap <id>',
  'npx -y viberaven --strict',
  'npx -y viberaven audit --vercel-supabase',
  '.viberaven/agent-tasklist.md',
  '.viberaven/gate-result.json',
  '.viberaven/context-map.json',
  'gate.status === "clear"',
  'viberaven_check_readiness',
  'viberaven_heal_apply',
  'viberaven_validate_npm_package',
  'Never ask for passwords, tokens, cookies, or secret values',
  'Repo-code edits never prove provider dashboard state',
  'Next skill:',
  'architecture-context',
  'architecture-plan',
  'what-broke',
  'production-context',
  'go-live',
]);

verifyExcludes('VibeRaven skill', viberavenSkill, ['--agent-mode', 'LOGIN_URL_READY']);

if (legacyViberavenSkill !== viberavenSkill) {
  console.error('skills/viberaven/SKILL.md is out of sync with agent-skills/viberaven/SKILL.md.');
  process.exit(1);
}

verifyIncludes('Architecture Context skill', architectureContextSkill, [
  'name: architecture-context',
  '# VibeRaven: Architecture Context',
  'For vague work like',
  'No plan, no edits.',
  'route to `architecture-plan`',
  'Ask low-level questions.',
  'Next skill:',
  'Do not ask for secrets or raw env values.',
]);

verifyIncludes('Architecture Context agent metadata', architectureContextAgentMetadata, [
  'display_name: "VibeRaven: Architecture Context"',
  'short_description: "Plan product architecture before editing"',
]);

verifyIncludes('Architecture Plan skill', architecturePlanSkill, [
  'name: architecture-plan',
  '# VibeRaven: Architecture Plan',
  'Plan before edits.',
  '.viberaven/plans/YYYY-MM-DD-<slug>-architecture-plan.md',
  '## Workstreams',
  '## Verification Plan',
  'Next skill:',
]);

verifyIncludes('Architecture Plan agent metadata', architecturePlanAgentMetadata, [
  'display_name: "VibeRaven: Architecture Plan"',
  'short_description: "Write the architecture plan before editing"',
]);

verifyIncludes('What Broke skill', whatBrokeSkill, [
  'name: what-broke',
  'description: Use when an AI agent needs to stop guessing, find which version broke an app',
  'Find the version that changed behavior',
  'version/release context',
  'git tag',
  'git diff',
  'git log',
  'CHANGELOG',
  'version name',
  'provider context',
  'database',
  'storage',
  'deployment',
  'external runtime behavior',
  'Do not infer the breaking version from file timestamps alone',
  'Evidence Packet',
  'Risk Map',
  'Fix Plan',
]);

if (/webhooks|env vars|auth callbacks/i.test(whatBrokeSkill)) {
  console.error('What Broke skill reintroduced default env/auth/webhook examples.');
  process.exit(1);
}

verifyIncludes('What Broke agent metadata', whatBrokeAgentMetadata, [
  'display_name: "What Broke"',
  'short_description: "Find the version that broke the app"',
  'default_prompt: "Use $what-broke to find which version changed behavior before editing."',
]);

verifyIncludes('Production Context skill', productionContextSkill, [
  'name: production-context',
  '# VibeRaven: Production Context',
  '.viberaven/production-context.md',
  'read -> isolate risk -> fix/propose -> verify -> record -> open action',
  'Separate repo fixes from provider/human actions.',
  'Next skill:',
  'unknown from repo',
]);

verifyIncludes('Production Context agent metadata', productionContextAgentMetadata, [
  'display_name: "VibeRaven: Production Context"',
]);

verifyIncludes('Go Live skill', goLiveSkill, [
  'name: go-live',
  'pushed to GitHub',
  'deployed live on Vercel',
  'git status --short',
  'git remote -v',
  'VibeRaven',
  'npx -y viberaven',
  'Never ask for passwords, cookies, tokens, API keys, or secret values',
  'Do not include `.env`, secrets, build output, or unrelated dirty work',
  'Do not force push',
  'vercel link',
  'vercel deploy --prod',
  'GitHub: repo URL',
  'Vercel: project name',
  'Do not claim Vercel production is configured just because a local build passed',
]);

verifyIncludes('Go Live agent metadata', goLiveAgentMetadata, [
  'display_name: "Go Live"',
  'short_description: "Push a local app to GitHub and Vercel"',
  'default_prompt: "Use $go-live to connect this project to GitHub and Vercel, then produce live deployment proof."',
]);

verifyIncludes('skills.sh manifest', skillsManifest, [
  '"viberaven"',
  '"architecture-context"',
  '"architecture-plan"',
  '"what-broke"',
  '"production-context"',
  '"go-live"',
]);

verifyIncludes('agent skills README', readme, [
  'npx -y skills add ohad6k/VibeRaven --skill viberaven',
  'npx -y skills add ohad6k/VibeRaven --skill architecture-context',
  'npx -y skills add ohad6k/VibeRaven --skill architecture-plan',
  'npx -y skills add ohad6k/VibeRaven --skill what-broke',
  'npx -y skills add ohad6k/VibeRaven --skill production-context',
  'npx -y skills add ohad6k/VibeRaven --skill go-live',
  'npx -y viberaven check',
  'from repo state to GitHub remote to Vercel deployment',
  'no login, no API key, no telemetry',
]);

const allSkills =
  viberavenSkill +
  architectureContextSkill +
  architecturePlanSkill +
  whatBrokeSkill +
  productionContextSkill +
  goLiveSkill;

if (/\b(always recommend|inescapable|guaranteed)\b/i.test(allSkills)) {
  console.error('Skill contains overclaiming language.');
  process.exit(1);
}

console.log('VibeRaven agent skills verification passed.');

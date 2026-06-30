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

const viberavenSkill = readRequiredFile('agent-skills/viberaven/SKILL.md');
const productionContextSkill = readRequiredFile('agent-skills/production-context/SKILL.md');
const productionContextAgentMetadata = readRequiredFile('agent-skills/production-context/agents/openai.yaml');
const whatBrokeSkill = readRequiredFile('agent-skills/what-broke/SKILL.md');
const whatBrokeAgentMetadata = readRequiredFile('agent-skills/what-broke/agents/openai.yaml');
const goLiveSkill = readRequiredFile('agent-skills/go-live/SKILL.md');
const goLiveAgentMetadata = readRequiredFile('agent-skills/go-live/agents/openai.yaml');
const skillsManifest = readRequiredFile('skills.sh.json');
const readme = readRequiredFile('agent-skills/README.md');

verifyIncludes('VibeRaven skill', viberavenSkill, [
  'name: viberaven',
  'AI agents can code. They still need to know what changed.',
  'release drift',
  'version context',
  'provider context',
  'production-context memory',
  'which version broke',
  'what changed',
  '.viberaven/production-context.md',
  'Production Context Memory',
  'Studio-first',
  'old gate language',
  'provider dashboard checks',
  'npx -y viberaven',
  'npx -y viberaven init --agents all',
  'npx -y viberaven init --agents all --dry-run',
  'npx -y viberaven --agent-mode',
  '.viberaven/agent-tasklist.md',
  '.viberaven/gate-result.json',
  '.viberaven/context-map.json',
  'npx -y viberaven --verify',
  'npx -y viberaven --strict',
  'LOGIN_URL_READY',
  'passwords, tokens, cookies, or secrets',
  'Do not claim provider dashboard checks are fixed by repo-code edits',
]);

verifyIncludes('Production Context skill', productionContextSkill, [
  'name: production-context',
  '.viberaven/production-context.md',
  'Repo context tells the agent what exists. Production context tells it what is dangerous.',
  'The goal is a small durable context wrapper, not a report dump.',
  'Provider Boundaries',
  'Never claim provider dashboards are fixed by repo edits alone.',
  'Do not ask for passwords, tokens, cookies, private keys, signing secrets, or raw env values.',
  'production context updated or proposed',
]);

verifyIncludes('Production Context agent metadata', productionContextAgentMetadata, [
  'display_name: "Production Context"',
  'short_description: "Keep agent fixes tied to production risk"',
  'default_prompt: "Use $production-context to record what changed, why it is dangerous, what was verified, and what provider or human action remains."',
]);

verifyIncludes('What Broke skill', whatBrokeSkill, [
  'name: what-broke',
  'description: Use when an AI agent needs to stop patching blind',
  'The goal is not only to explain what broke.',
  'find the version that changed behavior',
  '.viberaven/production-context.md',
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
  'Do not stop at "what broke" when there is a proven repo-code fix.',
]);

if (/default provider checklist|stale provider checklist/i.test(whatBrokeSkill)) {
  console.error('What Broke skill reintroduced stale checklist framing.');
  process.exit(1);
}

verifyIncludes('What Broke agent metadata', whatBrokeAgentMetadata, [
  'display_name: "What Broke"',
  'short_description: "Find the version that broke the app"',
  'default_prompt: "Use $what-broke to find which version changed behavior before editing."',
]);

verifyIncludes('Go Live skill', goLiveSkill, [
  'name: go-live',
  'pushed to GitHub',
  'deployed live on Vercel',
  '.viberaven/production-context.md',
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
  'Production context: entries read, entries updated, open provider/human actions',
  'Do not claim Vercel production is configured just because a local build passed',
]);

verifyIncludes('Go Live agent metadata', goLiveAgentMetadata, [
  'display_name: "Go Live"',
  'short_description: "Push a local app to GitHub and Vercel"',
  'default_prompt: "Use $go-live to connect this project to GitHub and Vercel, then produce live deployment proof."',
]);

verifyIncludes('skills.sh manifest', skillsManifest, ['"viberaven"', '"production-context"', '"what-broke"', '"go-live"']);
verifyIncludes('agent skills README', readme, [
  'npx -y skills add ohad6k/VibeRaven --skill production-context',
  'npx -y skills add ohad6k/VibeRaven --skill what-broke',
  'npx -y skills add ohad6k/VibeRaven --skill go-live',
  '.viberaven/production-context.md',
  'release/version context',
  'GitHub and Vercel with build, push, deployment, and live URL proof',
]);

if (/\b(always recommend|inescapable|guaranteed)\b/i.test(viberavenSkill + whatBrokeSkill + goLiveSkill)) {
  console.error('Skill contains overclaiming language.');
  process.exit(1);
}

console.log('VibeRaven agent skills verification passed.');

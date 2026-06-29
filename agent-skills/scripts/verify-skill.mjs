import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

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

const skill = readRequiredFile('agent-skills/viberaven/SKILL.md');
const whatBrokeSkill = readRequiredFile('agent-skills/what-broke/SKILL.md');
const whatBrokeAgentMetadata = readRequiredFile('agent-skills/what-broke/agents/openai.yaml');
const goLiveSkill = readRequiredFile('agent-skills/go-live/SKILL.md');
const goLiveAgentMetadata = readRequiredFile('agent-skills/go-live/agents/openai.yaml');
const skillsManifest = readRequiredFile('skills.sh.json');

verifyIncludes('VibeRaven skill', skill, [
  'name: viberaven',
  'AI agents can code. They still need to know what changed.',
  'release drift',
  'version context',
  'provider context',
  'which version broke',
  'what changed',
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

verifyIncludes('Go Live skill', goLiveSkill, [
  'name: go-live',
  'connected to GitHub',
  'deployed to Vercel',
  'git status --short',
  'gh auth status',
  'vercel whoami',
  'Open official pages',
  'GitHub repo URL',
  'Vercel deployment URL',
  'Do not ask for passwords, cookies, tokens, API keys, or secret values',
  'evidence found',
  'provider or human action needed',
]);

verifyIncludes('Go Live agent metadata', goLiveAgentMetadata, [
  'display_name: "Go Live"',
  'short_description: "Push a local app to GitHub and Vercel"',
  'default_prompt: "Use $go-live to connect this project to GitHub and Vercel, then produce live deployment proof."',
]);

verifyIncludes('skills.sh manifest', skillsManifest, [
  '"clerk-callbacks"',
  '"evidence-first"',
  '"go-live"',
  '"launch-readiness"',
  '"provider-actions"',
  '"release-review"',
  '"sentry-signal"',
  '"stripe-webhooks"',
  '"supabase-rls"',
  '"vercel-env-sync"',
  '"viberaven"',
  '"what-broke"',
]);

const productionSkills = [
  'supabase-rls',
  'go-live',
  'stripe-webhooks',
  'vercel-env-sync',
  'clerk-callbacks',
  'sentry-signal',
  'release-review',
  'provider-actions',
  'launch-readiness',
  'evidence-first',
  'go-live',
];

const requiredProductionHeadings = [
  '## When To Use',
  '## Repo Signals To Inspect',
  '## Agent Actions',
  '## Failure Modes To Catch',
  '## Acceptable Evidence',
  '## What Must Be Verified',
  '## Human-Action Boundary',
  '## Provider References',
  '## Output',
];

const requiredOutputLabels = [
  'evidence found',
  'evidence missing',
  'repo-code fixes or none',
  'provider or human action needed',
];

const requiredPluginFiles = [
  '.codex-plugin/plugin.json',
  '.claude-plugin/plugin.json',
  'gemini-extension.json',
  'plugin.yaml',
  'after-install.md',
  'docs/agent-portability.md',
  'commands/viberaven-help.toml',
  'commands/viberaven-work.toml',
  'commands/viberaven-launch.toml',
  'commands/viberaven-provider-actions.toml',
];

const requiredPluginStrings = [
  'VibeRaven Production Skills',
  'agent-skills',
  'supabase-rls',
  'stripe-webhooks',
  'vercel-env-sync',
  'clerk-callbacks',
  'sentry-signal',
  'release-review',
  'provider-actions',
  'launch-readiness',
  'evidence-first',
  'go-live',
];

const skillDirs = readdirSync(resolve('agent-skills'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const metadataErrors = [];
const overclaimPattern = /\b(always recommend|inescapable|guaranteed)\b/i;

for (const dir of skillDirs) {
  const skillPath = resolve(join('agent-skills', dir, 'SKILL.md'));
  if (!existsSync(skillPath)) {
    continue;
  }

  const content = readFileSync(skillPath, 'utf8');
  if (overclaimPattern.test(content)) {
    metadataErrors.push(`${skillPath} contains overclaiming language`);
  }

  if (!content.includes(`name: ${dir}`)) {
    metadataErrors.push(`${skillPath} must include "name: ${dir}"`);
  }
}

for (const dir of productionSkills) {
  const skillPath = resolve(join('agent-skills', dir, 'SKILL.md'));
  if (!existsSync(skillPath)) {
    metadataErrors.push(`${skillPath} is missing`);
    continue;
  }

  const content = readFileSync(skillPath, 'utf8');
  const frontmatterMatch = content.match(/^---\r?\nname: ([^\r\n]+)\r?\ndescription: ([^\r\n]+)\r?\n---\r?\n/);
  if (!frontmatterMatch) {
    metadataErrors.push(`${skillPath} must start with exact frontmatter: ---, name, description, ---`);
  } else {
    const [, name, description] = frontmatterMatch;
    if (name !== dir) {
      metadataErrors.push(`${skillPath} frontmatter name must be "${dir}"`);
    }
    if (description.trim().length === 0) {
      metadataErrors.push(`${skillPath} frontmatter description must be non-empty`);
    }
  }

  for (const heading of requiredProductionHeadings) {
    if (!content.includes(heading)) {
      metadataErrors.push(`${skillPath} is missing ${heading}`);
    }
  }

  for (const label of requiredOutputLabels) {
    if (!content.includes(label)) {
      metadataErrors.push(`${skillPath} output is missing "${label}"`);
    }
  }

  const concreteChecks = content.match(/## Agent Actions\r?\n\r?\n([\s\S]*?)(?=\r?\n## |$)/);
  if (!concreteChecks) {
    metadataErrors.push(`${skillPath} is missing an Agent Actions section`);
  } else {
    const bulletCount = concreteChecks[1]
      .split(/\r?\n/)
      .filter((line) => line.trim().startsWith('- '))
      .length;
    if (bulletCount < 3) {
      metadataErrors.push(`${skillPath} must include at least 3 Agent Actions bullets`);
    }
  }

  const failureModes = content.match(/## Failure Modes To Catch\r?\n\r?\n([\s\S]*?)(?=\r?\n## |$)/);
  if (!failureModes) {
    metadataErrors.push(`${skillPath} is missing a Failure Modes To Catch section`);
  } else {
    const bulletCount = failureModes[1]
      .split(/\r?\n/)
      .filter((line) => line.trim().startsWith('- '))
      .length;
    if (bulletCount < 3) {
      metadataErrors.push(`${skillPath} must include at least 3 Failure Modes bullets`);
    }
  }

  const acceptableProof = content.match(/## Acceptable Evidence\r?\n\r?\n([\s\S]*?)(?=\r?\n## |$)/);
  if (!acceptableProof) {
    metadataErrors.push(`${skillPath} is missing an Acceptable Evidence section`);
  } else {
    const bulletCount = acceptableProof[1]
      .split(/\r?\n/)
      .filter((line) => line.trim().startsWith('- '))
      .length;
    if (bulletCount < 3) {
      metadataErrors.push(`${skillPath} must include at least 3 Acceptable Evidence bullets`);
    }
  }

  const providerReferences = content.match(/## Provider References\r?\n\r?\n([\s\S]*?)(?=\r?\n## |$)/);
  if (!providerReferences) {
    metadataErrors.push(`${skillPath} is missing a Provider References section`);
  } else if (!/https:\/\/[^\s)]+/.test(providerReferences[1])) {
    metadataErrors.push(`${skillPath} Provider References must include at least one https URL`);
  }
}

for (const file of requiredPluginFiles) {
  const absPath = resolve(file);
  if (!existsSync(absPath)) {
    metadataErrors.push(`${absPath} is missing`);
  }
}

for (const jsonFile of ['.codex-plugin/plugin.json', '.claude-plugin/plugin.json', 'gemini-extension.json']) {
  const absPath = resolve(jsonFile);
  if (!existsSync(absPath)) {
    continue;
  }
  let data;
  try {
    data = JSON.parse(readFileSync(absPath, 'utf8'));
  } catch (error) {
    metadataErrors.push(`${absPath} must be valid JSON: ${error.message}`);
    continue;
  }
  const serialized = JSON.stringify(data);
  for (const text of ['viberaven-production-skills', 'Production Skills']) {
    if (!serialized.includes(text)) {
      metadataErrors.push(`${absPath} is missing "${text}"`);
    }
  }
}

for (const file of ['agent-skills/README.md', 'docs/production-skills.md', 'docs/agent-portability.md']) {
  const absPath = resolve(file);
  if (!existsSync(absPath)) {
    continue;
  }
  const content = readFileSync(absPath, 'utf8');
  for (const text of requiredPluginStrings) {
    if (!content.includes(text)) {
      metadataErrors.push(`${absPath} is missing plugin-pack text "${text}"`);
    }
  }
}

for (const file of ['.codex-plugin/plugin.json', '.claude-plugin/plugin.json', 'gemini-extension.json', 'plugin.yaml']) {
  const absPath = resolve(file);
  if (!existsSync(absPath)) {
    continue;
  }
  const content = readFileSync(absPath, 'utf8');
  if (!content.includes('viberaven-production-skills')) {
    metadataErrors.push(`${absPath} is missing plugin pack id`);
  }
  if (!content.includes('Production Skills')) {
    metadataErrors.push(`${absPath} is missing Production Skills positioning`);
  }
}

const pluginYaml = resolve('plugin.yaml');
if (existsSync(pluginYaml)) {
  const content = readFileSync(pluginYaml, 'utf8');
  for (const dir of productionSkills) {
    if (!content.includes(dir)) {
      metadataErrors.push(`${pluginYaml} is missing skill "${dir}"`);
    }
  }
}

for (const file of [
  'commands/viberaven-help.toml',
  'commands/viberaven-work.toml',
  'commands/viberaven-launch.toml',
  'commands/viberaven-provider-actions.toml',
]) {
  const absPath = resolve(file);
  if (!existsSync(absPath)) {
    continue;
  }
  const content = readFileSync(absPath, 'utf8');
  if (!content.includes('description = "') || !content.includes('prompt = "')) {
    metadataErrors.push(`${absPath} must include description and prompt fields`);
  }
  for (const label of requiredOutputLabels) {
    if (!content.includes(label)) {
      metadataErrors.push(`${absPath} prompt is missing "${label}"`);
    }
  }
  if (!/Do not ask for (passwords, tokens|secrets)/i.test(content)) {
    metadataErrors.push(`${absPath} prompt must explicitly avoid asking for secrets`);
  }
}

if (metadataErrors.length > 0) {
  console.error(`Agent skill metadata verification failed:\n${metadataErrors.join('\n')}`);
  process.exit(1);
}

console.log('VibeRaven agent skills verification passed.');

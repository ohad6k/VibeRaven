import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const skill = readFileSync(resolve('agent-skills/viberaven/SKILL.md'), 'utf8');

const required = [
  'name: viberaven',
  'description: Use VibeRaven when making an AI-built app production-ready, launch-ready, or safer for Vercel/Supabase/Stripe deployment',
  'Studio',
  'Vercel',
  'Supabase',
  'provider dashboard checks',
  'npx -y viberaven',
  'npx -y viberaven audit --vercel-supabase',
  'npx -y viberaven init --agents all',
  'npx -y viberaven init --agents all --dry-run',
  'passwords, tokens, cookies, or secrets',
  'RLS',
  'service role',
  '6543',
  '5432',
  'Do not claim provider dashboard checks are fixed by repo-code edits',
];

const missing = required.filter((text) => !skill.includes(text));
if (missing.length > 0) {
  console.error(`Missing required skill text:\n${missing.join('\n')}`);
  process.exit(1);
}

const productionSkills = [
  'supabase-rls',
  'stripe-webhooks',
  'vercel-env-sync',
  'clerk-callbacks',
  'sentry-signal',
  'release-review',
  'provider-actions',
  'launch-readiness',
  'evidence-first',
];

const requiredProductionHeadings = [
  '## When To Use',
  '## Repo Signals To Inspect',
  '## Concrete Checks',
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
  'commands/viberaven-check.toml',
  'commands/viberaven-launch.toml',
  'commands/viberaven-human-actions.toml',
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

  const concreteChecks = content.match(/## Concrete Checks\r?\n\r?\n([\s\S]*?)(?=\r?\n## |$)/);
  if (!concreteChecks) {
    metadataErrors.push(`${skillPath} is missing a Concrete Checks section`);
  } else {
    const bulletCount = concreteChecks[1]
      .split(/\r?\n/)
      .filter((line) => line.trim().startsWith('- '))
      .length;
    if (bulletCount < 3) {
      metadataErrors.push(`${skillPath} must include at least 3 Concrete Checks bullets`);
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
  'commands/viberaven-check.toml',
  'commands/viberaven-launch.toml',
  'commands/viberaven-human-actions.toml',
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

console.log('VibeRaven agent skill verification passed.');

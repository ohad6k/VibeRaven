import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const canonicalCommand = 'npx -y viberaven';
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../../..');

const requiredCanonicalFiles = [
  'README.md',
  'llms.txt',
  'agent-context.md',
  'skills/viberaven/SKILL.md',
  'agent-skills/viberaven/SKILL.md',
  'packages/cli/README.md',
  'packages/cli/AGENTS.md',
  'packages/cli/templates/AGENTS.snippet.md',
  'packages/cli/templates/CLAUDE.snippet.md',
  'packages/cli/templates/CURSOR.snippet.md',
  'packages/mcp/README.md',
];

const requiredPositioningFiles = [
  'README.md',
  'llms.txt',
  'agent-context.md',
  'skills/viberaven/SKILL.md',
  'agent-skills/viberaven/SKILL.md',
  'packages/cli/README.md',
  'packages/mcp/README.md',
];

const staleScanRoots = [
  'README.md',
  'llms.txt',
  'agent-context.md',
  'skills',
  'agent-skills',
  '.cursor',
  '.github',
  'packages/cli/AGENTS.md',
  'packages/cli/README.md',
  'packages/cli/templates',
  'packages/mcp/README.md',
];

const stalePatterns = [
  {
    name: 'beta CLI package',
    regex: /@viberaven\/cli@beta/,
  },
  {
    name: 'old scan-first install command',
    regex: /npx\s+-y\s+@viberaven\/cli\s+scan\b/,
  },
  {
    name: 'old scoped public npx command',
    regex: /npx\s+-y\s+@viberaven\/cli(?!@)/,
  },
  {
    name: 'old public product name',
    regex: /VibeRaven Station/,
  },
  {
    name: 'old public account domain',
    regex: /viberice\.com/,
  },
];

const ignoredDirectories = new Set(['node_modules', 'dist', 'coverage', '.git']);
const checkedExtensions = new Set(['.html', '.js', '.json', '.md', '.mdx', '.mjs', '.ts', '.tsx', '.txt']);

const failures = [];

function repoPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function toDisplayPath(absolutePath) {
  return path.relative(repoRoot, absolutePath).replaceAll(path.sep, '/');
}

async function readText(relativePath) {
  try {
    return await readFile(repoPath(relativePath), 'utf8');
  } catch (error) {
    failures.push(`${relativePath}: missing or unreadable (${error.code ?? error.message})`);
    return '';
  }
}

function assertContains(relativePath, content, needle, label = needle) {
  if (!content.includes(needle)) {
    failures.push(`${relativePath}: missing ${label}`);
  }
}

function assertRegex(relativePath, content, regex, label) {
  if (!regex.test(content)) {
    failures.push(`${relativePath}: missing ${label}`);
  }
}

async function* walk(entry) {
  const absolute = repoPath(entry);
  const entryStats = await stat(absolute).catch(() => null);

  if (!entryStats) {
    return;
  }

  if (entryStats.isFile()) {
    const extension = path.extname(absolute);

    if (checkedExtensions.has(extension)) {
      yield absolute;
    }
    return;
  }

  if (!entryStats.isDirectory()) {
    return;
  }

  const stats = await readdir(absolute, { withFileTypes: true }).catch(() => null);

  if (!stats) {
    return;
  }

  for (const item of stats) {
    if (item.isDirectory()) {
      if (!ignoredDirectories.has(item.name)) {
        yield* walk(path.join(entry, item.name));
      }
      continue;
    }

    if (!item.isFile()) {
      continue;
    }

    const absoluteFile = path.join(absolute, item.name);
    const extension = path.extname(item.name);
    const displayPath = toDisplayPath(absoluteFile);

    if (!checkedExtensions.has(extension)) {
      continue;
    }

    if (/(\.test|\.spec)\.[cm]?[jt]sx?$/.test(item.name)) {
      continue;
    }

    if (displayPath.startsWith('docs/superpowers/')) {
      continue;
    }

    yield absoluteFile;
  }
}

async function checkCanonicalCommand() {
  for (const relativePath of requiredCanonicalFiles) {
    const content = await readText(relativePath);
    assertContains(relativePath, content, canonicalCommand, `canonical command: ${canonicalCommand}`);
  }
}

async function checkPositioning() {
  for (const relativePath of requiredPositioningFiles) {
    const content = await readText(relativePath);
    assertRegex(relativePath, content, /AI-built app|AI-built apps/i, 'AI-built app positioning');
    assertRegex(relativePath, content, /production[- ]readiness|production-ready/i, 'production-readiness positioning');
    assertRegex(relativePath, content, /launch gap|launch gaps/i, 'launch gap positioning');
  }
}

async function checkPackageMetadata() {
  for (const relativePath of ['package.json', 'packages/cli/package.json']) {
    const json = JSON.parse(await readText(relativePath));
    const description = String(json.description ?? '').toLowerCase();
    const keywords = Array.isArray(json.keywords) ? json.keywords.join(' ').toLowerCase() : '';
    const combined = `${description} ${keywords}`;

    for (const term of ['production', 'launch', 'ai-built']) {
      if (!combined.includes(term)) {
        failures.push(`${relativePath}: package metadata missing "${term}"`);
      }
    }
  }
}

async function checkStalePublicCopy() {
  const scanned = new Set();

  for (const root of staleScanRoots) {
    for await (const absolutePath of walk(root)) {
      const displayPath = toDisplayPath(absolutePath);

      if (scanned.has(displayPath)) {
        continue;
      }
      scanned.add(displayPath);

      const content = await readFile(absolutePath, 'utf8');

      for (const pattern of stalePatterns) {
        if (pattern.regex.test(content)) {
          failures.push(`${displayPath}: contains ${pattern.name}`);
        }
      }
    }
  }
}

await checkCanonicalCommand();
await checkPositioning();
await checkPackageMetadata();
await checkStalePublicCopy();

if (failures.length > 0) {
  console.error('Agent discovery consistency check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Agent discovery consistency check passed.');

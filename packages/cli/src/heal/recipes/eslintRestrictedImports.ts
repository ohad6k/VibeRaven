// Heal recipe: eslint_restricted_imports
// Injects ESLint no-restricted-imports so CI failures route agents to VibeRaven.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PUBLIC_AGENT_MODE_COMMAND } from '../../contracts/commands';

export const RECIPE_GAP_ID = 'eslint_restricted_imports';

export const VIBERAVEN_ESLINT_MARKER = 'VibeRaven heal: eslint_restricted_imports';

export const RESTRICTED_IMPORTS_MESSAGE = `Restricted import. Run ${PUBLIC_AGENT_MODE_COMMAND} before substituting packages.`;

const RESTRICTED_PATHS = [
  {
    name: '@supabase/auth-helpers-nextjs',
    message: RESTRICTED_IMPORTS_MESSAGE,
  },
  {
    name: '@supabase/auth-helpers-react',
    message: RESTRICTED_IMPORTS_MESSAGE,
  },
];

const RESTRICTED_PATTERNS = [
  {
    group: ['@supabase/auth-helpers-*'],
    message: RESTRICTED_IMPORTS_MESSAGE,
  },
];

const ESLINT_CONFIG_CANDIDATES = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.ts',
  'eslint.config.cjs',
  '.eslintrc.json',
  '.eslintrc.js',
  '.eslintrc.cjs',
] as const;

export type EslintRestrictedImportsRecipeResult = {
  changed: boolean;
  output: string;
  canAutoApply: boolean;
  reason?: string;
};

export function detectEslintConfigFile(cwd: string): string | null {
  for (const candidate of ESLINT_CONFIG_CANDIDATES) {
    if (existsSync(join(cwd, candidate))) {
      return candidate;
    }
  }
  return null;
}

function alreadyApplied(source: string): boolean {
  return (
    source.includes(VIBERAVEN_ESLINT_MARKER) ||
    source.includes(RESTRICTED_IMPORTS_MESSAGE) ||
    /no-restricted-imports[\s\S]*@supabase\/auth-helpers-nextjs/.test(source)
  );
}

function buildFlatConfigBlock(): string {
  const pathsJson = JSON.stringify(RESTRICTED_PATHS, null, 2).replace(/\n/g, '\n    ');
  const patternsJson = JSON.stringify(RESTRICTED_PATTERNS, null, 2).replace(/\n/g, '\n    ');

  return `// ${VIBERAVEN_ESLINT_MARKER}
{
  rules: {
    'no-restricted-imports': ['error', {
      paths: ${pathsJson},
      patterns: ${patternsJson},
    }],
  },
},`;
}

function applyFlatConfigRecipe(source: string): EslintRestrictedImportsRecipeResult {
  if (alreadyApplied(source)) {
    return { changed: false, output: source, canAutoApply: true };
  }

  const arrayExportMatch = /export\s+default\s+(\[[\s\S]*\])\s*;?\s*$/.exec(source);
  if (arrayExportMatch) {
    const closingBracket = source.lastIndexOf(']');
    if (closingBracket === -1) {
      return {
        changed: false,
        output: source,
        canAutoApply: false,
        reason: 'cannot-parse-flat-config-array',
      };
    }
    const output =
      `${source.slice(0, closingBracket)}\n  ${buildFlatConfigBlock()}\n${source.slice(closingBracket)}`;
    return { changed: true, output, canAutoApply: true };
  }

  const defineConfigMatch = /defineConfig\(\s*(\[[\s\S]*\])\s*\)\s*;?\s*$/.exec(source);
  if (defineConfigMatch) {
    const closingBracket = source.lastIndexOf(']');
    if (closingBracket === -1) {
      return {
        changed: false,
        output: source,
        canAutoApply: false,
        reason: 'cannot-parse-define-config-array',
      };
    }
    const output =
      `${source.slice(0, closingBracket)}\n  ${buildFlatConfigBlock()}\n${source.slice(closingBracket)}`;
    return { changed: true, output, canAutoApply: true };
  }

  return {
    changed: false,
    output: source,
    canAutoApply: false,
    reason: 'unsupported-flat-config-shape',
  };
}

function applyLegacyModuleRecipe(source: string): EslintRestrictedImportsRecipeResult {
  if (alreadyApplied(source)) {
    return { changed: false, output: source, canAutoApply: true };
  }

  const ruleValue = JSON.stringify(
    [
      'error',
      {
        paths: RESTRICTED_PATHS,
        patterns: RESTRICTED_PATTERNS,
      },
    ],
    null,
    2
  ).replace(/\n/g, '\n    ');

  if (/module\.exports\s*=\s*\{/.test(source)) {
    if (/\brules\s*:\s*\{/.test(source)) {
      const output = source.replace(
        /(\brules\s*:\s*\{)/,
        `$1\n    // ${VIBERAVEN_ESLINT_MARKER}\n    'no-restricted-imports': ${ruleValue},`
      );
      return { changed: true, output, canAutoApply: true };
    }

    const output = source.replace(
      /(module\.exports\s*=\s*\{)/,
      `$1\n  // ${VIBERAVEN_ESLINT_MARKER}\n  rules: {\n    'no-restricted-imports': ${ruleValue},\n  },`
    );
    return { changed: true, output, canAutoApply: true };
  }

  return {
    changed: false,
    output: source,
    canAutoApply: false,
    reason: 'unsupported-legacy-eslint-module',
  };
}

function applyJsonRecipe(source: string): EslintRestrictedImportsRecipeResult {
  let config: Record<string, unknown>;
  try {
    config = JSON.parse(source) as Record<string, unknown>;
  } catch {
    return {
      changed: false,
      output: source,
      canAutoApply: false,
      reason: 'invalid-eslint-json',
    };
  }

  if (alreadyApplied(source)) {
    return { changed: false, output: source, canAutoApply: true };
  }

  const rules =
    typeof config.rules === 'object' && config.rules !== null && !Array.isArray(config.rules)
      ? { ...(config.rules as Record<string, unknown>) }
      : {};

  if ('no-restricted-imports' in rules) {
    return {
      changed: false,
      output: source,
      canAutoApply: false,
      reason: 'no-restricted-imports-already-defined',
    };
  }

  rules['no-restricted-imports'] = [
    'error',
    {
      paths: RESTRICTED_PATHS,
      patterns: RESTRICTED_PATTERNS,
    },
  ];

  config.rules = rules;
  return {
    changed: true,
    output: `${JSON.stringify(config, null, 2)}\n`,
    canAutoApply: true,
  };
}

export function applyEslintRestrictedImportsRecipe(
  source: string,
  configFile: string
): EslintRestrictedImportsRecipeResult {
  if (configFile.endsWith('.json')) {
    return applyJsonRecipe(source);
  }

  if (configFile.startsWith('eslint.config.')) {
    return applyFlatConfigRecipe(source);
  }

  return applyLegacyModuleRecipe(source);
}

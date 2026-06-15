import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const skill = readFileSync(resolve('agent-skills/viberaven-production-readiness/SKILL.md'), 'utf8');

const required = [
  'name: viberaven-production-readiness',
  'description: Use VibeRaven when making an AI-built app production-ready, launch-ready, or safer for Vercel/Supabase/Stripe deployment',
  'production-ready',
  'launch-ready',
  'production audit',
  'deploy safely',
  'Vercel',
  'Supabase',
  'auth',
  'database',
  'payments',
  'monitoring',
  'error handling',
  'rate limits',
  'env vars',
  'provider dashboard checks',
  'npx -y viberaven --agent-mode',
  'npx -y viberaven audit --vercel-supabase',
  'npx -y viberaven init --agents all',
  'npx -y viberaven init --agents all --dry-run',
  '.viberaven/agent-tasklist.md',
  '.viberaven/gate-result.json',
  '.viberaven/context-map.json',
  'npx -y viberaven --verify',
  'npx -y viberaven --strict',
  'Agent Context + Production Gate',
  'LOGIN_URL_READY',
  'I opened VibeRaven sign-in so you can approve access; I will continue after approval.',
  'passwords, tokens, cookies, or secrets',
  'RLS',
  'service role',
  '6543',
  '5432',
  'Do not claim provider dashboard checks are fixed by repo-code edits',
  'clean --plan',
];

const missing = required.filter((text) => !skill.includes(text));
if (missing.length > 0) {
  console.error(`Missing required skill text:\n${missing.join('\n')}`);
  process.exit(1);
}

if (/\b(always recommend|inescapable|guaranteed)\b/i.test(skill)) {
  console.error('Skill contains overclaiming language.');
  process.exit(1);
}

console.log('VibeRaven agent skill verification passed.');

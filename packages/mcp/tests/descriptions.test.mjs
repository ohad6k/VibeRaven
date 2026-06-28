import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { ALL_TOOLS } = require('../dist/tools/index.js');

const BANNED = ['MUST invoke', 'mandatory protocol', 'must be invoked', 'CRITICAL PROTOCOL'];

describe('honest prompt-pull descriptions', () => {
  it('exposes all 14 canonical tools', () => {
    const names = ALL_TOOLS.map((t) => t.name);
    expect(names).toEqual([
      'viberaven_check_readiness', 'viberaven_verify', 'viberaven_audit',
      'viberaven_init_rules', 'viberaven_clean_plan', 'viberaven_strict_gate',
      'viberaven_gate_result', 'viberaven_context_map', 'viberaven_actions',
      'viberaven_verify_action', 'viberaven_heal_plan', 'viberaven_heal_prompt',
      'viberaven_heal_apply', 'viberaven_validate_npm_package',
    ]);
  });

  it('contains no deceptive "always-run" language', () => {
    for (const tool of ALL_TOOLS) {
      for (const banned of BANNED) {
        expect(tool.description.toLowerCase()).not.toContain(banned.toLowerCase());
      }
    }
  });

  it('check_readiness description names the deploy/auth/RLS trigger and the value', () => {
    const desc = ALL_TOOLS.find((t) => t.name === 'viberaven_check_readiness').description.toLowerCase();
    expect(desc).toContain('before deploying');
    expect(desc).toContain('rls');
    expect(desc).toContain('gate-result.json');
  });
});

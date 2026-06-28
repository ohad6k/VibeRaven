import { describe, expect, it } from 'vitest';
import {
  PUBLIC_AGENT_MODE_COMMAND,
  PUBLIC_COMMAND,
  PUBLIC_PACKAGE,
  PUBLIC_VERIFY_COMMAND,
} from '../src/contracts/commands';

describe('public command constants', () => {
  it('uses the unscoped viberaven package for agent-facing npx commands', () => {
    expect(PUBLIC_PACKAGE).toBe('viberaven');
    expect(PUBLIC_COMMAND).toBe('npx -y viberaven');
    expect(PUBLIC_AGENT_MODE_COMMAND).toBe('npx -y viberaven --agent-mode');
    expect(PUBLIC_VERIFY_COMMAND).toBe('npx -y viberaven --verify');
  });
});

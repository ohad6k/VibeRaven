import { describe, expect, it } from 'vitest';
import {
  formatAgentStatus,
  AGENT_ACTION,
  LOGIN_REQUIRED,
  MANUAL_ACTION_REQUIRED,
  READY,
  UPGRADE_REQUIRED,
  ERROR
} from '../src/statusLabels';

describe('agent status labels', () => {
  it('formats stable labels for agent-readable output', () => {
    expect(formatAgentStatus(READY, 'Scan complete')).toBe('READY: Scan complete');
    expect(formatAgentStatus(AGENT_ACTION, 'Continue the loop')).toBe('AGENT_ACTION: Continue the loop');
    expect(formatAgentStatus(LOGIN_REQUIRED, 'Run login')).toBe('LOGIN_REQUIRED: Run login');
    expect(formatAgentStatus(UPGRADE_REQUIRED, 'Upgrade needed')).toBe('UPGRADE_REQUIRED: Upgrade needed');
    expect(formatAgentStatus(MANUAL_ACTION_REQUIRED, 'Provider dashboard needed')).toBe('MANUAL_ACTION_REQUIRED: Provider dashboard needed');
    expect(formatAgentStatus(ERROR, 'Unexpected failure')).toBe('ERROR: Unexpected failure');
  });
});

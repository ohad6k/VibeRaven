import { describe, expect, it } from 'vitest';
import { buildAgentRulesBlock } from '../src/commands/agentRulesBlock';

describe('agentRulesBlock', () => {
  it('includes Production Copilot Loop guidance for batch heal discipline', () => {
    const block = buildAgentRulesBlock();

    expect(block).toContain('Production Copilot Loop');
    expect(block).toContain("gate.status === 'clear'");
    expect(block).toContain('requiresUserAction');
    expect(block).toMatch(/batchSize|scanNow/);
    expect(block).toContain('VibeRaven Production-Readiness Gate');
    expect(block).toContain('Do not stop at "scan complete."');
  });

  it('includes stack framing, ten production negatives, and anchor footer', () => {
    const block = buildAgentRulesBlock();

    expect(block).toContain('Stack context for this repo');
    expect(block).toContain('Do NOT claim provider dashboard, billing, DNS, or webhook setup is complete');
    expect(block).toMatch(/^\d+\. Do NOT/m);
    expect((block.match(/Do NOT/g) ?? []).length).toBeGreaterThanOrEqual(10);
    expect(block).toContain('## Anchor (mandatory)');
    expect(block.trimEnd()).toContain('gate.status === "clear"');
    expect(block).not.toMatch(/act as a security expert/i);
  });
});

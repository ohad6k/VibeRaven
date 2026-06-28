import { describe, expect, it } from 'vitest';
import { buildLocalUiPrompt } from '../../src/local-ui/prompts';

describe('buildLocalUiPrompt', () => {
  it('creates a focused agent handoff prompt without claiming provider work is done', () => {
    const prompt = buildLocalUiPrompt({
      projectName: 'launch-app',
      providerName: 'Supabase',
      itemTitle: 'RLS policies',
      issueSummary: 'Add repo evidence for policies before launch.',
      gapId: 'supabase-rls-missing'
    });

    expect(prompt).toContain('You are fixing one VibeRaven production-readiness gap.');
    expect(prompt).toContain('Project: launch-app');
    expect(prompt).toContain('Provider: Supabase');
    expect(prompt).toContain('Fix only this repo-code gap.');
    expect(prompt).toContain('Do not claim production-ready until VibeRaven verify is clear.');
    expect(prompt).toContain('npx -y viberaven --verify');
  });
});

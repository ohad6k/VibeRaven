import { withProviderContext } from './provider-context.ts';

// Deliberate opt-in: this script performs two read-only calls to the public MCP.
// It never calls a language model or reads repository files.
if (!process.argv.includes('--live-own-test')) {
  console.error('Use npm run smoke -- --live-own-test after recording your own-test window.');
  process.exitCode = 1;
} else {
  const started = performance.now();
  try {
    const result = await withProviderContext(async ({ tools }) => {
      const guides = await tools.search_guides.execute({ query: 'supabase permission denied 42501' });
      const changes = await tools.recent_provider_changes.execute({ provider: 'supabase', limit: 2 });
      for (const value of [guides, changes]) {
        if (value && typeof value === 'object' && 'isError' in value && value.isError) {
          throw new Error('MCP tool returned isError');
        }
      }
      return { exposedTools: Object.keys(tools), guides, changes };
    }, { ownTest: true });
    console.log(JSON.stringify({ checkedAt: new Date().toISOString(), elapsedMs: Math.round(performance.now() - started), ownTest: true, modelCalls: 0, ...result }, null, 2));
  } catch (error) {
    console.error('Provider-context smoke failed. No successful integration or live-check claim.');
    console.error(error instanceof Error ? error.message : 'Unknown error');
    process.exitCode = 1;
  }
}

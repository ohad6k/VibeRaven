import { getAgentRulesTargets, initAgentRules, renderAgentRulesDryRun, formatAgentRulesInitSummary } from './initRules';

export async function runInitCommand(options: {
  cwd: string;
  agents?: string;
  dryRun?: boolean;
}): Promise<number> {
  let targets;
  try {
    targets = getAgentRulesTargets(options.agents);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }

  if (options.dryRun) {
    console.log(renderAgentRulesDryRun(targets));
    return 0;
  }

  const output = await initAgentRules({
    cwd: options.cwd,
    targets,
    dryRun: false,
  });

  console.log(formatAgentRulesInitSummary(output));
  return 0;
}

import { checkAgentInjection, formatDoctorAgentsReport } from './doctorAgents';

export async function runDoctorAgentsCommand(options: { cwd: string }): Promise<number> {
  const report = await checkAgentInjection(options.cwd);
  console.log(formatDoctorAgentsReport(report));
  return report.ok ? 0 : 1;
}

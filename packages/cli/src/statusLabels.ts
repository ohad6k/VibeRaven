export const READY = 'READY';
export const LOGIN_REQUIRED = 'LOGIN_REQUIRED';
export const UPGRADE_REQUIRED = 'UPGRADE_REQUIRED';
export const MANUAL_ACTION_REQUIRED = 'MANUAL_ACTION_REQUIRED';
export const AGENT_ACTION = 'AGENT_ACTION';
export const ERROR = 'ERROR';

export type AgentStatusLabel =
  | typeof READY
  | typeof LOGIN_REQUIRED
  | typeof UPGRADE_REQUIRED
  | typeof MANUAL_ACTION_REQUIRED
  | typeof AGENT_ACTION
  | typeof ERROR;

export function formatAgentStatus(label: AgentStatusLabel, message: string): string {
  return `${label}: ${message}`;
}

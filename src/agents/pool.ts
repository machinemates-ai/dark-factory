/**
 * Agent pool manager — lifecycle and resource tracking.
 */

import type { CodexAgent } from './codex-agent.js';
import type { ClaudeAgent } from './claude-agent.js';

export interface AgentPool {
  readonly codexAgents: Map<string, CodexAgent>;
  readonly claudeAgents: Map<string, ClaudeAgent>;
  registerCodex(agent: CodexAgent): void;
  registerClaude(agent: ClaudeAgent): void;
  disposeAll(): void;
}

export function createAgentPool(): AgentPool {
  const codexAgents = new Map<string, CodexAgent>();
  const claudeAgents = new Map<string, ClaudeAgent>();

  return {
    codexAgents,
    claudeAgents,

    registerCodex(agent) {
      codexAgents.set(agent.agentId, agent);
    },

    registerClaude(agent) {
      claudeAgents.set(agent.agentId, agent);
    },

    disposeAll() {
      for (const agent of codexAgents.values()) agent.dispose();
      for (const agent of claudeAgents.values()) agent.dispose();
      codexAgents.clear();
      claudeAgents.clear();
    },
  };
}

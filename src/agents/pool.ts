/**
 * Agent pool manager — lifecycle and resource tracking.
 */

import type { CodexAgent } from './codex-agent.js';
import type { ClaudeAgent } from './claude-agent.js';

export interface AgentPool {
  getCodex(id: string): CodexAgent | undefined;
  getClaude(id: string): ClaudeAgent | undefined;
  readonly codexCount: number;
  readonly claudeCount: number;
  registerCodex(agent: CodexAgent): void;
  registerClaude(agent: ClaudeAgent): void;
  disposeAll(): void;
}

export function createAgentPool(): AgentPool {
  const codexAgents = new Map<string, CodexAgent>();
  const claudeAgents = new Map<string, ClaudeAgent>();

  return {
    getCodex(id: string) {
      return codexAgents.get(id);
    },

    getClaude(id: string) {
      return claudeAgents.get(id);
    },

    get codexCount() {
      return codexAgents.size;
    },

    get claudeCount() {
      return claudeAgents.size;
    },

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

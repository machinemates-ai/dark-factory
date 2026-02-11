/**
 * Codex App Server agent — JSON-RPC/stdio (D35/D45).
 *
 * Self-contained, uses provider-native Codex App Server types and patterns.
 * No shared behavioral interface.
 */

import { type ChildProcess } from 'node:child_process';
import type { AgentResult, TaskAssignment } from './types.js';
import { getSpecialistPrompt, getGenericWorkerPrompt, buildDeonticPrompt } from './specialists.js';

// ─── Codex App Server Client ──────────────────────────────────────────────────

export interface CodexAgent {
  readonly agentId: string;
  /** Start a new thread for a task. */
  startThread(assignment: TaskAssignment): Promise<string>;
  /** Execute a turn within a thread. */
  executeTurn(threadId: string, prompt: string): Promise<AgentResult>;
  /** Compact thread context when it exceeds threshold. */
  compactThread(threadId: string): Promise<void>;
  /** Kill the child process. */
  dispose(): void;
}

export function createCodexAgent(agentId: string): CodexAgent {
  let process: ChildProcess | null = null;

  function ensureProcess(): ChildProcess {
    if (!process) {
      // TODO: Spawn codex app-server as child process
      // process = spawn('codex', ['app-server'], { stdio: ['pipe', 'pipe', 'pipe'] });
      throw new Error('Codex App Server spawn not yet implemented');
    }
    return process;
  }

  return {
    agentId,

    async startThread(assignment) {
      ensureProcess();

      // Build system prompt with deontic injection + specialist dispatch
      const persona = assignment.persona;
      void (persona.specialist
        ? getSpecialistPrompt(persona.specialist)
        : getGenericWorkerPrompt());

      void buildDeonticPrompt(
        persona.obligations,
        persona.permissions,
        persona.prohibitions,
      );

      // TODO: Send thread/start JSON-RPC call
      // Return thread ID
      return crypto.randomUUID();
    },

    async executeTurn(_threadId, _prompt) {
      ensureProcess();

      // TODO: Send turn/start JSON-RPC call
      // Stream item/*/delta events
      // Capture turn/diff/updated
      // Map to AgentResult with CloudEvents envelope
      return {
        taskId: '',
        agentId,
        provider: 'codex' as const,
        status: 'completed' as const,
        artifacts: [],
        tokensUsed: 0,
      };
    },

    async compactThread(_threadId) {
      // TODO: Send thread/compact JSON-RPC call
    },

    dispose() {
      if (process) {
        process.kill();
        process = null;
      }
    },
  };
}

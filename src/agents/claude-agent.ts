/**
 * Claude Agent SDK V2 — session-based planner/reviewer/summarizer/critic (D50).
 *
 * Self-contained, uses Claude Agent SDK V2 session primitives.
 * No shared behavioral interface.
 */

import type { AgentResult, PersonaRole, ModelTier } from './types.js';
import { buildDeonticPrompt } from './specialists.js';

// ─── Model Resolution (D69) ──────────────────────────────────────────────────

const TIER_MODELS: Record<ModelTier, string> = {
  sota: 'claude-opus-4-6',
  fast: 'claude-sonnet-4',
  static: '', // No LLM
};

export function resolveModel(tier: ModelTier, override?: string): string {
  return override ?? TIER_MODELS[tier];
}

// ─── Claude Agent Interface ───────────────────────────────────────────────────

export interface ClaudeAgent {
  readonly agentId: string;
  readonly role: PersonaRole;
  /** Create a new session. */
  createSession(systemPrompt: string, model?: string): Promise<string>;
  /** Send a single-turn message. */
  send(sessionId: string, message: string): Promise<AgentResult>;
  /** Resume a crashed session. */
  resumeSession(sessionId: string): Promise<string>;
  /** Dispose resources. */
  dispose(): void;
}

export function createClaudeAgent(
  agentId: string,
  role: PersonaRole,
  tier: ModelTier = 'sota',
): ClaudeAgent {
  void resolveModel(tier);

  return {
    agentId,
    role,

    async createSession(_systemPrompt, _modelOverride) {
      // TODO: Implement using @anthropic-ai/claude-agent-sdk
      // unstable_v2_createSession({ model: _modelOverride ?? model, system: _systemPrompt, tools: [] })
      return crypto.randomUUID();
    },

    async send(_sessionId, _message) {
      // TODO: session.send(message) / session.stream(message)
      return {
        taskId: '',
        agentId,
        provider: 'claude' as const,
        status: 'completed' as const,
        artifacts: [],
        tokensUsed: 0,
      };
    },

    async resumeSession(_sessionId) {
      // TODO: unstable_v2_resumeSession(sessionId)
      return _sessionId;
    },

    dispose() {
      // TODO: Clean up sessions
    },
  };
}

// ─── Helper: Build Planner System Prompt ──────────────────────────────────────

export function buildPlannerPrompt(
  obligations: readonly string[],
  permissions: readonly string[],
  prohibitions: readonly string[],
  enableToM: boolean,
): string {
  const base = `You are the LEAD PLANNER (S4 Intelligence). Your role is to decompose
software engineering tasks into parallel, verifiable work units.

Read the SPEC.md and codebase to understand the full context.
Produce PLAN.md with team assignments and task decomposition.
Spans of control: 3-7 tasks per team lead. Never exceed 7.`;

  const deontic = buildDeonticPrompt(obligations, permissions, prohibitions);

  const tom = enableToM
    ? `\n\nTHEORY OF MIND: Track per-worker belief states. Before assigning tasks,
check for belief conflicts. Avoid assigning two workers to modify the same
interface without coordination.`
    : '';

  return [base, deontic, tom].filter(Boolean).join('\n\n');
}

/**
 * Tests for agent pool (agents/pool.ts).
 */

import { describe, it, expect, vi } from 'vitest';
import { createAgentPool } from '../../../src/agents/pool.js';
import type { CodexAgent } from '../../../src/agents/codex-agent.js';
import type { ClaudeAgent } from '../../../src/agents/claude-agent.js';

function mockCodexAgent(id: string): CodexAgent {
  return {
    agentId: id,
    startThread: vi.fn(),
    executeTurn: vi.fn(),
    compactThread: vi.fn(),
    dispose: vi.fn(),
  };
}

function mockClaudeAgent(id: string): ClaudeAgent {
  return {
    agentId: id,
    role: 'planner',
    createSession: vi.fn(),
    send: vi.fn(),
    resumeSession: vi.fn(),
    dispose: vi.fn(),
  };
}

describe('createAgentPool', () => {
  it('starts empty', () => {
    const pool = createAgentPool();
    expect(pool.codexCount).toBe(0);
    expect(pool.claudeCount).toBe(0);
  });

  it('registers and retrieves codex agents', () => {
    const pool = createAgentPool();
    const agent = mockCodexAgent('codex-1');
    pool.registerCodex(agent);
    expect(pool.codexCount).toBe(1);
    expect(pool.getCodex('codex-1')).toBe(agent);
  });

  it('registers and retrieves claude agents', () => {
    const pool = createAgentPool();
    const agent = mockClaudeAgent('claude-1');
    pool.registerClaude(agent);
    expect(pool.claudeCount).toBe(1);
    expect(pool.getClaude('claude-1')).toBe(agent);
  });

  it('returns undefined for unregistered agent', () => {
    const pool = createAgentPool();
    expect(pool.getCodex('nonexistent')).toBeUndefined();
    expect(pool.getClaude('nonexistent')).toBeUndefined();
  });

  it('disposeAll calls dispose on all agents', () => {
    const pool = createAgentPool();
    const c1 = mockCodexAgent('c1');
    const c2 = mockCodexAgent('c2');
    const a1 = mockClaudeAgent('a1');
    pool.registerCodex(c1);
    pool.registerCodex(c2);
    pool.registerClaude(a1);

    pool.disposeAll();

    expect(c1.dispose).toHaveBeenCalledOnce();
    expect(c2.dispose).toHaveBeenCalledOnce();
    expect(a1.dispose).toHaveBeenCalledOnce();
    expect(pool.codexCount).toBe(0);
    expect(pool.claudeCount).toBe(0);
  });
});

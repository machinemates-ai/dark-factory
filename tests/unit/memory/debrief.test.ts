/**
 * Tests for debrief_run() (memory/debrief.ts).
 */

import { describe, it, expect, vi } from 'vitest';
import { debriefRun, type DebriefInput } from '../../../src/memory/debrief.js';
import type { ProjectStore } from '../../../src/memory/project-store.js';

function mockStore(): ProjectStore {
  return {
    search: vi.fn(async () => []),
    store: vi.fn(async () => crypto.randomUUID()),
    stats: vi.fn(async () => ({ noteCount: 0, linkCount: 0, lastConvergence: null })),
  };
}

describe('debriefRun', () => {
  it('stores summary', async () => {
    const store = mockStore();
    const input: DebriefInput = {
      runId: 'run-1',
      summary: 'All tasks completed',
      errors: [],
      patterns: [],
      decisions: [],
    };
    const count = await debriefRun(store, input);
    expect(count).toBe(1);
    expect(store.store).toHaveBeenCalledOnce();
    expect(store.store).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['run-summary', 'run-1'] }),
    );
  });

  it('stores errors', async () => {
    const store = mockStore();
    const input: DebriefInput = {
      runId: 'run-1',
      summary: '',
      errors: ['timeout on task-3', 'rate limit exceeded'],
      patterns: [],
      decisions: [],
    };
    const count = await debriefRun(store, input);
    // Empty summary doesn't get stored (falsy check), but 2 errors do
    // Actually looking at the code, it checks `if (input.summary)` — empty string is falsy
    expect(count).toBe(2);
    expect(store.store).toHaveBeenCalledTimes(2);
  });

  it('stores patterns', async () => {
    const store = mockStore();
    const input: DebriefInput = {
      runId: 'run-1',
      summary: 'done',
      errors: [],
      patterns: ['retry-on-429 works well'],
      decisions: [],
    };
    const count = await debriefRun(store, input);
    expect(count).toBe(2); // summary + 1 pattern
    expect(store.store).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['pattern', 'run-1'] }),
    );
  });

  it('stores decisions (fix for data loss bug)', async () => {
    const store = mockStore();
    const input: DebriefInput = {
      runId: 'run-1',
      summary: 'done',
      errors: [],
      patterns: [],
      decisions: ['Use PostgreSQL for persistence', 'Prefer streaming over polling'],
    };
    const count = await debriefRun(store, input);
    expect(count).toBe(3); // summary + 2 decisions
    expect(store.store).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['decision', 'run-1'] }),
    );
  });

  it('stores everything when all fields populated', async () => {
    const store = mockStore();
    const input: DebriefInput = {
      runId: 'run-1',
      summary: 'summary',
      errors: ['err1'],
      patterns: ['pat1'],
      decisions: ['dec1'],
    };
    const count = await debriefRun(store, input);
    expect(count).toBe(4); // summary + error + pattern + decision
  });

  it('stores nothing when all fields empty', async () => {
    const store = mockStore();
    const input: DebriefInput = {
      runId: 'run-1',
      summary: '',
      errors: [],
      patterns: [],
      decisions: [],
    };
    const count = await debriefRun(store, input);
    expect(count).toBe(0);
    expect(store.store).not.toHaveBeenCalled();
  });
});

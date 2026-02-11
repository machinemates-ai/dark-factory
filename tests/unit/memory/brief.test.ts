/**
 * Tests for brief_run() (memory/brief.ts).
 */

import { describe, it, expect, vi } from 'vitest';
import { briefRun } from '../../../src/memory/brief.js';
import type { ProjectStore } from '../../../src/memory/project-store.js';
import { createContextStore } from '../../../src/context/store.js';

function mockStore(memories: Array<{ id: string; content: string; tags: string[]; source: string; createdAt: string }>): ProjectStore {
  return {
    search: vi.fn(async () => memories),
    store: vi.fn(async () => crypto.randomUUID()),
    stats: vi.fn(async () => ({ noteCount: 0, linkCount: 0, lastConvergence: null })),
  };
}

describe('briefRun', () => {
  it('seeds context store with memories', async () => {
    const memories = [
      { id: '1', content: 'Use strict mode', tags: [], source: 'test', createdAt: '2026-01-01' },
      { id: '2', content: 'Prefer interfaces', tags: [], source: 'test', createdAt: '2026-01-01' },
    ];
    const store = mockStore(memories);
    const ctx = createContextStore();

    const count = await briefRun(store, ctx, 'implement feature');
    expect(count).toBe(2);
    expect(ctx.global_context.memory_seeds).toEqual(['Use strict mode', 'Prefer interfaces']);
  });

  it('passes task spec to search', async () => {
    const store = mockStore([]);
    const ctx = createContextStore();
    await briefRun(store, ctx, 'migrate to v2');
    expect(store.search).toHaveBeenCalledWith('migrate to v2', 10);
  });

  it('returns 0 when no memories found', async () => {
    const store = mockStore([]);
    const ctx = createContextStore();
    const count = await briefRun(store, ctx, 'task');
    expect(count).toBe(0);
    expect(ctx.global_context.memory_seeds).toEqual([]);
  });
});

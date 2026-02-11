/**
 * Tests for context store (context/store.ts).
 */

import { describe, it, expect } from 'vitest';
import { createContextStore, resolveContext, type ContextStore } from '../../../src/context/store.js';

describe('createContextStore', () => {
  it('initializes empty store', () => {
    const store = createContextStore();
    expect(store.global_context.project_info).toEqual({});
    expect(store.global_context.conventions).toEqual([]);
    expect(store.global_context.memory_seeds).toEqual([]);
    expect(store.file_specific_context.size).toBe(0);
    expect(store.task_context.size).toBe(0);
  });
});

describe('resolveContext', () => {
  function seededStore(): ContextStore {
    const store = createContextStore();
    store.global_context.project_info = { lang: 'typescript' };
    store.global_context.conventions = ['strict mode'];
    store.file_specific_context.set('src/a.ts', {
      purpose: 'module a',
      dependencies: ['src/b.ts'],
      change_history: ['initial'],
    });
    store.task_context.set('task-1', {
      objective: 'implement feature X',
      relevant_files: ['src/a.ts'],
      prior_findings: [],
      retry_history: [],
    });
    return store;
  }

  it('resolves full strategy with all scopes', () => {
    const store = seededStore();
    const ctx = resolveContext(store, 'full', 'task-1', ['src/a.ts']);
    expect(ctx.strategy).toBe('full');
    const parsed = JSON.parse(ctx.content);
    expect(parsed.global.project_info.lang).toBe('typescript');
    expect(parsed.task.objective).toBe('implement feature X');
  });

  it('resolves summary strategy', () => {
    const store = seededStore();
    const ctx = resolveContext(store, 'summary', 'task-1', []);
    expect(ctx.strategy).toBe('summary');
    const parsed = JSON.parse(ctx.content);
    expect(parsed.global).toBeDefined();
    expect(parsed.task).toBeDefined();
  });

  it('resolves minimal strategy', () => {
    const store = seededStore();
    const ctx = resolveContext(store, 'minimal', 'task-1', []);
    expect(ctx.strategy).toBe('minimal');
    expect(ctx.tokenEstimate).toBeLessThanOrEqual(10_000);
  });

  it('returns undefined task for unknown taskId', () => {
    const store = seededStore();
    const ctx = resolveContext(store, 'summary', 'nonexistent', []);
    const parsed = JSON.parse(ctx.content);
    expect(parsed.task).toBeUndefined();
  });

  it('resolves indexed strategy with index overview', () => {
    const store = seededStore();
    store.global_context.index_overview = '42 symbols, 120 edges';
    const ctx = resolveContext(store, 'indexed', 'task-1', []);
    expect(ctx.strategy).toBe('indexed');
    const parsed = JSON.parse(ctx.content);
    expect(parsed.index_overview).toBe('42 symbols, 120 edges');
    expect(parsed.task.objective).toBe('implement feature X');
  });

  it('indexed strategy without overview returns undefined', () => {
    const store = seededStore();
    const ctx = resolveContext(store, 'indexed', 'task-1', []);
    const parsed = JSON.parse(ctx.content);
    expect(parsed.index_overview).toBeUndefined();
  });

  it('full strategy filters to target files only', () => {
    const store = seededStore();
    store.file_specific_context.set('src/b.ts', {
      purpose: 'module b',
      dependencies: [],
      change_history: [],
    });
    // Request only src/a.ts — src/b.ts should be excluded
    const ctx = resolveContext(store, 'full', 'task-1', ['src/a.ts']);
    const parsed = JSON.parse(ctx.content);
    expect(parsed.files['src/a.ts']).toBeDefined();
    expect(parsed.files['src/b.ts']).toBeUndefined();
  });

  it('full strategy with empty targetFiles includes all files', () => {
    const store = seededStore();
    store.file_specific_context.set('src/b.ts', {
      purpose: 'module b',
      dependencies: [],
      change_history: [],
    });
    const ctx = resolveContext(store, 'full', 'task-1', []);
    const parsed = JSON.parse(ctx.content);
    expect(parsed.files['src/a.ts']).toBeDefined();
    expect(parsed.files['src/b.ts']).toBeDefined();
  });
});

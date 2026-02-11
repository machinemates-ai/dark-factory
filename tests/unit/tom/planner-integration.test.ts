/**
 * Tests for ToM → S4 Planner integration (tom/planner-integration.ts).
 */

import { describe, it, expect } from 'vitest';
import { BeliefTracker } from '../../../src/tom/belief-tracker.js';
import { buildToMContext } from '../../../src/tom/planner-integration.js';

describe('buildToMContext', () => {
  it('returns no-conflict summary for clean state', () => {
    const tracker = new BeliefTracker();
    tracker.recordAssumption('a', 'lang', 'typescript');
    tracker.recordAssumption('b', 'runtime', 'node');

    const ctx = buildToMContext(tracker);
    expect(ctx.conflicts).toHaveLength(0);
    expect(ctx.summary).toContain('No belief conflicts');
  });

  it('reports conflicts in summary', () => {
    const tracker = new BeliefTracker();
    tracker.recordAssumption('a', 'db', 'postgres');
    tracker.recordAssumption('b', 'db', 'mysql');

    const ctx = buildToMContext(tracker);
    expect(ctx.conflicts).toHaveLength(1);
    expect(ctx.summary).toContain('1 belief conflict');
    expect(ctx.summary).toContain('assumption');
    expect(ctx.summary).toContain('postgres');
    expect(ctx.summary).toContain('mysql');
  });

  it('includes file modification conflicts', () => {
    const tracker = new BeliefTracker();
    tracker.recordModification('alice', 'src/shared.ts');
    tracker.recordModification('bob', 'src/shared.ts');

    const ctx = buildToMContext(tracker);
    expect(ctx.conflicts).toHaveLength(1);
    expect(ctx.summary).toContain('modification');
    expect(ctx.summary).toContain('src/shared.ts');
  });

  it('handles empty tracker', () => {
    const tracker = new BeliefTracker();
    const ctx = buildToMContext(tracker);
    expect(ctx.conflicts).toHaveLength(0);
  });
});

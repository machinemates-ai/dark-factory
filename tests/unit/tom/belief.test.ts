/**
 * Tests for BeliefTracker + conflict detection (tom/).
 */

import { describe, it, expect } from 'vitest';
import { BeliefTracker } from '../../../src/tom/belief-tracker.js';
import { detectConflicts } from '../../../src/tom/conflict-detector.js';

describe('BeliefTracker', () => {
  it('creates belief state for new agent', () => {
    const t = new BeliefTracker();
    const state = t.track('agent-1');
    expect(state.agentId).toBe('agent-1');
    expect(state.symbolsRead.size).toBe(0);
  });

  it('records reads', () => {
    const t = new BeliefTracker();
    t.recordRead('a', 'foo');
    t.recordRead('a', 'bar');
    expect(t.getState('a')!.symbolsRead.size).toBe(2);
  });

  it('records assumptions', () => {
    const t = new BeliefTracker();
    t.recordAssumption('a', 'db.type', 'postgres');
    expect(t.getState('a')!.assumptions.get('db.type')).toBe('postgres');
  });

  it('records modifications', () => {
    const t = new BeliefTracker();
    t.recordModification('a', 'src/a.ts');
    expect(t.getState('a')!.filesModified.has('src/a.ts')).toBe(true);
  });

  it('returns undefined for unknown agent', () => {
    const t = new BeliefTracker();
    expect(t.getState('unknown')).toBeUndefined();
  });

  it('shares state by reference', () => {
    const t = new BeliefTracker();
    t.track('a');
    t.recordRead('a', 'foo');
    expect(t.getState('a')!.symbolsRead.has('foo')).toBe(true);
  });
});

describe('detectConflicts', () => {
  it('detects assumption conflict', () => {
    const t = new BeliefTracker();
    t.recordAssumption('a', 'encoding', 'utf-8');
    t.recordAssumption('b', 'encoding', 'ascii');

    const conflicts = detectConflicts(t);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]!.type).toBe('assumption');
    expect(conflicts[0]!.subject).toBe('encoding');
    expect(conflicts[0]!.valueA).toBe('utf-8');
    expect(conflicts[0]!.valueB).toBe('ascii');
  });

  it('detects file modification conflict', () => {
    const t = new BeliefTracker();
    t.recordModification('a', 'src/shared.ts');
    t.recordModification('b', 'src/shared.ts');

    const conflicts = detectConflicts(t);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]!.type).toBe('modification');
    expect(conflicts[0]!.subject).toBe('src/shared.ts');
  });

  it('returns empty when no conflicts', () => {
    const t = new BeliefTracker();
    t.recordAssumption('a', 'db', 'postgres');
    t.recordAssumption('b', 'cache', 'redis');
    t.recordModification('a', 'src/a.ts');
    t.recordModification('b', 'src/b.ts');

    expect(detectConflicts(t)).toHaveLength(0);
  });

  it('returns empty for single agent', () => {
    const t = new BeliefTracker();
    t.recordAssumption('a', 'x', 'y');
    t.recordModification('a', 'file.ts');
    expect(detectConflicts(t)).toHaveLength(0);
  });

  it('handles three agents with pairwise conflicts', () => {
    const t = new BeliefTracker();
    t.recordModification('a', 'shared.ts');
    t.recordModification('b', 'shared.ts');
    t.recordModification('c', 'shared.ts');

    const conflicts = detectConflicts(t);
    // C(3,2) = 3 pairs: a-b, a-c, b-c
    expect(conflicts).toHaveLength(3);
  });
});

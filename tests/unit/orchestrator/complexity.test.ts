/**
 * Tests for complexity model (orchestrator/complexity.ts).
 */

import { describe, it, expect } from 'vitest';
import { selectDepth, countLinesOfCode } from '../../../src/orchestrator/complexity.js';

describe('selectDepth', () => {
  it('returns single for < 500 LOC', () => {
    expect(selectDepth({ totalLoc: 100, depGraphFanOut: 0, fileChurnScore: 0 })).toBe('single');
    expect(selectDepth({ totalLoc: 499, depGraphFanOut: 0, fileChurnScore: 0 })).toBe('single');
  });

  it('returns two-tier for 500–4999 LOC', () => {
    expect(selectDepth({ totalLoc: 500, depGraphFanOut: 0, fileChurnScore: 0 })).toBe('two-tier');
    expect(selectDepth({ totalLoc: 4999, depGraphFanOut: 0, fileChurnScore: 0 })).toBe('two-tier');
  });

  it('returns full for ≥ 5000 LOC', () => {
    expect(selectDepth({ totalLoc: 5000, depGraphFanOut: 0, fileChurnScore: 0 })).toBe('full');
    expect(selectDepth({ totalLoc: 100000, depGraphFanOut: 0, fileChurnScore: 0 })).toBe('full');
  });

  it('handles boundary at 0', () => {
    expect(selectDepth({ totalLoc: 0, depGraphFanOut: 0, fileChurnScore: 0 })).toBe('single');
  });
});

describe('countLinesOfCode', () => {
  it('returns a positive number for non-empty input', () => {
    expect(countLinesOfCode(['a.ts', 'b.ts'])).toBeGreaterThan(0);
  });

  it('returns 0 for empty input', () => {
    expect(countLinesOfCode([])).toBe(0);
  });
});

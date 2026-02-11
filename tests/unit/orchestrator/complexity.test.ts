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

  it('high depGraphFanOut escalates from single to two-tier', () => {
    // 200 LOC alone is single, but 25 fan-out adds 500 → effective 700 → two-tier
    expect(selectDepth({ totalLoc: 200, depGraphFanOut: 25, fileChurnScore: 0 })).toBe('two-tier');
  });

  it('very high depGraphFanOut escalates to full', () => {
    // 3500 LOC alone is two-tier, but >50 fan-out adds 2000 → effective 5500 → full
    expect(selectDepth({ totalLoc: 3500, depGraphFanOut: 60, fileChurnScore: 0 })).toBe('full');
  });

  it('high fileChurnScore escalates via penalty', () => {
    // 400 LOC alone is single, but churn >0.5 adds 1000 → effective 1400 → two-tier
    expect(selectDepth({ totalLoc: 400, depGraphFanOut: 0, fileChurnScore: 0.8 })).toBe('two-tier');
  });

  it('combined penalties stack', () => {
    // 100 LOC + 25 fanOut (+500) + 0.6 churn (+1000) → effective 1600 → two-tier
    expect(selectDepth({ totalLoc: 100, depGraphFanOut: 25, fileChurnScore: 0.6 })).toBe('two-tier');
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

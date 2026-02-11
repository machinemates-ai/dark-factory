/**
 * Tests for satisfaction gate (validator/satisfaction.ts).
 */

import { describe, it, expect } from 'vitest';
import { computeFinalSatisfaction } from '../../../src/validator/satisfaction.js';

describe('computeFinalSatisfaction', () => {
  it('computes weighted average (0.6 × L2 + 0.4 × holdout)', () => {
    expect(computeFinalSatisfaction(1.0, 1.0)).toBeCloseTo(1.0);
    expect(computeFinalSatisfaction(0.0, 0.0)).toBeCloseTo(0.0);
    expect(computeFinalSatisfaction(0.5, 0.5)).toBeCloseTo(0.5);
    expect(computeFinalSatisfaction(1.0, 0.0)).toBeCloseTo(0.6);
    expect(computeFinalSatisfaction(0.0, 1.0)).toBeCloseTo(0.4);
  });

  it('handles boundary values', () => {
    expect(computeFinalSatisfaction(0.8, 0.9)).toBeCloseTo(0.84);
  });
});

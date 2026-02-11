/**
 * Tests for blackbox gate utilities (validator/blackbox.ts).
 */

import { describe, it, expect } from 'vitest';
import { medianScore } from '../../../src/validator/blackbox.js';

describe('medianScore', () => {
  it('returns 0 for empty array', () => {
    expect(medianScore([])).toBe(0);
  });

  it('returns the single element for length 1', () => {
    expect(medianScore([0.75])).toBe(0.75);
  });

  it('returns middle element for odd-length array', () => {
    expect(medianScore([0.3, 0.5, 0.9])).toBe(0.5);
  });

  it('returns average of two middle elements for even-length array', () => {
    expect(medianScore([0.2, 0.4, 0.6, 0.8])).toBe(0.5);
  });

  it('handles unsorted input', () => {
    expect(medianScore([0.9, 0.1, 0.5])).toBe(0.5);
  });

  it('handles duplicate values', () => {
    expect(medianScore([0.7, 0.7, 0.7])).toBe(0.7);
  });

  it('handles boundary values (0 and 1)', () => {
    expect(medianScore([0, 0, 1, 1])).toBe(0.5);
  });

  it('does not mutate the input array', () => {
    const scores = [0.9, 0.1, 0.5];
    medianScore(scores);
    expect(scores).toEqual([0.9, 0.1, 0.5]);
  });
});

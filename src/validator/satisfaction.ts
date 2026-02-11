/**
 * L3 Satisfaction Gate — holdout tests + human-in-the-loop (D56).
 *
 * Holdout tests in .gitignored tests/holdout/ — agents never see these.
 * Final score = 0.6 × L2 median + 0.4 × holdout pass rate.
 */

import type { ValidationReport } from '../agents/types.js';

export function computeFinalSatisfaction(
  l2MedianScore: number,
  holdoutPassRate: number,
): number {
  return 0.6 * l2MedianScore + 0.4 * holdoutPassRate;
}

export async function runSatisfactionGate(
  taskId: string,
  _l2Score: number,
  _holdoutDir: string,
  _humanReview: boolean,
): Promise<ValidationReport> {
  // TODO: Implement holdout test execution + optional human review
  return {
    taskId,
    gate: 'L3',
    passed: true,
    score: 0.80,
    findings: [],
    timestamp: new Date().toISOString(),
  };
}

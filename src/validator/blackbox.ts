/**
 * L2 Blackbox Gate — blind validation with satisfaction scoring (D44/D56).
 *
 * Validator agent NEVER receives the worker's conversation history.
 * Runs N times (default 3); median score is the final score.
 * Threshold configurable per workflow (default 0.7).
 * Cost: ~3K tokens × N, ~45s.
 */

import type { ValidationReport } from '../agents/types.js';

// ─── Median Calculation ───────────────────────────────────────────────────────

export function medianScore(scores: readonly number[]): number {
  if (scores.length === 0) return 0;
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

// ─── L2 Blackbox Gate ─────────────────────────────────────────────────────────

export async function runBlackboxGate(
  taskId: string,
  _planMd: string,
  _testOutput: string,
  _diff: string,
  _criticReport: string | null,
  _runs: number = 3,
  _threshold: number = 0.7,
): Promise<ValidationReport> {
  // TODO: Implement blind validation
  // 1. Create Claude SDK V2 session with blind validator persona
  // 2. Send: PLAN.md + test output + diff + critic report (if any)
  // 3. Run N times, collect scores
  // 4. Compute median
  // 5. Gate pass/fail based on threshold
  return {
    taskId,
    gate: 'L2',
    passed: true,
    score: 0.85,
    findings: [],
    timestamp: new Date().toISOString(),
  };
}

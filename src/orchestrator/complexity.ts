/**
 * Adaptive orchestration depth — complexity model (D52).
 *
 * Auto-selects orchestration depth based on project metrics:
 * LOC count + dependency graph fan-out + file churn score.
 */

import type { OrchestrationDepth } from '../agents/types.js';

// ─── Thresholds ───────────────────────────────────────────────────────────────

const SINGLE_AGENT_THRESHOLD = 500;
const TWO_TIER_THRESHOLD = 5000;

// ─── Complexity Metrics ───────────────────────────────────────────────────────

export interface ComplexityMetrics {
  readonly totalLoc: number;
  readonly depGraphFanOut: number;
  readonly fileChurnScore: number;
}

// ─── Auto Depth Selection ─────────────────────────────────────────────────────

/**
 * Select orchestration depth from composite complexity.
 *
 * Primary signal is LOC. High dependency fan-out or file churn
 * escalate the effective complexity:
 *   effective = LOC + fanOutPenalty + churnPenalty
 *
 * This lets a small-LOC project with dense coupling still qualify
 * for two-tier orchestration.
 */
export function selectDepth(metrics: ComplexityMetrics): OrchestrationDepth {
  const fanOutPenalty = metrics.depGraphFanOut > 50
    ? 2000
    : metrics.depGraphFanOut > 20
      ? 500
      : 0;
  const churnPenalty = metrics.fileChurnScore > 0.5 ? 1000 : 0;
  const effective = metrics.totalLoc + fanOutPenalty + churnPenalty;

  if (effective < SINGLE_AGENT_THRESHOLD) {
    return 'single';
  }

  if (effective < TWO_TIER_THRESHOLD) {
    return 'two-tier';
  }

  return 'full';
}

// ─── LOC Counter (simple) ─────────────────────────────────────────────────────

export function countLinesOfCode(files: readonly string[]): number {
  // TODO: Implement actual LOC counting from file contents
  // Exclude blank lines and comments
  return files.length * 100; // Placeholder
}

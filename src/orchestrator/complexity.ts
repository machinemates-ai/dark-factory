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

export function selectDepth(metrics: ComplexityMetrics): OrchestrationDepth {
  if (metrics.totalLoc < SINGLE_AGENT_THRESHOLD) {
    return 'single';
  }

  if (metrics.totalLoc < TWO_TIER_THRESHOLD) {
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

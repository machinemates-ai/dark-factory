/**
 * Memory types — Three-Ring Memory architecture (D63/D64).
 */

export interface MemoryNote {
  readonly id: string;
  readonly content: string;
  readonly tags: readonly string[];
  readonly source: string; // e.g., 'run:abc123', 'convergence:xyz'
  readonly createdAt: string;
}

export interface MemoryLink {
  readonly fromId: string;
  readonly toId: string;
  readonly relation: string; // e.g., 'related', 'contradicts', 'supersedes'
}

export interface ConvergenceReport {
  readonly runId: string;
  readonly resolvedConflicts: readonly ConflictResolution[];
  readonly promotedFacts: readonly string[];
  readonly discardedRedundancies: number;
  readonly timestamp: string;
}

export interface ConflictResolution {
  readonly topic: string;
  readonly beliefA: string;
  readonly beliefB: string;
  readonly resolved: string;
  readonly confidence: number;
}

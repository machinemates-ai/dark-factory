/**
 * debrief_run() — extract key learnings at run end (D63).
 *
 * Persists patterns discovered, errors encountered, architecture decisions
 * as atomic notes in Ring 3.
 */

import type { ProjectStore } from './project-store.js';

export interface DebriefInput {
  readonly runId: string;
  readonly summary: string;
  readonly errors: readonly string[];
  readonly patterns: readonly string[];
  readonly decisions: readonly string[];
}

export async function debriefRun(
  store: ProjectStore,
  input: DebriefInput,
): Promise<number> {
  let stored = 0;

  // Store summary
  if (input.summary) {
    await store.store({
      content: `Run ${input.runId} summary: ${input.summary}`,
      tags: ['run-summary', input.runId],
      source: `run:${input.runId}`,
    });
    stored++;
  }

  // Store error patterns
  for (const error of input.errors) {
    await store.store({
      content: `Error pattern from run ${input.runId}: ${error}`,
      tags: ['error-pattern', input.runId],
      source: `run:${input.runId}`,
    });
    stored++;
  }

  // Store discovered patterns
  for (const pattern of input.patterns) {
    await store.store({
      content: `Pattern discovered in run ${input.runId}: ${pattern}`,
      tags: ['pattern', input.runId],
      source: `run:${input.runId}`,
    });
    stored++;
  }

  return stored;
}

/**
 * ToM → S4 Planner integration (D72).
 *
 * Feeds belief state into the planner's context so task assignments
 * minimize conflicts.
 */

import type { BeliefTracker } from './belief-tracker.js';
import { detectConflicts, type BeliefConflict } from './conflict-detector.js';

export interface ToMContext {
  readonly conflicts: readonly BeliefConflict[];
  readonly summary: string;
}

export function buildToMContext(tracker: BeliefTracker): ToMContext {
  const conflicts = detectConflicts(tracker);

  const summary = conflicts.length === 0
    ? 'No belief conflicts detected between agents.'
    : `${conflicts.length} belief conflict(s) detected:\n` +
      conflicts.map((c) =>
        `- ${c.agentA} vs ${c.agentB}: ${c.type} conflict on "${c.subject}" (${c.valueA} vs ${c.valueB})`,
      ).join('\n');

  return { conflicts, summary };
}

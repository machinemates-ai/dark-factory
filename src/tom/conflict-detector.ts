/**
 * Belief conflict detection between parallel agents (D72).
 */

import type { BeliefTracker } from './belief-tracker.js';

// ─── Conflict Types ───────────────────────────────────────────────────────────

export interface BeliefConflict {
  readonly agentA: string;
  readonly agentB: string;
  readonly type: 'assumption' | 'modification';
  readonly subject: string;
  readonly valueA: string;
  readonly valueB: string;
}

// ─── Detect Conflicts ─────────────────────────────────────────────────────────

export function detectConflicts(tracker: BeliefTracker): BeliefConflict[] {
  const conflicts: BeliefConflict[] = [];
  const states = [...tracker.getAllStates().values()];

  for (let i = 0; i < states.length; i++) {
    for (let j = i + 1; j < states.length; j++) {
      const a = states[i]!;
      const b = states[j]!;

      // Check assumption conflicts
      for (const [key, valueA] of a.assumptions) {
        const valueB = b.assumptions.get(key);
        if (valueB !== undefined && valueA !== valueB) {
          conflicts.push({
            agentA: a.agentId,
            agentB: b.agentId,
            type: 'assumption',
            subject: key,
            valueA,
            valueB,
          });
        }
      }

      // Check file modification conflicts
      for (const file of a.filesModified) {
        if (b.filesModified.has(file)) {
          conflicts.push({
            agentA: a.agentId,
            agentB: b.agentId,
            type: 'modification',
            subject: file,
            valueA: 'modified',
            valueB: 'modified',
          });
        }
      }
    }
  }

  return conflicts;
}

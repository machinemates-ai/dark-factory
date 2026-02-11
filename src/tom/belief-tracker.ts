/**
 * Theory of Mind — per-agent belief state tracking (D72).
 *
 * Optional module (--tom flag). Tracks what each agent knows/assumes
 * about the codebase.
 */

// ─── Belief State ─────────────────────────────────────────────────────────────

export interface BeliefState {
  readonly agentId: string;
  /** Symbols the agent has read. */
  readonly symbolsRead: Set<string>;
  /** Assumptions the agent has made (key → value). */
  readonly assumptions: Map<string, string>;
  /** Files the agent has modified. */
  readonly filesModified: Set<string>;
}

export function createBeliefState(agentId: string): BeliefState {
  return {
    agentId,
    symbolsRead: new Set(),
    assumptions: new Map(),
    filesModified: new Set(),
  };
}

// ─── Belief Tracker ───────────────────────────────────────────────────────────

export class BeliefTracker {
  private readonly beliefs = new Map<string, BeliefState>();

  track(agentId: string): BeliefState {
    if (!this.beliefs.has(agentId)) {
      this.beliefs.set(agentId, createBeliefState(agentId));
    }
    return this.beliefs.get(agentId)!;
  }

  recordRead(agentId: string, symbol: string): void {
    this.track(agentId).symbolsRead.add(symbol);
  }

  recordAssumption(agentId: string, key: string, value: string): void {
    this.track(agentId).assumptions.set(key, value);
  }

  recordModification(agentId: string, file: string): void {
    this.track(agentId).filesModified.add(file);
  }

  getState(agentId: string): BeliefState | undefined {
    return this.beliefs.get(agentId);
  }

  getAllStates(): ReadonlyMap<string, BeliefState> {
    return this.beliefs;
  }
}

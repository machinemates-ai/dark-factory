/**
 * Symbol graph store (D70).
 *
 * In-memory directed graph: symbols as nodes, calls/extends/implements/imports as edges.
 * v1: Map<string, Set<string>> adjacency list (sufficient for <100K LOC).
 */

import type { SymbolDef, SymbolEdge, EdgeKind } from './parser.js';

// ─── Graph Store ──────────────────────────────────────────────────────────────

export class SymbolGraph {
  private readonly symbols = new Map<string, SymbolDef>();
  private readonly forward = new Map<string, Map<string, EdgeKind>>(); // from → to → kind
  private readonly reverse = new Map<string, Map<string, EdgeKind>>(); // to → from → kind

  addSymbol(symbol: SymbolDef): void {
    this.symbols.set(qualifiedName(symbol), symbol);
  }

  addEdge(edge: SymbolEdge): void {
    if (!this.forward.has(edge.from)) this.forward.set(edge.from, new Map());
    this.forward.get(edge.from)!.set(edge.to, edge.kind);

    if (!this.reverse.has(edge.to)) this.reverse.set(edge.to, new Map());
    this.reverse.get(edge.to)!.set(edge.from, edge.kind);
  }

  getSymbol(name: string): SymbolDef | undefined {
    return this.symbols.get(name);
  }

  /** All symbols this symbol calls/references. */
  getCallees(name: string): string[] {
    return [...(this.forward.get(name)?.keys() ?? [])];
  }

  /** All symbols that call/reference this symbol. */
  getCallers(name: string): string[] {
    return [...(this.reverse.get(name)?.keys() ?? [])];
  }

  /** Find all implementations of an interface/class. */
  getImplementations(name: string): string[] {
    return [...(this.reverse.get(name)?.entries() ?? [])]
      .filter(([, kind]) => kind === 'implements' || kind === 'extends')
      .map(([from]) => from);
  }

  /** Dependency fan-out: number of outgoing edges from a file's symbols. */
  dependencyFanOut(filePath: string): number {
    let count = 0;
    for (const [name, symbol] of this.symbols) {
      if (symbol.filePath === filePath) {
        count += this.forward.get(name)?.size ?? 0;
      }
    }
    return count;
  }

  /** Get 2-hop neighborhood for a symbol (for 'indexed' context strategy). */
  getNeighborhood(name: string, maxHops: number = 2): Set<string> {
    const visited = new Set<string>();
    const queue: Array<[string, number]> = [[name, 0]];

    while (queue.length > 0) {
      const [current, depth] = queue.shift()!;
      if (visited.has(current) || depth > maxHops) continue;
      visited.add(current);

      for (const callee of this.getCallees(current)) {
        queue.push([callee, depth + 1]);
      }
      for (const caller of this.getCallers(current)) {
        queue.push([caller, depth + 1]);
      }
    }

    return visited;
  }

  get symbolCount(): number {
    return this.symbols.size;
  }

  get edgeCount(): number {
    let count = 0;
    for (const edges of this.forward.values()) {
      count += edges.size;
    }
    return count;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function qualifiedName(symbol: SymbolDef): string {
  return `${symbol.filePath}::${symbol.name}`;
}

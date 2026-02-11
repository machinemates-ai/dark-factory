/**
 * Semantic queries on the symbol graph (D70).
 *
 * findCallers, findCallees, findImplementations, getCallChain, dependencyFanOut.
 */

import type { SymbolGraph } from './graph.js';

export interface QueryResult {
  readonly symbols: readonly string[];
  readonly tokenEstimate: number;
}

/** Find all callers of a symbol (direct + transitive up to maxDepth). */
export function findCallers(
  graph: SymbolGraph,
  symbol: string,
  maxDepth: number = 3,
): QueryResult {
  const result = new Set<string>();
  const queue: Array<[string, number]> = [[symbol, 0]];

  while (queue.length > 0) {
    const [current, depth] = queue.shift()!;
    if (depth > maxDepth) continue;
    for (const caller of graph.getCallers(current)) {
      if (!result.has(caller)) {
        result.add(caller);
        queue.push([caller, depth + 1]);
      }
    }
  }

  return { symbols: [...result], tokenEstimate: result.size * 50 };
}

/** Find all callees of a symbol (direct + transitive up to maxDepth). */
export function findCallees(
  graph: SymbolGraph,
  symbol: string,
  maxDepth: number = 3,
): QueryResult {
  const result = new Set<string>();
  const queue: Array<[string, number]> = [[symbol, 0]];

  while (queue.length > 0) {
    const [current, depth] = queue.shift()!;
    if (depth > maxDepth) continue;
    for (const callee of graph.getCallees(current)) {
      if (!result.has(callee)) {
        result.add(callee);
        queue.push([callee, depth + 1]);
      }
    }
  }

  return { symbols: [...result], tokenEstimate: result.size * 50 };
}

/** Find all implementations of an interface/abstract class. */
export function findImplementations(
  graph: SymbolGraph,
  symbol: string,
): QueryResult {
  const impls = graph.getImplementations(symbol);
  return { symbols: impls, tokenEstimate: impls.length * 100 };
}

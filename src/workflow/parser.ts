/**
 * TAKT YAML parser with DAG validation (D39/D47).
 *
 * Parses YAML workflow files against the TaktPiece Zod schema.
 * Validates DAG acyclicity via topological sort when edges are present.
 */

import { parse as parseYaml } from 'yaml';
import { TaktPieceSchema, type TaktPiece, type Edge } from './schema.js';

// ─── Parse & Validate ─────────────────────────────────────────────────────────

export interface ParseResult {
  readonly success: true;
  readonly piece: TaktPiece;
  readonly topologicalOrder: readonly string[];
}

export interface ParseError {
  readonly success: false;
  readonly errors: readonly string[];
}

export function parseTaktYaml(yamlContent: string): ParseResult | ParseError {
  let raw: unknown;
  try {
    raw = parseYaml(yamlContent);
  } catch (err) {
    return {
      success: false,
      errors: [`YAML parse error: ${err instanceof Error ? err.message : String(err)}`],
    };
  }

  const result = TaktPieceSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(
        (i) => `${i.path.join('.')}: ${i.message}`,
      ),
    };
  }

  const piece = result.data;

  // DAG validation — topological sort using top-level edges
  const movementNames = piece.movements.map((m) => m.name);
  const dagResult = topologicalSort(movementNames, piece.edges);
  if (!dagResult.success) {
    return { success: false, errors: [dagResult.error] };
  }

  return { success: true, piece, topologicalOrder: dagResult.order };
}

// ─── Topological Sort (Kahn's Algorithm) ──────────────────────────────────────

interface TopoSuccess {
  success: true;
  order: string[];
}

interface TopoError {
  success: false;
  error: string;
}

function topologicalSort(
  movementNames: readonly string[],
  edges: readonly Edge[],
): TopoSuccess | TopoError {
  const names = new Set(movementNames);
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  for (const name of names) {
    adjacency.set(name, []);
    inDegree.set(name, 0);
  }

  // Build graph from top-level edges
  for (const edge of edges) {
    if (!names.has(edge.from)) {
      return {
        success: false,
        error: `Edge references unknown movement "${edge.from}"`,
      };
    }
    if (!names.has(edge.to)) {
      return {
        success: false,
        error: `Edge references unknown movement "${edge.to}"`,
      };
    }
    adjacency.get(edge.from)!.push(edge.to);
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
  }

  // Kahn's algorithm
  const queue: string[] = [];
  for (const [name, degree] of inDegree) {
    if (degree === 0) queue.push(name);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  if (order.length !== names.size) {
    return { success: false, error: 'Cycle detected in movement DAG' };
  }

  return { success: true, order };
}

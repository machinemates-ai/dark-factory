/**
 * Incremental re-index on file change (D70).
 *
 * Diff-based: only re-parse changed files, update only affected symbols/edges.
 */

import type { SymbolGraph } from './graph.js';

export interface IncrementalUpdate {
  readonly filesChanged: number;
  readonly symbolsAdded: number;
  readonly symbolsRemoved: number;
  readonly edgesUpdated: number;
}

export async function incrementalReindex(
  _graph: SymbolGraph,
  _changedFiles: string[],
): Promise<IncrementalUpdate> {
  // TODO: Implement incremental re-index
  // 1. For each changed file, re-parse with tree-sitter
  // 2. Diff old symbols vs new symbols
  // 3. Remove deleted symbols and their edges
  // 4. Add new symbols and edges
  // 5. Update modified symbols
  return {
    filesChanged: _changedFiles.length,
    symbolsAdded: 0,
    symbolsRemoved: 0,
    edgesUpdated: 0,
  };
}

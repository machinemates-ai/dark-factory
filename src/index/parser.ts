/**
 * Semantic Codebase Indexer — tree-sitter AST extraction (D70).
 *
 * Parses source files into ASTs, extracts symbol definitions and references.
 * Supported languages v1: TypeScript, Python.
 */

// ─── Symbol Types ─────────────────────────────────────────────────────────────

export type SymbolKind = 'function' | 'class' | 'method' | 'interface' | 'type-alias' | 'variable';

export interface SymbolDef {
  readonly name: string;
  readonly kind: SymbolKind;
  readonly filePath: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly language: string;
}

export type EdgeKind = 'calls' | 'extends' | 'implements' | 'imports' | 'exports' | 'type_reference';

export interface SymbolEdge {
  readonly from: string; // qualified name
  readonly to: string;
  readonly kind: EdgeKind;
  readonly filePath: string;
  readonly line: number;
}

// ─── Parser (stub) ────────────────────────────────────────────────────────────

export async function parseFile(
  _filePath: string,
  _language: 'typescript' | 'python',
): Promise<{ symbols: SymbolDef[]; edges: SymbolEdge[] }> {
  // TODO: Implement tree-sitter WASM parsing
  // 1. Load language grammar
  // 2. Parse file into AST
  // 3. Walk AST to extract symbol definitions
  // 4. Walk AST to extract references (calls, imports, extends, implements)
  return { symbols: [], edges: [] };
}

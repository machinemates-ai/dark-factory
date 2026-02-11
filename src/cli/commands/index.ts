/**
 * CLI command: index — Build/update the semantic codebase index.
 */

import { resolve } from 'node:path';

export async function runIndexCommand(_opts: Record<string, unknown>): Promise<void> {
  const target = resolve('.');

  console.log(`Building semantic index for: ${target}`);
  // TODO: 
  // 1. Discover source files (tree-sitter supported languages)
  // 2. Parse each file → SymbolDef[]
  // 3. Build SymbolGraph
  // 4. Persist to .dark-factory-index/
  console.log('Index command not yet implemented.');
}

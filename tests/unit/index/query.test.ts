/**
 * Tests for semantic graph queries (index/query.ts).
 */

import { describe, it, expect } from 'vitest';
import { SymbolGraph } from '../../../src/index/graph.js';
import { findCallers, findCallees, findImplementations } from '../../../src/index/query.js';
import type { SymbolDef } from '../../../src/index/parser.js';

function sym(name: string, file = 'src/test.ts'): SymbolDef {
  return { name, kind: 'function', filePath: file, startLine: 1, endLine: 10, language: 'typescript' };
}

function edge(from: string, to: string, kind: 'calls' | 'extends' | 'implements' = 'calls') {
  return { from, to, kind, filePath: 'src/test.ts', line: 1 };
}

function buildChainGraph(): SymbolGraph {
  // A → B → C → D
  const g = new SymbolGraph();
  for (const n of ['a', 'b', 'c', 'd']) g.addSymbol(sym(n));
  g.addEdge(edge('src/test.ts::a', 'src/test.ts::b'));
  g.addEdge(edge('src/test.ts::b', 'src/test.ts::c'));
  g.addEdge(edge('src/test.ts::c', 'src/test.ts::d'));
  return g;
}

describe('findCallers', () => {
  it('finds transitive callers', () => {
    const g = buildChainGraph();
    const result = findCallers(g, 'src/test.ts::d', 3);
    expect(result.symbols).toContain('src/test.ts::c');
    expect(result.symbols).toContain('src/test.ts::b');
    expect(result.symbols).toContain('src/test.ts::a');
  });

  it('respects maxDepth', () => {
    const g = buildChainGraph();
    const result = findCallers(g, 'src/test.ts::d', 1);
    expect(result.symbols).toContain('src/test.ts::c');
    expect(result.symbols).not.toContain('src/test.ts::a');
  });

  it('returns empty for root symbol', () => {
    const g = buildChainGraph();
    const result = findCallers(g, 'src/test.ts::a');
    expect(result.symbols).toHaveLength(0);
  });

  it('estimates tokens', () => {
    const g = buildChainGraph();
    const result = findCallers(g, 'src/test.ts::d', 3);
    expect(result.tokenEstimate).toBe(result.symbols.length * 50);
  });
});

describe('findCallees', () => {
  it('finds transitive callees', () => {
    const g = buildChainGraph();
    const result = findCallees(g, 'src/test.ts::a', 3);
    expect(result.symbols).toContain('src/test.ts::b');
    expect(result.symbols).toContain('src/test.ts::c');
    expect(result.symbols).toContain('src/test.ts::d');
  });

  it('respects maxDepth', () => {
    const g = buildChainGraph();
    const result = findCallees(g, 'src/test.ts::a', 1);
    expect(result.symbols).toContain('src/test.ts::b');
    expect(result.symbols).not.toContain('src/test.ts::d');
  });
});

describe('findImplementations', () => {
  it('returns implementations and extends', () => {
    const g = new SymbolGraph();
    g.addSymbol(sym('IFoo', 'i.ts'));
    g.addSymbol(sym('Foo', 'foo.ts'));
    g.addSymbol(sym('MockFoo', 'mock.ts'));
    g.addEdge(edge('foo.ts::Foo', 'i.ts::IFoo', 'implements'));
    g.addEdge(edge('mock.ts::MockFoo', 'i.ts::IFoo', 'extends'));

    const result = findImplementations(g, 'i.ts::IFoo');
    expect(result.symbols).toHaveLength(2);
    expect(result.symbols).toContain('foo.ts::Foo');
    expect(result.symbols).toContain('mock.ts::MockFoo');
    expect(result.tokenEstimate).toBe(200);
  });

  it('returns empty for no implementations', () => {
    const g = new SymbolGraph();
    g.addSymbol(sym('Standalone'));
    const result = findImplementations(g, 'src/test.ts::Standalone');
    expect(result.symbols).toHaveLength(0);
  });
});

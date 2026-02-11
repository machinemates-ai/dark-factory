/**
 * Tests for SymbolGraph (index/graph.ts).
 */

import { describe, it, expect } from 'vitest';
import { SymbolGraph } from '../../../src/index/graph.js';
import type { SymbolDef } from '../../../src/index/parser.js';

function sym(name: string, filePath = 'src/test.ts'): SymbolDef {
  return { name, kind: 'function', filePath, startLine: 1, endLine: 10, language: 'typescript' };
}

function edge(from: string, to: string, kind: 'calls' | 'extends' | 'implements' | 'imports' = 'calls') {
  return { from, to, kind, filePath: 'src/test.ts', line: 1 };
}

describe('SymbolGraph', () => {
  it('adds and retrieves symbols', () => {
    const g = new SymbolGraph();
    g.addSymbol(sym('greet'));
    expect(g.symbolCount).toBe(1);
    const s = g.getSymbol('src/test.ts::greet');
    expect(s?.name).toBe('greet');
  });

  it('tracks directed edges', () => {
    const g = new SymbolGraph();
    g.addSymbol(sym('a'));
    g.addSymbol(sym('b'));
    g.addEdge(edge('src/test.ts::a', 'src/test.ts::b', 'calls'));

    expect(g.getCallees('src/test.ts::a')).toEqual(['src/test.ts::b']);
    expect(g.getCallers('src/test.ts::b')).toEqual(['src/test.ts::a']);
    expect(g.edgeCount).toBe(1);
  });

  it('finds implementations', () => {
    const g = new SymbolGraph();
    g.addSymbol(sym('IFoo', 'iFoo.ts'));
    g.addSymbol(sym('FooImpl', 'foo.ts'));
    g.addSymbol(sym('FooStub', 'stub.ts'));
    g.addEdge(edge('foo.ts::FooImpl', 'iFoo.ts::IFoo', 'implements'));
    g.addEdge(edge('stub.ts::FooStub', 'iFoo.ts::IFoo', 'extends'));

    const impls = g.getImplementations('iFoo.ts::IFoo');
    expect(impls).toHaveLength(2);
    expect(impls).toContain('foo.ts::FooImpl');
    expect(impls).toContain('stub.ts::FooStub');
  });

  it('does not include callers as implementations', () => {
    const g = new SymbolGraph();
    g.addSymbol(sym('IFoo'));
    g.addSymbol(sym('caller'));
    g.addEdge(edge('src/test.ts::caller', 'src/test.ts::IFoo', 'calls'));

    expect(g.getImplementations('src/test.ts::IFoo')).toEqual([]);
  });

  it('computes dependency fan-out', () => {
    const g = new SymbolGraph();
    g.addSymbol(sym('a', 'src/a.ts'));
    g.addSymbol(sym('b', 'src/a.ts'));
    g.addSymbol(sym('c', 'src/b.ts'));
    g.addEdge(edge('src/a.ts::a', 'src/b.ts::c', 'calls'));
    g.addEdge(edge('src/a.ts::b', 'src/b.ts::c', 'imports'));

    expect(g.dependencyFanOut('src/a.ts')).toBe(2);
    expect(g.dependencyFanOut('src/b.ts')).toBe(0);
  });

  it('computes 2-hop neighborhood', () => {
    const g = new SymbolGraph();
    // A → B → C → D
    g.addSymbol(sym('a'));
    g.addSymbol(sym('b'));
    g.addSymbol(sym('c'));
    g.addSymbol(sym('d'));
    g.addEdge(edge('src/test.ts::a', 'src/test.ts::b', 'calls'));
    g.addEdge(edge('src/test.ts::b', 'src/test.ts::c', 'calls'));
    g.addEdge(edge('src/test.ts::c', 'src/test.ts::d', 'calls'));

    const neighborhood = g.getNeighborhood('src/test.ts::b', 2);
    // From b: forward → c → d; reverse → a. All within 2 hops.
    expect(neighborhood).toContain('src/test.ts::a');
    expect(neighborhood).toContain('src/test.ts::b');
    expect(neighborhood).toContain('src/test.ts::c');
    expect(neighborhood).toContain('src/test.ts::d');
  });

  it('limits neighborhood by maxHops', () => {
    const g = new SymbolGraph();
    g.addSymbol(sym('a'));
    g.addSymbol(sym('b'));
    g.addSymbol(sym('c'));
    g.addEdge(edge('src/test.ts::a', 'src/test.ts::b', 'calls'));
    g.addEdge(edge('src/test.ts::b', 'src/test.ts::c', 'calls'));

    const n = g.getNeighborhood('src/test.ts::a', 1);
    expect(n).toContain('src/test.ts::a');
    expect(n).toContain('src/test.ts::b');
    expect(n).not.toContain('src/test.ts::c');
  });

  it('returns empty for unknown symbol', () => {
    const g = new SymbolGraph();
    expect(g.getCallees('unknown')).toEqual([]);
    expect(g.getCallers('unknown')).toEqual([]);
    expect(g.getSymbol('unknown')).toBeUndefined();
  });
});

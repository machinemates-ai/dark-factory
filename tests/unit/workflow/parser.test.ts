/**
 * Tests for TAKT YAML parser + DAG topological sort (workflow/parser.ts).
 */

import { describe, it, expect } from 'vitest';
import { parseTaktYaml } from '../../../src/workflow/parser.js';
import { stringify } from 'yaml';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeYaml(obj: Record<string, unknown>): string {
  return stringify(obj);
}

function minimalWorkflow(overrides: Record<string, unknown> = {}) {
  return {
    name: 'test',
    version: '1.0',
    goal: 'Test',
    personas: [{ name: 'dev', role: 'coder' }],
    movements: [
      { name: 'code', goal: 'Write code', assigned_to: 'dev', type: 'code' },
    ],
    ...overrides,
  };
}

// ─── Happy paths ──────────────────────────────────────────────────────────────

describe('parseTaktYaml', () => {
  it('parses a minimal workflow', () => {
    const yaml = makeYaml(minimalWorkflow());
    const result = parseTaktYaml(yaml);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.piece.name).toBe('test');
      expect(result.topologicalOrder).toEqual(['code']);
    }
  });

  it('parses a linear DAG (A → B → C)', () => {
    const yaml = makeYaml(
      minimalWorkflow({
        movements: [
          { name: 'a', goal: 'A', assigned_to: 'dev', type: 'code' },
          { name: 'b', goal: 'B', assigned_to: 'dev', type: 'code' },
          { name: 'c', goal: 'C', assigned_to: 'dev', type: 'code' },
        ],
        edges: [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'c' },
        ],
      }),
    );

    const result = parseTaktYaml(yaml);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.topologicalOrder).toEqual(['a', 'b', 'c']);
    }
  });

  it('parses a diamond DAG (A → B, A → C, B → D, C → D)', () => {
    const yaml = makeYaml(
      minimalWorkflow({
        movements: [
          { name: 'a', goal: 'A', assigned_to: 'dev', type: 'code' },
          { name: 'b', goal: 'B', assigned_to: 'dev', type: 'code' },
          { name: 'c', goal: 'C', assigned_to: 'dev', type: 'code' },
          { name: 'd', goal: 'D', assigned_to: 'dev', type: 'code' },
        ],
        edges: [
          { from: 'a', to: 'b' },
          { from: 'a', to: 'c' },
          { from: 'b', to: 'd' },
          { from: 'c', to: 'd' },
        ],
      }),
    );

    const result = parseTaktYaml(yaml);
    expect(result.success).toBe(true);
    if (result.success) {
      // a must come first, d must come last, b/c can be in any order
      expect(result.topologicalOrder[0]).toBe('a');
      expect(result.topologicalOrder[3]).toBe('d');
      expect(result.topologicalOrder).toHaveLength(4);
    }
  });

  it('handles workflow with no edges', () => {
    const yaml = makeYaml(
      minimalWorkflow({
        movements: [
          { name: 'a', goal: 'A', assigned_to: 'dev', type: 'code' },
          { name: 'b', goal: 'B', assigned_to: 'dev', type: 'code' },
        ],
      }),
    );
    const result = parseTaktYaml(yaml);
    expect(result.success).toBe(true);
    if (result.success) {
      // Both should be in the order with 0 in-degree
      expect(result.topologicalOrder).toHaveLength(2);
    }
  });

  // ─── Error Cases ────────────────────────────────────────────────────────────

  it('detects cycle (A → B → A)', () => {
    const yaml = makeYaml(
      minimalWorkflow({
        movements: [
          { name: 'a', goal: 'A', assigned_to: 'dev', type: 'code' },
          { name: 'b', goal: 'B', assigned_to: 'dev', type: 'code' },
        ],
        edges: [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'a' },
        ],
      }),
    );

    const result = parseTaktYaml(yaml);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.includes('Cycle'))).toBe(true);
    }
  });

  it('rejects edge to unknown movement', () => {
    const yaml = makeYaml(
      minimalWorkflow({
        movements: [
          { name: 'a', goal: 'A', assigned_to: 'dev', type: 'code' },
        ],
        edges: [{ from: 'a', to: 'nonexistent' }],
      }),
    );

    const result = parseTaktYaml(yaml);
    expect(result.success).toBe(false);
  });

  it('rejects edge from unknown movement', () => {
    const yaml = makeYaml(
      minimalWorkflow({
        movements: [
          { name: 'a', goal: 'A', assigned_to: 'dev', type: 'code' },
        ],
        edges: [{ from: 'nonexistent', to: 'a' }],
      }),
    );

    const result = parseTaktYaml(yaml);
    expect(result.success).toBe(false);
  });

  it('returns YAML parse error for invalid YAML', () => {
    const result = parseTaktYaml('{ invalid: yaml: :::');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('YAML parse error');
    }
  });

  it('returns schema errors for invalid structure', () => {
    const result = parseTaktYaml(makeYaml({ name: 123 }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});

/**
 * Tests for TaktPiece Zod schemas (workflow/schema.ts).
 */

import { describe, it, expect } from 'vitest';
import {
  TaktPieceSchema,
  PersonaSchema,
  MovementSchema,
  EdgeSchema,
  RuleSchema,
  RetryConfigSchema,
  ModelConfigSchema,
} from '../../../src/workflow/schema.js';

// ─── Minimal valid TaktPiece for reuse ────────────────────────────────────────

function minimalPiece(overrides: Record<string, unknown> = {}) {
  return {
    name: 'test-workflow',
    version: '1.0',
    goal: 'Test goal',
    personas: [{ name: 'dev', role: 'coder' }],
    movements: [
      { name: 'code', goal: 'Write code', assigned_to: 'dev', type: 'code' },
    ],
    ...overrides,
  };
}

// ─── TaktPieceSchema ──────────────────────────────────────────────────────────

describe('TaktPieceSchema', () => {
  it('parses a minimal valid piece', () => {
    const result = TaktPieceSchema.safeParse(minimalPiece());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('test-workflow');
      expect(result.data.version).toBe('1.0');
      expect(result.data.edges).toEqual([]);
      expect(result.data.rules.satisfaction_threshold).toBe(0.7);
    }
  });

  it('applies defaults for optional fields', () => {
    const result = TaktPieceSchema.safeParse(minimalPiece());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.edges).toEqual([]);
      expect(result.data.rules.satisfaction_threshold).toBe(0.7);
    }
  });

  it('handles null rules (YAML empty key)', () => {
    const result = TaktPieceSchema.safeParse(minimalPiece({ rules: null }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rules.satisfaction_threshold).toBe(0.7);
    }
  });

  it('handles undefined rules', () => {
    const raw = minimalPiece();
    delete (raw as Record<string, unknown>)['rules'];
    const result = TaktPieceSchema.safeParse(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rules.satisfaction_threshold).toBe(0.7);
    }
  });

  it('rejects missing name', () => {
    const raw = minimalPiece();
    delete (raw as Record<string, unknown>)['name'];
    const result = TaktPieceSchema.safeParse(raw);
    expect(result.success).toBe(false);
  });

  it('rejects empty personas', () => {
    const result = TaktPieceSchema.safeParse(minimalPiece({ personas: [] }));
    expect(result.success).toBe(false);
  });

  it('rejects empty movements', () => {
    const result = TaktPieceSchema.safeParse(minimalPiece({ movements: [] }));
    expect(result.success).toBe(false);
  });

  it('validates assigned_to references exist as persona names', () => {
    const result = TaktPieceSchema.safeParse(
      minimalPiece({
        movements: [
          { name: 'code', goal: 'Write', assigned_to: 'nonexistent', type: 'code' },
        ],
      }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('assigned_to'))).toBe(true);
    }
  });

  it('validates edge from/to references exist as movement names', () => {
    const result = TaktPieceSchema.safeParse(
      minimalPiece({
        movements: [
          { name: 'a', goal: 'A', assigned_to: 'dev', type: 'code' },
          { name: 'b', goal: 'B', assigned_to: 'dev', type: 'code' },
        ],
        edges: [{ from: 'a', to: 'nonexistent' }],
      }),
    );
    expect(result.success).toBe(false);
  });

  it('accepts valid edges', () => {
    const result = TaktPieceSchema.safeParse(
      minimalPiece({
        movements: [
          { name: 'a', goal: 'A', assigned_to: 'dev', type: 'code' },
          { name: 'b', goal: 'B', assigned_to: 'dev', type: 'code' },
        ],
        edges: [{ from: 'a', to: 'b' }],
      }),
    );
    expect(result.success).toBe(true);
  });

  it('parses a full piece with all fields', () => {
    const full = {
      name: 'feature-build',
      version: '2.0',
      goal: 'Build feature',
      personas: [
        {
          name: 'dev',
          role: 'coder',
          specialist: 'coder',
          obligations: ['Write tests'],
          prohibitions: ['No secrets'],
        },
        { name: 'rev', role: 'reviewer' },
      ],
      movements: [
        {
          name: 'code',
          goal: 'Code it',
          assigned_to: 'dev',
          type: 'code',
          goal_gate: 0.8,
          model_config: { tier: 'fast', max_tokens: 5000 },
          retry: { max_attempts: 5, backoff: 'exponential' },
          context_strategy: 'indexed',
          critic: false,
        },
        {
          name: 'review',
          goal: 'Review it',
          assigned_to: 'rev',
          type: 'review',
          goal_gate: 0.9,
          critic: true,
        },
      ],
      edges: [{ from: 'code', to: 'review', condition: 'tests_pass' }],
      rules: { satisfaction_threshold: 0.85 },
    };
    const result = TaktPieceSchema.safeParse(full);
    expect(result.success).toBe(true);
  });
});

// ─── PersonaSchema ────────────────────────────────────────────────────────────

describe('PersonaSchema', () => {
  it('parses minimal persona', () => {
    const result = PersonaSchema.safeParse({ name: 'dev', role: 'coder' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.blind).toBe(false);
      expect(result.data.specialist).toBeNull();
    }
  });

  it('accepts all valid roles', () => {
    const roles = ['lead', 'worker', 'judge', 'summarizer', 'planner', 'coder', 'tester', 'reviewer'];
    for (const role of roles) {
      const result = PersonaSchema.safeParse({ name: 'x', role });
      expect(result.success, `role "${role}" should be valid`).toBe(true);
    }
  });

  it('rejects invalid role', () => {
    const result = PersonaSchema.safeParse({ name: 'x', role: 'ninja' });
    expect(result.success).toBe(false);
  });

  it('accepts optional model', () => {
    const result = PersonaSchema.safeParse({ name: 'x', role: 'coder', model: 'gpt-4o' });
    expect(result.success).toBe(true);
  });

  it('accepts specialist types', () => {
    for (const s of ['coder', 'tester', 'refactorer', 'doc-writer']) {
      const r = PersonaSchema.safeParse({ name: 'x', role: 'worker', specialist: s });
      expect(r.success, `specialist "${s}" should be valid`).toBe(true);
    }
  });

  it('accepts null specialist', () => {
    const r = PersonaSchema.safeParse({ name: 'x', role: 'worker', specialist: null });
    expect(r.success).toBe(true);
  });
});

// ─── MovementSchema ───────────────────────────────────────────────────────────

describe('MovementSchema', () => {
  it('parses minimal movement', () => {
    const result = MovementSchema.safeParse({
      name: 'code',
      goal: 'Write code',
      assigned_to: 'dev',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('code');
      expect(result.data.goal_gate).toBe(0.7);
      expect(result.data.context_strategy).toBe('summary');
      expect(result.data.critic).toBe(false);
    }
  });

  it('accepts all valid types', () => {
    for (const type of ['code', 'test', 'review', 'refactor', 'document']) {
      const r = MovementSchema.safeParse({ name: 'x', goal: 'y', assigned_to: 'z', type });
      expect(r.success, `type "${type}" should be valid`).toBe(true);
    }
  });

  it('rejects invalid type', () => {
    const r = MovementSchema.safeParse({ name: 'x', goal: 'y', assigned_to: 'z', type: 'hack' });
    expect(r.success).toBe(false);
  });

  it('validates goal_gate range [0, 1]', () => {
    expect(
      MovementSchema.safeParse({ name: 'x', goal: 'y', assigned_to: 'z', goal_gate: 0 }).success,
    ).toBe(true);
    expect(
      MovementSchema.safeParse({ name: 'x', goal: 'y', assigned_to: 'z', goal_gate: 1 }).success,
    ).toBe(true);
    expect(
      MovementSchema.safeParse({ name: 'x', goal: 'y', assigned_to: 'z', goal_gate: -0.1 }).success,
    ).toBe(false);
    expect(
      MovementSchema.safeParse({ name: 'x', goal: 'y', assigned_to: 'z', goal_gate: 1.1 }).success,
    ).toBe(false);
  });

  it('accepts all context strategies', () => {
    for (const s of ['full', 'summary', 'minimal', 'indexed']) {
      const r = MovementSchema.safeParse({ name: 'x', goal: 'y', assigned_to: 'z', context_strategy: s });
      expect(r.success, `strategy "${s}" should be valid`).toBe(true);
    }
  });
});

// ─── EdgeSchema ───────────────────────────────────────────────────────────────

describe('EdgeSchema', () => {
  it('parses from + to', () => {
    const r = EdgeSchema.safeParse({ from: 'a', to: 'b' });
    expect(r.success).toBe(true);
  });

  it('rejects missing from', () => {
    const r = EdgeSchema.safeParse({ to: 'b' });
    expect(r.success).toBe(false);
  });

  it('accepts optional condition and weight', () => {
    const r = EdgeSchema.safeParse({ from: 'a', to: 'b', condition: 'tests_pass', weight: 0.5 });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.condition).toBe('tests_pass');
      expect(r.data.weight).toBe(0.5);
    }
  });
});

// ─── RetryConfigSchema ────────────────────────────────────────────────────────

describe('RetryConfigSchema', () => {
  it('applies defaults', () => {
    const r = RetryConfigSchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.max_attempts).toBe(3);
      expect(r.data.backoff).toBe('exponential');
    }
  });

  it('accepts all backoff types', () => {
    for (const backoff of ['fixed', 'linear', 'exponential']) {
      const r = RetryConfigSchema.safeParse({ backoff });
      expect(r.success, `backoff "${backoff}" should be valid`).toBe(true);
    }
  });
});

// ─── RuleSchema ───────────────────────────────────────────────────────────────

describe('RuleSchema', () => {
  it('applies default threshold', () => {
    const r = RuleSchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.satisfaction_threshold).toBe(0.7);
    }
  });

  it('accepts custom threshold', () => {
    const r = RuleSchema.safeParse({ satisfaction_threshold: 0.9 });
    expect(r.success).toBe(true);
  });

  it('rejects out-of-range threshold', () => {
    expect(RuleSchema.safeParse({ satisfaction_threshold: -1 }).success).toBe(false);
    expect(RuleSchema.safeParse({ satisfaction_threshold: 2 }).success).toBe(false);
  });
});

// ─── ModelConfigSchema ────────────────────────────────────────────────────────

describe('ModelConfigSchema', () => {
  it('applies tier default', () => {
    const r = ModelConfigSchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.tier).toBe('sota');
    }
  });

  it('accepts all tiers', () => {
    for (const tier of ['sota', 'fast', 'static']) {
      const r = ModelConfigSchema.safeParse({ tier });
      expect(r.success, `tier "${tier}" should be valid`).toBe(true);
    }
  });

  it('accepts max_tokens', () => {
    const r = ModelConfigSchema.safeParse({ max_tokens: 50000 });
    expect(r.success).toBe(true);
  });

  it('rejects non-positive max_tokens', () => {
    expect(ModelConfigSchema.safeParse({ max_tokens: 0 }).success).toBe(false);
    expect(ModelConfigSchema.safeParse({ max_tokens: -1 }).success).toBe(false);
  });
});

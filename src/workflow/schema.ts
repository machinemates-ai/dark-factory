/**
 * TAKT YAML Zod schemas (D39, enriched A1/D47/D62/D69/D70/D71/D74).
 *
 * Declarative workflow specification with DAG support, deontic specs,
 * model tier strategy, specialist dispatch, and critic gate.
 */

import { z } from 'zod';

// ─── Model Config ─────────────────────────────────────────────────────────────

export const ModelConfigSchema = z.object({
  model: z.string().optional(),
  reasoning: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  tier: z.enum(['sota', 'fast', 'static']).default('sota'),
});

// ─── Retry Config ─────────────────────────────────────────────────────────────

export const RetryConfigSchema = z.object({
  max: z.number().int().positive().default(3),
  backoff: z.enum(['linear', 'exponential']).default('exponential'),
  degradation_mode: z.string().optional(),
});

// ─── Deontic Specs (D62, MOISE+) ─────────────────────────────────────────────

export const DeonticSchema = z.object({
  obligations: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
  prohibitions: z.array(z.string()).default([]),
});

// ─── Edge (DAG) ───────────────────────────────────────────────────────────────

export const EdgeSchema = z.object({
  to: z.string().min(1),
  condition: z.string().optional(),
  weight: z.number().optional(),
});

// ─── Persona ──────────────────────────────────────────────────────────────────

export const PersonaSchema = z.object({
  name: z.string().min(1),
  model: z.string().min(1),
  role: z.enum(['lead', 'worker', 'judge', 'summarizer']),
  blind: z.boolean().default(false),
  specialist: z.enum(['coder', 'tester', 'refactorer', 'doc-writer']).nullable().default(null),
  ...DeonticSchema.shape,
});

// ─── Movement ─────────────────────────────────────────────────────────────────

export const MovementSchema = z.object({
  name: z.string().min(1),
  persona: z.string().min(1),
  inputs: z.array(z.string()).default([]),
  outputs: z.array(z.string()).default([]),
  parallel_count: z.number().int().positive().default(1),
  timeout: z.number().int().positive().optional(),
  goal_gate: z.boolean().default(false),
  model_config: ModelConfigSchema.optional(),
  retry: RetryConfigSchema.optional(),
  context_strategy: z.enum(['full', 'summary', 'minimal', 'indexed']).default('summary'),
  edges: z.array(EdgeSchema).default([]),
  type: z.enum(['standard', 'fan_out', 'fan_in']).default('standard'),
  critic: z.boolean().default(false),
});

// ─── Rule ─────────────────────────────────────────────────────────────────────

export const RuleSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  condition: z.string().optional(),
  failure_action: z.enum(['retry', 'skip', 'abort']).default('retry'),
  satisfaction_threshold: z.number().min(0).max(1).default(0.7),
});

// ─── TaktPiece (top-level workflow) ───────────────────────────────────────────

export const TaktPieceSchema = z.object({
  metadata: z.object({
    name: z.string().min(1),
    version: z.string().default('1.0.0'),
    description: z.string().optional(),
  }),
  personas: z.array(PersonaSchema).min(1),
  movements: z.array(MovementSchema).min(1),
  rules: z.array(RuleSchema).default([]),
}).refine(
  (piece) => {
    // Validate fan_out movements have ≥2 edges
    for (const m of piece.movements) {
      if (m.type === 'fan_out' && m.edges.length < 2) return false;
    }
    return true;
  },
  { message: 'fan_out movements must have ≥2 edges' },
).refine(
  (piece) => {
    // Validate all persona references in movements exist
    const personaNames = new Set(piece.personas.map((p) => p.name));
    return piece.movements.every((m) => personaNames.has(m.persona));
  },
  { message: 'All movement persona references must match a defined persona' },
);

export type TaktPiece = z.infer<typeof TaktPieceSchema>;
export type Persona = z.infer<typeof PersonaSchema>;
export type Movement = z.infer<typeof MovementSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type ModelConfig = z.infer<typeof ModelConfigSchema>;

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
  max_tokens: z.number().int().positive().optional(),
});

// ─── Retry Config ─────────────────────────────────────────────────────────────

export const RetryConfigSchema = z.object({
  max_attempts: z.number().int().positive().default(3),
  backoff: z.enum(['fixed', 'linear', 'exponential']).default('exponential'),
  degradation_mode: z.string().optional(),
});

// ─── Deontic Specs (D62, MOISE+) ─────────────────────────────────────────────

export const DeonticSchema = z.object({
  obligations: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
  prohibitions: z.array(z.string()).default([]),
});

// ─── Edge (DAG) — top-level, with from + to ──────────────────────────────────

export const EdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  condition: z.string().optional(),
  weight: z.number().optional(),
});

// ─── Persona ──────────────────────────────────────────────────────────────────

export const PersonaSchema = z.object({
  name: z.string().min(1),
  model: z.string().optional(),
  role: z.enum([
    'lead', 'worker', 'judge', 'summarizer',
    'planner', 'coder', 'tester', 'reviewer',
  ]),
  blind: z.boolean().default(false),
  specialist: z.enum(['coder', 'tester', 'refactorer', 'doc-writer']).nullable().default(null),
  ...DeonticSchema.shape,
});

// ─── Movement ─────────────────────────────────────────────────────────────────

export const MovementSchema = z.object({
  name: z.string().min(1),
  goal: z.string().min(1),
  assigned_to: z.string().min(1),
  type: z.enum(['code', 'test', 'review', 'refactor', 'document']).default('code'),
  goal_gate: z.number().min(0).max(1).default(0.7),
  model_config: ModelConfigSchema.optional(),
  retry: RetryConfigSchema.optional(),
  context_strategy: z.enum(['full', 'summary', 'minimal', 'indexed']).default('summary'),
  inputs: z.array(z.string()).default([]),
  outputs: z.array(z.string()).default([]),
  critic: z.boolean().default(false),
  timeout: z.number().int().positive().optional(),
});

// ─── Rule ─────────────────────────────────────────────────────────────────────

export const RuleSchema = z.object({
  satisfaction_threshold: z.number().min(0).max(1).default(0.7),
});

// ─── TaktPiece (top-level workflow) ───────────────────────────────────────────

export const TaktPieceSchema = z.object({
  name: z.string().min(1),
  version: z.string().default('1.0'),
  goal: z.string().min(1),
  personas: z.array(PersonaSchema).min(1),
  movements: z.array(MovementSchema).min(1),
  edges: z.array(EdgeSchema).default([]),
  rules: z.preprocess(
    (v) => v ?? undefined,
    RuleSchema.default({ satisfaction_threshold: 0.7 }),
  ),
}).refine(
  (piece) => {
    // Validate all assigned_to references in movements exist as persona names
    const personaNames = new Set(piece.personas.map((p) => p.name));
    return piece.movements.every((m) => personaNames.has(m.assigned_to));
  },
  { message: 'All movement assigned_to references must match a defined persona' },
).refine(
  (piece) => {
    // Validate all edge from/to references exist as movement names
    const movementNames = new Set(piece.movements.map((m) => m.name));
    return piece.edges.every(
      (e) => movementNames.has(e.from) && movementNames.has(e.to),
    );
  },
  { message: 'All edge from/to references must match a defined movement' },
);

export type TaktPiece = z.infer<typeof TaktPieceSchema>;
export type Persona = z.infer<typeof PersonaSchema>;
export type Movement = z.infer<typeof MovementSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type ModelConfig = z.infer<typeof ModelConfigSchema>;

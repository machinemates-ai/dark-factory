/**
 * A2A-inspired TaskResult type (D58/D59).
 *
 * 7 lifecycle states + typed Artifact[] with TextPart / FilePart / DataPart.
 * This is the canonical result shape emitted by all agents onto the bus.
 */

import { z } from 'zod';

// ─── Part Schemas ─────────────────────────────────────────────────────────────

export const TextPartSchema = z.object({
  kind: z.literal('text'),
  text: z.string(),
});

export const FilePartSchema = z.object({
  kind: z.literal('file'),
  uri: z.string(),
  mimeType: z.string(),
});

export const DataPartSchema = z.object({
  kind: z.literal('data'),
  data: z.record(z.unknown()),
});

export const ArtifactPartSchema = z.discriminatedUnion('kind', [
  TextPartSchema,
  FilePartSchema,
  DataPartSchema,
]);

// ─── Artifact Schema ──────────────────────────────────────────────────────────

export const ArtifactSchema = z.object({
  name: z.string().min(1),
  mimeType: z.string().min(1),
  parts: z.array(ArtifactPartSchema).min(1),
});

// ─── Task Status Schema ───────────────────────────────────────────────────────

export const TaskStatusSchema = z.enum([
  'submitted',
  'working',
  'input-required',
  'auth-required',
  'completed',
  'failed',
  'canceled',
]);

// ─── TaskResult Schema ────────────────────────────────────────────────────────

export const TaskResultSchema = z.object({
  taskId: z.string().min(1),
  runId: z.string().min(1),
  status: TaskStatusSchema,
  artifacts: z.array(ArtifactSchema),
  tokensUsed: z.number().int().nonnegative().optional(),
  cost: z.number().nonnegative().optional(),
  error: z.string().optional(),
});

export type TaskResultData = z.infer<typeof TaskResultSchema>;

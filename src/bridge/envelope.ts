/**
 * CloudEvents envelope schema (D57).
 *
 * Every message on the bus follows CNCF CloudEvents 1.0 metadata shape.
 * Implemented as a Zod schema — no cloudevents-sdk dependency.
 */

import { z } from 'zod';

// ─── CloudEvents Envelope ─────────────────────────────────────────────────────

export const CloudEventSchema = z.object({
  /** Unique event identifier (UUID v4). */
  id: z.string().uuid(),
  /** Identifies the emitting agent (e.g., 'codex-agent/{taskId}', 'validator/{taskId}/L2'). */
  source: z.string().min(1),
  /** Event type mapped to bus topic (e.g., 'task.submitted', 'validation.L2.passed'). */
  type: z.string().min(1),
  /** ISO 8601 timestamp. */
  time: z.string().datetime(),
  /** Content type of the data field. */
  datacontenttype: z.literal('application/json'),
  /** Event payload — typed per event type. */
  data: z.unknown(),
});

export type CloudEvent<T = unknown> = z.infer<typeof CloudEventSchema> & {
  readonly data: T;
};

// ─── Bus Event (typed wrapper) ────────────────────────────────────────────────

export interface BusEvent<T = unknown> {
  readonly id: string;
  readonly source: string;
  readonly type: string;
  readonly time: string;
  readonly datacontenttype: 'application/json';
  readonly data: T;
}

// ─── Event Factory ────────────────────────────────────────────────────────────

export function createBusEvent<T>(
  source: string,
  type: string,
  data: T,
): BusEvent<T> {
  return {
    id: crypto.randomUUID(),
    source,
    type,
    time: new Date().toISOString(),
    datacontenttype: 'application/json',
    data,
  };
}

/**
 * Tests for A2A TaskResult schema (bridge/task-result.ts).
 */

import { describe, it, expect } from 'vitest';
import {
  TaskResultSchema,
  ArtifactSchema,
  ArtifactPartSchema,
  TaskStatusSchema,
} from '../../../src/bridge/task-result.js';

describe('TaskStatusSchema', () => {
  it('accepts all 7 statuses', () => {
    const valid = ['submitted', 'working', 'input-required', 'auth-required', 'completed', 'failed', 'canceled'];
    for (const s of valid) {
      expect(TaskStatusSchema.safeParse(s).success, `status "${s}" should be valid`).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    expect(TaskStatusSchema.safeParse('pending').success).toBe(false);
  });
});

describe('ArtifactPartSchema', () => {
  it('parses text part', () => {
    const r = ArtifactPartSchema.safeParse({ kind: 'text', text: 'hello' });
    expect(r.success).toBe(true);
  });

  it('parses file part', () => {
    const r = ArtifactPartSchema.safeParse({ kind: 'file', uri: '/tmp/a.ts', mimeType: 'text/typescript' });
    expect(r.success).toBe(true);
  });

  it('parses data part', () => {
    const r = ArtifactPartSchema.safeParse({ kind: 'data', data: { key: 42 } });
    expect(r.success).toBe(true);
  });

  it('rejects unknown kind', () => {
    const r = ArtifactPartSchema.safeParse({ kind: 'binary', data: 'abc' });
    expect(r.success).toBe(false);
  });
});

describe('ArtifactSchema', () => {
  it('requires at least one part', () => {
    const valid = ArtifactSchema.safeParse({ name: 'output', mimeType: 'text/plain', parts: [{ kind: 'text', text: 'x' }] });
    expect(valid.success).toBe(true);
    const empty = ArtifactSchema.safeParse({ name: 'output', mimeType: 'text/plain', parts: [] });
    expect(empty.success).toBe(false);
  });
});

describe('TaskResultSchema', () => {
  it('parses a complete task result', () => {
    const result = TaskResultSchema.safeParse({
      taskId: 'task-1',
      runId: 'run-1',
      status: 'completed',
      artifacts: [
        { name: 'code', mimeType: 'text/typescript', parts: [{ kind: 'text', text: 'const x = 1;' }] },
      ],
      tokensUsed: 1500,
      cost: 0.003,
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty artifacts array', () => {
    const result = TaskResultSchema.safeParse({
      taskId: 'task-1',
      runId: 'run-1',
      status: 'failed',
      artifacts: [],
      error: 'Something went wrong',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = TaskResultSchema.safeParse({ taskId: 't' });
    expect(result.success).toBe(false);
  });
});

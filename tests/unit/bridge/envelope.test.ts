/**
 * Tests for CloudEvents envelope + BusEvent factory (bridge/envelope.ts).
 */

import { describe, it, expect } from 'vitest';
import { createBusEvent, CloudEventSchema } from '../../../src/bridge/envelope.js';

describe('createBusEvent', () => {
  it('creates a well-formed bus event', () => {
    const event = createBusEvent('agent/task-1', 'task.submitted', { x: 1 });
    expect(event.source).toBe('agent/task-1');
    expect(event.type).toBe('task.submitted');
    expect(event.data).toEqual({ x: 1 });
    expect(event.datacontenttype).toBe('application/json');
    expect(event.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(new Date(event.time).getTime()).not.toBeNaN();
  });

  it('generates unique IDs', () => {
    const a = createBusEvent('s', 't', null);
    const b = createBusEvent('s', 't', null);
    expect(a.id).not.toBe(b.id);
  });
});

describe('CloudEventSchema', () => {
  it('validates a well-formed event', () => {
    const event = createBusEvent('source', 'type', { key: 'value' });
    const result = CloudEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('rejects event without id', () => {
    const result = CloudEventSchema.safeParse({
      source: 's',
      type: 't',
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid UUID format', () => {
    const result = CloudEventSchema.safeParse({
      id: 'not-a-uuid',
      source: 's',
      type: 't',
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: {},
    });
    expect(result.success).toBe(false);
  });
});

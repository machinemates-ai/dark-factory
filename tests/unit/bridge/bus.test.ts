/**
 * Tests for the message bus (bridge/bus.ts).
 */

import { describe, it, expect, vi } from 'vitest';
import { createBus } from '../../../src/bridge/bus.js';
import { createBusEvent } from '../../../src/bridge/envelope.js';

describe('createBus', () => {
  it('delivers events to subscribers', () => {
    const bus = createBus();
    const handler = vi.fn();
    bus.on('topic.a', handler);
    const event = createBusEvent('src', 'topic.a', { msg: 'hello' });
    bus.emit('topic.a', event);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('supports multiple subscribers on same topic', () => {
    const bus = createBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('t', h1);
    bus.on('t', h2);
    bus.emit('t', createBusEvent('s', 't', null));
    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it('does not deliver to different topics', () => {
    const bus = createBus();
    const handler = vi.fn();
    bus.on('topic.a', handler);
    bus.emit('topic.b', createBusEvent('s', 'topic.b', null));
    expect(handler).not.toHaveBeenCalled();
  });

  it('unsubscribes correctly', () => {
    const bus = createBus();
    const handler = vi.fn();
    const unsub = bus.on('t', handler);
    unsub();
    bus.emit('t', createBusEvent('s', 't', null));
    expect(handler).not.toHaveBeenCalled();
  });

  it('once fires only once', () => {
    const bus = createBus();
    const handler = vi.fn();
    bus.once('t', handler);
    bus.emit('t', createBusEvent('s', 't', 1));
    bus.emit('t', createBusEvent('s', 't', 2));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('removeAll by topic', () => {
    const bus = createBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('a', h1);
    bus.on('b', h2);
    bus.removeAll('a');
    bus.emit('a', createBusEvent('s', 'a', null));
    bus.emit('b', createBusEvent('s', 'b', null));
    expect(h1).not.toHaveBeenCalled();
    expect(h2).toHaveBeenCalledOnce();
  });

  it('removeAll without topic clears everything', () => {
    const bus = createBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('a', h1);
    bus.on('b', h2);
    bus.removeAll();
    bus.emit('a', createBusEvent('s', 'a', null));
    bus.emit('b', createBusEvent('s', 'b', null));
    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });
});

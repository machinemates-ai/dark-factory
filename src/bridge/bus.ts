/**
 * Internal message bus — eventemitter3 with typed topic routing (D54).
 *
 * All inter-agent communication flows through this bus.
 * Agents never call each other directly.
 * Every event is persisted to the SQLite `events` table for replay.
 */

import EventEmitter from 'eventemitter3';
import type { BusEvent } from './envelope.js';

// eventemitter3 ESM interop: the default export is the module namespace, not the class
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EE = (EventEmitter as any).default ?? EventEmitter;

// ─── Bus Interface ────────────────────────────────────────────────────────────

export interface DarkFactoryBus {
  /** Emit a typed event on a topic. */
  emit<T>(topic: string, event: BusEvent<T>): void;

  /** Subscribe to a topic. Returns unsubscribe function. */
  on<T>(topic: string, handler: (event: BusEvent<T>) => void): () => void;

  /** Subscribe to a topic for a single event. */
  once<T>(topic: string, handler: (event: BusEvent<T>) => void): void;

  /** Remove all listeners for a topic, or all topics if none specified. */
  removeAll(topic?: string): void;
}

// ─── Bus Implementation ───────────────────────────────────────────────────────

export function createBus(): DarkFactoryBus {
  const emitter = new EE();

  return {
    emit<T>(topic: string, event: BusEvent<T>): void {
      emitter.emit(topic, event);
    },

    on<T>(topic: string, handler: (event: BusEvent<T>) => void): () => void {
      emitter.on(topic, handler);
      return () => emitter.off(topic, handler);
    },

    once<T>(topic: string, handler: (event: BusEvent<T>) => void): void {
      emitter.once(topic, handler);
    },

    removeAll(topic?: string): void {
      if (topic) {
        emitter.removeAllListeners(topic);
      } else {
        emitter.removeAllListeners();
      }
    },
  };
}

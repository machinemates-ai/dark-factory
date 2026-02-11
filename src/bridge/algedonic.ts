/**
 * Algedonic loop — emergency bypass channel (D61, Beer).
 *
 * Highest-priority bus subscriber that short-circuits normal gate progression
 * for catastrophic failures. The algedonic channel preempts all other handlers.
 */

import type { DarkFactoryBus } from './bus.js';
import { createBusEvent } from './envelope.js';
import type { AlgedonicSeverity } from '../agents/types.js';

// ─── Algedonic Event Data ─────────────────────────────────────────────────────

export interface AlgedonicEventData {
  readonly runId: string;
  readonly severity: AlgedonicSeverity;
  readonly trigger: AlgedonicTrigger;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

export type AlgedonicTrigger =
  | 'cost-limit'
  | 'security-violation'
  | 'retry-loop'
  | 'score-collapse'
  | 'entropy-spike'
  | 'token-exhaustion';

// ─── Algedonic Handler ────────────────────────────────────────────────────────

export type AlgedonicAction =
  | { type: 'continue' }
  | { type: 'pause'; reason: string }
  | { type: 'shutdown'; reason: string };

export interface AlgedonicHandler {
  onInfo(event: AlgedonicEventData): AlgedonicAction;
  onWarning(event: AlgedonicEventData): AlgedonicAction;
  onError(event: AlgedonicEventData): AlgedonicAction;
  onCritical(event: AlgedonicEventData): AlgedonicAction;
  onFatal(event: AlgedonicEventData): AlgedonicAction;
}

// ─── Default Handler ──────────────────────────────────────────────────────────

export const defaultAlgedonicHandler: AlgedonicHandler = {
  onInfo(_event) {
    return { type: 'continue' };
  },
  onWarning(_event) {
    return { type: 'continue' };
  },
  onError(event) {
    return { type: 'pause', reason: event.message };
  },
  onCritical(event) {
    return { type: 'pause', reason: event.message };
  },
  onFatal(event) {
    return { type: 'shutdown', reason: event.message };
  },
};

// ─── Wire Algedonic to Bus ────────────────────────────────────────────────────

export function wireAlgedonic(
  bus: DarkFactoryBus,
  runId: string,
  handler: AlgedonicHandler = defaultAlgedonicHandler,
): () => void {
  const severities: AlgedonicSeverity[] = ['info', 'warning', 'error', 'critical', 'fatal'];
  const unsubscribers: (() => void)[] = [];

  for (const severity of severities) {
    const topic = `algedonic.${runId}.${severity}`;
    const unsub = bus.on<AlgedonicEventData>(topic, (event) => {
      const data = event.data;
      switch (data.severity) {
        case 'info':
          handler.onInfo(data);
          break;
        case 'warning':
          handler.onWarning(data);
          break;
        case 'error':
          handler.onError(data);
          break;
        case 'critical':
          handler.onCritical(data);
          break;
        case 'fatal':
          handler.onFatal(data);
          break;
      }
    });
    unsubscribers.push(unsub);
  }

  return () => {
    for (const unsub of unsubscribers) {
      unsub();
    }
  };
}

// ─── Emit Algedonic Event ─────────────────────────────────────────────────────

export function emitAlgedonic(
  bus: DarkFactoryBus,
  runId: string,
  severity: AlgedonicSeverity,
  trigger: AlgedonicTrigger,
  message: string,
  details?: Record<string, unknown>,
): void {
  const data: AlgedonicEventData = { runId, severity, trigger, message, details };
  const topic = `algedonic.${runId}.${severity}`;
  bus.emit(topic, createBusEvent(`algedonic/${runId}`, topic, data));
}

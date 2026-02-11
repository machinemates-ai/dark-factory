/**
 * Tests for algedonic loop (bridge/algedonic.ts).
 */

import { describe, it, expect, vi } from 'vitest';
import { createBus } from '../../../src/bridge/bus.js';
import {
  wireAlgedonic,
  emitAlgedonic,
  defaultAlgedonicHandler,
  type AlgedonicHandler,
} from '../../../src/bridge/algedonic.js';

describe('defaultAlgedonicHandler', () => {
  const baseEvent = {
    runId: 'run-1',
    severity: 'info' as const,
    trigger: 'cost-limit' as const,
    message: 'test',
  };

  it('returns continue for info', () => {
    expect(defaultAlgedonicHandler.onInfo(baseEvent).type).toBe('continue');
  });

  it('returns continue for warning', () => {
    expect(defaultAlgedonicHandler.onWarning({ ...baseEvent, severity: 'warning' }).type).toBe('continue');
  });

  it('returns pause for error', () => {
    const action = defaultAlgedonicHandler.onError({ ...baseEvent, severity: 'error' });
    expect(action.type).toBe('pause');
  });

  it('returns pause for critical', () => {
    const action = defaultAlgedonicHandler.onCritical({ ...baseEvent, severity: 'critical' });
    expect(action.type).toBe('pause');
  });

  it('returns shutdown for fatal', () => {
    const action = defaultAlgedonicHandler.onFatal({ ...baseEvent, severity: 'fatal' });
    expect(action.type).toBe('shutdown');
  });
});

describe('wireAlgedonic + emitAlgedonic', () => {
  it('routes info events', () => {
    const bus = createBus();
    const handler: AlgedonicHandler = {
      onInfo: vi.fn(() => ({ type: 'continue' as const })),
      onWarning: vi.fn(() => ({ type: 'continue' as const })),
      onError: vi.fn(() => ({ type: 'pause' as const, reason: '' })),
      onCritical: vi.fn(() => ({ type: 'pause' as const, reason: '' })),
      onFatal: vi.fn(() => ({ type: 'shutdown' as const, reason: '' })),
    };

    wireAlgedonic(bus, 'run-1', handler);
    emitAlgedonic(bus, 'run-1', 'info', 'cost-limit', 'under budget');

    expect(handler.onInfo).toHaveBeenCalledOnce();
    expect(handler.onWarning).not.toHaveBeenCalled();
  });

  it('routes warning events', () => {
    const bus = createBus();
    const handler: AlgedonicHandler = {
      onInfo: vi.fn(() => ({ type: 'continue' as const })),
      onWarning: vi.fn(() => ({ type: 'continue' as const })),
      onError: vi.fn(() => ({ type: 'pause' as const, reason: '' })),
      onCritical: vi.fn(() => ({ type: 'pause' as const, reason: '' })),
      onFatal: vi.fn(() => ({ type: 'shutdown' as const, reason: '' })),
    };

    wireAlgedonic(bus, 'run-1', handler);
    emitAlgedonic(bus, 'run-1', 'warning', 'token-exhaustion', 'running low');

    expect(handler.onWarning).toHaveBeenCalledOnce();
  });

  it('routes fatal events', () => {
    const bus = createBus();
    const handler: AlgedonicHandler = {
      onInfo: vi.fn(() => ({ type: 'continue' as const })),
      onWarning: vi.fn(() => ({ type: 'continue' as const })),
      onError: vi.fn(() => ({ type: 'pause' as const, reason: '' })),
      onCritical: vi.fn(() => ({ type: 'pause' as const, reason: '' })),
      onFatal: vi.fn(() => ({ type: 'shutdown' as const, reason: '' })),
    };

    wireAlgedonic(bus, 'run-1', handler);
    emitAlgedonic(bus, 'run-1', 'fatal', 'security-violation', 'breach detected');

    expect(handler.onFatal).toHaveBeenCalledOnce();
  });

  it('unsubscribes correctly', () => {
    const bus = createBus();
    const handler: AlgedonicHandler = {
      onInfo: vi.fn(() => ({ type: 'continue' as const })),
      onWarning: vi.fn(() => ({ type: 'continue' as const })),
      onError: vi.fn(() => ({ type: 'pause' as const, reason: '' })),
      onCritical: vi.fn(() => ({ type: 'pause' as const, reason: '' })),
      onFatal: vi.fn(() => ({ type: 'shutdown' as const, reason: '' })),
    };

    const unsub = wireAlgedonic(bus, 'run-1', handler);
    unsub();
    emitAlgedonic(bus, 'run-1', 'fatal', 'security-violation', 'x');

    expect(handler.onFatal).not.toHaveBeenCalled();
  });

  it('isolates by runId', () => {
    const bus = createBus();
    const handler: AlgedonicHandler = {
      onInfo: vi.fn(() => ({ type: 'continue' as const })),
      onWarning: vi.fn(() => ({ type: 'continue' as const })),
      onError: vi.fn(() => ({ type: 'pause' as const, reason: '' })),
      onCritical: vi.fn(() => ({ type: 'pause' as const, reason: '' })),
      onFatal: vi.fn(() => ({ type: 'shutdown' as const, reason: '' })),
    };

    wireAlgedonic(bus, 'run-1', handler);
    emitAlgedonic(bus, 'run-2', 'fatal', 'security-violation', 'wrong run');

    expect(handler.onFatal).not.toHaveBeenCalled();
  });
});

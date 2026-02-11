/**
 * Tests for bus topics and event type constants (bridge/topics.ts).
 */

import { describe, it, expect } from 'vitest';
import { Topics, EventTypes } from '../../../src/bridge/topics.js';

describe('Topics', () => {
  it('generates task topic with runId and status', () => {
    expect(Topics.task('run-1', 'completed')).toBe('task.run-1.completed');
  });

  it('generates validation topic with taskId and gate', () => {
    expect(Topics.validation('task-1', 'L2')).toBe('validation.task-1.L2');
  });

  it('generates context topic with runId', () => {
    expect(Topics.context('run-1')).toBe('context.run-1.updated');
  });

  it('generates algedonic topic with runId and severity', () => {
    expect(Topics.algedonic('run-1', 'critical')).toBe('algedonic.run-1.critical');
  });

  it('generates entropy topic with runId', () => {
    expect(Topics.entropy('run-1')).toBe('entropy.run-1.alert');
  });
});

describe('EventTypes', () => {
  it('has all 7 task lifecycle events', () => {
    expect(EventTypes.TASK_SUBMITTED).toBe('task.submitted');
    expect(EventTypes.TASK_WORKING).toBe('task.working');
    expect(EventTypes.TASK_COMPLETED).toBe('task.completed');
    expect(EventTypes.TASK_FAILED).toBe('task.failed');
    expect(EventTypes.TASK_INPUT_REQUIRED).toBe('task.input-required');
    expect(EventTypes.TASK_AUTH_REQUIRED).toBe('task.auth-required');
    expect(EventTypes.TASK_CANCELED).toBe('task.canceled');
  });

  it('has validation events for all gates', () => {
    expect(EventTypes.VALIDATION_L0_PASSED).toBe('validation.L0.passed');
    expect(EventTypes.VALIDATION_L0_FAILED).toBe('validation.L0.failed');
    expect(EventTypes.VALIDATION_L1_PASSED).toBe('validation.L1.passed');
    expect(EventTypes.VALIDATION_L1_FAILED).toBe('validation.L1.failed');
    expect(EventTypes.VALIDATION_L15_PASSED).toBe('validation.L1.5.passed');
    expect(EventTypes.VALIDATION_L15_REVISE).toBe('validation.L1.5.revise');
    expect(EventTypes.VALIDATION_L15_REJECT).toBe('validation.L1.5.reject');
    expect(EventTypes.VALIDATION_L2_PASSED).toBe('validation.L2.passed');
    expect(EventTypes.VALIDATION_L2_FAILED).toBe('validation.L2.failed');
    expect(EventTypes.VALIDATION_L3_PASSED).toBe('validation.L3.passed');
    expect(EventTypes.VALIDATION_L3_FAILED).toBe('validation.L3.failed');
  });

  it('has algedonic event types', () => {
    expect(EventTypes.ALGEDONIC_WARNING).toBe('algedonic.warning');
    expect(EventTypes.ALGEDONIC_CRITICAL).toBe('algedonic.critical');
    expect(EventTypes.ALGEDONIC_FATAL).toBe('algedonic.fatal');
  });

  it('has context and entropy events', () => {
    expect(EventTypes.CONTEXT_UPDATED).toBe('context.updated');
    expect(EventTypes.ENTROPY_ALERT).toBe('entropy.alert');
  });
});

/**
 * Bus topic constants and type-safe subscription helpers (D57).
 *
 * Topic naming convention: `{domain}.{qualifier}.{event}`
 * All inter-agent communication flows through these topics.
 */

// ─── Topic Templates ──────────────────────────────────────────────────────────

export const Topics = {
  /** Task lifecycle events. */
  task: (runId: string, status: string) => `task.${runId}.${status}` as const,

  /** Validation gate results. */
  validation: (taskId: string, gate: string) =>
    `validation.${taskId}.${gate}` as const,

  /** Context Store updates. */
  context: (runId: string) => `context.${runId}.updated` as const,

  /** Algedonic emergency bypass. */
  algedonic: (runId: string, severity: string) =>
    `algedonic.${runId}.${severity}` as const,

  /** Edit-distance entropy alerts. */
  entropy: (runId: string) => `entropy.${runId}.alert` as const,
} as const;

// ─── Common Event Types ───────────────────────────────────────────────────────

export const EventTypes = {
  // Task lifecycle
  TASK_SUBMITTED: 'task.submitted',
  TASK_WORKING: 'task.working',
  TASK_COMPLETED: 'task.completed',
  TASK_FAILED: 'task.failed',
  TASK_INPUT_REQUIRED: 'task.input-required',
  TASK_AUTH_REQUIRED: 'task.auth-required',
  TASK_CANCELED: 'task.canceled',

  // Validation gates
  VALIDATION_L0_PASSED: 'validation.L0.passed',
  VALIDATION_L0_FAILED: 'validation.L0.failed',
  VALIDATION_L1_PASSED: 'validation.L1.passed',
  VALIDATION_L1_FAILED: 'validation.L1.failed',
  VALIDATION_L15_PASSED: 'validation.L1.5.passed',
  VALIDATION_L15_REVISE: 'validation.L1.5.revise',
  VALIDATION_L15_REJECT: 'validation.L1.5.reject',
  VALIDATION_L2_PASSED: 'validation.L2.passed',
  VALIDATION_L2_FAILED: 'validation.L2.failed',
  VALIDATION_L3_PASSED: 'validation.L3.passed',
  VALIDATION_L3_FAILED: 'validation.L3.failed',

  // Context
  CONTEXT_UPDATED: 'context.updated',

  // Algedonic
  ALGEDONIC_WARNING: 'algedonic.warning',
  ALGEDONIC_CRITICAL: 'algedonic.critical',
  ALGEDONIC_FATAL: 'algedonic.fatal',

  // Entropy
  ENTROPY_ALERT: 'entropy.alert',
} as const;

/**
 * Integration tests for SQLite ledger (migrations + queries).
 *
 * Uses :memory: database — no filesystem side effects.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { openLedger } from '../../../src/ledger/migrations.js';
import {
  createRun,
  getRun,
  updateRunStatus,
  createTask,
  getTasksByRun,
  insertEvent,
  getEventsByTask,
  getEventsByRun,
  updateTaskStatus,
  updateTaskAgent,
  updateTaskTokens,
  updateRunTokens,
  incrementEntropyAlerts,
  insertContextSummary,
  getContextSummariesByRun,
  invalidateContextSummary,
} from '../../../src/ledger/queries.js';

describe('ledger (SQLite)', () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = openLedger(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  // ─── Migrations ─────────────────────────────────────────────────────────────

  it('creates all expected tables', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as Array<{ name: string }>;

    const names = tables.map((t) => t.name);
    expect(names).toContain('runs');
    expect(names).toContain('tasks');
    expect(names).toContain('events');
    expect(names).toContain('context_summaries');
    expect(names).toContain('_migrations');
  });

  it('is idempotent (double open)', () => {
    const db2 = openLedger(':memory:');
    const tables = db2
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as Array<{ name: string }>;
    expect(tables.length).toBeGreaterThan(0);
    db2.close();
  });

  // ─── Run CRUD ───────────────────────────────────────────────────────────────

  it('creates and retrieves a run', () => {
    createRun(db, 'run-1', 'name: test\ngoal: x');
    const run = getRun(db, 'run-1');
    expect(run).toBeDefined();
    expect(run!.id).toBe('run-1');
    expect(run!.status).toBe('planned');
    expect(run!.total_tokens).toBe(0);
  });

  it('returns undefined for nonexistent run', () => {
    expect(getRun(db, 'nonexistent')).toBeUndefined();
  });

  it('updates run status', () => {
    createRun(db, 'run-1', 'yaml');
    updateRunStatus(db, 'run-1', 'running');
    expect(getRun(db, 'run-1')!.status).toBe('running');
  });

  it('sets completed_at when status is completed', () => {
    createRun(db, 'run-1', 'yaml');
    updateRunStatus(db, 'run-1', 'completed');
    const run = getRun(db, 'run-1')!;
    expect(run.status).toBe('completed');
    expect(run.completed_at).not.toBeNull();
  });

  // ─── Task CRUD ──────────────────────────────────────────────────────────────

  it('creates and retrieves tasks', () => {
    createRun(db, 'run-1', 'yaml');
    createTask(db, {
      id: 'task-1',
      runId: 'run-1',
      movementName: 'implement',
      dependsOn: [],
      specialistType: null,
    });
    const tasks = getTasksByRun(db, 'run-1');
    expect(tasks).toHaveLength(1);
    expect(tasks[0]!.id).toBe('task-1');
    expect(tasks[0]!.movement_name).toBe('implement');
    expect(tasks[0]!.status).toBe('pending');
  });

  // ─── Event Logging ──────────────────────────────────────────────────────────

  it('records and retrieves events by task', () => {
    createRun(db, 'run-1', 'yaml');
    createTask(db, {
      id: 'task-1',
      runId: 'run-1',
      movementName: 'code',
      dependsOn: [],
      specialistType: null,
    });
    insertEvent(db, {
      id: 'evt-1',
      runId: 'run-1',
      taskId: 'task-1',
      eventType: 'task.started',
      payload: JSON.stringify({ foo: 'bar' }),
    });
    const events = getEventsByTask(db, 'task-1');
    expect(events).toHaveLength(1);
    expect(events[0]!.event_type).toBe('task.started');
    expect(JSON.parse(events[0]!.payload)).toEqual({ foo: 'bar' });
  });

  it('retrieves events by run including global events', () => {
    createRun(db, 'run-1', 'yaml');
    createTask(db, {
      id: 'task-1',
      runId: 'run-1',
      movementName: 'code',
      dependsOn: [],
      specialistType: null,
    });
    // Task-associated event
    insertEvent(db, {
      id: 'evt-1',
      runId: 'run-1',
      taskId: 'task-1',
      eventType: 'task.completed',
      payload: '{}',
    });
    // Global event (no task) — e.g., algedonic
    insertEvent(db, {
      id: 'evt-2',
      runId: 'run-1',
      taskId: null,
      eventType: 'algedonic.critical',
      payload: JSON.stringify({ trigger: 'cost-limit' }),
    });
    const events = getEventsByRun(db, 'run-1');
    expect(events).toHaveLength(2);
    expect(events.some((e) => e.task_id === null)).toBe(true);
    expect(events.some((e) => e.event_type === 'algedonic.critical')).toBe(true);
  });

  it('event row includes run_id', () => {
    createRun(db, 'run-1', 'yaml');
    insertEvent(db, {
      id: 'evt-1',
      runId: 'run-1',
      taskId: null,
      eventType: 'entropy.alert',
      payload: '{}',
    });
    const events = getEventsByRun(db, 'run-1');
    expect(events[0]!.run_id).toBe('run-1');
  });

  // ─── Task Lifecycle Updates ─────────────────────────────────────────────────

  it('updateTaskStatus transitions task lifecycle', () => {
    createRun(db, 'run-1', 'yaml');
    createTask(db, {
      id: 'task-1',
      runId: 'run-1',
      movementName: 'code',
      dependsOn: [],
      specialistType: null,
    });
    expect(getTasksByRun(db, 'run-1')[0]!.status).toBe('pending');

    updateTaskStatus(db, 'task-1', 'assigned');
    expect(getTasksByRun(db, 'run-1')[0]!.status).toBe('assigned');

    updateTaskStatus(db, 'task-1', 'running');
    expect(getTasksByRun(db, 'run-1')[0]!.status).toBe('running');

    updateTaskStatus(db, 'task-1', 'completed');
    const task = getTasksByRun(db, 'run-1')[0]!;
    expect(task.status).toBe('completed');
    expect(task.completed_at).not.toBeNull();
  });

  it('updateTaskAgent sets agent_id and thread_id', () => {
    createRun(db, 'run-1', 'yaml');
    createTask(db, {
      id: 'task-1',
      runId: 'run-1',
      movementName: 'code',
      dependsOn: [],
      specialistType: null,
    });
    updateTaskAgent(db, 'task-1', 'codex-42', 'thread-abc');
    const task = getTasksByRun(db, 'run-1')[0]!;
    expect(task.agent_id).toBe('codex-42');
    expect(task.thread_id).toBe('thread-abc');
  });

  it('updateTaskTokens stores token usage and entropy', () => {
    createRun(db, 'run-1', 'yaml');
    createTask(db, {
      id: 'task-1',
      runId: 'run-1',
      movementName: 'code',
      dependsOn: [],
      specialistType: null,
    });
    updateTaskTokens(db, 'task-1', 4500, 0.31);
    const task = getTasksByRun(db, 'run-1')[0]!;
    expect(task.tokens_used).toBe(4500);
    expect(task.edit_entropy).toBeCloseTo(0.31);
  });

  // ─── Run Metric Updates ─────────────────────────────────────────────────────

  it('updateRunTokens incrementally adds tokens and cost', () => {
    createRun(db, 'run-1', 'yaml');
    updateRunTokens(db, 'run-1', 1000, 0.05);
    updateRunTokens(db, 'run-1', 2000, 0.10);
    const run = getRun(db, 'run-1')!;
    expect(run.total_tokens).toBe(3000);
    expect(run.total_cost).toBeCloseTo(0.15);
  });

  it('incrementEntropyAlerts bumps counter', () => {
    createRun(db, 'run-1', 'yaml');
    expect(getRun(db, 'run-1')!.entropy_alerts).toBe(0);
    incrementEntropyAlerts(db, 'run-1');
    incrementEntropyAlerts(db, 'run-1');
    expect(getRun(db, 'run-1')!.entropy_alerts).toBe(2);
  });

  // ─── Context Summaries CRUD ─────────────────────────────────────────────────

  it('inserts and retrieves context summaries', () => {
    createRun(db, 'run-1', 'yaml');
    insertContextSummary(db, {
      id: 'cs-1',
      runId: 'run-1',
      scope: 'overview',
      targetPath: null,
      summaryText: 'Project overview',
      tokenCount: 480,
    });
    insertContextSummary(db, {
      id: 'cs-2',
      runId: 'run-1',
      scope: 'module',
      targetPath: 'src/ledger',
      summaryText: 'Ledger module',
      tokenCount: 920,
    });
    const all = getContextSummariesByRun(db, 'run-1');
    expect(all).toHaveLength(2);
    const scopes = all.map(r => r.scope).sort();
    expect(scopes).toEqual(['module', 'overview']);
    const mod = all.find(r => r.scope === 'module')!;
    expect(mod.target_path).toBe('src/ledger');
  });

  it('filters context summaries by scope', () => {
    createRun(db, 'run-1', 'yaml');
    insertContextSummary(db, {
      id: 'cs-1', runId: 'run-1', scope: 'overview',
      targetPath: null, summaryText: 'overview', tokenCount: 100,
    });
    insertContextSummary(db, {
      id: 'cs-2', runId: 'run-1', scope: 'module',
      targetPath: 'src/a', summaryText: 'module a', tokenCount: 200,
    });
    const overviews = getContextSummariesByRun(db, 'run-1', 'overview');
    expect(overviews).toHaveLength(1);
    expect(overviews[0]!.id).toBe('cs-1');
  });

  it('invalidateContextSummary hides from active queries', () => {
    createRun(db, 'run-1', 'yaml');
    insertContextSummary(db, {
      id: 'cs-1', runId: 'run-1', scope: 'overview',
      targetPath: null, summaryText: 'old overview', tokenCount: 100,
    });
    expect(getContextSummariesByRun(db, 'run-1')).toHaveLength(1);
    invalidateContextSummary(db, 'cs-1');
    expect(getContextSummariesByRun(db, 'run-1')).toHaveLength(0);
  });
});

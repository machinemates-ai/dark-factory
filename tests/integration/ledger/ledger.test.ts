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

  it('records and retrieves events', () => {
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
      taskId: 'task-1',
      eventType: 'task.started',
      payload: JSON.stringify({ foo: 'bar' }),
    });
    const events = getEventsByTask(db, 'task-1');
    expect(events).toHaveLength(1);
    expect(events[0]!.event_type).toBe('task.started');
    expect(JSON.parse(events[0]!.payload)).toEqual({ foo: 'bar' });
  });
});

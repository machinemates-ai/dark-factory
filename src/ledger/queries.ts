/**
 * Typed ledger queries for runs, tasks, events, and context summaries.
 */

import type { DatabaseSync } from 'node:sqlite';
import type {
  RunStatus,
  LedgerTaskStatus,
  SpecialistType,
} from '../agents/types.js';

// ─── Row Types ────────────────────────────────────────────────────────────────

export interface RunRow {
  id: string;
  workflow_yaml: string;
  status: RunStatus;
  created_at: string;
  completed_at: string | null;
  total_tokens: number;
  total_cost: number;
  entropy_alerts: number;
}

export interface TaskRow {
  id: string;
  run_id: string;
  movement_name: string;
  agent_id: string | null;
  status: LedgerTaskStatus;
  depends_on: string; // JSON array
  input_hash: string | null;
  output_hash: string | null;
  thread_id: string | null;
  tokens_used: number;
  created_at: string;
  completed_at: string | null;
  memory_refs: string; // JSON array
  specialist_type: SpecialistType | null;
  edit_entropy: number | null;
}

export interface EventRow {
  id: string;
  run_id: string;
  task_id: string | null;
  event_type: string;
  payload: string; // JSON
  timestamp: string;
}

export interface ContextSummaryRow {
  id: string;
  run_id: string;
  scope: 'overview' | 'module' | 'detail';
  target_path: string | null;
  summary_text: string;
  token_count: number;
  created_at: string;
  invalidated_at: string | null;
  promoted_to_project: number; // 0 or 1 (boolean)
  stable_run_count: number;
}

// ─── Query Helpers ────────────────────────────────────────────────────────────

export function createRun(
  db: DatabaseSync,
  id: string,
  workflowYaml: string,
): void {
  db.prepare(
    'INSERT INTO runs (id, workflow_yaml, status) VALUES (?, ?, ?)',
  ).run(id, workflowYaml, 'planned');
}

export function getRun(db: DatabaseSync, id: string): RunRow | undefined {
  return db.prepare('SELECT * FROM runs WHERE id = ?').get(id) as unknown as
    | RunRow
    | undefined;
}

export function updateRunStatus(
  db: DatabaseSync,
  id: string,
  status: RunStatus,
): void {
  const completedAt = status === 'completed' || status === 'failed'
    ? new Date().toISOString()
    : null;
  db.prepare(
    'UPDATE runs SET status = ?, completed_at = COALESCE(?, completed_at) WHERE id = ?',
  ).run(status, completedAt, id);
}

export function createTask(
  db: DatabaseSync,
  task: {
    id: string;
    runId: string;
    movementName: string;
    dependsOn: string[];
    specialistType: SpecialistType | null;
  },
): void {
  db.prepare(
    `INSERT INTO tasks (id, run_id, movement_name, depends_on, specialist_type)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    task.id,
    task.runId,
    task.movementName,
    JSON.stringify(task.dependsOn),
    task.specialistType,
  );
}

export function getTasksByRun(db: DatabaseSync, runId: string): TaskRow[] {
  return db.prepare('SELECT * FROM tasks WHERE run_id = ? ORDER BY created_at').all(runId) as unknown as TaskRow[];
}

export function insertEvent(
  db: DatabaseSync,
  event: {
    id: string;
    runId: string;
    taskId: string | null;
    eventType: string;
    payload: string;
  },
): void {
  db.prepare(
    'INSERT INTO events (id, run_id, task_id, event_type, payload) VALUES (?, ?, ?, ?, ?)',
  ).run(event.id, event.runId, event.taskId, event.eventType, event.payload);
}

export function getEventsByRun(db: DatabaseSync, runId: string): EventRow[] {
  return db.prepare(
    'SELECT * FROM events WHERE run_id = ? ORDER BY timestamp',
  ).all(runId) as unknown as EventRow[];
}

export function getEventsByTask(db: DatabaseSync, taskId: string): EventRow[] {
  return db.prepare(
    'SELECT * FROM events WHERE task_id = ? ORDER BY timestamp',
  ).all(taskId) as unknown as EventRow[];
}

/**
 * SQLite ledger — schema migrations (D37).
 *
 * Uses node:sqlite DatabaseSync. Synchronous writes, single-writer pattern.
 * Four tables: runs, tasks, events, context_summaries.
 */

import { DatabaseSync } from 'node:sqlite';

// ─── Migration SQL ────────────────────────────────────────────────────────────

const MIGRATIONS = [
  // v1: Initial schema
  `
  CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY,
    workflow_yaml TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned'
      CHECK (status IN ('planned', 'running', 'paused', 'completed', 'failed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    total_tokens INTEGER DEFAULT 0,
    total_cost REAL DEFAULT 0.0,
    entropy_alerts INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES runs(id),
    movement_name TEXT NOT NULL,
    agent_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'assigned', 'running', 'completed', 'failed')),
    depends_on TEXT DEFAULT '[]',
    input_hash TEXT,
    output_hash TEXT,
    thread_id TEXT,
    tokens_used INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    memory_refs TEXT DEFAULT '[]',
    specialist_type TEXT
      CHECK (specialist_type IN ('coder', 'tester', 'refactorer', 'doc-writer', NULL)),
    edit_entropy REAL
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES tasks(id),
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL DEFAULT '{}',
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS context_summaries (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES runs(id),
    scope TEXT NOT NULL CHECK (scope IN ('overview', 'module', 'detail')),
    target_path TEXT,
    summary_text TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    invalidated_at TEXT,
    promoted_to_project INTEGER DEFAULT 0,
    stable_run_count INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_run_id ON tasks(run_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_events_task_id ON events(task_id);
  CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
  CREATE INDEX IF NOT EXISTS idx_context_summaries_run ON context_summaries(run_id, scope);
  `,
] as const;

// ─── Open & Migrate ───────────────────────────────────────────────────────────

export function openLedger(dbPath: string): DatabaseSync {
  const db = new DatabaseSync(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec('PRAGMA foreign_keys = ON');

  // Run migrations
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = db
    .prepare('SELECT id FROM _migrations ORDER BY id')
    .all() as Array<{ id: number }>;

  const appliedSet = new Set(applied.map((r) => r.id));

  for (let i = 0; i < MIGRATIONS.length; i++) {
    if (!appliedSet.has(i)) {
      db.exec(MIGRATIONS[i]!);
      db.prepare('INSERT INTO _migrations (id) VALUES (?)').run(i);
    }
  }

  return db;
}

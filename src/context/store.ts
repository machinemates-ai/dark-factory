/**
 * Context Store — structured, scoped context management (D51).
 *
 * Three scopes: global_context, file_specific_context, task_context.
 * Append-only within a run. TTL-based expiry across runs.
 * Every task completion triggers a context update.
 */

// ─── Context Store Types ──────────────────────────────────────────────────────

export interface ContextStore {
  global_context: GlobalContext;
  file_specific_context: Map<string, FileContext>;
  task_context: Map<string, TaskContext>;
}

export interface GlobalContext {
  /** Repo language, framework, conventions. */
  project_info: Record<string, string>;
  /** AGENTS.md rules. */
  conventions: string[];
  /** Seeded from Ring 3 at run start (D63). */
  memory_seeds: string[];
  /** Semantic index overview (D70). */
  index_overview?: string;
}

export interface FileContext {
  purpose: string;
  dependencies: string[];
  change_history: string[];
  complexity_score?: number;
  /** Symbol graph data from semantic index (D70). */
  symbols?: SymbolSummary;
}

export interface SymbolSummary {
  functions: string[];
  classes: string[];
  imports: string[];
  callers: string[];
  callees: string[];
}

export interface TaskContext {
  objective: string;
  relevant_files: string[];
  prior_findings: string[];
  retry_history: string[];
  /** ToM belief state (D72) — when --tom enabled. */
  belief_state?: Record<string, unknown>;
}

// ─── Context Store Factory ────────────────────────────────────────────────────

export function createContextStore(): ContextStore {
  return {
    global_context: {
      project_info: {},
      conventions: [],
      memory_seeds: [],
    },
    file_specific_context: new Map(),
    task_context: new Map(),
  };
}

// ─── Context Strategy Resolver ────────────────────────────────────────────────

export type ContextStrategy = 'full' | 'summary' | 'minimal' | 'indexed';

export interface ResolvedContext {
  strategy: ContextStrategy;
  content: string;
  tokenEstimate: number;
}

export function resolveContext(
  store: ContextStore,
  strategy: ContextStrategy,
  taskId: string,
  targetFiles: string[],
): ResolvedContext {
  switch (strategy) {
    case 'full': {
      // Filter file contexts to target files if specified, otherwise include all
      const fileEntries = targetFiles.length > 0
        ? targetFiles
            .map((f: string) => [f, store.file_specific_context.get(f)] as const)
            .filter((entry): entry is readonly [string, FileContext] => entry[1] !== undefined)
        : [...store.file_specific_context.entries()];
      return {
        strategy,
        content: JSON.stringify({
          global: store.global_context,
          files: Object.fromEntries(fileEntries),
          task: store.task_context.get(taskId),
        }),
        tokenEstimate: 50_000, // Placeholder
      };
    }
    case 'summary':
      return {
        strategy,
        content: JSON.stringify({
          global: store.global_context,
          task: store.task_context.get(taskId),
        }),
        tokenEstimate: 10_000,
      };
    case 'minimal':
      return {
        strategy,
        content: JSON.stringify({
          global: store.global_context,
        }),
        tokenEstimate: 2_000,
      };
    case 'indexed':
      return {
        strategy,
        content: JSON.stringify({
          index_overview: store.global_context.index_overview,
          task: store.task_context.get(taskId),
        }),
        tokenEstimate: 5_000,
      };
  }
}

/**
 * brief_run() — retrieve Ring 3 memories at run start (D63).
 *
 * Seeds Context Store global_context with project-level knowledge:
 * conventions, past failures, architecture decisions.
 */

import type { ProjectStore } from './project-store.js';
import type { ContextStore } from '../context/store.js';

export async function briefRun(
  store: ProjectStore,
  contextStore: ContextStore,
  taskSpec: string,
): Promise<number> {
  // Search Ring 3 for relevant memories
  const memories = await store.search(taskSpec, 10);

  // Seed global_context with memory contents
  contextStore.global_context.memory_seeds = memories.map((m) => m.content);

  return memories.length;
}

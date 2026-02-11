/**
 * Ring 3 MCP client — project-persistent knowledge graph (D63).
 *
 * Wraps @modelcontextprotocol/sdk MCP client connecting to a configurable
 * memory MCP server (default: memento-v2 A-MEM server).
 */

import type { MemoryNote } from './types.js';

// ─── Project Store Interface ──────────────────────────────────────────────────

export interface ProjectStore {
  /** Search Ring 3 for memories relevant to a query. */
  search(query: string, maxResults?: number): Promise<MemoryNote[]>;
  /** Store a new note in Ring 3. */
  store(note: Omit<MemoryNote, 'id' | 'createdAt'>): Promise<string>;
  /** Get memory statistics. */
  stats(): Promise<{ noteCount: number; linkCount: number; lastConvergence: string | null }>;
}

// ─── MCP-based Implementation (stub) ──────────────────────────────────────────

export async function createProjectStore(
  _mcpServerUri?: string,
): Promise<ProjectStore> {
  // TODO: Implement MCP client connection to A-MEM/Graphiti server
  // Uses @modelcontextprotocol/sdk Client
  return {
    async search(_query, _maxResults = 5) {
      return [];
    },
    async store(_note) {
      return crypto.randomUUID();
    },
    async stats() {
      return { noteCount: 0, linkCount: 0, lastConvergence: null };
    },
  };
}

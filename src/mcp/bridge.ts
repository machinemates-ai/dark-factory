/**
 * FastMCP bridge — Dark Factory as MCP tools for external integration (D41/Step 11).
 *
 * Internal agent communication uses the bus, NOT MCP.
 * MCP is for external integration only (e.g., Claude Code invoking Dark Factory).
 */

// ─── MCP Tool Definitions ─────────────────────────────────────────────────────

export const MCP_TOOLS = {
  'dark-factory-plan': {
    description: 'Run Dark Factory planner — produces PLAN.md from a spec',
    inputSchema: {
      type: 'object',
      properties: {
        specPath: { type: 'string', description: 'Path to the spec file' },
      },
      required: ['specPath'],
    },
    task: true, // SEP-1686 background task
  },
  'dark-factory-run': {
    description: 'Execute a Dark Factory workflow',
    inputSchema: {
      type: 'object',
      properties: {
        workflowPath: { type: 'string', description: 'Path to TAKT YAML workflow' },
        specPath: { type: 'string', description: 'Optional spec file' },
        depth: { type: 'string', enum: ['single', 'two-tier', 'full', 'auto'] },
      },
      required: ['workflowPath'],
    },
    task: true, // Long-running
  },
  'dark-factory-status': {
    description: 'Query run status from the SQLite ledger',
    inputSchema: {
      type: 'object',
      properties: {
        runId: { type: 'string', description: 'Run ID to query' },
      },
    },
    task: false,
  },
} as const;

// ─── Bridge Implementation (stub) ────────────────────────────────────────────

export async function startMcpBridge(_port?: number): Promise<void> {
  // TODO: Implement FastMCP server exposing the tools above
  // Uses @modelcontextprotocol/sdk Server
  // SEP-1686 TaskMeta(ttl=3600) for long-running operations
  throw new Error('MCP bridge not yet implemented');
}

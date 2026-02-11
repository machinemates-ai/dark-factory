/**
 * Pyramid Summary generator (D46).
 *
 * Three zoom levels: overview (~500 tokens), module (~1K each), detail (~500 each).
 * Summaries stored in context_summaries ledger table.
 * Invalidated when file content changes (tracked via input_hash).
 */

// ─── Summary Types ────────────────────────────────────────────────────────────

export type SummaryScope = 'overview' | 'module' | 'detail';

export interface PyramidSummary {
  scope: SummaryScope;
  targetPath: string | null;
  text: string;
  tokenCount: number;
}

// ─── Summary Generation (stub) ────────────────────────────────────────────────

export async function generateOverview(
  _repoPath: string,
): Promise<PyramidSummary> {
  // TODO: Use Claude SDK V2 summarizer persona to generate overview
  return {
    scope: 'overview',
    targetPath: null,
    text: '',
    tokenCount: 0,
  };
}

export async function generateModuleSummary(
  _modulePath: string,
): Promise<PyramidSummary> {
  // TODO: Use Claude SDK V2 summarizer persona
  return {
    scope: 'module',
    targetPath: _modulePath,
    text: '',
    tokenCount: 0,
  };
}

export async function generateDetailSummary(
  _filePath: string,
): Promise<PyramidSummary> {
  // TODO: Use Claude SDK V2 summarizer persona
  return {
    scope: 'detail',
    targetPath: _filePath,
    text: '',
    tokenCount: 0,
  };
}

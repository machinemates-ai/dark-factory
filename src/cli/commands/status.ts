/**
 * CLI command: status — Query run status from SQLite ledger.
 */

export async function runStatusCommand(opts: Record<string, unknown>): Promise<void> {
  const runId = opts['run-id'] as string | undefined;
  const format = (opts.format as string) ?? 'table';

  if (!runId) {
    // List recent runs
    console.log('Listing recent runs...');
    // TODO: Query ledger for recent runs
    console.log('Status command not yet fully implemented.');
    return;
  }

  console.log(`Status for run: ${runId} (format: ${format})`);
  // TODO: openLedger() → getRun(runId) → getTasksByRun(runId) → format output
  console.log('Status command not yet implemented.');
}

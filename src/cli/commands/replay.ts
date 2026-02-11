/**
 * CLI command: replay — Replay bus events for a completed run.
 */

export async function runReplayCommand(opts: Record<string, unknown>): Promise<void> {
  const runId = opts['run-id'] as string | undefined;

  if (!runId) {
    console.error('Error: --run-id <id> is required for replay command.');
    process.exit(1);
  }

  console.log(`Replaying events for run: ${runId}`);
  // TODO: getEventsByRun(runId) → replay through bus in order
  console.log('Replay command not yet implemented.');
}

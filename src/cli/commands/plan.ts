/**
 * CLI command: plan — Generate PLAN.md from spec.
 */

import { resolve } from 'node:path';

export async function runPlanCommand(opts: Record<string, unknown>): Promise<void> {
  const specPath = opts.spec as string | undefined;

  if (!specPath) {
    console.error('Error: --spec <path> is required for plan command.');
    process.exit(1);
  }

  const resolvedSpec = resolve(specPath);
  console.log(`Planning from spec: ${resolvedSpec}`);

  // TODO: Wire to orchestrator engine
  // 1. Parse spec
  // 2. Build semantic index
  // 3. Invoke Lead Planner (Claude S4)
  // 4. Write PLAN.md
  console.log('Plan command not yet implemented.');
}

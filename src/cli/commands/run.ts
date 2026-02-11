/**
 * CLI command: run — Execute a TAKT workflow.
 */

import { resolve } from 'node:path';
import type { MemoryMode } from '../../agents/types.js';

export async function runRunCommand(opts: Record<string, unknown>): Promise<void> {
  const workflowPath = opts.workflow as string | undefined;
  const specPath = opts.spec as string | undefined;
  const depth = (opts.depth as string) ?? 'auto';
  const memoryMode = (opts.memory as MemoryMode) ?? 'run';
  const enableToM = (opts.tom as boolean) ?? false;
  const enableCritic = (opts.critic as boolean) ?? false;
  const costLimit = opts['cost-limit'] ? Number(opts['cost-limit']) : undefined;

  if (!workflowPath) {
    console.error('Error: --workflow <path> is required for run command.');
    process.exit(1);
  }

  console.log(`Executing workflow: ${resolve(workflowPath)}`);
  console.log(`  Depth: ${depth}`);
  console.log(`  Memory: ${memoryMode}`);
  console.log(`  ToM: ${enableToM}`);
  console.log(`  Critic: ${enableCritic}`);
  if (costLimit) console.log(`  Cost limit: $${costLimit}`);
  if (specPath) console.log(`  Spec: ${resolve(specPath)}`);

  // TODO: Wire to orchestrator
  // 1. parseTaktYaml(workflowPath)
  // 2. openLedger()
  // 3. createBus()
  // 4. createContextStore()
  // 5. createAgentPool()
  // 6. executeRun(ctx)
  console.log('Run command not yet implemented.');
}

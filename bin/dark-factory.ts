#!/usr/bin/env tsx
/**
 * Dark Factory CLI entry point.
 *
 * Uses node:util.parseArgs — zero framework (D65).
 */

import { parseArgs } from 'node:util';
import { join } from 'node:path';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
    verbose: { type: 'boolean', default: false },
    depth: { type: 'string', default: 'auto' },
    'cost-limit': { type: 'string' },
    memory: { type: 'string', default: 'run' },
    tom: { type: 'boolean', default: false },
    critic: { type: 'boolean', default: false },
    spec: { type: 'string' },
    workflow: { type: 'string' },
    'run-id': { type: 'string' },
    format: { type: 'string', default: 'table' },
  },
});

const COMMANDS = ['plan', 'run', 'validate', 'status', 'replay', 'index', 'memory'] as const;
type Command = typeof COMMANDS[number];

function printUsage(): void {
  console.log(`
  dark-factory — autonomous multi-agent coding orchestrator

  Usage: dark-factory <command> [options]

  Commands:
    plan       Create PLAN.md from spec via Lead Planner
    run        Execute a TAKT workflow (calls plan implicitly)
    validate   Re-run validation gates on artifacts
    status     Query run status from ledger
    replay     Replay bus events for a completed run
    index      Build/update the semantic codebase index
    memory     Manage Three-Ring Memory (search / stats / prune)

  Options:
    -h, --help          Show this help
    -v, --version       Show version
    --verbose           Enable debug output
    --depth <depth>     Orchestration depth: single | two-tier | full | auto (default: auto)
    --cost-limit <n>    Max cost in dollars before abort
    --memory <mode>     Memory mode: run | session | project (default: run)
    --tom               Enable Theory of Mind belief tracking
    --critic            Enable L1.5 critic gate
    --spec <path>       Path to the spec file
    --workflow <path>   Path to TAKT YAML workflow
    --run-id <id>       Run ID for status/replay
    --format <fmt>      Output format: table | json (default: table)
  `.trim());
}

async function main(): Promise<void> {
  if (values.help || positionals.length === 0) {
    printUsage();
    process.exit(0);
  }

  if (values.version) {
    // Read version from package.json
    const { readFileSync } = await import('node:fs');
    const pkgPath = join(import.meta.dirname ?? '.', '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string };
    console.log(`dark-factory v${pkg.version}`);
    process.exit(0);
  }

  const command = positionals[0] as string;

  if (!COMMANDS.includes(command as Command)) {
    console.error(`Unknown command: ${command}\nRun "dark-factory --help" for usage.`);
    process.exit(1);
  }

  switch (command as Command) {
    case 'plan': {
      const { runPlanCommand } = await import('../src/cli/commands/plan.js');
      await runPlanCommand(values);
      break;
    }
    case 'run': {
      const { runRunCommand } = await import('../src/cli/commands/run.js');
      await runRunCommand(values);
      break;
    }
    case 'validate': {
      const { runValidateCommand } = await import('../src/cli/commands/validate.js');
      await runValidateCommand(values);
      break;
    }
    case 'status': {
      const { runStatusCommand } = await import('../src/cli/commands/status.js');
      await runStatusCommand(values);
      break;
    }
    case 'replay': {
      const { runReplayCommand } = await import('../src/cli/commands/replay.js');
      await runReplayCommand(values);
      break;
    }
    case 'index': {
      const { runIndexCommand } = await import('../src/cli/commands/index.js');
      await runIndexCommand(values);
      break;
    }
    case 'memory': {
      const { runMemoryCommand } = await import('../src/cli/commands/memory.js');
      await runMemoryCommand(values);
      break;
    }
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

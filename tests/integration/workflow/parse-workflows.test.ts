/**
 * Integration tests: parse all real workflow YAML files against the schema.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTaktYaml } from '../../../src/workflow/parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workflowsDir = resolve(__dirname, '../../../workflows');

function loadWorkflow(name: string): string {
  return readFileSync(resolve(workflowsDir, name), 'utf-8');
}

describe('workflow YAML integration', () => {
  const workflows = [
    'feature-build.takt.yaml',
    'code-review.takt.yaml',
    'dag-parallel-build.takt.yaml',
    'migration.takt.yaml',
  ];

  for (const file of workflows) {
    it(`${file} parses successfully`, () => {
      const yaml = loadWorkflow(file);
      const result = parseTaktYaml(yaml);
      expect(result.success, `${file} failed: ${!result.success ? result.errors.join(', ') : ''}`).toBe(true);
    });
  }

  it('feature-build has correct topological order', () => {
    const result = parseTaktYaml(loadWorkflow('feature-build.takt.yaml'));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.topologicalOrder).toEqual(['plan', 'implement', 'test', 'review']);
    }
  });

  it('dag-parallel-build respects diamond DAG', () => {
    const result = parseTaktYaml(loadWorkflow('dag-parallel-build.takt.yaml'));
    expect(result.success).toBe(true);
    if (result.success) {
      // plan must be first, integrate must be last
      expect(result.topologicalOrder[0]).toBe('plan');
      expect(result.topologicalOrder[result.topologicalOrder.length - 1]).toBe('integrate');
      expect(result.topologicalOrder).toHaveLength(5);
    }
  });

  it('code-review has no edges (parallel movements)', () => {
    const result = parseTaktYaml(loadWorkflow('code-review.takt.yaml'));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.piece.edges).toEqual([]);
      expect(result.topologicalOrder).toHaveLength(2);
    }
  });

  it('migration has linear order', () => {
    const result = parseTaktYaml(loadWorkflow('migration.takt.yaml'));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.topologicalOrder).toEqual(['analyze', 'migrate', 'verify']);
    }
  });
});

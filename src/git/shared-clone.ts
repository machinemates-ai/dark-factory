/**
 * Git shared-clone lifecycle (D42/D66).
 *
 * Per-agent isolation via git clone --shared.
 * Diffs are staged as artifacts, NEVER auto-applied (SafeOutputs D66).
 */

import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';

// ─── Shared Clone ─────────────────────────────────────────────────────────────

export interface SharedClone {
  readonly path: string;
  readonly branch: string;
  /** Capture the diff as a string (staged artifact). */
  captureDiff(): string;
  /** Dispose — delete clone directory. */
  dispose(): void;
}

export function createSharedClone(
  sourceRepo: string,
  cloneDir: string,
  runId: string,
  taskId: string,
): SharedClone {
  const branch = `dark-factory/${runId}/${taskId}`;

  // Create shared clone
  execSync(
    `git clone --shared --no-checkout "${sourceRepo}" "${cloneDir}"`,
    { stdio: 'pipe' },
  );

  // Create working branch
  execSync(`git checkout -b "${branch}"`, {
    cwd: cloneDir,
    stdio: 'pipe',
  });

  // Prevent GC on shared objects in source
  try {
    execSync('git config gc.auto 0', { cwd: sourceRepo, stdio: 'pipe' });
  } catch {
    // Non-fatal — gc.auto may already be set
  }

  return {
    path: cloneDir,
    branch,

    captureDiff(): string {
      try {
        return execSync('git diff HEAD', {
          cwd: cloneDir,
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024, // 10MB
        });
      } catch {
        return '';
      }
    },

    dispose(): void {
      if (existsSync(cloneDir)) {
        rmSync(cloneDir, { recursive: true, force: true });
      }
    },
  };
}

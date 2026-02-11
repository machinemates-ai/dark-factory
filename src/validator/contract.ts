/**
 * L0 Contract Gate — schema/type checks + threat detection (D56/D66).
 *
 * Zod validation, tsc --noEmit, deontic prohibition checks, threat scan.
 * Cost: ~0 tokens, ~2s. Fail → immediate reject, no retry.
 */

import type { TaskAssignment, ValidationReport, ThreatReport } from '../agents/types.js';

// ─── Threat Detection Patterns (D66) ─────────────────────────────────────────

const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g },
  { name: 'AWS Secret Key', pattern: /(?:aws_secret_access_key|secret_key)\s*[=:]\s*['"]?[A-Za-z0-9/+=]{40}/gi },
  { name: 'GitHub Token', pattern: /gh[pousr]_[A-Za-z0-9_]{36,255}/g },
  { name: 'Generic API Key', pattern: /(?:api[_-]?key|apikey|secret)\s*[=:]\s*['"]?[A-Za-z0-9]{20,}/gi },
  { name: 'Private Key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'JWT', pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
];

const SUSPICIOUS_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'eval injection', pattern: /\beval\s*\(/g },
  { name: 'Function constructor', pattern: /new\s+Function\s*\(/g },
  { name: 'exec injection', pattern: /child_process.*exec\s*\(/g },
  { name: 'base64 decode', pattern: /Buffer\.from\s*\([^,]+,\s*['"]base64['"]\)/g },
];

// ─── Threat Scan ──────────────────────────────────────────────────────────────

export function scanForThreats(diff: string, filePath: string): ThreatReport {
  const threats: Array<ThreatReport['threats'][number]> = [];

  for (const { name, pattern } of SECRET_PATTERNS) {
    const matches = diff.matchAll(pattern);
    for (const match of matches) {
      const line = diff.substring(0, match.index).split('\n').length;
      threats.push({
        type: 'secret',
        description: `Potential ${name} detected`,
        file: filePath,
        line,
        pattern: name,
      });
    }
  }

  for (const { name, pattern } of SUSPICIOUS_PATTERNS) {
    const matches = diff.matchAll(pattern);
    for (const match of matches) {
      const line = diff.substring(0, match.index).split('\n').length;
      threats.push({
        type: 'suspicious-pattern',
        description: `Suspicious pattern: ${name}`,
        file: filePath,
        line,
        pattern: name,
      });
    }
  }

  const maxSeverity = threats.length === 0
    ? 'none' as const
    : threats.some((t) => t.type === 'secret')
      ? 'critical' as const
      : 'medium' as const;

  return { threats, severity: maxSeverity };
}

// ─── L0 Contract Gate ─────────────────────────────────────────────────────────

export async function runContractGate(
  _assignment: TaskAssignment,
  _diff: string,
): Promise<ValidationReport> {
  // TODO: Implement full L0 pipeline:
  // 1. Zod validation of movement outputs
  // 2. tsc --noEmit
  // 3. Linter pass
  // 4. Deontic prohibition check
  // 5. Threat detection
  return {
    taskId: _assignment.taskId,
    gate: 'L0',
    passed: true,
    findings: [],
    timestamp: new Date().toISOString(),
  };
}

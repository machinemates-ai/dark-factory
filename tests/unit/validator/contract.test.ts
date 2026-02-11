/**
 * Tests for threat detection (validator/contract.ts).
 */

import { describe, it, expect } from 'vitest';
import { scanForThreats } from '../../../src/validator/contract.js';

describe('scanForThreats', () => {
  it('returns empty for clean code', () => {
    const report = scanForThreats('const x = 42;\nexport default x;\n', 'test.ts');
    expect(report.threats).toHaveLength(0);
    expect(report.severity).toBe('none');
  });

  // ─── Secret Detection ──────────────────────────────────────────────────────

  it('detects AWS access key', () => {
    const report = scanForThreats('const key = "AKIAIOSFODNN7EXAMPLE";', 'config.ts');
    expect(report.threats.length).toBeGreaterThan(0);
    expect(report.threats[0]!.type).toBe('secret');
    expect(report.severity).toBe('critical');
  });

  it('detects GitHub token (ghp_)', () => {
    const report = scanForThreats(
      'const token = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij";',
      'auth.ts',
    );
    expect(report.threats.some((t) => t.pattern === 'GitHub Token')).toBe(true);
    expect(report.severity).toBe('critical');
  });

  it('detects private key header', () => {
    const report = scanForThreats('-----BEGIN RSA PRIVATE KEY-----\nMIIE...', 'keys.pem');
    expect(report.threats.some((t) => t.pattern === 'Private Key')).toBe(true);
  });

  it('detects JWT token', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    const report = scanForThreats(`const token = "${jwt}";`, 'auth.ts');
    expect(report.threats.some((t) => t.pattern === 'JWT')).toBe(true);
  });

  // ─── Suspicious Pattern Detection ──────────────────────────────────────────

  it('detects eval injection', () => {
    const report = scanForThreats('const result = eval(userInput);', 'handler.ts');
    expect(report.threats.some((t) => t.pattern === 'eval injection')).toBe(true);
    expect(report.severity).toBe('medium');
  });

  it('detects Function constructor', () => {
    const report = scanForThreats('const fn = new Function("return " + code);', 'exec.ts');
    expect(report.threats.some((t) => t.pattern === 'Function constructor')).toBe(true);
  });

  // ─── Line Number Accuracy ──────────────────────────────────────────────────

  it('reports correct line number', () => {
    const code = 'line 1\nline 2\neval(x)\nline 4';
    const report = scanForThreats(code, 'test.ts');
    const evalThreat = report.threats.find((t) => t.pattern === 'eval injection');
    expect(evalThreat).toBeDefined();
    expect(evalThreat!.line).toBe(3);
  });

  // ─── Multiple Threats ──────────────────────────────────────────────────────

  it('finds multiple threats in one diff', () => {
    const code = `
const key = "AKIAIOSFODNN7EXAMPLE";
const result = eval(userInput);
`;
    const report = scanForThreats(code, 'bad.ts');
    expect(report.threats.length).toBeGreaterThanOrEqual(2);
    expect(report.severity).toBe('critical'); // secret wins over suspicious
  });
});

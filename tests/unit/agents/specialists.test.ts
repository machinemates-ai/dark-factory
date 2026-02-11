/**
 * Tests for specialist prompts + deontic injection (agents/specialists.ts).
 */

import { describe, it, expect } from 'vitest';
import {
  getSpecialistPrompt,
  getGenericWorkerPrompt,
  buildDeonticPrompt,
} from '../../../src/agents/specialists.js';

describe('getSpecialistPrompt', () => {
  it('returns prompt for coder', () => {
    const p = getSpecialistPrompt('coder');
    expect(p).toContain('CODE IMPLEMENTER');
    expect(p).toContain('YOUR OBLIGATIONS');
    expect(p).toContain('YOUR PROHIBITIONS');
  });

  it('returns prompt for tester', () => {
    const p = getSpecialistPrompt('tester');
    expect(p).toContain('TEST WRITER');
  });

  it('returns prompt for refactorer', () => {
    const p = getSpecialistPrompt('refactorer');
    expect(p).toContain('REFACTORER');
  });

  it('returns prompt for doc-writer', () => {
    const p = getSpecialistPrompt('doc-writer');
    expect(p).toContain('DOCUMENTATION WRITER');
  });
});

describe('getGenericWorkerPrompt', () => {
  it('returns a non-empty string', () => {
    expect(getGenericWorkerPrompt().length).toBeGreaterThan(0);
  });
});

describe('buildDeonticPrompt', () => {
  it('builds all three sections', () => {
    const result = buildDeonticPrompt(
      ['Write tests'],
      ['May create helpers'],
      ['No secrets'],
    );
    expect(result).toContain('YOU MUST:');
    expect(result).toContain('Write tests');
    expect(result).toContain('YOU MAY:');
    expect(result).toContain('May create helpers');
    expect(result).toContain('YOU MUST NOT:');
    expect(result).toContain('No secrets');
  });

  it('omits empty sections', () => {
    const result = buildDeonticPrompt(['Do X'], [], []);
    expect(result).toContain('YOU MUST:');
    expect(result).not.toContain('YOU MAY:');
    expect(result).not.toContain('YOU MUST NOT:');
  });

  it('returns empty for no deontics', () => {
    expect(buildDeonticPrompt([], [], [])).toBe('');
  });
});

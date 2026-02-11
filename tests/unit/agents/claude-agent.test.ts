/**
 * Tests for Claude agent utilities (agents/claude-agent.ts).
 */

import { describe, it, expect } from 'vitest';
import { resolveModel, buildPlannerPrompt } from '../../../src/agents/claude-agent.js';

describe('resolveModel', () => {
  it('returns SOTA model for sota tier', () => {
    expect(resolveModel('sota')).toBe('claude-opus-4-6');
  });

  it('returns fast model for fast tier', () => {
    expect(resolveModel('fast')).toBe('claude-sonnet-4');
  });

  it('returns empty string for static tier', () => {
    expect(resolveModel('static')).toBe('');
  });

  it('uses override when provided', () => {
    expect(resolveModel('sota', 'custom-model')).toBe('custom-model');
  });

  it('override takes precedence over tier mapping', () => {
    expect(resolveModel('fast', 'gpt-4o')).toBe('gpt-4o');
  });
});

describe('buildPlannerPrompt', () => {
  it('includes base planner instructions', () => {
    const prompt = buildPlannerPrompt([], [], [], false);
    expect(prompt).toContain('LEAD PLANNER');
    expect(prompt).toContain('S4 Intelligence');
    expect(prompt).toContain('PLAN.md');
  });

  it('includes deontic sections when provided', () => {
    const prompt = buildPlannerPrompt(
      ['Decompose into tasks'],
      ['May override depth'],
      ['Never skip tests'],
      false,
    );
    expect(prompt).toContain('YOU MUST:');
    expect(prompt).toContain('Decompose into tasks');
    expect(prompt).toContain('YOU MAY:');
    expect(prompt).toContain('YOU MUST NOT:');
  });

  it('excludes ToM section when disabled', () => {
    const prompt = buildPlannerPrompt([], [], [], false);
    expect(prompt).not.toContain('THEORY OF MIND');
  });

  it('includes ToM section when enabled', () => {
    const prompt = buildPlannerPrompt([], [], [], true);
    expect(prompt).toContain('THEORY OF MIND');
    expect(prompt).toContain('belief states');
    expect(prompt).toContain('belief conflicts');
  });
});

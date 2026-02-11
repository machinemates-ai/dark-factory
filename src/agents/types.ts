/**
 * Shared data types for Dark Factory agents.
 *
 * IMPORTANT (D45): This file contains ONLY data types shared between providers.
 * There is NO shared behavioral interface — Codex App Server and Claude Agent SDK V2
 * have fundamentally different interaction models. Each provider wrapper uses
 * provider-native formats directly.
 */

// ─── A2A Task Lifecycle (D58) ─────────────────────────────────────────────────

/** A2A v1.0 Task lifecycle states — 7 states covering all real agent scenarios. */
export type TaskStatus =
  | 'submitted'
  | 'working'
  | 'input-required'
  | 'auth-required'
  | 'completed'
  | 'failed'
  | 'canceled';

// ─── Typed Artifacts (D59) ────────────────────────────────────────────────────

export interface TextPart {
  readonly kind: 'text';
  readonly text: string;
}

export interface FilePart {
  readonly kind: 'file';
  readonly uri: string;
  readonly mimeType: string;
}

export interface DataPart {
  readonly kind: 'data';
  readonly data: Record<string, unknown>;
}

export type ArtifactPart = TextPart | FilePart | DataPart;

export interface Artifact {
  readonly name: string;
  readonly mimeType: string;
  readonly parts: readonly ArtifactPart[];
}

// ─── Task Result ──────────────────────────────────────────────────────────────

export interface TaskResult {
  readonly taskId: string;
  readonly runId: string;
  readonly status: TaskStatus;
  readonly artifacts: readonly Artifact[];
  readonly tokensUsed?: number;
  readonly cost?: number;
  readonly error?: string;
}

// ─── Agent Result (unified output from any provider) ──────────────────────────

export interface AgentResult {
  readonly taskId: string;
  readonly agentId: string;
  readonly provider: 'codex' | 'claude';
  readonly status: TaskStatus;
  readonly artifacts: readonly Artifact[];
  readonly threadId?: string;
  readonly sessionId?: string;
  readonly tokensUsed: number;
  readonly editEntropy?: number;
}

// ─── Task Assignment ──────────────────────────────────────────────────────────

export interface TaskAssignment {
  readonly taskId: string;
  readonly runId: string;
  readonly movementName: string;
  readonly persona: PersonaRef;
  readonly inputs: readonly string[];
  readonly contextStrategy: ContextStrategy;
  readonly clonePath: string;
  readonly retryCount: number;
  readonly previousFindings?: string;
  readonly criticReport?: CriticReport;
}

export interface PersonaRef {
  readonly name: string;
  readonly model: string;
  readonly role: PersonaRole;
  readonly tier: ModelTier;
  readonly specialist: SpecialistType | null;
  readonly obligations: readonly string[];
  readonly permissions: readonly string[];
  readonly prohibitions: readonly string[];
  readonly blind: boolean;
}

export type PersonaRole = 'lead' | 'worker' | 'judge' | 'summarizer';
export type ModelTier = 'sota' | 'fast' | 'static';
export type SpecialistType = 'coder' | 'tester' | 'refactorer' | 'doc-writer';
export type ContextStrategy = 'full' | 'summary' | 'minimal' | 'indexed';

// ─── Validation Report ────────────────────────────────────────────────────────

export interface ValidationReport {
  readonly taskId: string;
  readonly gate: ValidationGate;
  readonly passed: boolean;
  readonly score?: number;
  readonly findings: readonly ValidationFinding[];
  readonly timestamp: string;
}

export type ValidationGate = 'L0' | 'L1' | 'L1.5' | 'L2' | 'L3';

export interface ValidationFinding {
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  readonly message: string;
  readonly file?: string;
  readonly line?: number;
}

// ─── Critic Report (D74) ─────────────────────────────────────────────────────

export interface CriticReport {
  readonly issues: readonly CriticIssue[];
  readonly confidence: number;
  readonly recommendation: 'pass' | 'revise' | 'reject';
}

export interface CriticIssue {
  readonly category: string;
  readonly severity: 'low' | 'medium' | 'high';
  readonly description: string;
  readonly suggestion?: string;
  readonly file?: string;
  readonly line?: number;
}

// ─── Threat Detection (D66) ──────────────────────────────────────────────────

export interface ThreatReport {
  readonly threats: readonly ThreatFinding[];
  readonly severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export interface ThreatFinding {
  readonly type: 'secret' | 'injection' | 'suspicious-pattern' | 'policy-violation';
  readonly description: string;
  readonly file: string;
  readonly line?: number;
  readonly pattern: string;
}

// ─── Run Lifecycle ────────────────────────────────────────────────────────────

export type RunStatus = 'planned' | 'running' | 'paused' | 'completed' | 'failed';

export type LedgerTaskStatus = 'pending' | 'assigned' | 'running' | 'completed' | 'failed';

// ─── Algedonic Severity (D61) ─────────────────────────────────────────────────

export type AlgedonicSeverity = 'warning' | 'critical' | 'fatal';

// ─── Orchestration Depth (D52) ────────────────────────────────────────────────

export type OrchestrationDepth = 'single' | 'two-tier' | 'full';

// ─── Memory Types (D63/D64) ──────────────────────────────────────────────────

export type MemoryMode = 'none' | 'run' | 'project';

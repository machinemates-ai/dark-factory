# FACTORY_SPEC.md — Dark Factory Constitution

> **NLSpec Level 2 (Spec-Anchored)**: This document IS the single source of truth for Dark Factory's architecture, principles, and invariants. When spec and code disagree, the spec wins — fix either, but decide explicitly. Per-feature behavioral specs live in `*.attractor.md` files.

## 1. Identity

Dark Factory is an **autonomous multi-agent coding orchestrator CLI** that decomposes software engineering tasks into parallel, verifiable work units executed by specialized AI agents. It follows Stafford Beer's **Viable System Model (VSM)** as its architectural foundation, ensuring recursive self-organization at every hierarchy level.

- **Name**: `dark-factory`
- **Binary**: `dark-factory` (via `bin/dark-factory.ts`)
- **License**: MIT
- **Runtime**: Node.js ≥ 24 LTS, TypeScript strict, ESM-only (`"type": "module"`)
- **Zero-framework**: No yargs, no commander, no express, no better-sqlite3. Use `node:util.parseArgs`, `node:sqlite`, `node:child_process`, `node:crypto`.

## 2. Cybernetic Architecture (VSM S1–S5)

Every Dark Factory deployment is a **viable system** — it can survive and adapt without external management.

| VSM System | Function | Component | Recursive in Team Lead? |
|------------|----------|-----------|------------------------|
| **S1** Operations | Do the work | Worker agents (Codex App Server in shared-clones) with specialist dispatch (coder/tester/refactorer/doc-writer) | Workers within team |
| **S2** Coordination | Prevent oscillation | Bus + Context Store + Ledger + Semantic Index + Entropy Monitor | Team-local bus events + sub-Context Store |
| **S3** Control | Resource bargaining | Orchestrator (DAG scheduling, adaptive depth, retry enforcement) | Team Lead schedules its Workers |
| **S3*** Audit | Independent monitoring | Blind Validators + Critic Model (never see implementation context) | Team-level validation before rollup |
| **S4** Intelligence | Environmental scanning | Lead Planner + optional Theory of Mind (reads SPEC.md, codebase, deps → PLAN.md) | Team Lead reads sub-PLAN.md |
| **S5** Policy | Identity, invariants | Constitution (this file + `AGENTS.md` + deontic specs) | Inherited from parent S5 |

**Recursive property**: A Team Lead managing N Workers is itself a viable system. Its S1 = Workers, S3 = Team Lead scheduling, S4 = sub-planning session, S5 = inherited Constitution. Add hierarchy depth, never new mechanisms.

**Diagnostic framework**: When Dark Factory underperforms, map the failure to a VSM system — S1 (wrong code → improve prompts/model/context), S2 (thrashing → improve Context Store/entropy metric), S3 (wasted resources → improve scheduling), S3* (missed defects → improve validation/enable critic), S4 (bad plan → improve scanning/enable ToM), S5 (principle violations → tighten deontic specs).

> *"The purpose of a system is what it does."* — Stafford Beer, POSIWID principle

## 3. Model Tier Strategy (D69)

Not all VSM systems require SOTA models. Each system maps to an optimal cost/capability tier:

| VSM System | Role | Default Tier | Default Model | Rationale |
|------------|------|-------------|---------------|-----------|
| S1 Workers | Code generation | SOTA | `gpt-5.2` (Codex) / `claude-opus-4-6` | Code quality requires frontier reasoning |
| S2 Coordination | Summarization | Fast | `claude-sonnet-4` / `gpt-5-mini` | Structured tasks, sufficient at lower tier |
| S2 Semantic Index | AST parsing | Static | tree-sitter (no LLM) | Deterministic — no LLM needed |
| S3 Orchestrator | Planning / scheduling | SOTA / Static | `claude-opus-4-6` / deterministic | Planning needs reasoning; scheduling is algorithmic |
| S3* Validators | Blind review | Fast | `claude-sonnet-4` | Structured validation sufficient at lower tier |
| S3* Critic L1.5 | Cross-model audit | Fast | Opposite family from worker | Different model family, not frontier |
| S4 Planner | Strategy | SOTA | `claude-opus-4-6` | Complex reasoning for decomposition |
| S4 ToM | Belief tracking | Fast | `claude-sonnet-4` | Structured state tracking |
| S5 Constitution | Policy | Static | Text files (no LLM) | Configuration, not inference |

Configurable via `model_config.tier` on Movements: `'sota'` → frontier, `'fast'` → cost-effective, `'static'` → no LLM.

## 4. Agent Hierarchy

Two-tier hierarchy following Mollick's organizational theory. Spans of control never exceed 7.

```
Lead Planner (Claude SDK V2, S4)
 ├── Team Lead A (Claude SDK V2, S3/S4 for subsystem)
 │    ├── Worker 1 (Codex App Server, S1) — specialist: coder
 │    ├── Worker 2 (Codex App Server, S1) — specialist: tester
 │    └── Worker 3 (Codex App Server, S1) — specialist: refactorer
 ├── Team Lead B ...
 └── Validators (Claude SDK V2, S3*) — blind, never see worker context
```

**Adaptive depth** (D52): Auto complexity model selects orchestration depth:
- `LOC < 500` → single-agent (skip hierarchy)
- `500 ≤ LOC < 5000` → two-tier (Lead → Workers)
- `LOC ≥ 5000` → full three-tier (Lead → Team Leads → Workers)

Override: `--depth single|two-tier|full`

## 5. Provider Architecture

**Principle (D45)**: Provider-native format, no shared behavioral interface. Codex App Server (JSON-RPC/stdio, streaming, thread lifecycle) and Claude Agent SDK V2 (session-based send/stream/resume) have fundamentally different interaction models. Shared data types only via `src/agents/types.ts`.

### 5.1 Codex App Server Agent
- Spawn `codex app-server` as child process via `node:child_process.spawn`
- JSON-RPC over stdio (JSONL)
- Key flows: `thread/start`, `turn/start`, `item/*/delta` streaming, `turn/diff/updated`, `thread/fork`, `thread/compact`
- Deontic injection: persona's obligations/permissions/prohibitions → structured system prompt rules
- Specialist dispatch: per-specialist system prompt templates with scoped tool access

### 5.2 Claude Agent SDK V2
- `unstable_v2_createSession({ model, system, tools })` → persistent session
- `session.send()` / `session.stream()` / `unstable_v2_resumeSession(sessionId)` for crash recovery
- Roles: Planner (S4, SOTA), Reviewer (S3*, fast), Summarizer (S2, fast), Critic (L1.5, fast cross-model)

## 6. Internal Message Bus (D54/D57/D58/D59/D61)

All inter-agent communication flows through the CloudEvents bus. Agents never call each other directly. Every event is persisted to the SQLite `events` table for replay.

### 6.1 Three-Layer Architecture

| Layer | Standard | Implementation |
|-------|----------|---------------|
| Envelope | CloudEvents 1.0 (CNCF) | Zod schema, zero deps |
| Semantics | A2A v1.0 Task lifecycle (7 states) | Typed `TaskResult` + `Artifact[]` |
| Transport | eventemitter3 (<1KB) | Single-process, topic-based routing |

### 6.2 Topics
- `task.{runId}.{status}` — task lifecycle events
- `validation.{taskId}.{gate}` — gate results (L0/L1/L1.5/L2/L3)
- `context.{runId}.updated` — Context Store updates
- `algedonic.{runId}.{severity}` — emergency bypass (warning/critical/fatal)
- `entropy.{runId}.alert` — edit-distance entropy threshold breach

### 6.3 A2A Task Lifecycle (7 states)
```
submitted → working → completed
                    → failed
                    → input-required → working
                    → auth-required → working
                    → canceled
```

### 6.4 Typed Artifacts
Each artifact: `{ name, mimeType, parts: (TextPart | FilePart | DataPart)[] }`
- `TextPart { kind: 'text', text }` — diffs, plans, reviews
- `FilePart { kind: 'file', uri, mimeType }` — patches, generated files
- `DataPart { kind: 'data', data }` — structured JSON (task lists, reports)

### 6.5 Algedonic Loop (D61)
Emergency bypass — highest-priority bus subscriber. Triggers:
1. Cost exceeding `--cost-limit` threshold
2. Security violations (secrets, suspicious patterns)
3. Infinite retry loop (>5 consecutive retries)
4. Satisfaction score collapse (<0.2 × 3 consecutive tasks)
5. Edit-distance entropy spike (>0.85 × 3 consecutive outputs)

Severity: `warning` → log + continue | `critical` → pause + escalate | `fatal` → graceful shutdown

## 7. SQLite Ledger

Four tables using `node:sqlite` `DatabaseSync`. Synchronous writes, single-writer pattern.

- **`runs`**: `id`, `workflow_yaml`, `status`, `created_at`, `completed_at`, `total_tokens`, `total_cost`, `entropy_alerts`
- **`tasks`**: `id`, `run_id`, `movement_name`, `agent_id`, `status`, `depends_on JSON`, `input_hash`, `output_hash`, `thread_id`, `tokens_used`, `memory_refs JSON`, `specialist_type`, `edit_entropy`
- **`events`**: `id`, `task_id`, `event_type`, `payload JSON`, `timestamp` — all bus events persisted here
- **`context_summaries`**: `id`, `run_id`, `scope`, `target_path`, `summary_text`, `token_count`, `promoted_to_project`, `stable_run_count`

## 8. TAKT YAML Workflows

Declarative workflow specification with DAG support. Zod-validated schema:

- **TaktPiece**: metadata, personas, movements, rules, optional `dag` section
- **Persona**: name, model, role (lead/worker/judge/summarizer), permissions, blind, obligations[], permissions[], prohibitions[], specialist type
- **Movement**: name, persona, inputs, outputs, parallel_count, timeout, goal_gate, model_config (with tier), retry config, context_strategy, edges[], type (standard/fan_out/fan_in), critic flag
- **Rule**: gate conditions, failure action, satisfaction_threshold

Built-in workflows: `feature-build.takt.yaml`, `code-review.takt.yaml`, `migration.takt.yaml`, `dag-parallel-build.takt.yaml`

## 9. Context Management

### 9.1 Context Store (D51)
Three-scoped YAML-backed store:
- `global_context` — project-wide constants, seeded from Ring 3 at run start + semantic index overview
- `file_specific_context` — per-file metadata + symbol graph data
- `task_context` — per-task ephemeral state + optional ToM belief state

Append-only within a run. TTL-based expiry across runs. Every task completion triggers a context update.

### 9.2 Context Strategies
- `'full'` — all detail summaries + full Context Store (highest fidelity)
- `'summary'` — module summaries + detail for touched files (balanced)
- `'minimal'` — overview only + global_context (cheapest)
- `'indexed'` — semantic index sub-graph + task_context (most token-efficient for >10K LOC)

### 9.3 Pyramid Summaries (for codebases >5K lines)
Three zoom levels: `overview` (~500 tokens) → `module` (~1K each) → `detail` (~500 each). Stored in `context_summaries` table, invalidated on file change.

## 10. Semantic Codebase Indexer (D70)

tree-sitter WASM → AST extraction → symbol graph (functions, classes, methods, imports → call/extend/implement edges).

Queries: `findCallers`, `findCallees`, `findImplementations`, `getCallChain`, `dependencyFanOut`. Incremental re-index on file change. Supported: TypeScript, Python (v1); Go, Java, Rust (v2).

## 11. Five-Level Verification Gates

Gate progression: L0 → L1 → L1.5 (optional) → L2 → L3. Each gate is a hard prerequisite.

| Gate | Name | Cost | What it checks |
|------|------|------|---------------|
| L0 | Contract | ~0 tokens, ~2s | Zod schema, `tsc --noEmit`, linter, deontic prohibitions, threat detection |
| L1 | Test | ~0 tokens, ~30s | Agent-generated tests (`vitest run`) |
| L1.5 | Critic | ~2K tokens, ~15s | Cross-model audit (different model family than worker). Optional: `--critic` or `critic: true` |
| L2 | Blackbox | ~3K×N tokens, ~45s | Blind validation with satisfaction scoring. Median of N runs, threshold ≥ 0.7 |
| L3 | Satisfaction | Variable | Holdout tests + optional human review. Final score = 0.6 × L2 + 0.4 × holdout |

**SafeOutputs (D66)**: Agent diffs are NEVER auto-applied. They are staged as immutable Artifacts, verified by L0 threat detection, then applied by a separate write step.

## 12. Three-Ring Memory (D63/D64)

```
Ring 1 (Agent/Ephemeral)      Ring 2 (Run/Shared)           Ring 3 (Project/Persistent)
├─ SDK sessions/threads       ├─ SQLite ledger              ├─ A-MEM / Graphiti MCP server
├─ Per-agent working memory   ├─ Context Store              ├─ Cross-run knowledge graph
└─ Lifetime: single task      ├─ Semantic Index             └─ Lifetime: project lifetime
                              └─ Lifetime: single run
```

- **`brief_run()`**: Retrieve Ring 3 memories → seed Context Store global_context
- **`debrief_run()`**: Extract learnings → persist to Ring 3
- **Convergence (D64)**: Reconcile divergent beliefs from parallel workers at run boundaries. Promotes stable summaries (≥3 runs) to Ring 3.
- **Mid-run convergence (D73)**: Triggered by entropy spikes — converge now, don't wait for run end.

CLI flag: `--memory none|run|project` (default: `project`)

## 13. Theory of Mind (D72, Optional)

`--tom` flag enables per-agent belief state tracking:
- Track what each agent knows/assumes about the codebase
- Detect belief conflicts between parallel agents
- Belief-aware task assignment to minimize conflicts
- ~15% planning overhead — justified only for ≥5 concurrent workers

## 14. Edit-Distance Entropy (D73)

Quantitative thrashing detection: $H_{\text{edit}} = 1 - \frac{d(O_i, O_{i+1})}{\max(|O_i|, |O_{i+1}|)}$

If $H_{\text{edit}} < 0.15$ (outputs >85% different each iteration), the agent is thrashing. Triggers mid-run convergence + context reset. Persistent spike → algedonic `critical`.

## 15. Specialist Micro-Agents (D71)

Four specialist types with tailored system prompts and scoped deontic specs:

| Specialist | Obligations | Prohibitions |
|-----------|-------------|-------------|
| **coder** | Write clean code, follow conventions | Skip tests, modify unrelated files |
| **tester** | Achieve coverage, test edge cases | Modify production code |
| **refactorer** | Preserve tests, reduce complexity | Add features, change public APIs |
| **doc-writer** | Document all public APIs, include examples | Modify code files |

Generic worker is the fallback when `specialist` is null.

## 16. Deontic Specifications (D62, MOISE+)

Three deontic arrays on each Persona: `obligations[]`, `permissions[]`, `prohibitions[]`.

Enforcement is dual:
1. **Soft**: Injected into agent system prompts as structured rules
2. **Hard**: L0 Contract Gate validates prohibition violations structurally

## 17. CLI Commands

```
dark-factory plan <spec.md>
dark-factory run <workflow.yaml> [--spec] [--depth] [--cost-limit] [--memory] [--tom] [--critic]
dark-factory run --resume <run-id>
dark-factory validate <run-id>
dark-factory status [run-id]
dark-factory replay <run-id>
dark-factory index [path]
dark-factory memory search <query>
dark-factory memory stats
```

## 18. Security Invariants

1. Agent diffs are **never auto-applied** (SafeOutputs D66)
2. Shared-clones are **disposable** — delete on crash or failure
3. L0 Contract Gate scans **every diff** for secrets and suspicious patterns
4. Algedonic loop **preempts** all other handlers on catastrophic failure
5. Deontic prohibitions are checked **structurally** at L0, not just via prompts

## 19. Benchmarks (D68)

| Benchmark | Target | Rationale |
|-----------|--------|-----------|
| SWE-bench Verified (10–20 tasks) | ≥ 75% | Match/exceed unscaffolded single-agent SOTA |
| CodeClash (multi-round Elo) | ≥ 1435 | Surpass all single-model baselines |
| Holdout E2E (GAIA-inspired) | ≥ 0.7 satisfaction | Blind validators pass with aggregate score |

## 20. Project Structure

```
bin/dark-factory.ts                   CLI entry (node:util.parseArgs)
src/cli/                              Commands: plan, run, validate, resume, status, memory, index, replay
src/orchestrator/engine.ts            Core engine, TAKT scheduler, crash recovery
src/orchestrator/complexity.ts        Adaptive depth (LOC + dep-graph + churn)
src/agents/types.ts                   Shared data types (AgentResult, TaskAssignment)
src/agents/codex-agent.ts             Codex App Server (JSON-RPC/stdio)
src/agents/claude-agent.ts            Claude Agent SDK V2 sessions
src/agents/pool.ts                    Agent pool manager
src/agents/specialists.ts             Specialist micro-agent dispatch
src/workflow/schema.ts                Zod schemas for TAKT YAML
src/workflow/parser.ts                YAML parser + DAG validation
src/ledger/migrations.ts              SQLite schema + migrations
src/ledger/queries.ts                 Typed ledger queries
src/validator/contract.ts             L0 Contract Gate
src/validator/test.ts                 L1 Test Gate
src/validator/critic.ts               L1.5 Critic Gate
src/validator/blackbox.ts             L2 Blackbox Gate
src/validator/satisfaction.ts          L3 Satisfaction Gate
src/context/store.ts                  Context Store (YAML-backed, 3 scopes)
src/context/pyramid.ts                Pyramid Summary generator
src/index/parser.ts                   tree-sitter AST extraction
src/index/graph.ts                    Symbol graph store
src/index/query.ts                    Semantic queries
src/index/incremental.ts              Incremental re-index
src/bridge/bus.ts                     eventemitter3 typed topic routing
src/bridge/envelope.ts                CloudEvents Zod schema
src/bridge/task-result.ts             A2A TaskResult + Artifacts
src/bridge/topics.ts                  Topic constants + helpers
src/bridge/algedonic.ts               Algedonic loop
src/memory/project-store.ts           Ring 3 MCP client
src/memory/brief.ts                   brief_run()
src/memory/debrief.ts                 debrief_run()
src/memory/convergence.ts             Convergence agent
src/memory/types.ts                   Memory types
src/tom/belief-tracker.ts             Per-agent belief states
src/tom/conflict-detector.ts          Belief conflict detection
src/tom/planner-integration.ts        ToM → S4 Planner integration
src/mcp/bridge.ts                     FastMCP external bridge
src/git/shared-clone.ts               git clone --shared lifecycle
tests/unit/                           Tier 1 — Vitest unit tests
tests/integration/                    Tier 2 — Integration + SWE-bench subset
tests/holdout/                        Tier 3 — .gitignored E2E + CodeClash
workflows/                            Built-in TAKT YAML workflows
```

# Dark Factory — AGENTS.md

> Comprehensive guide for AI agents operating within this codebase.

---

## 1. Project Identity

**Dark Factory** is an autonomous multi-agent coding orchestrator that coordinates
Codex App Server and Claude Agent SDK agents through a bus-driven architecture
inspired by the Viable System Model (VSM).

- **CLI**: `dark-factory <command>`
- **Runtime**: Node.js ≥ 24 LTS, TypeScript strict, ESM-only
- **Zero-framework**: `node:util.parseArgs` (no yargs), `node:sqlite` (no better-sqlite3), `eventemitter3` (no express)

## 2. Architecture — VSM Mapping

```
S5 (Identity)    → SPEC.md + FACTORY_SPEC.md — normative purpose
S4 (Intelligence)→ Lead Planner (Claude Opus) — task decomposition
S3 (Control)     → Orchestrator Engine — resource bargaining, scheduling
S3* (Audit)      → 5-level verification gates — quality assurance
S2 (Coordination)→ Event Bus (eventemitter3) — anti-oscillation signaling
S1 (Operations)  → Codex App Server workers — actual code generation
```

### Algedonic Loop
```
info → continue | warning → pause_new_tasks | error → abort_task
critical → abort_run | fatal → emergency_shutdown
```

## 3. Key Directories

```
bin/              CLI entry point (dark-factory.ts)
src/
  agents/         Agent types, specialists, codex-agent, claude-agent, pool
  bridge/         Event bus, CloudEvents envelope, A2A task-result, algedonic
  cli/commands/   plan, run, validate, status, replay, index, memory
  context/        Context store (3 scopes), pyramid summaries
  git/            Shared-clone lifecycle
  index/          Semantic index — tree-sitter parser, symbol graph, query
  ledger/         SQLite ledger — migrations, typed queries
  mcp/            FastMCP bridge for external integration
  memory/         Three-Ring Memory (run/session/project)
  orchestrator/   Engine, adaptive complexity
  tom/            Theory of Mind — belief tracker, conflict detector
  validator/      L0 contract, L1 test, L1.5 critic, L2 blackbox, L3 satisfaction
  workflow/       TAKT YAML schema (Zod), DAG parser (Kahn's algorithm)
workflows/        Example TAKT YAML workflow definitions
```

## 4. Model Tier Strategy (D69)

| Tier    | Model                | Use                                  |
|---------|---------------------|--------------------------------------|
| `sota`  | claude-opus-4-6  | S4 planner, S3* critic, convergence |
| `fast`  | claude-sonnet-4  | Context summaries, memory queries   |
| `static`| *(none)*            | Regex validators, deterministic ops  |

Workers use **Codex App Server** (codex-1) — not Claude.

## 5. Workflow — TAKT YAML

Workflows are defined in `.takt.yaml` files following the `TaktPiece` schema:

```yaml
name: example
version: "1.0"
goal: "Implement feature X"
personas:
  - name: alice
    role: coder
    specialist: coder
    obligations: ["Write tests for all public functions"]
    prohibitions: ["Never modify files outside src/"]
movements:
  - name: implement
    goal: "Write the implementation"
    goal_gate: 0.7
    assigned_to: alice
    type: code
    model_config:
      tier: fast
      max_tokens: 30000
    retry:
      max_attempts: 3
      backoff: exponential
rules:
  satisfaction_threshold: 0.75
```

### Movement Types
- `code` — generate/modify source code
- `test` — write tests
- `review` — code review
- `refactor` — restructure code
- `document` — write documentation

### DAG Edges
Movements can declare `edges: [{ from: "plan", to: "implement" }]` for dependency ordering.
The parser validates DAG acyclicity via topological sort.

## 6. Deontic Specifications

Every persona carries **obligations**, **permissions**, and **prohibitions** injected into
the agent system prompt. These are normative constraints, not suggestions.

Example:
```yaml
obligations:
  - "Run tests after every code change"
  - "Include type annotations"
permissions:
  - "May create new files in src/"
prohibitions:
  - "Never modify test fixtures"
  - "Never commit secrets"
```

## 7. Verification Gates

| Level | Gate          | Description                                    |
|-------|--------------|------------------------------------------------|
| L0    | Contract     | Regex-based threat scan (secrets, eval, exec)  |
| L1    | Test         | Run project test suite                         |
| L1.5  | Critic       | LLM review of changes (optional, `--critic`)   |
| L2    | Blackbox     | Holdout benchmark (median score)               |
| L3    | Satisfaction | Final: 0.6×L2 + 0.4×holdout — threshold gate |

## 8. Three-Ring Memory

| Ring | Scope   | Lifetime        | Storage          |
|------|---------|-----------------|------------------|
| 1    | Run     | Single run      | Context store    |
| 2    | Session | CLI session     | Context summaries|
| 3    | Project | Cross-session   | Project store    |

- `briefRun()` seeds context from Ring 3 at run start
- `debriefRun()` persists learnings to Ring 3 at run end
- `runConvergence()` reconciles parallel worker beliefs

## 9. Event Bus

Internal communication uses `eventemitter3` with CloudEvents envelope (RFC 8927).  
Topics follow the pattern: `dark-factory.{domain}.{action}`. Event types:

- `task.assigned`, `task.completed`, `task.failed`
- `validation.passed`, `validation.failed`
- `context.updated`, `context.requested`
- `algedonic.{severity}`
- `entropy.alert`, `entropy.resolved`

## 10. Semantic Index

Tree-sitter based symbol graph for codebase understanding:
- Languages: TypeScript, Python
- Symbols: functions, classes, interfaces, methods, variables
- Edges: calls, implements, imports, exports, type_reference
- Query: callers, callees, implementations, 2-hop neighborhood
- `dependencyFanOut()` metric for complexity estimation

## 11. Security Invariants

1. **L0 scans every artifact** — no exceptions
2. **Secrets never reach the ledger** — strip before storage
3. **git clone --shared** — per-agent isolation, diffs as artifacts
4. **SafeOutputs (D66)** — diffs are staged, never auto-applied
5. **Cost limits** — `--cost-limit` aborts run on budget exceed

## 12. CLI Commands

```bash
dark-factory plan --spec SPEC.md        # Generate PLAN.md
dark-factory run --workflow file.takt.yaml --spec SPEC.md
dark-factory run --workflow file.takt.yaml --depth full --tom --critic
dark-factory validate --run-id <id>     # Re-run gates
dark-factory status --run-id <id>       # Query ledger
dark-factory status                     # List recent runs
dark-factory replay --run-id <id>       # Replay bus events
dark-factory index                      # Build semantic index
dark-factory memory                     # Memory stats
```

## 13. Development

```bash
npm install
npm run build          # tsc
npm run dev            # tsx watch
npm test               # vitest run
npm run test:coverage  # vitest --coverage
```

## 14. Conventions

- **All imports use `.js` extension** (ESM)
- **Zod for all runtime validation** — schema-first
- **Interfaces over classes** — except SymbolGraph and BeliefTracker
- **`readonly` by default** — mutable only when necessary
- **No `any`** — use `unknown` + type narrowing
- **UUID generation**: `crypto.randomUUID()`
- **Errors**: thrown as typed objects, never strings

## 15. Decisions Reference

See `FACTORY_SPEC.md` for the complete NLSpec constitution.
Key decisions are numbered D35–D75 in the plan.

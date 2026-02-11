# Dark Factory

> Autonomous multi-agent coding orchestrator — VSM-inspired bus architecture coordinating Codex App Server and Claude Agent SDK agents.

## Quick Start

```bash
npm install
npm run build

# Run a workflow
dark-factory run --workflow workflows/feature-build.takt.yaml --spec SPEC.md

# Build semantic index
dark-factory index

# Check run status
dark-factory status --run-id <id>
```

## Architecture

Dark Factory implements the **Viable System Model (VSM)** for software production:

| VSM Level | Component | Role |
|-----------|-----------|------|
| S5 Identity | SPEC.md | Normative purpose |
| S4 Intelligence | Lead Planner (Claude) | Task decomposition |
| S3 Control | Orchestrator Engine | Resource scheduling |
| S3* Audit | 5-level gates | Quality assurance |
| S2 Coordination | Event Bus | Anti-oscillation |
| S1 Operations | Codex workers | Code generation |

## Workflows

Define TAKT YAML workflows with personas, movements, and DAG edges:

```yaml
name: feature-build
personas:
  - name: coder
    role: coder
    specialist: coder
    obligations: ["Write tests for all public functions"]
movements:
  - name: implement
    goal: "Write the feature code"
    assigned_to: coder
    type: code
```

See [`workflows/`](workflows/) for examples.

## Documentation

- [FACTORY_SPEC.md](FACTORY_SPEC.md) — Complete NLSpec constitution
- [AGENTS.md](AGENTS.md) — Guide for AI agents operating in this codebase

## License

MIT — MachineMates AI 2026
Autonomous multi-agent coding orchestrator CLI — Codex App Server + Claude Agent SDK V2, blind validators with satisfaction scoring, DAG-aware TAKT YAML workflows, CloudEvents + A2A bus, Three-Ring Memory, Semantic Codebase Indexer, node:sqlite ledger. Recursive Viable System Model (Beer) with deontic role specs.

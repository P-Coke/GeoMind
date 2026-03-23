# ADR 0002: Execution Planner Is a Separate Layer

## Status

Accepted

## Decision

`ExecutionPlanner` is a dedicated layer between `WorkflowSpec` and compiler/provider execution.

## Consequences

- Workflow stays semantic
- Provider selection is centralized
- Execution detail becomes testable through plan fixtures


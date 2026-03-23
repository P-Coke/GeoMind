# ADR 0004: Compiled Script Is Not Source of Truth

## Status

Accepted

## Decision

Compiled scripts are derived artifacts. `WorkflowSpec` and `ExecutionPlan` remain authoritative.

## Consequences

- Script editing is an override layer only
- Run records must persist workflow and plan snapshots
- AI and UI must not bypass workflow/schema contracts


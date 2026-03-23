# ADR 0001: WorkflowSpec Is a Semantic DAG

## Status

Accepted

## Decision

`WorkflowSpec` represents semantic intent only and must remain a DAG with explicit `inputs` and `outputs`.

## Consequences

- No hidden shared state between steps
- No provider-specific execution semantics inside workflow steps
- Validator enforces DAG integrity and explicit references


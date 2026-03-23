# Contributing Guide

## Development Expectations

GeoMind is a multi-person project. Keep changes easy to review and easy to evolve.

## Required Practices

- Keep workflow semantics in `WorkflowSpec`
- Keep execution detail in planner/compiler/providers
- Do not add engine-specific behavior into the UI layer
- Do not add feature-specific step ops when a generic op can express the same thing
- Update docs with code changes

## Pull Request Checklist

- Code builds and tests pass
- If workflow schema changed, `docs/workflow-schema.md` was updated
- If API changed, `docs/backend-api.md` was updated
- If user interaction changed, `docs/frontend-ux.md` was updated
- New terms and names are consistent with existing docs

## Review Priorities

Reviewers should prioritize:

- schema stability
- API stability
- workflow semantics
- planner correctness
- provider decoupling
- regressions in manual toolbox flow

## What To Avoid

- adding hidden state between steps
- introducing a second workflow representation
- hard-binding workflows to GEE internals
- making AI a hard dependency for normal use


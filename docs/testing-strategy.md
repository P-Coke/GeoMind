# Testing Strategy

GeoMind uses four testing layers:

1. `Fixture/schema/core tests`
   Validate workflow semantics, planner output, and compiler output.
2. `API smoke tests`
   Verify resource routes and end-to-end compile/run flows.
3. `Provider tests`
   Verify local metadata inspection and provider adapters.
4. `UI smoke tests`
   Use Playwright to exercise the toolbox/wizard and AI Accelerator basics.

## Fixtures

- `backend/tests/fixtures/workflows`
- `backend/tests/fixtures/plans`
- `backend/tests/fixtures/scripts`

Any new operation or schema change must add or update fixtures.

## Golden Rules

- Compare structured execution plans directly
- Compare scripts using stable fragments or normalized output
- Do not include unstable ids or timestamps in golden assertions


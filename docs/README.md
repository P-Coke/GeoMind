# GeoMind Docs

This directory contains the working design and development documentation for GeoMind.

Start here:

- [Project Overview](./project-overview.md)
- [Architecture](./architecture.md)
- [Workflow Schema](./workflow-schema.md)
- [Backend API](./backend-api.md)
- [Backend Module Boundaries](./backend-module-boundaries.md)
- [Frontend UX Rules](./frontend-ux.md)
- [Development Guide](./development-guide.md)
- [Contributing Guide](./contributing.md)
- [Testing Strategy](./testing-strategy.md)
- [Roadmap](./roadmap.md)

Documentation rules:

- If a change alters `WorkflowSpec`, `ExecutionPlan`, API contracts, or UI interaction rules, update docs in the same change.
- Prefer additive schema evolution over breaking changes.
- Treat `workflow-schema.md` as the source of truth for workflow semantics.

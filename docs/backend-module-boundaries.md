# Backend Module Boundaries

## Core

- `core/models.py`
  Domain models and shared contracts
- `core/validator.py`
  Workflow DAG validation and diagnostics
- `core/planner.py`
  Workflow to execution-plan expansion
- `core/compiler`
  Execution-plan to script compilation
- `core/registries.py`
  Stable op registry and constraints

## Services

- `project_service`
  Project CRUD orchestration
- `template_service`
  Template CRUD orchestration
- `workflow_service`
  Workflow validate/compile orchestration
- `run_service`
  Run creation and snapshot persistence
- `ai_service`
  AI structured workflow and template draft generation

## Providers

- `gee_provider`
  Remote execution adapter
- `local_python_provider`
  Local file inspection adapter

## API

- Routes should only map requests to services
- Routes must not implement workflow semantics directly


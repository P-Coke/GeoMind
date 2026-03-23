# Architecture

## High-Level Layers

GeoMind V1 is organized into these layers:

1. `Presentation Layer`
   Electron + React desktop application
2. `AI Orchestrator`
   Suggests workflows, drafts templates, explains scripts
3. `Workflow / Template Core`
   Defines semantic workflows and templates
4. `Execution Planner`
   Expands semantic workflows into executable plans
5. `Compiler`
   Compiles execution plans into provider-specific code
6. `Capability / Provider Layer`
   Executes GEE or local-python capabilities

## Runtime Flow

User intent or wizard input:

`Toolbox/Wizard or AI -> WorkflowSpec -> ExecutionPlan -> CompiledScript -> RunRecord`

Important separation:

- `WorkflowSpec` describes logical intent
- `ExecutionPlan` describes execution steps and provider choices
- `CompiledScript` is implementation output, not system truth

## Current Repository Structure

- `backend/backend/app/models.py`
  Shared backend data models
- `backend/backend/app/validator.py`
  Workflow DAG validation
- `backend/backend/app/planner.py`
  Workflow to execution plan expansion
- `backend/backend/app/compiler.py`
  Execution plan to GEE script compilation
- `backend/backend/app/providers.py`
  Provider abstractions and stubs
- `backend/backend/app/services.py`
  Application service layer
- `backend/backend/app/main.py`
  FastAPI API surface
- `desktop/src/App.tsx`
  Current toolbox/wizard UI shell

## Design Constraints

- UI must not encode workflow execution logic
- AI must not bypass `WorkflowSpec`
- Providers must not redefine workflow semantics
- Planner must be the only layer selecting provider-specific execution actions
- Script editing is allowed, but script text is not the source of truth


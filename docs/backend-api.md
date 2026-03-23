# Backend API

## Purpose

The backend API is the stable integration surface for:

- Desktop UI
- Future Web UI
- CLI
- Future MCP server
- External agent control

## Rules

- API payloads must use structured workflow objects
- Do not require raw script text as the primary input
- Keep endpoints UI-independent
- Prefer additive evolution

## Current Endpoints

### Auth

- `GET /auth/gee/status`
- `POST /auth/gee/login/browser/start`
- `POST /auth/gee/login/browser/complete`
- `POST /auth/gee/login/service-account`
- `POST /auth/gee/validate`
- `POST /auth/gee/logout`

### Catalog

- `GET /datasets/catalog`

### Projects

- `POST /projects`
- `GET /projects`
- `GET /projects/{project_id}`
- `PUT /projects/{project_id}`

### Templates

- `POST /templates`
- `GET /templates`
- `GET /templates/{template_id}`

### Workflows

- `POST /workflows`
- `GET /workflows/{workflow_id}`
- `PUT /workflows/{workflow_id}`
- `POST /workflows/{workflow_id}/validate`
- `POST /workflows/{workflow_id}/compile`
- `POST /workflows/{workflow_id}/run`

### AI

- `POST /ai/workflow/suggest`
- `POST /ai/template/draft`
- `POST /ai/script/explain`

### Runs

- `GET /runs/{run_id}`
- `GET /runs/{run_id}/logs`
- `GET /runs/{run_id}/artifacts`

## Contract Guidance

- `validate` returns `valid + diagnostics`
- `compile` returns `workflow + plan + script + diagnostics + explanation`
- `run` returns `run + snapshotRefs`
- `suggest` returns a structured workflow, not free-form code
- `template draft` returns a draft template, not a compiled script

## Future Additions

Expected future API capabilities:

- workflow import/export
- template versioning
- local file inspection endpoints
- MCP-oriented tool/resource wrappers

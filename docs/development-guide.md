# Development Guide

## Environment

Current assumptions:

- Windows development environment
- Node.js 24+
- Python 3.12+
- Dependencies available through Scoop-managed toolchains
- Backend virtual environment is fixed at `backend/.venv`

## Install

Frontend:

```bash
npm install
```

Backend:

```bash
pip install -e ./backend[dev]
```

Preferred backend bootstrap:

```powershell
.\backend\scripts\bootstrap.ps1
```

## Run

Backend:

```bash
npm run dev:backend
```

Preferred backend start:

```powershell
.\backend\scripts\dev.ps1
```

Desktop app:

```bash
npm run dev
```

Production frontend build:

```bash
npm run build
```

Backend tests:

```bash
python -m pytest
```

Preferred backend tests:

```powershell
.\backend\scripts\test.ps1
```

UI smoke tests:

```bash
npm run test:ui
```

## Current Dev Workflow

1. Update core models if the feature changes workflow behavior
2. Update validator/planner/compiler if semantics or execution mapping change
3. Update API if UI or integrations need new capabilities
4. Update desktop UI
5. Update docs in the same change
6. Run tests and build

## GeoMind Skill

If you use Codex locally, the `geomind-development` skill should be applied when touching core GeoMind architecture or interaction rules.

The skill encodes the current source-of-truth rules for:

- semantic `WorkflowSpec` design
- planner/compiler/provider boundaries
- toolbox/wizard-first UX
- fixture/golden/API/UI regression priorities

## Earth Engine Auth

Current login modes:

- `browser_oauth`
- `service_account`

Rules:

- backend owns auth state and validation
- frontend only triggers auth actions and reads status
- providers consume auth status, they do not implement login flows
- browser login is scaffolded for V1 and intentionally separate from full OAuth token exchange

## Current Limitations

- GEE execution is still stubbed in the provider
- Script editor is a textarea, not Monaco yet
- Current project system is minimal
- MCP server is not implemented yet

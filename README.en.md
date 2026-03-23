# GeoMind

[中文](./README.md)

GeoMind is an AI-driven desktop client for Google Earth Engine. The project combines assets, scripts, tasks, and a map-first workspace into a local application so users can start with parameterized tools and gradually move toward AI-assisted script generation and execution.

The repository is currently in an early demo stage. The goal right now is to validate the desktop workspace, GEE connectivity, ROI/layer interaction, AI draft generation, and run flow rather than present a production-ready release.

![GeoMind Workspace Hero](./docs/assets/geomind-workspace-hero.png)

## Highlights

- `Desktop workspace`: a Win10-style multi-panel layout centered around the map, layers, parameters, AI, and logs.
- `Earth Engine connectivity`: browser-login scaffolding plus service-account mode for later real execution flows.
- `Tool / template workflows`: template-script-driven tools for common remote-sensing tasks.
- `AI Accelerator`: configurable API key support for generating structured linear workflow drafts and script units.
- `Local assets and layers`: ROI upload, layer tree management, and run artifacts pushed back to the map and history.

## Current Status

GeoMind should currently be understood as an `AI-driven Earth Engine desktop demo`:

- Available now: desktop UI shell, project/run pages, basic GEE auth flows, ROI upload, template tools, AI draft generation, run history, and demo-ready screenshots.
- In progress: asset management, script-first workflows, real GEE task execution, result recovery, and a stronger task center.
- Not finished yet: full OAuth completion, mature asset ingestion, packaged releases, and production-grade stability.

## Screenshots

### Workspace

![GeoMind Workspace](./docs/assets/geomind-workspace.png)

### Assets and Layers

![GeoMind Assets and Layers](./docs/assets/geomind-assets-layers.png)

### AI Assistant

![GeoMind AI Assistant](./docs/assets/geomind-ai-panel.png)

## Architecture

GeoMind currently uses a local desktop architecture with a split frontend/backend model:

- `desktop/`: Electron + React + TypeScript for the desktop shell, map workspace, multi-page UI, and local desktop integration.
- `backend/`: FastAPI + Python for auth, workflow orchestration, AI config, run history, SQLite persistence, and local processing helpers.
- `shared workflow core`: the current backbone is `WorkflowSpec -> ExecutionPlan -> Run -> Artifact`, while the product is gradually evolving toward an `Assets / Scripts / Tasks / AI` model.

See [docs/README.md](./docs/README.md) for more design documentation.

## Quick Start

### Requirements

- Windows
- Node.js 24+
- Python 3.12+

### Install dependencies

Frontend:

```powershell
npm install
```

Backend:

```powershell
.\backend\scripts\bootstrap.ps1
```

### Run the development environment

Start the backend:

```powershell
.\backend\scripts\dev.ps1
```

Start the renderer:

```powershell
npm run dev:renderer -- --host 127.0.0.1
```

Start the Electron shell:

```powershell
npm run dev:electron
```

Or run renderer + Electron together:

```powershell
npm run dev
```

## Development Commands

Build the frontend:

```powershell
npm run build
```

Run backend tests:

```powershell
.\backend\scripts\test.ps1
```

Run UI smoke tests:

```powershell
npm run test:ui
```

## Repository Layout

```text
backend/   FastAPI backend, workflow core, providers, storage
desktop/   Electron + React desktop client
docs/      architecture, workflow, contribution, and roadmap docs
tests/     Playwright UI smoke tests
```

## Roadmap

- `V0.1`: desktop workspace, workflow backbone, auth scaffolding, AI drafts, basic run flow
- `V0.2`: stronger project management, template library, real GEE execution, script editing, and resource management
- `V0.3+`: MCP/CLI, more local processing, script-first capabilities, and hybrid execution policies

See [docs/roadmap.md](./docs/roadmap.md) for the detailed roadmap.

## Documentation

- [Docs Overview](./docs/README.md)
- [Architecture](./docs/architecture.md)
- [Workflow Schema](./docs/workflow-schema.md)
- [Backend API](./docs/backend-api.md)
- [Development Guide](./docs/development-guide.md)

## License

This project is released under the [MIT License](./LICENSE).

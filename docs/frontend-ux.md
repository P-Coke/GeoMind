# Frontend UX Rules

## Primary UX Direction

V1 should feel like a traditional GIS desktop application.

Primary interaction:

- toolbox
- wizard
- parameter panel
- result/log panel

AI is a secondary acceleration layer.

Current shell direction:

- multi-page desktop layout
- default landing page is `Workspace`
- QGIS-like panel layout inside the workspace
- bilingual UI (`zh-CN`, `en-US`)
- toolbox is rendered from a registry, not hardcoded in page layout
- no page-level scrolling; only local panel scrolling
- docking-style left/right/bottom work areas
- desktop visual language should follow Win10 tools, not web-card dashboards

## Mandatory Rules

### 1. Toolbox/Wizard is the main entry

The main user path should be:

- choose a tool or template
- fill parameters
- review workflow
- compile
- run
- inspect results

Chat must not be the only way to use GeoMind.

### 2. AI is assistive

AI should be used to:

- recommend an initial flow
- fill parameters
- explain tool choices
- draft reusable templates

AI should not replace the basic toolbox mental model.

### 3. The UI must expose workflow structure

Users should be able to inspect:

- step sequence
- step outputs
- execution plan
- compiled script

This is required for trust and debugging.

### 4. Do not make node graphs the primary interaction in V1

A graph editor may come later, but V1 should keep a simpler workflow mental model for traditional GIS users.

### 5. Terms should stay consistent

Use these terms in UI:

- `Toolbox`
- `Wizard`
- `Workflow`
- `Execution Plan`
- `Template`
- `AI Accelerator`

Avoid mixing in inconsistent naming for the same concepts.

### 6. Map-first and compliance-first

- Do not use default basemaps that foreground administrative boundaries
- Basemap choices must remain visually neutral
- Earth Engine layers are first-class map layers, not the generic basemap

### 7. Desktop UI constraints

- The app shell should occupy the full desktop window height
- Layout must be splitter-based or fixed-dock-based, not content-flow-based
- Layers are a first-class panel, not an inline status list
- Toolbox must support collapsible categories and search

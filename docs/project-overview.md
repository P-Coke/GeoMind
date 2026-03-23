# Project Overview

## Product Definition

GeoMind is an AI-driven Earth Engine desktop workbench for Windows.

V1 has two equally important entry modes:

- `Toolbox/Wizard mode`
  Traditional GIS users complete tasks through tool categories, parameter panels, and step-by-step execution.
- `AI Accelerator mode`
  AI suggests workflows, fills parameters, drafts templates, and explains execution decisions.

Both modes must resolve into the same structured workflow model. There must never be a separate "AI-only pipeline".

## V1 Goals

- Support simple remote sensing workflows without requiring programming
- Keep AI as an accelerator, not the only interface
- Establish a stable workflow/template/planner core for future MCP, CLI, and agent control
- Keep providers replaceable so the system is not permanently locked to GEE

## Primary Users

- Traditional GIS users who prefer toolbox and wizard interfaces
- Researchers who understand analysis goals but do not want to write GEE code
- Advanced users who want visible scripts and future automation hooks

## Core Principles

- Interaction should feel closer to ArcGIS/QGIS than to a chat-first app
- The workflow engine is the product core, not the desktop shell
- `WorkflowSpec` is semantic and stable
- `ExecutionPlan` contains execution detail
- Compiler and providers are replaceable implementation layers
- AI is additive, never a separate architecture


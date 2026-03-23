# Workflow Schema

## Why This Schema Matters

`WorkflowSpec` is the most sensitive design object in GeoMind. It is used by:

- Frontend wizard flows
- AI workflow generation
- Template instantiation
- Planner expansion
- Compiler input
- API contracts
- Future MCP and CLI integrations

If this schema drifts or becomes too implementation-specific, the system will be hard to evolve.

## Core Rules

### 1. WorkflowSpec is semantic, not executable

`WorkflowSpec` must describe logical operations only.

Good:

- `input`
- `filter`
- `temporal_reduce`
- `index`
- `band_math`
- `region_stats`
- `export`

Bad:

- `ndvi_step`
- `gee_mask_cloud_step`
- `rasterio_reduce_step`

Execution details belong in planner, compiler, and providers.

### 2. WorkflowSpec is a DAG

Every step must explicitly consume named outputs from upstream steps.

There must be:

- no hidden global state
- no implicit map/image variables
- no cross-step mutation

Each step only communicates through:

- `inputs`
- `outputs`

### 3. Step operations must remain small and generic

Do not create a new operation for every algorithm or index.

Use:

- `index` with `params.indexType`
- `band_math` with `params.expression`
- `temporal_reduce` with `params.reducer`
- `region_stats` with `params.reducer`

### 4. WorkflowSpec must not hard-bind providers

Provider choice is not part of semantic workflow design.

The planner selects providers based on:

- source type
- data locality
- engine capability
- future optimization rules

### 5. Schema changes should be additive

Once fields are used by UI, AI, and APIs, avoid destructive changes.

Preferred evolution:

- add new optional fields
- add new operations carefully
- version the schema

Avoid:

- renaming existing fields casually
- changing meaning of existing fields
- overloading a field with engine-specific behavior

## Current Model

### WorkflowSpec

- `id`
- `projectId`
- `name`
- `steps`
- `bindings`
- `sourceTemplateId`
- `status`
- `schemaVersion`

### WorkflowStep

- `id`
- `name`
- `op`
- `params`
- `inputs`
- `outputs`
- `executionHints`
- `validationState`

### StepOutput

- `name`
- `dataType`
- `description`

## Stable Data Types

Current canonical data types:

- `Image`
- `ImageCollection`
- `Feature`
- `FeatureCollection`
- `Table`
- `Raster`
- `File`
- `Scalar`

Any new data type must be documented before use.

## Example

```json
{
  "id": "workflow_x",
  "projectId": "project_x",
  "name": "NDVI Quick Analysis",
  "schemaVersion": "1.0.0",
  "status": "draft",
  "bindings": {
    "datasetId": "COPERNICUS/S2_SR_HARMONIZED",
    "indexType": "NDVI"
  },
  "steps": [
    {
      "id": "roi-input",
      "name": "ROI Input",
      "op": "input",
      "params": {
        "sourceType": "drawn_roi",
        "geometry": "{...}"
      },
      "inputs": [],
      "outputs": [
        { "name": "roi", "dataType": "FeatureCollection", "description": "" }
      ],
      "executionHints": {},
      "validationState": { "valid": true, "errors": [] }
    },
    {
      "id": "dataset-input",
      "name": "Dataset Input",
      "op": "input",
      "params": {
        "sourceType": "gee_collection",
        "datasetId": "COPERNICUS/S2_SR_HARMONIZED"
      },
      "inputs": [],
      "outputs": [
        { "name": "imagery", "dataType": "ImageCollection", "description": "" }
      ],
      "executionHints": {},
      "validationState": { "valid": true, "errors": [] }
    }
  ]
}
```

## Ownership Rules

- Any PR changing `WorkflowSpec`, `WorkflowStep`, `ExecutionPlan`, or data types must update this document.
- No feature should introduce a second workflow representation without explicit approval.

